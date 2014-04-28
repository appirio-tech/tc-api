/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
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

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/checkpoint/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';


describe('Checkpoint API', function () {
    this.timeout(60000);     // The api with testing remote db could be quit slow
    var adminHeader, memberHeader, allowedMemberHeader;

    /**
     * Create authorization header before each test
     * @param {Function<err>} done the callback
     */
    beforeEach(function (done) {
        adminHeader = "Bearer " + testHelper.getAdminJwt();
        memberHeader = "Bearer " + testHelper.getMemberJwt();
        allowedMemberHeader = "Bearer " + testHelper.getMemberJwt("124857");
        done();
    });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", "tcs_catalog", done);
    }

    /**
     * This function is run before all tests.
     * Generate tests data.
     * @param {Function<err>} done the callback
     */
    before(function (done) {
        async.waterfall([
            function (cb) {
                clearDb(cb);
            }, function (cb) {
                var files = testHelper.generatePartPaths(SQL_DIR + "tcs_catalog__insert_test_data", "", 3);
                testHelper.runSqlFiles(files, "tcs_catalog", cb);
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
     * Create request and return it
     * @param {Boolean} isStudio the flag if studio
     * @param {String} challengeId the challenge id. Optional
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(isStudio, challengeId, statusCode, authHeader) {
        var url = "/v2/" + (isStudio ? "design" : "develop") + "/challenges/checkpoint/" + (challengeId || ""),
            req = request(API_ENDPOINT)
                .get(url)
                .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect('Content-Type', /json/).expect(statusCode);
    }

    /**
     * Get response and assert it
     * @param {Boolean} isStudio the flag if studio
     * @param {String} challengeId the challenge id. Optional
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(isStudio, challengeId, statusCode, authHeader, errorMessage, done) {
        createRequest(isStudio, challengeId, statusCode, authHeader)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                if (errorMessage) {
                    assert.ok(res.body);
                    assert.ok(res.body.error);
                    if (statusCode === 200) {
                        assert.equal(res.body.error, errorMessage);
                    } else {
                        assert.equal(res.body.error.details, errorMessage);
                    }
                }
                done();
            });
    }

    /**
     * Make request to checkpoint API and compare response with given file
     * @param {Boolean} isStudio the flag if studio
     * @param {String} challengeId the challenge id. Optional
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} file - the file which contains expected response
     * @param {Function<err>} done - the callback
     */
    function assertResponse(isStudio, challengeId, authHeader, file, done) {
        createRequest(isStudio, challengeId, 200, authHeader)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var body = res.body, expected = require("./test_files/" + file);
                delete body.serverInformation;
                delete body.requesterInformation;
                assert.deepEqual(body, expected, "Invalid response");
                done();
            });
    }

    /**
     * /design/challenges/checkpoint/2002
     */
    it("should return result (studio)", function (done) {
        assertResponse(true, "2002", null,  "expected_checkpoint_studio", done);
    });

    /**
     * /develop/challenges/checkpoint/2002
     */
    it("should return result (software)", function (done) {
        assertResponse(false, "2001", null,  "expected_checkpoint_software", done);
    });

    /**
     * /design/challenges/checkpoint/3002
     */
    it("should return result for private contest (studio)", function (done) {
        assertResponse(true, "3002", allowedMemberHeader,  "expected_checkpoint_studio_priv", done);
    });

    /**
     * /develop/challenges/checkpoint/3001
     */
    it("should return result for private contest (software)", function (done) {
        assertResponse(false, "3001", allowedMemberHeader,  "expected_checkpoint_software_priv", done);
    });

    /**
     * /design/challenges/checkpoint/3002
     */
    it("should return result for private contest for admin (studio)", function (done) {
        assertResponse(true, "3002", adminHeader,  "expected_checkpoint_studio_priv", done);
    });

    /**
     * /develop/challenges/checkpoint/3001
     */
    it("should return result for private contest for admin (software)", function (done) {
        assertResponse(false, "3001", adminHeader,  "expected_checkpoint_software_priv", done);
    });

    /**
     * /design/challenges/checkpoint/4002
     */
    it("should return result if only checkpointResults exists (studio)", function (done) {
        assertResponse(true, "4002", null,  "expected_checkpoint_studio_2", done);
    });

    /**
     * /develop/challenges/checkpoint/4001
     */
    it("should return result if only checkpointResults exists (software)", function (done) {
        assertResponse(false, "4001", null,  "expected_checkpoint_software_2", done);
    });

    /**
     * /design/challenges/checkpoint/4004
     */
    it("should return result if only generalFeedback exists (studio)", function (done) {
        assertResponse(true, "4004", null,  "expected_checkpoint_studio_3", done);
    });

    /**
     * /develop/challenges/checkpoint/4003
     */
    it("should return result if only generalFeedback exists (software)", function (done) {
        assertResponse(false, "4003", null,  "expected_checkpoint_software_3", done);
    });

    /**
     * /design/challenges/checkpoint/3002
     */
    it("should return unauthorized error for private contest (studio)", function (done) {
        assertErrorResponse(true, "3002", 401, null, null, done);
    });

    /**
     * /develop/challenges/checkpoint/3001
     */
    it("should return unauthorized error for private contest (software)", function (done) {
        assertErrorResponse(false, "3001", 401, null, null, done);
    });

    /**
     * /design/challenges/checkpoint/3002
     */
    it("should return forbidden error for private contest (studio)", function (done) {
        assertErrorResponse(true, "3002", 403, memberHeader, null, done);
    });

    /**
     * /develop/challenges/checkpoint/3001
     */
    it("should return forbidden error for private contest (software)", function (done) {
        assertErrorResponse(false, "3001", 403, memberHeader, null, done);
    });

    /**
     * /design/challenges/checkpoint/123456
     */
    it("should return 404 error (studio)", function (done) {
        assertErrorResponse(true, "123456", 404, null, "Challenge not found.", done);
    });

    /**
     * /develop/challenges/checkpoint/123456
     */
    it("should return 404 error (software)", function (done) {
        assertErrorResponse(false, "123456", 404, null, "Challenge not found.", done);
    });

    /**
     * /design/challenges/checkpoint/3001
     */
    it("should return 404 error for challenge_id from software (studio)", function (done) {
        assertErrorResponse(true, "3001", 404, null, "Challenge not found.", done);
    });

    /**
     * /develop/challenges/checkpoint/3002
     */
    it("should return 404 for challenge_id from studio (software)", function (done) {
        assertErrorResponse(false, "3002", 404, null, "Challenge not found.", done);
    });

    /**
     * /develop/challenges/checkpoint/4010
     */
    it("should return 404 if project exists, but there is no feedback (software)", function (done) {
        assertErrorResponse(false, "4010", 404, null, "Checkpoint data not found.", done);
    });

    /**
     * /design/challenges/checkpoint/4011
     */
    it("should return 404 if project exists, but there is no feedback (studio)", function (done) {
        assertErrorResponse(true, "4011", 404, null, "Checkpoint data not found.", done);
    });


    /**
     * /design/challenges/checkpoint
     * This test will call different route, because :challengeId is missing!
     * getStudioChallenge(/design/challenges/:contestId) is called here with contestId = "checkpoint"
     */
    it("should return error if challengeId is not defined (studio)", function (done) {
        assertErrorResponse(true, "", 400, null, "challengeId should be number.", done);
    });

    /**
     * /develop/challenges/checkpoint
     * This test will call different route, because :challengeId is missing!
     * getSoftwareChallenge(/develop/challenges/:contestId) is called here with contestId = "checkpoint"
     */
    it("should return error if challengeId is not defined (software)", function (done) {
        assertErrorResponse(false, "", 400, null, "challengeId should be number.", done);
    });

    /**
     * /design/challenges/checkpoint/xyz
     */
    it("should return error 400 when challengeId is not number (studio)", function (done) {
        assertErrorResponse(true, "xyz", 400, null, "challengeId should be number.", done);
    });

    /**
     * /develop/challenges/checkpoint/xyz
     */
    it("should return error 400 when challengeId is not number (software)", function (done) {
        assertErrorResponse(false, "xyz", 400, null, "challengeId should be number.", done);
    });

    /**
     * /design/challenges/checkpoint/0
     */
    it("should return error 400 when challengeId is 0 (studio)", function (done) {
        assertErrorResponse(true, "0", 400, null, "challengeId should be positive.", done);
    });

    /**
     * /develop/challenges/checkpoint/0
     */
    it("should return error 400 when challengeId is 0 (software)", function (done) {
        assertErrorResponse(false, "0", 400, null, "challengeId should be positive.", done);
    });

    /**
     * /design/challenges/checkpoint/-2
     */
    it("should return error 400 when challengeId is -2 (studio)", function (done) {
        assertErrorResponse(true, "-2", 400, null, "challengeId should be positive.", done);
    });

    /**
     * /develop/challenges/checkpoint/-2
     */
    it("should return error 400 when challengeId is -2 (software)", function (done) {
        assertErrorResponse(false, "-2", 400, null, "challengeId should be positive.", done);
    });

    /**
     * /design/challenges/checkpoint/100000000000000000000
     */
    it("should return error 400 when challengeId is too big number (studio)", function (done) {
        assertErrorResponse(true, "100000000000000000000", 400, null,
            "challengeId should be less or equal to 2147483647.", done);
    });

    /**
     * /develop/challenges/checkpoint/100000000000000000000
     */
    it("should return error 400 when challengeId is too big number (software)", function (done) {
        assertErrorResponse(false, "100000000000000000000", 400, null,
            "challengeId should be less or equal to 2147483647.", done);
    });

    /**
     * /design/challenges/checkpoint/1.123
     */
    it("should return error 400 when challengeId is float number (studio)", function (done) {
        assertErrorResponse(true, "1.123", 400, null, "challengeId should be Integer.", done);
    });

    /**
     * /develop/challenges/checkpoint/1.123
     */
    it("should return error 400 when challengeId is float number (software)", function (done) {
        assertErrorResponse(false, "1.123", 400, null, "challengeId should be Integer.", done);
    });
});
