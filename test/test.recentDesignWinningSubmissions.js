/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach, __dirname */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var SQL_DIR = __dirname + "/sqls/recentDesignWinningSubmissions/";

describe('Recent design winning submissions API', function () {
    this.timeout(60000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clean", "topcoder_dw", cb);
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
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__insert_test_data", "topcoder_dw", cb);
            },
            function (cb) {
                var files = testHelper.generatePartPaths(SQL_DIR + "tcs_catalog__insert_test_data", "", 4);
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
     * @param {String} queryString - the query string
     * @return {Object} request
     */
    function createRequest(queryString) {
        return request(API_ENDPOINT)
            .get(queryString)
            .set("Accept", "application/json")
            .expect("Content-Type", /json/);
    }

    /**
     * Helper method for validating recent design winning submissions result
     * @param {String} queryString - the query string
     * @param {String} expectFile - the expect file path
     * @param {Function} done - the callback function
     */
    function validateResult(queryString, expectFile, done) {
        createRequest(queryString).expect(200).end(function (err, res) {
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
     * @param {Number} statusCode - the expected status code
     * @param {String} errorDetail - the error detail.
     * @param {Function} done the callback function
     */
    function assertError(queryString, statusCode, errorDetail, done) {
        createRequest(queryString).expect(statusCode).end(function (err, res) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(res.body.error.details, errorDetail, "Invalid error detail");
            done();
        });
    }

    /**
     * Test /v2/users/invalid/statistics/design/recentWins
     * user doesn't exist, expect 404
     */
    it("should return error 404 when user doesn't exist", function (done) {
        assertError("/v2/users/invalid/statistics/design/recentWins", 404,
            "User does not exist.", done);
    });

    /**
     * Test /v2/users/hung/statistics/design/recentWins?numberOfRecentWins=abc
     * numberOfRecentWins should be number, expect 400
     */
    it("should return error 400 when numberOfRecentWins is not a number", function (done) {
        assertError("/v2/users/hung/statistics/design/recentWins?numberOfRecentWins=abc", 400,
            "numberOfRecentWins should be number.", done);
    });

    /**
     * Test /v2/users/hung/statistics/design/recentWins?numberOfRecentWins=-1
     * numberOfRecentWins should be positive, expect 400
     */
    it("should return error 400 when numberOfRecentWins is not positive", function (done) {
        assertError("/v2/users/hung/statistics/design/recentWins?numberOfRecentWins=-1", 400,
            "numberOfRecentWins should be positive.", done);
    });

    /**
     * Test /v2/users/hung/statistics/design/recentWins?numberOfRecentWins=111111111111111
     * numberOfRecentWins is too large, expect 400
     */
    it("should return error 400 when numberOfRecentWins is too large", function (done) {
        assertError("/v2/users/hung/statistics/design/recentWins?numberOfRecentWins=111111111111111", 400,
            "numberOfRecentWins should be less or equal to 2147483647.", done);
    });

    /**
     * Test /v2/users/annej9ny/statistics/design/recentWins
     */
    it("should return 200 with one recent winning submission", function (done) {
        validateResult("/v2/users/annej9ny/statistics/design/recentWins",
            "./test_files/expected_recent_design_winning_submissions_annej9ny.json", done);
    });

    /**
     * Test /v2/users/heffan/statistics/design/recentWins
     * No recent design winning submissions return.
     */
    it("should return 200 with zero recent winning submissions", function (done) {
        validateResult("/v2/users/heffan/statistics/design/recentWins",
            "./test_files/expected_recent_design_winning_submissions_heffan.json", done);
    });

    /**
     * Test /v2/users/Partha/statistics/design/recentWins
     * the default numberOfRecentWins parameter is 7, should return 7 recent winning submissions.
     */
    it("should return 200 with 7 recent winning submissions", function (done) {
        validateResult("/v2/users/Partha/statistics/design/recentWins",
            "./test_files/expected_recent_design_winning_submissions_partha_10.json", done);
    });

    /**
     * Test /v2/users/Partha/statistics/design/recentWins?numberOfRecentWins=5
     * return 5 winning submissions.
     */
    it("should return 200 with 5 recent winning submissions", function (done) {
        validateResult("/v2/users/Partha/statistics/design/recentWins?numberOfRecentWins=5",
            "./test_files/expected_recent_design_winning_submissions_Partha_5.json", done);
    });

    /**
     * Test /v2/users/partha/statistics/design/recentWins?numberOfRecentWins=10
     * User Partha only has 7 winning submissions.
     */
    it("should return 200 with 7 recent winning submissions", function (done) {
        validateResult("/v2/users/partha/statistics/design/recentWins?numberOfRecentWins=10",
            "./test_files/expected_recent_design_winning_submissions_partha_10.json", done);
    });

});
