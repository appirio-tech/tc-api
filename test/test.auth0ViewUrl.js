/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, vars: true, unparam: true */

var request = require('supertest');
var assert = require('chai').assert;

/**
 * The api end point.
 */
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * The test cases for auth0Callback get action.
 * It only contains fail test cases here.
 * It cannot auto test the cases which get the correct result. Because it needs to use 3 legs login,
 * it says, it needs a link to call auth0 widget, forward to auth0 widget, forward to 3rd party
 * (git/google/facebook...) login page, input username / password, forward to this callback function.
 * Please refer to deployment guide about how to manually test.
 */
describe('Test auth0 Callback View Url', function () {
    /**
     * Test empty code. Should return error message.
     */
    it('should return error when requesting without code parameter', function (done) {
        var req = request(API_ENDPOINT)
            .get('/v2/auth0/callback')
            .expect('Content-Type', /json/)
            .expect(200);

        req.end(function (err, resp) {
            assert.equal(resp.body.error, 'Error: code is a required parameter for this action');
            done();
        });
    });

    this.timeout(120000); //it'll call auth0 server, it maybe slow.

    /**
     * Test invalid code and state. Should return error message.
     */
    it('should return error when requesting with wrong state parameter or state parameter', function (done) {
        var req = request(API_ENDPOINT)
            .get('/v2/auth0/callback?code=a&state=b')
            .expect('Content-Type', /json/)
            .expect(400);

        req.end(function (err, resp) {
            assert.equal(resp.body.error.details, 'Fails to get access token from auth0.');
            done();
        });
    });
});