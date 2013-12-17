/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
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
var SQL_DIR = __dirname + "/sqls/memberSoftwareStatistics/";
var RESPONSE_FILE_PREFIX = "test_files/expected_member_software_";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';


describe('Get Member Software Statistics API', function () {
    this.timeout(30000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", "tcs_catalog", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__clean", "tcs_dw", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clean", "topcoder_dw", cb);
            }
        ], done);
    }

    /**
     * This function is run before each test.
     * Generate tests data.
     * @param {Function<err>} done the callback
     */
    beforeEach(function (done) {
        async.waterfall([
            clearDb,
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__insert_test_data", "tcs_dw", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__insert_test_data", "tcs_catalog", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__insert_test_data", "topcoder_dw", cb);
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

    /**
     * Test /v2/develop/statistics/heffan
     */
    it("should return correct statistics for heffan", function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/statistics/heffan')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                testHelper.assertResponse(err,
                    res,
                    RESPONSE_FILE_PREFIX + "stats.json",
                    done);
            });
    });


    /**
     * Test /v2/develop/statistics/heffan
     * No reviewer rating, but there should be still copilot stats.
     */
    it("should return correct statistics for heffan (no reviewer rating)", function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean_reviewer_rating", "tcs_catalog", cb);
            }, function (cb) {
                request(API_ENDPOINT)
                    .get('/v2/develop/statistics/heffan')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        testHelper.assertResponse(err,
                            res,
                            RESPONSE_FILE_PREFIX + "stats_no_reviewer_rating.json",
                            cb);
                    });
            }
        ], done);
    });

    /**
     * Test /v2/develop/statistics/heffan
     * No statistics for tracks, but there should be still copilot and reviewer stats.
     */
    it("should return correct statistics for heffan (no tracks)", function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__clean_tracks", "tcs_dw", cb);
            }, function (cb) {
                request(API_ENDPOINT)
                    .get('/v2/develop/statistics/heffan')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        testHelper.assertResponse(err,
                            res,
                            RESPONSE_FILE_PREFIX + "stats_no_tracks.json",
                            cb);
                    });
            }
        ], done);
    });

    /**
     * Test /v2/develop/statistics/notfounduser
     */
    it("should return 404 if user is not found", function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/statistics/notfounduser')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(done);
    });
});


