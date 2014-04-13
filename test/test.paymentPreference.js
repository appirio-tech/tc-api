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
    assert = require('chai').assert,
    jwt = require('jsonwebtoken'),
    config = require('../config').config,
    testHelper = require('./helpers/testHelper'),
    util = require('util');

/**
 * Constants
 */
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080',
    SQL_DIR = __dirname + "/sqls/paymentPreference/",
    ROUTE = '/v2/payments/preference/',
    CLIENT_SECRET = config.general.oauthClientSecret,
    CLIENT_ID = config.general.oauthClientId,
    USER = {
        heffan       : "ad|132456",
        "super"      : "ad|132457",
        user         : "ad|132458",
        dok          : "ad|20",
        partha       : "ad|124772",
        hung         : "ad|124764",
        twight       : "ad|124766",
        sandking     : "ad|124776",
        lightspeed   : "ad|124834",
        reassembler  : "ad|124835",
        annej9ny     : "ad|124836",
        plinehan     : "ad|124852",
        chelseasimon : "ad|124853",
        wyzmo        : "ad|124856",
        cartajs      : "ad|124857",
        ksmith       : "ad|124861",
        yoshi        : "ad|124916"
    };

/* This function returns a function that takes a callback and runs a sql file
 * @param {String} suffix   "clean" or "insert"
 * @param {String} verb     "post" or "get"
 * @return {Function} function that takes a callback and runs a sql file
 */
function runSqlFiles(verb, suffix) {
    return _.partial(
        testHelper.runSqlFile,
        util.format("%s%s__%s_%s", SQL_DIR, "informixoltp", verb, suffix),
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
                 .get(ROUTE)
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
                 .post(ROUTE)
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
 * @param {Object} testData configuration object
 * @param {Function} done callback function to be called in case of error
 *                        or end of processing
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
                    if (verb === "get") {
                        result = testHelper.getTrimmedData(response.res.text);
                        assert.deepEqual(result, responseData,
                                         'response does not conform to expected value');
                        done(error);
                    } else {
                        if (status === 200) {
                            result =  testHelper.getTrimmedData(response.res.text);
                            assert.deepEqual(result, responseData.post,
                                         'POST response does not conform to expected value');
                            createGetRequest(testData)
                                .expect(status)
                                .expect('Content-Type', /json/)
                                .end(
                                    function (error, response) {
                                        var res = testHelper.getTrimmedData(response.res.text);
                                        assert.deepEqual(res, responseData.get,
                                                         'GET response does not conform to expected value');
                                        done(error);
                                    }
                                );
                        } else {
                            result = testHelper.getTrimmedData(response.res.text);
                            assert.deepEqual(result, responseData,
                                             'response does not conform to expected value');
                            done(error);
                        }
                    }

                }
            );
    };
}

/**
 * Assert POST requests
 * @param {Object} request the request to be send to api
 * @param {Object} response the response to be expected from api
 * @param {Integer} status the expected response status
 * @param {String} handle the handle of the request caller
 */
function post(request, response, status, handle) {
    return assertResponse("post", {handle: handle, request: request, response: response, status: status});
}

/**
 * Assert GET requests
 * @param {Object} response the response to be expected from api
 * @param {Integer} status the expected response status
 * @param {String} handle the handle of the request caller
 */
function get(response, status, handle) {
    return assertResponse("get", {handle: handle, request: null, response: response, status: status});
}


describe('Payment Preference API', function () {
    this.timeout(60000); // Wait a minute, remote db might be slow.
    describe('Valid Requests', function () {
        describe('GET Requests', function () {
            var clearDb = runSqlFiles("get", "clean");
            beforeEach(function (done) {
                async.series(
                    [
                        clearDb,
                        runSqlFiles("get", "insert")

                    ],
                    done
                );
            });
            afterEach(function (done) {
                async.series(
                    [
                        clearDb
                    ],
                    done
                );
            });

            it(
                "User has no payment method set.",
                get(
                    {
                        "paymentMethod": "None",
                        "paymentAccrualAmount": 25
                    },
                    200,
                    "twight"
                )
            );

            it(
                "User has no payment method set, but accrural amount was set to a value.",
                get(
                    {
                        "paymentMethod": "None",
                        "paymentAccrualAmount": 100
                    },
                    200,
                    "sandking"
                )
            );

            it(
                "User has no payment method, accrual amount set, but paypal account email was set to a value.",
                get(
                    {
                        "paymentMethod": "None",
                        "paymentAccrualAmount": 25
                    },
                    200,
                    "lightspeed"
                )
            );

            it(
                "Get paypal preference.",
                get(
                    {
                        "paymentAccrualAmount": 100,
                        "paypalAccountEmail": "heffan@topcoder.com",
                        "paymentMethod": "PayPal"
                    },
                    200,
                    "heffan"
                )
            );
            it(
                "Get Western Union preference.",
                get(
                    {
                        "paymentAccrualAmount": 43,
                        "paymentMethod": "Western Union"
                    },
                    200,
                    "partha"
                )
            );
            it(
                "Get Payoneer preference.",
                get(
                    {
                        "paymentAccrualAmount": 25,
                        "paymentMethod": "Payoneer"
                    },
                    200,
                    "dok"
                )
            );
            it(
                "Get Payoneer preference, User has paypalAccountEmail",
                get(
                    {
                        "paymentAccrualAmount": 50,
                        "paymentMethod": "Payoneer"
                    },
                    200,
                    "super"
                )
            );
            it(
                "Get Payoneer preference, User has no paymentAccrualAmount set.",
                get(
                    {
                        "paymentAccrualAmount": 25,
                        "paymentMethod": "Payoneer"
                    },
                    200,
                    "user"
                )
            );
        });

        describe('POST Requests', function () {
            var clearDb = runSqlFiles("post", "clean");
            beforeEach(function (done) {
                async.series(
                    [
                        clearDb,
                        runSqlFiles("post", "insert")

                    ],
                    done
                );
            });
            afterEach(function (done) {
                async.series(
                    [
                        clearDb
                    ],
                    done
                );

            });

            it(
                "Insert Western Union",
                post(
                    {
                        paymentMethod: "Western Union"
                    },
                    {
                        post: {
                            success: true
                        },
                        get: {
                            paymentMethod: "Western Union",
                            paymentAccrualAmount: 25
                        }
                    },
                    200,
                    "hung"
                )
            );

            it(
                "Update Western Union",
                post(
                    {
                        paymentMethod: "Western Union"
                    },
                    {
                        post: {
                            success: true
                        },
                        get: {
                            paymentMethod: "Western Union",
                            paymentAccrualAmount: 25
                        }
                    },
                    200,
                    "partha"
                )
            );

            it(
                "Insert PayPal",
                post(
                    {
                        paymentMethod: "PayPal",
                        paypalAccountEmail: "chelseasimon@gmail.com"
                    },
                    {
                        post: {
                            success: true
                        },
                        get: {
                            paymentMethod: "PayPal",
                            paypalAccountEmail: "chelseasimon@gmail.com",
                            paymentAccrualAmount: 25
                        }
                    },
                    200,
                    "chelseasimon"
                )
            );

            it(
                "Insert PayPal - case insensitive",
                post(
                    {
                        paymentMethod: "pAyPal",
                        paypalAccountEmail: "chelseasimon@gmail.com"
                    },
                    {
                        post: {
                            success: true
                        },
                        get: {
                            paymentMethod: "PayPal",
                            paypalAccountEmail: "chelseasimon@gmail.com",
                            paymentAccrualAmount: 25
                        }
                    },
                    200,
                    "chelseasimon"
                )
            );

            it(
                "paypalAccountEmail may be 100 characters long",
                post(
                    {
                        paymentMethod: "PayPal",
                        paypalAccountEmail:
                            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@gmail.com"
                    },
                    {
                        post: {
                            success: true
                        },
                        get: {
                            paymentMethod: "PayPal",
                            paypalAccountEmail:
                                "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@gmail.com",
                            paymentAccrualAmount: 25
                        }
                    },
                    200,
                    "chelseasimon"
                )
            );

            it(
                "Update PayPal",
                post(
                    {
                        paymentMethod: "PayPal",
                        paypalAccountEmail: "wyzmo@newmail.com"
                    },
                    {
                        post: {
                            success: true
                        },
                        get: {
                            paymentMethod: "PayPal",
                            paypalAccountEmail: "wyzmo@newmail.com",
                            paymentAccrualAmount: 25
                        }
                    },
                    200,
                    "wyzmo"
                )
            );

            it(
                "non-Paypal paymentMethod with paypalAccountEmail",
                function (cb) {
                    var email = "hung@topcoder.com";
                    createPostRequest(
                        {
                            request: {paymentMethod: "payoneer", paypalAccountEmail: email},
                            handle: "hung"
                        }
                    ).expect(200)
                         .expect('Content-Type', /json/)
                         .end(
                            function (error) {
                                if (!error) {
                                    async.series(
                                        [
                                            async.apply(
                                                testHelper.runSqlSelectQuery,
                                                "email_address FROM 'informix'.user_paypal_account WHERE user_id = 124764",
                                                "informixoltp"
                                            )
                                        ],
                                        function (error, results) {
                                            if (!error) {
                                                assert.equal(
                                                    results[0][0].email_address,
                                                    email,
                                                    "Email address should have been saved without regard of payment method."
                                                );
                                                cb();
                                            } else {
                                                cb(error);
                                            }
                                        }
                                    );
                                } else {
                                    cb(error);
                                }
                            }
                        );
                }
            );


            it(
                "Insert paymentAccrualAmount - default value",
                function (cb) {
                    createPostRequest(
                        {
                            request: {paymentMethod: "payoneer"},
                            handle: "hung"
                        }
                    ).expect(200)
                         .expect('Content-Type', /json/)
                         .end(
                            function (error) {
                                if (!error) {
                                    async.series(
                                        [
                                            async.apply(
                                                testHelper.runSqlSelectQuery,
                                                "accrual_amount FROM 'informix'.user_accrual WHERE user_id = 124764",
                                                "informixoltp"
                                            )
                                        ],
                                        function (error, results) {
                                            if (!error) {
                                                assert.equal(
                                                    results[0][0].accrual_amount,
                                                    25,
                                                    "accrual_amount should have default value"
                                                );
                                                cb();
                                            } else {
                                                cb(error);
                                            }
                                        }
                                    );
                                } else {
                                    cb(error);
                                }
                            }
                        );
                }
            );

            it(
                "Insert paymentAccrualAmount",
                post(
                    {
                        paymentMethod: "Payoneer",
                        paymentAccrualAmount: 100
                    },
                    {
                        post: {
                            success: true
                        },
                        get: {
                            paymentMethod: "Payoneer",
                            paymentAccrualAmount: 100
                        }
                    },
                    200,
                    "cartajs"
                )
            );

            it(
                "Update paymentAccrualAmount",
                post(
                    {
                        paymentMethod: "Payoneer",
                        paymentAccrualAmount: 99
                    },
                    {
                        post: {
                            success: true
                        },
                        get: {
                            paymentMethod: "Payoneer",
                            paymentAccrualAmount: 99
                        }
                    },
                    200,
                    "ksmith"
                )
            );

            it(
                "Update paymentAccrualAmount - paymentAccrualAmount is number string",
                post(
                    {
                        paymentMethod: "Payoneer",
                        paymentAccrualAmount: "150"
                    },
                    {
                        post: {
                            success: true
                        },
                        get: {
                            paymentMethod: "Payoneer",
                            paymentAccrualAmount: 150
                        }
                    },
                    200,
                    "ksmith"
                )
            );


        });

    });
    describe('Invalid Requests', function () {
        describe('GET Requests', function () {
            it(
                "Unauthorized",
                get(
                    {
                        "error": {
                            "name": "Unauthorized",
                            "value": 401,
                            "description": "Authentication credentials were missing or incorrect.",
                            "details": "No anonymous access to this API."
                        }
                    },
                    401
                )
            );
        });

        describe('POST Requests', function () {
            it(
                "Unauthorized",
                post(
                    {
                        paymentMethod: "Payoneer"
                    },
                    {
                        "error": {
                            "name": "Unauthorized",
                            "value": 401,
                            "description": "Authentication credentials were missing or incorrect.",
                            "details": "No anonymous access to this API."
                        }
                    },
                    401
                )
            );

            it(
                "paymentMethod not activated",
                post(
                    {
                        paymentMethod: "FooBar"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "'FooBar' is not an active payment method."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "paymentMethod isn't a string",
                post(
                    {
                        paymentMethod: 12345
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "paymentMethod should be string."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "paymentAccrualAmount too low",
                post(
                    {
                        paymentMethod: "Payoneer",
                        paymentAccrualAmount: 1
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "'paymentAccrualAmount' was 1, but must not be lower than 25."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "paymentAccrualAmount isn't an integer",
                post(
                    {
                        paymentMethod: "Payoneer",
                        paymentAccrualAmount: 134.5
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "paymentAccrualAmount should be Integer."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "paymentAccrualAmount isn't a positive integer",
                post(
                    {
                        paymentMethod: "Payoneer",
                        paymentAccrualAmount: -100
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "paymentAccrualAmount should be positive."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "paymentMethod 'PayPal' without paypalAccountEmail",
                post(
                    {
                        paymentMethod: "PayPal"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "Mandatory argument 'paypalAccountEmail' is missing."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "paypalAccountEmail isn't valid email address.",
                post(
                    {
                        paymentMethod: "PayPal",
                        paypalAccountEmail: "foo12@345.7e"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "paypalAccountEmail should be email address."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "paypalAccountEmail exceeds 100 characters",
                post(
                    {
                        paymentMethod: "PayPal",
                        paypalAccountEmail:
                            "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@gmail.com"
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "paypalAccountEmail exceeds 100 characters."
                        }
                    },
                    400,
                    "heffan"
                )
            );

            it(
                "paypalAccountEmail isn't a string",
                post(
                    {
                        paymentMethod: "PayPal",
                        paypalAccountEmail: 12345
                    },
                    {
                        "error": {
                            "name": "Bad Request",
                            "value": 400,
                            "description": "The request was invalid. An accompanying message will explain why.",
                            "details": "paypalAccountEmail should be string."
                        }
                    },
                    400,
                    "heffan"
                )
            );
        });
    });
});
