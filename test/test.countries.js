/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author mekanizumu
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

describe('Get Countries API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow

    // Test the unprotected /v2/develop/countries 
    describe('GET /v2/data/countries', function () {

        /// Check if the data are in expected structure and data
        it('should response with expected structure and data', function (done) {

            var text = fs.readFileSync("test/test_files/expected_get_countries.txt", 'utf8'),
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

            expected.sort(sortBy("countryCode"));

            request = request(API_ENDPOINT);

            request = request.get('/v2/data/countries').set('Accept', 'application/json');

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

