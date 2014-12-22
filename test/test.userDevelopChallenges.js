/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author  TCSASSEMBLER
 */
'use strict';
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var _ = require('underscore');
var request = require('supertest');
var assert = require('chai').assert;
var expect = require('chai').expect;
var async = require('async');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/userChallenges/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

var userHandle = 'super';
describe('Get user challenges API', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_get_user_challenges_error_message');

    /**
     * create a http request and test it.
     * @param {String} url - the request url.
     * @param {Number} expectStatus - the expected response status code.
     * @param {Function} cb - the call back function.
     */
    function createGetRequest(url, expectStatus, cb) {
        request(API_ENDPOINT)
            .get(url)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(expectStatus)
            .end(cb);
    }

    /**
     * Assert the bad request
     * @param {String} url - the request url.
     * @param {Number} expectStatus - the expected response status code.
     * @param {String} expectMessage - the expected error message.
     * @param {Function} cb - the call back function.
     */
    function assertBadCall(url, expectStatus, expectMessage, cb) {
        createGetRequest(url, expectStatus, function (err, result) {
            if (err) {
                cb(err);
                return;
            }
            assert.equal(result.body.error.details, expectMessage, 'invalid error message');
            cb();
        });
    }

    describe('--Get User Develop Challenges API--', function () {
        var URL = '/v2/user/' + userHandle + '/challenges/develop';

        /**
         * Clear database
         * @param {Function<err>} done the callback
         */
        function clearDb(done) {
            async.waterfall([
                function (cb) {
                    testHelper.runSqlFile(SQL_DIR + 'tcs_dw__clean', 'tcs_dw', cb);
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
                    testHelper.runSqlFile(SQL_DIR + 'tcs_dw__insert_test_data', 'tcs_dw', cb);
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
         * Assert the response.
         * @param err the error.
         * @param result the actual result.
         * @param filePath the expected response.
         * @param cb the callback.
         */
        function assertResponse(err, result, filePath, cb) {
            if (err) {
                cb(err);
                return;
            }
            var expected = require('../test/test_files/' + filePath),
                actual = testHelper.getTrimmedData(result.res.text);
            assert.deepEqual(actual, expected, 'invalid response');
            cb();
        }


        /**
         * Test /v2/user/{handle}/challenges/develop.
         */
        it('should return 404 not found. User does not exist.', function (done) {
            assertBadCall('/v2/user/notFoundUserHandle/challenges/develop', 404, errorObject.user.notFound, done);
        });

        /**
         * Test /v2/user/{handle}/challenges/develop.
         */
        it('should return 400 bad request. User is not activated.', function (done) {
            assertBadCall('/v2/user/super2/challenges/develop', 400, errorObject.user.notActived, done);
        });


        /**
         * Test for success results
         */
        it('should return success results.', function (done) {
            createGetRequest(URL + '?pageIndex=1&pageSize=2&sortOrder=asc&sortColumn=id', 200, function (err, result) {
                assertResponse(err, result, 'expected_get_user_challenges_1', done);
            });
        });


        /**
         * Test when only pageSize is set.
         */
        it('should return success results. The pageSize is set but the pageIndex is not set.', function (done) {
            createGetRequest(URL + '?pageSize=10', 200, done);
        });

        /**
         * Test when only pageIndex is set.
         */
        it('should return bad results. The pageIndex is set but the pageSize is not set.', function (done) {
            createGetRequest(URL + '?pageIndex=1', 400, done);
        });

        /**
         * Test when only sortOrder is set.
         */
        it('should return success results. The sortOrder is set but the sortColumn is not set.', function (done) {
            createGetRequest(URL + '?sortOrder=asc', 200, done);
        });

        /**
         * Test when only sortColumn is set.
         */
        it('should return success results. The sortColumn is set but the sortOrder is not set.', function (done) {
            createGetRequest(URL + '?sortColumn=id', 200, done);
        });

        /**
         * Test when sortOrder is in upper case.
         */
        it('should return success results. The sortOrder is in upper case.', function (done) {
            createGetRequest(URL + '?sortOrder=ASC', 200, done);
        });

        /**
         * Test when sortColumn is in upper case.
         */
        it('should return success results. The sortColumn is in upper case', function (done) {
            createGetRequest(URL + '?sortColumn=ID', 200, done);
        });

        /**
         * Test /v2/user/{handle}/challenges/develop?pageSize=-1.
         */
        it('should return bad request. The pageSize is negative', function (done) {
            assertBadCall(URL + '?pageSize=-1', 400, errorObject.pageSize.negative, done);
        });

        /**
         * Test /v2/user/{handle}/challenges/develop?pageSize=0.
         */
        it('should return bad request. The pageSize is zero.', function (done) {
            assertBadCall(URL + '?pageSize=0', 400, errorObject.pageSize.negative, done);
        });

        /**
         * Test /v2/user/{handle}/challenges/develop?pageSize=abc.
         */
        it('should return bad request. The pageSize is not a number.', function (done) {
            assertBadCall(URL + '?pageSize=abc', 400, errorObject.pageSize.notNumber, done);
        });

        /**
         * Test /v2/user/{handle}/challenges/develop?pageSize=1.234.
         */
        it('should return bad request. The pageSize is not integer.', function (done) {
            assertBadCall(URL + '?pageSize=1.234', 400, errorObject.pageSize.notInteger, done);
        });

        /**
         * Test /v2/user/{handle}/challenges/develop?pageSize=2147483648.
         */
        it('should return bad request. The pageSize is larger than 2147483647.', function (done) {
            assertBadCall(URL + '?pageSize=2147483648', 400, errorObject.pageSize.tooBig, done);
        });

        /**
         * Test /v2/user/{handle}/challenges/develop?pageIndex=-2&pageSize=10.
         */
        it('should return bad request. The pageIndex is negative', function (done) {
            assertBadCall(URL + '?pageIndex=-2&pageSize=10', 400, errorObject.pageIndex.negative, done);
        });

        /**
         * Test /v2/user/{handle}/challenges/develop?pageIndex=0&pageSize=10.
         */
        it('should return bad request. The pageIndex is zero.', function (done) {
            assertBadCall(URL + '?pageIndex=0&pageSize=10', 400, errorObject.pageIndex.negative, done);
        });

        /**
         * Test /v2/user/{handle}/challenges/develop?pageIndex=abc&pageSize=10.
         */
        it('should return bad request. The pageIndex is not a number.', function (done) {
            assertBadCall(URL + '?pageIndex=abc&pageSize=10', 400, errorObject.pageIndex.notNumber, done);
        });

        /**
         * Test /v2/user/{handle}/challenges/develop?pageIndex=1.234&pageSize=10.
         */
        it('should return bad request. The pageIndex is not integer.', function (done) {
            assertBadCall(URL + '?pageIndex=1.234&pageSize=10', 400, errorObject.pageIndex.notInteger, done);
        });

        /**
         * Test /v2/user/{handle}/challenges/develop?sortOrder=abc
         */
        it('should return bad request. The sortOrder is invalid.', function (done) {
            assertBadCall(URL + '?sortOrder=abc', 400, errorObject.sortOrder.invalid, done);
        });

        /**
         * Test when sort column is invalid.
         */
        it('should return bad request. The sortColumn is invalid.', function (done) {
            assertBadCall(URL + '?sortColumn=abc', 400, errorObject.sortColumn.invalidColumn, done);
        });


        /**
         * Test id column
         */
        it('should return success results. Test sortColumn id.', function (done) {
            createGetRequest(URL + '?sortColumn=id', 200, done);
        });

        /**
         * Test type column
         */
        it('should return success results. Test sortColumn type.', function (done) {
            createGetRequest(URL + '?sortColumn=type', 200, done);
        });

        /**
         * Test placement column
         */
        it('should return success results. Test sortColumn placement.', function (done) {
            createGetRequest(URL + '?sortColumn=placement', 200, done);
        });

        /**
         * Test prize column
         */
        it('should return success results. Test sortColumn prize.', function (done) {
            createGetRequest(URL + '?sortColumn=prize', 200, done);
        });

        /**
         * Test numContestants column
         */
        it('should return success results. Test sortColumn numContestants.', function (done) {
            createGetRequest(URL + '?sortColumn=numContestants', 200, done);
        });

        /**
         * Test numSubmissions column
         */
        it('should return success results. Test sortColumn numSubmissions.', function (done) {
            createGetRequest(URL + '?sortColumn=numSubmissions', 200, done);
        });

        /**
         * Test codingDuration column
         */
        it('should return success results. Test sortColumn codingDuration.', function (done) {
            createGetRequest(URL + '?sortColumn=codingDuration', 200, done);
        });


    });


});
