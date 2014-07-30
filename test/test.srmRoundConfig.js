/*global foobar */
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
    SQL_DIR = __dirname + "/sqls/srmRoundConfig/",
    TEST_FILES = __dirname + "/test_files/srmRoundConfig/",
    ROUTE = '/v2/data/srm/',
    CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId,
    CLIENT_SECRET = require('../config/tc-config').tcConfig.oauthClientSecret,
    USER = {
        heffan       : "ad|132456",
        "super"      : "ad|132457",
        user         : "ad|132458"
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
                            if (_.isFunction(responseData)) {
                                responseData(result);
                            } else {
                                assert.deepEqual(result, responseData, "Result must match expected.");
                            }
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
 * Get a round room assignment from db, specified by round_id
 * @param {Integer} id the round_id
 * @param {Function}<err> done the callback function
 */
function getRoundRoomAssignment(id, done) {
    async.series(
        [
            _.bind(
                testHelper.runSqlSelectQuery,
                testHelper,
                util.format(
                    "coders_per_room, algorithm, by_division, by_region, final AS is_final, p" +
                        " FROM round_room_assignment WHERE round_id = %d",
                    id
                ),
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
                        codersPerRoom: _.isUndefined(result.coders_per_room) ? null : result.coders_per_room,
                        type: _.isUndefined(result.algorithm) ? null : result.algorithm,
                        isByDivision: _.isUndefined(result.by_division) ? null : result.by_division,
                        isByRegion: _.isUndefined(result.by_region) ? null : result.by_region,
                        isFinal: _.isUndefined(result.is_final) ? null : result.is_final,
                        p: _.isUndefined(result.p) ? null : result.p
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
 * Get round languages from db, specified by round_id
 * @param {Integer} id the round_id
 * @param {Function}<err> done the callback function
 */
function getRoundLanguages(id, done) {
    async.series(
        [
            _.bind(
                testHelper.runSqlSelectQuery,
                testHelper,
                util.format(
                    "language_id FROM round_language WHERE round_id = %d ORDER BY language_id",
                    id
                ),
                "informixoltp"
            )
        ],
        function (error, results) {
            if (error) {
                done(error);
            } else {
                done(null, _.pluck(results[0], 'language_id'));

            }
        }
    );
}

/**
 * Get a round event from db, specified by round_id, event_id
 * @param {Integer} id the round_id
 * @param {Function}<err> done the callback function
 */
function getRoundEvent(roundId, eventId, done) {
    async.series(
        [
            _.bind(
                testHelper.runSqlSelectQuery,
                testHelper,
                util.format(
                    "event_id, event_name, registration_url FROM round_event " +
                        "WHERE round_id = %d AND event_id = %d",
                    roundId,
                    eventId
                ),
                "informixoltp"
            )
        ],
        function (error, results) {
            var event;
            if (error) {
                done(error);
            } else {
                event = results[0][0];
                if (_.has(event, "event_id")) {
                    done(
                        null,
                        {
                            eventId: event.event_id,
                            eventName: event.event_name,
                            registrationUrl: event.registration_url
                        }
                    );
                } else {
                    done(null, null);
                }

            }
        }
    );
}


/**
 * Assert requests to the Load Round Access API
 *
 * @param {Object} response - an object representing the expected response
 * @param {Integer} status - an int representing the expected status
 * @param {String} handle - a string representing the user handle
 *
 * @return {Function} a function that takes a callback and does the assertion
 */
function lra(response, status, handle) {
    var route = ROUTE + "roundAccess",
        responseHandler = function (res) {
            var actual = _.reduce(
                res.accessibleRounds,
                function (memo, round) {
                    memo[round.roundId] = round;
                    return memo;
                },
                {}
            );
            if (_.isString(response)) {
                response = require(TEST_FILES + response + '.json');
            }
            _.each(
                response.accessibleRounds,
                function (expected) {
                    assert.property(actual, expected.roundId, "Response must correspond to test data.");
                    assert.deepEqual(actual[expected.roundId], expected, "Response must match test data.");
                }
            );
        };
    return assertResponse("get", {
        handle: handle,
        request: {},
        response: status === 200 ? responseHandler : response,
        status: status,
        route: route
    });
}

/**
 * Assert requests to the Set Round Room Assignment API
 *
 * @param {Integer} roundId - the round id
 * @param {Object} request - an object representing the request to be sent
 * @param {Object} response - an object representing the expected response
 * @param {Integer} status - an int representing the expected status
 * @param {String} handle - a string representing the user handle
 *
 * @return {Function} a function that takes a callback and does the assertion
 */
function srra(roundId, request, response, status, handle) {
    var result = null,
        route = util.format("%srounds/%d/roomAssignment", ROUTE, roundId);
    if (status !== 200) {
        result =  assertResponse("post", {
            handle: handle,
            request: request,
            response: response,
            status: status,
            route: route
        });
    } else {
        result = function (done) {
            async.series(
                [
                    assertResponse("post", {
                        handle: handle,
                        request: request,
                        response: response,
                        status: status,
                        route: route
                    }),
                    async.apply(getRoundRoomAssignment, roundId)
                ],
                function (error, results) {
                    var expected = _.reduce(
                        [
                            'codersPerRoom',
                            'type',
                            'isByDivision',
                            'isByRegion',
                            'isFinal',
                            'p'
                        ],
                        function (memo, key) {
                            memo[key] =  _.has(request, key) ? request[key] : null;
                            return memo;
                        },
                        {}
                    );
                    if (error) {
                        done(error);
                    } else {
                        assert.deepEqual(results[1], expected, "Contest was correctly created.");
                        done();
                    }
                }
            );
        };
    }
    return result;

}

/**
 * Assert requests to the Set Round Languages API
 *
 * @param {Integer} roundId - the round id
 * @param {Object} request - an object representing the request to be sent
 * @param {Object} response - an object representing the expected response
 * @param {Integer} status - an int representing the expected status
 * @param {String} handle - a string representing the user handle
 *
 * @return {Function} a function that takes a callback and does the assertion
 */
function srl(roundId, request, response, status, handle) {
    var result = null,
        route = util.format("%srounds/%d/languages", ROUTE, roundId);
    if (status !== 200) {
        result =  assertResponse("post", {
            handle: handle,
            request: request,
            response: response,
            status: status,
            route: route
        });
    } else {
        result = function (done) {
            async.series(
                [
                    assertResponse("post", {
                        handle: handle,
                        request: request,
                        response: response,
                        status: status,
                        route: route
                    }),
                    async.apply(getRoundLanguages, roundId)
                ],
                function (error, results) {
                    var expected = _.uniq(request.languages.sort(), true);
                    if (error) {
                        done(error);
                    } else {
                        assert.deepEqual(results[1], expected, "Round languages set correctly.");
                        done();
                    }
                }
            );
        };
    }
    return result;
}

/**
 * Assert requests to the Set Round Event API
 *
 * @param {Integer} roundId - the round id
 * @param {Object} request - an object representing the request to be sent
 * @param {Object} response - an object representing the expected response
 * @param {Integer} status - an int representing the expected status
 * @param {String} handle - a string representing the user handle
 *
 * @return {Function} a function that takes a callback and does the assertion
 */
function sre(roundId, request, response, status, handle) {
    var result = null,
        route = util.format("%srounds/%d/events", ROUTE, roundId);
    if (status !== 200) {
        result =  assertResponse("post", {
            handle: handle,
            request: request,
            response: response,
            status: status,
            route: route
        });
    } else {
        result = function (done) {
            async.series(
                [
                    assertResponse("post", {
                        handle: handle,
                        request: request,
                        response: response,
                        status: status,
                        route: route
                    }),
                    async.apply(getRoundEvent, roundId, request.eventId)
                ],
                function (error, results) {
                    var expected = _.reduce(
                        results[1],
                        function (memo, value, key) {
                            if (!_.isUndefined(value)) {
                                memo[key] = request[key];
                            } else {
                                memo[key] = undefined;
                            }
                            return memo;
                        },
                        {}
                    );
                    if (error) {
                        done(error);
                    } else {
                        assert.deepEqual(results[1], expected, "Round languages set correctly.");
                        done();
                    }
                }
            );
        };
    }
    return result;
}



describe('SRM Round Configuration APIs ', function () {
    this.timeout(60000); // Wait a minute, remote db might be slow.
    describe('Invalid Requests', function () {
        var clearDb = runSqlFile("clean");
        before(function (done) {
            async.series(
                [
                    clearDb,
                    runSqlFile("insert")
                ],
                done
            );
        });
        after(clearDb);

        describe('Set Round Room Assignment API', function () {
            it(
                "No anonymous access.",
                srra(
                    1,
                    {},
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
                srra(
                    1,
                    {},
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

            it(
                "Invalid roundId - NaN",
                srra(
                    "foobar",
                    {
                        codersPerRoom: 10,
                        type: 1,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId should be number."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid roundId - negative value",
                srra(
                    "-1",
                    {
                        codersPerRoom: 10,
                        type: 1,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId should be positive."
                        }
                    },
                    400,
                    "heffan"
                )
            );


            it(
                "Invalid roundId - unknown",
                srra(
                    "1",
                    {
                        codersPerRoom: 10,
                        type: 1,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId does not have a round room assignment."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid roundId - too big",
                srra(
                    "1000000000",
                    {
                        codersPerRoom: 10,
                        type: 1,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId should be less or equal to 999999999."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid codersPerRoom - NaN",
                srra(
                    "4001",
                    {
                        codersPerRoom: "foobar",
                        type: 1,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "codersPerRoom should be number."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid codersPerRoom - negative value",
                srra(
                    "4001",
                    {
                        codersPerRoom: "-4",
                        type: 1,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "codersPerRoom should be positive."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid codersPerRoom - value too big",
                srra(
                    "4001",
                    {
                        codersPerRoom: "10000",
                        type: 1,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "codersPerRoom should be less or equal to 9999."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid type - NaN",
                srra(
                    "4001",
                    {
                        type: "foobar",
                        codersPerRoom: 10,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "type should be number."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid type - negative value",
                srra(
                    "4001",
                    {
                        type: "-4",
                        codersPerRoom: 10,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "type should be positive."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid type - unknown value.",
                srra(
                    "4001",
                    {
                        type: "1000",
                        codersPerRoom: 10,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "type should be an element of 1,2,3,4,5,6,7,8,9,10."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid isByDivision - unknown value.",
                srra(
                    "4001",
                    {
                        isByDivision: "1000",
                        codersPerRoom: 10,
                        type: 1,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "isByDivision should be an element of 0,1."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid isByRegion - unknown value.",
                srra(
                    "4001",
                    {
                        isByRegion: "1000",
                        codersPerRoom: 10,
                        type: 1,
                        isByDivision: 0,
                        isFinal: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "isByRegion should be an element of 0,1."
                        }
                    },
                    400,
                    "heffan"
                )
            );


            it(
                "Invalid isFinal - unknown value.",
                srra(
                    "4001",
                    {
                        isFinal: "1000",
                        codersPerRoom: 10,
                        type: 1,
                        isByDivision: 0,
                        isByRegion: 0,
                        p: 0.99
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "isFinal should be an element of 0,1."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid p - NaN",
                srra(
                    "4001",
                    {
                        p: "foobar",
                        codersPerRoom: 10,
                        type: 1,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0

                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "p must be a floating point number."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid p - too long",
                srra(
                    "4001",
                    {
                        codersPerRoom: 10,
                        type: 1,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: ".99999999995e8"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Precision of p must not exceed (10,2)."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Set all fields to null values.",
                srra(
                    "4001",
                    {
                        "codersPerRoom": null,
                        "type": null,
                        "isByDivision": null,
                        "isByRegion": null,
                        "isFinal": null,
                        "p": null
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "codersPerRoom should be number."
                        }

                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Set all fields undefined.",
                srra(
                    "4001",
                    {
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "codersPerRoom should be number."
                        }
                    },
                    400,
                    "heffan"
                )
            );


        });

        describe('Set Round Language API', function () {
            it(
                "No anonymous access.",
                srl(
                    1,
                    {languages: [1]},
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
                srl(
                    1,
                    {languages: [1]},
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

            it(
                "Invalid roundId - NaN",
                srl(
                    "foobar",
                    {languages: [1]},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId should be number."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid roundId - negative value",
                srl(
                    "-1",
                    {languages: [1]},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId should be positive."
                        }
                    },
                    400,
                    "heffan"
                )
            );


            it(
                "Invalid roundId - unknown",
                srl(
                    "1",
                    {languages: [1]},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId unknown."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid roundId - too big",
                srl(
                    "1000000000",
                    {languages: [1]},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId should be less or equal to 999999999."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid languages - not an array",
                srl(
                    "4001",
                    {languages: 1},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "languages must be an array."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid languages - too many entries",
                srl(
                    "4001",
                    {
                        languages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Array size exceeds number of known languages."
                        }
                    },
                    400,
                    "heffan"
                )
            );
        });

        it(
            "Invalid languages - invalid entry",
            srl(
                "4001",
                {
                    languages: [1, 2, [], 8, 9, 10]
                },
                {
                    "error": {
                        "name": "Bad Request",
                        "value": 400,
                        "description": "The request was invalid. An accompanying message will explain why.",
                        "details": "language should be an element of 1,3,4,5,6,7."
                    }
                },
                400,
                "heffan"
            )
        );

        describe('Set Round Events API', function () {
            it(
                "No anonymous access.",
                sre(
                    1,
                    {eventId: 1},
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
                sre(
                    1,
                    {eventId: 1},
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

            it(
                "Invalid roundId - NaN",
                sre(
                    "foobar",
                    {eventId: 1},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId should be number."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid roundId - negative value",
                sre(
                    "-1",
                    {eventId: 1},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId should be positive."
                        }
                    },
                    400,
                    "heffan"
                )
            );


            it(
                "Invalid roundId - unknown",
                sre(
                    "1",
                    {eventId: 1},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId unknown."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid roundId - too big",
                sre(
                    "1000000000",
                    {eventId: 1},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "roundId should be less or equal to 999999999."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid eventId - NaN",
                sre(
                    "4001",
                    {eventId: "foobar"},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "eventId should be number."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid eventId - negative value",
                sre(
                    "4001",
                    {eventId: -1},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "eventId should be positive."
                        }
                    },
                    400,
                    "heffan"
                )
            );



            it(
                "Invalid eventId - too big",
                sre(
                    "4001",
                    {eventId: "1000000000"},
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "eventId should be less or equal to 999999999."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid eventName - not a string",
                sre(
                    "4001",
                    {
                        eventId: "1",
                        eventName: [1]
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "eventName should be string."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid eventName - not a string",
                sre(
                    "4001",
                    {
                        eventId: "1",
                        eventName: "\"foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "eventName contains unescaped quotes."
                        }
                    },
                    400,
                    "heffan"
                )
            );


            it(
                "Invalid eventName - too long",
                sre(
                    "4001",
                    {
                        eventId: "1",
                        eventName: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Length of eventName should be less or equal to 50."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid registrationUrl - not a string",
                sre(
                    "4001",
                    {
                        eventId: "1",
                        registrationUrl: [1]
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "registrationUrl should be string."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid registrationUrl - unescaped quote",
                sre(
                    "4001",
                    {
                        eventId: "1",
                        registrationUrl: "\"foobar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "registrationUrl contains unescaped quotes."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "Invalid registrationUrl - too long",
                sre(
                    "4001",
                    {
                        eventId: "1",
                        registrationUrl: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
                            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
                            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
                            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
                            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
                            "aaaaaa"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Length of registrationUrl should be less or equal to 255."
                        }
                    },
                    400,
                    "heffan"
                )
            );
        });

        describe("Load Round Access API", function () {
            it(
                "No anonymous access.",
                lra(
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
                lra(
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
    });

    describe('Valid Requests', function () {
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

        describe('Set Round Room Assignment API', function () {
            it(
                "Set all fields to non-null values.",
                srra(
                    "4001",
                    {
                        "codersPerRoom": 5,
                        "type": 5,
                        "isByDivision": 1,
                        "isByRegion": 0,
                        "isFinal": 1,
                        "p": 5.83
                    },
                    {
                        success: true
                    },
                    200,
                    "heffan"
                )
            );

        });

        describe('Set Round Room Assignment API', function () {
            it(
                "Set only one language",
                srl(
                    "4001",
                    {
                        languages: [3]
                    },
                    {
                        success: true
                    },
                    200,
                    "heffan"
                )
            );
            it(
                "Set all but one language",
                srl(
                    "4001",
                    {
                        languages: [7, 6, 4, 3, 1]
                    },
                    {
                        success: true
                    },
                    200,
                    "heffan"
                )
            );
        });

        describe('Set Round Events API', function () {
            it(
                "Insert values - existing eventId, all fields populated",
                sre(
                    "4001",
                    {
                        eventId: 5001,
                        eventName: "Demo Event",
                        registrationUrl: "http://www.topcoder.com/demoevent/registration"
                    },
                    {
                        success: true
                    },
                    200,
                    "heffan"
                )
            );

            it(
                "Insert values - non-existing eventId, no field populated",
                sre(
                    "4001",
                    {
                        eventId: 5002
                    },
                    {
                        success: true
                    },
                    200,
                    "heffan"
                )
            );

        });

        describe("Load Round Access API", function () {
            it(
                "Get accessible rounds.",
                lra(
                    "expected-accessible_rounds",
                    200,
                    "heffan"
                )
            );
        });
    });
});