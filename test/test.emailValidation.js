/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author muzehyun
 */
'use strict';
/*global describe, it, before, beforeEach, after, afterEach, __dirname */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var expect = require('chai').expect;
var async = require('async');
var _ = require('underscore');
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Test Email Validation API', function () {
    this.timeout(60000); // The api with testing remote db could be quit slow

    /**
     * Create request and return it
     * @param {String} email the email address for request parameter
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(email, statusCode) {
        var req = request(API_ENDPOINT)
            .get('/v2/users/validateEmail?email=' + encodeURIComponent(email))
            .set('Accept', 'application/json');
        return req.expect(statusCode);
    }

    /**
     * Make request to create customer API
     * @param {String} email the email address for request parameter
     * @param {String} authHeader the Authorization header. Optional
     * @param {Function<err>} done - the callback
     */
    function assertResponse(email, expected, done) {
        createRequest(email, 200)
            .end(function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                assert.ok(result.body);
                assert.isDefined(result.body.available);
                assert.equal(result.body.available, expected);
                done();
            });
    }

    /**
     * It
     */
    it('should return true for valid email', function (done) {
        assertResponse('foo@bar.com', true, done);
    });

    /**
     * It should return true for valid email
     */
    it('should return true for valid email', function (done) {
        assertResponse('x@x.x', true, done);
    });

    /**
     * It should return true for two dots in domain
     */
    it('should return true for two dots in domain', function (done) {
        assertResponse('foo@bar.com.au', true, done);
    });

    /**
     * It should return true for plus sign
     */
    it('should return true for plus sign', function (done) {
        assertResponse('foo+bar@bar.com', true, done);
    });

    /**
     * It should return true for ü in local part
     */
    it('should return true for ü in local part', function (done) {
        assertResponse('hans.müller@test.com', true, done);
    });

    /**
     * It should return true for ü in domain part
     */
    it('should return true for ü in domain part', function (done) {
        assertResponse('hans@müller.com', true, done);
    });

    /**
     * It should return true for |
     */
    it('should return true for |', function (done) {
        assertResponse('test|123@müller.com', true, done);
    });

    /**
     * It should return false for no domain part
     */
    it('should return false for no domain part', function (done) {
        assertResponse('invalidemail@', false, done);
    });

    /**
     * It should return false for no @
     */
    it('should return false for no @', function (done) {
        assertResponse('invalid.com', false, done);
    });

    /**
     * It should return false for no local part
     */
    it('should return false for no local part', function (done) {
        assertResponse('@invalid.com', false, done);
    });

    /**
     * It should return false for too may @
     */
    it('should return false for too may @', function (done) {
        assertResponse('aaa@bbb@ccc.com', false, done);
    });

    /**
     * It should return false for dot in first
     */
    it('should return false for dot in first', function (done) {
        assertResponse('.abc@bcd.com', false, done);
    });

    /**
     * It should return false for two consecutive dots
     */
    it('should return false for two consecutive dots', function (done) {
        assertResponse('a..bc@bcd.com', false, done);
    });

    /**
     * It should return false for existing email
     */
    it('should return false for existing email', function (done) {
        assertResponse('foo@fooonyou.com', false, done);
    });
});
