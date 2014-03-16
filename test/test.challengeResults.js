/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");

/**
 * Helper file for tests.
 */
var testHelper = require('./helpers/testHelper');

/**
 * The location where to find the setup and destroy test SQL scripts.
 */
var SQL_DIR = __dirname + "/sqls/challengeResults/";

/**
 * The endpoint of the test
 */
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * The entire test suite
 */
describe('Get Challenge Results API', function () {

    /**
     * Creates a Request object using the given URL.
     * Sets the expected response code using the expectedStatusCode parameter
     * @param {String} url the url to connect 
     * @param {Number} expectedStatusCode the expected status code of the response
     */
    function getRequest(url, expectedStatusCode) {
        var req = request(API_ENDPOINT)
            .get(url)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(expectedStatusCode);
        return req;
    }

    this.timeout(120000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__clean", "tcs_dw", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", "tcs_catalog", cb);
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
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__insert_test_data", "tcs_catalog", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__insert_test_data", "tcs_dw", cb);
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
     * Makes call to API and checks response content.
     * @param {String} url - the url to call.
     * @param {String} name - the expected file name.
     * @param {Function} cb - the call back function.
     */
    var checkAPI = function (url, name, cb) {
        request(API_ENDPOINT)
            .get(url)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    cb(err);
                    return;
                }
                var body = res.body, expected = require('./test_files/' + name + '.json');
                delete body.serverInformation;
                delete body.requesterInformation;
                assert.deepEqual(body, expected);
                cb();
            });
    };

    /**
     * Utility function to check if the response of a not closed challenge.
     */
    function notFinishedAssert(err, resp, done) {
        if (err) {
            done(err);
            return;
        }
        assert.equal(resp.body.error.details, "You cannot view the results because the challenge is not yet finished or was cancelled.");
        done();
    }

    /**
     * Utility function to check the response of a not supported contest type
     */
    function notSupportedAssert(err, resp, done) {
        if (err) {
            done(err);
            return;
        }
        assert.equal(resp.body.error.details, "Requested challenge type is not supported.");
        done();
    }

    /**
     * Test /v2/develop/challenges/result/:challengeId when challengeId is not a number
     * should return 400 not found
     */
    it('should return 400 error when challenge id not a number', function (done) {
        var req = getRequest('/v2/develop/challenges/result/blah', 400);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "challengeId should be number.");
            done();
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId when challenge is not found
     * should return 404 not found
     */
    it('should return 404 error when challenge not found', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66999', 404);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "Challenge with given id is not found.");
            done();
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenege is studio but API endpoint is develop
     * should return 400 error
     */
    it('should return 400 error where challenege is studio but API endpoint is develop', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66902', 400);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "Requested challenge is not a develop challenge.");
            done();
        });
    });

    /**
     * Test /v2/design/challenges/result/:challengeId where challenege is software but API endpoint is design
     * should return 400 error
     */
    it('should return 400 error where challenege is software but API endpoint is design', function (done) {
        var req = getRequest('/v2/design/challenges/result/66901', 400);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "Requested challenge is not a design challenge.");
            done();
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenge is not closed - still active
     * should return 400 error
     */
    it('should return 400 error where challenge is still active', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66903', 400);
        req.end(function (err, resp) {
            notFinishedAssert(err, resp, done);
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenge is not closed - still draft
     * should return 400 error
     */
    it('should return 400 error where challenge is still draft', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66904', 400);
        req.end(function (err, resp) {
            notFinishedAssert(err, resp, done);
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenge is not closed - was deleted
     * should return 400 error
     */
    it('should return 400 error where challenge was deleted', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66905', 400);
        req.end(function (err, resp) {
            notFinishedAssert(err, resp, done);
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenge is not closed - zero submissions
     * should return 400 error
     */
    it('should return 400 error where challenge is cancelled due to zero submissions', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66906', 400);
        req.end(function (err, resp) {
            notFinishedAssert(err, resp, done);
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenge is not closed - cancelled due to winner unresponsive
     * should return 400 error
     */
    it('should return 400 error where challenge is cancelled due to winner unresponsive', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66907', 400);
        req.end(function (err, resp) {
            notFinishedAssert(err, resp, done);
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenge is not closed - cancelled due to client request
     * should return 400 error
     */
    it('should return 400 error where challenge is cancelled due to client request', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66908', 400);
        req.end(function (err, resp) {
            notFinishedAssert(err, resp, done);
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenge is not closed - cancelled due to requirements unfeasible
     * should return 400 error
     */
    it('should return 400 error where challenge is cancelled due to requirements unfeasible', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66909', 400);
        req.end(function (err, resp) {
            notFinishedAssert(err, resp, done);
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenge is develop but is a Spec Review
     * should return 400 error
     */
    it('should return 400 error where challenge is a Spec Review', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66910', 400);
        req.end(function (err, resp) {
            notSupportedAssert(err, resp, done);
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenge is develop but is Copilot Posting
     * should return 400 error
     */
    it('should return 400 error where challenge is a Copilot Posting', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66911', 400);
        req.end(function (err, resp) {
            notSupportedAssert(err, resp, done);
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenge is develop but is Marathon Match
     * should return 400 error
     */
    it('should return 400 error where challenge is a Marathon Match', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66912', 400);
        req.end(function (err, resp) {
            notSupportedAssert(err, resp, done);
        });
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId for success 
     * Demonstrates 5 submissions, 4 of which pass screening and 3 pass review
     * Also demonstrates that deleted submissions and checkpoint submissions are ignored.
     */
    it('should return the results for a develop challenge', function (done) {
        checkAPI('/v2/develop/challenges/result/66901', 'expected_results_challenge_69001', done);
    });

    /**
     * Test /v2/design/challenges/result/:challengeId for success 
     * Submissions and submitters are not viewable
     * Also demonstrates that deleted and checkpoint submissions are ignored
     */
    it('should return the results for a design challenge', function (done) {
        checkAPI('/v2/design/challenges/result/66902', 'expected_results_challenge_69002', done);
    });

    /**
     * Test /v2/design/challenges/result/:challengeId for success 
     * Submissions and submitters are viewable and are returned. Other than that this has the same info as 66902.
     * Also demonstrates that deleted and checkpoint submissions are ignored
     */
    it('should return the results for a design challenge', function (done) {
        checkAPI('/v2/design/challenges/result/66913', 'expected_results_challenge_69013', done);
    });

    /**
     * Test /v2/develop/challenges/result/:challengeId where challenge is a private challenge
     * should return 404 error
     */
    it('should return 404 error where challenge is private', function (done) {
        var req = getRequest('/v2/develop/challenges/result/66914', 404);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "This is a private challenge. You cannot view it.");
            done();
        });
    });
});
