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
    SQL_DIR = __dirname + "/sqls/srmRoundQuestions/",
    CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId,
    CLIENT_SECRET = require('../config/tc-config').tcConfig.oauthClientSecret,
    USER = {
        heffan       : "ad|132456",
        "super"      : "ad|132457",
        user         : "ad|132458",
        ksmith       : "ad|124861" // web arena super user
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
 * Create request and return it
 * @param {String} queryString - the query string
 * @param {String} user - the user handle
 * @return {Object} request
 */
function createRequest(queryString, user) {
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
 * Create delete request and return it.
 *
 * @param queryString - the query string
 * @param user - the user handle
 * @returns {*} request
 */
function createDeleteRequest(queryString, user) {
    var req = request(API_ENDPOINT)
      .del(queryString)
      .set("Accept", "application/json")
      .expect("Content-Type", /json/);
    if (user) {
        req.set('Authorization', generateAuthHeader(user));
    }

    return req;
}

/**
 * Assert error request.
 *
 * @param {String} queryString - the query string
 * @param {String} user - the user handle
 * @param {Number} statusCode - the expected status code
 * @param {String} errorDetail - the error detail.
 * @param {Function} done the callback function
 */
function assertError(queryString, user, statusCode, errorDetail, done) {
    createRequest(queryString, user).expect(statusCode).end(function (err, res) {
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
 * Assert delete response detail.
 *
 * @param queryString - the query string
 * @param user - the user handle
 * @param statusCode - the expected status code
 * @param errorDetail - the error detail.
 * @param done the callback function
 */
function assertDeleteError(queryString, user, statusCode, errorDetail, done) {
    createDeleteRequest(queryString, user).expect(statusCode).end(function (err, res) {
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
 * Create a long text.
 *
 * @param length - the text length
 * @returns {string} created text.
 */
function getLongText(length) {
    var i, result = "";
    for (i = 0; i < length; i++) {
        result = result + "a";
    }
    return result;
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

    describe('Get Round Questions API invalid test', function () {

        it("No anonymous access.", function (done) {
            assertError("/v2/data/srm/rounds/13673/questions", null, 401, "Authorized information needed.", done);
        });

        it("Admin or web Arena super user only.", function (done) {
            assertError("/v2/data/srm/rounds/13673/questions", 'user', 403, "Admin or web Arena super user only.", done);
        });

        it("roundId should be number.", function (done) {
            assertError("/v2/data/srm/rounds/roundId/questions", 'heffan', 400, "roundId should be number.", done);
        });

        it("roundId should be number (with web Arena super user).", function (done) {
            assertError("/v2/data/srm/rounds/roundId/questions", 'ksmith', 400, "roundId should be number.", done);
        });

        it("roundId should be Integer.", function (done) {
            assertError("/v2/data/srm/rounds/13673.01/questions", 'heffan', 400, "roundId should be Integer.", done);
        });

        it("roundId should be positive.", function (done) {
            assertError("/v2/data/srm/rounds/-13673/questions", 'heffan', 400, "roundId should be positive.", done);
        });

        it("roundId should be less or equal to 2147483647.", function (done) {
            assertError("/v2/data/srm/rounds/1111111111111111111/questions", 'heffan', 400,
                "roundId should be less or equal to 2147483647.", done);
        });

    });

    describe('Get Round Question Answers API invalid test', function () {

        it("No anonymous access.", function (done) {
            assertError("/v2/data/srm/rounds/1000000/answers", null, 401, "Authorized information needed.", done);
        });

        it("Admin or web arena only.", function (done) {
            assertError("/v2/data/srm/rounds/1000000/answers", 'user', 403, "Admin or web Arena super user only.", done);
        });

        it("questionId should be number.", function (done) {
            assertError("/v2/data/srm/rounds/aaa/answers", 'heffan', 400, "questionId should be number.", done);
        });

        it("questionId should be number (with web Arena super user).", function (done) {
            assertError("/v2/data/srm/rounds/aaa/answers", 'ksmith', 400, "questionId should be number.", done);
        });

        it("questionId should be Integer.", function (done) {
            assertError("/v2/data/srm/rounds/100000.01/answers", 'heffan', 400, "questionId should be Integer.", done);
        });

        it("questionId should be positive.", function (done) {
            assertError("/v2/data/srm/rounds/-1000000/answers", 'heffan', 400, "questionId should be positive.", done);
        });

        it("questionId should be less or equal to 2147483647.", function (done) {
            assertError("/v2/data/srm/rounds/111111111111111111/answers", 'heffan', 400,
                "questionId should be less or equal to 2147483647.", done);
        });
    });

    describe('Set Round Survey API invalid test', function () {

        var validRequest = {"name": "name1", "statusId" : 0, "startDate": "2014-01-01 11:22", "length": 100, "surveyText": "aaa"};
        it("No anonymous access.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673/survey", null, validRequest, 401, "Authorized information needed.", done);
        });

        it("Admin access only.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673/survey", 'user', validRequest, 403, "Admin access only.", done);
        });

        it("roundId should be number.", function (done) {
            assertPostError("/v2/data/srm/rounds/aaa/survey", 'heffan', validRequest, 400, "roundId should be number.", done);
        });

        it("roundId should be Integer.", function (done) {
            assertPostError("/v2/data/srm/rounds/1367.3/survey", 'heffan', validRequest, 400, "roundId should be Integer.", done);
        });

        it("roundId should be positive.", function (done) {
            assertPostError("/v2/data/srm/rounds/-13673/survey", 'heffan', validRequest, 400, "roundId should be positive.", done);
        });

        it("roundId should be less or equal to 2147483647.", function (done) {
            assertPostError("/v2/data/srm/rounds/111111111111111111111111111/survey", 'heffan', validRequest, 400,
                "roundId should be less or equal to 2147483647.", done);
        });

        it("name should be string.", function (done) {
            validRequest.name = 1;
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "name should be string.", done);
        });

        it("name exceeds 50 characters.", function (done) {
            validRequest.name = getLongText(51);
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "name exceeds 50 characters.", done);
        });

        it("statusId should be number.", function (done) {
            validRequest.name = "name1";
            validRequest.statusId = "name1";
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "statusId should be number.", done);
        });

        it("statusId should be Integer.", function (done) {
            validRequest.name = "name1";
            validRequest.statusId = 1.1;
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "statusId should be Integer.", done);
        });

        it("statusId should be greater or equal to 0.", function (done) {
            validRequest.name = "name1";
            validRequest.statusId = -1;
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "statusId should be greater or equal to 0", done);
        });

        it("The statusId does not exist in database.", function (done) {
            validRequest.name = "name1";
            validRequest.statusId = 111;
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "The statusId does not exist in database.", done);
        });

        it("length should be number.", function (done) {
            validRequest.name = "name1";
            validRequest.statusId = 1;
            validRequest.length = "aaa";
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "length should be number.", done);
        });

        it("length should be Integer.", function (done) {
            validRequest.name = "name1";
            validRequest.statusId = 1;
            validRequest.length = 1.1;
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "length should be Integer.", done);
        });

        it("length should be greater or equal to 0.", function (done) {
            validRequest.name = "name1";
            validRequest.statusId = 1;
            validRequest.length = -1;
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "length should be greater or equal to 0", done);
        });

        it("surveyText should be string.", function (done) {
            validRequest.name = "name1";
            validRequest.statusId = 1;
            validRequest.length = 1;
            validRequest.surveyText = 1;
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "surveyText should be string.", done);
        });

        it("surveyText exceeds 2048 characters.", function (done) {
            validRequest.surveyText = getLongText(2049);
            validRequest.name = "name1";
            validRequest.statusId = 1;
            validRequest.length = 1;
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "surveyText exceeds 2048 characters.", done);
        });

        it("startDate is not a valid date.", function (done) {
            validRequest.name = "name1";
            validRequest.statusId = 1;
            validRequest.length = 1;
            validRequest.surveyText = "aaa";
            validRequest.startDate = "2011-01-01aaa";
            assertPostError("/v2/data/srm/rounds/13673/survey", 'heffan', validRequest, 400, "startDate is not a valid date.", done);
        });
    });

    describe('Add Round Question Answer API invalid test', function () {

        var validRequest = {"text": "text2", "sortOrder": 1, "correct": true};

        it("No anonymous access.", function (done) {
            assertPostError("/v2/data/srm/questions/306/answers", null, validRequest, 401, "Authorized information needed.", done);
        });

        it("Admin or web Arena super user only.", function (done) {
            assertPostError("/v2/data/srm/questions/306/answers", 'user', validRequest, 403, "Admin or web Arena super user only.", done);
        });

        it("questionId should be number.", function (done) {
            assertPostError("/v2/data/srm/questions/aaa/answers", 'heffan', validRequest, 400, "questionId should be number.", done);
        });

        it("questionId should be number (with web Arena super user).", function (done) {
            assertPostError("/v2/data/srm/questions/aaa/answers", 'ksmith', validRequest, 400, "questionId should be number.", done);
        });

        it("questionId should be Integer.", function (done) {
            assertPostError("/v2/data/srm/questions/30.6/answers", 'heffan', validRequest, 400, "questionId should be Integer.", done);
        });

        it("questionId should be positive.", function (done) {
            assertPostError("/v2/data/srm/questions/-306/answers", 'heffan', validRequest, 400, "questionId should be positive.", done);
        });

        it("questionId should be less or equal to 2147483647.", function (done) {
            assertPostError("/v2/data/srm/questions/1111111111111111111111111/answers", 'heffan', validRequest, 400,
                "questionId should be less or equal to 2147483647.", done);
        });

        it("text should be string.", function (done) {
            validRequest.text = 1;
            assertPostError("/v2/data/srm/questions/306/answers", 'heffan', validRequest, 400, "text should be string.", done);
        });

        it("text exceeds 250 characters.", function (done) {
            validRequest.text = getLongText(2049);
            assertPostError("/v2/data/srm/questions/306/answers", 'heffan', validRequest, 400, "text exceeds 250 characters.", done);
        });

        it("sortOrder should be number.", function (done) {
            validRequest.text = "aaa";
            validRequest.sortOrder = "aaa";
            assertPostError("/v2/data/srm/questions/306/answers", 'heffan', validRequest, 400, "sortOrder should be number.", done);
        });

        it("sortOrder should be Integer.", function (done) {
            validRequest.text = "aaa";
            validRequest.sortOrder = 1.1;
            assertPostError("/v2/data/srm/questions/306/answers", 'heffan', validRequest, 400, "sortOrder should be Integer.", done);
        });

        it("sortOrder should be positive.", function (done) {
            validRequest.text = "aaa";
            validRequest.sortOrder = -1;
            assertPostError("/v2/data/srm/questions/306/answers", 'heffan', validRequest, 400, "sortOrder should be positive.", done);
        });

        it("The correct should be boolean type.", function (done) {
            validRequest.text = "aaa";
            validRequest.sortOrder = 1;
            validRequest.correct = "tt";
            assertPostError("/v2/data/srm/questions/306/answers", 'heffan', validRequest, 400, "The correct should be boolean type.", done);
        });
    });

    describe('Add Round Question API invalid test', function () {

        var validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": 1, "keyword": "keyword1", "isRequired": true};

        it("No anonymous access.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673/questions", null, validRequest, 401, "Authorized information needed.", done);
        });

        it("Admin or web Arena super user only.", function (done) {
            assertPostError("/v2/data/srm/rounds/13673/questions", 'user', validRequest, 403, "Admin or web Arena super user only.", done);
        });

        it("roundId should be number.", function (done) {
            assertPostError("/v2/data/srm/rounds/aaa/questions", 'heffan', validRequest, 400, "roundId should be number.", done);
        });

        it("roundId should be number (with web Arena super user).", function (done) {
            assertPostError("/v2/data/srm/rounds/aaa/questions", 'ksmith', validRequest, 400, "roundId should be number.", done);
        });

        it("roundId should be Integer.", function (done) {
            assertPostError("/v2/data/srm/rounds/1367.3/questions", 'heffan', validRequest, 400, "roundId should be Integer.", done);
        });

        it("roundId should be positive.", function (done) {
            assertPostError("/v2/data/srm/rounds/-13673/questions", 'heffan', validRequest, 400, "roundId should be positive.", done);
        });

        it("roundId should be less or equal to 2147483647.", function (done) {
            assertPostError("/v2/data/srm/rounds/11111111111111111/questions", 'heffan', validRequest, 400,
                "roundId should be less or equal to 2147483647.", done);
        });

        it("text should be string.", function (done) {
            validRequest.text = 1;
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "text should be string.", done);
        });

        it("text exceeds 2048 characters.", function (done) {
            validRequest.text = getLongText(2049);
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "text exceeds 2048 characters.", done);
        });

        it("keyword should be string.", function (done) {
            validRequest.keyword = 1;
            validRequest.text = "text";
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "keyword should be string.", done);
        });

        it("keyword exceeds 64 characters.", function (done) {
            validRequest.keyword = getLongText(65);
            validRequest.text = "text";
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "keyword exceeds 64 characters.", done);
        });

        it("The isRequired should be boolean type.", function (done) {
            validRequest.keyword = "aa";
            validRequest.text = "text";
            validRequest.isRequired = "text";
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400,
                "The isRequired should be boolean type.", done);
        });

        it("statusId should be number.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": "aa", "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "statusId should be number.", done);
        });

        it("statusId should be Integer.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": 1.1, "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "statusId should be Integer.", done);
        });

        it("statusId should be greater or equal to 0.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": -1, "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "statusId should be greater or equal to 0", done);
        });

        it("The statusId does not exist in database.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": 111, "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "The statusId does not exist in database.", done);
        });

        it("typeId should be number.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": "aa", "statusId": 1, "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "typeId should be number.", done);
        });

        it("typeId should be Integer.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 1.1, "statusId": 1, "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "typeId should be Integer.", done);
        });

        it("typeId should be greater or equal to 0.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": -1, "statusId": 1, "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "typeId should be greater or equal to 0", done);
        });

        it("The typeId does not exist in database.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 111, "statusId": 1, "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "The typeId does not exist in database.", done);
        });

        it("styleId should be number.", function (done) {
            validRequest = {"text": "text2", "styleId": "aa", "typeId": 1, "statusId": 1, "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "styleId should be number.", done);
        });

        it("styleId should be Integer.", function (done) {
            validRequest = {"text": "text2", "styleId": 1.1, "typeId": 1, "statusId": 1, "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "styleId should be Integer.", done);
        });

        it("styleId should be greater or equal to 0.", function (done) {
            validRequest = {"text": "text2", "styleId": -1, "typeId": 1, "statusId": 1, "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "styleId should be greater or equal to 0", done);
        });

        it("The styleId does not exist in database.", function (done) {
            validRequest = {"text": "text2", "styleId": 111, "typeId": 1, "statusId": 1, "keyword": "keyword1", "isRequired": true};
            assertPostError("/v2/data/srm/rounds/13673/questions", 'heffan', validRequest, 400, "The styleId does not exist in database.", done);
        });
    });

    describe('Modify Round Question API invalid test', function () {

        var validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": 1, "keyword": "keyword1"};

        it("No anonymous access.", function (done) {
            assertPostError("/v2/data/srm/rounds/306/question", null, validRequest, 401, "Authorized information needed.", done);
        });

        it("Admin or web Arena super user only.", function (done) {
            assertPostError("/v2/data/srm/rounds/306/question", 'user', validRequest, 403, "Admin or web Arena super user only.", done);
        });

        it("questionId should be number.", function (done) {
            assertPostError("/v2/data/srm/rounds/aaa/question", 'heffan', validRequest, 400, "questionId should be number.", done);
        });

        it("questionId should be number (with web Arena super user).", function (done) {
            assertPostError("/v2/data/srm/rounds/aaa/question", 'ksmith', validRequest, 400, "questionId should be number.", done);
        });

        it("questionId should be Integer.", function (done) {
            assertPostError("/v2/data/srm/rounds/30.6/question", 'heffan', validRequest, 400, "questionId should be Integer.", done);
        });

        it("questionId should be positive.", function (done) {
            assertPostError("/v2/data/srm/rounds/-306/question", 'heffan', validRequest, 400, "questionId should be positive.", done);
        });

        it("questionId should be less or equal to 2147483647.", function (done) {
            assertPostError("/v2/data/srm/rounds/111111111111111111111111111/question", 'heffan', validRequest, 400,
                "questionId should be less or equal to 2147483647.", done);
        });

        it("text should be string.", function (done) {
            validRequest.text = 1;
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "text should be string.", done);
        });

        it("text exceeds 2048 characters.", function (done) {
            validRequest.text = getLongText(2049);
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "text exceeds 2048 characters.", done);
        });

        it("keyword should be string.", function (done) {
            validRequest.keyword = 1;
            validRequest.text = "text";
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "keyword should be string.", done);
        });

        it("keyword exceeds 64 characters.", function (done) {
            validRequest.keyword = getLongText(65);
            validRequest.text = "text";
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "keyword exceeds 64 characters.", done);
        });

        it("statusId should be number.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": "aa", "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "statusId should be number.", done);
        });

        it("statusId should be Integer.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": 1.1, "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "statusId should be Integer.", done);
        });

        it("statusId should be greater or equal to 0.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": -1, "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "statusId should be greater or equal to 0", done);
        });

        it("The statusId does not exist in database.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": 111, "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "The statusId does not exist in database.", done);
        });

        it("typeId should be number.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": "aa", "statusId": 1, "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "typeId should be number.", done);
        });

        it("typeId should be Integer.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 1.1, "statusId": 1, "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "typeId should be Integer.", done);
        });

        it("typeId should be greater or equal to 0.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": -1, "statusId": 1, "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "typeId should be greater or equal to 0", done);
        });

        it("The typeId does not exist in database.", function (done) {
            validRequest = {"text": "text2", "styleId": 1, "typeId": 111, "statusId": 1, "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "The typeId does not exist in database.", done);
        });

        it("styleId should be number.", function (done) {
            validRequest = {"text": "text2", "styleId": "aa", "typeId": 1, "statusId": 1, "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "styleId should be number.", done);
        });

        it("styleId should be Integer.", function (done) {
            validRequest = {"text": "text2", "styleId": 1.1, "typeId": 1, "statusId": 1, "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "styleId should be Integer.", done);
        });

        it("styleId should be greater or equal to 0.", function (done) {
            validRequest = {"text": "text2", "styleId": -1, "typeId": 1, "statusId": 1, "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "styleId should be greater or equal to 0", done);
        });

        it("The styleId does not exist in database.", function (done) {
            validRequest = {"text": "text2", "styleId": 111, "typeId": 1, "statusId": 1, "keyword": "keyword1"};
            assertPostError("/v2/data/srm/rounds/306/question", 'heffan', validRequest, 400, "The styleId does not exist in database.", done);
        });
    });

    describe('Delete Round Question API invalid test', function () {

        it("No anonymous access.", function (done) {
            assertDeleteError("/v2/data/srm/rounds/306/question", null, 401, "Authorized information needed.", done);
        });

        it("Admin or web Arena super user only.", function (done) {
            assertDeleteError("/v2/data/srm/rounds/306/question", 'user', 403, "Admin or web Arena super user only.", done);
        });

        it("questionId should be number.", function (done) {
            assertDeleteError("/v2/data/srm/rounds/aaa/question", 'heffan', 400, "questionId should be number.", done);
        });

        it("questionId should be number  (with web Arena super user).", function (done) {
            assertDeleteError("/v2/data/srm/rounds/aaa/question", 'ksmith', 400, "questionId should be number.", done);
        });

        it("questionId should be Integer.", function (done) {
            assertDeleteError("/v2/data/srm/rounds/30.6/question", 'heffan', 400, "questionId should be Integer.", done);
        });

        it("questionId should be positive.", function (done) {
            assertDeleteError("/v2/data/srm/rounds/-306/question", 'heffan', 400, "questionId should be positive.", done);
        });

        it("questionId should be less or equal to 2147483647.", function (done) {
            assertDeleteError("/v2/data/srm/rounds/111111111111111111111111111/question", 'heffan', 400,
              "questionId should be less or equal to 2147483647.", done);
        });
    });

    describe('Valid test', function () {

        it("Valid set survey.", function (done) {
            var validRequest = {"name": "name1", "statusId": 0, "startDate": "2014-01-01 11:22", "length": 100, "surveyText": "aaa"};

            createPostRequest("/v2/data/srm/rounds/13673/survey", 'heffan').expect(200).send(validRequest).end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(res.body.success, true, "Invalid response detail");
                var sql = "* from survey where survey_id = 13673";
                testHelper.runSqlSelectQuery(sql, "informixoltp", function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    assert.equal(result.length, 1, "Exactly one row must be returned");
                    var expected = {
                        survey_id: 13673,
                        name: "name1",
                        status_id: 0,
                        text: "aaa"
                    }, actual = _.omit(result[0], ['results_viewable', 'start_date', 'end_date']);
                    assert.deepEqual(actual, expected, 'Actual and Expected survey did not match.');
                    assert.equal(result[0].start_date.slice(0, result[0].start_date.length - 5), "2014-01-01T11:22:00.000", "Invalid response detail");
                    assert.equal(result[0].end_date.slice(0, result[0].end_date.length - 5), "2014-01-01T13:02:00.000", "Invalid response detail");
                });
                done();
            });
        });


        it("Valid test for add question and list question.", function (done) {
            var validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": 1, "keyword": "keyword1", "isRequired": true};

            async.waterfall([
                function (cb) {
                    createPostRequest("/v2/data/srm/rounds/13673/questions", 'heffan').expect(200).send(validRequest).end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        assert.equal(res.body.success, true, "Invalid response detail");
                        cb();
                    });
                }, function (cb) {
                    createRequest("/v2/data/srm/rounds/13673/questions", 'heffan').expect(200).end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }

                        assert.equal(res.body.questions[0].keyword, "keyword1", "Invalid response detail");
                        assert.equal(res.body.questions[0].status.id, 1, "Invalid response detail");
                        assert.equal(res.body.questions[0].style.id, 1, "Invalid response detail");
                        assert.equal(res.body.questions[0].text, "text2", "Invalid response detail");
                        assert.equal(res.body.questions[0].type.id, 1, "Invalid response detail");
                        assert.equal(res.body.questions[0].isRequired, true, "Invalid response detail");

                        cb();
                    });
                }
            ], done);
        });

        it("Valid test for modify question and list question.", function (done) {
            var validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": 1, "keyword": "keyword1", "isRequired": true};

            async.waterfall([
                function (cb) {
                    createPostRequest("/v2/data/srm/rounds/13673/questions", 'heffan').expect(200).send(validRequest).end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        assert.equal(res.body.success, true, "Invalid response detail");
                        cb();
                    });
                }, function (cb) {
                    var sql = "question_id from survey_question where survey_id = 13673";
                    testHelper.runSqlSelectQuery(sql, "informixoltp", function (err, result) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        cb(null, result[0].question_id);
                    });
                }, function (questionId, cb) {
                    validRequest = {"text": "text1", "styleId": 2, "typeId": 2, "statusId": 0, "keyword": "keyword2"};
                    createPostRequest("/v2/data/srm/rounds/" + questionId + "/question",
                        'heffan').expect(200).send(validRequest).end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        assert.equal(res.body.success, true, "Invalid response detail");
                        cb();
                    });
                }, function (cb) {
                    createRequest("/v2/data/srm/rounds/13673/questions", 'heffan').expect(200).end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }

                        assert.equal(res.body.questions[0].keyword, "keyword2", "Invalid response detail");
                        assert.equal(res.body.questions[0].status.id, 0, "Invalid response detail");
                        assert.equal(res.body.questions[0].style.id, 2, "Invalid response detail");
                        assert.equal(res.body.questions[0].text, "text1", "Invalid response detail");
                        assert.equal(res.body.questions[0].type.id, 2, "Invalid response detail");
                        assert.equal(res.body.questions[0].isRequired, true, "Invalid response detail");

                        cb();
                    });
                }
            ], done);
        });

        it("Valid test for delete question.", function (done) {

            var validRequest = {"contest_id": 123, "text": "text2", "styleId": 1, "typeId": 1, "statusId": 1, "keyword": "keyword1", "isRequired": true};

            async.waterfall([
                function (cb) {
                    var req = request(API_ENDPOINT)
                      .post("/v2/data/srm/rounds/13673/questions")
                      .set("Accept", "application/json")
                      .expect("Content-Type", /json/);
                    req.set('Authorization', generateAuthHeader('heffan'));
                    req.expect(200).send(validRequest).end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        assert.equal(res.body.success, true, "Invalid response detail");
                        cb();
                    });
                }, function (cb) {
                    var sql = "question_id from survey_question where survey_id = 13673";
                    testHelper.runSqlSelectQuery(sql, "informixoltp", function (err, result) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        assert.ok(result.length >= 1);
                        cb(null, result[0].question_id);
                    });
                }, function (questionId, cb) {
                    createDeleteRequest("/v2/data/srm/rounds/" + questionId + "/question", 'heffan').expect(200).end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        assert.equal(res.body.success, true, "Invalid response detail");
                        cb(null, questionId);
                    });
                }, function (questionId, cb) {
                    var sqlQueries = [
                        "question_id from survey_question where question_id = " + questionId,
                        "question_id from round_question where question_id = " + questionId,
                        "question_id from answer where question_id = " + questionId,
                        "question_id from question where question_id = " + questionId
                    ];
                    async.forEach(sqlQueries, function (sqlQuery, callback) {
                        testHelper.runSqlSelectQuery(sqlQuery, "informixoltp", function (err, result) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            assert(!result || (Array.isArray(result) && !result.length), "Found question that was supposed to be deleted");
                            callback();
                        });
                    }, cb);
                }
            ], done);
        });

        it("Valid test for add question answer and list question answer.", function (done) {
            var validRequest = {"text": "text2", "styleId": 1, "typeId": 1, "statusId": 1, "keyword": "keyword1", "isRequired": true},
                questionId;

            async.waterfall([
                function (cb) {
                    createPostRequest("/v2/data/srm/rounds/13673/questions", 'heffan').expect(200).send(validRequest).end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        assert.equal(res.body.success, true, "Invalid response detail");
                        cb();
                    });
                }, function (cb) {
                    var sql = "question_id from survey_question where survey_id = 13673";
                    testHelper.runSqlSelectQuery(sql, "informixoltp", function (err, result) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        cb(null, result[0].question_id);
                    });
                }, function (id, cb) {
                    questionId = id;
                    validRequest = {"text": "text2", "sortOrder": 1, "correct": true};
                    createPostRequest("/v2/data/srm/questions/" + questionId + "/answers",
                        'heffan').expect(200).send(validRequest).end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        assert.equal(res.body.success, true, "Invalid response detail");
                        cb();
                    });
                }, function (cb) {
                    createRequest("/v2/data/srm/rounds/" + questionId + "/answers", 'heffan').expect(200).end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }

                        assert.equal(res.body.answers[0].text, "text2", "Invalid response detail");
                        assert.equal(res.body.answers[0].sortOrder, 1, "Invalid response detail");
                        assert.equal(res.body.answers[0].correct, true, "Invalid response detail");
                        cb();
                    });
                }
            ], done);
        });
    });
});
