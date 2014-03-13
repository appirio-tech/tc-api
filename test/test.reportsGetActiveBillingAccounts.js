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
var SQL_DIR = __dirname + "/sqls/reportsGetActiveBillingAccounts/";
var EXPECTED_DIR = __dirname + "/test_files/reports/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Active Billing Accounts', function () {
    this.timeout(120000); // The api with testing remote db could be quit slow

    var admin = testHelper.generateAuthHeader({ sub: 'ad|132456' }),
        member = testHelper.generateAuthHeader({ sub: 'ad|132457' });

    /**
     * Create request and return it
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/platform/activeBillingAccounts')
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect('Content-Type', /json/).expect(statusCode);
    }

    /**
     * Get response and assert response from /v2/platform/activeBillingAccounts
     * @param {String} expectedResponseFile the expected response file name
     * @param {String} authHeader the Authorization header. Optional
     * @param {Function<err>} done the callback
     */
    function assertResponse(expectedResponseFile, authHeader, done) {
        createRequest(200, authHeader)
            .end(function (err, res) {
                assert.ifError(err);
                assert.ok(res.body);
                var response = res.body,
                    expected = require(EXPECTED_DIR + expectedResponseFile + '.json');
                delete response.serverInformation;
                delete response.requesterInformation;
                response.activeBillingAccounts.forEach(function (item) {
                    var date = new Date(item.projectStartDate);
                    assert.ok(date instanceof Date && !isNaN(date.valueOf()), 'Not valid date format');
                    assert.ok(date <= new Date(), 'should be prior to current date');
                    delete item.projectStartDate;
                });
                assert.deepEqual(response, expected);
                done(err);
            });
    }

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + 'time_oltp__restore', 'time_oltp', done);
    }

    describe('', function () {

        /**
         * This function is run before each test.
         * Generate tests data.
         * @param {Function<err>} done the callback
         */
        before(function (done) {
            async.waterfall([
                clearDb,
                function (cb) {
                    testHelper.runSqlFile(SQL_DIR + 'time_oltp__update_test_data_1', 'time_oltp', cb);
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
         * It should return two valid results
         */
        it('should return two valid results', function (done) {
            assertResponse('expected_get_active_billing_accounts_two', admin, done);
        });
    });

    describe('', function () {

        /**
         * This function is run before each test.
         * Generate tests data.
         * @param {Function<err>} done the callback
         */
        before(function (done) {
            async.waterfall([
                clearDb,
                function (cb) {
                    testHelper.runSqlFile(SQL_DIR + 'time_oltp__update_test_data_2', 'time_oltp', cb);
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
         * It should return empty results
         */
        it('should return empty results', function (done) {
            assertResponse('expected_get_active_billing_accounts_empty', admin, done);
        });
    });

    /**
     * Test when anonymous call this api.
     */
    it('should return unauthorized error. The caller is anonymous.', function (done) {
        createRequest(401, null).end(done);
    });

    /**
     * Test when member call this api.
     */
    it('should return forbidden error. The caller is member.', function (done) {
        createRequest(403, member).end(done);
    });

});
