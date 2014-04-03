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
var SQL_DIR = __dirname + '/sqls/challengeAnalyze/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Challenge Analyze API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_get_challenge_analyze_error_message'),
        admin = testHelper.generateAuthHeader({ sub: "ad|132456" }),
        member = testHelper.generateAuthHeader({ sub: "ad|132457" });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'time_oltp__clean', 'time_oltp', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__clean', 'tcs_catalog', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'corporate_oltp__clean', 'corporate_oltp', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'jive__clean', 'jive', cb);
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
                testHelper.runSqlFile(SQL_DIR + 'corporate_oltp__insert_test_data', 'corporate_oltp', cb);
            },
            function (cb) {
                testHelper.runSqlFiles(testHelper.generatePartPaths(SQL_DIR + 'tcs_catalog__insert_test_data', '', 3),
                    'tcs_catalog', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'time_oltp__insert_test_data', 'time_oltp', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'jive__insert_test_data', 'jive', cb);
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
     * @param {String} url - the request url.
     * @param {Number} expectStatus - the expected request response status.
     * @param {Object} authHeader - the auth header for request.
     * @param {Function} cb - the call back function.
     */
    function createRequest(url, expectStatus, authHeader, cb) {
        var req = request(API_ENDPOINT)
            .get('/v2/reports/analyze' + url)
            .set('Accept', 'application/json');
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        req.expect('Content-Type', /json/)
            .expect(expectStatus)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {String} url - the request url
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} authHeader - the request auth header.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(url, expectStatus, errorMessage, authHeader, cb) {
        createRequest(url, expectStatus, authHeader, function (err, result) {
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
     * Helper method for validating Studio challenge result for current test data
     * @param {String} queryString - the query string
     * @param {Array} challenges - the array of expected challenges. e.g [1, 2]
     * @param {Function} done - the callback function
     */
    function validateResult(queryString, challenges, done) {
        createRequest('?' + queryString, 200, admin, function (err, res) {
            if (err) {
                done(err);
                return;
            }
            var results = res.body.results, i, item;
            assert.lengthOf(results, challenges.length, "invalid data.length");
            for (i = 0; i < results.length; i = i + 1) {
                item = results[i];
                assert.isString(item.challengeType, "invalid type for result: " + i);
                assert.isString(item.challengeName);
                assert.isString(item.challengeStatus);
                assert.isString(item.currentPhase);
                assert.isString(item.numberOfDaysLive);
                assert.isNumber(item.numberOfRegistrants);
                assert.isNumber(item.numberOfUnregistered);
                assert.equal(item.challengeName, "Test Challenge " + challenges[i],
                        "invalid challengeName for result: " + i);
                assert.ok(new Date(item.openRegistrationDate), "invalid postingDate for result: " + i);
            }
            done();
        });
    }

    /**
     * Test openRegistrationDateFrom invalid format.
     */
    it('should return bad Request. The submissionEndFrom is in invalid format.', function (done) {
        assertBadResponse('?openRegistrationDateFrom=2013.01.01', 400, errorObject.invalidOpenRegistrationDateFrom, admin, done);
    });

    /**
     * Test openRegistrationDateFrom has valid format but invalid value.
     */
    it('should return bad Request. The submissionEndFrom has invalid value.', function (done) {
        assertBadResponse('?openRegistrationDateFrom=2014-13-01', 400, errorObject.invalidOpenRegistrationDateFrom, admin, done);
    });

    /**
     * Test openRegistrationDateTo invalid format.
     */
    it('should return bad Request. The submissionEndTo is in invalid format.', function (done) {
        assertBadResponse('?openRegistrationDateTo=2013.01.01', 400, errorObject.invalidOpenRegistrationDateTo, admin, done);
    });

    /**
     * Test openRegistrationDateTo has valid format but invalid value.
     */
    it('should return bad Request. The submissionEndTo has invalid value.', function (done) {
        assertBadResponse('?openRegistrationDateTo=2014-13-01', 400, errorObject.invalidOpenRegistrationDateTo, admin, done);
    });

    /**
     * Test openRegistrationDateTo before openRegistrationDateFrom.
     */
    it('should return bad Request. The openRegistrationDateTo is before openRegistrationDateFrom.', function (done) {
        assertBadResponse('?openRegistrationDateFrom=2014-04-04&openRegistrationDateTo=2014-04-01', 400, errorObject.wrongSequence, admin, done);
    });

    /**
     * Test prizeLower is not a number.
     */
    it('should return bad Request. The prizeLower is not a number.', function (done) {
        assertBadResponse('?prizeLower=abc', 400, errorObject.prizeLower.notNumber, admin, done);
    });

    /**
     * Test prizeLower is not an integer.
     */
    it('should return bad Request. The prizeLower is not integer.', function (done) {
        assertBadResponse('?prizeLower=1.234', 400, errorObject.prizeLower.notInteger, admin, done);
    });

    /**
     * Test prizeLower is negative.
     */
    it('should return bad Request. The prizeLower is negative.', function (done) {
        assertBadResponse('?prizeLower=-1', 400, errorObject.prizeLower.negative, admin, done);
    });

    /**
     * Test prizeLower is too big.
     */
    it('should return bad Request. The prizeLower is too big.', function (done) {
        assertBadResponse('?prizeLower=2147483648', 400, errorObject.prizeLower.tooBig, admin, done);
    });

    /**
     * Test prizeUpper is not a number.
     */
    it('should return bad Request. The prizeUpper is not a number.', function (done) {
        assertBadResponse('?prizeUpper=abc', 400, errorObject.prizeUpper.notNumber, admin, done);
    });

    /**
     * Test prizeUpper is not an integer.
     */
    it('should return bad Request. The prizeUpper is not integer.', function (done) {
        assertBadResponse('?prizeUpper=1.234', 400, errorObject.prizeUpper.notInteger, admin, done);
    });

    /**
     * Test prizeUpper is negative.
     */
    it('should return bad Request. The prizeUpper is negative.', function (done) {
        assertBadResponse('?prizeUpper=-1', 400, errorObject.prizeUpper.negative, admin, done);
    });

    /**
     * Test prizeUpper is too big.
     */
    it('should return bad Request. The prizeUpper is too big.', function (done) {
        assertBadResponse('?prizeUpper=2147483648', 400, errorObject.prizeUpper.tooBig, admin, done);
    });
    /**
     * Test projectId is not a number.
     */
    it('should return bad Request. The projectId is not a number.', function (done) {
        assertBadResponse('?projectId=abc', 400, errorObject.projectId.notNumber, admin, done);
    });

    /**
     * Test projectId is not an integer.
     */
    it('should return bad Request. The projectId is not integer.', function (done) {
        assertBadResponse('?projectId=1.234', 400, errorObject.projectId.notInteger, admin, done);
    });

    /**
     * Test projectId is negative.
     */
    it('should return bad Request. The projectId is negative.', function (done) {
        assertBadResponse('?projectId=-1', 400, errorObject.projectId.notPositive, admin, done);
    });

    /**
     * Test projectId is zero.
     */
    it('should return bad Request. The projectId is zero.', function (done) {
        assertBadResponse('?projectId=0', 400, errorObject.projectId.notPositive, admin, done);
    });

    /**
     * Test projectId is too big.
     */
    it('should return bad Request. The projectId is too big.', function (done) {
        assertBadResponse('?projectId=2147483648', 400, errorObject.projectId.tooBig, admin, done);
    });

    /**
     * Test when caller is a anonymous.
     */
    it('should return unauthorized error. The caller is anonymous.', function (done) {
        assertBadResponse('', 401, errorObject.unauthorized, null, done);
    });

    /**
     * Test when caller is a member.
     */
    it('should return forbidden error. The caller is member.', function (done) {
        assertBadResponse('', 403, errorObject.forbidden, member, done);
    });

    /**
     * Test when challengeType is invalid.
     */
    it('should return bad Request. The challengeType is invalid.', function (done) {
        assertBadResponse('?challengeType=abc', 400, errorObject.invalidChallengeType, admin, done);
    });

    /**
     * Test success call.
     */
    it('should return success results.', function (done) {
        createRequest('', 200, admin, function (err, res) {
            res.body.results.forEach(function (item) {
                assert.isString(item.numberOfDaysLive);
                delete item.numberOfDaysLive;
            });
            testHelper.assertResponse(err, res, 'test_files/expected_challenge_analyze_1', done);
        });
    });

    /**
     * Test challengeType filter.
     */
    it('should return success results. Test challengeType filter.', function (done) {
        validateResult('challengeType=design', [2009], done);
    });

    /**
     * Test challengeName filter.
     */
    it('should return success results. Test challengeName filter.', function (done) {
        validateResult('challengeName=2001', [2001], done);
    });

    /**
     * Test prizeLower filter.
     */
    it('should return success results. Test prizeLower filter.', function (done) {
        validateResult('prizeLower=1200', [2001, 2002, 2004, 2005, 2007, 2008, 2009, 2010], done);
    });

    /**
     * Test prizeUpper filter.
     */
    it('should return success results. Test prizeUpper filter.', function (done) {
        validateResult('prizeUpper=800', [2003, 2006], done);
    });

    /**
     * Test project_id filter.
     */
    it('should return success results. Test projectId filter.', function (done) {
        validateResult('projectId=2001', [2001], done);
    });

    /**
     * Test openRegistrationDateFrom filter.
     */
    it('should return success results. Test openRegistrationDateFrom filter.', function (done) {
        validateResult('openRegistrationDateFrom=2014-04-19', [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010], done);
    });

    /**
     * Test openRegistrationDateTo filter
     */
    it('should return success results. Test openRegistrationDateTo filter.', function (done) {
        validateResult('openRegistrationDateTo=2014-04-13', [], done);
    });

    /**
     * Test openRegistrationDateFrom and openRegistrationDateTo filter.
     */
    it('should return success results. Test openRegistrationDateFrom and openRegistrationDateTo filter.', function (done) {
        validateResult('openRegistrationDateFrom=2014-04-01&openRegistrationDateTo=2014-04-21', [2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010], done);
    });

});
