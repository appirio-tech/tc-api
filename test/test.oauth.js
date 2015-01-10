/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author Sky_
 * changes in 1.1:
 * - add tests for Create Token api
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
var CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId;
var SECRET = require('../config/tc-config').tcConfig.oauthClientSecret;
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
    var jwtToken = "";
    var jwtTokenCookieKey = process.env.JWT_TOKEN_COOKIE_KEY;


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
     * @param {String} authCookie the Authorization cookie. Optional
     * @return {Object} request
     */
    function createRequest(statusCode, authHeader, authCookie) {
        var req = request(API_ENDPOINT)
            .get('/test/oauth')
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        if (authCookie) {
            req = req.set('cookie', authCookie);
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
                delete response.requesterInformation;
                assert.deepEqual(response, expectedResponse);
                done(err);
            });
    }

    /**
     * Get response and assert response from /test/oauth
     * @param {Object} expectedResponse the expected response
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} authCookie the Authorization cookie. Optional
     * @param {Function<err>} done the callback
     */
    function assertResponseWithCookie(expectedResponse, authHeader, authCookie, done) {
        createRequest(200, authHeader, authCookie)
            .end(function (err, res) {
                assert.ifError(err);
                assert.ok(res.body);
                var response = res.body;
                delete response.serverInformation;
                delete response.requesterInformation;
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
     * Get response and assert response from /test/oauth
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} authCookie the Authorization cookie. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponseWithCookie(statusCode, authHeader, authCookie, errorMessage, done) {
        createRequest(statusCode, authHeader, authCookie)
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
     * Generate an auth cookie
     * @param {Object} data the data to generate
     * @return {String} the generated string
     */
    function generateAuthCookie(data) {
        return jwtTokenCookieKey + "=" + jwt.sign(data || {}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
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
    it('should be authorized as admin (ad)', function (done) {
        var oauth = generateAuthHeader({ sub: adminSubAD});
        assertResponse({accessLevel: "admin", userId: 400001, handle: "admin_user"}, oauth, done);
    });

    /**
     * /test/oauth/ with header and cookie
     */
    it('should be authorized as admin (ad) with both header and cookie', function (done) {
        var authHeader = generateAuthHeader({ sub: adminSubAD});
        var authCookie = generateAuthCookie({ sub: adminSubAD});
        assertResponseWithCookie({accessLevel: "admin", userId: 400001, handle: "admin_user"}, authHeader, authCookie, done);
    });

    /**
     * /test/oauth/ with header and cookie
     */
    it('should be authorized as admin (ad) with header but invalid cookie', function (done) {
        var authHeader = generateAuthHeader({ sub: adminSubAD});
        var authCookie = jwtTokenCookieKey + "=asd";
        assertResponseWithCookie({accessLevel: "admin", userId: 400001, handle: "admin_user"}, authHeader, authCookie, done);
    });

    /**
     * /test/oauth/ without header but with cookie
     */
    it('should be authorized as admin (ad) without header but with cookie', function (done) {
        var authCookie = generateAuthCookie({ sub: adminSubAD});
        assertResponseWithCookie({accessLevel: "admin", userId: 400001, handle: "admin_user"}, null, authCookie, done);
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
     * /test/oauth/ with invalid header but valid cookie
     */
    it('should return error if header is invalid but cookie is valid', function (done) {
        var authHeader = generateAuthHeader({ sub: userSubGoogle});
        var authCookie = generateAuthCookie({ sub: userSubGoogle});
        assertErrorResponseWithCookie(400, authHeader + "asd", authCookie, "Malformed Auth header", done);
    });

    /**
     * /test/oauth/ with no header but invalid cookie
     */
    it('should return error if no header provided but cookie is invalid', function (done) {
        var authCookie = generateAuthCookie({ sub: userSubGoogle});
        assertErrorResponseWithCookie(400, null, authCookie + "asd", "Malformed Auth header", done);
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
    it('should return error if header is invalid (bad format)', function (done) {
        var oauth = generateAuthHeader({ sub: "123" });
        assertErrorResponse(400, oauth, "Malformed Auth header. token.sub is in bad format!", done);
    });

    /**
     * /test/oauth/ with invalid header
     */
    it('should return error if header is invalid (no provider in sub)', function (done) {
        var oauth = generateAuthHeader({ sub: "|123" });
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


    describe("Create Token api", function () {

        /**
         * /v2/auth
         */
        it("should create token", function (done) {
            request(API_ENDPOINT)
                .post('/v2/auth')
                .set('Accept', 'application/json')
                .send({username: "heffan", password: "password"})
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    assert.ok(res.body);
                    assert.ok(res.body.token);
                    jwtToken = res.body.token;
                    done();
                });
        });
        /**
         * /v2/auth
         */
        it("should return error if credentials are invalid", function (done) {
            request(API_ENDPOINT)
                .post('/v2/auth')
                .set('Accept', 'application/json')
                .send({username: "heffan", password: "xxx"})
                .expect('Content-Type', /json/)
                .expect(400)
                .end(done);
        });
    });
    
    describe("Refresh Token api", function () {

        /**
         * /v2/reauth
         */
        it("should refresh token", function (done) {
            request(API_ENDPOINT)
                .post('/v2/reauth')
                .set('Accept', 'application/json')
                .send({token: jwtToken})
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    assert.ok(res.body);
                    assert.ok(res.body.token);
                    done();
                });
        });
        /**
         * /v2/reauth
         */
        it("should return error if the old token is invalid", function (done) {
            request(API_ENDPOINT)
                .post('/v2/reauth')
                .set('Accept', 'application/json')
                .send({token: "invalid_token"})
                .expect('Content-Type', /json/)
                .expect(500)
                .end(done);
        });
    });
});
