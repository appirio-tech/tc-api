/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author panoptimum, TCSFIRST2FINISHER
 *
 * Changes in 1.1:
 * - Remove checks for contestId, for its no longer an argument to the create api.
 * - Add tests for create, modify of web arena super role.
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
    jwt = require('jsonwebtoken'),
    testHelper = require('./helpers/testHelper'),
    util = require('util'),
    moment = require('moment');

chai.Assertion.includeStack = true;
var assert = chai.assert;
/**
 * Constants
 */
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080',
    SQL_DIR = __dirname + "/sqls/srmContestManagement/",
    TEST_FILES = __dirname + "/test_files/SRMContestManagement/",
    ROUTE = '/v2/data/srm/contests',
    CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId,
    CLIENT_SECRET = require('../config/tc-config').tcConfig.oauthClientSecret,
    DATE_FORMAT = "YYYY-MM-DD hh:mm",
    USER = {
        heffan       : "ad|132456",
        "super"      : "ad|132457",
        user         : "ad|132458",
        ksmith       : "ad|124861"
    };

/* This function returns a function that takes a callback and runs a sql file
 * @param {String} suffix   "clean" or "insert"
 * @return {Function} function that takes a callback and runs a sql file
 */
function runSqlFile(suffix) {
    return _.bind(
        testHelper.runSqlFile,
        testHelper,
        util.format("%s%s__%s", SQL_DIR, "informixoltp", suffix),
        "informixoltp"
    );
}

/**
 * Generate an auth header
 * @param {String} user the user to generate the header for
 * @return {String} the generated string
 */
function generateAuthHeader(user) {
    return "Bearer " + jwt.sign({sub: USER[user]}, CLIENT_SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
}

/**
 * Create and return GET request
 * @param {Object} data the data to be queried
 * @return {Object} request object
 */
function createGetRequest(data) {
    var result = request(API_ENDPOINT)
                 .get(data.route)
                 .set('Accept', 'application/json');
    if (data.handle) {
        result.set('Authorization', generateAuthHeader(data.handle));
    }
    return result;
}

/**
 * Create and return PUT reqeust.
 * @param {Object} data the data to be queried
 * @return {Object} request object
 */
function createPutRequest(data) {
    var result = request(API_ENDPOINT)
        .put(data.route)
        .set('Accept', 'application/json')
        .send(data.request);
    if (data.handle) {
        result.set('Authorization', generateAuthHeader(data.handle));
    }
    return result;
}


/**
 * Create and return POST request
 * @param {Object} data the data to be queried
 * @return {Object} request object
 */
function createPostRequest(data) {
    var result = request(API_ENDPOINT)
                 .post(data.route)
                 .set('Content-Type', 'application/json')
                 .send(data.request)
                 .set('Accept', 'application/json');
    if (data.handle) {
        result.set('Authorization', generateAuthHeader(data.handle));
    }
    return result;
}

/**
 * Send request and check if response conforms to API contract
 * @param {String} verb the HTTP-verb of the request to be made
 * @param {Object} testData configuration object
 */
function assertResponse(verb, testData) {
    var status = testData.status,
        responseData = testData.response,
        createRequest = verb === "post" ? createPostRequest : createGetRequest;
    switch (verb) {
    case "put":
        createRequest = createPutRequest;
        break;
    case "post":
        createRequest = createPostRequest;
        break;
    case "get":
        createRequest = createGetRequest;
        break;
    }
    return function (done) {
        createRequest(testData)
            .expect(status)
            .expect('Content-Type', /json/)
            .end(
                function (error, response) {
                    var result;
                    if (status === 200) {
                        result =  testHelper.getTrimmedData(response.res.text);
                        if (verb === "get") {
                            assert.isTrue(_.isArray(result), "GET response must be an array.");
                            result = _.reduce(
                                result,
                                function (memo, contest) {
                                    memo[contest.contestId] = contest;
                                    return memo;
                                },
                                {}
                            );
                            _.each(
                                responseData,
                                function (contest) {
                                    assert.property(result, contest.contestId, "Response must correspond to test data.");
                                    assert.deepEqual(result[contest.contestId], contest, "Response must match test data.");
                                }
                            );
                        } else {
                            assert.deepEqual(result, responseData,
                                             'POST response does not conform to expected value');
                        }
                        done();
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
 * Format a date according to DATE_FORMAT
 * @param {String} date - the date string
 * @return {String} formatted date
 */
function formatDate(date) {
    var result = null;
    if (_.isString(date)) {
        return moment(date).format(DATE_FORMAT);
    }
    return result;
}

/**
 * Get a contest from db, specified by contest_id
 * @param {Integer} id the contest_id
 * @param {Function}<err> done the callback function
 */
function getContest(id, done) {
    async.series(
        [
            _.bind(
                testHelper.runSqlSelectQuery,
                testHelper,
                "c.contest_id," +
                    "c.name AS contest_name," +
                    "c.start_date," +
                    "c.end_date," +
                    "c.status," +
                    "c.group_id," +
                    "c.ad_text," +
                    "c.ad_start," +
                    "c.ad_end," +
                    "c.ad_task," +
                    "c.ad_command," +
                    "c.activate_menu," +
                    "c.season_id," +
                    "s.name AS season_name" +
                    " FROM (contest c" +
                    " LEFT OUTER JOIN season s" +
                    " ON c.season_id = s.season_id)" +
                    " WHERE c.contest_id = " + id,
                "informixoltp"
            )
        ],
        function (error, results) {
            var result = null;
            if (error) {
                done(error);
            } else {
                if (results[0]) {
                    result = results[0][0];
                    result = {
                        contestId: result.contest_id || null,
                        name: result.contest_name || null,
                        startDate: formatDate(result.start_date),
                        endDate: formatDate(result.end_date),
                        status: result.status || null,
                        groupId: result.group_id || null,
                        adText: result.ad_text || null,
                        adStart: formatDate(result.ad_start),
                        adEnd: formatDate(result.ad_end),
                        adTask: result.ad_task || null,
                        adCommand: result.ad_command || null,
                        activateMenu: (_.isNull(result.activate_menu)  || _.isUndefined(result.activate_menu))
                                    ? null : result.activate_menu,
                        seasonId: result.season_id
                    };
                    done(null, result);

                } else {
                    done();
                }
            }
        }
    );
}

/**
 * Assert requests to the List SRM Contests API
 *
 * @param {Object} response - an object representing the expected response
 * @param {Integer} status - an int representing the expected status
 * @param {String} handle - a string representing the user handle
 *
 * @return {Function} a function that takes a callback and does the assertion
 */
function list(response, status, handle) {
    return assertResponse("get", {
        handle: handle,
        request: {},
        response: response,
        status: status,
        route: ROUTE
    });
}

/**
 * Assert requests to the Create SRM Contest API
 *
 * @param {Object} request - an object representing the request to be sent
 * @param {Object} response - an object representing the expected response
 * @param {Integer} status - an int representing the expected status
 * @param {String} handle - a string representing the user handle
 *
 * @return {Function} a function that takes a callback and does the assertion
 */
function create(request, response, status, handle) {
    var result = null;
    if (status !== 200) {
        result =  assertResponse("post", {
            handle: handle,
            request: request,
            response: response,
            status: status,
            route: ROUTE
        });
    } else {
        result = function (done) {
            async.waterfall(
                [
                    _.bind(
                        testHelper.runSqlSelectQuery,
                        testHelper,
                        'SEQUENCE_CONTEST_SEQ.NEXTVAL as next_id from table(set{1})',
                        'informixoltp'
                    ),
                    function (result, cb) {
                        assertResponse("post", {
                            handle: handle,
                            request: request,
                            response: {contestId: result[0].next_id + 1},
                            status: status,
                            route: ROUTE
                        })(cb);
                    }
                ],
                function (error) {
                    return done(error);
                }
            );
        };
    }
    return result;

}

/**
 * Assert requests to the Modify SRM Contest API
 *
 * @param {Object} request - an object representing the request to be sent
 * @param {Object} response - an object representing the expected response
 * @param {Integer} status - an int representing the expected status
 * @param {String} handle - a string representing the user handle
 * @param {Integer} id - the id of the contest to be modified
 *
 * @return {Function} a function that takes a callback and does the assertion
 */
function modify(request, response, status, handle, id) {
    var result = null,
        expected = _.reduce(
            request,
            function (memo, value, key) {
                if (_.isString(value)) {
                    memo[key] = value.replace(/""/g, "\"");
                } else {
                    memo[key] = value;
                }
                return memo;
            },
            {}
        );
    if (status !== 200) {
        result = assertResponse("put", {
            handle: handle,
            request: request,
            response: response,
            status: status,
            route: ROUTE + "/" + id
        });
    } else if (request.contestId === id) {
        result = function (done) {
            async.series(
                [
                    assertResponse("put", {
                        handle: handle,
                        request: request,
                        response: response,
                        status: status,
                        route: ROUTE + "/" + id
                    }),
                    async.apply(getContest, request.contestId)
                ],
                function (error, results) {
                    if (error) {
                        done(error);
                    } else {
                        assert.deepEqual(results[1], expected, "Contest was correctly modified.");
                        done();
                    }
                }
            );
        };
    } else {
        result = function (done) {
            /**
             * Get round_id for a given contest_id
             * @param {Integer} id - the contest_id
             * @param {Function} done -the callback function
             */
            var getRound = function (id, done) {
                async.series(
                    [
                        _.bind(
                            testHelper.runSqlSelectQuery,
                            testHelper,
                            "round_id FROM round WHERE contest_id = " + id,
                            "informixoltp"
                        )
                    ],
                    done
                );
            };
            async.series(
                [
                    async.apply(getRound, id),
                    assertResponse("put", {
                        handle: handle,
                        request: request,
                        response: response,
                        status: status,
                        route: ROUTE + "/" + id
                    }),
                    async.apply(getContest, request.contestId),
                    async.apply(getRound, request.contestId)
                ],
                function (error, results) {
                    if (error) {
                        done(error);
                    } else {
                        assert.deepEqual(results[2], expected, "Contest was correctly modified.");
                        assert.equal(results[3][0].round_id, results[0][0].round_id, "Round was correctly modified.");
                        done();
                    }
                }
            );
        };
    }

    return result;
}

describe('SRM Contest Management APIs', function () {
    this.timeout(60000); // Wait a minute, remote db might be slow.
    describe('Invalid Requests', function () {

        describe('List SRM Contests API', function () {
            it(
                "No anonymous access.",
                list(
                    {"error": {
                        "name": "Unauthorized",
                        "value": 401,
                        "description": "Authentication credentials were missing or incorrect.",
                        "details": "Authorized access only."
                    }},
                    401
                )
            );

            it(
                "No non-admin access.",
                list(
                    {"error": {
                        "name": "Forbidden",
                        "value": 403,
                        "description": "The request is understood, but it has been refused or access is not allowed.",
                        "details": "Admin access only."
                    }},
                    403,
                    "user"
                )
            );
        });

        describe('Create SRM Contest API', function () {
            var clearDb = runSqlFile("clean");
            beforeEach(function (done) {
                async.series(
                    [
                        clearDb,
                        runSqlFile("insert")
                    ],
                    done
                );
            });
            afterEach(clearDb);

            it(
                "No anonymous access.",
                create(
                    {
                        name: "name",
                        contestId: 1
                    },
                    {"error": {
                        "name": "Unauthorized",
                        "value": 401,
                        "description": "Authentication credentials were missing or incorrect.",
                        "details": "Authorized access only."
                    }},
                    401
                )
            );


            it(
                "No non-admin access.",
                create(
                    {
                        name: "name",
                        contestId: 1
                    },
                    {"error": {
                        "name": "Forbidden",
                        "value": 403,
                        "description": "The request is understood, but it has been refused or access is not allowed.",
                        "details": "Admin or Web Arena Super access only."
                    }},
                    403,
                    "user"
                )
            );

            it(
                "Invalid name - no string",
                create(
                    {
                        name: {"name": "foobar"},
                        contestId: 1001
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "name should be string."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid name - too long",
                create(
                    {
                        name: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                        contestId: 1001
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Length of name must not exceed 50 characters."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid name - illegal characters",
                create(
                    {
                        name: "\"Name",
                        contestId: 1001
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "name contains unescaped quotes."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid startDate.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        startDate: "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "startDate is not a valid date."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid endDate.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        endDate: "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "endDate is not a valid date."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid endDate - not greater than startDate.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        endDate: "2014-07-04 13:00",
                        startDate: "2014-07-04 15:00"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "startDate does not precede endDate."
                        }
                    },
                    400,
                    "heffan"
                )
            );


            it(
                "Invalid status - no string.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        status: {"status": "A"}
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "status should be string."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid status - too long.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        status:  "AB"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "status must be of length 1"
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid status - illegal characters.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        status:  "K"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "status unknown."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid groupId",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        groupId:  "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "groupId should be number."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid groupId - does not exist",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        groupId:  324
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "groupId is unknown."
                        }
                    },
                    400,
                    "heffan"
                )
            );


            it(
                "Invalid adText - no string.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adText: {"adText": "A"}
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adText should be string."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid adText - too long.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adText:  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                            "AAAAAAAAAAAAAAAAAAAAAAAAAAA"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Length of adText must not exceed 250 characters."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid adText - illegal characters.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adText:  "\"\"\""
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adText contains unescaped quotes."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid adStart.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adStart: "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adStart is not a valid date."
                        }
                    },
                    400,
                    "heffan"
                )
            );


            it(
                "Invalid adEnd.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adEnd: "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adEnd is not a valid date."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid adEnd - not greater than adStart.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adEnd: "2014-07-04 13:00",
                        adStart: "2014-07-04 13:01"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adStart does not precede adEnd."
                        }
                    },
                    400,
                    "heffan"
                )
            );


            it(
                "Invalid adTask - no string.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adTask: {"adTask": "A"}
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adTask should be string."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid adTask - too long.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adTask: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Length of adTask must not exceed 30 characters."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid adTask - illegal characters.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adTask:  "\""
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adTask contains unescaped quotes."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid adCommand - no string.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adCommand: {"adCommand": "A"}
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adCommand should be string."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid adCommand - too long.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adCommand: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Length of adCommand must not exceed 30 characters."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid adCommand - illegal characters.",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        adCommand:  "\""
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adCommand contains unescaped quotes."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid activateMenu",
                create(
                    {
                        name: "Name",
                        contestId: 1001,
                        activateMenu:  "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "activateMenu should be number."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid seasonId.",
                create(
                    {
                        contestId: 1001,
                        name: "name",
                        seasonId: "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "seasonId should be number."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid seasonId - does not exists.",
                create(
                    {
                        name: "name",
                        contestId: 1013,
                        seasonId: 222
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "seasonId is unknown."
                        }
                    },
                    400,
                    "heffan"
                )
            );


        });

        describe('Modify SRM Contest API', function () {
            var clearDb = runSqlFile("clean");
            beforeEach(function (done) {
                async.series(
                    [
                        clearDb,
                        runSqlFile("insert")
                    ],
                    done
                );
            });
            afterEach(clearDb);

            it(
                "No anonymous access.",
                modify(
                    {
                        name: "name",
                        contestId: 1
                    },
                    {"error": {
                        "name": "Unauthorized",
                        "value": 401,
                        "description": "Authentication credentials were missing or incorrect.",
                        "details": "Authorized access only."
                    }},
                    401,
                    null,
                    1001
                )
            );

            it(
                "No non-admin access.",
                modify(
                    {
                        name: "name",
                        contestId: 1
                    },
                    {"error": {
                        "name": "Forbidden",
                        "value": 403,
                        "description": "The request is understood, but it has been refused or access is not allowed.",
                        "details": "Admin or Web Arena Super access only."
                    }},
                    403,
                    "user",
                    1001
                )
            );


            it(
                "Invalid id.",
                modify(
                    {
                        name: "name",
                        contestId: 1
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "id should be number."
                        }
                    },
                    400,
                    "heffan",
                    "foobar"
                )
            );

            it(
                "Invalid id - does not exist.",
                modify(
                    {
                        name: "name",
                        contestId: 10024
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "id is unknown."
                        }
                    },
                    400,
                    "heffan",
                    10024
                )
            );

            it(
                "Invalid contestId.",
                modify(
                    {
                        name: "name",
                        contestId: "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "contestId should be number."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid name - no string",
                modify(
                    {
                        name: {"name": "foobar"},
                        contestId: 1001
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "name should be string."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid name - too long",
                modify(
                    {
                        name: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                        contestId: 1001
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Length of name must not exceed 50 characters."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid name - illegal characters",
                modify(
                    {
                        name: "Name\"",
                        contestId: 1001
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "name contains unescaped quotes."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid startDate.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        startDate: "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "startDate is not a valid date."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid endDate.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        endDate: "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "endDate is not a valid date."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid endDate - not greater than startDate.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        endDate: "2014-07-04 13:00",
                        startDate: "2014-07-04 15:00"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "startDate does not precede endDate."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );


            it(
                "Invalid status - no string.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        status: {"status": "A"}
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "status should be string."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid status - too long.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        status:  "AB"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "status must be of length 1"
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid status - does not exist.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        status:  "K"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "status unknown."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid groupId",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        groupId:  "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "groupId should be number."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid groupId - does not exist",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        groupId:  324
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "groupId is unknown."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );


            it(
                "Invalid adText - no string.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adText: {"adText": "A"}
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adText should be string."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid adText - too long.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adText:  "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                            "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" +
                            "AAAAAAAAAAAAAAAAAAAAAAAAAAA"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Length of adText must not exceed 250 characters."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid adText - illegal characters.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adText:  "\"\"\""
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adText contains unescaped quotes."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid adStart.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adStart: "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adStart is not a valid date."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );


            it(
                "Invalid adEnd.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adEnd: "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adEnd is not a valid date."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid adEnd - not greater than adStart.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adEnd: "2014-07-04 13:00",
                        adStart: "2014-07-04 13:01"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adStart does not precede adEnd."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );


            it(
                "Invalid adTask - no string.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adTask: {"adTask": "A"}
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adTask should be string."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid adTask - too long.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adTask: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Length of adTask must not exceed 30 characters."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid adTask - illegal characters.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adTask:  "\""
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adTask contains unescaped quotes."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid adCommand - no string.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adCommand: {"adCommand": "A"}
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adCommand should be string."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid adCommand - too long.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adCommand: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Length of adCommand must not exceed 30 characters."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid adCommand - illegal characters.",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        adCommand:  "\""
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "adCommand contains unescaped quotes."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid activateMenu",
                modify(
                    {
                        name: "Name",
                        contestId: 1001,
                        activateMenu:  "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "activateMenu should be number."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid seasonId.",
                modify(
                    {
                        contestId: 1001,
                        name: "name",
                        seasonId: "foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "seasonId should be number."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );

            it(
                "Invalid seasonId - does not exists.",
                modify(
                    {
                        name: "name",
                        contestId: 1013,
                        seasonId: 222
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "seasonId is unknown."
                        }
                    },
                    400,
                    "heffan",
                    1001
                )
            );


        });
    });

    describe('Valid Requests', function () {
        describe('List SRM Contests API', function () {
            var expected = require(TEST_FILES + "expected-list.json"),
                clearDb = runSqlFile("clean");
            // Adjust expected result to existing test data.
            before(function (done) {
                async.waterfall(
                    [
                        _.bind(
                            testHelper.runSqlSelectQuery,
                            testHelper,
                            "start_date, end_date FROM contest WHERE contest_id = 12918",
                            "informixoltp"
                        ),
                        function (results, cb) {
                            _.each(
                                expected,
                                function (item) {
                                    if (item.contestId === 12918) {
                                        item.startDate = formatDate(results[0].start_date);
                                        item.endDate = formatDate(results[0].end_date);
                                    }
                                }
                            );
                            cb();
                        }
                    ],
                    done
                );
            });
            beforeEach(function (done) {
                async.series(
                    [
                        clearDb,
                        runSqlFile("insert")
                    ],
                    done
                );
            });
            afterEach(clearDb);

            it(
                "List all contests.",
                list(
                    expected,
                    200,
                    "heffan"
                )
            );
        });

        describe('Create SRM Contest API', function () {
            var clearDb = runSqlFile("clean");
            beforeEach(clearDb);
            afterEach(clearDb);
            it(
                "Create a new Contest.",
                create(
                    {
                        "name": "Name 10",
                        "startDate": "2014-06-11 09:00",
                        "endDate": "2014-06-21 09:00",
                        "status": "A",
                        "groupId": -1,
                        "adText": "Ad Text 10",
                        "adStart": "2014-06-12 09:00",
                        "adEnd": "2014-06-17 09:00",
                        "adTask": "Ad Task 10",
                        "adCommand": "Ad Command 10",
                        "activateMenu": null,
                        "seasonId": 2
                    },
                    {"success": true},
                    200,
                    "heffan"
                )
            );

            it(
                "Create a new Contest with web arena super role.",
                create(
                    {
                        "name": "Name 10",
                        "startDate": "2014-06-11 09:00",
                        "endDate": "2014-06-21 09:00",
                        "status": "A",
                        "groupId": -1,
                        "adText": "Ad Text 10",
                        "adStart": "2014-06-12 09:00",
                        "adEnd": "2014-06-17 09:00",
                        "adTask": "Ad Task 10",
                        "adCommand": "Ad Command 10",
                        "activateMenu": null,
                        "seasonId": 2
                    },
                    {"success": true},
                    200,
                    "ksmith"
                )
            );

        });

        describe('Modify SRM Contest API', function () {
            var clearDb = runSqlFile("clean");
            beforeEach(function (done) {
                async.series(
                    [
                        clearDb,
                        runSqlFile("insert")
                    ],
                    done
                );
            });
            afterEach(clearDb);

            it(
                "Modify contest - id === contestId",
                modify(
                    {
                        "contestId": 1010,
                        "name": "New Name",
                        "startDate": "2014-06-11 10:00",
                        "endDate": "2014-06-21 10:00",
                        "status": "F",
                        "groupId": null,
                        "adText": "Ad New Text",
                        "adStart": "2014-06-12 10:00",
                        "adEnd": "2014-06-17 10:00",
                        "adTask": "Ad New Task",
                        "adCommand": "Ad New Command",
                        "activateMenu": 0,
                        "seasonId": 1
                    },
                    {"success": true},
                    200,
                    "heffan",
                    1010
                )
            );

            it(
                "Modify contest - id === contestId && web arena super role",
                modify(
                    {
                        "contestId": 1010,
                        "name": "New Name",
                        "startDate": "2014-06-11 10:00",
                        "endDate": "2014-06-21 10:00",
                        "status": "F",
                        "groupId": null,
                        "adText": "Ad New Text",
                        "adStart": "2014-06-12 10:00",
                        "adEnd": "2014-06-17 10:00",
                        "adTask": "Ad New Task",
                        "adCommand": "Ad New Command",
                        "activateMenu": 0,
                        "seasonId": 1
                    },
                    {"success": true},
                    200,
                    "ksmith",
                    1010
                )
            );

            it(
                "Modify contest - id !== contestId",
                modify(
                    {
                        "contestId": 1011,
                        "name": "\"\"New\"\" Name",
                        "startDate": "2014-06-11 10:00",
                        "endDate": "2014-06-21 10:00",
                        "status": "F",
                        "groupId": null,
                        "adText": "Ad New Text",
                        "adStart": "2014-06-12 10:00",
                        "adEnd": "2014-06-17 10:00",
                        "adTask": "Ad New Task",
                        "adCommand": "Ad New Command",
                        "activateMenu": 0,
                        "seasonId": 1
                    },
                    {"success": true},
                    200,
                    "heffan",
                    1010
                )
            );

        });
    });
});