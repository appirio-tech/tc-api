/*
 * Copyright (C) 20143 TopCoder Inc., All Rights Reserved.
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
var async = require('async');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var APITEST_FILES_DIR = "./test_files/";
var ERROR_INVALID_STATUS = "status should be an element of OPEN,CLOSED,ALL.";
var ERROR_INVALID_PROJECT = "Invalid jiraProjectId. It may contain only letters, digits or underscores.";
var ERROR_NOTFOUND_PROJECT = 'Project "FOVMROIDMCNAJ" not found';

describe('Test Bugs API', function () {
    this.timeout(30000); // The api with testing remote db could be quit slow

    /**
     * Get response and assert response from /api/v2/bugs/
     * @param {String} url the extra url to append
     * @param {String} file the json file with expected response. Optional
     * @param {Function<err>} done the callback
     */
    function assertResponse(url, file, done) {
        request(API_ENDPOINT)
            .get('/api/v2/bugs/' + url)
            .set('Accept', 'application/json')
            .expect(200)
            .end(function (err, res) {
                assert.ifError(err);
                assert.ok(res.body);
                var response = res.body,
                    expected = require(APITEST_FILES_DIR + file);
                assert.deepEqual(response, expected);
                done(err);
            });
    }

    /**
     * Get response and assert response from /api/v2/bugs/
     * @param {Number} statusCode the expected status code
     * @param {String} url the extra url to append
     * @param {String} errorMessage the expected error message. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(statusCode, url, errorMessage, done) {
        request(API_ENDPOINT)
            .get('/api/v2/bugs/' + url)
            .set('Accept', 'application/json')
            .expect(statusCode)
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
     * Test /api/v2/bugs/APITEST/
     */
    it('should return results for /bugs/APITEST/', function (done) {
        assertResponse("APITEST", "expected_get_bugs_open.json", done);
    });

    /**
     * Test /api/v2/bugs/APITEST/OPEN
     */
    it('should return results for /bugs/APITEST/OPEN', function (done) {
        assertResponse("APITEST/OPEN", "expected_get_bugs_open.json", done);
    });

    /**
     * Test /api/v2/bugs/ApITeST/OpEn
     */
    it('should return results for /bugs/ApITeST/OpEn', function (done) {
        assertResponse("ApITeST/OpEn", "expected_get_bugs_open.json", done);
    });

    /**
     * Test /api/v2/bugs/APITEST/CLOSED
     */
    it('should return results for /bugs/APITEST/CLOSED', function (done) {
        assertResponse("APITEST/CLOSED", "expected_get_bugs_closed.json", done);
    });

    /**
     * Test /api/v2/bugs/APITEST/ALL
     */
    it('should return results for /bugs/APITEST/ALL', function (done) {
        assertResponse("APITEST/ALL", "expected_get_bugs_all.json", done);
    });

    /**
     * Test /api/v2/bugs/APITEST/xxxyyy
     */
    it('should return error if status is invalid value', function (done) {
        assertErrorResponse(400, "APITEST/xxxyyy", ERROR_INVALID_STATUS, done);
    });

    /**
     * Test /api/v2/bugs/APITEST-1/
     */
    it('should return error if project id contains invalid characters (APITEST-1)', function (done) {
        assertErrorResponse(400, "APITEST-1", ERROR_INVALID_PROJECT, done);
    });

    /**
     * Test /api/v2/bugs/APITEST-1/
     */
    it('should return error if project id contains invalid characters (TES!#T)', function (done) {
        assertErrorResponse(400, "TES!#T", ERROR_INVALID_PROJECT, done);
    });

    /**
     * Test /api/v2/bugs/FOVMROIDMCNAJ/
     */
    it('should return error if project is not found', function (done) {
        assertErrorResponse(404, "FOVMROIDMCNAJ", ERROR_NOTFOUND_PROJECT, done);
    });
});