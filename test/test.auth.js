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

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/generateJWT/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Generate JWT API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + 'common_oltp__clean', 'common_oltp', done);
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
                testHelper.runSqlFile(SQL_DIR + 'common_oltp__insert_test_data', 'common_oltp', cb);
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
     * @param {Number} expectStatus - the expected response status code.
     * @param {Object} postData - the data post to api.
     * @param {Function} cb - the call back function.
     */
    function createGetRequest(expectStatus, postData, cb) {
        request(API_ENDPOINT)
            .post('/v2/auth')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(expectStatus)
            .send(postData)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} postData - the data post to api.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(expectStatus, errorMessage, postData, cb) {
        createGetRequest(expectStatus, postData, function (err, result) {
            if (!err) {
                assert.equal(result.body.error.details, errorMessage, 'invalid error message');
            } else {
                cb(err);
                return;
            }
            cb();
        });
    }

    it('should return not found error. The user is not activated.', function (done) {
        assertBadResponse(404, 'The user is not activated.', { username: 'testUser', password: 'password' }, done);
    });
});
