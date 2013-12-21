/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
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
var fs = require('fs');
var request = require('supertest');
var async = require('async');
var assert = require('chai').assert;

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Tops API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow

    function check(type, done) {
        request(API_ENDPOINT)
            .get('/api/v2/develop/statistics/tops/' + type + '?pageIndex=1&pageSize=2')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                assert.ifError(err);
                var body = res.body;
                assert.equal(body.total, 60);
                assert.equal(body.pageIndex, 1);
                assert.equal(body.pageSize, 2);
                assert.ok(body.data);
                assert.equal(body.data.length, 2);
                assert.equal(body.data[0].rank, 1);
                assert.equal(body.data[0].handle, type + "_" + 1);
                assert.equal(body.data[0].color, "Red");
                assert.equal(body.data[0].rating, 2300);
                assert.equal(body.data[1].rank, 2);
                assert.equal(body.data[1].handle, type + "_" + 2);
                assert.equal(body.data[1].color, "Red");
                assert.equal(body.data[1].rating, 2280);
                done(err, res);
            });
    }

    it('test design category', function (done) {
        async.parallel([
            function(callback) {
                check("design", function(err, result) {
                    callback(err, result);
                });
            },
            function(callback) {
                check("development", function(err, result) {
                    callback(err, result);
                });
            },
            function(callback) {
                check("conceptualization", function(err, result) {
                    callback(err, result);
                });
            },
        ], function(err, results) {
            // The err should be null or undefined.
            assert.ok(err === null || err === undefined, "There should be no ERROR: " + err);
            done();
        });
    });
});
