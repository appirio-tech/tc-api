/*
 * Copyright (C) 2016 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSCODER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint nomen: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var _ = require('underscore');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/copilots/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var username = 'dok_tester1';
var testBody = {
    username: username,
    isSoftwareCopilot: true,
    isStudioCopilot: false
};

describe('Create Copilot API', function () {
    this.timeout(600000);     // The api with testing remote db could be quit slow
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
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__insert_test_data", "tcs_catalog", cb);
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
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {Object} postData - the data post to api.
     * @return {Object} request
     */
    function createRequest(statusCode, authHeader, postData) {
        var url = "/v2/admin/copilots",
            req = request(API_ENDPOINT)
                .post(url)
                .send(postData)
                .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect('Content-Type', /json/).expect(statusCode);
    }

    /**
     * Get response and assert it
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {Object} postData - the data post to api.
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(statusCode, authHeader, postData, errorMessage, done) {
        createRequest(statusCode, authHeader, postData)
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
     * @param {String} authHeader the Authorization header. Optional
     * @param {Object} postData - the data post to api.
     * @param {String} file - the file which contains expected response
     * @param {Function<err>} done - the callback
     */
    function assertResponse(authHeader, postData, file, done) {
        createRequest(200, authHeader, postData)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var body = res.body, expected = require("./test_files/copilots/" + file);
                delete body.serverInformation;
                delete body.requesterInformation;
                assert.deepEqual(body, expected, "Invalid response");
                done();
            });
    }


    it("should return unauthorized error for missing Authorization header", function (done) {
        assertErrorResponse(401, null, testBody, "You need to login for this api.", done);
    });

    it("should return forbidden error for not admin token", function (done) {
        assertErrorResponse(403, memberHeader, testBody, "You don\'t have access to this api.", done);
    });

    it("should return required error for empty body or missing username", function (done) {
        assertResponse(adminHeader, {}, "expect_create_copilot_with_empty_body", done);
    });


    it("should return required error for missing isSoftwareCopilot", function (done) {
        assertResponse(adminHeader, _.omit(testBody, 'isSoftwareCopilot'),
            "expect_create_copilot_with_missing_isSoftwareCopilot", done);
    });

    it("should return required error for missing isStudioCopilot", function (done) {
        assertResponse(adminHeader, _.omit(testBody, 'isStudioCopilot'),
            "expect_create_copilot_with_missing_isStudioCopilot", done);
    });

    it("should return validation error for empty username", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {username: '   \n  \t \r'}),
            "username should be non-null and non-empty string.", done);
    });

    it("should return validation error for invalid username", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {username: true}),
            "username should be string.", done);
    });

    it("should return validation error for invalid isStudioCopilot", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {isStudioCopilot: 'invalid boolean'}),
            "isStudioCopilot should be 0, 1, true or false.", done);
    });

    it("should return validation error for invalid isSoftwareCopilot", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {isSoftwareCopilot: 'invalid boolean'}),
            "isSoftwareCopilot should be 0, 1, true or false.", done);
    });

    it("should return validation error for isSoftwareCopilot/isStudioCopilot false at same time", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {  isStudioCopilot: 0, isSoftwareCopilot: false }),
            "Studio Copilot and Software Copilot Checkbox should have at least one checked", done);
    });

    it("should return not found error if not exist user", function (done) {
        assertErrorResponse(404, adminHeader, _.extend(_.clone(testBody), {username: 'notexist'}),
            "User with the username: notexist does not exist", done);
    });

    it("should return duplicate resource error if exist copilot", function (done) {
        assertErrorResponse(409, adminHeader, _.extend(_.clone(testBody), {username: 'dok_tester'}),
            "The user dok_tester is already added as copilot", done);
    });

    it("should create copilot successfully", function (done) {
        assertResponse(adminHeader, testBody, "expect_create_copilot", done);
    });
});
