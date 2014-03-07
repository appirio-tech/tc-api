/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author muzehyun
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
var SQL_DIR = __dirname + "/sqls/validateHandle/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Test Register Member API', function () {
    this.timeout(120000); // The api with testing remote db could be quit slow

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
            function (cb) {
                clearDb(cb);
            }, function (cb) {
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
     * @param {String} queryString the query string. Optional
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(handle, statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/users/validate/' + (handle || ""))
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
    function assertResponse(handle, authHeader, done) {
        createRequest(handle, 200, authHeader)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var body = res.body;
                assert.ok(body.valid);
                assert.isTrue(body.valid);
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
    function assertErrorResponse(handle, statusCode, authHeader, errorMessage, done) {
        createRequest(handle, statusCode, authHeader)
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
     * It should result success for handle with length 15
     */
    it('should result success for handle with length 15', function (done) {
        assertResponse('abcdeabcdeabcde', null, done);
    });

    /**
     * It should result success for handle with length 2
     */
    it('should result success for handle with length 2', function (done) {
        assertResponse('ab', null, done);
    });

    /**
     * It should return success for handle with alpabet and valid punctuations
     */
    it('should return success for handle with alpabet and valid punctuations', function (done) {
        assertResponse('a-_.{}[]', null, done);
    });

    /**
     * It should return success for handle with digit and valid punctuations
     */
    it('should return success for handle with digit and valid punctuations', function (done) {
        assertResponse('1-_.{}[]', null, done);
    });

    /**
     * It should return error for too short handle (< 2)
     */
    it('should return error for too short handle (< 2)', function (done) {
        assertErrorResponse('a', 400, null,
            'Length of handle in character should be between 2 and 15', done);
    });

    /**
     * It should return error for too long handle (> 15)
     */
    it('should return error for too long handle (> 15)', function (done) {
        assertErrorResponse('abcdeabcdeabcdea', 400, null,
            'Length of handle in character should be between 2 and 15', done);
    });

    /**
     * It should return error for handle with space (converted to invalid charactoer %20)
     */
    it('should return error for handle with space (converted to invalid charactoer %20)', function (done) {
        assertErrorResponse('abc def', 400, null, 'The handle may contain only letters, numbers and -_.{}[]', done);
    });

    /**
     * It should return error for handle with invalid punctuation
     */
    it('should return error for handle with invalid punctuation', function (done) {
        assertErrorResponse('abc!', 400, null, 'The handle may contain only letters, numbers and -_.{}[]', done);
    });

    /**
     * It should return error for handle with only punctuations
     */
    it('should return error for handle with only punctuations', function (done) {
        assertErrorResponse('-_.{}[]', 400, null, 'The handle may not contain only punctuation', done);
    });

    /**
     * It should return error for handle with word "admin"
     */
    it('should return error for handle with word "admin"', function (done) {
        assertErrorResponse('admin123', 400, null, 'Please choose another handle, not starting with admin', done);
    });

    /**
     * It should return error for handle with invalid word for handle
     */
    it('should return error for handle with invalid word for handle', function (done) {
        assertErrorResponse('duck', 400, null, 'The handle you entered is not valid', done);
    });

    /**
     * It should return error for handle with invalid word for handle and leading digits
     */
    it('should return error for handle with invalid word for handle and leading digits', function (done) {
        assertErrorResponse('123duck', 400, null, 'The handle you entered is not valid', done);
    });

    /**
     * It should return error for handle with invalid word for handle and trailing digits
     */
    it('should return error for handle with invalid word for handle and trailing digits', function (done) {
        assertErrorResponse('duck123', 400, null, 'The handle you entered is not valid', done);
    });

    /**
     * It should return error for handle with invalid word for handle and digits on both sides
     */
    it('should return error for handle with invalid word for handle and digits on both sides', function (done) {
        assertErrorResponse('123duck123', 400, null, 'The handle you entered is not valid', done);
    });

    /**
     * It should return error for handle with invalid word for handle and trailing "s"
     */
    it('should return error for handle with invalid word for handle and trailing "s"', function (done) {
        assertErrorResponse('ducks', 400, null, 'The handle you entered is not valid', done);
    });

    /**
     * It should return error for handle with invalid word for handle and trailing "s" and other letters
     */
    it('should return error for handle with invalid word for handle and trailing "s" and other letters', function (done) {
        assertErrorResponse('ducksabc', 400, null, 'The handle you entered is not valid', done);
    });

    /**
     * It should return error for handle with invalid word for handle and trailing "es"
     */
    it('should return error for handle with invalid word for handle and trailing "es"', function (done) {
        assertErrorResponse('duckes', 400, null, 'The handle you entered is not valid', done);
    });

    /**
     * It should return error for handle with invalid word for handle and trailing "es" and other letters
     */
    it('should return error for handle with invalid word for handle and trailing "es" and other letters', function (done) {
        assertErrorResponse('duckesabc', 400, null, 'The handle you entered is not valid', done);
    });

    /**
     * It should return error for handle with existing handle
     */
    it('should return error for handle with existing handle', function (done) {
        assertErrorResponse('super', 400, null, 'Handle super has already been taken', done);
    });
});
