/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 *
 * The test cases for rounds.js.
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true, plusplus: true */

/**
 * Module dependencies.
 */
var request = require('supertest'),
    chai = require('chai'),
    jwt = require('jsonwebtoken');

var assert = chai.assert;
var testHelper = require('./helpers/testHelper');
var async = require("async");

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080',
    SQL_DIR = __dirname + "/sqls/rounds/",
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
 * Create request and return it
 * @param {String} queryString - the query string
 * @param {String} user - the user handle
 * @return {Object} request instance
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
 * Validate the result.
 * @param {String} queryString - the query string
 * @param {String} user - the user handle
 * @param {String} expectFile - the file name
 * @param {Function} done the callback function
 */
function validateResult(queryString, user, expectFile, done) {
    createRequest(queryString, user).expect(200).end(function (err, res) {
        if (err) {
            done(err);
            return;
        }
        var tmp = [], i, expected;

        for (i = 0; i < res.body.data.length; i++) {
            // only check the test data
            if (res.body.data[i].id > 13000 || res.body.data[i].id < 12000) {
                res.body.total = res.body.total - 1;
            } else {
                tmp.push(res.body.data[i]);
            }
        }
        res.body.data = tmp;
        expected = require(expectFile);
        delete res.body.serverInformation;
        delete res.body.requesterInformation;
        assert.deepEqual(res.body, expected, "Invalid response");
        done();
    });
}

// Test the get rounds api.
describe('Get rounds api', function () {
    this.timeout(120000); // Wait 2 minutes, remote db might be slow.

    /**
     * Clear database
     * @param {Function} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "informixoltp__clean", "informixoltp", done);
    }

    /**
     * This function is run before all tests.
     *
     * @param {Function} done the callback
     */
    before(function (done) {
        async.waterfall([
            clearDb,
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_test_data", "informixoltp", cb);
            }, function (cb) {
                testHelper.updateTextColumn("INSERT INTO round_terms(round_id, terms_content) VALUES (?, ?)", "informixoltp",
                    [{type: 'int', value : 12001}, {type: 'text', value : 'term1'}], cb);
            }, function (res, cb) {
                testHelper.updateTextColumn("INSERT INTO round_terms(round_id, terms_content) VALUES (?, ?)", "informixoltp",
                    [{type: 'int', value : 12001}, {type: 'text', value : 'term2'}], cb);
            }
        ], done);
    });

    /**
     * This function is run after all tests.
     * Clean up all data.
     * @param {Function} done the callback
     */
    after(function (done) {
        clearDb(done);
    });

    // Invalid test
    describe('Get rounds api invalid test', function () {

        it("No anonymous access.", function (done) {
            assertError("/v2/data/rounds", null, 401, "Authorized information needed.", done);
        });

        it("Admin access only.", function (done) {
            assertError("/v2/data/rounds", 'user', 403, "Admin access only.", done);
        });

        // only pageIndex
        it("pageSize should not be null or undefined if pageIndex is provided.", function (done) {
            assertError("/v2/data/rounds?pageIndex=1", 'heffan', 400, "pageSize should not be null or undefined if pageIndex is provided.", done);
        });

        // pageIndex max number
        it("pageIndex should be less or equal to 2147483647.", function (done) {
            assertError("/v2/data/rounds?pageIndex=1234567890123456&pageSize=10", 'heffan', 400,
                "pageIndex should be less or equal to 2147483647.", done);
        });

        // pageSize max number
        it("pageSize should be less or equal to 2147483647.", function (done) {
            assertError("/v2/data/rounds?pageSize=1234567890123456&pageIndex=1", 'heffan', 400,
                "pageSize should be less or equal to 2147483647.", done);
        });

        // pageIndex < 0
        it("pageIndex should be equal to -1 or greater than 0.", function (done) {
            assertError("/v2/data/rounds?pageIndex=-12&pageSize=10", 'heffan', 400,
                "pageIndex should be equal to -1 or greater than 0", done);
        });

        // pageSize <= 0
        it("pageSize should be positive.", function (done) {
            assertError("/v2/data/rounds?pageSize=-12", 'heffan', 400,
                "pageSize should be positive.", done);
        });

        // sortOrder
        it("sortOrder should be an element of asc,desc.", function (done) {
            assertError("/v2/data/rounds?sortOrder=dd", 'heffan', 400,
                "sortOrder should be an element of asc,desc.", done);
        });

        // sortColumn
        it("sortColumn should be an element of name,registrationphasestarttime,registrationphaseendtime," +
                "codingphasestarttime,codingphaseendtime,intermissionphasestarttime,intermissionphaseendtime," +
                "challengephasestarttime,challengephaseendtime,systemtestphasestarttime,systemtestphaseendtime," +
                "roomassignmentphasestarttime,roomassignmentphaseendtime,moderatedchatphasestarttime,moderatedchatphaseendtime.", function (done) {
                assertError("/v2/data/rounds?sortColumn=dd", 'heffan', 400,
                    "sortColumn should be an element of name,registrationphasestarttime,registrationphaseendtime," +
                        "codingphasestarttime,codingphaseendtime,intermissionphasestarttime,intermissionphaseendtime," +
                        "challengephasestarttime,challengephaseendtime,systemtestphasestarttime,systemtestphaseendtime," +
                        "roomassignmentphasestarttime,roomassignmentphaseendtime,moderatedchatphasestarttime,moderatedchatphaseendtime.", done);
            });

        // invalid status
        it("status should be an element of active,past,draft.", function (done) {
            assertError("/v2/data/rounds?status=dd", 'heffan', 400,
                "status should be an element of active,past,draft.", done);
        });

        // invalid type
        it("The dd is not a valid round_type_lu value.", function (done) {
            assertError("/v2/data/rounds?type=dd", 'heffan', 400,
                "The dd is not a valid round_type_lu value.", done);
        });

        // invalid time
        it("registrationPhaseStartTimeFrom is not a valid date.", function (done) {
            assertError("/v2/data/rounds?registrationPhaseStartTimeFrom=dd", 'heffan', 400,
                "registrationPhaseStartTimeFrom is not a valid date.", done);
        });

        it("registrationPhaseStartTimeFrom should not be later than registrationPhaseStartTimeTo.", function (done) {
            assertError("/v2/data/rounds?registrationPhaseStartTimeFrom=2011-01-01%2000:00:00&registrationPhaseStartTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "registrationPhaseStartTimeFrom should not be later than registrationPhaseStartTimeTo.", done);
        });

        it("registrationPhaseEndTimeFrom should not be later than registrationPhaseEndTimeTo.", function (done) {
            assertError("/v2/data/rounds?registrationPhaseEndTimeFrom=2011-01-01%2000:00:00&registrationPhaseEndTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "registrationPhaseEndTimeFrom should not be later than registrationPhaseEndTimeTo.", done);
        });

        it("codingPhaseStartTimeFrom should not be later than codingPhaseStartTimeTo.", function (done) {
            assertError("/v2/data/rounds?codingPhaseStartTimeFrom=2011-01-01%2000:00:00&codingPhaseStartTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "codingPhaseStartTimeFrom should not be later than codingPhaseStartTimeTo.", done);
        });

        it("codingPhaseEndTimeFrom should not be later than codingPhaseEndTimeTo.", function (done) {
            assertError("/v2/data/rounds?codingPhaseEndTimeFrom=2011-01-01%2000:00:00&codingPhaseEndTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "codingPhaseEndTimeFrom should not be later than codingPhaseEndTimeTo.", done);
        });

        it("intermissionPhaseStartTimeFrom should not be later than intermissionPhaseStartTimeTo.", function (done) {
            assertError("/v2/data/rounds?intermissionPhaseStartTimeFrom=2011-01-01%2000:00:00&intermissionPhaseStartTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "intermissionPhaseStartTimeFrom should not be later than intermissionPhaseStartTimeTo.", done);
        });

        it("intermissionPhaseEndTimeFrom should not be later than intermissionPhaseEndTimeTo.", function (done) {
            assertError("/v2/data/rounds?intermissionPhaseEndTimeFrom=2011-01-01%2000:00:00&intermissionPhaseEndTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "intermissionPhaseEndTimeFrom should not be later than intermissionPhaseEndTimeTo.", done);
        });

        it("challengePhaseStartTimeFrom should not be later than challengePhaseStartTimeTo.", function (done) {
            assertError("/v2/data/rounds?challengePhaseStartTimeFrom=2011-01-01%2000:00:00&challengePhaseStartTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "challengePhaseStartTimeFrom should not be later than challengePhaseStartTimeTo.", done);
        });

        it("challengePhaseEndTimeFrom should not be later than challengePhaseEndTimeTo.", function (done) {
            assertError("/v2/data/rounds?challengePhaseEndTimeFrom=2011-01-01%2000:00:00&challengePhaseEndTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "challengePhaseEndTimeFrom should not be later than challengePhaseEndTimeTo.", done);
        });

        it("systemTestPhaseStartTimeFrom should not be later than systemTestPhaseStartTimeTo.", function (done) {
            assertError("/v2/data/rounds?systemTestPhaseStartTimeFrom=2011-01-01%2000:00:00&systemTestPhaseStartTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "systemTestPhaseStartTimeFrom should not be later than systemTestPhaseStartTimeTo.", done);
        });

        it("systemTestPhaseEndTimeFrom should not be later than systemTestPhaseEndTimeTo.", function (done) {
            assertError("/v2/data/rounds?systemTestPhaseEndTimeFrom=2011-01-01%2000:00:00&systemTestPhaseEndTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "systemTestPhaseEndTimeFrom should not be later than systemTestPhaseEndTimeTo.", done);
        });

        it("roomAssignmentPhaseStartTimeFrom should not be later than roomAssignmentPhaseStartTimeTo.", function (done) {
            assertError("/v2/data/rounds?roomAssignmentPhaseStartTimeFrom=2011-01-01%2000:00:00&roomAssignmentPhaseStartTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "roomAssignmentPhaseStartTimeFrom should not be later than roomAssignmentPhaseStartTimeTo.", done);
        });

        it("roomAssignmentPhaseEndTimeFrom should not be later than roomAssignmentPhaseEndTimeTo.", function (done) {
            assertError("/v2/data/rounds?roomAssignmentPhaseEndTimeFrom=2011-01-01%2000:00:00&roomAssignmentPhaseEndTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "roomAssignmentPhaseEndTimeFrom should not be later than roomAssignmentPhaseEndTimeTo.", done);
        });

        it("moderatedChatPhaseStartTimeFrom should not be later than moderatedChatPhaseStartTimeTo.", function (done) {
            assertError("/v2/data/rounds?moderatedChatPhaseStartTimeFrom=2011-01-01%2000:00:00&moderatedChatPhaseStartTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "moderatedChatPhaseStartTimeFrom should not be later than moderatedChatPhaseStartTimeTo.", done);
        });

        it("moderatedChatPhaseEndTimeFrom should not be later than moderatedChatPhaseEndTimeTo.", function (done) {
            assertError("/v2/data/rounds?moderatedChatPhaseEndTimeFrom=2011-01-01%2000:00:00&moderatedChatPhaseEndTimeTo=2010-01-01%2000:00:00", 'heffan', 400,
                "moderatedChatPhaseEndTimeFrom should not be later than moderatedChatPhaseEndTimeTo.", done);
        });

    });


    // valid test
    describe('Valid test', function () {

        // default parameter
        it("test with default parameters", function (done) {
            validateResult("/v2/data/rounds", 'heffan',
                "./test_files/rounds/expected_default_parameters.json", done);
        });

        // sort
        it("test with sort parameters", function (done) {
            validateResult("/v2/data/rounds?sortColumn=codingPhaseStartTime&sortOrder=desc", 'heffan',
                "./test_files/rounds/expected_sort_parameters.json", done);
        });

        // pagination
        it("test with pagination parameters", function (done) {
            validateResult("/v2/data/rounds?pageSize=2&pageIndex=2", 'heffan',
                "./test_files/rounds/expected_pagination_parameters.json", done);
        });

        // time filter
        it("test with time filter parameters", function (done) {
            validateResult("/v2/data/rounds?registrationPhaseStartTimeFrom=2011-11-01%2000:00:00&registrationPhaseStartTimeTo=2012-01-01%2000:00:00", 'heffan',
                "./test_files/rounds/expected_time_parameters.json", done);
        });

        // name filter
        it("test with name filter parameters", function (done) {
            validateResult("/v2/data/rounds?name=test%20round", 'heffan',
                "./test_files/rounds/expected_name_parameters.json", done);
        });

        // status filter
        it("test with status filter parameters", function (done) {
            validateResult("/v2/data/rounds?status=active,draft", 'heffan',
                "./test_files/rounds/expected_status_parameters.json", done);
        });

        // type filter
        it("test with type filter parameters", function (done) {
            validateResult("/v2/data/rounds?type=Single%20Round%20Match", 'heffan',
                "./test_files/rounds/expected_type_parameters.json", done);
        });

        // full parameters
        it("test with full parameters", function (done) {
            validateResult("/v2/data/rounds?sortColumn=codingPhaseStartTime&sortOrder=desc&pageSize=2&pageIndex=1" +
                "&name=test%20round&status=active,draft&type=Single%20Round%20Match&registrationPhaseStartTimeFrom=2013-11-01%2000:00:00" +
                "&registrationPhaseStartTimeTo=2014-01-01%2000:00:00", 'heffan',
                "./test_files/rounds/expected_full_parameters.json", done);
        });
    });
});