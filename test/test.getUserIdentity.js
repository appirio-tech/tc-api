/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author  TCSASSEMBLER
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
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get User Identity Information API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    var heffan = testHelper.generateAuthHeader({ sub: 'ad|132456' });

    /**
     * create a http request and test it.
     * @param {Number} expectStatus - the expected response status code.
     * @param {Object} authHeader - the auth header.
     * @param {Function} cb - the call back function.
     */
    function createGetRequest(expectStatus, authHeader, cb) {
        var req = request(API_ENDPOINT)
            .get('/v2/user/identity/')
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
        assertBadResponse(401, 'You need login for this endpoint.', null, done);
    });

    it('should return success result.', function (done) {
        createGetRequest(200, heffan, function (err, result) {
            testHelper.assertResponse(err, result, 'test_files/expected_get_user_identity_1', done);
        });
    });

});
