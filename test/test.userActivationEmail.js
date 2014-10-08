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
var SQL_DIR = __dirname + '/sqls/userActivationEmail/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('User Activation Email API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_user_activation_email_error_message'),
        heffan = testHelper.generateAuthHeader({ sub: 'ad|132456' }),
        user1 = testHelper.generateAuthHeader({ sub: 'ad|100326' }),
        user2 = testHelper.generateAuthHeader({ sub: 'ad|100325' });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'common_oltp__clean', 'common_oltp', cb);
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
     * @param {Object} authHeader - the auth header.
     * @param {Function} cb - the call back function.
     */
    function createGetRequest(expectStatus, authHeader, cb) {
        var req = request(API_ENDPOINT)
            .get('/v2/user/activation-email/')
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
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} authHeader - the request auth header.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(expectStatus, errorMessage, authHeader, cb) {
        createGetRequest(expectStatus, authHeader, function (err, result) {
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
     * Test when caller is anonymous.
     */
    it('should return unauthorized Error. The caller is anonymous.', function (done) {
        assertBadResponse(401, errorObject.unauthorized, null, done);
    });


    /**
     * Test caller is an activated user.
     */
    it('should return bad request. The challengeId is not number.', function (done) {
        assertBadResponse(400, errorObject.alreadyActivated, heffan, done);
    });

    /**
     * Test caller reach the resend limit.
     */
    it('should return bad request. The user reach resend limit.', function (done) {
        async.waterfall([
            function (cb) {
                async.timesSeries(5, function (time, next) {
                    createGetRequest(200, user2, function () {
                        next();
                    });
                }, function (err) {
                    cb(err);
                });
            },
            function (cb) {
                assertBadResponse(400, errorObject.reachLimit, user2, cb);
            }
        ], done);
    });

    it('should return success result.', function (done) {
        createGetRequest(200, user1, function (err, res) {
            if (err) {
                done(err);
            } else {
                assert.isTrue(res.body.success, 'invalid response');
                done();
            }
        });
    });

});
