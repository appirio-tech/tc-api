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
var SQL_DIR = __dirname + "/sqls/reportsGetClientChallengeCosts/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';


describe('Get Tops API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow
    var adminHeader, memberHeader;

    /**
     * Create authorization header before each test
     * @param {Function<err>} done the callback
     */
    beforeEach(function (done) {
        adminHeader = "Bearer " + testHelper.getAdminJwt();
        memberHeader = "Bearer " + testHelper.getMemberJwt();
        done();
    });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "tcs_dw__clean", "tcs_dw", done);
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
     * Create request and return it
     * @param {String} queryString the query string. Optional
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(queryString, statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/reports/client/costs?' + (queryString || ""))
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect('Content-Type', /json/).expect(statusCode);
    }

    /**
     * Make request to member get client challenge costs API and compare response with given file
     * @param {String} queryString the query string. Optional
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} file - the file which contains expected response
     * @param {Function<err>} done - the callback
     */
    function assertResponse(queryString, authHeader, file, done) {
        createRequest(queryString, 200, authHeader)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var body = res.body, expected = require("./test_files/" + file);
                delete body.serverInformation;
                delete body.requestorInformation;
                assert.deepEqual(body, expected, "Invalid response");
                done();
            });
    }


    /**
     * Get response and assert response from /reports/client/costs
     * @param {String} queryString the query string. Optional
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(queryString, statusCode, authHeader, errorMessage, done) {
        createRequest(queryString, statusCode, authHeader)
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
     * /reports/client/costs?startDate=2011-01-01&endDate=2015-01-19
     */
    it("should return results for startDate=2011-01-01&endDate=2015-01-19", function (done) {
        assertResponse("startDate=2011-01-01&endDate=2015-01-19",
            adminHeader,
            "expected_get_client_challenge_costs_1", done);
    });

    /**
     * /reports/client/costs?startDate=2011-1-1&endDate=2015-1-19
     */
    it("should return results for startDate=2011-1-1&endDate=2015-1-19", function (done) {
        assertResponse("startDate=2011-1-1&endDate=2015-1-19",
            adminHeader,
            "expected_get_client_challenge_costs_1", done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-01&endDate=2014-01-04
     */
    it("should return results for startDate=2014-01-01&endDate=2014-01-04", function (done) {
        assertResponse("startDate=2014-01-01&endDate=2014-01-04",
            adminHeader,
            "expected_get_client_challenge_costs_2", done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-01&endDate=2014-01-10&clientId=2
     */
    it("should return results for startDate=2014-01-01&endDate=2014-01-10&clientId=2", function (done) {
        assertResponse("startDate=2014-01-01&endDate=2014-01-10&clientId=2",
            adminHeader,
            "expected_get_client_challenge_costs_3", done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-01&endDate=2014-01-10&sfdcAccountId=cmc2
     */
    it("should return results for startDate=2014-01-01&endDate=2014-01-10&sfdcAccountId=cmc2", function (done) {
        assertResponse("startDate=2014-01-01&endDate=2014-01-10&sfdcAccountId=cmc2",
            adminHeader,
            "expected_get_client_challenge_costs_4", done);
    });

    /**
     * /reports/client/costs?endDate=2014-01-01&startDate=2014-01-01
     */
    it("should return error if user is anon", function (done) {
        assertErrorResponse("endDate=2014-01-01&startDate=2014-01-01", 401, null, null, done);
    });

    /**
     * /reports/client/costs?endDate=2014-01-01&startDate=2014-01-01
     */
    it("should return error if user is member", function (done) {
        assertErrorResponse("endDate=2014-01-01&startDate=2014-01-01", 403, memberHeader, null, done);
    });

    /**
     * /reports/client/costs?endDate=2014-01-01
     */
    it("should return error if startDate is not defined", function (done) {
        assertErrorResponse("endDate=2014-01-01", 200, adminHeader,
            "Error: startDate is a required parameter for this action", done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-01
     */
    it("should return error if endDate is not defined", function (done) {
        assertErrorResponse("startDate=2014-01-01", 200, adminHeader,
            "Error: endDate is a required parameter for this action", done);
    });

    /**
     * /reports/client/costs?endDate=2014-01-01&startDate=a
     */
    it("should return error if startDate is invalid date", function (done) {
        assertErrorResponse("endDate=2014-01-01&startDate=a", 400, adminHeader, null, done);
    });

    /**
     * /reports/client/costs?endDate=2014-01-01&startDate=01-01-2014
     */
    it("should return error if startDate has wrong format", function (done) {
        assertErrorResponse("endDate=2014-01-01&startDate=01-01-2014", 400, adminHeader, null, done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-01&endDate=a
     */
    it("should return error if endDate is invalid date", function (done) {
        assertErrorResponse("startDate=2014-01-01&endDate=a", 400, adminHeader, null, done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-01&endDate=01-01-2014
     */
    it("should return error if endDate has wrong format", function (done) {
        assertErrorResponse("startDate=2014-01-01&endDate=01-01-2014", 400, adminHeader, null, done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-02&endDate=2014-01-01
     */
    it("should return error if startDate is greater than endDate", function (done) {
        assertErrorResponse("startDate=2014-01-02&endDate=2014-01-01", 400, adminHeader, null, done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-01&endDate=2014-01-02&clientId=a
     */
    it("should return error if clientId is not a number", function (done) {
        assertErrorResponse("startDate=2014-01-01&endDate=2014-01-02&clientId=a", 400, adminHeader, null, done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-01&endDate=2014-01-02&clientId=1.4
     */
    it("should return error if clientId is a float number", function (done) {
        assertErrorResponse("startDate=2014-01-01&endDate=2014-01-02&clientId=1.4", 400, adminHeader, null, done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-01&endDate=2014-01-02&clientId=0
     */
    it("should return error if clientId is 0", function (done) {
        assertErrorResponse("startDate=2014-01-01&endDate=2014-01-02&clientId=0", 400, adminHeader, null, done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-01&endDate=2014-01-02&clientId=-1
     */
    it("should return error if clientId is -1", function (done) {
        assertErrorResponse("startDate=2014-01-01&endDate=2014-01-02&clientId=-1", 400, adminHeader, null, done);
    });

    /**
     * /reports/client/costs?startDate=2014-01-01&endDate=2014-01-02&clientId=123456789
     */
    it("should return error if clientId is not found", function (done) {
        assertErrorResponse("startDate=2014-01-01&endDate=2014-01-02&clientId=123456789", 404, adminHeader,
            null, done);
    });
});