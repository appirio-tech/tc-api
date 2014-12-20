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
    SQL_DIR = __dirname + '/sqls/srmRoundsForProblem/',
    ROUTE = '/v2/data/srm/problems/%s/rounds',
    DB = ['topcoder_dw'];

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
            .query(_.omit(data.request, 'problemId'))
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
                        return done(error);
                    }
                    if (!response) {
                        return done(new Error("Server unresponsive."));
                    }
                    if (status === 200) {
                        result =  testHelper.getTrimmedData(response.res.text);
                        assert.deepEqual(result, responseData, "Responses must match.");
                        return done();
                    }

                    result = testHelper.getTrimmedData(response.res.text);
                    assert.deepEqual(result, responseData,
                                     'response does not conform to expected value');
                    return done(error);

                }
            );
    };
}

/**
 * Assert requests to the Rounds For Problem API
 *
 * @param {Object} request - an object representing the request to be send
 * @param {Object} response - an object representing the expected response
 * @param {Integer} status - an int representing the expected status
 *
 * @return {Function} a function that takes a callback and does the assertion
 */
function rfp(request, response, status) {
    return assertResponse({
        request: request,
        response: response,
        status: status,
        route: util.format(ROUTE, request.problemId)
    });
}

describe('SRM Rounds For Problem', function () {
    this.timeout(60000); // Wait a minute, remote db might be slow.
    var clearDb = _.partial(runSqlFiles, "clean", DB),
        fillDb = _.partial(runSqlFiles, "insert", DB);
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

    describe('Invalid Requests', function () {
        it(
            "Invalid problemId - NaN",
            rfp(
                {
                    problemId: "foobar"
                },
                {
                    "error": {
                        "name": "Bad Request",
                        "value": 400,
                        "description": "The request was invalid. An accompanying message will explain why.",
                        "details": "problemId should be number."
                    }
                },
                400
            )
        );

        it(
            "Invalid problemId - too small",
            rfp(
                {
                    problemId: "0"
                },
                {
                    "error": {
                        "name": "Bad Request",
                        "value": 400,
                        "description": "The request was invalid. An accompanying message will explain why.",
                        "details": "problemId should be positive."
                    }
                },
                400
            )
        );

        it(
            "Invalid problemId - too small",
            rfp(
                {
                    problemId: "2147483648"
                },
                {
                    "error": {
                        "name": "Bad Request",
                        "value": 400,
                        "description": "The request was invalid. An accompanying message will explain why.",
                        "details": "problemId should be less or equal to 2147483647."
                    }
                },
                400
            )
        );



        it(
            "Invalid problemId - problem doesn't exist",
            rfp(
                {
                    problemId: 2003
                },
                {
                    "error": {
                        "name": "Not Found",
                        "value": 404,
                        "description": "The URI requested is invalid or the requested resource does not exist.",
                        "details": "The problem doesn't exist."
                    }
                },
                404
            )
        );

    });

    describe('Valid Requests', function () {

        // The following round refers to problem with problem_id 2002:
        // round_id: 3001 - active srm round - omit
        it(
            "Round exists, but is not finished, empty result.",
            rfp(
                {
                    problemId: 2002
                },
                {
                    rounds: []
                },
                200
            )
        );

        // The following rounds refer to problem with problem_id 2001:
        // round_id: 3000 - active srm round               - omit
        // round_id: 3002 - active tournament round        - omit
        // round_id: 3003 - active long round              - omit
        // round_id: 3004 - active info event round        - omit
        // round_id: 3005 - past srm round                 - show
        // round_id: 3006 - past tournament round          - show
        // round_id: 3007 - past long round                - show
        // round_id: 3008 - past info event round          - show
        // round_id: 3009 - past practice round            - omit
        // round_id: 3010 - past tournament practice round - omit
        it(
            "Don't report non-finished rounds, test rounds.",
            rfp(
                {
                    problemId: 2001
                },
                {
                    rounds: [
                        {
                            "contestId": 3005,
                            "contestName": "Contest 3005",
                            "roundId": 6,
                            "roundName": "Past Srm Round",
                            "divisionDescription": "Unrated Division",
                            "levelDescription": "Level 2001"
                        },
                        {
                            "contestId": 3006,
                            "contestName": "Contest 3006",
                            "roundId": 7,
                            "roundName": "Past Tournament Round",
                            "divisionDescription": "Division-I",
                            "levelDescription": "Level 2001"
                        },
                        {
                            "contestId": 3007,
                            "contestName": "Contest 3007",
                            "roundId": 8,
                            "roundName": "Past Long Round",
                            "divisionDescription": "Division-II",
                            "levelDescription": "Level 2001"
                        },
                        {
                            "contestId": 3008,
                            "contestName": "Contest 3008",
                            "roundId": 9,
                            "roundName": "Past Event Round",
                            "divisionDescription": "No Division Applicable",
                            "levelDescription": "Level 2001"
                        }
                    ]
                },
                200
            )
        );
    });
});
