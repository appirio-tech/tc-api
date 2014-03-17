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
var SQL_DIR = __dirname + "/sqls/memberSearch/";

describe("Member Search API", function () {
    this.timeout(60000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "common_oltp__clean", "common_oltp", done);
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
                testHelper.runSqlFile(SQL_DIR + "common_oltp__insert_test_data", "common_oltp", cb);
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
            if (statusCode === 200) {
                assert.equal(res.body.error, errorDetail, "Invalid error detail");
            } else {
                assert.equal(res.body.error.details, errorDetail, "Invalid error detail");
            }
            done();
        });
    }

    /**
     * Test /v2/users/search
     * handle is a required parameter, expect 200 with error message.
     */
    it("should return error detail when handle doesn't exist", function (done) {
        assertError("/v2/users/search", 200, "Error: handle is a required parameter for this action", done);
    });

    /**
     * Test /v2/users/search?handle=&pageSize=5
     * handle is empty, expect 200 with error message
     */
    it("should return error detail when handle is empty", function (done) {
        assertError("/v2/users/search?handle=&pageSize=5", 200, "Error: handle is a required parameter for this action", done);
    });

    /**
     * Test /v2/users/search?handle=%20%20%20%20&pageSize=5
     * handle is empty after trim, expect 200 with error message
     */
    it("should return error 400 when handle is empty after trim", function (done) {
        assertError("/v2/users/search?handle=%20%20%20%20&pageSize=5", 400,
            "handle should be non-null and non-empty string.", done);
    });

    /**
     * Test /v2/users/search?handle=a&pageSize=-1
     * pageSize is not positive, expect 400
     */
    it("should return error 400 when pageSize is not positive", function (done) {
        assertError("/v2/users/search?handle=a&pageSize=-1", 400,
            "pageSize should be positive.", done);
    });

    /**
     * Test /v2/users/search?handle=a&pageSize=10000
     * pageSize is too large, expect 400
     */
    it("should return error 400 when pageSize is too large", function (done) {
        assertError("/v2/users/search?handle=a&pageSize=10000", 400,
            "pageSize should be less or equal to 500.", done);
    });

    /**
     * Test /v2/users/search?handle=a&pageIndex=0
     * pageIndex is not positive, expect 400
     */
    it("should return error 400 when pageIndex is not positive", function (done) {
        assertError("/v2/users/search?handle=a&pageIndex=0", 400,
            "pageIndex should be positive.", done);
    });

    /**
     * Test /v2/users/search?handle=a&pageIndex=1111111111111
     * pageIndex is too large, expect 400
     */
    it("should return error 400 when pageIndex is too large", function (done) {
        assertError("/v2/users/search?handle=a&pageIndex=1111111111111", 400,
            "pageIndex should be less or equal to 2147483647.", done);
    });

    /**
     * Test /v2/users/search?handle=a&pageIndex=1&caseSensitive=fake
     * caseSensitive is invalid, expect 400
     */
    it("should return error 400 when casSensitive is invalid", function (done) {
        assertError("/v2/users/search?handle=a&pageIndex=1&caseSensitive=fake", 400,
            "caseSensitive should be 'true' or 'false'.", done);
    });

    /**
     * Test /v2/users/search?handle=aaa&caseSensitive=true
     */
    it("should return 200 with one user", function (done) {
        validateResult("/v2/users/search?handle=aaa&caseSensitive=true",
            "./test_files/expected_search_members_aaa.json", done);
    });

    /**
     * Test /v2/users/search?handle=bc&caseSensitive=false
     */
    it("should return 200 with one user (case insensitive)", function (done) {
        validateResult("/v2/users/search?handle=bc&caseSensitive=false",
            "./test_files/expected_search_members_bc.json", done);
    });

    /**
     * Test /v2/users/search?handle=b_&caseSensitive=false
     */
    it("should return 200 with four users", function (done) {
        validateResult("/v2/users/search?handle=b_&caseSensitive=false",
            "./test_files/expected_search_members_wildcard_b_.json", done);
    });

    /**
     * Test /v2/users/search?handle=a%&pageSize=5&pageIndex=2
     */
    it("should return 200 with five users", function (done) {
        validateResult("/v2/users/search?handle=a%&pageSize=5&pageIndex=2",
            "./test_files/expected_search_members_wildcard_a%.json", done);
    });

    /**
     * Test /v2/users/search?handle=a%&pageSize=6&pageIndex=3
     */
    it("should return 200 with three users", function (done) {
        validateResult("/v2/users/search?handle=a%&pageSize=6&pageIndex=3",
            "./test_files/expected_search_members_wildcard_a%3.json", done);
    });

    /**
     * Test /v2/users/search?handle=liquid\\_user
     */
    it("should return 200 with one user(liquid_user)", function (done) {
        validateResult("/v2/users/search?handle=liquid\\_user",
            "./test_files/expected_search_members_liquid_user.json", done);
    });

    /**
     * Test /v2/users/search?handle=_\\_CDE
     */
    it("should return 200 with two users", function (done) {
        validateResult("/v2/users/search?handle=_\\_CDE",
            "./test_files/expected_search_members_CDE.json", done);
    });
});