/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author isv
 */
"use strict";

/*global describe, it, before, beforeEach, after, afterEach, __dirname */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var testHelper = require('./helpers/testHelper');
var stringUtils = require("../common/stringUtils.js");
var redis = require('redis');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var SQL_DIR = __dirname + "/sqls/resetPassword/";
var DATABASE_NAME = "common_oltp";
var TOKEN_LIFETIME = require('../config').config.general.defaultResetPasswordTokenCacheLifetime;
var IS_FAKE_REDIS_USED = require('../config').config.redis.fake;
if (typeof TOKEN_LIFETIME === 'string') {
    TOKEN_LIFETIME = parseInt(TOKEN_LIFETIME, 10);
}

var CLIENT_ID = require('../config').config.general.oauthClientId;
var SECRET = require('../config').config.general.oauthClientSecret;
var jwt = require('jsonwebtoken');

describe('Test Generate Reset Token API', function () {
    this.timeout(120000);

    /**
     * Gets the token which must have been generated for the specified user and saved to Redis database.
     * 
     * @param {String} handle - the username to get the token for.
     * @param {Function} callback - the callback function.
     */
    function getCachedToken(handle, callback) {
        var client = redis.createClient();
        client.get('tokens-' + handle + '-reset-token', function (err, value) {
            callback(err, JSON.parse(value));
        });
        client.quit();
    }

    /**
     * Delays the execution of current thread to let the token generated previously ot expire.
     */
    function delay() {
        var delayPeriod = TOKEN_LIFETIME + 1000,
            now = new Date(),
            desiredTime = new Date();
        desiredTime.setTime(now.getTime() + delayPeriod);
        while (now < desiredTime) {
            now = new Date();
        }
        console.log("The token should have expired.");
    }

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "common_oltp__clean", DATABASE_NAME, done);
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
                testHelper.runSqlFile(SQL_DIR + "common_oltp__insert_test_data", DATABASE_NAME, cb);
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
     * Tests the generateResetToken action against failure test case. Posts a request for generating the token for
     * user specified by handle or email and expects the server to respond with HTTP response of specified status
     * providing the specified expected error details.
     *
     * @param {String} handle - a handle for user to pass to tested action.
     * @param {String} email - an email for user to pass to tested action.
     * @param {Number} expectedStatusCode - status code for HTTP response expected to be returned from server.
     * @param {String} expectedErrorMessage - error message expected to be returned from server.
     * @param {Function} callback - a callback to be called when test finishes.
     */
    function testFailureScenario(handle, email, expectedStatusCode, expectedErrorMessage, callback) {
        var queryParams = '?';
        if (handle !== null) {
            queryParams += 'handle=' + handle;
        }
        if (email !== null) {
            queryParams += '&email=' + email;
        }

        request(API_ENDPOINT)
            .get('/v2/users/resetToken' + queryParams)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(expectedStatusCode)
            .end(function (err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                var body = res.body;
                assert.equal(body.error.details, expectedErrorMessage);
                callback();
            });
    }

    /**
     * Tests the generateResetToken action against success test case. Posts a request for generating the token for
     * user specified by handle or email and expects the server to respond with HTTP response of 200 OK status and
     * return generated token or social login provider name in case the handle or email corresponds to social login.
     *
     * @param {String} handle - a handle for user to pass to tested action.
     * @param {String} email - an email for user to pass to tested action.
     * @param {String} socialLoginProvider - a name for social login provider in case specified handle is from social
     *        login.
     * @param {Function} callback - a callback to be called when test finishes.
     * @param {String} handleForEmail - a user handle corresponding to specified email address. This is just for tests
     *         which pass email and expect the token to be generated.
     * @param {boolean} skipCheckingTokenInRedis - flag indicating if test has skip checking the token for presence in
     *        Redis database.
     */
    function testSuccessScenario(handle, email, socialLoginProvider, callback, handleForEmail, skipCheckingTokenInRedis) {
        var queryParams = '?';
        if (handle !== null) {
            queryParams += 'handle=' + handle;
        }
        if (email !== null) {
            queryParams += '&email=' + email;
        }

        request(API_ENDPOINT)
            .get('/v2/users/resetToken' + queryParams)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                assert.notOk(err, 'There should be no error for successful scenario');

                var body = res.body,
                    alphabet = stringUtils.ALPHABET_ALPHA_EN + stringUtils.ALPHABET_DIGITS_EN,
                    i,
                    ch;

                if (socialLoginProvider === null) {
                    assert.ok(body.successful, "There is no successful returned");
                    assert.isTrue(body.successful, "Wrong successful flag is returned");
                    if (!IS_FAKE_REDIS_USED && !skipCheckingTokenInRedis) {
                        async.waterfall([
                            function (cb) {
                                if (handle) {
                                    getCachedToken(handle, cb);
                                } else {
                                    getCachedToken(handleForEmail, cb);
                                }
                            }
                        ], function (err, token) {
                            assert.ok(token, 'The token is not stored in Redis database');
                            assert.equal(token.value.length, 6, "Token of wrong length returned");
                            for (i = 0; i < token.value.length; i = i + 1) {
                                ch = token.value.charAt(i);
                                assert.isTrue(alphabet.indexOf(ch) >= 0, "Token contains wrong character '" + ch + "'");
                            }
                            callback(err);
                        });
                    } else {
                        callback();
                    }
                } else {
                    assert.ok(body.socialProvider, "There is no social login provider name returned");
                    assert.equal(body.socialProvider, socialLoginProvider, "Wrong social login provider name returned");
                    callback();
                }
            });
    }

    // Failure test cases
    it('Neither handle nor email are provided - should return HTTP 400', function (done) {
        testFailureScenario(null, null, 400, 'Either handle or email must be specified', done);
    });

    it('Both handle and email are provided - should return HTTP 400', function (done) {
        testFailureScenario("heffan", "foo@bar.com", 400, 'Both handle and email are specified', done);
    });

    it('Both empty handle and email are provided - should return HTTP 400', function (done) {
        testFailureScenario("", "", 400, 'Either handle or email must be specified', done);
    });

    it('Empty handle provided - should return HTTP 400', function (done) {
        testFailureScenario("", null, 400, 'Either handle or email must be specified', done);
    });

    it('Empty email provided - should return HTTP 400', function (done) {
        testFailureScenario(null, "", 400, 'Either handle or email must be specified', done);
    });

    it('Non-existing handle is provided - should return HTTP 404', function (done) {
        testFailureScenario("Undioiwfibiiv3vb3i", null, 404, 'User does not exist', done);
    });

    it('Non-existing email is provided - should return HTTP 404', function (done) {
        testFailureScenario(null, '912837197@akjsdnakd.com', 404, 'User does not exist', done);
    });

    it('Non-expired token already exists - should return HTTP 400', function (done) {
        // Increasing timeout as there is a need for thread to sleep in this test case in order to cause the 
        // generated token to expire
        this.timeout(TOKEN_LIFETIME * 2);

        async.waterfall([
            function (cb) {
                testSuccessScenario('normal_user_11', null, null, cb, null, false);
            }, function (cb) {
                testFailureScenario('normal_user_11', null, 400, "You have already requested the reset token, "
                    + "please find it in your email inbox. If it's not there. Please contact support@topcoder.com.",
                    cb);
            }, function (cb) {
                console.log("\nWaiting for generated token to expire to prevent multiple test suite execution to fail ("
                    + (TOKEN_LIFETIME + 1000) / 1000 + " sec)...");
                delay();
                cb();
            }
        ], function (err) {
            done(err);
        });
    });

    // Accuracy test cases
    it('Existing TopCoder username is provided - should respond with HTTP 200 and return token', function (done) {
        testSuccessScenario('normal_user_13', null, null, done, null, false);
    });

    it('Existing email address is provided - should respond with HTTP 200 and return token', function (done) {
        testSuccessScenario(null, 'normal_user_14@test.com', null, done, 'normal_user_14', false);
    });

    it('Existing social login handle is provided - should respond with HTTP 200 and provider name', function (done) {
        testSuccessScenario('user2', null, 'Facebook', done, null, true);
    });

    it('Existing social login email is provided - should respond with HTTP 200 and provider name', function (done) {
        testSuccessScenario(null, 'social.email21@test.com', 'Twitter', done, null, true);
    });

    it('Username that matches handle for TC user account (which also have a social login username) and social '
        + 'login username for another TC user account is provided - should respond with HTTP 200 and social '
        + 'provider name for user with matching TC handle', function (done) {
            testSuccessScenario('common_handle', null, 'Google', done, null, true);
        });

    it('Username that matches handle for TC user account (which does not have a social login username) and social '
        + 'login username for another TC user account is provided - should respond with HTTP 200 and generated '
        + 'token for user with matching TC handle', function (done) {
            testSuccessScenario('common_handle2', null, null, done, null, false);
        });

    it('Email address that matches email for TC user account (which also have a social login username) and social '
        + 'login email for another TC user account is provided - should respond with HTTP 200 and social '
        + 'provider name for user with matching TC email address', function (done) {
            testSuccessScenario(null, 'common_email@test.com', 'Google', done, null, true);
        });

    it('Email address that matches email for TC user account (which does not have a social login account) and social '
        + 'login email for another TC user account is provided - should respond with HTTP 200 and generated '
        + 'token for user with matching TC email', function (done) {
            testSuccessScenario(null, 'common_email2@test.com', null, done, 'normal_user_25', false);
        });

    it('Requesting new token once previous has expired - should respond with HTTP 200 and new token', function (done) {
        // Increasing timeout as there is a need for thread to sleep in this test case in order to cause the
        // generated token to expire
        this.timeout(TOKEN_LIFETIME * 2);

        async.waterfall([
            function (cb) {
                testSuccessScenario('normal_user_15', null, null, cb, null, false);
            }, function (cb) {
                console.log("\nWaiting for generated token to expire (" + (TOKEN_LIFETIME + 1000) / 1000 + " sec)...");
                delay();
                testSuccessScenario('normal_user_15', null, null, cb, null, true);
            }
        ], function (err) {
            done(err);
        });
    });
});
