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
var SQL_DIR = __dirname + "/sqls/memberSRMStatistics/";
var RESPONSE_FILE_PREFIX = "test_files/expected_member_software_";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';


describe('Get Member SRM Statistics API', function () {
    this.timeout(30000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
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
     * Make request to member srm statistics API and compare response with given file
     * @param {String} handle - the handle to check
     * @param {String} file - the file which contains expected response 
     * @param {Function<err>} done - the callback
     */
    function assertResponse(handle, file, done) {
        request(API_ENDPOINT)
            .get('/v2/users/' + handle + '/statistics/data/srm')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var body = res.body, expected = require("./test_files/" + file);
                delete body.serverInformation;
                delete body.requestorInformation;
                assert.deepEqual(body, expected, "Invalid response");
                done();
            });
    }

    /**
     * Test /v2/users/heffan/statistics/data/srm
     */
    it("should return correct statistics for heffan", function (done) {
        assertResponse("heffan", "expected_srm_member_stats_1.json", done);
    });

    /**
     * Test /v2/users/HEFFAN/statistics/data/srm
     */
    it("should return correct statistics for HEFFAN", function (done) {
        assertResponse("HEFFAN", "expected_srm_member_stats_1.json", done);
    });

    /**
     * Test /v2/users/heffan/statistics/data/srm
     * No coder_level entry for user. Everything should be 0.
     */
    it("should return correct statistics for heffan (no coder_level)", function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clean_levels", "topcoder_dw", cb);
            }, function (cb) {
                assertResponse("heffan", "expected_srm_member_stats_2.json", cb);
            }
        ], done);
    });


    /**
     * Test /v2/users/heffan/statistics/data/srm
     * Percentile should be N/A; rank, countryRank and schoolRank should be 'not ranked'
     */
    it("should return correct statistics for heffan (not ranked)", function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__set_ranked", "topcoder_dw", cb);
            }, function (cb) {
                assertResponse("heffan", "expected_srm_member_stats_3.json", cb);
            }
        ], done);
    });

    /**
     * Test /v2/users/notfounduser/statistics/data/srm
     */
    it("should return 404 if user is not found", function (done) {
        request(API_ENDPOINT)
            .get('/v2/users/notfounduser/statistics/data/srm')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(done);
    });
});


