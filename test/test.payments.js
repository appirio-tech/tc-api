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
var SQL_DIR = __dirname + "/sqls/payments/";

describe("Payment List API", function () {
    this.timeout(60000); // The api with testing remote db could be quit slow

    var heffanAuthHeader = testHelper.generateAuthHeader({ sub: "ad|132456" }),
        userAuthHeader = testHelper.generateAuthHeader({ sub: "ad|132458" });

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

    /**
     * Create request and return it
     * @param {String} queryString - the query string
     * @param {String} authHeader - the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(queryString, authHeader) {
        var req = request(API_ENDPOINT)
            .get(queryString)
            .set("Accept", "application/json");
        if (authHeader) {
            req = req.set("Authorization", authHeader);
        }
        return req.expect("Content-Type", /json/);
    }

    /**
     * Helper method for validating payment list result
     * @param {String} queryString - the query string
     * @param {String} authHeader - the Authorization header
     * @param {String} expectFile - the expect file path
     * @param {Function} done - the callback function
     */
    function validateResult(queryString, authHeader, expectFile, done) {
        createRequest(queryString, authHeader).expect(200).end(function (err, res) {
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
     * @param {String} authHeader - the Authorization header
     * @param {Number} statusCode - the expected status code
     * @param {String} errorDetail - the error detail.
     * @param {Function} done the callback function
     */
    function assertError(queryString, authHeader, statusCode, errorDetail, done) {
        createRequest(queryString, authHeader).expect(statusCode).end(function (err, res) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(res.body.error.details, errorDetail, "Invalid error detail");
            done();
        });
    }

    /**
     * Test /v2/payments?pageIndex=abc with heffan header
     * pageIndex parameter is not number, expect 400
     */
    it("should return error 400 when pageIndex is not number", function (done) {
        assertError("/v2/payments?pageIndex=abc", heffanAuthHeader, 400,
            "pageIndex should be number.", done);
    });

    /**
     * Test /v2/payments?pageIndex=-10 with heffan header
     * pageIndex parameter is not positive, expect 400
     */
    it("should return error 400 when pageIndex is not positive", function (done) {
        assertError("/v2/payments?pageIndex=-10", heffanAuthHeader, 400,
            "pageIndex should be positive.", done);
    });

    /**
     * Test /v2/payments?pageIndex=999999999999 with heffan header
     * pageIndex parameter is too large, expect 400
     */
    it("should return error 400 when pageIndex is too large", function (done) {
        assertError("/v2/payments?pageIndex=999999999999", heffanAuthHeader, 400,
            "pageIndex should be less or equal to 2147483647.", done);
    });

    /**
     * Test /v2/payments?pageSize=invalid with heffan header
     * pageSize parameter is not number, expect 400
     */
    it("should return error 400 when pageSize is not number", function (done) {
        assertError("/v2/payments?pageSize=invalid", heffanAuthHeader, 400,
            "pageSize should be number.", done);
    });

    /**
     * Test /v2/payments?pageSize=999999999999 with heffan header
     * pageSize parameter is too large, expect 400
     */
    it("should return error 400 when pageSize is too large", function (done) {
        assertError("/v2/payments?pageSize=999999999999", heffanAuthHeader, 400,
            "pageSize should be less or equal to 2147483647.", done);
    });

    /**
     * Test /v2/payments?pageSize=0 with heffan header
     * pageSize parameter is incorrect, expect 400
     */
    it("should return error 400 when pageSize is not positive", function (done) {
        assertError("/v2/payments?pageSize=0", heffanAuthHeader, 400,
            "pageSize should be positive.", done);
    });

    /**
     * Test /v2/payments?sortColumn=invalid with heffan header
     * sortColumn parameter is incorrect, expect 400
     */
    it("should return error 400 when sortColumn is incorrect", function (done) {
        assertError("/v2/payments?sortColumn=invalid", heffanAuthHeader, 400,
            "The sort column 'invalid' is invalid, it should be element of description,type,createDate,releaseDate,paidDate,status,amount.", done);
    });

    /**
     * Test /v2/payments?sortOrder=invalid with heffan header
     * sortOrder parameter is incorrect, expect 400
     */
    it("should return error 400 when sortOrder is incorrect", function (done) {
        assertError("/v2/payments?sortOrder=invalid", heffanAuthHeader, 400,
            "sortOrder should be an element of asc,desc.", done);
    });

    /**
     * Test /v2/payments without header
     * expect 401 when unauthorized error occur
     */
    it("should return error 401 when unauthorized error occur", function (done) {
        assertError("/v2/payments", null, 401, "Unauthorized Error", done);
    });

    /**
     * Test /v2/payments?status=invalid with heffan header
     * status parameter is incorrect, expect 400
     */
    it("should return error 400 when status is incorrect", function (done) {
        assertError("/v2/payments?status=invalid", heffanAuthHeader, 400,
            "The status parameter is incorrect.", done);
    });

    /**
     * Test /v2/payments?type= with heffan header
     * type parameter is incorrect, expect 400
     */
    it("should return error 400 when type is empty", function (done) {
        assertError("/v2/payments?type=", heffanAuthHeader, 400,
            "The type parameter should be no-empty string.", done);
    });

    /**
     * Test /v2/payments with heffan header
     * expect success result
     */
    it("should return 10 payments.", function (done) {
        validateResult("/v2/payments", heffanAuthHeader,
            "./test_files/expected_payment_list_10.json", done);
    });

    /**
     * Test /v2/payments?pageSize=20 with heffan header
     * expect success result
     */
    it("should return 13 payments.", function (done) {
        validateResult("/v2/payments?pageSize=20", heffanAuthHeader,
            "./test_files/expected_payment_list_13.json", done);
    });

    /**
     * Test /v2/payments?type=contest%20payment&sortColumn=paidDate&sortOrder=DESC with heffan header
     * expect success result
     */
    it("should return 7 payments.", function (done) {
        validateResult("/v2/payments?type=contest%20payment&sortColumn=paidDate&sortOrder=DESC", heffanAuthHeader,
            "./test_files/expected_payment_list_7.json", done);
    });

    /**
     * Test /v2/payments?status=paid&pageSize=3&pageIndex=2 with heffan header
     * expect success result
     */
    it("should return 2 payments.", function (done) {
        validateResult("/v2/payments?status=paid&pageSize=3&pageIndex=2", heffanAuthHeader,
            "./test_files/expected_payment_list_2.json", done);
    });

    /**
     * Test /v2/payments with user header
     * expect success result
     */
    it("should return 0 payment.", function (done) {
        validateResult("/v2/payments", userAuthHeader,
            "./test_files/expected_payment_list_0.json", done);
    });

    /**
     * Test /v2/payments?type=invalid with heffan header
     * expect success result
     */
    it("should return 0 payment when type is not valid.", function (done) {
        validateResult("/v2/payments?type=invalid", heffanAuthHeader,
            "./test_files/expected_payment_list_heffan_0.json", done);
    });
});