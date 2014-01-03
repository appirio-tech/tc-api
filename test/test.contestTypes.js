/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.2
 * @author vangavroche, KeSyren, TCSASSEMBLER
 * changes in 1.1:
 * - update unit tests as contest types are now separated.
 * changes in 1.2:
 * - use test_files under accuracy directory
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Contest Types API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow

    var sortBy = function (prop) {
        return function (a, b) {
            var ret = 0;
            if (a[prop] > b[prop]) {
                ret = 1;
            } else if (a[prop] < b[prop]) {
                ret = -1;
            }
            return ret;
        };
    },
        check = function (url, fileName, done) {
            var text = fs.readFileSync("test/test_files/" + fileName, 'utf8'),
                expected = JSON.parse(text);
            expected.sort(sortBy("challengeCategoryId"));
            request(API_ENDPOINT)
                .get(url)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    }
                    assert.deepEqual(res.body, expected, 'Invalid contest types');
                    done();
                });
        };

    // Test the unprotected /v2/develop/challengetypes 
    describe('GET /v2/develop/challengetypes', function () {

        /// Check if the data are in expected structure and data
        it('should response with expected structure and data', function (done) {
            check('/v2/develop/challengetypes', 'expected_get_softwaretypes.txt', done);
        });
    });

    describe('GET /v2/design/challengetypes', function () {

        /// Check if the data are in expected structure and data
        it('should response with expected structure and data', function (done) {
            check('/v2/design/challengetypes', 'expected_get_studiotypes.txt', done);
        });
    });
});

