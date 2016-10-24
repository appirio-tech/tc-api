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
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/admins/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var username = 'dok_tester';
var testBody = {username: username};

describe('Remove Admin API', function () {
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
        var url = "/v2/admin/admins",
            req = request(API_ENDPOINT)
                .del(url)
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
                var body = res.body, expected = require("./test_files/admins/" + file);
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

    it("should return required error for missing username", function (done) {
        assertResponse(adminHeader, {}, "expect_remove_admin_with_empty_body", done);
    });

    it("should return validation error for empty username", function (done) {
        assertErrorResponse(400, adminHeader, {username: '   \n  \t \r'},
            "username should be non-null and non-empty string.", done);
    });

    it("should return validation error for invalid username", function (done) {
        assertErrorResponse(400, adminHeader, {username: true},
            "username should be string.", done);
    });

    it("should return not found error if not exist user", function (done) {
        assertErrorResponse(404, adminHeader, {username: 'notexist'},
            "User with the username: notexist does not exist", done);
    });

    it("should remove admin successfully", function (done) {
        assertResponse(adminHeader, testBody, "expect_remove_admin", done);
    });
});
