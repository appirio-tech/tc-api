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
var fs = require('fs');
var _ = require('underscore');
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/getChallengesRSS/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Challenges RSS API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_get_challenges_rss_error_message');

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__clean', 'informixoltp', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__clean', 'tcs_catalog', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'topcoder_dw__clean', 'topcoder_dw', cb);
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
                testHelper.runSqlFile(SQL_DIR + 'topcoder_dw__insert_test_data', 'topcoder_dw', cb);
            },
            function (cb) {
                testHelper.runSqlFiles(testHelper.generatePartPaths(SQL_DIR + 'tcs_catalog__insert_test_data', '', 2),
                    'tcs_catalog', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__insert_test_data', 'informixoltp', cb);
            },
            function (cb) {
                testHelper.updateTextColumn('update project_spec set detailed_requirements_text = ?',
                    'tcs_catalog', [{type: 'text', value: 'software detail requirement'}], cb);
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
     * @param {Function} cb - the call back function.
     */
    function createRequest(url, expectStatus, cb) {
        request(API_ENDPOINT)
            .get('/v2/challenges/rss' + url)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(expectStatus)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {String} url - the request url
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(url, expectStatus, errorMessage, cb) {
        createRequest(url, expectStatus, function (err, result) {
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
     * Test when challengeType is invalid.
     */
    it('should return bad Request. The challengeType is invalid.', function (done) {
        assertBadResponse('?challengeType=abc', 400, errorObject.challengeType.invalid, done);
    });

    /**
     * Test when listType is invalid.
     */
    it('should return bad Request. The listType is invalid.', function (done) {
        assertBadResponse('?listType=abc', 400, errorObject.listType.invalid, done);
    });

    /**
     * Test when challengeType is 'all' which is invalid.
     */
    it('should return bad Request. The challengeType is invalid.', function (done) {
        assertBadResponse('?challengeType=all', 400, errorObject.challengeType.invalid, done);
    });

    /**
     * The UPCOMING is not supported for data challenge.
     */
    it('should return success results. The listType UPCOMING is not supported for data challenge.', function (done) {
        createRequest('?listType=UPCOMING&challengeType=data', 200, function (err, result) {
            if (err) {
                done(err);
                return;
            }
            assert.isTrue(_.isEmpty(result.body.data), 'invalid results');
            assert.equal(result.body.total, 0, 'invalid results');
            done();
        });
    });

    /**
     * Test open challenges only.
     */
    it('should return success results. The results should contains OPEN/ACTIVE challenges only.', function (done) {
        createRequest('?listType=ACTIVE', 200, function (err, result) {
            if (err) {
                done(err);
                return;
            }
            delete result.body.requesterInformation;
            delete result.body.serverInformation;
            assert.deepEqual(result.body, require('./test_files/expected_get_challenge_rss_active'), 'invalid response');
            done();
        });
    });

    /**
     * Test upcoming challenges only.
     */
    it('should return success results. The results should contains UPCOMING challenges only.', function (done) {
        createRequest('?listType=upcoming', 200, function (err, result) {
            if (err) {
                done(err);
                return;
            }
            delete result.body.requesterInformation;
            delete result.body.serverInformation;
            assert.deepEqual(result.body,  require('./test_files/expected_get_challenge_rss_upcoming'), 'invalid response');
            done();
        });
    });

    /**
     * Test OPEN software challenges.
     */
    it('should return success results. The results should contains open software challenges only.', function (done) {
        createRequest('?listType=OPEN&challengeType=develop', 200, function (err, result) {
            if (err) {
                done(err);
                return;
            }
            delete result.body.requesterInformation;
            delete result.body.serverInformation;
            assert.deepEqual(result.body, require('./test_files/expected_get_challenge_rss_develop_open'), 'invalid response');
            done();
        });
    });

    /**
     * Test OPEN studio challenges.
     */
    it('should return success results. The results should contains open studio challenges only.', function (done) {
        createRequest('?listType=OPEN&challengeType=design', 200, function (err, result) {
            if (err) {
                done(err);
                return;
            }
            delete result.body.requesterInformation;
            delete result.body.serverInformation;
            assert.deepEqual(result.body,  require('./test_files/expected_get_challenge_rss_design_open'), 'invalid response');
            done();
        });
    });
});
