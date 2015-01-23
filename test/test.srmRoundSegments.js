/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 *
 * The test cases for srmRoundQuestions.js.
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
    chai = require('chai'),
    jwt = require('jsonwebtoken');

var assert = chai.assert;
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080',
    SQL_DIR = __dirname + "/sqls/srmRoundSegments/",
    CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId,
    CLIENT_SECRET = require('../config/tc-config').tcConfig.oauthClientSecret,
    USER = {
        heffan       : "ad|132456",
        "super"      : "ad|132457",
        user         : "ad|132458",
        ksmith       : "ad|124861"
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
 * Create post request and return it.
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

describe('SRM Round Questions APIs', function () {
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
    describe('Set Round Segments API invalid test', function () {
        var validRequest = {"registrationStart": "2014-09-07 19:44:44Z", "registrationLength" : 20,
            "codingStart": "2014-09-07 20:14:44Z", "codingLength": 100, "intermissionLength": 10,
            "challengeLength": 15, "registrationStatus": "F", "codingStatus": "F",
            "intermissionStatus": "F", "challengeStatus": "F", "systemTestStatus": "F"};
        it("No anonymous access.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673/segments", null, validRequest, 401, "Authorized information needed.", done);
        });

        it("Admin or web Arena super user only.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673/segments", 'user', validRequest, 403, "Admin or web Arena super user only.", done);
        });

        it("roundId should be number.", function (done) {
            assertPostError("/v2/data/srm/rounds/aaa/segments", 'heffan', validRequest, 400, "roundId should be number.", done);
        });

        it("roundId should be number (with web Arena super user).", function (done) {
            assertPostError("/v2/data/srm/rounds/aaa/segments", 'ksmith', validRequest, 400, "roundId should be number.", done);
        });

        it("roundId should be Integer.", function (done) {
            assertPostError("/v2/data/srm/rounds/1367.3/segments", 'heffan', validRequest, 400, "roundId should be Integer.", done);
        });

        it("roundId should be positive.", function (done) {
            assertPostError("/v2/data/srm/rounds/-13673/segments", 'heffan', validRequest, 400, "roundId should be positive.", done);
        });

        it("roundId should be less or equal to 2147483647.", function (done) {
            assertPostError("/v2/data/srm/rounds/111111111111111111111111111/segments", 'heffan', validRequest, 400,
                "roundId should be less or equal to 2147483647.", done);
        });

        it("registrationStart is not a valid date.", function (done) {
            validRequest.registrationStart = "hello";
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "registrationStart is not a valid date.", done);
        });

        it("registrationLength should be number.", function (done) {
            validRequest.registrationStart = "2014-09-07 19:44:44Z"
            validRequest.registrationLength = "oo";
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "registrationLength should be number.", done);
        });

        it("registrationLength should be Integer.", function (done) {
            validRequest.registrationLength = 1.1;
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "registrationLength should be Integer.", done);
        });

        it("registrationLength should be greater or equal to 0.", function (done) {
            validRequest.registrationLength = -1;
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "registrationLength should be greater or equal to 0", done);
        });

        it("codingStart is not a valid date.", function (done) {
            validRequest.registrationLength = 20;
            validRequest.codingStart = "hello";
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "codingStart is not a valid date.", done);
        });

        it("codingLength should be number.", function (done) {
            validRequest.codingStart = "2014-09-07 20:14:44Z";
            validRequest.codingLength = "oo";
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "codingLength should be number.", done);
        });

        it("codingLength should be Integer.", function (done) {
            validRequest.codingLength = 1.1;
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "codingLength should be Integer.", done);
        });

        it("codingLength should be greater or equal to 0.", function (done) {
            validRequest.codingLength = -1;
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "codingLength should be greater or equal to 0", done);
        });

        it("intermissionLength should be number.", function (done) {
            validRequest.codingLength = 100;
            validRequest.intermissionLength = "oo";
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "intermissionLength should be number.", done);
        });

        it("intermissionLength should be Integer.", function (done) {
            validRequest.intermissionLength = 1.1;
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "intermissionLength should be Integer.", done);
        });

        it("intermissionLength should be greater or equal to 0.", function (done) {
            validRequest.intermissionLength = -1;
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "intermissionLength should be greater or equal to 0", done);
        });

        it("challengeLength should be number.", function (done) {
            validRequest.intermissionLength = 10;
            validRequest.challengeLength = "oo";
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "challengeLength should be number.", done);
        });

        it("challengeLength should be Integer.", function (done) {
            validRequest.challengeLength = 1.1;
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "challengeLength should be Integer.", done);
        });

        it("challengeLength should be greater or equal to 0.", function (done) {
            validRequest.challengeLength = -1;
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "challengeLength should be greater or equal to 0", done);
        });

        it("registrationStatus exceeds 1 characters.", function (done) {
            validRequest.challengeLength = 15;
            validRequest.registrationStatus = "abc";
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "registrationStatus exceeds 1 characters.", done);
        });
        it("codingStatus exceeds 1 characters.", function (done) {
            validRequest.registrationStatus = "F";
            validRequest.codingStatus = "abc";
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "codingStatus exceeds 1 characters.", done);
        });
        it("intermissionStatus exceeds 1 characters.", function (done) {
            validRequest.codingStatus = "F";
            validRequest.intermissionStatus = "abc";
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "intermissionStatus exceeds 1 characters.", done);
        });
        it("challengeStatus exceeds 1 characters.", function (done) {
            validRequest.intermissionStatus = "F";
            validRequest.challengeStatus = "abc";
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "challengeStatus exceeds 1 characters.", done);
        });
        it("systemTestStatus exceeds 1 characters.", function (done) {
            validRequest.challengeStatus = "F";
            validRequest.systemTestStatus = "abc";
            assertPostError("/v2/data/srm/rounds/13673/segments", 'heffan', validRequest, 400, "systemTestStatus exceeds 1 characters.", done);
        });
    });

    describe('Valid test', function () {

        it("Valid set segments.", function (done) {
            var validRequest = {"registrationStart": "2014-09-07 19:44:44+0800", "registrationLength" : 20,
                "codingStart": "2014-09-07 20:14:44+0800", "codingLength": 100, "intermissionLength": 10,
                "challengeLength": 15, "registrationStatus": "F", "codingStatus": "F",
                "intermissionStatus": "F", "challengeStatus": "F", "systemTestStatus": "F"};
            async.waterfall([
                function (cb) {
                    createPostRequest("/v2/data/srm/rounds/13673/segments", 'heffan').expect(200).send(validRequest).end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        assert.equal(res.body.success, true, "Invalid response detail");
                        cb();
                    });
                }, function (cb) {
                    var sql = "* from round_segment where round_id = 13673 order by segment_id";
                    testHelper.runSqlSelectQuery(sql, "informixoltp", function (err, result) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        cb(null, result);
                    });
                }, function (result, cb) {
                    assert.equal(result.length, 6, "Exactly five rows must be returned");
                    var expected = {
                        round_id: 13673,
                        status: "F",
                        "segment_id":1
                    }, actual = _.omit(result[0], ['start_time', 'end_time']);
                    assert.deepEqual(actual, expected, 'Actual and Expected survey did not match.');
                    assert.equal(result[0].start_time.slice(0, result[0].start_time.length - 5), "2014-09-07T19:44:44.000", "Invalid response detail");
                    assert.equal(result[0].end_time.slice(0, result[0].end_time.length - 5), "2014-09-07T20:04:44.000", "Invalid response detail");

                    expected.segment_id = 2;
                    actual = _.omit(result[1], ['start_time', 'end_time']);
                    assert.deepEqual(actual, expected, 'Actual and Expected survey did not match.');
                    assert.equal(result[1].start_time.slice(0, result[1].start_time.length - 5), "2014-09-07T20:14:44.000", "Invalid response detail");
                    assert.equal(result[1].end_time.slice(0, result[1].end_time.length - 5), "2014-09-07T21:54:44.000", "Invalid response detail");

                    expected.segment_id = 3;
                    actual = _.omit(result[2], ['start_time', 'end_time']);
                    assert.deepEqual(actual, expected, 'Actual and Expected survey did not match.');
                    assert.equal(result[2].start_time.slice(0, result[2].start_time.length - 5), "2014-09-07T21:54:44.000", "Invalid response detail");
                    assert.equal(result[2].end_time.slice(0, result[2].end_time.length - 5), "2014-09-07T22:04:44.000", "Invalid response detail");

                    expected.segment_id = 4;
                    actual = _.omit(result[3], ['start_time', 'end_time']);
                    assert.deepEqual(actual, expected, 'Actual and Expected survey did not match.');
                    assert.equal(result[3].start_time.slice(0, result[3].start_time.length - 5), "2014-09-07T22:04:44.000", "Invalid response detail");
                    assert.equal(result[3].end_time.slice(0, result[3].end_time.length - 5), "2014-09-07T22:19:44.000", "Invalid response detail");

                    expected.segment_id = 5;
                    actual = _.omit(result[4], ['start_time', 'end_time']);
                    assert.deepEqual(actual, expected, 'Actual and Expected survey did not match.');
                    assert.equal(result[4].start_time.slice(0, result[4].start_time.length - 5), "2014-09-07T22:19:44.000", "Invalid response detail");
                    assert.equal(result[4].end_time.slice(0, result[4].end_time.length - 5), "2014-09-07T22:19:44.000", "Invalid response detail");

                    expected.segment_id = 7;
                    actual = _.omit(result[5], ['start_time', 'end_time']);
                    assert.deepEqual(actual, expected, 'Actual and Expected survey did not match.');
                    assert.equal(result[5].start_time.slice(0, result[5].start_time.length - 5), "2014-09-07T20:05:44.000", "Invalid response detail");
                    assert.equal(result[5].end_time.slice(0, result[5].end_time.length - 5), "2014-09-07T20:14:44.000", "Invalid response detail");

                    cb();
                }
            ],done);
        });
    });
});
