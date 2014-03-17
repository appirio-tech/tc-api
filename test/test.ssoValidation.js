/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var testHelper = require('./helpers/testHelper');
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Test TC SSO Cookie Validation API', function () {
    this.timeout(120000); // The api with testing remote db could be quit slow

    /**
     * Create request and return it
     * @param {String} cookie the cookie string. Optional
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(cookie, statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/validation/sso')
            .set('Accept', 'application/json');
        if (cookie) {
            req = req.set('Cookie', cookie);
        }
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect('Content-Type', /json/).expect(statusCode);
    }

    /**
     * Make request to TC SSO Cookie Validation API and compare varify response
     * @param {String} cookie the cookie string. Optional
     * @param {String} authHeader the Authorization header. Optional
     * @param {Function<err>} done - the callback
     */
    function assertResponse(cookie, authHeader, done) {
        createRequest(cookie, 200, authHeader)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var body = res.body,
                    userId;
                assert.ok(body);
                assert.ok(body.userId);
                userId = cookie.split('|')[0].split('=')[1];
                assert.equal(body.userId, userId);
                done();
            });
    }

    /**
     * Get response and assert response
     * @param {String} cookie the cookie string. Optional
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(cookie, statusCode, authHeader, errorMessage, done) {
        createRequest(cookie, statusCode, authHeader)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                if (errorMessage) {
                    assert.ok(res.body);
                    assert.ok(res.body.error);
                    if (statusCode === 200) {
                        assert.equal(res.body.error, errorMessage);
                    } else {
                        assert.equal(res.body.error.details, errorMessage);
                    }
                }
                done();
            });
    }

    /**
     * It should return error 400 for no cookie
     */
    it('should return error 400 for no cookie', function (done) {
        assertErrorResponse(null, 400, null, 'No sso cookie has been received.', done);
    });

    /**
     * It should return error 400 for invalid separator
     */
    it('should return error 400 for invalid separator', function (done) {
        var cookie = 'tcsso=132456_14e6a6fcedc72974ee4b3cf9837aadb2f229ad1351702da1aceb6d573eb26a4';
        assertErrorResponse(cookie, 400, null, 'Invaid sso cookie format.', done);
    });

    /**
     * It should return error 400 for non-number user id
     */
    it('should return error 400 for non-number user id', function (done) {
        var cookie = 'tcsso=123abc|14e6a6fcedc72974ee4b3cf9837aadb2f229ad1351702da1aceb6d573eb26a4';
        assertErrorResponse(cookie, 400, null, 'userId should be number.', done);
    });

    /**
     * It should return error 400 for too large user id
     */
    it('should return error 400 for too large user id', function (done) {
        var cookie = 'tcsso=12312311223123|14e6a6fcedc72974ee4b3cf9837aadb2f229ad1351702da1aceb6d573eb26a4';
        assertErrorResponse(cookie, 400, null, 'userId should be less or equal to 2147483647.', done);
    });

    /**
     * It should return error 400 for empty user id
     */
    it('should return error 400 for empty user id', function (done) {
        var cookie = 'tcsso=|14e6a6fcedc72974ee4b3cf9837aadb2f229ad1351702da1aceb6d573eb26a4';
        assertErrorResponse(cookie, 400, null, 'Invalid sso cookie - user id doesn\'t exist.', done);
    });

    /**
     * should return error 400 for not matched hash value
     */
    it('should return error 400 for not matched hash value', function (done) {
        var cookie = 'tcsso=132456|14e6a6fcedc72974ee4b3cf9837aadb2f229ad1351702da1aceb6d573eb26a4';
        assertErrorResponse(cookie, 400, null, 'Invalid sso cookie (hash not matched).', done);
    });

    /**
     * It should return success 200 for user 132456 with valid cookie
     */
    it('should return success 200 for user 132456 with valid cookie', function (done) {
        var cookie = 'tcsso=132456|4a6acc4d5327773989a7e8c23b04e8cd1c3da79a1256590973ed731ffa0f24a2';
        assertResponse(cookie, null, done);
    });

    /**
     * It should return success 200 for user 132458 with valid cookie
     */
    it('should return success 200 for user 132458 with valid cookie', function (done) {
        var cookie = 'tcsso=132458|6fa5869e278a4d2257055ca40923a6adf4b6c64d2b6b9f2f98ebb95ef4a42668';
        assertResponse(cookie, null, done);
    });
});
