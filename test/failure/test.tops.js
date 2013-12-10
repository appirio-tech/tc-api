/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author pvmagacho, Sky_
 * changes in 1.1: remove accuracy test and color check
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request;
var assert = require('chai').assert;


var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
// var API_ENDPOINT = 'http://protected-retreat-7238.herokuapp.com';

describe('Get Tops Statistics API - ', function () {
    this.timeout(30000); // The api with testing remote db could be quit slow

    beforeEach(function () {
        request = require('supertest');
    });

    // Test the topsData /v2/develop/statistics/tops/ for failures
    describe('GET /v2/develop/statistics/tops: ', function () {

        /// Check if the data are in expected struture and data
        it('missing contestType - should response api error', function (done) {
            request = request(API_ENDPOINT);

            request = request.get('/v2/develop/statistics/tops')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 200 status
            request.expect(200);

            // end request
            request.end(done);
        });

        /// Check if the data are in expected struture and data
        it('incorrect contestType - should response with bad request', function (done) {
            request = request(API_ENDPOINT);

            request = request.get('/v2/develop/statistics/tops/dummy')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 400 status
            request.expect(400);

            // end request
            request.end(done);
        });


        /// Check if the data are in expected struture and data
        it('non-number pageIndex - should response bad request', function (done) {
            request = request(API_ENDPOINT);

            request = request
                .get('/v2/develop/statistics/tops/assembly?pageIndex=xx&pageSize=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 400 status
            request.expect(400);

            // end request
            request.end(done);
        });

        /// Check if the data are in expected struture and data
        it('pageIndex equal to zero - should response bad request', function (done) {
            request = request(API_ENDPOINT);

            request = request
                .get('/v2/develop/statistics/tops/assembly?pageIndex=0&pageSize=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 400 status
            request.expect(400);

            // end request
            request.end(done);
        });

        /// Check if the data are in expected struture and data
        it('very negative pageIndex - should response bad request', function (done) {
            request = request(API_ENDPOINT);

            request = request
                .get('/v2/develop/statistics/tops/assembly?pageIndex=-5&pageSize=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 400 status
            request.expect(400);

            // end request
            request.end(done);
        });

        /// Check if the data are in expected struture and data
        it('missing pageSize - should response bad request', function (done) {
            request = request(API_ENDPOINT);

            request = request
                .get('/v2/develop/statistics/tops/assembly?pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 400 status
            request.expect(400);

            // end request
            request.end(done);
        });

        /// Check if the data are in expected struture and data
        it('non-number pageSize - should response bad request', function (done) {
            request = request(API_ENDPOINT);

            request = request
                .get('/v2/develop/statistics/tops/assembly?pageIndex=1&pageSize=xx')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 400 status
            request.expect(400);

            // end request
            request.end(done);
        });

        /// Check if the data are in expected struture and data
        it('negative pageSize - should response bad request', function (done) {
            request = request(API_ENDPOINT);

            request = request
                .get('/v2/develop/statistics/tops/assembly?pageIndex=1&pageSize=-1')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 400 status
            request.expect(400);

            // end request
            request.end(done);
        });

        /// Check if the data are in expected struture and data
        it('big pageIndex - should response not found', function (done) {
            request = request(API_ENDPOINT);

            request = request
                .get('/v2/develop/statistics/tops/assembly?pageIndex=500&pageSize=5')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 404 status
            request.expect(404);

            // end request
            request.end(done);
        });

        /// Check if the data are in expected struture and data
        it('huge pageIndex - should response bad request', function (done) {
            request = request(API_ENDPOINT);

            request = request
                .get('/v2/develop/statistics/tops/assembly?pageIndex=1000000000000000000000000000&pageSize=5')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 400 status
            request.expect(400);

            // end request
            request.end(done);
        });

        /// Check if the data are in expected struture and data
        it('huge pageSize - should response bad request', function (done) {
            request = request(API_ENDPOINT);

            request = request
                .get('/v2/develop/statistics/tops/assembly?pageIndex=1&pageSize=1000000000000000000000000000')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 404 status
            request.expect(400);

            // end request
            request.end(done);
        });
    });
});
