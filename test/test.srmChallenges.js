/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
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

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/srmChallenges/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

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


    describe("Search Contests", function () {

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
         * Create request to search contests API and assert 400 http code
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
         * @param {Array} contests - the array of expected contests. e.g [1, 2]
         * @param {String} type - the list type
         * @param {Number} total - the expected total count
         * @param {Number} pageIndex - the expected pageIndex
         * @param {Number} pageSize - the expected pageSize
         * @param {Function} done - the callback function
         */
        function validateResult(queryString, contests, total, pageIndex, pageSize, done) {
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
                    assert.lengthOf(results, contests.length, "invalid data.length");
                    assert.equal(res.body.total, total, "invalid total");
                    assert.equal(res.body.pageIndex, pageIndex, "invalid pageIndex");
                    assert.equal(res.body.pageSize, pageSize, "invalid pageSize");
                    for (i = 0; i < results.length; i = i + 1) {
                        item = results[i];
                        expected = expectedData[contests[i]];
                        assert.deepEqual(item, expected, "Invalid contest number:  " + i);
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
        it("should return error 404 when no results returned", function (done) {
            request(API_ENDPOINT)
                .get('/v2/data/srm/challenges?pageIndex=100&pageSize=100')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(404)
                .end(done);
        });

    });


    describe("Get Contests Details", function () {

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
         * Create request to search contests API and assert 400 http code
         * @param {String} contestId - the contest id
         * @param {Function} done - the callback function
         */
        function assert400(contestId, done) {
            request(API_ENDPOINT)
                .get('/v2/data/srm/challenges/' + contestId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)
                .end(done);
        }

        /**
         * /v2/data/srm/challenges/10041
         */
        it("should return contest details", function (done) {
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
});