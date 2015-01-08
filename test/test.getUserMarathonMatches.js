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
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/getUserMarathonMatches/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get User Marathon Matches API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    var msgObj = require('../test/test_files/getUserMarathonMatches/expected_get_user_marathon_matches_error_message');

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clean", "topcoder_dw", done);
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
                testHelper.runSqlFile(SQL_DIR + 'topcoder_dw__insert_test_data', 'topcoder_dw', cb);
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
     * @param {String} handle - the request user handle.
     * @param {Number} expectStatus - the expected response status code.
     * @param {String} query - The query used in http request.
     * @param {Function} cb - the call back function.
     */
    function createGetRequest(handle, expectStatus, query, cb) {
        request(API_ENDPOINT)
            .get('/v2/user/' + handle + '/challenges/marathon' + query)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(expectStatus)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {String} handle - the request handle
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {String} query - The query used in http request.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(handle, query, expectStatus, errorMessage, cb) {
        createGetRequest(handle, expectStatus, query, function (err, result) {
            if (!err) {
                assert.equal(result.body.error.details, errorMessage, 'invalid error message');
            } else {
                cb(err);
                return;
            }
            cb();
        });
    }

    function assertSuccessResponse(handle, query, expectedResponse, cb) {
        createGetRequest(handle, 200, query, function (err, result) {
            testHelper.assertResponse(err, result, expectedResponse, cb);
        });
    }

    /**
     * Test when user handle is too long.
     */
    it('should return bad request. The user handle is too long.', function (done) {
        assertBadResponse('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', '', 400, msgObj.handle.tooLong, done);
    });

    /**
     * Test when user handle is not existed.
     */
    it('should return bad request. The user handle is not existed.', function (done) {
        assertBadResponse('abc', '', 404, msgObj.handle.notExisted, done);
    });

    /**
     * Test when pageIndex is not integer.
     */
    it('should return bad request. The pageIndex is not integer.', function (done) {
        assertBadResponse('heffan', '?pageIndex=1.2345', 400, msgObj.pageIndex.notInteger, done);
    });

    /**
     * Test when pageIndex is not number.
     */
    it('should return bad request. The pageIndex is not number.', function (done) {
        assertBadResponse('heffan', '?pageIndex=abc', 400, msgObj.pageIndex.notNumber, done);
    });

    /**
     * Test when pageIndex is zero.
     */
    it('should return bad request. The pageIndex is zero.', function (done) {
        assertBadResponse('heffan', '?pageIndex=0', 400, msgObj.pageIndex.notPositive, done);
    });

    /**
     * Test when pageIndex is too big.
     */
    it('should return bad request. The pageIndex is too big.', function (done) {
        assertBadResponse('heffan', '?pageIndex=2147483648', 400, msgObj.pageIndex.tooBig, done);
    });

    /**
     * Test when pageIndex is not positive and not -1.
     */
    it('should return bad request. The pageIndex is not positive and not -1.', function (done) {
        assertBadResponse('heffan', '?pageIndex=-2', 400, msgObj.pageIndex.notPositive, done);
    });

    /**
     * Test when pageSize is not integer.
     */
    it('should return bad request. The pageSize is not integer.', function (done) {
        assertBadResponse('heffan', '?pageSize=1.2345', 400, msgObj.pageSize.notInteger, done);
    });

    /**
     * Test when pageSize is not number.
     */
    it('should return bad request. The pageSize is not number.', function (done) {
        assertBadResponse('heffan', '?pageSize=abc', 400, msgObj.pageSize.notNumber, done);
    });

    /**
     * Test when pageSize is not positive.
     */
    it('should return bad request. The pageSize is not positive.', function (done) {
        assertBadResponse('heffan', '?pageSize=-1', 400, msgObj.pageSize.notPositive, done);
    });

    /**
     * Test when pageSize is zero.
     */
    it('should return bad request. The pageSize is zero.', function (done) {
        assertBadResponse('heffan', '?pageSize=0', 400, msgObj.pageSize.notPositive, done);
    });

    /**
     * Test when pageSize is too big.
     */
    it('should return bad request. The pageSize is too big.', function (done) {
        assertBadResponse('heffan', '?pageSize=2147483648', 400, msgObj.pageSize.tooBig, done);
    });

    /**
     * Test when sortOrder is invalid.
     */
    it('should return bad request. The sortOrder is invalid.', function (done) {
        assertBadResponse('heffan', '?sortOrder=abc&sortColumn=id', 400, msgObj.invalidSortOrder, done);
    });

    /**
     * Test when sortColumn is invalid.
     */
    it('should return bad request. The sortColumn is invalid.', function (done) {
        assertBadResponse('heffan', '?sortColumn=abc', 400, msgObj.invalidSortColumn, done);
    });

    /**
     * Test when sortColumn is missing.
     */
    it('should return bad request. The sortColumn is missing.', function (done) {
        assertBadResponse('heffan', '?sortOrder=abc', 400, msgObj.missingSortColumn, done);
    });

    /**
     * Test when user is not activated.
     */
    it('should return bad request. The user is unactivated.', function (done) {
        assertBadResponse('user3', '', 400, msgObj.notActivatedUser, done);
    });

    /**
     * Test success results.
     */
    it('should return success results.', function (done) {
        assertSuccessResponse('heffan', '', 'test_files/getUserMarathonMatches/expected_response_1', done);
    });

    /**
    * The given user hasn't do any marathon matches.
    */
    it('should return success results. The given user have no marathon matches.', function (done) {
        assertSuccessResponse('user10', '', 'test_files/getUserMarathonMatches/expected_response_2', done);
    });

    /**
    * Test pageIndex filter.
    */
    it('should return success results. Test pageIndex filter.', function (done) {
        assertSuccessResponse('heffan', '?pageIndex=2', 'test_files/getUserMarathonMatches/expected_response_3', done);
    });

    /**
     * Test pageIndex = -1.
     */
    it('should return success results. Test pageIndex = -1.', function (done) {
        assertSuccessResponse('heffan', '?pageIndex=-1', 'test_files/getUserMarathonMatches/expected_response_7', done);
    });

    /**
    * Test pageSize filter.
    */
    it('should return success results. Test pageSize filter.', function (done) {
        assertSuccessResponse('heffan', '?pageSize=1', 'test_files/getUserMarathonMatches/expected_response_4', done);
    });

    /**
    * Test sortOrder filter.
    */
    it('should return success results. Test sortOrder filter.', function (done) {
        assertSuccessResponse('heffan', '?sortOrder=desc&sortColumn=id', 'test_files/getUserMarathonMatches/expected_response_5', done);
    });

    /**
    * Test sortColumn filter.
    */
    it('should return success results. Test sortColumn filter.', function (done) {
        assertSuccessResponse('heffan', '?sortColumn=numContestants', 'test_files/getUserMarathonMatches/expected_response_6', done);
    });

});
