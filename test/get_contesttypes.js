/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: vangavroche
 */
"use strict";

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');

var API_ENDPOINT = 'http://localhost:8080';

describe('Get Contest Types API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow
    
    // Test the unprotected /api/v2/contesttypes 
    describe('GET /api/v2/contesttypes', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var text = fs.readFileSync("test/test_files/expected_get_contesttypes.txt", 'utf8'),
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

            expected.sort(sortBy("project_category_id"));


            request = request(API_ENDPOINT);

            request = request.get('/api/v2/contesttypes').set('Accept', 'application/json');

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
