/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 *
 * The test cases for active and upcoming challenges of dataScienceChallenges.js.
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true, plusplus: true */

/**
 * Module dependencies.
 */
var _ = require('underscore'),
    async = require('async'),
    request = require('supertest'),
    chai = require('chai');

var assert = chai.assert;
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080',
    SQL_DIR = __dirname + "/sqls/activeAndUpcomingDataScienceChallenges/";
var EXPECTED_DIR = __dirname + "/test_files/activeAndUpcomingDataScienceChallenges/";


/**
 * Create request and return it
 * @param {String} queryString - the query string
 * @return {Object} request
 */
function createRequest(queryString) {
    return request(API_ENDPOINT)
        .get(queryString)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/);
}

/**
 * Assert error request.
 *
 * @param {String} queryString - the query string
 * @param {String} dateFrom - the from date
 * @param {String} dateTo - the to date
 * @param {Number} statusCode - the expected status code
 * @param {String} errorDetail - the error detail.
 * @param {Function} done the callback function
 */
function assertError(queryString, dateFrom, dateTo, statusCode, errorDetail, done) {
    var queryParams = '?';
    if (dateFrom !== null) {
        queryParams += '&submissionEndFrom=' + dateFrom;
    }
    if (dateTo !== null) {
        queryParams += '&submissionEndTo=' + dateTo;
    }
    createRequest(queryString + queryParams).expect(statusCode).end(function (err, res) {
        if (err) {
            done(err);
            return;
        }
        if (statusCode === 200) {
            assert.equal(res.body.error, errorDetail, "Invalid error detail");
        } else {
            assert.equal(res.body.error.details, errorDetail, "Invalid error detail");
        }
        done();
    });
}

/**
 * Test the success call.
 * @param isActive - the active flag
 * @param dateFrom - the from date
 * @param dateTo - the to date
 * @param expectedResultFile - the json result file
 * @param callback - the callback function
 */
function testSuccessScenario(isActive, dateFrom, dateTo, expectedResultFile, callback) {
    var queryParams = '?';

    if (dateFrom !== null) {
        queryParams += '&submissionEndFrom=' + dateFrom;
    }
    if (dateTo !== null) {
        queryParams += '&submissionEndTo=' + dateTo;
    }

    request(API_ENDPOINT)
        .get('/v2/dataScience/challenges/' + (isActive ? 'active' : 'upcoming') + queryParams)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
            if (err) {
                callback(err);
                return;
            }
            var body = res.body,
                expected = require(EXPECTED_DIR + expectedResultFile + '.json'),
                i;

            delete body.serverInformation;
            delete body.requesterInformation;

            for (i = 0; i < body.data.length; i++) {
                if (body.data[i].challengeId === 13672 || body.data[i].challengeId === 13673) {
                    delete body.data[i].registrationStartDate;
                    delete body.data[i].submissionEndDate;
                    delete body.data[i].postingDate;
                }
            }

            assert.deepEqual(body, expected, "Wrong response returned for " + expectedResultFile);

            callback();
        });
}

describe('Active And Upcoming Data Science Challenges APIs', function () {
    this.timeout(120000); // Wait 2 minutes, remote db might be slow.

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__clean", 'informixoltp', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", 'tcs_catalog', cb);
            }
        ], done);
    }

    /**
     * This function is run before all tests.
     *
     * @param {Function<err>} done the callback
     */
    before(function (done) {
        async.waterfall([
            clearDb,
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_test_data", "informixoltp", cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__insert_test_data", "tcs_catalog", cb);
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

    describe('Active Data Science Challenges invalid test', function () {

        it("Invalid submissionEndFrom.", function (done) {
            assertError("/v2/dataScience/challenges/active", "2014-a1-01", "2014-01-01", 400, "Invalid submissionEndFrom. Expected format is YYYY-MM-DD", done);
        });

        it("Invalid submissionEndTo.", function (done) {
            assertError("/v2/dataScience/challenges/active", "2014-01-01", "2014-a1-01", 400, "Invalid submissionEndTo. Expected format is YYYY-MM-DD", done);
        });

        it("submissionEndFrom must be before submissionEndTo", function (done) {
            assertError("/v2/dataScience/challenges/active", "2015-01-01", "2014-01-01", 400, "submissionEndFrom must be before submissionEndTo", done);
        });

    });

    describe('Upcoming Data Science Challenges invalid test', function () {

        it("Invalid submissionEndFrom.", function (done) {
            assertError("/v2/dataScience/challenges/upcoming", "2014-a1-01", "2014-01-01", 400, "Invalid submissionEndFrom. Expected format is YYYY-MM-DD", done);
        });

        it("Invalid submissionEndTo.", function (done) {
            assertError("/v2/dataScience/challenges/upcoming", "2014-01-01", "2014-a1-01", 400, "Invalid submissionEndTo. Expected format is YYYY-MM-DD", done);
        });

        it("submissionEndFrom must be before submissionEndTo", function (done) {
            assertError("/v2/dataScience/challenges/upcoming", "2015-01-01", "2014-01-01", 400, "submissionEndFrom must be before submissionEndTo", done);
        });

    });

    describe('Valid test', function () {

        it("Active Data Science Challenges Valid Test.", function (done) {
            testSuccessScenario(true, null, null, 'expected_active_full', done);
        });

        it("Active Data Science Challenges Filtered Valid Test.", function (done) {
            testSuccessScenario(true, '2014-01-01', '2014-01-05', 'expected_filtered_active_full', done);
        });

        it("Upcoming Data Science Challenges Valid Test.", function (done) {
            testSuccessScenario(false, null, null, 'expected_upcoming_full', done);
        });

        it("Upcoming Data Science Challenges Filtered Valid Test.", function (done) {
            testSuccessScenario(false, '2014-01-01', '2014-01-05', 'expected_filtered_upcoming_full', done);
        });

    });
});
