/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * change in 1.1:
 * - use before and after to setup and clean data
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/tops/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Tops API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow


    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clean", "topcoder_dw", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__clean", "tcs_dw", cb);
            }
        ], done);
    }

    /**
     * This function is run before all tests.
     * Generate tests data.
     * @param {Function<err>} done the callback
     */
    before(function (done) {
        async.waterfall([
            clearDb,
            function (cb) {
                var files = testHelper.generatePartPaths(SQL_DIR + "topcoder_dw__insert_test_data", "", 2);
                testHelper.runSqlFiles(files, "topcoder_dw", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__insert_test_data", "tcs_dw", cb);
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


    function check(type, done) {
        request(API_ENDPOINT)
            .get('/v2/develop/statistics/tops/' + type + '?pageIndex=1&pageSize=2')
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
                done();
            });
    }

    it('test design category', function (done) {
        check("design", done);
    });

    it('test development category', function (done) {
        check("development", done);
    });
    it('test conceptualization category', function (done) {
        check("conceptualization", done);
    });
    it('test specification category', function (done) {
        check("specification", done);
    });
    it('test architecture category', function (done) {
        check("architecture", done);
    });

    it('test assembly category', function (done) {
        check("assembly", done);
    });

    it('test test_suites category', function (done) {
        check("test_suites", done);
    });
    it('test test_scenarios category', function (done) {
        check("test_scenarios", done);
    });
    it('test ui_prototype category', function (done) {
        check("ui_prototype", done);
    });
    it('test ria_build category', function (done) {
        check("ria_build", done);
    });
    it('test content_creation category', function (done) {
        check("content_creation", done);
    });

    it('should return Bad Request. Wrong type', function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/statistics/tops/zncjsajhdbf')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(done);
    });

    it('should return Bad Request. Invalid pageIndex', function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/statistics/tops/design?pageIndex=xxx')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(done);
    });

    it('should return Bad Request. Invalid pageSize', function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/statistics/tops/design?pageIndex=1&pageSize=xxx')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(done);
    });

    it('should return Not found', function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/statistics/tops/design?pageIndex=100&pageSize=200')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(done);
    });
});