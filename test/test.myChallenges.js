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
var SQL_DIR = __dirname + '/sqls/myChallenges/';

describe('Test My Challenges API', function () {
    this.timeout(60000); // The api with testing remote db could be quit slow

    var admin = 'ad|132456',
        adminAuthHeader = testHelper.generateAuthHeader({ sub: admin });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
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
                testHelper.runSqlFiles(testHelper.generatePartPaths(SQL_DIR + 'tcs_catalog__insert_test_data', '', 3), 'tcs_catalog', cb);
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
     * @param {String} type the type request parameters
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(type, statusCode, authHeader) {
        var url = '/v2/user/challenges', req;
        if (type) {
            url += '?type=' + type;
        }
        req = request(API_ENDPOINT)
            .get(url)
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }

        return req.expect(statusCode);
    }

    /**
     * Make request
     * @param {String} type the type request parameters
     * @param {String} authHeader the Authorization header. Optional
     * @param {Function<err>} done - the callback
     */
    function assertResponse(type, authHeader, expectedFileName, done) {
        createRequest(type, 200, authHeader)
            .end(function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                var body = result.body,
                    expected = require('./test_files/myChallenges/' + expectedFileName + '.json');
                delete body.serverInformation;
                delete body.requesterInformation;
                assert.ok(body);
                assert.ok(body.data);
                body.data.forEach(function (d) {
                    delete d.currentPhaseRemainingTime;     // it's not fixed
                });
                assert.deepEqual(body, expected, "Invalid response");
                done();
            });
    }

    /**
     * Get response and assert response
     * @param {String} type the type request parameters
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(type, statusCode, authHeader, errorMessage, done) {
        createRequest(type, statusCode, authHeader)
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

    it('should return 200 error for no type parameter', function (done) {
        assertErrorResponse('', 200, null, 'Error: type is a required parameter for this action', done);
    });

    it('should return 401 error for no auth header', function (done) {
        assertErrorResponse('asdf', 401, null, 'You need to login for this api.', done);
    });

    it('should return 401 error for wrong type parameter', function (done) {
        assertErrorResponse('asdf', 400, adminAuthHeader, 'type should be an element of ACTIVE,PAST.', done);
    });

    it('should return 200 success for ', function (done) {
        assertResponse('active', adminAuthHeader, 'expected_active_132456', done);
    });

    it('should return 200 success for ', function (done) {
        assertResponse('past', adminAuthHeader, 'expected_past_132456', done);
    });
});
