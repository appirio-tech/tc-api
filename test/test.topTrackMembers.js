/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author muzehyun
 */
'use strict';
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
var SQL_DIR = __dirname + '/sqls/topTrackMembers/';
var EXPECTED_DIR = __dirname + '/test_files/topTrackMembers/';

describe('Test Top Track Members API', function () {
    this.timeout(60000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'topcoder_dw__clean', 'topcoder_dw', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_dw__clean', 'tcs_dw', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__clean', 'tcs_catalog', cb);
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
                var files = testHelper.generatePartPaths(SQL_DIR + 'topcoder_dw__insert_test_data', '', 3);
                testHelper.runSqlFiles(files, 'topcoder_dw', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_dw__insert_test_data', 'tcs_dw', cb);
            },
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
        // clearDb(done);
        done();
    });

    /**
     * Create request and return it
     * @param {String} params the params request parameters
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(params, statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/users/tops/' + params)
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect(statusCode);
    }

    /**
     * Make request
     * @param {String} params the params request parameters
     * @param {String} expectedName the expected response file name
     * @param {String} authHeader the Authorization header. Optional
     * @param {Function<err>} done - the callback
     */
    function assertResponse(params, expectedName, authHeader, done) {
        createRequest(params, 200, authHeader)
            .end(function (err, result) {
                assert.ifError(err);
                assert.ok(result.body);
                var response = result.body,
                    expectedResponse = require(EXPECTED_DIR + expectedName + '.json');
                delete response.serverInformation;
                delete response.requesterInformation;
                assert.deepEqual(response, expectedResponse);
                done();
            });
    }

    /**
     * Get response and assert response
     * @param {String} params the params request parameters
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(params, statusCode, authHeader, errorMessage, done) {
        createRequest(params, statusCode, authHeader)
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
     * It should return 400 error for invalid track type
     */
    it('should return 400 error for invalid track type', function (done) {
        assertErrorResponse('asdf', 400, null,
            'trackType should be an element of design,develop,data.', done);
    });

    /**
     * It should return 400 error for missing page size
     */
    it('should return 400 error for missing page size', function (done) {
        assertErrorResponse('design?pageIndex=2', 400, null,
            'pageSize should not be null or undefined', done);
    });

    /**
     * It should return 400 error for negative page index and negative page size
     */
    it('should return 400 error for negative page index and negative page size', function (done) {
        assertErrorResponse('design?pageIndex=-1&pageSize=-1', 400, null,
            'pageSize should be positive.', done);
    });

    /**
     * It should return 400 error for negative page index and 0 page size
     */
    it('should return 400 error for negative page index and 0 page size', function (done) {
        assertErrorResponse('design?pageIndex=-1&pageSize=0', 400, null,
            'pageSize should be positive.', done);
    });

    /**
     * It should return 400 error for 0 page index
     */
    it('should return 400 error for 0 page index', function (done) {
        assertErrorResponse('design?pageIndex=0&pageSize=-1', 400, null,
            'pageIndex should be equal to -1 or greater than 0', done);
    });

    /**
     * It should return 400 error for page index -2
     */
    it('should return 400 error for page index -2', function (done) {
        assertErrorResponse('design?pageIndex=-2&pageSize=1', 400, null,
            'pageIndex should be equal to -1 or greater than 0', done);
    });

    /**
     * It should return 400 error for positive page index and negative page size
     */
    it('should return 400 error for positive page index and negative page size', function (done) {
        assertErrorResponse('design?pageIndex=1&pageSize=-1', 400, null,
            'pageSize should be positive.', done);
    });

    /**
     * It should return 400 error for bigger than max page size
     */
    it('should return 400 error for bigger than max page size', function (done) {
        assertErrorResponse('design?pageIndex=1&pageSize=1001', 400, null,
            'pageSize should be less or equal to 1000.', done);
    });

    /**
     * It should return 400 error for bigger than max page index
     */
    it('should return 400 error for bigger than max page index', function (done) {
        assertErrorResponse('design?pageIndex=2147483648&pageSize=40', 400, null,
            'pageIndex should be less or equal to 2147483647.', done);
    });

    /**
     * It should return 200 success for design track type
     */
    it('should return 200 success for design track type', function (done) {
        assertResponse('design', 'expected_design', null, done);
    });

    /**
     * It should return 200 success for develop track type
     */
    it('should return 200 success for develop track type', function (done) {
        assertResponse('develop', 'expected_develop', null, done);
    });

    /**
     * It should return 200 success for data track type
     */
    it('should return 200 success for data track type', function (done) {
        assertResponse('data', 'expected_data', null, done);
    });

    /**
     * It should return 200 success for page size 100
     */
    it('should return 200 success for page size 100', function (done) {
        assertResponse('develop?pageSize=100', 'expected_develop_page_size_100', null, done);
    });

    /**
     * It should return 200 success for page index 10, page size 35
     */
    it('should return 200 success for page index 10, page size 35', function (done) {
        assertResponse('develop?pageIndex=10&pageSize=35', 'expected_develop_page_index_10', null, done);
    });

    /**
     * It should return 200 success for no paging
     */
    it('should return 200 success for no paging', function (done) {
        assertResponse('develop?pageIndex=-1&pageSize=10', 'expected_develop_no_paging', null, done);
    });

    /**
     * It should return 404 error for out of range page index
     */
    it('should return 404 error for out of range page index', function (done) {
        assertErrorResponse('develop?pageIndex=100&pageSize=35', 404, null, 'No results found', done);
    });
});
