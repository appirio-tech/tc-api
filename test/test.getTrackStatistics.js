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
var SQL_DIR = __dirname + '/sqls/getTrackStatistics/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Track Statistics API', function () {
    this.timeout(60000);

    var errorObject = require('../test/test_files/expected_get_track_statistics_error_message');

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__clean', 'tcs_catalog', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__clean', 'informixoltp', cb);
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
                testHelper.runSqlFiles(testHelper.generatePartPaths(SQL_DIR + 'tcs_catalog__insert_test_data', '', 2), 'tcs_catalog', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__insert_test_data', 'informixoltp', cb);
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
     * Create a http request and test it.
     * @param {String} url - the request url.
     * @param {Number} expectStatus - the expected request response status.
     * @param {Object} authHeader - the auth header for request.
     * @param {Function} cb - the call back function.
     */
    function createRequest(url, expectStatus, authHeader, cb) {
        var req = request(API_ENDPOINT)
            .get('/v2/platform/statistics/' + url)
            .set('Accept', 'application/json');
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        req.expect('Content-Type', /json/)
            .expect(expectStatus)
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
        createRequest(url, expectStatus, authHeader, function (err, result) {
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
     * Assert the success response.
     * @param {String} url - the request url
     * @param {String} expectResponse - the expected response file name.
     * @param {Function} cb - the callback function.
     */
    function assertSuccess(url, expectResponse, cb) {
        createRequest(url,  200, null, function (err, res) {
            testHelper.assertResponse(err, res, expectResponse, cb);
        });
    }

    /**
     * The track parameter is invalid.
     */
    it('should return bad Request. The track parameter is invalid.', function (done) {
        assertBadResponse('abc', 400, errorObject.invalidTrack, null, done);
    });

    /**
     * The startDate is invalid.
     */
    it('should return bad Request. The startDate is invalid in format.', function (done) {
        assertBadResponse('develop?startDate=01-01-2013', 400, errorObject.startDate.invalid, null, done);
    });

    /**
     * The startDate is invalid.
     */
    it('should return bad Request. The startDate is invalid in value.', function (done) {
        assertBadResponse('develop?startDate=2013-13-01', 400, errorObject.startDate.invalid, null, done);
    });

    /**
     * The endDate is invalid.
     */
    it('should return bad Request. The endDate is invalid in format.', function (done) {
        assertBadResponse('develop?endDate=01-01-2013', 400, errorObject.endDate.invalid, null, done);
    });

    /**
     * The endDate is invalid.
     */
    it('should return bad Request. The endDate is invalid in value.', function (done) {
        assertBadResponse('develop?endDate=2013-13-01', 400, errorObject.endDate.invalid, null, done);
    });

    /**
     * The startDate is later than endDate
     */
    it('should return bad Request. The startDate is later than endDate.', function (done) {
        assertBadResponse('develop?startDate=2013-1-1&endDate=2012-1-1', 400, errorObject.invalidDates, null, done);
    });

    /**
     * The success response for develop track.
     */
    it('should return success results for develop track.', function (done) {
        assertSuccess('develop', 'test_files/expected_get_track_statistics_develop', done);
    });

    /**
     * The success response for design track.
     */
    it('should return success results for design track.', function (done) {
        assertSuccess('design', 'test_files/expected_get_track_statistics_design', done);
    });

    /**
     * The success response for data track.
     */
    it('should return success results for data track.', function (done) {
        assertSuccess('data', 'test_files/expected_get_track_statistics_data', done);
    });

    /**
     * Test startDate filter.
     */
    it('should return success results for develop track. Test filter startDate.', function (done) {
        assertSuccess('develop?startDate=2014-04-18', 'test_files/expected_get_track_statistics_1', done);
    });

    /**
     * Test endDate filter.
     */
    it('should return success results for develop track. Test filter endDate.', function (done) {
        assertSuccess('develop?endDate=2014-04-23', 'test_files/expected_get_track_statistics_2', done);
    });

    /**
     * Test startDate and endDate filter.
     */
    it('should return success results for develop track. Test filter startDate and endDate.', function (done) {
        assertSuccess('develop?startDate=2014-04-18&endDate=2014-04-23', 'test_files/expected_get_track_statistics_3', done);
    });
});
