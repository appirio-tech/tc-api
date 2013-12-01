/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author pvmagacho
 */
"use strict";
var request = require('supertest');
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, maxlen: 200 */

/**
 * Moduleedependencies.
 */
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Topcoder NodeJS Contest Retrieval API v1.0 Security:', function () {
    this.timeout(30000); // The api with testing remote db could be quit slow

    // Test the unprotected /v2/design/challenges
    describe('GET /v2/design/challenges', function () {

        beforeEach(function () {
            request = require('supertest');
        });

        it('incorrect verb', function (done) {
            request = request(API_ENDPOINT);

            request = request.post('/v2/design/challenges')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            request.expect(/Error: v2 is not a known action or that is not a valid apiVersion\./g);

            // should respond with 200 status
            request.expect(200);

            // end request
            request.end(done);
        });

        it('sql injection in listType', function (done) {
            request = request(API_ENDPOINT);

            request = request.get('/v2/design/challenges?listType=SELECT * FROM TABLE&listType=ACTIVE')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            request.expect(/The request was invalid\./g);

            // should respond with 200 status
            request.expect(400);

            // end request
            request.end(done);
        });

        it('sql injection in sortColumn', function (done) {
            request = request(API_ENDPOINT);

            request = request.get('/v2/design/challenges?sortColumn=SELECT * FROM TABLE&listType=ACTIVE')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            request.expect(/The request was invalid\./g);

            // should respond with 200 status
            request.expect(400);

            // end request
            request.end(done);
        });

        it('sql injection in sortOrder', function (done) {
            request = request(API_ENDPOINT);

            request = request.get('/v2/design/challenges?sortOrder=SELECT * FROM TABLE&listType=ACTIVE')
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            request.expect(/The request was invalid\./g);

            // should respond with 200 status
            request.expect(400);

            // end request
            request.end(done);
        });

        it('sql injection in catalog', function (done) {
            request = request(API_ENDPOINT);

            request = request.get("/v2/design/challenges?catalog=(CASE WHEN (SELECT count(*) from project) = 0 THEN NULL ELSE '' END)")
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            request.expect(/The URI requested is invalid or the requested resource does not exist\./g);

            // should respond with 200 status
            request.expect(404);

            // end request
            request.end(done);
        });

        it('sql injection in prizeLowerBound', function (done) {
            request = request(API_ENDPOINT);

            request = request.get("/v2/design/challenges?prizeLowerBound=(CASE WHEN (SELECT count(*) from project) = 0 THEN 0 ELSE 1000 END) ")
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            request.expect(/The request was invalid\./g);

            // should respond with 200 status
            request.expect(400);

            // end request
            request.end(done);
        });

        it('sql injection in prizeUpperBound', function (done) {
            request = request(API_ENDPOINT);

            request = request.get("/v2/design/challenges?prizeUpperBound=(CASE WHEN (SELECT count(*) from project) = 0 THEN 0 ELSE 1000 END) ")
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            request.expect(/The request was invalid\./g);

            // should respond with 200 status
            request.expect(400);

            // end request
            request.end(done);
        });

        it('sql injection in projectId', function (done) {
            request = request(API_ENDPOINT);

            request = request.get("/v2/design/challenges?projectId=(CASE WHEN (SELECT count(*) from project) = 0 THEN 0 ELSE 1000 END)")
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            request.expect(/The request was invalid\./g);

            // should respond with 200 status
            request.expect(400);

            // end request
            request.end(done);
        });

        it('sql injection in pageIndex', function (done) {
            request = request(API_ENDPOINT);

            request = request.get("/v2/design/challenges?pageIndex=(CASE WHEN (SELECT count(*) from project) = 0 THEN 0 ELSE 1000 END)")
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            request.expect(/The request was invalid\./g);

            // should respond with 200 status
            request.expect(400);

            // end request
            request.end(done);
        });

        it('sql injection in pageSize', function (done) {
            request = request(API_ENDPOINT);

            request = request.get("/v2/design/challenges?pageSize=(CASE WHEN (SELECT count(*) from project) = 0 THEN 0 ELSE 1000 END)")
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            request.expect(/The request was invalid\./g);

            // should respond with 200 status
            request.expect(400);

            // end request
            request.end(done);
        });

        it('sql injection in type', function (done) {
            request = request(API_ENDPOINT);

            request = request.get("/v2/design/challenges?type=(CASE WHEN (SELECT count(*) from project) = 0 THEN 0 ELSE 1000 END)")
                .set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            request.expect(/The request was invalid\./g);

            // should respond with 200 status
            request.expect(400);

            // end request
            request.end(done);
        });

    });
});
