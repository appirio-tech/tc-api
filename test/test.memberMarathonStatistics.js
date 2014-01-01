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
var SQL_DIR = __dirname + "/sqls/memberMarathonStatistics/";
var RESPONSE_FILE_PREFIX = "test_files/expected_member_software_";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';


describe('Get Member Marathon Statistics API', function () {
    this.timeout(30000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clear", "topcoder_dw", done);
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
     * Make request to member marathon statistics API and compare response with given file
     * @param {String} handle - the handle to check
     * @param {String} file - the file which contains expected response 
     * @param {Function<err>} done - the callback
     */
    function assertResponse(handle, file, done) {
        request(API_ENDPOINT)
            .get('/v2/users/' +handle + '/statistics/data/marathon')
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
     * Test /v2/users/Hung/statistics/data/marathon
     */
    it("should return correct statistics for Hung", function (done) {
        assertResponse("Hung", "expected_marathon_member_stats_1.json", done);
    });


    /**
     * Test /v2/users/hung/statistics/data/marathon
     */
    it("should return correct statistics for hung", function (done) {
        assertResponse("hung", "expected_marathon_member_stats_1.json", done);
    });

    /**
     * Test /v2/users/hung/statistics/data/marathon
     * Percentile should be N/A; rank, countryRank and schoolRank should be 'not ranked'
     */
    it("should return correct statistics for hung (not ranked)", function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__set_ranked", "topcoder_dw", cb);
            }, function (cb) {
                assertResponse("hung", "expected_marathon_member_stats_2.json", cb);
            }
        ], done);
    });

    /**
     * Test /v2/users/notfounduser/statistics/data/marathon
     */
    it("should return 404 if user is not found", function (done) {
        request(API_ENDPOINT)
            .get('/v2/users/notfounduser/statistics/data/marathon')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(done);
    });
});


