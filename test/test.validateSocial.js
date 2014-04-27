/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
'use strict';
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/validateSocial/";

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Test Validate Social API', function () {
    this.timeout(30000); // The api with testing remote db could be quit slow

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
     * Get response and assert response from /api/v2/bugs/
     * @param {String} socialProviderId the social provider id
     * @param {String} socialUserId the social user id
     * @param {String} result the result
     * @param {Function<err>} done the callback
     */
    function assertResponse(socialProviderId, socialUserId, result, done) {
        request(API_ENDPOINT)
            .get('/api/v2/users/validateSocial?socialProviderId='
                + socialProviderId
                + '&socialUserId='
                + socialUserId)
            .set('Accept', 'application/json')
            .expect(200)
            .end(function (err, res) {
                assert.ifError(err);
                assert.ok(res.body);
                assert.equal(res.body.available, result);
                done(err);
            });
    }

    /**
     * Get response and assert response from /api/v2/bugs/
     * @param {Number} statusCode the expected status code
     * @param {String} socialProviderId the social provider id
     * @param {String} socialUserId the social user id
     * @param {String} errorMessage the expected error message. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(statusCode, socialProviderId, socialUserId, errorMessage, done) {
        request(API_ENDPOINT)
            .get('/api/v2/users/validateSocial?socialProviderId='
                + socialProviderId
                + '&socialUserId='
                + socialUserId)
            .set('Accept', 'application/json')
            .expect(statusCode)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                if (errorMessage) {
                    if (statusCode != 200) {
                        assert.ok(res.body);
                        assert.ok(res.body.error);
                        assert.equal(res.body.error.details, errorMessage);
                    } else if (statusCode === 200) {
                        assert.ok(res.body);
                        assert.ok(res.body.error);
                        assert.equal(res.body.error, errorMessage);
                    }
                }
                done();
            });
    }

    /**
     * Test /api/v2/users/validateSocial?socialProviderId=&socialUserId=
     */
    it('should return error if status is invalid value', function (done) {
        assertErrorResponse(200, '', '', 'Error: socialProviderId is a required parameter for this action', done);
    });

    /**
     * Test /api/v2/users/validateSocial?socialProviderId=&socialUserId=a
     */
    it('should return error if status is invalid value', function (done) {
        assertErrorResponse(200, '', 'a', 'Error: socialProviderId is a required parameter for this action', done);
    });

    /**
     * Test /api/v2/users/validateSocial?socialProviderId=a&socialUserId=
     */
    it('should return error if status is invalid value', function (done) {
        assertErrorResponse(200, 'a', '', 'Error: socialUserId is a required parameter for this action', done);
    });

    /**
     * Test /api/v2/users/validateSocial?socialProviderId=-1&socialUserId=a
     */
    it('should return error if status is invalid value', function (done) {
        assertErrorResponse(400, '-1', 'a', 'Social Provider ID must be integer', done);
    });

    /**
     * Test /api/v2/users/validateSocial?socialProviderId=a&socialUserId=a
     */
    it('should return error if status is invalid value', function (done) {
        assertErrorResponse(400, 'a', 'a', 'Social Provider ID must be integer', done);
    });

    /**
     * Test /api/v2/users/validateSocial?socialProviderId= &socialUserId=a
     */
    it('should return error if status is invalid value', function (done) {
        assertErrorResponse(400, ' ', 'a', 'Social Provider ID must be integer', done);
    });

    /**
     * Test /api/v2/users/validateSocial?socialProviderId=1000&socialUserId=a
     */
    it('should return error if status is invalid value', function (done) {
        assertErrorResponse(400, '1000', 'a', 'Social provider id is not valid.', done);
    });

    /**
     * Test /api/v2/users/validateSocial?socialProviderId=1&socialUserId=fb124764
     */
    it('should return results', function (done) {
        assertResponse("1", "fb124764", true, done);
    });

    /**
     * Test /api/v2/users/validateSocial?socialProviderId=1&socialUserId=fb124764a
     */
    it('should return results', function (done) {
        assertResponse("1", "fb124764a", false, done);
    });
});