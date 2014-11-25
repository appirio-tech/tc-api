/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 *
 * The test cases for sourceCodeImage.js.
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var _ = require('underscore'),
    async = require('async'),
    request = require('supertest'),
    chai = require('chai'),
    fs = require('fs');

var assert = chai.assert;

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080',
    QUERY_URL = '/v2/src2image',
    BASE_URL = __dirname + "/test_files/sourceCodeImage/";

/**
 * Create request and return it
 * @param {Object} data - the query data
 * @return {Object} request
 */
function createRequest(data) {
    return request(API_ENDPOINT)
        .post(QUERY_URL)
        .set('Content-Type', 'application/json')
        .set("Accept", "application/json")
        .send(data);
}

/**
 * Helper method for validating
 * @param {Object} data - the query data
 * @param {String} filePath - the file path
 * @param {Function} done - the callback function
 */
function validateResult(data, filePath, done) {
    data.code = fs.readFileSync(BASE_URL + filePath).toString();

    createRequest(data).expect(200).end(function (err, res) {
        if (err) {
            done(err);
            return;
        }
        assert.equal(res.headers["content-type"], 'image/jpeg', 'The content type should be image/jpeg.');
        done();
    });
}

/**
 * Assert error request.
 *
 * @param {Object} data - the query data
 * @param {Number} statusCode - the expected status code
 * @param {String} errorDetail - the error detail.
 * @param {Function} done the callback function
 */
function assertError(data, statusCode, errorDetail, done) {
    createRequest(data).expect(statusCode).end(function (err, res) {
        if (err) {
            done(err);
            return;
        }
        if (statusCode === 200) {
            assert.equal(res.body.error, errorDetail, "Invalid error detail");
        } else {
            assert.equal(res.body.error.details, errorDetail, "Invalid error detail");
        }
        done();
    });
}

describe('Convert source code to image APIs', function () {
    this.timeout(120000); // Wait 2 minutes, convert large code value might be slow.

    describe('Convert source code to image API', function () {
        var validateData = {"code": "", "lang" : "java"};

        it("Error: code is a required parameter for this action", function (done) {
            validateData = {"code": "", "lang" : "java"};
            assertError(validateData, 200, "Error: code is a required parameter for this action", done);
        });

        it("Error: lang is a required parameter for this action", function (done) {
            validateData = {"code": "for(var i=0;i<10;i++)alert(i);", "lang" : ""};
            assertError(validateData, 200, "Error: lang is a required parameter for this action", done);
        });

        it("The language name is invalid.", function (done) {
            validateData = {"code": "for(var i=0;i<10;i++)alert(i);", "lang" : "invalid"};
            assertError(validateData, 400, "The language name is invalid.", done);
        });

        it("The style name is invalid.", function (done) {
            validateData = {"code": "for(var i=0;i<10;i++)alert(i);", "lang" : "java", "style": "invalid"};
            assertError(validateData, 400, "The style name is invalid.", done);
        });

        it("Valid request for java.", function (done) {
            validateData = {"code": "", "lang" : "java"};
            validateResult(validateData, 'java.txt', done);
        });

        it("Valid request for c++.", function (done) {
            validateData = {"code": "", "lang" : "c"};
            validateResult(validateData, 'c++.txt', done);
        });

        it("Valid request for c#.", function (done) {
            validateData = {"code": "", "lang" : "cs"};
            validateResult(validateData, 'cs.txt', done);
        });

        it("Valid request for python.", function (done) {
            validateData = {"code": "", "lang" : "python"};
            validateResult(validateData, 'python.txt', done);
        });

        it("Valid request for vb.net.", function (done) {
            validateData = {"code": "", "lang" : "vbnet"};
            validateResult(validateData, 'vbnet.txt', done);
        });

        it("Valid request for java 10k.", function (done) {
            validateData = {"code": "", "lang" : "java"};
            validateResult(validateData, 'java-10k.txt', done);
        });

        it("Valid request for java 30k.", function (done) {
            validateData = {"code": "", "lang" : "java"};
            validateResult(validateData, 'java-30k.txt', done);
        });

        it("Valid request for java 60k.", function (done) {
            validateData = {"code": "", "lang" : "java"};
            validateResult(validateData, 'java-60k.txt', done);
        });

        it("Valid request for java 100k.", function (done) {
            validateData = {"code": "", "lang" : "java"};
            validateResult(validateData, 'java-100k.txt', done);
        });
    });

});