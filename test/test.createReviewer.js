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
var SQL_DIR = __dirname + "/sqls/reviewers/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var username = 'dok_tester1';
var testBody = {
    username: username,
    categoryId: 7,
    immune: 0
};

describe('Create Reviewer API', function () {
    this.timeout(6000000);     // The api with testing remote db could be quit slow
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
        var url = "/v2/admin/reviewers",
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
                if (file) {
                    var body = res.body, expected = require("./test_files/reviewers/" + file);
                    delete body.serverInformation;
                    delete body.requesterInformation;
                    assert.deepEqual(body, expected, "Invalid response");
                }
                done();
            });
    }

    /**
     * Create reviewer and validate exist such reviewer with immune = true
     * @param {Object} postData - the data post to api.
     * @param {Boolean} immune - the immune flag
     * @param {Function<err>} done - the callback
     */
    function assertCreateAndGetAllResponse(postData, immune, done) {
        var authHeader = adminHeader;
        assertResponse(adminHeader, postData, null, function (err) {
            if (err) {
                return done(err);
            }
            request(API_ENDPOINT)
                .get("/v2/admin/reviewers?categoryId=" + postData.categoryId)
                .set('Accept', 'application/json')
                .set('Authorization', authHeader)
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var reviewer = _.find(res.body.reviewers, function (data) {
                        return data.name === postData.username;
                    });
                    assert.ok(reviewer);
                    assert.equal(reviewer.immune, immune);
                    done();
                });
        });
    }


    it("should return unauthorized error for missing Authorization header", function (done) {
        assertErrorResponse(401, null, testBody, "You need to login for this api.", done);
    });

    it("should return forbidden error for not admin token", function (done) {
        assertErrorResponse(403, memberHeader, testBody, "You don\'t have access to this api.", done);
    });

    it("should return required error for empty body or missing username", function (done) {
        assertResponse(adminHeader, {}, "expect_create_reviewer_with_empty_body", done);
    });


    it("should return required error for missing categoryId", function (done) {
        assertResponse(adminHeader, _.omit(testBody, 'categoryId'),
            "expect_create_reviewer_with_missing_categoryId", done);
    });


    it("should return validation error for empty username", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {username: '   \n  \t \r'}),
            "username should be non-null and non-empty string.", done);
    });

    it("should return validation error for invalid username", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {username: true}),
            "username should be string.", done);
    });

    it("should return validation error for invalid categoryId", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {categoryId: 'invalid number'}),
            "categoryId should be number.", done);
    });

    it("should return validation error for negative categoryId", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {categoryId: -2}),
            "categoryId should be positive.", done);
    });

    it("should return validation error for non-integer categoryId", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {categoryId: 1.1}),
            "categoryId should be Integer.", done);
    });

    it("should return validation error for invalid immune", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {immune: 'invalid boolean'}),
            "immune should be 0, 1, true or false.", done);
    });

    it("should return validation error for not valid categoryId", function (done) {
        assertErrorResponse(400, adminHeader, _.extend(_.clone(testBody), {categoryId: 99999}),
            "Category Id 99999 is not a valid category ID", done);
    });

    it("should return not found error if not exist user", function (done) {
        assertErrorResponse(404, adminHeader, _.extend(_.clone(testBody), {username: 'notexist'}),
            "User with the username: notexist does not exist", done);
    });

    it("should return duplicate resource error if exist reviewer", function (done) {
        assertErrorResponse(409, adminHeader, _.extend(_.clone(testBody), {username: 'dok_tester'}),
            "User dok_tester is in the specific review board", done);
    });

    it("should create reviewer successfully", function (done) {
        assertResponse(adminHeader, testBody, "expect_create_reviewer", done);
    });

    it("should create immune=true reviewer successfully with immune=1 in body", function (done) {
        assertCreateAndGetAllResponse(_.extend(_.omit(testBody, 'immune'), {username: 'wyzmo', immune: 1}), true, done);
    });

    it("should create immune=false reviewer successfully with immune=0 in body", function (done) {
        assertCreateAndGetAllResponse(_.extend(_.omit(testBody, 'immune'), {
            username: 'ksmith',
            immune: 0
        }), false, done);
    });

    it("should create immune=true reviewer successfully with studio type", function (done) {
        // 17 = Web Design = Studio type
        assertCreateAndGetAllResponse(_.extend(_.omit(testBody, 'immune'), {
            username: 'cartajs',
            categoryId: 17
        }), true, done);
    });

    it("should create immune=false reviewer successfully with immune=false in body", function (done) {
        assertCreateAndGetAllResponse(_.extend(_.omit(testBody, 'immune'),
            {username: 'Yoshi', categoryId: 17, immune: false}), false, done);
    });

    it("should create immune=true reviewer successfully with code category id in body", function (done) {
        assertCreateAndGetAllResponse(_.extend(_.omit(testBody, 'immune'),
            {username: 'Hung', categoryId: 39}), true, done);
    });


    it("should create immune=true reviewer successfully with f2f category id in body", function (done) {
        assertCreateAndGetAllResponse(_.extend(_.omit(testBody, 'immune'),
            {username: 'liquid_user', categoryId: 38}), true, done);
    });

});
