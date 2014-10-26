/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 *
 * The test cases for srmRoundComponentsAndTerms.js.
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */

/**
 * Module dependencies.
 */
var _ = require('underscore'),
    async = require('async'),
    request = require('supertest'),
    chai = require('chai'),
    jwt = require('jsonwebtoken');

var assert = chai.assert;
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080',
    SQL_DIR = __dirname + "/sqls/srmRoundComponentsAndTerms/",
    CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId,
    CLIENT_SECRET = require('../config/tc-config').tcConfig.oauthClientSecret,
    USER = {
        heffan       : "ad|132456",
        "super"      : "ad|132457",
        user         : "ad|132458"
    };


/**
 * Generate an auth header
 * @param {String} user the user to generate the header for
 * @return {String} the generated string
 */
function generateAuthHeader(user) {
    return "Bearer " + jwt.sign({sub: USER[user]}, CLIENT_SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
}

/**
 * Create put request and return it.
 *
 * @param queryString - the query string
 * @param user - the user handle
 * @returns {*} request
 */
function createPostRequest(queryString, user) {
    var req = request(API_ENDPOINT)
        .post(queryString)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/);
    if (user) {
        req.set('Authorization', generateAuthHeader(user));
    }

    return req;
}

/**
 * Create get request and return it.
 *
 * @param queryString - the query string
 * @param user - the user handle
 * @returns {*} request
 */
function createGetRequest(queryString, user) {
    var req = request(API_ENDPOINT)
        .get(queryString)
        .set("Accept", "application/json")
        .expect("Content-Type", /json/);
    if (user) {
        req.set('Authorization', generateAuthHeader(user));
    }

    return req;
}

/**
 * Assert post response detail.
 *
 * @param queryString - the query string
 * @param user - the user handle
 * @param obj - the JSON object
 * @param statusCode - the expected status code
 * @param errorDetail - the error detail.
 * @param done the callback function
 */
function assertPostError(queryString, user, obj, statusCode, errorDetail, done) {
    createPostRequest(queryString, user).expect(statusCode).send(obj).end(function (err, res) {
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
 * Assert Get response detail.
 *
 * @param queryString - the query string
 * @param user - the user handle
 * @param obj - the JSON object
 * @param statusCode - the expected status code
 * @param errorDetail - the error detail.
 * @param done the callback function
 */
function assertGetError(queryString, user, obj, statusCode, errorDetail, done) {
    createGetRequest(queryString, user).expect(statusCode).send(obj).end(function (err, res) {
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

describe('SRM Round Components And Terms APIs', function () {
    this.timeout(120000); // Wait 2 minutes, remote db might be slow.

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "informixoltp__clean", "informixoltp", done);
    }

    /**
     * This function is run before all tests.
     *
     * @param {Function<err>} done the callback
     */
    before(function (done) {
        async.waterfall([
            clearDb
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

    describe('Set Round Problems API invalid test', function () {

        var validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
            {"componentId": 2021, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1}]};
        it("No anonymous access.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673/components", null, validRequest, 401, "Authorized information needed.", done);
        });

        it("Admin access only.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673/components", 'user', validRequest, 403, "Admin access only.", done);
        });

        it("roundId should be number.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673a/components", 'heffan', validRequest, 400, "roundId should be number.", done);
        });

        it("roundId should be Integer.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673.01/components", 'heffan', validRequest, 400, "roundId should be Integer.", done);
        });

        it("roundId should be positive.", function (done) {
            assertPostError("/v2/data/srm/rounds/-13673/components", 'heffan', validRequest, 400, "roundId should be positive.", done);
        });

        it("roundId should be less or equal to 2147483647.", function (done) {
            assertPostError("/v2/data/srm/rounds/1111111111111111111/components", 'heffan', validRequest, 400,
                "roundId should be less or equal to 2147483647.", done);
        });

        it("components should be Array.", function (done) {
            validRequest = {"components": 1};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "components should be Array.", done);
        });

        it("componentId should not be null or undefined", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "componentId should not be null or undefined", done);
        });

        it("points should not be null or undefined", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "points should not be null or undefined", done);
        });

        it("divisionId should not be null or undefined", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "divisionId should not be null or undefined", done);
        });

        it("difficultyId should not be null or undefined", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 1, "divisionId": 1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "difficultyId should not be null or undefined", done);
        });

        it("openOrder should not be null or undefined", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 1, "divisionId": 1, "difficultyId": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "openOrder should not be null or undefined", done);
        });

        it("submitOrder should not be null or undefined", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "submitOrder should not be null or undefined", done);
        });

        it("componentId should be positive.", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": -1, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "componentId should be positive.", done);
        });

        it("points should be greater or equal to 0", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": -1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "points should be greater or equal to 0", done);
        });

        it("divisionId should be number.", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 1, "divisionId": "a", "difficultyId": 1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "divisionId should be number.", done);
        });

        it("difficultyId should be positive.", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 1, "divisionId": 1, "difficultyId": -1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "difficultyId should be positive.", done);
        });

        it("openOrder should be non-negative.", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": -1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "openOrder should be non-negative.", done);
        });

        it("submitOrder should be non-negative.", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": -1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "submitOrder should be non-negative.", done);
        });

        it("The componentId does not exist in database.", function (done) {
            validRequest = {"components": [{"componentId": 1, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "The componentId " + 1 + " does not exist in database.", done);
        });

        it("The divisionId does not exist in database.", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 10, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "The divisionId " + 10 + " does not exist in database.", done);
        });

        it("The difficultyId does not exist in database.", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 10, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "The difficultyId " + 10 + " does not exist in database.", done);
        });

        it("The componentId and divisionId group should be unique.", function (done) {
            validRequest = {"components": [{"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2020, "points": 1, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1}]};
            assertPostError("/v2/data/srm/rounds/13673/components", 'heffan', validRequest, 400,
                "The componentId " + 2020 + " and divisionId " + 1 + " group should be unique.", done);
        });

    });

    describe('Set Round Terms API invalid test', function () {
        var validRequest = {"terms": "term text"};
        it("No anonymous access.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673/terms", null, validRequest, 401, "Authorized information needed.", done);
        });

        it("Admin access only.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673/terms", 'user', validRequest, 403, "Admin access only.", done);
        });

        it("roundId should be number.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673a/terms", 'heffan', validRequest, 400, "roundId should be number.", done);
        });

        it("roundId should be Integer.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673.01/terms", 'heffan', validRequest, 400, "roundId should be Integer.", done);
        });

        it("roundId should be positive.", function (done) {
            assertPostError("/v2/data/srm/rounds/-13673/terms", 'heffan', validRequest, 400, "roundId should be positive.", done);
        });

        it("roundId should be less or equal to 2147483647.", function (done) {
            assertPostError("/v2/data/srm/rounds/1111111111111111111/terms", 'heffan', validRequest, 400,
                "roundId should be less or equal to 2147483647.", done);
        });

        it("The round terms should not be empty.", function (done) {
            validRequest.terms = " ";
            assertPostError("/v2/data/srm/rounds/13673/terms", 'heffan', validRequest, 400,
                "The round terms should not be empty.", done);
        });

    });

    describe('Valid test', function () {
        it("Valid set components.", function (done) {
            var validRequest = {"components": [{"componentId": 2020, "points": 250, "divisionId": 1, "difficultyId": 1, "openOrder": 1, "submitOrder": 1},
                {"componentId": 2021, "points": 500, "divisionId": 2, "difficultyId": 2, "openOrder": 1, "submitOrder": 1}]};

            createPostRequest("/v2/data/srm/rounds/13673/components", 'heffan').expect(200).send(validRequest).end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(res.body.success, true, "Invalid response detail");
                var sql = "* from round_component where round_id = 13673 order by component_id";
                testHelper.runSqlSelectQuery(sql, "informixoltp", function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    assert.equal(result.length, 2, "Exactly 2 rows must be returned");
                    var expected1 = {
                        round_id: 13673,
                        component_id: 2020,
                        submit_order: 1,
                        division_id: 1,
                        difficulty_id: 1,
                        points: 250,
                        open_order: 1
                    }, expected2 = {
                        round_id: 13673,
                        component_id: 2021,
                        submit_order: 1,
                        division_id: 2,
                        difficulty_id: 2,
                        points: 500,
                        open_order: 1
                    };
                    assert.deepEqual(result[0], expected1, 'Actual and Expected component did not match.');
                    assert.deepEqual(result[1], expected2, 'Actual and Expected component did not match.');
                });
                done();
            });
        });

        it("Valid set terms.", function (done) {
            var validRequest = {"terms": "term text"};

            createPostRequest("/v2/data/srm/rounds/13673/terms", 'heffan').expect(200).send(validRequest).end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(res.body.success, true, "Invalid response detail");
                var sql = "* from round_terms where round_id = 13673";
                testHelper.runSqlSelectQuery(sql, "informixoltp", function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    assert.equal(result.length, 1, "Exactly 1 row must be returned");
                    var expected = {
                        round_id: 13673,
                        terms_content: "term text"
                    };
                    assert.deepEqual(result[0], expected, 'Actual and Expected component did not match.');
                });
                done();
            });
        });

        describe('Get Round Terms API invalid test', function () {
            it("No anonymous access.", function (done) {
                assertGetError("/v2/data/srm/rounds/13673/terms", null, null, 401, "Authorized information needed.", done);
            });

            it("Admin access only.", function (done) {
                assertGetError("/v2/data/srm/rounds/13673/terms", 'user', null, 403, "Admin access only.", done);
            });

            it("roundId should be number.", function (done) {
                assertGetError("/v2/data/srm/rounds/13673a/terms", 'heffan', null, 400, "roundId should be number.", done);
            });

            it("roundId should be Integer.", function (done) {
                assertGetError("/v2/data/srm/rounds/13673.01/terms", 'heffan', null, 400, "roundId should be Integer.", done);
            });

            it("roundId should be positive.", function (done) {
                assertGetError("/v2/data/srm/rounds/-13673/terms", 'heffan', null, 400, "roundId should be positive.", done);
            });

            it("roundId should be less or equal to 2147483647.", function (done) {
                assertGetError("/v2/data/srm/rounds/1111111111111111111/terms", 'heffan', null, 400,
                    "roundId should be less or equal to 2147483647.", done);
            });

            it("The round terms should not be empty.", function (done) {
                var notFoundRoundId = 136733;
                assertGetError("/v2/data/srm/rounds/" + notFoundRoundId + "/terms", 'heffan', null, 400,
                    "The round terms can't be found with such roundId = " + notFoundRoundId, done);
            });

            it("Valid get round terms.", function (done) {
                createGetRequest("/v2/data/srm/rounds/13673/terms", 'heffan').expect(200).send(null).end(function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    assert.equal(res.body.roundTermsContent, "term text", "Invalid response detail");
                    done();
                });
            });
        });
    });
});