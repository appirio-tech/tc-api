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
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');

var testHelper = require('./helpers/testHelper');
var configs = require('../config');
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Reset Password API', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_reset_password_error_message'),
        configGeneral = configs.config.general,
        heffan = configGeneral.cachePrefix + configGeneral.resetTokenPrefix + 'heffan' + configGeneral.resetTokenSuffix,
        user = configGeneral.cachePrefix + configGeneral.resetTokenPrefix + 'user' + configGeneral.resetTokenSuffix,
        superUser = configGeneral.cachePrefix + configGeneral.resetTokenPrefix + 'super' + configGeneral.resetTokenSuffix;

    /**
     * Clear database
     * @param {Function} done the callback
     */
    function clearDb(done) {
        async.parallel({
            heffan: function (cbx) {
                testHelper.deleteCachedKey(heffan, cbx);
            },
            user: function (cbx) {
                testHelper.deleteCachedKey(user, cbx);
            },
            superUser: function (cbx) {
                testHelper.deleteCachedKey(superUser, cbx);
            }
        }, function (err) {
            done(err);
        });
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
                async.parallel({
                    heffan: function (cbx) {
                        testHelper.addCacheValue(heffan,
                            {
                                value: 'abcde',
                                expireTimestamp: new Date('2016-1-1').getTime(),
                                createdAt: new Date().getTime(),
                                readAt: null
                            }, cbx);
                    },
                    user: function (cbx) {
                        testHelper.addCacheValue(user,
                            {
                                value: 'abcde',
                                expireTimestamp: new Date('2014-1-1').getTime(),
                                createdAt: new Date().getTime(),
                                readAt: null
                            }, cbx);
                    }
                }, function (err) {
                    cb(err);
                });
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
     * @param {String} handle - the request handle.
     * @param {Number} expectStatus - the expected request response status.
     * @param {Object} postData - the data that will be post to api.
     * @param {Function} cb - the call back function.
     */
    function createRequest(handle, expectStatus, postData, cb) {
        request(API_ENDPOINT)
            .post('/v2/users/resetPassword/' + handle)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(expectStatus)
            .send(postData)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {String} handle - the request handle
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} postData - the data post to api.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(handle, expectStatus, errorMessage, postData, cb) {
        createRequest(handle, expectStatus, postData, function (err, result) {
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
     * Test when password is too short.
     */
    it('should return bad Request. The password is too short.', function (done) {
        assertBadResponse('heffan', 400, errorObject.password.tooShort, { token: 'abcde', password: '123' }, done);
    });

    /**
     * Test when password is too long.
     */
    it('should return bad Request. The password is too long.', function (done) {
        assertBadResponse('heffan', 400, errorObject.password.tooLong, { token: 'abcde', password: '1234567890abcdefghijklmnopqrstuvwxyz'}, done);
    });

    /**
     * Test when password is just spaces.
     */
    it('should return bad Request. The password is just spaces.', function (done) {
        assertBadResponse('heffan', 400, errorObject.password.empty, { token: 'abcde', password: '    ' }, done);
    });

    /**
     * Test when password contains the invalid characters.
     */
    it('should return bad Request. The password contains invalid characters.', function (done) {
        assertBadResponse('heffan', 400, errorObject.password.invalidCharacters, { token: 'abcde', password: '+*&^%$$#@' }, done);
    });

    /**
     * Test when token is not existed in cache system.
     */
    it('should return bad Request. The token is not existed in cache system.', function (done) {
        assertBadResponse('super', 400, errorObject.token.notExistedOrExpired, { token: 'djoisdfj', password: 'password' }, done);
    });

    /**
     * Test when token is in system but expired.
     */
    it('should return bad Request. The token is in system but expired.', function (done) {
        assertBadResponse('user', 400, errorObject.token.notExistedOrExpired, { token: 'djoisdfj', password: 'password' }, done);
    });

    /**
     * Test when token is incorrect.
     */
    it('should return bad Request. The token is incorrect.', function (done) {
        assertBadResponse('heffan', 400, errorObject.token.inCorrect, { token: 'ajdoijfiodsfj', password: 'password' }, done);
    });

    /**
     * Test when user in not exist.
     */
    it('should return not Found Error. The user is not existed', function (done) {
        assertBadResponse('notExist', 404, errorObject.notExist, { token: 'abcde', password: 'password' }, done);
    });

    /**
     * Test success results.
     */
    it('should return success results. The password has been saved.', function (done) {
        var newPassword = 'abcdefghijk';
        async.waterfall([
            function (cb) {
                createRequest('heffan', 200, { token: 'abcde', password: newPassword }, function (err) {
                    cb(err);
                });
            },
            function (cb) {
                testHelper.runSqlSelectQuery('password FROM security_user WHERE user_id = \'heffan\'', 'common_oltp', cb);
            },
            function (value, cb) {
                assert.equal(testHelper.decodePassword(value[0].password, testHelper.PASSWORD_HASH_KEY), newPassword, 'invalid password');
                cb();
            }
        ], done);
    });

    /**
     * Test success results. The user handle is in upper case.
     */
    it('should return success results. The user handle is in upper case.', function (done) {
        var newPassword = 'abcdefghijk';
        async.waterfall([
            function (cb) {
                // Insert again.
                testHelper.addCacheValue(heffan,
                    {
                        value: 'abcde',
                        expireTimestamp: new Date('2016-1-1').getTime(),
                        createdAt: new Date().getTime(),
                        readAt: null
                    }, cb);
            },
            function (cb) {
                createRequest('HEFFAN', 200, { token: 'abcde', password: newPassword }, function (err) {
                    cb(err);
                });
            },
            function (cb) {
                testHelper.runSqlSelectQuery('password FROM security_user WHERE user_id = \'heffan\'', 'common_oltp', cb);
            },
            function (value, cb) {
                assert.equal(testHelper.decodePassword(value[0].password, testHelper.PASSWORD_HASH_KEY), newPassword, 'invalid password');
                cb();
            }
        ], done);
    });
});
