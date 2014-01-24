/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var jwt = require('jsonwebtoken');
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var CLIENT_ID = require('../config').configData.general.oauthClientId;
var SECRET = require('../config').configData.general.oauthClientSecret;
var COMMON_OLTP = "common_oltp";
var SQL_DIR = __dirname + "/sqls/oauth/";

describe('Test Oauth', function () {
    this.timeout(30000); // The api with testing remote db could be quit slow

    /*
     * sub value in JWT. It has format {provider}|{id}
     */
    var userSubGoogle = "google-oauth|gg1234",
        adminSubGoogle = "google-oauth|gg123456",
        userSubFacebook = "facebook-oauth|fb1234",
        adminSubFacebook = "facebook-oauth|fb123456",
        userSubTwitter = "twitter-oauth|tw1234",
        adminSubTwitter = "twitter-oauth|tw123456",
        userSubGithub = "github-oauth|git1234",
        adminSubGithub = "github-oauth|git123456",
        userSubSalesforce = "salesforce-oauth|sf1234",
        adminSubSalesforce = "salesforce-oauth|sf123456",
        userSubAD = "ad|400000",
        adminSubAD = "ad|400001",
        notFoundSub = "google-oauth|458965118758";


    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + 'common_oltp__clean', COMMON_OLTP, done);
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
                testHelper.runSqlFile(SQL_DIR + 'common_oltp__insert_test_data', COMMON_OLTP, cb);
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
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/test/oauth')
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect('Content-Type', /json/).expect(statusCode);
    }

    /**
     * Get response and assert response from /test/oauth
     * @param {Object} expectedResponse the expected response
     * @param {String} authHeader the Authorization header. Optional
     * @param {Function<err>} done the callback
     */
    function assertResponse(expectedResponse, authHeader, done) {
        createRequest(200, authHeader)
            .end(function (err, res) {
                assert.ifError(err);
                assert.ok(res.body);
                var response = res.body;
                delete response.serverInformation;
                delete response.requestorInformation;
                assert.deepEqual(response, expectedResponse);
                done(err);
            });
    }

    /**
     * Get response and assert response from /test/oauth
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(statusCode, authHeader, errorMessage, done) {
        createRequest(statusCode, authHeader)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                if (errorMessage) {
                    assert.ok(res.body);
                    assert.ok(res.body.error);
                    assert.equal(res.body.error.details, errorMessage);
                }
                done();
            });
    }


    /**
     * Generate an auth header
     * @param {Object} data the data to generate
     * @return {String} the generated string
     */
    function generateAuthHeader(data) {
        return "Bearer " + jwt.sign(data || {}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
    }

    /**
     * /test/oauth/ with no header
     */
    it('should be authorized as anon', function (done) {
        assertResponse({accessLevel: "anon"}, null, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as member (google)', function (done) {
        var oauth = generateAuthHeader({ sub: userSubGoogle });
        assertResponse({accessLevel: "member", userId: 400000, handle: "normal_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as member (facebook)', function (done) {
        var oauth = generateAuthHeader({ sub: userSubFacebook });
        assertResponse({accessLevel: "member", userId: 400000, handle: "normal_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as member (twitter)', function (done) {
        var oauth = generateAuthHeader({ sub: userSubTwitter });
        assertResponse({accessLevel: "member", userId: 400000, handle: "normal_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as member (github)', function (done) {
        var oauth = generateAuthHeader({ sub: userSubGithub });
        assertResponse({accessLevel: "member", userId: 400000, handle: "normal_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as member (salesforce)', function (done) {
        var oauth = generateAuthHeader({ sub: userSubSalesforce });
        assertResponse({accessLevel: "member", userId: 400000, handle: "normal_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as member (ad)', function (done) {
        var oauth = generateAuthHeader({ sub: userSubAD});
        assertResponse({accessLevel: "member", userId: 400000, handle: "normal_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as admin (google)', function (done) {
        var oauth = generateAuthHeader({ sub: adminSubGoogle});
        assertResponse({accessLevel: "admin", userId: 400001, handle: "admin_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as admin (facebook)', function (done) {
        var oauth = generateAuthHeader({ sub: adminSubFacebook});
        assertResponse({accessLevel: "admin", userId: 400001, handle: "admin_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as admin (twitter)', function (done) {
        var oauth = generateAuthHeader({ sub: adminSubTwitter});
        assertResponse({accessLevel: "admin", userId: 400001, handle: "admin_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as admin (github)', function (done) {
        var oauth = generateAuthHeader({ sub: adminSubGithub});
        assertResponse({accessLevel: "admin", userId: 400001, handle: "admin_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as admin (salesforce)', function (done) {
        var oauth = generateAuthHeader({ sub: adminSubSalesforce});
        assertResponse({accessLevel: "admin", userId: 400001, handle: "admin_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as admin (ac)', function (done) {
        var oauth = generateAuthHeader({ sub: adminSubAD});
        assertResponse({accessLevel: "admin", userId: 400001, handle: "admin_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with expired header
     */
    it('should return error if header is expired', function (done) {
        var expired = "Bearer " + jwt.sign({accessLevel: "admin", userId: 400001, handle: "admin_user"},
            SECRET,
            {expiresInMinutes: -1000, audience: CLIENT_ID});
        assertErrorResponse(400, expired, "JWT is expired", done);
    });

    /**
     * /test/oauth/ with invalid header
     */
    it('should return error if header is invalid#1', function (done) {
        assertErrorResponse(400, "asd", "Malformed Auth header", done);
    });

    /**
     * /test/oauth/ with invalid header
     */
    it('should return error if header is invalid#2', function (done) {
        assertErrorResponse(400, "Bearer asd", "Malformed Auth header", done);
    });

    /**
     * /test/oauth/ with invalid header
     */
    it('should return error if header is invalid#3', function (done) {
        var oauth = generateAuthHeader({ sub: userSubGoogle});
        assertErrorResponse(400, oauth + "asd", "Malformed Auth header", done);
    });

    /**
     * /test/oauth/ with invalid header
     */
    it('should return error if header is invalid (no sub)', function (done) {
        var oauth = generateAuthHeader({});
        assertErrorResponse(400, oauth, "Malformed Auth header. No sub in token!", done);
    });

    /**
     * /test/oauth/ with invalid header
     */
    it('should return error if header is invalid (no provider in sub)', function (done) {
        var oauth = generateAuthHeader({ sub: "123" });
        assertErrorResponse(400, oauth, "Malformed Auth header. No provider in token.sub!", done);
    });

    /**
     * /test/oauth/ with invalid header
     */
    it('should return error if header is invalid (no userId in sub)', function (done) {
        var oauth = generateAuthHeader({ sub: "facebook|" });
        assertErrorResponse(400, oauth, "Malformed Auth header. No userId in token.sub!", done);
    });

    /**
     * /test/oauth/ with invalid header
     */
    it('should return error if header is invalid (invalid audience)', function (done) {
        var oauth = "Bearer " + jwt.sign({ sub: userSubFacebook }, SECRET, {expiresInMinutes: 1000, audience: "1234"});
        assertErrorResponse(400, oauth, "Malformed Auth header", done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should return error if socialProvider is not defined', function (done) {
        var oauth = generateAuthHeader({ sub: "xxxyyy|1234" });
        assertErrorResponse(500, oauth, 'Social provider: xxxyyy is not defined in config', done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should return error if social login is not found', function (done) {
        var oauth = generateAuthHeader({ sub: notFoundSub });
        assertErrorResponse(500, oauth, 'social login not found', done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should return error if user is not found', function (done) {
        var oauth = generateAuthHeader({ sub: "ad|39583208401" });
        assertErrorResponse(500, oauth, 'user not found with id=39583208401', done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should return error if user id is not a number', function (done) {
        var oauth = generateAuthHeader({ sub: "ad|aaxx" });
        assertErrorResponse(400, oauth, 'userId should be number.', done);
    });

    /**
     * /test/oauth/ with header
     */
    it('should be authorized as member (salesforce) - cache version', function (done) {
        var oauth = generateAuthHeader({ sub: userSubSalesforce }),
            response = {accessLevel: "member", userId: 400000, handle: "normal_user"},
            fun = assertResponse.bind(this, response, oauth);
        async.waterfall([
            fun,
            clearDb,
            fun
        ], done);
    });
});
