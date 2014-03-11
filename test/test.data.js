/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach, __dirname */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var expect = require('chai').expect;
var async = require('async');
var _ = require('underscore');
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var SQL_DIR = __dirname + "/sqls/data/";

describe('', function () {
    this.timeout(60000); // The api with testing remote db could be quit slow
    var memberHeader;

    /**
     * Create authorization header before each test
     * @param {Function<err>} done the callback
     */
    beforeEach(function (done) {
        memberHeader = "Bearer " + testHelper.getMemberJwt();
        done();
    });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
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
     * @param {String} url the request url
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(url, statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/data/' + url)
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect(statusCode);
    }

    /**
     * Make request and verify result
     * @param {String} url the request url
     * @param {String} authHeader the Authorization header. Optional
     * @param {Function<err>} done - the callback
     */
    function assertResponse(url, authHeader, key, expected, done) {
        createRequest(url, 200, authHeader)
            .end(function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                assert.ok(result.body);
                assert.ok(result.body.count);
                assert.equal(result.body.count, expected.length);
                assert.ok(result.body[key]);
                assert.deepEqual(result.body[key], expected);
                done();
            });
    }

    /**
     * Get response and assert response
     * @param {String} url the request url
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(url, statusCode, authHeader, errorMessage, done) {
        createRequest(url, statusCode, authHeader)
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

    describe('Test Platforms API', function () {
        /**
         * It should return 401 error for anonymouse user
         */
        it("should return 401 error for anonymouse user", function (done) {
            assertErrorResponse('platforms', 401, null, null, done);
        });

        /**
         * It should return 200 success for any user and valid platforms data
         */
        it("should return 200 success for any user and valid platforms data", function (done) {
            assertResponse('platforms', memberHeader, 'platforms',
                ["AWS", "Cloud Foundry", "Google", "Heroku", "Salesforce.com"], done);
        });
    });

    describe('Test Technologies API', function () {
        /**
         * It should return 401 error for anonymouse user
         */
        it("should return 401 error for anonymouse user", function (done) {
            assertErrorResponse('technologies', 401, null, null, done);
        });

        /**
         * It should return 200 success for any user and valid technologies data
         */
        it("should return 200 success for any user and valid technologies data", function (done) {
            assertResponse('technologies', memberHeader, 'technologies',
                ["EJB", "J2EE", "JSP", "Java", "JavaBean", "Servlet"], done);
        });
    });
});
