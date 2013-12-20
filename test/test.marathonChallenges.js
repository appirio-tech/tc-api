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
var SQL_DIR = __dirname + "/sqls/marathonChallenges/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Marathon Challenges API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow


    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__clean", "informixoltp", cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clean", "topcoder_dw", cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "common_oltp__clean", "common_oltp", cb);
            }
        ], done);
    }



    /**
     * This function is run after each all test cases.
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
                    testHelper.runSqlFile(SQL_DIR + "topcoder_dw__insert_test_data", "topcoder_dw", cb);
                }, function (cb) {
                    testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_test_data", "informixoltp", cb);
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
                .get('/v2/data/marathon/challenges?' + queryString)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)
                .end(done);
        }

        /**
         * Helper method for validating result for current test data
         * @param {String} queryString - the query string
         * @param {String} file - the file name with expected response (data[] will be sorted)
         * @param {Function} done - the callback function
         */
        function validateSorting(queryString, file, sortColumn, order, done) {
            request(API_ENDPOINT)
                .get('/v2/data/marathon/challenges?' + queryString.replace(/^\?/, ""))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    delete res.body.serverInformation;
                    delete res.body.requestorInformation;
                    var expectedData = require("./test_files/" + file),
                        compare = function (a, b, ord) {
                            if (typeof a === "string" && new Date(a).toString() !== "Invalid Date") {
                                return compare(new Date(a).getTime(), new Date(b).getTime(), ord);
                            }
                            if (a === b) {
                                return 0;
                            }
                            if (ord === "asc") {
                                return a > b ? 1 : -1;
                            }
                            return a > b ? -1 : 1;
                        };
                    expectedData.data.sort(function (a, b) {
                        if (a[sortColumn] === b[sortColumn]) {
                            //order by round id desc
                            return compare(a.roundId, b.roundId, 'desc');
                        }
                        return compare(a[sortColumn], b[sortColumn], order);
                    });
                    assert.deepEqual(res.body, expectedData, "Invalid response");
                    done();
                });
        }

        /**
         * Helper method for asserting results
         * @param {String} queryString - the query string
         * @param {String} file - the file name with expected response
         * @param {Function} done - the callback function
         */
        function assertResponse(queryString, file, done) {
            request(API_ENDPOINT)
                .get('/v2/data/marathon/challenges?' + queryString.replace(/^\?/, ""))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    testHelper.assertResponse(err, res, "test_files/" + file, done);
                });
        }

        /**
         * Helper method for asserting results. It checks only count of returned items.
         * @param {String} queryString - the query string
         * @param {Number} count - the count of returned items
         * @param {Number} total - the total number of items
         * @param {Function} done - the callback function
         */
        function assertCount(queryString, count, total, done) {
            request(API_ENDPOINT)
                .get('/v2/data/marathon/challenges?' + queryString.replace(/^\?/, ""))
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    assert.ok(res.body);
                    assert.isArray(res.body.data);
                    assert.lengthOf(res.body.data, count);
                    assert.equal(res.body.total, total);
                    done();
                });
        }

        /**
         * /v2/data/marathon/challenges
         */
        it("should return results", function (done) {
            assertResponse("", "expected_marathon_challenges_1.json", done);
        });

        /**
         * /v2/data/marathon/challenges?listType=active
         */
        it("should return results for ?listType=active", function (done) {
            assertResponse("?listType=active", "expected_marathon_challenges_1.json", done);
        });

        /**
         * /v2/data/marathon/challenges?listType=aCtIve
         */
        it("should return results for ?listType=aCtIve", function (done) {
            assertResponse("?listType=aCtIve", "expected_marathon_challenges_1.json", done);
        });

        /**
         * /v2/data/marathon/challenges?pageIndex=1&pageSize=1
         */
        it("should return results for ?pageIndex=1&pageSize=1", function (done) {
            assertResponse("pageIndex=1&pageSize=1", "expected_marathon_challenges_2.json", done);
        });

        /**
         * /v2/data/marathon/challenges?pageIndex=2&pageSize=1
         */
        it("should return results for ?pageIndex=2&pageSize=1", function (done) {
            assertResponse("pageIndex=2&pageSize=1", "expected_marathon_challenges_3.json", done);
        });

        /**
         * /v2/data/marathon/challenges?pageIndex=-1
         */
        it("should return results for ?pageIndex=-1", function (done) {
            assertResponse("pageIndex=-1", "expected_marathon_challenges_4.json", done);
        });



        /**
         * /v2/data/marathon/challenges?sortColumn=roundId&sortOrder=asc
         */
        it("should return results for ?sortColumn=roundId&sortOrder=asc", function (done) {
            validateSorting("?sortColumn=roundId&sortOrder=asc",
                "expected_marathon_challenges_1.json",
                "roundId",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?sortColumn=roundId&sortOrder=desc
         */
        it("should return results for ?sortColumn=roundId&sortOrder=desc", function (done) {
            validateSorting("?sortColumn=roundId&sortOrder=desc",
                "expected_marathon_challenges_1.json",
                "roundId",
                "desc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?sortColumn=fullName&sortOrder=asc
         */
        it("should return results for ?sortColumn=fullName&sortOrder=asc", function (done) {
            validateSorting("?sortColumn=fullName&sortOrder=asc",
                "expected_marathon_challenges_1.json",
                "fullName",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?sortColumn=fullName&sortOrder=desc
         */
        it("should return results for ?sortColumn=fullName&sortOrder=desc", function (done) {
            validateSorting("?sortColumn=fullName&sortOrder=desc",
                "expected_marathon_challenges_1.json",
                "fullName",
                "desc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?sortColumn=shortName&sortOrder=asc
         */
        it("should return results for ?sortColumn=shortName&sortOrder=asc", function (done) {
            validateSorting("?sortColumn=shortName&sortOrder=asc",
                "expected_marathon_challenges_1.json",
                "shortName",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?sortColumn=shortName&sortOrder=desc
         */
        it("should return results for ?sortColumn=shortName&sortOrder=desc", function (done) {
            validateSorting("?sortColumn=shortName&sortOrder=desc",
                "expected_marathon_challenges_1.json",
                "shortName",
                "desc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?sortColumn=startDate&sortOrder=asc
         */
        it("should return results for ?sortColumn=startDate&sortOrder=asc", function (done) {
            validateSorting("?sortColumn=startDate&sortOrder=asc",
                "expected_marathon_challenges_1.json",
                "startDate",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?sortColumn=startDate&sortOrder=desc
         */
        it("should return results for ?sortColumn=startDate&sortOrder=desc", function (done) {
            validateSorting("?sortColumn=startDate&sortOrder=desc",
                "expected_marathon_challenges_1.json",
                "startDate",
                "desc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?sortColumn=endDate&sortOrder=asc
         */
        it("should return results for ?sortColumn=endDate&sortOrder=asc", function (done) {
            validateSorting("?sortColumn=endDate&sortOrder=asc",
                "expected_marathon_challenges_1.json",
                "endDate",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?sortColumn=endDate&sortOrder=desc
         */
        it("should return results for ?sortColumn=endDate&sortOrder=desc", function (done) {
            validateSorting("?sortColumn=endDate&sortOrder=desc",
                "expected_marathon_challenges_1.json",
                "endDate",
                "desc",
                done);
        });

        /**
         * /v2/data/marathon/challenges?listType=past
         */
        it("should return results for ?listType=past", function (done) {
            assertResponse("?listType=past", "expected_marathon_challenges_5.json", done);
        });


        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=roundId&sortOrder=asc
         */
        it("should return results for ?listType=past&sortColumn=roundId&sortOrder=asc", function (done) {
            validateSorting("?listType=past&sortColumn=roundId&sortOrder=asc",
                "expected_marathon_challenges_5.json",
                "roundId",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=roundId&sortOrder=desc
         */
        it("should return results for ?listType=past&sortColumn=roundId&sortOrder=desc", function (done) {
            validateSorting("?listType=past&sortColumn=roundId&sortOrder=desc",
                "expected_marathon_challenges_5.json",
                "roundId",
                "desc",
                done);
        });

        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=fullName&sortOrder=asc
         */
        it("should return results for ?listType=past&sortColumn=fullName&sortOrder=asc", function (done) {
            validateSorting("?listType=past&sortColumn=fullName&sortOrder=asc",
                "expected_marathon_challenges_5.json",
                "fullName",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=fullName&sortOrder=desc
         */
        it("should return results for ?listType=past&sortColumn=fullName&sortOrder=desc", function (done) {
            validateSorting("?listType=past&sortColumn=fullName&sortOrder=desc",
                "expected_marathon_challenges_5.json",
                "fullName",
                "desc",
                done);
        });

        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=shortName&sortOrder=asc
         */
        it("should return results for ?listType=past&sortColumn=shortName&sortOrder=asc", function (done) {
            validateSorting("?listType=past&sortColumn=shortName&sortOrder=asc",
                "expected_marathon_challenges_5.json",
                "shortName",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=shortName&sortOrder=desc
         */
        it("should return results for ?listType=past&sortColumn=shortName&sortOrder=desc", function (done) {
            validateSorting("?listType=past&sortColumn=shortName&sortOrder=desc",
                "expected_marathon_challenges_5.json",
                "shortName",
                "desc",
                done);
        });

        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=startDate&sortOrder=asc
         */
        it("should return results for ?listType=past&sortColumn=startDate&sortOrder=asc", function (done) {
            validateSorting("?listType=past&sortColumn=startDate&sortOrder=asc",
                "expected_marathon_challenges_5.json",
                "startDate",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=startDate&sortOrder=desc
         */
        it("should return results for ?listType=past&sortColumn=startDate&sortOrder=desc", function (done) {
            validateSorting("?listType=past&sortColumn=startDate&sortOrder=desc",
                "expected_marathon_challenges_5.json",
                "startDate",
                "desc",
                done);
        });

        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=endDate&sortOrder=asc
         */
        it("should return results for ?listType=past&sortColumn=endDate&sortOrder=asc", function (done) {
            validateSorting("?listType=past&sortColumn=endDate&sortOrder=asc",
                "expected_marathon_challenges_5.json",
                "endDate",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=endDate&sortOrder=desc
         */
        it("should return results for ?listType=past&sortColumn=endDate&sortOrder=desc", function (done) {
            validateSorting("?listType=past&sortColumn=endDate&sortOrder=desc",
                "expected_marathon_challenges_5.json",
                "endDate",
                "desc",
                done);
        });

        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=winnerHandle&sortOrder=asc
         */
        it("should return results for ?listType=past&sortColumn=winnerHandle&sortOrder=asc", function (done) {
            validateSorting("?listType=past&sortColumn=winnerHandle&sortOrder=asc",
                "expected_marathon_challenges_5.json",
                "winnerHandle",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=winnerHandle&sortOrder=desc
         */
        it("should return results for ?listType=past&sortColumn=winnerHandle&sortOrder=desc", function (done) {
            validateSorting("?listType=past&sortColumn=winnerHandle&sortOrder=desc",
                "expected_marathon_challenges_5.json",
                "winnerHandle",
                "desc",
                done);
        });

        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=winnerScore&sortOrder=asc
         */
        it("should return results for ?listType=past&sortColumn=winnerScore&sortOrder=asc", function (done) {
            validateSorting("?listType=past&sortColumn=winnerScore&sortOrder=asc",
                "expected_marathon_challenges_5.json",
                "winnerScore",
                "asc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?listType=past&sortColumn=winnerScore&sortOrder=desc
         */
        it("should return results for ?listType=past&sortColumn=winnerScore&sortOrder=desc", function (done) {
            validateSorting("?listType=past&sortColumn=winnerScore&sortOrder=desc",
                "expected_marathon_challenges_5.json",
                "winnerScore",
                "desc",
                done);
        });


        /**
         * /v2/data/marathon/challenges?listType=PAST&roundId=2194
         */
        it("should return results for ?listType=PAST&roundId=2194", function (done) {
            assertCount("?listType=PAST&roundId=2194", 1, 1, done);
        });


        /**
         * /v2/data/marathon/challenges?listType=PAST&fullName=2010
         */
        it("should return results for ?listType=PAST&fullName=2010", function (done) {
            assertCount("?listType=PAST&fullName=2010", 4, 4, done);
        });


        /**
         * /v2/data/marathon/challenges?listType=PAST&shortName=219
         */
        it("should return results for ?listType=PAST&shortName=219", function (done) {
            assertCount("?listType=PAST&shortName=219", 2, 2, done);
        });


        /**
         * /v2/data/marathon/challenges?listType=PAST&startDate.type=on&startDate.firstDate=2013-11-02
         */
        it("should return results for ?listType=PAST&startDate.type=on&startDate.firstDate=2013-11-02", function (done) {
            assertCount("?listType=PAST&startDate.type=on&startDate.firstDate=2013-11-02", 7, 7, done);
        });

        /**
         * /v2/data/marathon/challenges?listType=PAST&endDate.type=on&endDate.firstDate=2013-11-08
         */
        it("should return results for ?listType=PAST&endDate.type=on&endDate.firstDate=2013-11-08", function (done) {
            assertCount("?listType=PAST&endDate.type=on&endDate.firstDate=2013-11-08", 4, 4, done);
        });

        /**
         * /v2/data/marathon/challenges?listType=PAST&winnerHandle=2045
         */
        it("should return results for ?listType=PAST&winnerHandle=2045", function (done) {
            assertCount("?listType=PAST&winnerHandle=2045", 4, 4, done);
        });

        /**
         * /v2/data/marathon/challenges?listType=PAST&winnerScoreLowerBound=950000
         */
        it("should return results for ?listType=PAST&winnerScoreLowerBound=950000", function (done) {
            assertCount("?listType=PAST&winnerScoreLowerBound=950000", 3, 3, done);
        });

        /**
         * /v2/data/marathon/challenges?listType=PAST&winnerScoreUpperBound=50000
         */
        it("should return results for ?listType=PAST&winnerScoreUpperBound=50000", function (done) {
            assertCount("?listType=PAST&winnerScoreUpperBound=50000", 2, 2, done);
        });

        /**
         * /v2/data/marathon/challenges?roundId=2060
         */
        it("should return results for ?roundId=2060", function (done) {
            assertCount("?roundId=2060", 1, 1, done);
        });


        /**
         * /v2/data/marathon/challenges?fullName=2003
         */
        it("should return results for ?fullName=2003", function (done) {
            assertCount("?fullName=2003", 4, 4, done);
        });


        /**
         * /v2/data/marathon/challenges?shortName=205
         */
        it("should return results for ?shortName=205", function (done) {
            assertCount("?shortName=205", 3, 3, done);
        });


        /**
         * /v2/data/marathon/challenges?startDate.type=on&startDate.firstDate=2013-10-14
         */
        it("should return results for ?startDate.type=on&startDate.firstDate=2013-10-14", function (done) {
            assertCount("?startDate.type=on&startDate.firstDate=2013-10-14", 1, 1, done);
        });

        /**
         * /v2/data/marathon/challenges?endDate.type=on&endDate.firstDate=2053-11-13
         */
        it("should return results for ?endDate.type=on&endDate.firstDate=2053-11-13", function (done) {
            assertCount("?endDate.type=on&endDate.firstDate=2053-11-13", 1, 1, done);
        });

        /**
         * /v2/data/marathon/challenges?pageSize=xyz
         */
        it("should return error 400 when pageSize is not number", function (done) {
            assert400("pageSize=xyz", done);
        });

        /**
         * /v2/data/marathon/challenges?pageSize=0
         */
        it("should return error 400 when pageSize is 0", function (done) {
            assert400("pageSize=0", done);
        });

        /**
         * /v2/data/marathon/challenges?pageSize=-1
         */
        it("should return error 400 when pageSize is -1", function (done) {
            assert400("pageSize=-1", done);
        });

        /**
         * /v2/data/marathon/challenges?pageSize=100000000000000000000
         */
        it("should return error 400 when pageSize is too big number", function (done) {
            assert400("pageSize=100000000000000000000", done);
        });

        /**
         * /v2/data/marathon/challenges?pageSize=1.123
         */
        it("should return error 400 when pageSize is float number", function (done) {
            assert400("pageSize=1.123", done);
        });

        /**
         * /v2/data/marathon/challenges?pageIndex=xyz
         */
        it("should return error 400 when pageIndex is not number", function (done) {
            assert400("pageIndex=xyz", done);
        });

        /**
         * /v2/data/marathon/challenges?pageIndex=0
         */
        it("should return error 400 when pageIndex is 0", function (done) {
            assert400("pageIndex=0", done);
        });

        /**
         * /v2/data/marathon/challenges?pageIndex=-2
         */
        it("should return error 400 when pageIndex is -2", function (done) {
            assert400("pageIndex=-2", done);
        });

        /**
         * /v2/data/marathon/challenges?pageIndex=100000000000000000000
         */
        it("should return error 400 when pageIndex is too big number", function (done) {
            assert400("pageIndex=100000000000000000000", done);
        });

        /**
         * /v2/data/marathon/challenges?pageIndex=1.123
         */
        it("should return error 400 when pageIndex is float number", function (done) {
            assert400("pageIndex=1.123", done);
        });

        /**
         * /v2/data/marathon/challenges?pageIndex=1
         */
        it("should return error 400 when pageIndex is set and pageSize is missing", function (done) {
            assert400("pageIndex=1", done);
        });

        /**
         * /v2/data/marathon/challenges?sortColumn=xyz
         */
        it("should return error 400 when sortColumn is invalid", function (done) {
            assert400("sortColumn=xyz", done);
        });

        /**
         * /v2/data/marathon/challenges?sortOrder=xyz
         */
        it("should return error 400 when sortOrder is invalid", function (done) {
            assert400("sortOrder=xyz", done);
        });

        /**
         * /v2/data/marathon/challenges?sortColumn=winnerHandle&listType=ACTIVE
         */
        it("should return error 400 when sortColumn=winnerHandle and listType=active", function (done) {
            assert400("sortColumn=winnerHandle&listType=ACTIVE", done);
        });

        /**
         * /v2/data/marathon/challenges?sortColumn=WinNerHanDle&listType=ACTIVE
         */
        it("should return error 400 when sortColumn=WinNerHanDle and listType=active", function (done) {
            assert400("sortColumn=WinNerHanDle&listType=ACTIVE", done);
        });


        /**
         * /v2/data/marathon/challenges?sortColumn=winnerScore&listType=ACTIVE
         */
        it("should return error 400 when sortColumn=winnerScore and listType=active", function (done) {
            assert400("sortColumn=winnerScore&listType=ACTIVE", done);
        });

        /**
         * /v2/data/marathon/challenges?sortColumn=WiNneRScore&listType=ACTIVE
         */
        it("should return error 400 when sortColumn=WiNneRScore and listType=active", function (done) {
            assert400("sortColumn=WiNneRScore&listType=ACTIVE", done);
        });


        /**
         * /v2/data/marathon/challenges?pageIndex=100&pageSize=100
         */
        it("should return error 404 when no results returned", function (done) {
            request(API_ENDPOINT)
                .get('/v2/data/marathon/challenges?pageIndex=100&pageSize=100')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(404)
                .end(done);
        });


        /**
         * /v2/data/marathon/challenges?roundId=xyz
         */
        it("should return error 400 when roundId is not valid value", function (done) {
            assert400("roundId=xyz", done);
        });

        /**
         * /v2/data/marathon/challenges?winnerScoreLowerBound=xyz
         */
        it("should return error 400 when winnerScoreLowerBound is not valid value", function (done) {
            assert400("winnerScoreLowerBound=xyz", done);
        });

        /**
         * /v2/data/marathon/challenges?prizeUpperBound=xyz
         */
        it("should return error 400 when winnerScoreLowerBound is not valid value", function (done) {
            assert400("winnerScoreLowerBound=xyz", done);
        });

        /**
         * /v2/data/marathon/challenges?winnerScoreLowerBound=-1
         */
        it("should return error 400 when winnerScoreLowerBound is -1", function (done) {
            assert400("winnerScoreLowerBound=-1", done);
        });

        /**
         * /v2/data/marathon/challenges?winnerScoreUpperBound=-1
         */
        it("should return error 400 when winnerScoreUpperBound is -1", function (done) {
            assert400("winnerScoreUpperBound=-1", done);
        });

        /**
         * /v2/data/marathon/challenges?startDate.type=xyz
         */
        it("should return error 400 when startDate.type is invalid", function (done) {
            assert400("startDate.type=xyz", done);
        });

        /**
         * /v2/data/marathon/challenges?endDate.type=xyz
         */
        it("should return error 400 when endDate.type is invalid", function (done) {
            assert400("endDate.type=xyz", done);
        });

        /**
         * /v2/data/marathon/challenges?startDate.type=on
         */
        it("should return error 400 when startDate.type is specified and startDate.firstDate is missing", function (done) {
            assert400("startDate.type=on", done);
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
                    testHelper.runSqlFile(SQL_DIR + "common_oltp__insert_test_data_details", "common_oltp", cb);
                }, function (cb) {
                    var files = testHelper.generatePartPaths(SQL_DIR + "informixoltp__insert_test_data_details", "", 2);
                    testHelper.runSqlFiles(files, "informixoltp", cb);
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
                .get('/v2/data/marathon/challenges/' + contestId)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(400)
                .end(done);
        }

        /**
         * /v2/data/marathon/challenges/2001
         */
        it("should return contest details", function (done) {
            request(API_ENDPOINT)
                .get('/v2/data/marathon/challenges/2001')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    testHelper.assertResponse(err,
                        res,
                        "test_files/expected_marathon_challenges_details.json",
                        done);
                });
        });

        /**
         * /v2/data/marathon/challenges/2001
         */
        it("should return contest details without winner information", function (done) {
            async.waterfall([
                function (cb) {
                    testHelper.runSqlFile(SQL_DIR + "informixoltp__clean_winner", "informixoltp", cb);
                }, function (cb) {
                    request(API_ENDPOINT)
                        .get('/v2/data/marathon/challenges/2001')
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(200)
                        .end(function (err, res) {
                            testHelper.assertResponse(err,
                                res,
                                "test_files/expected_marathon_challenges_details_2.json",
                                cb);
                        });
                }
            ], done);
        });

        /**
         * /v2/data/marathon/challenges/xyz
         */
        it("should return 400 error if contestId is not number", function (done) {
            assert400("xyz", done);
        });

        /**
         * /v2/data/marathon/challenges/0
         */
        it("should return 400 error if contestId is 0", function (done) {
            assert400("0", done);
        });

        /**
         * /v2/data/marathon/challenges/-1
         */
        it("should return 400 error if contestId is -1", function (done) {
            assert400("-1", done);
        });

        /**
         * /v2/data/marathon/challenges/1.23
         */
        it("should return 400 error if contestId is 1.23", function (done) {
            assert400("1.23", done);
        });

        /**
         * /v2/data/marathon/challenges/10000000000000000
         */
        it("should return 400 error if contestId is too big number", function (done) {
            assert400("10000000000000000", done);
        });
    });
});