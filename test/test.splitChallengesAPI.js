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
var SQL_DIR = __dirname + '/sqls/challenges/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var activeChallengesEndpoint = '/v2/challenges/active';

describe('Get Challenges API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_split_challenges_error_message');

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__clean', 'tcs_catalog', cb);
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
                testHelper.runSqlFiles(testHelper.generatePartPaths(SQL_DIR + 'tcs_catalog__insert_test_data', '', 2), 'tcs_catalog', cb);
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
            .get(url)
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
     * Assert response for new and old api. They should be same.
     * @param {String} url - the url for new api.
     * @param {String} url2 - the url for old api.
     * @param {Function} cb - The callback function.
     */
    function assertNewApi(url, url2, cb) {
        var result1, result2, i;
        async.waterfall([
            function (cbx) {
                createRequest(url, 200, null, function (err, res) {
                    delete res.body.requesterInformation;
                    delete res.body.serverInformation;
                    result1 = res.body;
                    cbx();
                });
            },
            function (cbx) {
                createRequest(url2, 200, null, function (err, res) {
                    delete res.body.requesterInformation;
                    delete res.body.serverInformation;
                    result2 = res.body;
                    cbx();
                });
            },
            function (cbx) {
                assert.equal(result1.total, result2.total, 'invalid length of results');
                assert.equal(result1.data.length, result2.data.length, 'invalid length of data');
                for (i = 0; i < result1.data.length; i += 1) {
                    assert.equal(result1.data[i].challengeName, result2.data[i].challengeName, 'invalid challenge name.');
                    assert.equal(result1.data[i].challengeType, result2.data[i].challengeType, 'invalid challenge type.');
                    assert.equal(result1.data[i].registrationEndDate, result2.data[i].registrationEndDate, 'invalid registration end date.');
                    assert.equal(result1.data[i].firstPlacePrize, result2.data[i].prize[0], 'invalid first place prize.');
                    assert.equal(result1.data[i].submissionEndDate, result2.data[i].submissionEndDate, 'invalid submission end date.');
                    assert.equal(result1.data[i].checkpointSubmissionEndDate, result2.data[i].checkpointSubmissionEndDate, 'invalid checkpoint submission end date.');
                    assert.equal(result1.data[i].registrationStartDate, result2.data[i].postingDate, 'invalid registration start date ' + result1.data[i].registrationStartDate);
                    assert.equal(result1.data[i].numSubmissions, result2.data[i].numSubmissions, 'invalid number of submissions.');
                    assert.equal(result1.data[i].numRegistrants, result2.data[i].numRegistrants, 'invalid number of registrants.');
                    if (url.indexOf('past') < 0) {
                        // Test for other type
                        assert.equal(result1.data[i].currentStatus, result2.data[i].currentStatus, 'invalid current status');
                        assert.equal(result1.data[i].currentPhaseName, result2.data[i].currentPhaseName, 'invalid current phase name.');
                        assert.equal(result1.data[i].currentPhaseEndDate, result2.data[i].currentPhaseEndDate, 'invalid current phase end date.');
                    } else {
                        // Test for past type
                        assert.equal(result1.data[i].status, result2.data[i].currentStatus, 'invalid current status');
                    }
                    assert.equal(result1.data[i].registrationOpen, result2.data[i].registrationOpen, 'invalid registration open');
                }
                cbx();
            }
        ], cb);
    }

    /**
     * Assert success response.
     * @param {String} url - the request url
     * @param {Object} authHeader - the request auth header.
     * @param {Function} cb - the callback function.
     */
    function assertSuccessResponse(url, authHeader, cb) {
        createRequest(url,  200, authHeader, cb);
    }

    /**
     * The listType is not allowed.
     */
    it('should return bad Request. The listType is not allowed now.', function (done) {
        assertBadResponse(activeChallengesEndpoint + '?listType=active', 400, errorObject.invalidQuery, null, done);
    });

    /**
     * The challengeType is a valid query parameter.
     */
    it('should return success results. The challengeType is a valid query parameter.', function (done) {
        assertSuccessResponse(activeChallengesEndpoint + '?challengeType=development', null, done);
    });

    /**
     * The challengeType is invalid.
     */
    it('should return bad Request. The value of challengeType is invalid.', function (done) {
        assertBadResponse(activeChallengesEndpoint + '?challengeType=abc', 400, errorObject.invalidChallengeType, null, done);
    });

    it('should return success results. The projectId is a valid query parameter.', function (done) {
        assertSuccessResponse(activeChallengesEndpoint + '?projectId=123', null, done);
    });

    it('should return success results. The sortColumn is a valid query parameter.', function (done) {
        assertSuccessResponse(activeChallengesEndpoint + '?sortColumn=challengeName', null, done);
    });

    it('should return success results. The sortOrder is a valid query parameter.', function (done) {
        assertSuccessResponse(activeChallengesEndpoint + '?sortOrder=asc', null, done);
    });

    it('should return success results. The pageIndex is a valid query parameter.', function (done) {
        assertSuccessResponse(activeChallengesEndpoint + '?pageIndex=1', null, done);
    });

    it('should return success results. The pageSize is a valid query parameter.', function (done) {
        assertSuccessResponse(activeChallengesEndpoint + '?pageSize=1', null, done);
    });

    it('should return success results. The prizeLowerBound is a valid query parameter.', function (done) {
        assertSuccessResponse(activeChallengesEndpoint + '?prizeLowerBound=1', null, done);
    });

    it('should return success results. The prizeUpperBound is a valid query parameter.', function (done) {
        assertSuccessResponse(activeChallengesEndpoint + '?prizeUpperBound=100', null, done);
    });

    it('should return success results. The submissionEndFrom is a valid query parameter.', function (done) {
        assertSuccessResponse(activeChallengesEndpoint + '?submissionEndFrom=2014-1-1', null, done);
    });

    it('should return success results. The submissionEndTo is a valid query parameter.', function (done) {
        assertSuccessResponse(activeChallengesEndpoint + '?submissionEndTo=2014-1-1', null, done);
    });

    it('should return success results. The new split active api should return same results as old challenges api.',
        function (done) {
            assertNewApi(activeChallengesEndpoint, '/v2/challenges?listType=active', done);
        });

    it('should return success results. Test past api.',
        function (done) {
            assertNewApi('/v2/challenges/past', '/v2/challenges?listType=past', done);
        });

    it('should return success results. The new split active api should return same results as old challenges api.',
        function (done) {
            assertNewApi('/v2/challenges/active', '/v2/challenges?listType=active', done);
        });

    it('should return success results. Test past design api.',
        function (done) {
            assertNewApi('/v2/challenges/past', '/v2/challenges?listType=past', done);
        });
});
