/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author  TCSASSEMBLER
 */
'use strict';
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/marathonRegInfo/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Marathon Match Challenge Reg Info API', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow

    var heffan = testHelper.generateAuthHeader({ sub: 'ad|132456' }),
        member1 = testHelper.generateAuthHeader({ sub: 'ad|132457' }),
        member2 = testHelper.generateAuthHeader({ sub: 'ad|132458' }),
        member3 = testHelper.generateAuthHeader({ sub: 'ad|124764' }),
        member4 = testHelper.generateAuthHeader({ sub: 'ad|124772' }),
        member5 = testHelper.generateAuthHeader({ sub: 'ad|124766' }),
        forbiddenUser = testHelper.generateAuthHeader({ sub: 'ad|300001' }),
        unActivatedUser = testHelper.generateAuthHeader({ sub: 'ad|300002' }),
        notExistedUser = testHelper.generateAuthHeader({ sub: 'ad|1234567890' }),
        iranUser = testHelper.generateAuthHeader({ sub: 'ad|300003' });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__clean', 'informixoltp', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'common_oltp__clean', 'common_oltp', cb);
            }
        ], done);
    }

    /**
     * This function is run before all tests.
     * Generate tests data.
     * @param {Function<err>} done the callback
     */
    before(function (done) {
        async.waterfall([
            clearDb,
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'common_oltp__insert_test_data', 'common_oltp', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__insert_test_data', 'informixoltp', cb);
            },
            function (cb) {
                testHelper.updateTextColumn('update round_terms set terms_content = ? where round_id IN (2001, 2006)', 'informixoltp', [{type: 'text', value : 'Marathon Match terms content'}], cb);
            }
        ], done);
    });

    /**
     * This function is run after all tests.
     * Clean up all data.
     * @param {Function<err>} done the callback
     */
    after(function (done) {
        clearDb(done);
    });

    /**
     * Create a http request.
     * @param {String} roundId - the request roundId.
     * @param {Object} authHeader - the auth header for request.
     */
    function createRequest(roundId, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/data/marathon/challenges/' + roundId + '/regInfo')
            .set('Accept', 'application/json');
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        return req.expect('Content-Type', /json/);
    }

    /**
     * Helper method for validating marathon match register information
     *
     * @param {String} roundId - the request roundId.
     * @param {Object} authHeader - the auth header for request.
     * @param {String} expectFile - the expect file path
     * @param {Function} done - the callback function
     */
    function validateResult(roundId, authHeader, expectFile, done) {
        createRequest(roundId, authHeader).expect(200).end(function (err, res) {
            if (err) {
                done(err);
                return;
            }
            var expected = require(expectFile);
            delete res.body.serverInformation;
            delete res.body.requesterInformation;
            assert.deepEqual(res.body, expected, "Invalid response");
            done();
        });
    }

    /**
     * Assert error request.
     *
     * @param {String} roundId - the request roundId.
     * @param {Object} authHeader - the auth header for request.
     * @param {Number} statusCode - the expected status code
     * @param {String} errorDetail - the error detail.
     * @param {Function} done the callback function
     */
    function assertError(roundId, authHeader, statusCode, errorDetail, done) {
        createRequest(roundId, authHeader).expect(statusCode).end(function (err, res) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(res.body.error.details, errorDetail, "Invalid error detail");
            done();
        });
    }

    /**
     * Test when authorization is missing.
     */
    it('should return authorized error. The authorization is missing.', function (done) {
        assertError('2001', null, 401, 'Authorization information needed or incorrect.', done);
    });

    /**
     * Test when roundId is not number.
     */
    it('should return bad request. The roundId is not number.', function (done) {
        assertError('abc', member1, 400, 'roundId should be number.', done);
    });

    /**
     * Test when roundId is not integer.
     */
    it('should return bad request. The roundId is not integer.', function (done) {
        assertError('1.234', member1, 400, 'roundId should be Integer.', done);
    });

    /**
     * Test when roundId is not positive.
     */
    it('should return bad request. The roundId is not positive.', function (done) {
        assertError('-1', member1, 400, 'roundId should be positive.', done);
    });

    /**
     * Test when roundId is zero.
     */
    it('should return bad request. The roundId is zero.', function (done) {
        assertError('0', member1, 400, 'roundId should be positive.', done);
    });

    /**
     * Test when roundId is too big.
     */
    it('should return bad request. The roundId is too big.', function (done) {
        assertError('2147483648', member1, 400, 'roundId should be less or equal to 2147483647.', done);
    });

    /**
     * Test when user is forbidden to access register endpoint.
     */
    it('should return bad request. The user don\'t have the access to register endpoint.', function (done) {
        assertError('2001', forbiddenUser, 403, 'The user is forbidden to access this endpoint.', done);
    });

    /**
     * Test when user is not activated.
     */
    it('should return bad request. The user is not activated.', function (done) {
        assertError('2001', unActivatedUser, 400, 'You are not eligible to participate in this competition.', done);
    });

    /**
     * Test when user is not existed.
     */
    it('should return bad request. The user is not existed.', function (done) {
        assertError('2001', notExistedUser, 500, 'user not found with id=1234567890', done);
    });

    /**
     * Test when round is not existed.
     */
    it('should return bad request. The challenge round is not existed.', function (done) {
        assertError('3001', member1, 400, 'Round doesn\'t exist 3001.', done);
    });

    /**
     * Test when round has a event but the user didn't register it.
     */
    it('should return bad request. The event not registered.', function (done) {
        assertError('2001', member2, 400, 'In order to participate in this competition, you must register for '
            + '<font color=\"red\">Test Event 2001</font>. Registration is available: <a href=\"https://foo.com\">here</a>. '
            + 'Please register at the provided URL first and then repeat registration at Marathon Match Active Contests page.', done);
    });

    /**
     * Test when registration of round event is not eligible.
     */
    it('should return bad request. The registration of event is not eligible.', function (done) {
        assertError('2001', member3, 400, 'You are not eligible to participate in this competition.', done);
    });

    /**
     * Test when round registration is closed.
     */
    it('should return bad request. The round registration is closed.', function (done) {
        assertError('2002', member1, 400, 'Registration is not currently open.', done);
    });

    /**
     * Test when user is in a invalid country.
     */
    it('should return bad request. The user is in invalid country.', function (done) {
        assertError('2001', iranUser, 400, 'You are not eligible to participate in this competition. Please contact support@topcoder.com if you have any questions.', done);
    });

    /**
     * Test when round is required invitation and the user don't have one.
     */
    it('should return bad request. The user is not invited to this challenge.', function (done) {
        assertError('2003', member1, 400, 'Sorry, this round is by invitation only.', done);
    });

    /**
     * Test when the round is parallel round.
     */
    it('should return bad request. The round is parallel round.', function (done) {
        assertError('2004', member4, 400, 'Sorry, you can not register for this round, you must compete in the version of this round that you were invited to.', done);
    });

    /**
     * Test when the round term doesn't exist.
     */
    it('should return not found. The round term doesn\'t exist.', function (done) {
        assertError('2007', heffan, 404, 'Could not find specified round terms.', done);
    });

    /**
     * Test when the round meet registration limit.
     */
    it('should return bad request. The round has no empty positions for registrants.', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlQuery('UPDATE round SET registration_limit = 0 WHERE round_id = 2001', 'informixoltp', cb);
            },
            function (cb) {
                assertError('2001', heffan, 400, 'There are no more spots available for the round.', cb);
            },
            function (cb) {
                testHelper.runSqlQuery('UPDATE round SET registration_limit = 10 WHERE round_id = 2001', 'informixoltp', cb);
            }
        ], done);
    });

    /**
     * Get marathon match register information for round 2001.
     * Expect success results.
     */
    it('should return success results for round 2001', function (done) {
        validateResult('2001', heffan, './test_files/expected_marathon_reg_info.json', done);
    });

    /**
     * Get marathon match register information for round 2001.
     * user twight already register round 2001, expect success results.
     */
    it('should return success results for round 2001 when user already register', function (done) {
        validateResult('2001', member5, './test_files/expected_marathon_reg_info.json', done);
    });

    /**
     * Get marathon match register information for round 2006.
     * Expect success results with empty questions.
     */
    it('should return success results with empty questions for round 2006', function (done) {
        validateResult('2006', heffan, './test_files/expected_marathon_reg_info_empty_questions.json', done);
    });
});
