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

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/downloadDocument/";



describe('Test DownloadDocument API', function () {
    this.timeout(30000); // The api with testing remote db could be quit slow
    var adminHeader, memberHeader, forbiddenHeader;

    /**
     * Create authorization header before each test
     * @param {Function<err>} done the callback
     */
    beforeEach(function (done) {
        adminHeader = "Bearer " + testHelper.getAdminJwt();
        memberHeader = "Bearer " + testHelper.getMemberJwt();
        forbiddenHeader = "Bearer " + testHelper.getMemberJwt(124764);
        done();
    });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clear", "tcs_catalog", done);
    }

    /**
     * This function is run before all tests.
     * Generate tests data.
     * @param {Function<err>} done the callback
     */
    before(function (done) {
        async.waterfall([
            function (cb) {
                clearDb(cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__insert_test_data", "tcs_catalog", cb);
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
     * @param {String} url the suffix url
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(url, statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/download/document/' + url)
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect(statusCode);
    }

    /**
     * Make request to download document API and compare mime and filename to expected values
     * @param {String} url the suffix url
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} filename - the expected filename
     * @param {String} mime - the expected mime type
     * @param {Number} contentLength - the expected content length
     * @param {Function<err>} done - the callback
     */
    function assertResponse(url, authHeader, filename, mime, contentLength, done) {
        createRequest(url, 200, authHeader)
            .expect('Content-Type', mime)
            .expect('Content-Disposition', 'attachment; filename=' + filename)
            .expect('Content-Length', String(contentLength))
            .end(done);
    }

    /**
     * Get response and assert response from /download/document
     * @param {String} url the suffix url
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(url, statusCode, authHeader, errorMessage, done) {
        createRequest(url, statusCode, authHeader)
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
     * /v2/download/document/5020002?challengeId=5020000
     */
    it("It should return document test.doc (Case1)", function (done) {
        assertResponse("5020002?challengeId=5020000", memberHeader, "test.doc", "application/msword", 22528, done);
    });

    /**
     * /v2/download/document/5030002?challengeId=5030000
     */
    it("It should return document test.docx (Case2)", function (done) {
        assertResponse("5030002?challengeId=5030000", memberHeader, "test.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 11524, done);
    });

    /**
     * /v2/download/document/5040002?challengeId=5040000
     */
    it("It should return document test.jar (Case3)", function (done) {
        assertResponse("5040002?challengeId=5040000", memberHeader, "test.jar", "application/java-archive", 5495, done);
    });

    /**
     * /v2/download/document/5050002?challengeId=5050000
     */
    it("It should return document test.jpg (Case4)", function (done) {
        assertResponse("5050002?challengeId=5050000", memberHeader, "test.jpg", "image/jpeg", 4135, done);
    });

    /**
     * /v2/download/document/5060002?challengeId=5060000
     */
    it("It should return document test.pdf (Case5)", function (done) {
        assertResponse("5060002?challengeId=5060000", memberHeader, "test.pdf", "application/pdf", 80972, done);
    });

    /**
     * /v2/download/document/5070002?challengeId=5070000
     */
    it("It should return document test.ppt (Case6)", function (done) {
        assertResponse("5070002?challengeId=5070000", memberHeader, "test.ppt", "application/vnd.ms-powerpoint", 86016, done);
    });

    /**
     * /v2/download/document/5080002?challengeId=5080000
     */
    it("It should return document test.txt (Case7)", function (done) {
        assertResponse("5080002?challengeId=5080000", memberHeader, "test.txt", "text/plain", 30, done);
    });

    /**
     * /v2/download/document/5090002?challengeId=5090000
     */
    it("It should return document test.xls (Case8)", function (done) {
        assertResponse("5090002?challengeId=5090000", memberHeader, "test.xls", "application/vnd.ms-excel", 23040, done);
    });

    /**
     * /v2/download/document/5100002?challengeId=5100000
     */
    it("It should return document test.zip (Case9)", function (done) {
        assertResponse("5100002?challengeId=5100000", memberHeader, "test.zip", "application/zip", 5495, done);
    });

    /**
     * /v2/download/document/5100002?challengeId=5100000
     */
    it("It should return document test.zip (Case9) for admin", function (done) {
        assertResponse("5100002?challengeId=5100000", adminHeader, "test.zip", "application/zip", 5495, done);
    });

    /**
     * /v2/download/document/5100002?challengeId=5100000
     */
    it("It should return Unauthorized error for anon user", function (done) {
        assertErrorResponse("5100002?challengeId=5100000", 401, null, null, done);
    });

    /**
     * Case 1 is public
     */

    /**
     * /v2/download/document/5030002?challengeId=5030000
     */
    it("It should return Forbidden error for member user with no permission (Case2)", function (done) {
        assertErrorResponse("5030002?challengeId=5030000", 403, forbiddenHeader, null, done);
    });

    /**
     * /v2/download/document/5040002?challengeId=5040000
     */
    it("It should return Forbidden error for member user with no permission (Case3)", function (done) {
        assertErrorResponse("5040002?challengeId=5040000", 403, forbiddenHeader, null, done);
    });

    /**
     * /v2/download/document/5050002?challengeId=5050000
     */
    it("It should return Forbidden error for member user with no permission (Case4)", function (done) {
        assertErrorResponse("5050002?challengeId=5050000", 403, forbiddenHeader, null, done);
    });

    /**
     * /v2/download/document/5060002?challengeId=5060000
     */
    it("It should return Forbidden error for member user with no permission (Case5)", function (done) {
        assertErrorResponse("5060002?challengeId=5060000", 403, forbiddenHeader, null, done);
    });

    /**
     * /v2/download/document/5070002?challengeId=5070000
     */
    it("It should return Forbidden error for member user with no permission (Case6)", function (done) {
        assertErrorResponse("5070002?challengeId=5070000", 403, forbiddenHeader, null, done);
    });

    /**
     * /v2/download/document/5080002?challengeId=5080000
     */
    it("It should return Forbidden error for member user with no permission (Case7)", function (done) {
        assertErrorResponse("5080002?challengeId=5080000", 403, forbiddenHeader, null, done);
    });

    /**
     * Case 8 is public
     */

    /**
     * /v2/download/document/5100002?challengeId=5100000
     */
    it("It should return Forbidden error for member user with no permission (Case9)", function (done) {
        assertErrorResponse("5100002?challengeId=5100000", 403, forbiddenHeader, null, done);
    });

    /**
     * /v2/download/document/5100002
     */
    it("It should return if challengeId is not defined", function (done) {
        assertErrorResponse("5100002", 200, memberHeader,
            "Error: challengeId is a required parameter for this action", done);
    });

    /**
     * /v2/download/document/asd?challengeId=5100000
     */
    it("It should return error if docId is not a number", function (done) {
        assertErrorResponse("asd?challengeId=5100000", 400, memberHeader, "docId should be number.", done);
    });

    /**
     * /v2/download/document/-1?challengeId=5100000
     */
    it("It should return error if docId is less than 0", function (done) {
        assertErrorResponse("-1?challengeId=5100000", 400, memberHeader, "docId should be positive.", done);
    });

    /**
     * /v2/download/document/1.234?challengeId=5100000
     */
    it("It should return error if docId is float number", function (done) {
        assertErrorResponse("1.234?challengeId=5100000", 400, memberHeader, "docId should be Integer.", done);
    });

    /**
     * /v2/download/document/1000000000000000?challengeId=5100000
     */
    it("It should return error if docId is too big number", function (done) {
        assertErrorResponse("1000000000000000?challengeId=5100000", 400, memberHeader,
            "docId should be less or equal to 2147483647.", done);
    });

    /**
     * /v2/download/document/5100002?challengeId=asd
     */
    it("It should return error if challengeId is not a number", function (done) {
        assertErrorResponse("5100002?challengeId=asd", 400, memberHeader, "challengeId should be number.", done);
    });

    /**
     * /v2/download/document/5100002?challengeId=-1
     */
    it("It should return error if challengeId is less than 0", function (done) {
        assertErrorResponse("5100002?challengeId=-1", 400, memberHeader, "challengeId should be positive.", done);
    });

    /**
     * /v2/download/document/5100002?challengeId=1.234
     */
    it("It should return error if challengeId is float number", function (done) {
        assertErrorResponse("5100002?challengeId=1.234", 400, memberHeader, "challengeId should be Integer.", done);
    });

    /**
     * /v2/download/document/5100002?challengeId=1000000000000000
     */
    it("It should return error if challengeId is too big number", function (done) {
        assertErrorResponse("5100002?challengeId=1000000000000000", 400, memberHeader,
            "challengeId should be less or equal to 2147483647.", done);
    });

    /**
     * /v2/download/document/5100002?challengeId=12345678
     */
    it("It should return error if challengeId does not belong to document", function (done) {
        assertErrorResponse("5100002?challengeId=12345678", 400, memberHeader,
            "Document does not belong to project with given challengeId", done);
    });

    /**
     * /v2/download/document/12345678?challengeId=12345678
     */
    it("It should return error if document is not found", function (done) {
        assertErrorResponse("12345678?challengeId=12345678", 404, memberHeader, null, done);
    });
});