/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Changes in 1.1
 * Remove the schedule related tests.
 *
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");
var _ = require('underscore');
var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/srmChallenges/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * Get round seq
 */
var GET_CONTEST_SEQ_SQL = "SEQUENCE_CONTEST_SEQ.NEXTVAL as next_id from table(set{1})";
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

describe('Get SRM Challenges API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow


    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clear", "topcoder_dw", done);
    }


    /**
     * This function is run after each test case.
     * Clean up all data.
     * @param {Function<err>} done the callback
     */
    after(function (done) {
        clearDb(done);
    });

    describe("Search Challenges", function () {

        /**
         * This function is run before all tests.
         * Generate tests data.
         * @param {Function<err>} done the callback
         */
        before(function (done) {
            async.waterfall([
                function (cb) {
                    clearDb(cb);
                }, function (cb) {
                    testHelper.runSqlFile(SQL_DIR + "topcoder_dw__insert_challenges", "topcoder_dw", cb);
                }
            ], done);
        });

        /**
         * Create request to search challenges API and assert 400 http code
         * @param {String} queryString - the query string
         * @param {Function} done - the callback function
         */
        function assert400(queryString, done) {
            request(API_ENDPOINT)
                .get('/v2/data/srm/challenges?' + queryString)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)
                .end(done);
        }

        /**
         * Helper method for validating result for current test data
         * @param {String} queryString - the query string
         * @param {Array} challenges - the array of expected challenges. e.g [1, 2]
         * @param {Number} total - the expected total count
         * @param {Number} pageIndex - the expected pageIndex
         * @param {Number} pageSize - the expected pageSize
         * @param {Function} done - the callback function
         */
        function validateResult(queryString, challenges, total, pageIndex, pageSize, done) {
            request(API_ENDPOINT)
                .get('/v2/data/srm/challenges?' + queryString.replace(/^\?/, ""))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var results = res.body.data, i, item,
                        expectedData = require("./test_files/srmChallengesData.json"), expected;
                    assert.lengthOf(results, challenges.length, "invalid data.length");
                    assert.equal(res.body.total, total, "invalid total");
                    assert.equal(res.body.pageIndex, pageIndex, "invalid pageIndex");
                    assert.equal(res.body.pageSize, pageSize, "invalid pageSize");
                    for (i = 0; i < results.length; i = i + 1) {
                        item = results[i];
                        expected = expectedData[challenges[i]];
                        assert.deepEqual(item, expected, "Invalid challenge number:  " + i);
                    }
                    done();
                });
        }

        /**
         * /v2/data/srm/challenges
         */
        it("should return results", function (done) {
            validateResult("", [3, 2, 1], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=roundId
         */
        it("should return results for ?sortColumn=roundId", function (done) {
            validateResult("?sortColumn=roundId", [3, 2, 1], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortOrder=desc
         */
        it("should return results for ?sortOrder=desc", function (done) {
            validateResult("?sortOrder=desc", [3, 2, 1], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortOrder=asc
         */
        it("should return results for ?sortOrder=asc", function (done) {
            validateResult("?sortOrder=asc", [1, 2, 3], 3, 1, 50, done);
        });

        // --roundId

        /**
         * /v2/data/srm/challenges?sortColumn=roundId&sortOrder=asc
         */
        it("should return results for ?sortColumn=roundId&sortOrder=asc", function (done) {
            validateResult("?sortColumn=roundId&sortOrder=asc", [1, 2, 3], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=roundId&sortOrder=desc
         */
        it("should return results for ?sortColumn=roundId&sortOrder=desc", function (done) {
            validateResult("?sortColumn=roundId&sortOrder=desc", [3, 2, 1], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=RoUndId&sortOrder=dEsC
         */
        it("should return results for ?sortColumn=RoUndId&sortOrder=dEsC", function (done) {
            validateResult("?sortColumn=RoUndId&sortOrder=dEsC", [3, 2, 1], 3, 1, 50, done);
        });

        // --name

        /**
         * /v2/data/srm/challenges?sortColumn=name&sortOrder=asc
         */
        it("should return results for ?sortColumn=name&sortOrder=asc", function (done) {
            validateResult("?sortColumn=name&sortOrder=asc", [1, 2, 3], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=roundId&sortOrder=desc
         */
        it("should return results for ?sortColumn=name&sortOrder=desc", function (done) {
            validateResult("?sortColumn=name&sortOrder=desc", [3, 2, 1], 3, 1, 50, done);
        });

        // --startDate

        /**
         * /v2/data/srm/challenges?sortColumn=startDate&sortOrder=asc
         */
        it("should return results for ?sortColumn=startDate&sortOrder=asc", function (done) {
            validateResult("?sortColumn=startDate&sortOrder=asc", [1, 2, 3], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=startDate&sortOrder=desc
         */
        it("should return results for ?sortColumn=startDate&sortOrder=desc", function (done) {
            validateResult("?sortColumn=startDate&sortOrder=desc", [3, 2, 1], 3, 1, 50, done);
        });

        // --totalCompetitors

        /**
         * /v2/data/srm/challenges?sortColumn=totalCompetitors&sortOrder=asc
         */
        it("should return results for ?sortColumn=totalCompetitors&sortOrder=asc", function (done) {
            validateResult("?sortColumn=totalCompetitors&sortOrder=asc", [1, 2, 3], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=totalCompetitors&sortOrder=desc
         */
        it("should return results for ?sortColumn=totalCompetitors&sortOrder=desc", function (done) {
            validateResult("?sortColumn=totalCompetitors&sortOrder=desc", [3, 2, 1], 3, 1, 50, done);
        });

        // --divICompetitors

        /**
         * /v2/data/srm/challenges?sortColumn=divICompetitors&sortOrder=asc
         */
        it("should return results for ?sortColumn=divICompetitors&sortOrder=asc", function (done) {
            validateResult("?sortColumn=divICompetitors&sortOrder=asc", [1, 2, 3], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=divICompetitors&sortOrder=desc
         */
        it("should return results for ?sortColumn=divICompetitors&sortOrder=desc", function (done) {
            validateResult("?sortColumn=divICompetitors&sortOrder=desc", [3, 2, 1], 3, 1, 50, done);
        });


        // --divIICompetitors

        /**
         * /v2/data/srm/challenges?sortColumn=divIICompetitors&sortOrder=asc
         */
        it("should return results for ?sortColumn=divIICompetitors&sortOrder=asc", function (done) {
            validateResult("?sortColumn=divIICompetitors&sortOrder=asc", [3, 1, 2], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=divIICompetitors&sortOrder=desc
         */
        it("should return results for ?sortColumn=divIICompetitors&sortOrder=desc", function (done) {
            validateResult("?sortColumn=divIICompetitors&sortOrder=desc", [2, 1, 3], 3, 1, 50, done);
        });


        // --divITotalSolutionsSubmitted

        /**
         * /v2/data/srm/challenges?sortColumn=divITotalSolutionsSubmitted&sortOrder=asc
         */
        it("should return results for ?sortColumn=divITotalSolutionsSubmitted&sortOrder=asc", function (done) {
            validateResult("?sortColumn=divITotalSolutionsSubmitted&sortOrder=asc", [3, 2, 1], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=divITotalSolutionsSubmitted&sortOrder=desc
         */
        it("should return results for ?sortColumn=divITotalSolutionsSubmitted&sortOrder=desc", function (done) {
            validateResult("?sortColumn=divITotalSolutionsSubmitted&sortOrder=desc", [3, 2, 1], 3, 1, 50, done);
        });


        // --divIAverageSolutionsSubmitted

        /**
         * /v2/data/srm/challenges?sortColumn=divIAverageSolutionsSubmitted&sortOrder=asc
         */
        it("should return results for ?sortColumn=divIAverageSolutionsSubmitted&sortOrder=asc", function (done) {
            validateResult("?sortColumn=divIAverageSolutionsSubmitted&sortOrder=asc", [3, 2, 1], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=divIAverageSolutionsSubmitted&sortOrder=desc
         */
        it("should return results for ?sortColumn=divIAverageSolutionsSubmitted&sortOrder=desc", function (done) {
            validateResult("?sortColumn=divIAverageSolutionsSubmitted&sortOrder=desc", [1, 2, 3], 3, 1, 50, done);
        });


        // --divIITotalSolutionsSubmitted

        /**
         * /v2/data/srm/challenges?sortColumn=divIITotalSolutionsSubmitted&sortOrder=asc
         */
        it("should return results for ?sortColumn=divIITotalSolutionsSubmitted&sortOrder=asc", function (done) {
            validateResult("?sortColumn=divIITotalSolutionsSubmitted&sortOrder=asc", [3, 2, 1], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=divIITotalSolutionsSubmitted&sortOrder=desc
         */
        it("should return results for ?sortColumn=divIITotalSolutionsSubmitted&sortOrder=desc", function (done) {
            validateResult("?sortColumn=divIITotalSolutionsSubmitted&sortOrder=desc", [2, 1, 3], 3, 1, 50, done);
        });


        // --divIIAverageSolutionsSubmitted

        /**
         * /v2/data/srm/challenges?sortColumn=divIIAverageSolutionsSubmitted&sortOrder=asc
         */
        it("should return results for ?sortColumn=divIIAverageSolutionsSubmitted&sortOrder=asc", function (done) {
            validateResult("?sortColumn=divIIAverageSolutionsSubmitted&sortOrder=asc", [3, 2, 1], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=divIIAverageSolutionsSubmitted&sortOrder=desc
         */
        it("should return results for ?sortColumn=divIIAverageSolutionsSubmitted&sortOrder=desc", function (done) {
            validateResult("?sortColumn=divIIAverageSolutionsSubmitted&sortOrder=desc", [1, 2, 3], 3, 1, 50, done);
        });


        // --divITotalSolutionsChallenged

        /**
         * /v2/data/srm/challenges?sortColumn=divITotalSolutionsChallenged&sortOrder=asc
         */
        it("should return results for ?sortColumn=divITotalSolutionsChallenged&sortOrder=asc", function (done) {
            validateResult("?sortColumn=divITotalSolutionsChallenged&sortOrder=asc", [3, 2, 1], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=divITotalSolutionsChallenged&sortOrder=desc
         */
        it("should return results for ?sortColumn=divITotalSolutionsChallenged&sortOrder=desc", function (done) {
            validateResult("?sortColumn=divITotalSolutionsChallenged&sortOrder=desc", [3, 2, 1], 3, 1, 50, done);
        });


        // --divIAverageSolutionsChallenged

        /**
         * /v2/data/srm/challenges?sortColumn=divIAverageSolutionsChallenged&sortOrder=asc
         */
        it("should return results for ?sortColumn=divIAverageSolutionsChallenged&sortOrder=asc", function (done) {
            validateResult("?sortColumn=divIAverageSolutionsChallenged&sortOrder=asc", [3, 2, 1], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=divIAverageSolutionsChallenged&sortOrder=desc
         */
        it("should return results for ?sortColumn=divIAverageSolutionsChallenged&sortOrder=desc", function (done) {
            validateResult("?sortColumn=divIAverageSolutionsChallenged&sortOrder=desc", [1, 2, 3], 3, 1, 50, done);
        });


        // --divIITotalSolutionsChallenged

        /**
         * /v2/data/srm/challenges?sortColumn=divIITotalSolutionsChallenged&sortOrder=asc
         */
        it("should return results for ?sortColumn=divIITotalSolutionsChallenged&sortOrder=asc", function (done) {
            validateResult("?sortColumn=divIITotalSolutionsChallenged&sortOrder=asc", [3, 2, 1], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=divIITotalSolutionsChallenged&sortOrder=desc
         */
        it("should return results for ?sortColumn=divIITotalSolutionsChallenged&sortOrder=desc", function (done) {
            validateResult("?sortColumn=divIITotalSolutionsChallenged&sortOrder=desc", [3, 2, 1], 3, 1, 50, done);
        });


        // --divIIAverageSolutionsChallenged

        /**
         * /v2/data/srm/challenges?sortColumn=divIIAverageSolutionsChallenged&sortOrder=asc
         */
        it("should return results for ?sortColumn=divIIAverageSolutionsChallenged&sortOrder=asc", function (done) {
            validateResult("?sortColumn=divIIAverageSolutionsChallenged&sortOrder=asc", [2, 1, 3], 3, 1, 50, done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=divIIAverageSolutionsChallenged&sortOrder=desc
         */
        it("should return results for ?sortColumn=divIIAverageSolutionsChallenged&sortOrder=desc", function (done) {
            validateResult("?sortColumn=divIIAverageSolutionsChallenged&sortOrder=desc", [3, 1, 2], 3, 1, 50, done);
        });


        /**
         * /v2/data/srm/challenges?pageIndex=1&pageSize=1
         */
        it("should return results for ?pageIndex=1&pageSize=1", function (done) {
            validateResult("pageIndex=1&pageSize=1", [3], 3, 1, 1, done);
        });

        /**
         * /v2/data/srm/challenges?pageIndex=2&pageSize=1
         */
        it("should return results for ?pageIndex=2&pageSize=1", function (done) {
            validateResult("pageIndex=2&pageSize=1", [2], 3, 2, 1, done);
        });

        /**
         * /v2/data/srm/challenges?pageIndex=-1
         */
        it("should return results for ?pageIndex=-1", function (done) {
            validateResult("pageIndex=-1", [3, 2, 1], 3, 1, 3, done);
        });

        /**
         * /v2/data/srm/challenges?pageSize=xyz
         */
        it("should return error 400 when pageSize is not number", function (done) {
            assert400("pageSize=xyz", done);
        });

        /**
         * /v2/data/srm/challenges?pageSize=0
         */
        it("should return error 400 when pageSize is 0", function (done) {
            assert400("pageSize=0", done);
        });

        /**
         * /v2/data/srm/challenges?pageSize=-1
         */
        it("should return error 400 when pageSize is -1", function (done) {
            assert400("pageSize=-1", done);
        });

        /**
         * /v2/data/srm/challenges?pageSize=100000000000000000000
         */
        it("should return error 400 when pageSize is too big number", function (done) {
            assert400("pageSize=100000000000000000000", done);
        });

        /**
         * /v2/data/srm/challenges?pageSize=1.123
         */
        it("should return error 400 when pageSize is float number", function (done) {
            assert400("pageSize=1.123", done);
        });

        /**
         * /v2/data/srm/challenges?pageIndex=xyz
         */
        it("should return error 400 when pageIndex is not number", function (done) {
            assert400("pageIndex=xyz", done);
        });

        /**
         * /v2/data/srm/challenges?pageIndex=0
         */
        it("should return error 400 when pageIndex is 0", function (done) {
            assert400("pageIndex=0", done);
        });

        /**
         * /v2/data/srm/challenges?pageIndex=-2
         */
        it("should return error 400 when pageIndex is -2", function (done) {
            assert400("pageIndex=-2", done);
        });

        /**
         * /v2/data/srm/challenges?pageIndex=100000000000000000000
         */
        it("should return error 400 when pageIndex is too big number", function (done) {
            assert400("pageIndex=100000000000000000000", done);
        });

        /**
         * /v2/data/srm/challenges?pageIndex=1.123
         */
        it("should return error 400 when pageIndex is float number", function (done) {
            assert400("pageIndex=1.123", done);
        });

        /**
         * /v2/data/srm/challenges?pageIndex=1
         */
        it("should return error 400 when pageIndex is set and pageSize is missing", function (done) {
            assert400("pageIndex=1", done);
        });

        /**
         * /v2/data/srm/challenges?sortColumn=xyz
         */
        it("should return error 400 when sortColumn is invalid", function (done) {
            assert400("sortColumn=xyz", done);
        });

        /**
         * /v2/data/srm/challenges?sortOrder=xyz
         */
        it("should return error 400 when sortOrder is invalid", function (done) {
            assert400("sortOrder=xyz", done);
        });

        /**
         * /v2/data/srm/challenges?sortOrder=xyz
         */
        it("should return error 400 when sortColumn=timeLeft and listType=PAST", function (done) {
            assert400("sortColumn=timeLeft&listType=PAST", done);
        });

        /**
         * /v2/data/srm/challenges?pageIndex=100&pageSize=100
         */
        it("should return empty result when no results returned", function (done) {
            request(API_ENDPOINT)
                .get('/v2/data/srm/challenges?pageIndex=100&pageSize=100')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(done);
        });

    });


    describe("Get Challenges Details", function () {

        /**
         * This function is run before all tests.
         * Generate tests data.
         * @param {Function<err>} done the callback
         */
        before(function (done) {
            async.waterfall([
                function (cb) {
                    clearDb(cb);
                }, function (cb) {
                    testHelper.runSqlFile(SQL_DIR + "topcoder_dw__insert_detail", "topcoder_dw", cb);
                }
            ], done);
        });

        /**
         * Create request to search challenges API and assert 400 http code
         * @param {String} challengeId - the challenge id
         * @param {Function} done - the callback function
         */
        function assert400(challengeId, done) {
            request(API_ENDPOINT)
                .get('/v2/data/srm/challenges/' + challengeId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)
                .end(done);
        }

        /**
         * /v2/data/srm/challenges/10041
         */
        it("should return challenge details", function (done) {
            request(API_ENDPOINT)
                .get('/v2/data/srm/challenges/20000')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    testHelper.assertResponse(err,
                        res,
                        "test_files/expected_get_srm_challenge.json",
                        done);
                });
        });


        /**
         * /v2/data/srm/challenges/xyz
         */
        it("should return 400 error if contestId is not number", function (done) {
            assert400("xyz", done);
        });

        /**
         * /v2/data/srm/challenges/0
         */
        it("should return 400 error if contestId is 0", function (done) {
            assert400("0", done);
        });

        /**
         * /v2/data/srm/challenges/-1
         */
        it("should return 400 error if contestId is -1", function (done) {
            assert400("-1", done);
        });

        /**
         * /v2/data/srm/challenges/1.23
         */
        it("should return 400 error if contestId is 1.23", function (done) {
            assert400("1.23", done);
        });

        /**
         * /v2/data/srm/challenges/10000000000000000
         */
        it("should return 400 error if contestId is too big number", function (done) {
            assert400("10000000000000000", done);
        });
    });


     describe("Get Challenges Schedule", function () {

        /**
         * Clear database
         * @param {Function<err>} done the callback
         */
        function clearDb(done) {
            testHelper.runSqlFile(SQL_DIR + "informixoltp_clear", "informixoltp", done);
        }

        /**
         * This function is run before all tests.
         * Generate tests data.
         * @param {Function<err>} done the callback
         */
        before(function (done) {
            async.waterfall([
                function (cb) {
                    clearDb(cb);
                }, function (cb) {
                    testHelper.runSqlFile(SQL_DIR + "informixoltp_insert_challenges", "informixoltp", cb);
                }
            ], done);
        });

        /**
         * Create request to search challenges API and assert 400 http code
         * @param {String} challengeId - the challenge id
         * @param {Function} done - the callback function
         */
        function assert400(challengeId, done) {
            request(API_ENDPOINT)
                .get('/v2/data/srm/challenges/' + challengeId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)
                .end(done);
        }
    });

    describe("Create New Contest", function () {
        var simpleRequest = {name: "contest1", startDate: "2014-06-01 09:00", endDate: "2014-09-01 09:00",
            adStart: "2014-06-01 09:00", adEnd: "2014-09-01 09:00", adText: "this is ad text", groupId: -1,
            status: "A", adTask: "this is ad task", adCommand: "this is ad command", activateMenu: 0};
        /**
         * Clear database
         * @param {Function<err>} done the callback
         */
        function clearDb(done) {
            testHelper.runSqlFile(SQL_DIR + "informixoltp__clear_contest", "informixoltp", done);
        }

        /**
         * This function is run after each test case.
         * Clean up all data.
         * @param {Function<err>} done the callback
         */
        after(function (done) {
            clearDb(done);
        });
        /**
         * Helper method to do deep clone for request.
         * @param {Object} request request to be cloned
         * @return {Object} cloned request
         */
        function requestClone(request) {
            var result = _.clone(request);
            return result;
        }
        /**
         * Create request to modify round API and assert status code and error message.
         * @param {object} params - params to configure
         * @param {Function} done - the callback function
         */
        function assertFail(params, done) {
            var req = request(API_ENDPOINT)
                .post('/v2/data/srm/contests')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .expect('Content-Type', /json/);
            if (params.auth) {
                req.set('Authorization', 'Bearer ' + params.auth);
            }
            req.expect(params.status)
                .send(params.json)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    } else {
                        assert.equal(res.body.error.details, params.message);
                        done();
                    }
                });
        }

        /**
         * create a http request with auth header and test it.
         * @param {Number} expectStatus - the expected response status code.
         * @param {Object} postData - the data post to api.
         * @param {Function} cb - the call back function.
         */
        function createPostRequest(expectStatus, postData, cb) {
            var req = request(API_ENDPOINT)
                .post('/v2/data/srm/contests')
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer ' + testHelper.getAdminJwt())
                .expect('Content-Type', /json/);
            req.expect(expectStatus)
                .send(postData)
                .end(cb);
        }
        /**
         * Create request to create round API and assert 200 http code
         * @param {object} json - the post data
         * @param {Integer} contest - the expected contest id.
         * @param {Function} done - the callback function
         */
        function assert200(json, contestId, done) {
            createPostRequest(200, json, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(res.body.contestId, contestId);
                done(null, contestId);
            });
        }
        /**
         * Helper method for validating result for current test data
         * @param {int} contestId - the contest id
         * @param {String} expectFile - the filename of expected json.
         * @param {Function} done - the callback function
         */
        function validateResult(contestId, done) {
            request(API_ENDPOINT)
                .get('/v2/data/srm/contests')
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + testHelper.getAdminJwt())
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var results = res.body,
                        result = {},
                        expected = _.clone(simpleRequest);
                    delete results.serverInformation;
                    delete results.requesterInformation;
                    _.each(results, function (item) {
                        if (item.contestId && item.contestId === contestId) {
                            expected.contestId = contestId;
                            result = item;
                        }
                    });

                    assert.deepEqual(result, expected, "unexpected response");
                    done();
                });
        }
        describe('Invalid Request', function () {
            it('should 401 if anonymous', function (done) {
                assertFail({
                    json: simpleRequest,
                    status: 401,
                    message: 'Authorized access only.'
                }, done);
            });

            it('should 403 if member', function (done) {
                assertFail({
                    json: simpleRequest,
                    auth: testHelper.getMemberJwt(),
                    status: 403,
                    message: 'Admin access only.'
                }, done);
            });

            it("should return 400 when name not a string", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.name = 123;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'name should be string.'
                }, done);
            });

            it("should return 400 when name is empty", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.name = "     ";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'name should be non-null and non-empty string.'
                }, done);
            });

            it("should return 400 when name is too long", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.name = getLongText(51);
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'Length of name must not exceed 50 characters.'
                }, done);
            });

            it("should return 400 when name contains special character", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.name = '"';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'name contains unescaped quotes.'
                }, done);
            });

            it("should return 400 when startDate is not a valid date", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.startDate = "abc";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'startDate is not a valid date.'
                }, done);
            });

            it("should return 400 when endDate is not a valid date", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.endDate = "abc";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'endDate is not a valid date.'
                }, done);
            });

            it("should return 400 when endDate is preceded with startDate", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.endDate = "2013-06-01 09:00";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'startDate does not precede endDate.'
                }, done);
            });

            it("should return 400 when status is not a string", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.status = 1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'status should be string.'
                }, done);
            });

            it("should return 400 when status length is not 1", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.status = "abc";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'status must be of length 1'
                }, done);
            });

            it("should return 400 when status is not [AFPI]", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.status = "K";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'status unknown.'
                }, done);
            });

            it("should return 400 when groupId is not a number", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.groupId = "abc";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'groupId should be number.'
                }, done);
            });

            it("should return 400 when groupId is unknow", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.groupId = -10000;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'groupId is unknown.'
                }, done);
            });

            it("should return 400 when adText should be string", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adText = 123;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'adText should be string.'
                }, done);
            });

            it("should return 400 when adText is too long", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adText = getLongText(251);
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'Length of adText must not exceed 250 characters.'
                }, done);
            });

            it("should return 400 when adText contains unescape character", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adText = '"';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'adText contains unescaped quotes.'
                }, done);
            });

            it("should return 400 when adStart is not a valid date", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adStart = "abc";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'adStart is not a valid date.'
                }, done);
            });

            it("should return 400 when adEnd is not a valid date", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adEnd = "abc";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'adEnd is not a valid date.'
                }, done);
            });

            it("should return 400 when adEnd is preceded with adStart", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adEnd = "2013-06-01 09:00";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'adStart does not precede adEnd.'
                }, done);
            });

            it("should return 400 when adTask should be string", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adTask = 123;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'adTask should be string.'
                }, done);
            });

            it("should return 400 when adTask is too long", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adTask = getLongText(31);
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'Length of adTask must not exceed 30 characters.'
                }, done);
            });

            it("should return 400 when adTask contains unescape character", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adTask = '"';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'adTask contains unescaped quotes.'
                }, done);
            });

            it("should return 400 when adCommand should be string", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adCommand = 123;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'adCommand should be string.'
                }, done);
            });

            it("should return 400 when adCommand is too long", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adCommand = getLongText(31);
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'Length of adCommand must not exceed 30 characters.'
                }, done);
            });

            it("should return 400 when adCommand contains unescape character", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.adCommand = '"';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'adCommand contains unescaped quotes.'
                }, done);
            });

            it("should return 400 when activateMenu should be number", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.activateMenu = "abc";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'activateMenu should be number.'
                }, done);
            });

            it("should return 400 when seasonId should be number", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.seasonId = "abc";
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'seasonId should be number.'
                }, done);
            });

            it("should return 400 when seasonId should be valid", function (done) {
                var rrequest = requestClone(simpleRequest);
                rrequest.seasonId = 999999;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'seasonId is unknown.'
                }, done);
            });
        });

        describe('Valid Request', function () {
            /**
             * Create a round for a contest and list it.
             */
            it('should create a new contest', function (done) {
                async.waterfall([
                    function (cb) {
                        testHelper.runSqlSelectQuery(GET_CONTEST_SEQ_SQL, "informixoltp", cb);
                    },
                    function (results, cb) {
                        //the contest id is generated from CONTEST_SEQ
                        var contestId = results[0].next_id + 1;
                        assert200(simpleRequest, contestId, cb);
                    },
                    function (contestId, cb) {
                        validateResult(contestId, cb);
                    }
                ], done);
            });
        });
    });
});
