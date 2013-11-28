/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: pvmagacho
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */

/**
 * Module dependencies.
 */

var assert = require('chai').assert;

var API_ENDPOINT = 'http://localhost:8080';
// var API_ENDPOINT = 'http://stark-eyrie-6617.herokuapp.com';

describe('Query test', function () {

    describe('Query test: ', function () {

        it('async = false', function (done) {
            var request = require('supertest');
            request = request(API_ENDPOINT);

            var projectId = 30010000;
            request = request.
                get('/api/v2/testSync/' + projectId).
                set('Cache-Control', 'no-cache').
                set('Accept', 'application/json');

            // should respond with JSON
            request.expect('Content-Type', /json/);

            // should respond with 200 status
            request.expect(200);

            // end request
            request.end(function (err, res) {
                var body = res.body;
                assert.ifError(body.error);
                assert.ok(body);
                assert.equal(body[0].totalCount, 0);
                assert.equal(body[1].totalCount, 9);
                assert.equal(body[2].totalCount, 20);
                assert.equal(body[1].data[0].project_id, projectId + 1);
                assert.equal(body[2].data[0].project_id, projectId + 2);
                done();
            });
        });
    });
});
