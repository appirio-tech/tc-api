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
var SQL_DIR = __dirname + "/sqls/contestsStudio/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Contests API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow


    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", "tcs_catalog", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__clean", "tcs_dw", cb);
            }
        ], done);
    }

    /**
     * This function is run before all tests.
     * Generate tests data.
     * @param {Function<err>} done the callback
     */
    before(function (done) {
        async.waterfall([
            clearDb,
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__insert_test_data", "tcs_catalog", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__insert_test_data", "tcs_dw", cb);
            }
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


    describe("Search Design Contests", function () {

        /**
         * Create request to search contests API and assert 400 http code
         * @param {String} queryString - the query string
         * @param {Function} done - the callback function
         */
        function assert400(queryString, done) {
            request(API_ENDPOINT)
                .get('/v2/design/challenges?' + queryString)
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
        function validateResult(queryString, contests, type, total, pageIndex, pageSize, done) {
            request(API_ENDPOINT)
                .get('/v2/design/challenges?' + queryString)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var results = res.body.data, i, item;
                    assert.lengthOf(results, contests.length, "invalid data.length");
                    assert.equal(res.body.total, total, "invalid total");
                    assert.equal(res.body.pageIndex, pageIndex, "invalid pageIndex");
                    assert.equal(res.body.pageSize, pageSize, "invalid pageSize");
                    for (i = 0; i < results.length; i = i + 1) {
                        item = results[i];
                        assert.isString(item.challengeType, "invalid type for result: " + i);
                        assert.isString(item.challengeName);
                        assert.equal(item.challengeName, "Studio Contest " + contests[i],
                            "invalid challengeName for result: " + i);
                        if (type !== "PAST") {
                            assert.isString(item.timeLeft, "invalid timeLeft for result: " + i);
                        } else {
                            assert.isUndefined(item.timeLeft, "invalid timeLeft for result: " + i);
                        }
                        assert.ok(new Date(item.startDate), "invalid startDate for result: " + i);
                        assert.ok(new Date(item.round1EndDate), "invalid round1EndDate for result: " + i);
                        assert.ok(new Date(item.endDate), "invalid endDate for result: " + i);
                        assert.isNumber(item.prize, "invalid prize for result: " + i);
                        assert.isNumber(item.points, "invalid points for result: " + i);
                        assert.isNumber(item.registrants, "invalid registrants for result: " + i);
                        assert.isNumber(item.submissions, "invalid submissions for result: " + i);
                    }
                    done();
                });
        }


        /**
         * /v2/design/challenges?listType=active
         */
        it("should return results for ?listType=active", function (done) {
            validateResult("listType=active", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=aCtiVe
         */
        it("should return results for ?listType=aCtiVe", function (done) {
            validateResult("listType=aCtiVe", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=contestName
         */
        it("should return results for ?listType=active&sortColumn=contestName", function (done) {
            validateResult("listType=active&sortColumn=contestName", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=contestName&sortOrder=desc
         */
        it("should return results for ?listType=active&sortColumn=contestName&sortOrder=desc", function (done) {
            validateResult("listType=active&sortColumn=contestName&sortOrder=desc", [2, 1], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=contestName&sortOrder=dESc
         */
        it("should return results for ?listType=active&sortColumn=contestName&sortOrder=dESc", function (done) {
            validateResult("listType=active&sortColumn=contestName&sortOrder=dESc", [2, 1], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=type
         */
        it("should return results for ?listType=active&sortColumn=type", function (done) {
            validateResult("listType=active&sortColumn=type", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=type&sortOrder=desc
         */
        it("should return results for ?listType=active&sortColumn=type&sortOrder=desc", function (done) {
            validateResult("listType=active&sortColumn=type&sortOrder=desc", [2, 1], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=startDate
         */
        it("should return results for ?listType=active&sortColumn=startDate", function (done) {
            validateResult("listType=active&sortColumn=startDate", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=startDate&sortOrder=desc
         */
        it("should return results for ?listType=active&sortColumn=startDate&sortOrder=desc", function (done) {
            validateResult("listType=active&sortColumn=startDate&sortOrder=desc", [2, 1], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=round1EndDate
         */
        it("should return results for ?listType=active&sortColumn=round1EndDate", function (done) {
            validateResult("listType=active&sortColumn=round1EndDate", [2, 1], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=round1EndDate&sortOrder=desc
         */
        it("should return results for ?listType=active&sortColumn=round1EndDate&sortOrder=desc", function (done) {
            validateResult("listType=active&sortColumn=round1EndDate&sortOrder=desc", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=endDate
         */
        it("should return results for ?listType=active&sortColumn=endDate", function (done) {
            validateResult("listType=active&sortColumn=endDate", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=endDate&sortOrder=desc
         */
        it("should return results for ?listType=active&sortColumn=endDate&sortOrder=desc", function (done) {
            validateResult("listType=active&sortColumn=endDate&sortOrder=desc", [2, 1], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=timeLeft
         */
        it("should return results for ?listType=active&sortColumn=timeLeft", function (done) {
            validateResult("listType=active&sortColumn=timeLeft", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=timeLeft&sortOrder=desc
         */
        it("should return results for ?listType=active&sortColumn=timeLeft&sortOrder=desc", function (done) {
            validateResult("listType=active&sortColumn=timeLeft&sortOrder=desc", [2, 1], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=prize
         */
        it("should return results for ?listType=active&prize=timeLeft", function (done) {
            validateResult("listType=active&sortColumn=prize", [2, 1], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=prize&sortOrder=desc
         */
        it("should return results for ?listType=active&sortColumn=prize&sortOrder=desc", function (done) {
            validateResult("listType=active&sortColumn=prize&sortOrder=desc", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=points
         */
        it("should return results for ?listType=active&sortColumn=points", function (done) {
            validateResult("listType=active&sortColumn=points", [2, 1], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=points&sortOrder=desc
         */
        it("should return results for ?listType=active&sortColumn=points&sortOrder=desc", function (done) {
            validateResult("listType=active&sortColumn=points&sortOrder=desc", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=registrants
         */
        it("should return results for ?listType=active&sortColumn=registrants", function (done) {
            validateResult("listType=active&sortColumn=registrants", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=registrants&sortOrder=desc
         */
        it("should return results for ?listType=active&sortColumn=registrants&sortOrder=desc", function (done) {
            validateResult("listType=active&sortColumn=registrants&sortOrder=desc", [2, 1], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=submissions
         */
        it("should return results for ?listType=active&sortColumn=submissions", function (done) {
            validateResult("listType=active&sortColumn=submissions", [2, 1], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&sortColumn=submissions&sortOrder=desc
         */
        it("should return results for ?listType=active&sortColumn=submissions&sortOrder=desc", function (done) {
            validateResult("listType=active&sortColumn=submissions&sortOrder=desc", [1, 2], "ACTIVE", 2, 1, 50, done);
        });

        /**
         * /v2/design/challenges?pageIndex=1&pageSize=1
         */
        it("should return results for ?pageIndex=1&pageSize=1", function (done) {
            validateResult("pageIndex=1&pageSize=1", [1], "ACTIVE", 2, 1, 1, done);
        });

        /**
         * /v2/design/challenges?pageIndex=2&pageSize=1
         */
        it("should return results for ?pageIndex=2&pageSize=1", function (done) {
            validateResult("pageIndex=2&pageSize=1", [2], "ACTIVE", 2, 2, 1, done);
        });

        /**
         * /v2/design/challenges?pageIndex=-1
         */
        it("should return results for ?pageIndex=-1", function (done) {
            validateResult("pageIndex=-1", [1, 2], "ACTIVE", 2, 1, 2, done);
        });

        /**
         * /v2/design/challenges?listType=OPEN
         */
        it("should return results for ?listType=OPEN", function (done) {
            validateResult("listType=OPEN", [1, 2, 4], "OPEN", 3, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=PAST
         */
        it("should return results for ?listType=PAST", function (done) {
            validateResult("listType=PAST", [5], "PAST", 1, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=UPCOMING
         */
        it("should return results for ?listType=UPCOMING", function (done) {
            validateResult("listType=UPCOMING", [3], "UPCOMING", 1, 1, 50, done);
        });


        /**
         * /v2/design/challenges?listType=active&type=Banners/icons
         */
        it("should return results for ?listType=active&type=Banners/icons", function (done) {
            validateResult("listType=active&type=Banners/icons", [1], "ACTIVE", 1, 1, 50, done);
        });


        /**
         * /v2/design/challenges?listType=active&contestName=contest 1
         */
        it("should return results for ?listType=active&contestName=contest 1", function (done) {
            validateResult("listType=active&contestName=contest 1", [1], "ACTIVE", 1, 1, 50, done);
        });


        /**
         * /v2/design/challenges?listType=active&prizeLowerBound=1250
         */
        it("should return results for ?listType=active&prizeLowerBound=1250", function (done) {
            validateResult("listType=active&prizeLowerBound=1250", [1], "ACTIVE", 1, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&prizeUpperBound=1200
         */
        it("should return results for ?listType=active&prizeUpperBound=1200", function (done) {
            validateResult("listType=active&prizeUpperBound=1200", [2], "ACTIVE", 1, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&startDate.type=on&startDate.firstDate=2013-11-10
         */
        it("should return results for ?listType=active&startDate.type=on&startDate.firstDate=2013-11-10", function (done) {
            validateResult("listType=active&startDate.type=on&startDate.firstDate=2013-11-10", [1], "ACTIVE", 1, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&startDate.type=BETWEEN_DATES&startDate.firstDate=2013-11-10&startDate.secondDate=2013-11-12
         */
        it("should return results for ?listType=active&startDate.type=BETWEEN_DATES&startDate.firstDate=2013-11-10&startDate.secondDate=2013-11-12", function (done) {
            validateResult("listType=active&startDate.type=BETWEEN_DATES&startDate.firstDate=2013-11-10&startDate.secondDate=2013-11-12", [1], "ACTIVE", 1, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&round1EndDate.type=on&round1EndDate.firstDate=2013-11-25
         */
        it("should return results for ?listType=active&round1EndDate.type=on&round1EndDate.firstDate=2013-11-25", function (done) {
            validateResult("listType=active&round1EndDate.type=on&round1EndDate.firstDate=2013-11-25", [2], "ACTIVE", 1, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=active&endDate.type=AFTER_CURRENT_DATE
         */
        it("should return results for ?listType=active&endDate.type=AFTER_CURRENT_DATE", function (done) {
            validateResult("listType=active&endDate.type=AFTER_CURRENT_DATE", [1, 2], "ACTIVE", 2, 1, 50, done);
        });


        /**
         * /v2/design/challenges?listType=active&cmc=ab
         */
        it("should return results for ?listType=active&cmc=ab", function (done) {
            validateResult("listType=active&cmc=ab", [1], "ACTIVE", 1, 1, 50, done);
        });

        /**
         * /v2/design/challenges?listType=open&cmc=ab
         */
        it("should return results for ?listType=open&cmc=ab", function (done) {
            validateResult("listType=open&cmc=ab", [1], "OPEN", 1, 1, 50, done);
        });


        /**
         * /v2/design/challenges?listType=open&prizeLowerBound=1250
         */
        it("should return results for ?listType=open&prizeLowerBound=1250", function (done) {
            validateResult("listType=open&prizeLowerBound=1250", [1, 4], "OPEN", 2, 1, 50, done);
        });


        /**
         * /v2/design/challenges?listType=xyz
         */
        it("should return error 400 when listType is not valid value", function (done) {
            assert400("listType=xyz", done);
        });

        /**
         * /v2/design/challenges?pageSize=xyz
         */
        it("should return error 400 when pageSize is not number", function (done) {
            assert400("pageSize=xyz", done);
        });

        /**
         * /v2/design/challenges?pageSize=0
         */
        it("should return error 400 when pageSize is 0", function (done) {
            assert400("pageSize=0", done);
        });

        /**
         * /v2/design/challenges?pageSize=-1
         */
        it("should return error 400 when pageSize is -1", function (done) {
            assert400("pageSize=-1", done);
        });

        /**
         * /v2/design/challenges?pageSize=100000000000000000000
         */
        it("should return error 400 when pageSize is too big number", function (done) {
            assert400("pageSize=100000000000000000000", done);
        });

        /**
         * /v2/design/challenges?pageSize=1.123
         */
        it("should return error 400 when pageSize is float number", function (done) {
            assert400("pageSize=1.123", done);
        });

        /**
         * /v2/design/challenges?pageIndex=xyz
         */
        it("should return error 400 when pageIndex is not number", function (done) {
            assert400("pageIndex=xyz", done);
        });

        /**
         * /v2/design/challenges?pageIndex=0
         */
        it("should return error 400 when pageIndex is 0", function (done) {
            assert400("pageIndex=0", done);
        });

        /**
         * /v2/design/challenges?pageIndex=-2
         */
        it("should return error 400 when pageIndex is -2", function (done) {
            assert400("pageIndex=-2", done);
        });

        /**
         * /v2/design/challenges?pageIndex=100000000000000000000
         */
        it("should return error 400 when pageIndex is too big number", function (done) {
            assert400("pageIndex=100000000000000000000", done);
        });

        /**
         * /v2/design/challenges?pageIndex=1.123
         */
        it("should return error 400 when pageIndex is float number", function (done) {
            assert400("pageIndex=1.123", done);
        });

        /**
         * /v2/design/challenges?pageIndex=1
         */
        it("should return error 400 when pageIndex is set and pageSize is missing", function (done) {
            assert400("pageIndex=1", done);
        });

        /**
         * /v2/design/challenges?sortColumn=xyz
         */
        it("should return error 400 when sortColumn is invalid", function (done) {
            assert400("sortColumn=xyz", done);
        });

        /**
         * /v2/design/challenges?sortOrder=xyz
         */
        it("should return error 400 when sortOrder is invalid", function (done) {
            assert400("sortOrder=xyz", done);
        });

        /**
         * /v2/design/challenges?sortOrder=xyz
         */
        it("should return error 400 when sortColumn=timeLeft and listType=PAST", function (done) {
            assert400("sortColumn=timeLeft&listType=PAST", done);
        });


        /**
         * /v2/design/challenges?prizeLowerBound=xyz
         */
        it("should return error 400 when prizeLowerBound is not valid value", function (done) {
            assert400("prizeLowerBound=xyz", done);
        });

        /**
         * /v2/design/challenges?prizeUpperBound=xyz
         */
        it("should return error 400 when prizeUpperBound is not valid value", function (done) {
            assert400("prizeUpperBound=xyz", done);
        });

        /**
         * /v2/design/challenges?prizeLowerBound=-1
         */
        it("should return error 400 when prizeLowerBound is -1", function (done) {
            assert400("prizeLowerBound=-1", done);
        });

        /**
         * /v2/design/challenges?prizeUpperBound=-1
         */
        it("should return error 400 when prizeUpperBound is -1", function (done) {
            assert400("prizeUpperBound=-1", done);
        });

        /**
         * /v2/design/challenges?startDate.type=xyz
         */
        it("should return error 400 when startDate.type is invalid", function (done) {
            assert400("startDate.type=xyz", done);
        });

        /**
         * /v2/design/challenges?round1EndDate.type=xyz
         */
        it("should return error 400 when round1EndDate.type is invalid", function (done) {
            assert400("round1EndDate.type=xyz", done);
        });
        /**
         * /v2/design/challenges?endDate.type=xyz
         */
        it("should return error 400 when endDate.type is invalid", function (done) {
            assert400("endDate.type=xyz", done);
        });

        /**
         * /v2/design/challenges?startDate.type=on
         */
        it("should return error 400 when startDate.type is specified and startDate.firstDate is missing", function (done) {
            assert400("startDate.type=on", done);
        });

        /**
         * /v2/design/challenges?pageIndex=100&pageSize=100
         */
        it("should return empty result when no results returned", function (done) {
            request(API_ENDPOINT)
                .get('/v2/design/challenges?pageIndex=100&pageSize=100')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(done);
        });

    });


    describe("Get Contests Details", function () {

        /**
         * Create request to search contests API and assert 400 http code
         * @param {String} contestId - the contest id
         * @param {Function} done - the callback function
         */
        function assert400(contestId, done) {
            request(API_ENDPOINT)
                .get('/v2/design/challenges/' + contestId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)
                .end(done);
        }

        /**
         * /v2/design/challenges/10041
         */
        it("should return contest details", function (done) {
            request(API_ENDPOINT)
                .get('/v2/design/challenges/10041')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    var body = res.body;
                    assert.lengthOf(body.submissions, 1, "invalid submissions count");
                    assert.lengthOf(body.checkpoints, 1, "invalid checkpoints count");
                    assert.lengthOf(body.winners, 1, "invalid winners count");
                    //submissionTime is not constant value
                    assert.ok(body.submissions[0].submissionTime);
                    assert.ok(body.checkpoints[0].submissionTime);
                    assert.ok(body.winners[0].submissionTime);
                    delete body.submissions[0].submissionTime;
                    delete body.checkpoints[0].submissionTime;
                    delete body.winners[0].submissionTime;
                    testHelper.assertResponse(err,
                        res,
                        "test_files/exptected_studio_contest_details.json",
                        done);
                });
        });


        /**
         * /v2/design/challenges/xyz
         */
        it("should return 400 error if contestId is not number", function (done) {
            assert400("xyz", done);
        });

        /**
         * /v2/design/challenges/0
         */
        it("should return 400 error if contestId is 0", function (done) {
            assert400("0", done);
        });

        /**
         * /v2/design/challenges/-1
         */
        it("should return 400 error if contestId is -1", function (done) {
            assert400("-1", done);
        });

        /**
         * /v2/design/challenges/1.23
         */
        it("should return 400 error if contestId is 1.23", function (done) {
            assert400("1.23", done);
        });

        /**
         * /v2/design/challenges/10000000000000000
         */
        it("should return 400 error if contestId is too big number", function (done) {
            assert400("10000000000000000", done);
        });
    });
});