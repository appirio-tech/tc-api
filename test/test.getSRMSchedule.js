/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
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
/*jslint nomen: true*/
var SQL_DIR = __dirname + '/sqls/srmSchedule/';
/*jslint nomen: false*/
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Test SRM Schedule API', function () {
    this.timeout(120000); // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/srmSchedule/expected_get_srm_schedule_error_message');

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
     * @param {Function} cb - the call back function.
     */
    function createGetRequest(url, expectStatus, cb) {
        var req = request(API_ENDPOINT)
            .get('/v2/data/srm/schedule/' + url)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
        req.expect(expectStatus)
            .end(cb);
    }

    /**
     * Make request to SRM Practice Problems API and compare verify response
     * @param {String} url - the url used to passed to endpoint. Optional
     * @param {String} expectedFile - The file name that store the expected api response.
     * @param {Function} done - the callback
     */
    function assertResponse(url, expectedFile, done) {
        createGetRequest(url, 200, function (err, res) {
            testHelper.assertResponse(err, res, 'test_files/srmSchedule/' + expectedFile, done);
        });
    }

    /**
     * assert the bad response.
     * @param {String} url - the request url
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(url, expectStatus, errorMessage, cb) {
        createGetRequest(url, expectStatus, function (err, result) {
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
     * Test when pageIndex is provided but the pageSize is not presented..
     */
    it('should return bad request. The pageSize must be presented if pageIndex exists.', function (done) {
        assertBadResponse('?pageIndex=1', 400, errorObject.pageSize.notExist, done);
    });

    /**
     * Test when pageIndex is negative.
     */
    it('should return bad request. The pageIndex is negative.', function (done) {
        assertBadResponse('?pageIndex=-2&pageSize=1', 400, errorObject.pageIndex.negative, done);
    });

    /**
     * Test when pageIndex is zero.
     */
    it('should return bad request. The pageIndex is zero.', function (done) {
        assertBadResponse('?pageIndex=0&pageSize=1', 400, errorObject.pageIndex.negative, done);
    });

    /**
     * Test when pageIndex is too big.
     */
    it('should return bad request. The pageIndex is too big.', function (done) {
        assertBadResponse('?pageIndex=2147483648&pageSize=1', 400, errorObject.pageIndex.tooBig, done);
    });

    /**
     * Test when pageIndex is not integer.
     */
    it('should return bad request. The pageIndex is not integer.', function (done) {
        assertBadResponse('?pageIndex=1.2345&pageSize=1', 400, errorObject.pageIndex.notInteger, done);
    });

    /**
     * Test when pageIndex is not number.
     */
    it('should return bad request. The pageIndex is not number.', function (done) {
        assertBadResponse('?pageIndex=abc&pageSize=1', 400, errorObject.pageIndex.notNumber, done);
    });

    /**
     * Test when pageSize is negative.
     */
    it('should return bad request. The pageSize is negative.', function (done) {
        assertBadResponse('?pageSize=-2', 400, errorObject.pageSize.negative, done);
    });

    /**
     * Test when pageSize is zero.
     */
    it('should return bad request. The pageSize is zero.', function (done) {
        assertBadResponse('?pageSize=0', 400, errorObject.pageSize.negative, done);
    });

    /**
     * Test when pageSize is too big.
     */
    it('should return bad request. The pageSize is too big.', function (done) {
        assertBadResponse('?pageSize=2147483648', 400, errorObject.pageSize.tooBig, done);
    });

    /**
     * Test when pageSize is not integer.
     */
    it('should return bad request. The pageSize is not integer.', function (done) {
        assertBadResponse('?pageSize=1.2345', 400, errorObject.pageSize.notInteger, done);
    });

    /**
     * Test when pageSize is not number.
     */
    it('should return bad request. The pageSize is not number.', function (done) {
        assertBadResponse('?pageSize=abc', 400, errorObject.pageSize.notNumber, done);
    });

    /**
     * Test when sort order is invalid.
     */
    it('should return bad request. The sortOrder is invalid.', function (done) {
        assertBadResponse('?sortOrder=abc', 400, errorObject.invalidSortOrder, done);
    });

    /**
     * Test when sortColumn is invalid.
     */
    it('should return bad request. The sortColumn is invalid.', function (done) {
        assertBadResponse('?sortColumn=abc', 400, errorObject.invalidSortColumn, done);
    });

    /**
     * Test invalid status filter.
     */
    it('should return bad request. The status filter is invalid.', function (done) {
        assertBadResponse('?statuses=abc', 400, errorObject.invalidStatus, done);
    });

    /**
     * Test invalid round types filter.
     */
    it('should return bad request. The types filter is invalid.', function (done) {
        assertBadResponse('?types=abc', 400, errorObject.invalidTypes, done);
    });

    /**
     * Test invalid registrationStartTimeBefore filter.
     */
    it('should return bad request. The registrationStartTimeBefore filter is invalid.', function (done) {
        assertBadResponse('?registrationStartTimeBefore=2014-12-11T05:10:00.000%2baa', 400, errorObject.registrationStartTimeBefore, done);
    });

    /**
     * Test invalid registrationStartTimeAfter filter.
     */
    it('should return bad request. The registrationStartTimeAfter filter is invalid.', function (done) {
        assertBadResponse('?registrationStartTimeAfter=2014-12-11T05:10:00.000%2baa', 400, errorObject.registrationStartTimeAfter, done);
    });

    /**
     * Test invalid registrationEndTimeBefore filter.
     */
    it('should return bad request. The registrationEndTimeBefore filter is invalid.', function (done) {
        assertBadResponse('?registrationEndTimeBefore=2014-12-11T05:10:00.000%2baa', 400, errorObject.registrationEndTimeBefore, done);
    });

    /**
     * Test invalid registrationEndTimeAfter filter.
     */
    it('should return bad request. The registrationEndTimeAfter filter is invalid.', function (done) {
        assertBadResponse('?registrationEndTimeAfter=2014-12-11T05:10:00.000%2baa', 400, errorObject.registrationEndTimeAfter, done);
    });

    /**
     * Test invalid codingStartTimeBefore filter.
     */
    it('should return bad request. The codingStartTimeBefore filter is invalid.', function (done) {
        assertBadResponse('?codingStartTimeBefore=2014-12-11T05:10:00.000%2baa', 400, errorObject.codingStartTimeBefore, done);
    });

    /**
     * Test invalid codingStartTimeAfter filter.
     */
    it('should return bad request. The codingStartTimeAfter filter is invalid.', function (done) {
        assertBadResponse('?codingStartTimeAfter=2014-12-11T05:10:00.000%2baa', 400, errorObject.codingStartTimeAfter, done);
    });

    /**
     * Test invalid codingEndTimeBefore filter.
     */
    it('should return bad request. The codingEndTimeBefore filter is invalid.', function (done) {
        assertBadResponse('?codingEndTimeBefore=2014-12-11T05:10:00.000%2baa', 400, errorObject.codingEndTimeBefore, done);
    });

    /**
     * Test invalid codingEndTimeAfter filter.
     */
    it('should return bad request. The codingEndTimeAfter filter is invalid.', function (done) {
        assertBadResponse('?codingEndTimeAfter=2014-12-11T05:10:00.000%2baa', 400, errorObject.codingEndTimeAfter, done);
    });

    /**
     * Test invalid intermissionStartTimeBefore filter.
     */
    it('should return bad request. The intermissionStartTimeBefore filter is invalid.', function (done) {
        assertBadResponse('?intermissionStartTimeBefore=2014-12-11T05:10:00.000%2baa', 400, errorObject.intermissionStartTimeBefore, done);
    });

    /**
     * Test invalid intermissionStartTimeAfter filter.
     */
    it('should return bad request. The intermissionStartTimeAfter filter is invalid.', function (done) {
        assertBadResponse('?intermissionStartTimeAfter=2014-12-11T05:10:00.000%2baa', 400, errorObject.intermissionStartTimeAfter, done);
    });

    /**
     * Test invalid intermissionEndTimeBefore filter.
     */
    it('should return bad request. The intermissionEndTimeBefore filter is invalid.', function (done) {
        assertBadResponse('?intermissionEndTimeBefore=2014-12-11T05:10:00.000%2baa', 400, errorObject.intermissionEndTimeBefore, done);
    });

    /**
     * Test invalid intermissionEndTimeAfter filter.
     */
    it('should return bad request. The intermissionEndTimeAfter filter is invalid.', function (done) {
        assertBadResponse('?intermissionEndTimeAfter=2014-12-11T05:10:00.000%2baa', 400, errorObject.intermissionEndTimeAfter, done);
    });

    /**
     * Test invalid challengeStartTimeBefore filter.
     */
    it('should return bad request. The challengeStartTimeBefore filter is invalid.', function (done) {
        assertBadResponse('?challengeStartTimeBefore=2014-12-11T05:10:00.000%2baa', 400, errorObject.challengeStartTimeBefore, done);
    });

    /**
     * Test invalid challengeStartTimeAfter filter.
     */
    it('should return bad request. The challengeStartTimeAfter filter is invalid.', function (done) {
        assertBadResponse('?challengeStartTimeAfter=2014-12-11T05:10:00.000%2baa', 400, errorObject.challengeStartTimeAfter, done);
    });

    /**
     * Test invalid challengeEndTimeBefore filter.
     */
    it('should return bad request. The challengeEndTimeBefore filter is invalid.', function (done) {
        assertBadResponse('?challengeEndTimeBefore=2014-12-11T05:10:00.000%2baa', 400, errorObject.challengeEndTimeBefore, done);
    });

    /**
     * Test invalid challengeEndTimeAfter filter.
     */
    it('should return bad request. The challengeEndTimeAfter filter is invalid.', function (done) {
        assertBadResponse('?challengeEndTimeAfter=2014-12-11T05:10:00.000%2baa', 400, errorObject.challengeEndTimeAfter, done);
    });

    /**
     * Test invalid systestStartTimeBefore filter.
     */
    it('should return bad request. The systestStartTimeBefore filter is invalid.', function (done) {
        assertBadResponse('?systestStartTimeBefore=2014-12-11T05:10:00.000%2baa', 400, errorObject.systestStartTimeBefore, done);
    });

    /**
     * Test invalid systestStartTimeAfter filter.
     */
    it('should return bad request. The systestStartTimeAfter filter is invalid.', function (done) {
        assertBadResponse('?systestStartTimeAfter=2014-12-11T05:10:00.000%2baa', 400, errorObject.systestStartTimeAfter, done);
    });

    /**
     * Test invalid systestEndTimeBefore filter.
     */
    it('should return bad request. The systestEndTimeBefore filter is invalid.', function (done) {
        assertBadResponse('?systestEndTimeBefore=2014-12-11T05:10:00.000%2baa', 400, errorObject.systestEndTimeBefore, done);
    });

    /**
     * Test invalid systestEndTimeAfter filter.
     */
    it('should return bad request. The systestEndTimeAfter filter is invalid.', function (done) {
        assertBadResponse('?systestEndTimeAfter=2014-12-11T05:10:00.000%2baa', 400, errorObject.systestEndTimeAfter, done);
    });

    /**
     * Test invalid registration start time period filter.
     */
    it('should return bad request. The registration start time filter is wrong..', function (done) {
        assertBadResponse('?registrationStartTimeBefore=2014-12-11T05:10:00.000%2b0800&registrationStartTimeAfter=2014-12-12T05:10:00.000%2b0800',
            400, errorObject.regTimePeriodError, done);
    });

    /**
     * Test success call.
     */
    it('should return success results.', function (done) {
        assertResponse('', 'expected_srm_schedule_1', done);
    });

    /**
     * Test statuses filter.
     */
    it('should return success results. Test statues filter.', function (done) {
        assertResponse('?statuses=A,F,P', 'expected_srm_schedule_2', done);
    });

    /**
     * Test types filter.
     */
    it('should return success results. Test types filter with full types.', function (done) {
        assertResponse('?types=Single%20Round%20Match,Long%20Round,Tournament%20Round', 'expected_srm_schedule_1', done);
    });

    /**
     * Test types filter.
     */
    it('should return success results. Test types filter with two types.', function (done) {
        assertResponse('?types=Single%20Round%20Match,Long%20Round', 'expected_srm_schedule_3', done);
    });

    /**
     * Test types filter.
     */
    it('should return success results. Test types filter with single value.', function (done) {
        assertResponse('?types=Tournament%20Round', 'expected_srm_schedule_4', done);
    });

    /**
     * Test sort function..
     */
    it('should return success results. Test sorting by the intermission start time ascending.', function (done) {
        assertResponse('?pageIndex=1&pageSize=2&sortColumn=intermissionstarttime&sortOrder=asc', 'expected_srm_schedule_5', done);
    });

    /**
     * Test sort function..
     */
    it('should return success results. Test sorting by the intermission start time descending.', function (done) {
        assertResponse('?pageIndex=1&pageSize=2&sortColumn=intermissionstarttime&sortOrder=desc', 'expected_srm_schedule_6', done);
    });

    /**
     * Test registrationStartDateBefore filter..
     */
    it('should return success results. Test filtering function by registrationStartDateBefore parameter.', function (done) {
        assertResponse('?registrationStartTimeBefore=2014-12-11T05:10:00.000%2b0800', 'expected_srm_schedule_1', done);
    });

    /**
     * Test registrationStartDateAfter filter..
     */
    it('should return success results. Test filtering function by registrationStartDateAfter parameter.', function (done) {
        assertResponse('?registrationStartTimeAfter=2014-12-11T05:10:00.000%2b0800', 'expected_srm_schedule_7', done);
    });

    /**
     * Test combined searching.
     */
    it('should return success results. Test combined filtering searching should be correct.', function (done) {
        assertResponse('?registrationStartTimeBefore=2014-12-11T05:10:00.000%2b0800&sortColumn=registrationStartTime&sortOrder=desc&types=Single%20Round%20Match,Long%20Round&statuses=a,f',
            'expected_srm_schedule_8', done);
    });

});
