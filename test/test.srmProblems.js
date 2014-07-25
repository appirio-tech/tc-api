/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 *
 * The test cases for srmProblems.js.
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var _ = require('underscore'),
    async = require('async'),
    request = require('supertest'),
    chai = require('chai'),
    jwt = require('jsonwebtoken');

var assert = chai.assert;
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080',
    SQL_DIR = __dirname + "/sqls/srmProblems/",
    CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId,
    CLIENT_SECRET = require('../config/tc-config').tcConfig.oauthClientSecret,
    USER = {
        heffan       : "ad|132456",
        "super"      : "ad|132457",
        user         : "ad|132458"
    };


/**
 * Generate an auth header
 * @param {String} user the user to generate the header for
 * @return {String} the generated string
 */
function generateAuthHeader(user) {
    return "Bearer " + jwt.sign({sub: USER[user]}, CLIENT_SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
}

/**
 * Create request and return it
 * @param {String} queryString - the query string
 * @param {String} user - the user handle
 * @return {Object} request
 */
function createRequest(queryString, user) {
    var req = request(API_ENDPOINT)
        .get(queryString)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/);
    if (user) {
        req.set('Authorization', generateAuthHeader(user));
    }

    return req;
}

/**
 * Helper method for validating recent design winning submissions result
 * @param {String} queryString - the query string
 * @param {String} user - the user handle
 * @param {String} expectFile - the expect file path
 * @param {Function} done - the callback function
 */
function validateResult(queryString, user, expectFile, done) {
    createRequest(queryString, user).expect(200).end(function (err, res) {
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
 * @param {String} queryString - the query string
 * @param {String} user - the user handle
 * @param {Number} statusCode - the expected status code
 * @param {String} errorDetail - the error detail.
 * @param {Function} done the callback function
 */
function assertError(queryString, user, statusCode, errorDetail, done) {
    createRequest(queryString, user).expect(statusCode).end(function (err, res) {
        if (err) {
            done(err);
            return;
        }
        if (statusCode === 200) {
            assert.equal(res.body.error, errorDetail, "Invalid error detail");
        } else {
            assert.equal(res.body.error.details, errorDetail, "Invalid error detail");
        }
        done();
    });
}

describe('SRM Round Problem APIs', function () {
    this.timeout(120000); // Wait 2 minutes, remote db might be slow.

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "informixoltp__clean", "informixoltp", done);
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
                testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_test_data", "informixoltp", cb);
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

    describe('List SRM Problems API', function () {

        it("No anonymous access.", function (done) {
            assertError("/v2/data/srm/problems", null, 401, "Authorized information needed.", done);
        });

        it("Admin access only.", function (done) {
            assertError("/v2/data/srm/problems", 'user', 403, "Admin access only.", done);
        });

        it("Valid request.", function (done) {
            validateResult("/v2/data/srm/problems", 'heffan',
                "./test_files/srm_problems/list_srm_problems.json", done);
        });

    });

    describe('List SRM Round Problems API', function () {

        it("No anonymous access.", function (done) {
            assertError("/v2/data/srm/rounds/13672/problems", null, 401, "Authorized information needed.", done);
        });

        it("Admin access only.", function (done) {
            assertError("/v2/data/srm/rounds/13672/problems", 'user', 403, "Admin access only.", done);
        });

        it("roundId should be number.", function (done) {
            assertError("/v2/data/srm/rounds/aaa/problems", 'heffan', 400, "roundId should be number.", done);
        });

        it("roundId should be Integer.", function (done) {
            assertError("/v2/data/srm/rounds/1.01/problems", 'heffan', 400, "roundId should be Integer.", done);
        });

        it("roundId should be positive.", function (done) {
            assertError("/v2/data/srm/rounds/-1/problems", 'heffan', 400, "roundId should be positive.", done);
        });

        it("roundId should be less or equal to 2147483647.", function (done) {
            assertError("/v2/data/srm/rounds/111111111111111111111111111/problems",
                'heffan', 400, "roundId should be less or equal to 2147483647.", done);
        });

        it("Cannot find records by given roundId.", function (done) {
            assertError("/v2/data/srm/rounds/100/problems", 'heffan', 404, "Cannot find records by given roundId.", done);
        });

        it("Valid request.", function (done) {
            validateResult("/v2/data/srm/rounds/13672/problems", 'heffan',
                "./test_files/srm_problems/list_round_problems.json", done);
        });

    });

    describe('List SRM Round Problem Components API', function () {

        it("No anonymous access.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components", null, 401, "Authorized information needed.", done);
        });

        it("Admin access only.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components", 'user', 403, "Admin access only.", done);
        });

        it("roundId should be number.", function (done) {
            assertError("/v2/data/srm/rounds/aaa/components", 'heffan', 400, "roundId should be number.", done);
        });

        it("roundId should be Integer.", function (done) {
            assertError("/v2/data/srm/rounds/1.01/components", 'heffan', 400, "roundId should be Integer.", done);
        });

        it("roundId should be positive.", function (done) {
            assertError("/v2/data/srm/rounds/-1/components", 'heffan', 400, "roundId should be positive.", done);
        });

        it("roundId should be less or equal to 2147483647.", function (done) {
            assertError("/v2/data/srm/rounds/11111111111111111111/components", 'heffan', 400,
                "roundId should be less or equal to 2147483647.", done);
        });

        it("problemId should be number.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components?problemId=aaa", 'heffan', 400, "problemId should be number.", done);
        });

        it("problemId should be Integer.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components?problemId=1.01", 'heffan', 400, "problemId should be Integer.", done);
        });

        it("problemId should be positive.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components?problemId=-1", 'heffan', 400, "problemId should be positive.", done);
        });

        it("problemId should be less or equal to 2147483647.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components?problemId=111111111111111111111", 'heffan', 400,
                "problemId should be less or equal to 2147483647.", done);
        });

        it("divisionId should be number.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components?problemId=10195&divisionId=aaa",
                'heffan', 400, "divisionId should be number.", done);
        });

        it("divisionId should be Integer.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components?problemId=10195&divisionId=1.01", 'heffan',
                400, "divisionId should be Integer.", done);
        });

        it("divisionId should be positive.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components?problemId=10195&divisionId=-1", 'heffan',
                400, "divisionId should be positive.", done);
        });

        it("divisionId should be less or equal to 2147483647.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components?problemId=10195&divisionId=111111111111111111111",
                'heffan', 400, "divisionId should be less or equal to 2147483647.", done);
        });

        it("Both problemId and divisionId should be provided if you provided one of them.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components?divisionId=2",
                'heffan', 400, "Both problemId and divisionId should be provided if you provided one of them.", done);
        });

        it("Both problemId and divisionId should be provided if you provided one of them.", function (done) {
            assertError("/v2/data/srm/rounds/13672/components?divisionId=2",
                'heffan', 400, "Both problemId and divisionId should be provided if you provided one of them.", done);
        });

        it("Valid request with global flag is false.", function (done) {
            validateResult("/v2/data/srm/rounds/13672/components?problemId=10195&divisionId=2", 'heffan',
                "./test_files/srm_problems/list_round_problem_components.json", done);
        });

        it("Valid request with global flag is true.", function (done) {
            validateResult("/v2/data/srm/rounds/13672/components", 'heffan',
                "./test_files/srm_problems/list_round_problem_components_global.json", done);
        });
    });
});