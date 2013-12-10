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

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Contest Types API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow

    // Test the unprotected /v2/develop/challengetypes 
    describe('GET /v2/develop/challengetypes', function () {

        /// Check if the data are in expected structure and data
        it('should response with expected structure and data', function (done) {

            var text = fs.readFileSync("test/accuracy/test_files/expected_get_contesttypes.txt", 'utf8'),
                expected = JSON.parse(text);

            function sortBy(prop) {
                return function (a, b) {
                    var ret = 0;
                    if (a[prop] > b[prop]) {
                        ret = 1;
                    } else if (a[prop] < b[prop]) {
                        ret = -1;
                    }
                    return ret;
                };
            }

            expected.sort(sortBy("challengeCategoryId"));

            request = request(API_ENDPOINT);

            request = request.get('/v2/develop/challengetypes').set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with expected data
            request.expect(expected);

            // should respond with 200 status
            request.expect(200);

            // end request
            request.end(done);
        });
    });
});

