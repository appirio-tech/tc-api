/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach, __dirname */
/*jslint node: true, stupid: true, unparam: true */

var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");
var _ = require("underscore");
var config = require("../config/tc-config").tcConfig;

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/updateUserProfile/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = config.oauthClientId;
var SECRET = config.oauthClientSecret;
var jwt = require('jsonwebtoken');

/**
 * Test update user profile test cases.
 */
describe('Test update user profile. ', function () {

    /**
     * Users that we have setup.
     */
    var user124916 = 'ad|124916';

    /**
     * Return the authentication header to be used for the given user.
     * @param {Object} user the user to authenticate
     */
    function getAuthHeader(user) {
        return "Bearer " + jwt.sign({sub: user}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
    }

    /**
     * Creates a Request object using the given URL.
     * Sets the Authorization header for the given user.
     * Sets the expected response code using the expectedStatusCode parameter
     * @param {String} url the url to connect
     * @param {Object} user the user to authenticate
     * @param {Number} expectedStatusCode the expected status code of the response
     */
    function getRequest(url, user, expectedStatusCode) {
        return request(API_ENDPOINT)
            .post(url)
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user))
            .expect('Content-Type', /json/)
            .expect(expectedStatusCode);
    }


    this.timeout(120000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clean", "topcoder_dw", cb);
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
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__insert", "topcoder_dw", cb);
            }
        ], done);
    });

    /**
     * This function is run after all tests.
     * Prints the recipient view urls that we receive during our test calls
     * @param {Function<err>} done the callback
     */
    after(function (done) {
        clearDb(done);
    });

    /**
     * Assert the error.
     *
     * @param err the error value
     * @param resp the response value
     * @param message the error message
     * @param done the callback method
     */
    function assertError(err, resp, message, done) {
        if (err) {
            done(err);
            return;
        }
        assert.equal(resp.body.error.details, message);
        done();
    }


    /**
     * Test update quote.
     */
    it('Test update quote', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ quote: 'new 1'})
            .end(function () {
                done();
            });
    });

    /**
     * Test update quote with long value.
     */
    it('Test update quote', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 400);
        req.send({ quote: '12345678901234567890123456789012345678901234567890123456789012345678901234567890' +
            '12345678901234567890123456789012345678901234567890123456789012345678901234567890' +
            '12345678901234567890123456789012345678901234567890123456789012345678901234567890' +
            '12345678901234567890123456789012345678901234567890123456789012345678901234567890'})
            .end(function (err, resp) {
                assertError(err, resp, "quote value is too long.", done);
            });
    });

    /**
     * Test update emailNotification.
     */
    it('Test update emailNotification', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ emailNotification: '{ "Algorithm Competitions": "Yes", "Software Development Opportunities": "Yes"}'})
            .end(function () {
                done();
            });
    });

    /**
     * Test update emailNotification with invalid data.
     */
    it('Test update emailNotification', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 400);
        req.send({ emailNotification: '{ "Unknown": "Yes"}'})
            .end(function (err, resp) {
                assertError(err, resp, "Unknown is invalid key.", done);
            });
    });

    /**
     * Test update country with invalid data.
     */
    it('Test update country', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 400);
        req.send({ country: 'Unknown'})
            .end(function (err, resp) {
                assertError(err, resp, "Unknown is not a valid country name.", done);
            });
    });

    /**
     * Test update country.
     */
    it('Test update country', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ country: 'China'})
            .end(function () {
                done();
            });
    });

    /**
     * Test update age.
     */
    it('Test update age', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ age: '25 - 34'})
            .end(function () {
                done();
            });
    });

    /**
     * Test update age with invalid data.
     */
    it('Test update age', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 400);
        req.send({ age: '25 - 25'})
            .end(function (err, resp) {
                assertError(err, resp, "25 - 25 is not a valid age value.", done);
            });
    });

    /**
     * Test update gender.
     */
    it('Test update gender', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ gender: 'Male'})
            .end(function () {
                done();
            });
    });

    /**
     * Test update gender with invalid data.
     */
    it('Test update gender', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 400);
        req.send({ gender: 'aa'})
            .end(function (err, resp) {
                assertError(err, resp, "aa is not a valid gender value.", done);
            });
    });

    /**
     * Test update shirtSize
     */
    it('Test update shirtSize', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ shirtSize: 'Medium'})
            .end(function () {
                done();
            });
    });

    /**
     * Test update shirtSize with invalid data.
     */
    it('Test update shirtSize', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 400);
        req.send({ shirtSize: 'aa'})
            .end(function (err, resp) {
                assertError(err, resp, "aa is not a valid shirtSize value.", done);
            });
    });

    /**
     * Test update emails
     */
    it('Test update emails', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ emails: '[{ "email": "foo2@fooonyou.com", "type": "Primary" }]'})
            .end(function () {
                done();
            });
    });

    /**
     * Test update emails with invalid data.
     */
    it('Test update emails', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 400);
        req.send({ emails: '[{ "email": "aa", "type": "Primary", "status": "Active" }]'})
            .end(function (err, resp) {
                assertError(err, resp, "Primary email should be email address.", done);
            });
    });

    /**
     * Test update address.
     */
    it('Test update address', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ address: '{ "address1" : "address1", "address2" : "address2", "address3" : "address3", "city" : "city", "zip" : "111222"}'})
            .end(function () {
                done();
            });
    });

    /**
     * Test update messageBlackList.
     */
    it('Test update messageBlackList', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ messageBlackList: '["Hung", "user"]'})
            .end(function () {
                done();
            });
    });

    /**
     * Test update messageBlackList with invalid data.
     */
    it('Test update messageBlackList', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 400);
        req.send({ messageBlackList: '["Hung", "user", "aa"]'})
            .end(function (err, resp) {
                assertError(err, resp, "messageBlackList contains invalid user handle.", done);
            });
    });

    /**
     * Test update receiveMessages.
     */
    it('Test update receiveMessages', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ receiveMessages: 'yes'})
            .end(function () {
                done();
            });
    });

    /**
     * Test update receiveMessages with invalid data.
     */
    it('Test update receiveMessages', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 400);
        req.send({ receiveMessages: 'a'})
            .end(function (err, resp) {
                assertError(err, resp, "receiveMessages value is invalid.", done);
            });
    });

    /**
     * Test update showMyEarnings.
     */
    it('Test update showMyEarnings', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ showMyEarnings: 'show'})
            .end(function () {
                done();
            });
    });

    /**
     * Test update showMyEarnings with invalid data.
     */
    it('Test update showMyEarnings', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 400);
        req.send({ showMyEarnings: 'a'})
            .end(function (err, resp) {
                assertError(err, resp, "showMyEarnings value is invalid.", done);
            });
    });

    /**
     * Test update showMySchool with invalid data.
     */
    it('Test update showMySchool', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 400);
        req.send({ showMySchool: 'yes'})
            .end(function (err, resp) {
                assertError(err, resp, "showMySchool value is not allowed to update for this user.", done);
            });
    });

    /**
     * Test get actions.
     */
    it('Test get actions', function (done) {
        var req = getRequest('/v2/user/profile', user124916, 200);
        req.send({ showMyEarnings: 'show', receiveMessages: 'yes', messageBlackList: '["Hung", "user"]',
            emailNotification: '{ "Algorithm Competitions": "Yes"}'})
            .end(function () {
                var req2 = request(API_ENDPOINT)
                    .get('/v2/user/profile')
                    .set('Accept', 'application/json')
                    .set('Authorization', getAuthHeader(user124916))
                    .expect('Content-Type', /json/)
                    .expect(200);

                req2.end(function (err, resp) {
                    assert.equal(resp.body.privacy.showMySchool, 'N/A');
                    assert.equal(resp.body.privacy.receiveMessages, 'yes');
                    assert.equal(resp.body.privacy.showMyEarnings, 'show');
                    assert.equal(JSON.stringify(resp.body.privacy.messageBlackList), JSON.stringify([ 'Hung', 'user' ]));
                    assert.equal(resp.body.emailNotification['Competition announcements']['Algorithm Competitions'],
                        'Yes');
                    done();
                });
            });
    });

});
