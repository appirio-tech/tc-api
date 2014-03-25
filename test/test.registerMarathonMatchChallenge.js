/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author  Ghost_141
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
var SQL_DIR = __dirname + '/sqls/registerMarathonChallenge/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Register Marathon Match Challenge API', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_register_marathon_match_challenge_error_message'),
        heffan = testHelper.generateAuthHeader({ sub: 'ad|132456' }),
        member1 = testHelper.generateAuthHeader({ sub: 'ad|132457' }),
        member2 = testHelper.generateAuthHeader({ sub: 'ad|132458' }),
        member3 = testHelper.generateAuthHeader({ sub: 'ad|124764' }),
        member4 = testHelper.generateAuthHeader({ sub: 'ad|124766' }),
        member5 = testHelper.generateAuthHeader({ sub: 'ad|124772' }),
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
     * Create a http request and test it.
     * @param {String} roundId - the request roundId.
     * @param {Number} expectStatus - the expected request response status.
     * @param {Object} authHeader - the auth header for request.
     * @param {Object} postData - the data post to api.
     * @param {Function} cb - the call back function.
     */
    function createRequest(roundId, expectStatus, authHeader, postData, cb) {
        var req = request(API_ENDPOINT)
            .post('/v2/data/marathon/challenges/' + roundId + '/register')
            .set('Accept', 'application/json');
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        req.expect('Content-Type', /json/)
            .expect(expectStatus)
            .send(postData)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {String} roundId - the request roundId
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} authHeader - the request auth header.
     * @param {Object} postData - the data post to api.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(roundId, expectStatus, errorMessage, authHeader, postData, cb) {
        createRequest(roundId, expectStatus, authHeader, postData, function (err, result) {
            if (!err) {
                assert.equal(result.body.error.details, errorMessage, 'invalid error message');
            } else {
                cb(err);
                return;
            }
            cb();
        });
    }

    /**
     * Test when authorization is missing.
     */
    it('should return authorized error. The authorization is missing.', function (done) {
        assertBadResponse('2001', 401, errorObject.unauthorized, null, null, done);
    });

    /**
     * Test when roundId is not number.
     */
    it('should return bad request. The roundId is not number.', function (done) {
        assertBadResponse('abc', 400, errorObject.roundId.notNumber, member1, null, done);
    });

    /**
     * Test when roundId is not integer.
     */
    it('should return bad request. The roundId is not integer.', function (done) {
        assertBadResponse('1.234', 400, errorObject.roundId.notInteger, member1, null, done);
    });

    /**
     * Test when roundId is not positive.
     */
    it('should return bad request. The roundId is not positive.', function (done) {
        assertBadResponse('-1', 400, errorObject.roundId.notPositive, member1, null, done);
    });

    /**
     * Test when roundId is zero.
     */
    it('should return bad request. The roundId is zero.', function (done) {
        assertBadResponse('0', 400, errorObject.roundId.notPositive, member1, null, done);
    });

    /**
     * Test when roundId is too big.
     */
    it('should return bad request. The roundId is too big.', function (done) {
        assertBadResponse('2147483648', 400, errorObject.roundId.tooBig, member1, null, done);
    });

    /**
     * Test when user is forbidden to access register endpoint.
     */
    it('should return bad request. The user don\'t have the access to register endpoint.', function (done) {
        assertBadResponse('2001', 403, errorObject.forbidden, forbiddenUser, null, done);
    });

    /**
     * Test when user is not activated.
     */
    it('should return bad request. The user is not activated.', function (done) {
        assertBadResponse('2001', 400, errorObject.notActivated, unActivatedUser, null, done);
    });

    /**
     * Test when user is not existed.
     */
    it('should return bad request. The user is not existed.', function (done) {
        assertBadResponse('2001', 500, errorObject.userNotExisted, notExistedUser, null, done);
    });

    /**
     * Test when round is not existed.
     */
    it('should return bad request. The challenge round is not existed.', function (done) {
        assertBadResponse('3001', 400, errorObject.roundNotExisted, member1, null, done);
    });

    /**
     * Test when round has a event but the user didn't register it.
     */
    it('should return bad request. The event not registered.', function (done) {
        assertBadResponse('2001', 400, errorObject.roundEvent.notRegister, member2, null, done);
    });

    /**
     * Test when registration of round event is not eligible.
     */
    it('should return bad request. The registration of event is not eligible.', function (done) {
        assertBadResponse('2001', 400, errorObject.roundEvent.notEligible, member3, null, done);
    });

    /**
     * Test when user has already register this challenge.
     */
    it('should return bad request. The user has already registered.', function (done) {
        assertBadResponse('2001', 400, errorObject.alreadyRegister, member4, null, done);
    });

    /**
     * Test when round registration is closed.
     */
    it('should return bad request. The round registration is closed.', function (done) {
        assertBadResponse('2002', 400, errorObject.registerNotOpen, member1, null, done);
    });

    /**
     * Test when user is in a invalid country.
     */
    it('should return bad request. The user is in invalid country.', function (done) {
        assertBadResponse('2001', 400, errorObject.countryNotEligible, iranUser, null, done);
    });

    /**
     * Test when round is required invitation and the user don't have one.
     */
    it('should return bad request. The user is not invited to this challenge.', function (done) {
        assertBadResponse('2003', 400, errorObject.notInvited, member1, null, done);
    });

    /**
     * Test when the round is parallel round.
     */
    it('should return bad request. The round is parallel round.', function (done) {
        assertBadResponse('2004', 400, errorObject.parallelRound, member5, null, done);
    });

    /**
     * Test when the round meet registration limit.
     */
    it('should return bad request. The round has no empty positions for registrants.', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlQuery('UPDATE round SET registration_limit = 0 WHERE round_id = 2001', 'informixoltp', function (err) {
                    cb(err);
                });
            },
            function (cb) {
                assertBadResponse('2001', 400, errorObject.noPositions, heffan, null, cb);
            },
            function (cb) {
                testHelper.runSqlQuery('UPDATE round SET registration_limit = 10 WHERE round_id = 2001', 'informixoltp', function (err) {
                    cb(err);
                });
            }
        ], done);
    });

    /**
     * Test success results.
     */
    it('should return success results. The user is meet all conditions.', function (done) {
        async.waterfall([
            function (cb) {
                createRequest('2001', 200, heffan, null, function (err) {
                    cb(err);
                });
            },
            function (cb) {
                testHelper.runSqlSelectQuery(
                    '(SELECT 1 FROM round_registration WHERE round_id = 2001 AND coder_id = 132456 AND team_id IS NULL) AS round_registration, ' +
                        '(SELECT 1 FROM round_terms_acceptance WHERE user_id = 132456 AND round_id = 2001) AS round_terms_acceptance, ' +
                        '(SELECT 1 FROM algo_rating WHERE coder_id = 132456) AS algo_rating, ' +
                        '(SELECT 1 FROM long_comp_result WHERE round_id = 2001 AND coder_id = 132456) AS long_comp_result FROM dual;',
                    'informixoltp',
                    cb
                );
            },
            function (result, cb) {
                assert.isNotNull(result, 'invalid result');
                assert.equal(result[0].round_registration, 1, 'invalid result');
                assert.equal(result[0].round_terms_acceptance, 1, 'invalid result');
                assert.equal(result[0].algo_rating, 1, 'invalid result');
                assert.equal(result[0].long_comp_result, 1, 'invalid result');
                cb();
            }
        ], done);
    });

});
