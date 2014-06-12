/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author  Ghost_141
 */
'use strict';
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var _ = require('underscore');
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var S = require('string');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/getUserSubmissions/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get User Submissions API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    var msgObj = require('../test/test_files/expected_get_user_submissions_response_message'),
        member1 = testHelper.generateAuthHeader({ sub: 'ad|132456' }),
        member2 = testHelper.generateAuthHeader({ sub: 'ad|132458' });

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
            clearDb,
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__insert_test_data', 'tcs_catalog', cb);
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
     * create a http request and test it.
     * @param {String} url - the request url.
     * @param {Number} expectStatus - the expected response status code.
     * @param {Object} authHeader - the auth header.
     * @param {Function} cb - the call back function.
     */
    function createGetRequest(url, expectStatus, authHeader, cb) {
        var req = request(API_ENDPOINT)
            .get('/v2/challenges/submissions/' + url + '/mySubmissions')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        req.expect(expectStatus)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {String} url - the request url
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} authHeader - the request auth header.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(url, expectStatus, errorMessage, authHeader, cb) {
        createGetRequest(url, expectStatus, authHeader, function (err, result) {
            if (!err) {
                assert.equal(result.body.error.details, errorMessage, 'invalid error message');
            } else {
                cb(err);
                return;
            }
            cb();
        });
    }

    function assertSuccessResponse(url, authHeader, expectedResponse, cb) {
        createGetRequest(url, 200, authHeader, function (err, result) {
            testHelper.assertResponse(err, result, expectedResponse, cb);
        });
    }

    /**
     * Test when caller is anonymous.
     */
    it('should return unauthorized Error. The caller is anonymous.', function (done) {
        assertBadResponse('2001', 401, msgObj.unauthorized, null, done);
    });


    /**
     * Test when challengeId is not number.
     */
    it('should return bad request. The challengeId is not number.', function (done) {
        assertBadResponse('abc', 400, msgObj.challengeId.notNumber, member1, done);
    });

    /**
     * Test when challengeId is not integer.
     */
    it('should return bad request. The challengeId is not integer.', function (done) {
        assertBadResponse('1.2345', 400, msgObj.challengeId.notInteger, member1, done);
    });

    /**
     * Test when challengeId is not positive.
     */
    it('should return bad request. The challengeId is not positive.', function (done) {
        assertBadResponse('-1', 400, msgObj.challengeId.notPositive, member1, done);
    });

    /**
     * Test when challengeId is zero.
     */
    it('should return bad request. The challengeId is zero.', function (done) {
        assertBadResponse('0', 400, msgObj.challengeId.notPositive, member1, done);
    });

    /**
     * Test when challengeId is too big.
     */
    it('should return bad request. The challengeId is too big.', function (done) {
        assertBadResponse('2147483648', 400, msgObj.challengeId.tooBig, member1, done);
    });

    it('should return not found error. The challenge is not existed', function (done) {
        assertBadResponse('2003', 404, msgObj.notFound, member1, done);
    });

    it('should return success results. The challenge is a software challenge.', function (done) {
        assertSuccessResponse("2001", member1, "test_files/expected_get_user_submissions_1", done);
    });

    it('should return success results. The empty submissions array', function (done) {
        assertSuccessResponse("2001", member2, "test_files/expected_get_user_submissions_2", done);
    });

    it('should return success results. The challenge is a studio challenge.', function (done) {
        assertSuccessResponse("2002", member1, "test_files/expected_get_user_submissions_3", done);
    });
});
