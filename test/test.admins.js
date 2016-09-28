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


describe('Get Admins API', function () {
    this.timeout(60000);     // The api with testing remote db could be quit slow
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
        clearDb(done);
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
     * @return {Object} request
     */
    function createRequest(statusCode, authHeader) {
        var url = "/v2/admin/admins",
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
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(statusCode, authHeader, errorMessage, done) {
        createRequest(statusCode, authHeader)
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
     * @param {String} file - the file which contains expected response
     * @param {Function<err>} done - the callback
     */
    function assertResponse(authHeader, file, done) {
        createRequest(200, authHeader)
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
        assertErrorResponse(401, null, "You need to login for this api.", done);

    });

    it("should return forbidden error for not admin token", function (done) {
        assertErrorResponse(403, memberHeader, "You don\'t have access to this api.", done);
    });

    it("should return admins", function (done) {
        assertResponse(adminHeader, "expect_get_admins", done);
    });

});
