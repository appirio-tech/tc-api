/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author panoptimum 
 */
/*global describe, it, before, beforeEach, after, afterEach*/
/*jslint node: true, nomen: true*/
"use strict";

/**
 * Module dependencies.
 */
var _ = require('underscore'),
    async = require('async'),
    request = require('supertest'),
    chai = require('chai'),
    testHelper = require('./helpers/testHelper'),
    util = require('util');


chai.Assertion.includeStack = true;
var assert = chai.assert;
/**
 * Constants
 */
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080',
    SQL_DIR = __dirname + "/sqls/referralLeaderboard/",
    TEST_FILES = __dirname + "/test_files/referralLeaderboard/",
    ROUTE = '/v2/platform/leaderboard',
    DB = ['common_oltp', 'informixoltp', 'tcs_catalog'];

/* This function returns a function that takes a callback and runs a sql file
 * @param {String} suffix   "clean" or "insert"
 * @param {String} db       the database name, e.g. "common_oltp", "informixoltp"
 * @return {Function} function that takes a callback and runs a sql file
 */
function runSqlFile(suffix, db) {
    return _.bind(
        testHelper.runSqlFile,
        testHelper,
        util.format("%s%s__%s", SQL_DIR, db, suffix),
        db
    );
}

/**
 * Runs the sql file of a given suffix for each db in a list.
 * @param {String} suffix the suffix, e.g. clean
 * @param {Array} dbs list of database names, e.g. informixoltp
 * @param {Function} done  callback function
 */
function runSqlFiles(suffix, dbs, done) {
    async.series(
        _.map(
            dbs,
            function (db) {
                return runSqlFile(suffix, db);
            }
        ),
        done
    );
}

/**
 * Create and return GET request
 * @param {Object} data the data to be queried
 * @return {Object} request object
 */
function createGetRequest(data) {
    var result = request(API_ENDPOINT)
                 .get(data.route)
                 .query(data.request)
                 .set('Accept', 'application/json');
    return result;
}

/**
 * Send request and check if response conforms to API contract
 * @param {Object} testData configuration object
 */
function assertResponse(testData) {
    var status = testData.status,
        responseData = testData.response,
        createRequest = createGetRequest;
    return function (done) {
        createRequest(testData)
            .expect(status)
            .expect('Content-Type', /json/)
            .end(
                function (error, response) {
                    var result;
                    if (error) {
                        done(error);
                    } else if (!response) {
                        done(new Error("Server unresponsive."));
                    } else if (status === 200) {
                        result =  testHelper.getTrimmedData(response.res.text);
                        if (_.has(result, "error")) {
                            assert.deepEqual(result, responseData, "Error responses must match");
                            done();
                        } else {
                            assert.isTrue(_.isArray(result.result), "result must be an array.");
                            result.result = _.reduce(
                                result.result,
                                function (memo, entry) {
                                    memo[entry.handle] = entry;
                                    return memo;
                                },
                                {}
                            );
                            assert.equal(result.entries, responseData.entries, "No. of entries must be as expected.");
                            assert.equal(result.description, responseData.description, "Descriptions must be equal.");
                            assert.equal(result.scoreType, responseData.scoreType, "Score types must be equal.");
                            assert.equal(result.scoreLabel, responseData.scoreLabel, "Score labels must be equal.");
                            _.each(
                                responseData.result,
                                function (entry) {
                                    var handle = entry.handle, res;
                                    assert.property(result.result, handle, "Response must correspond to test data.");
                                    res = result.result[handle];
                                    assert.equal(res.score, entry.score, "Scores must be equal.");
                                    if (_.has(entry, "photo")) {
                                        assert.equal(res.photo, entry.photo, "Photos must be equal.");
                                    }
                                    assert.property(res, "memberSince", "There must be memberSince.");
                                    assert.equal(res.country, entry.country, "Countries must be equal.");
                                    assert.equal(res.ratingType, entry.ratingType, "ratingTypes must be equal.");
                                }
                            );
                            done();
                        }
                    } else {
                        result = testHelper.getTrimmedData(response.res.text);
                        assert.deepEqual(result, responseData,
                                         'response does not conform to expected value');
                        done(error);
                    }
                }
            );
    };
}

/**
 * Assert requests to the Referral Leaderboard API
 *
 * @param {Object} request - an object representing the request to be send
 * @param {Object} response - an object representing the expected response
 * @param {Integer} status - an int representing the expected status
 *
 * @return {Function} a function that takes a callback and does the assertion
 */
function lb(request, response, status) {
    return assertResponse({
        request: request,
        response: _.isString(response) ? require(TEST_FILES + response + '.json') : response,
        status: status,
        route: ROUTE
    });
}

describe('Referral Leaderboard API', function () {
    this.timeout(60000); // Wait a minute, remote db might be slow.
    describe('Invalid Requests', function () {
        it(
            "No type provided.",
            lb(
                {},
                {"error": "Error: type is a required parameter for this action"},
                200
            )
        );

        it(
            "Unknown type.",
            lb(
                {type: "foobar"},
                {
                    "error": {
                        "name": "Bad Request",
                        "value": 400,
                        "description": "The request was invalid. An accompanying message will explain why.",
                        "details": "type should be an element of referral."
                    }
                },
                400
            )
        );

        it(
            "Unknown utmMedium",
            lb(
                {
                    type: "referral",
                    utmMedium: "foobar"
                },
                {
                    "error": {
                        "name": "Bad Request",
                        "value": 400,
                        "description": "The request was invalid. An accompanying message will explain why.",
                        "details": "utmMedium should be an element of \"\",__all__,appirio."
                    }
                },
                400
            )
        );
    });
    describe('Valid Requests', function () {
        var clearDb = _.partial(runSqlFiles, "clean", DB.reverse()),
            fillDb = _.partial(runSqlFiles, "insert", DB);
        // Description of test data:
        // Referral1 is inactive, should not show up in results
        // Referral2 has displayFlag = 0, should not show photo
        // Referral2 has no rating, should show ratingType: Black
        // Referral3 has no photo uploaded, should not show photo
        // Referrer52 is 190 days old, should not contribute to score of Referral3
        // Referrer54 is inactive, should not contribute to score of Referral2
        before(
            function (done) {
                async.series(
                    [
                        clearDb,
                        fillDb
                    ],
                    done
                );
            }
        );
        after(clearDb);

        it(
            "Get complete leaderboard",
            lb(
                {
                    type: "referral",
                    utmMedium: "__ALL__"
                },
                "all",
                200
            )
        );

        it(
            "Get appirio leaderboard",
            lb(
                {
                    type: "referral",
                    utmMedium: "Appirio"
                },
                "appirio",
                200
            )
        );

        it(
            "Get non-appirio leaderboard",
            lb(
                {
                    type: "referral"
                },
                "nonappirio",
                200
            )
        );


    });
});
