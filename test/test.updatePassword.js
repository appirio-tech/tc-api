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
var ssha = require('ssha');

var testHelper = require('./helpers/testHelper');
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Update Password API', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_update_password_error_message'),
        heffan = testHelper.generateAuthHeader({ sub: 'ad|132456' }),
        newPassword = 'abcdefghijk',
        defaultPassword = 'password';

    /**
     * Create a http request and test it.
     * @param {Number} expectStatus - the expected request response status.
     * @param {Object} postData - the data that will be post to api.
     * @param {Object} authHeader - the auth header.
     * @param {Function} cb - the call back function.
     */
    function createRequest(expectStatus, postData, authHeader, cb) {
        var req = request(API_ENDPOINT)
            .post('/v2/users/password/')
            .set('Accept', 'application/json');
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        req.expect('Content-Type', /json/)
            .expect(expectStatus)
            .send(postData)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} authHeader - the auth Header.
     * @param {Object} postData - the data post to api.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(expectStatus, errorMessage, authHeader, postData, cb) {
        createRequest(expectStatus, postData, authHeader, function (err, result) {
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
     * This function is run after all tests.
     * It will call the api again to set the password to default one.
     */
    after(function (done) {
        createRequest(200, { oldPassword: newPassword, newPassword: defaultPassword }, heffan,  done);
    });

    /**
     * Test when password is too short.
     */
    it('should return bad Request. The password is too short.', function (done) {
        assertBadResponse(400, errorObject.password.tooShort, heffan, { oldPassword: defaultPassword, newPassword: '123' }, done);
    });

    /**
     * Test when password is too long.
     */
    it('should return bad Request. The password is too long.', function (done) {
        assertBadResponse(400, errorObject.password.tooLong, heffan, { oldPassword: defaultPassword, newPassword: '1234567890abcdefghijklmnopqrstuvwxyz'}, done);
    });

    /**
     * Test when password contains the invalid characters.
     */
    it('should return bad Request. The password contains invalid characters.', function (done) {
        assertBadResponse(400, errorObject.password.invalidCharacters, heffan, { oldPassword: defaultPassword, newPassword: '+*&^%$$#@' }, done);
    });

    /**
     * Test when old password is not correct.
     */
    it('should return bad Request. The oldPassword is not correct.', function (done) {
        assertBadResponse(403, errorObject.password.oldPasswordNotCorrect, heffan,  { oldPassword: '1234567890', newPassword: newPassword}, done);
    });

    /**
     * Test when anonymous call this api.
     */
    it('should return unauthorized error. The caller is anonymous.', function (done) {
        assertBadResponse(401, errorObject.unauthorized, null, { oldPassword: defaultPassword, newPassword: newPassword }, done);
    });

    /**
     * Test success results.
     */
    it('should return success results. The password has been saved.', function (done) {
        var client;
        async.waterfall([
            function (cb) {
                createRequest(200, { oldPassword: defaultPassword, newPassword: newPassword }, heffan, function (err, res) {
                    assert.equal(res.body.description, 'Your password has been reset!', 'invalid response');
                    cb(err);
                });
            },
            function (cb) {
                testHelper.runSqlSelectQuery('password FROM security_user WHERE user_id = \'heffan\'', 'common_oltp', cb);
            },
            function (value, cb) {
                assert.equal(testHelper.decodePassword(value[0].password, testHelper.PASSWORD_HASH_KEY), newPassword, 'invalid password');
                cb();
            },
            function (cb) {
                // Get user from ldap.
                client = testHelper.createClient();
                testHelper.bindClient(client, cb);
            }, function (cb) {
                var dn = 'uid=132456, ' + testHelper.topcoder_member_base_dn;
                client.search(dn, {}, function (err, res) {
                    if (err) {
                        client.unbind();
                        cb(err);
                        return;
                    }

                    res.on('searchEntry', function (entry) {
                        var result = {
                            userId: entry.object.uid,
                            handle: entry.object.handle,
                            userPassword: entry.object.userPassword,
                            status: entry.object.status
                        };
                        cb(null, result);
                    });

                    res.on('searchReference', function (referral) {
                        console.log('referral: ' + referral.uris.join());
                    });

                    res.on('error', function (err) {
                        console.error('error: ' + err.message);
                        cb(err);
                    });

                    res.on('end', function (result) {
                        console.log('status: ' + result.status);
                    });
                });
            },
            function (user, cb) {
                // Verify the password.
                assert.ok(user);
                assert.isDefined(user.userPassword);
                assert.isTrue(ssha.verify(newPassword, user.userPassword), 'hash is wrong');
                cb();
            },
            function (cb) {
                client.unbind();
                cb();
            }
        ], function (err) {
            if (err) {
                client.unbind();
            }
            done(err);
        });
    });

});
