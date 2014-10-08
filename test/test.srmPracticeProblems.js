/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Ghost_141
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/srmPracticeProblems/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Test SRM Practice Problems API', function () {
    this.timeout(120000); // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/srmPracticeProblems/expected_srm_practice_problems_error_message'),
        heffan = testHelper.generateAuthHeader({ sub: 'ad|132456' }),
        userSuper = testHelper.generateAuthHeader({ sub: 'ad|132457' });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "informixoltp__clean", "informixoltp", done);
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
                testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_test_data", "informixoltp", cb);
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
            .get('/v2/data/srm/practice/problems/' + url)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        req.expect(expectStatus)
            .end(cb);
    }

    /**
     * Make request to SRM Practice Problems API and compare verify response
     * @param {String} url - the url used to passed to endpoint. Optional
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} expectedFile - The file name that store the expected api response.
     * @param {Function} done - the callback
     */
    function assertResponse(url, authHeader, expectedFile, done) {
        createGetRequest(url, 200, authHeader, function (err, res) {
            testHelper.assertResponse(err, res, 'test_files/srmPracticeProblems/' + expectedFile, done);
        });
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

    /**
     * Test when pageIndex is negative.
     */
    it('should return bad request. The pageIndex is negative.', function (done) {
        assertBadResponse('?pageIndex=-2', 400, errorObject.pageIndex.negative, heffan, done);
    });

    /**
     * Test when pageIndex is zero.
     */
    it('should return bad request. The pageIndex is zero.', function (done) {
        assertBadResponse('?pageIndex=0', 400, errorObject.pageIndex.negative, heffan, done);
    });

    /**
     * Test when pageIndex is too big.
     */
    it('should return bad request. The pageIndex is too big.', function (done) {
        assertBadResponse('?pageIndex=2147483648', 400, errorObject.pageIndex.tooBig, heffan, done);
    });

    /**
     * Test when pageIndex is not integer.
     */
    it('should return bad request. The pageIndex is not integer.', function (done) {
        assertBadResponse('?pageIndex=1.2345', 400, errorObject.pageIndex.notInteger, heffan, done);
    });

    /**
     * Test when pageIndex is not number.
     */
    it('should return bad request. The pageIndex is not number.', function (done) {
        assertBadResponse('?pageIndex=abc', 400, errorObject.pageIndex.notNumber, heffan, done);
    });

    /**
     * Test when pageSize is negative.
     */
    it('should return bad request. The pageSize is negative.', function (done) {
        assertBadResponse('?pageSize=-2', 400, errorObject.pageSize.negative, heffan, done);
    });

    /**
     * Test when pageSize is zero.
     */
    it('should return bad request. The pageSize is zero.', function (done) {
        assertBadResponse('?pageSize=0', 400, errorObject.pageSize.negative, heffan, done);
    });

    /**
     * Test when pageSize is too big.
     */
    it('should return bad request. The pageSize is too big.', function (done) {
        assertBadResponse('?pageSize=2147483648', 400, errorObject.pageSize.tooBig, heffan, done);
    });

    /**
     * Test when pageSize is not integer.
     */
    it('should return bad request. The pageSize is not integer.', function (done) {
        assertBadResponse('?pageSize=1.2345', 400, errorObject.pageSize.notInteger, heffan, done);
    });

    /**
     * Test when pageSize is not number.
     */
    it('should return bad request. The pageSize is not number.', function (done) {
        assertBadResponse('?pageSize=abc', 400, errorObject.pageSize.notNumber, heffan, done);
    });

    /**
     * Test when sort order is invalid.
     */
    it('should return bad request. The sortOrder is invalid.', function (done) {
        assertBadResponse('?sortOrder=abc', 400, errorObject.invalidSortOrder, heffan, done);
    });

    /**
     * Test when sortColumn is invalid.
     */
    it('should return bad request. The sortColumn is invalid.', function (done) {
        assertBadResponse('?sortColumn=abc', 400, errorObject.invalidSortColumn, heffan, done);
    });

    /**
     * Test anonymous call.
     */
    it('should return unauthorized error. The caller is anonymous.', function (done) {
        assertBadResponse('', 401, errorObject.unauthorized, null, done);
    });

    /**
     * Test invalid status filter.
     */
    it('should return bad request. The status filter is invalid.', function (done) {
        assertBadResponse('?statuses=abc', 400, errorObject.invalidStatus, heffan, done);
    });

    /**
     * Test invalid problemTypes filter.
     */
    it('should return bad request. The problemTypes filter is invalid.', function (done) {
        assertBadResponse('?problemTypes=abc', 400, errorObject.invalidProblemTypes, heffan, done);
    });

    /**
     * Test invalid difficulty filter.
     */
    it('should return bad request. The difficulty filter is invalid.', function (done) {
        assertBadResponse('?difficulty=abc', 400, errorObject.invalidDifficulty, heffan, done);
    });

    /**
     * Test success call.
     */
    it('should return success results.', function (done) {
        assertResponse('', heffan, 'expected_srm_practice_problems_1', done);
    });

    /**
     * Test success call. The caller is super.
     */
    it('should return success results. The caller is super', function (done) {
        assertResponse('', userSuper, 'expected_srm_practice_problems_2', done);
    });

    /**
     * Test problemId filter.
     */
    it('should return success results. Test problemId filter.', function (done) {
        assertResponse('?problemId=2001', heffan, 'expected_srm_practice_problems_3', done);
    });

    /**
     * Test problemName filter.
     */
    it('should return success results. Test problemName filter.', function (done) {
        assertResponse('?problemName=problem 2002', heffan, 'expected_srm_practice_problems_4', done);
    });

    /**
     * Test problemType filter.
     */
    it('should return success results. Test problemType filter with single value.', function (done) {
        assertResponse('?problemTypes=single', heffan, 'expected_srm_practice_problems_5', done);
    });

    it('should return success results. Test problemType filter with multiple values.', function (done) {
        assertResponse('?problemTypes=single,long', heffan, 'expected_srm_practice_problems_1', done);
    });

    it('should return success results. Test difficulty filter.', function (done) {
        assertResponse('?difficulty=Easy', heffan, 'expected_srm_practice_problems_6', done);
    });

    it('should return success results. Test points range filter.', function (done) {
        assertResponse('?pointsLowerBound=100&pointsUpperBound=400', heffan, 'expected_srm_practice_problems_7', done);
    });

    it('should return success results. Test points lower bound filter only.', function (done) {
        assertResponse('?pointsLowerBound=300', heffan,  'expected_srm_practice_problems_8', done);
    });

    it('should return success results. Test status filter.', function (done) {
        assertResponse('?statuses=viewed', heffan, 'expected_srm_practice_problems_9', done);
    });

    it('should return success results. Test myPoints range filter.', function (done) {
        assertResponse('?myPointsUpperBound=120&myPointsLowerBound=85', heffan, 'expected_srm_practice_problems_10', done);
    });

    it('should return success results. Test myPoints upper bound filter.', function (done) {
        assertResponse('?myPointsUpperBound=90', heffan, 'expected_srm_practice_problems_11', done);
    });

});
