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
var SQL_DIR = __dirname + "/sqls/topsMarathon/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Top Ranked Marathon Members API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow


    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clean", "topcoder_dw", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__clean", "informixoltp", cb);
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
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__insert_test_data", "topcoder_dw", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_test_data", "informixoltp", cb);
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

    /**
     * Make request to srm tops API and compare response with given file
     * @param {String} queryString - the query string to make request with
     * @param {String} file - the file which contains expected response 
     * @param {Function<err>} done - the callback
     */
    function assertResponse(queryString, file, done) {
        request(API_ENDPOINT)
            .get('/v2/data/marathon/statistics/tops?' + queryString)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var body = res.body, expected = require("./test_files/" + file);
                delete body.serverInformation;
                delete body.requestorInformation;
                assert.deepEqual(body, expected, "Invalid response");
                done();
            });
    }
    /**
     * Make request to srm tops API and assert 400 http code
     * @param {String} queryString - the query string
     * @param {Function} done - the callback function
     */
    function assert400(queryString, done) {
        request(API_ENDPOINT)
            .get('/v2/data/marathon/statistics/tops?' + queryString)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(done);
    }

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors
     */
    it('should return valid result for ?rankType=competitors (file #1)', function (done) {
        assertResponse("rankType=competitors", "expected_top_marathon_1", done);
    });


    /**
     * /v2/data/marathon/statistics/tops?rankType=schools
     */
    it('should return valid result for ?rankType=schools (file #2)', function (done) {
        assertResponse("rankType=schools", "expected_top_marathon_2", done);
    });


    /**
     * /v2/data/marathon/statistics/tops?rankType=countries
     */
    it('should return valid result for ?rankType=countries (file #3)', function (done) {
        assertResponse("rankType=countries", "expected_top_marathon_3", done);

    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageSize=2&pageIndex=3
     */
    it('should return valid result for ?rankType=competitors&pageSize=2&pageIndex=3 (file #4)', function (done) {
        assertResponse("rankType=competitors&pageSize=2&pageIndex=3", "expected_top_marathon_4", done);
    });


    /**
     * /v2/data/marathon/statistics/tops?rankType=schools&pageSize=1&pageIndex=2
     */
    it('should return valid result for ?rankType=schools&pageSize=1&pageIndex=2 (file #5)', function (done) {
        assertResponse("rankType=schools&pageSize=1&pageIndex=2", "expected_top_marathon_5", done);
    });


    /**
     * /v2/data/marathon/statistics/tops?rankType=countries&pageSize=1&pageIndex=1
     */
    it('should return valid result for ?rankType=countries&pageSize=1&pageIndex=1 (file #6)', function (done) {
        assertResponse("rankType=countries&pageSize=1&pageIndex=1", "expected_top_marathon_6", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageIndex=-1
     */
    it('should return valid result for ?rankType=competitors&pageIndex=-1 (file #7)', function (done) {
        assertResponse("rankType=competitors&pageIndex=-1", "expected_top_marathon_7", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=xyz
     */
    it("should return error 400 when rankType is not valid value", function (done) {
        assert400("rankType=xyz", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageSize=xyz
     */
    it("should return error 400 when pageSize is not number", function (done) {
        assert400("rankType=competitors&pageSize=xyz", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageSize=0
     */
    it("should return error 400 when pageSize is 0", function (done) {
        assert400("rankType=competitors&pageSize=0", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageSize=-1
     */
    it("should return error 400 when pageSize is -1", function (done) {
        assert400("rankType=competitors&pageSize=-1", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageSize=100000000000000000000
     */
    it("should return error 400 when pageSize is too big number", function (done) {
        assert400("rankType=competitors&pageSize=100000000000000000000", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageSize=1.123
     */
    it("should return error 400 when pageSize is float number", function (done) {
        assert400("rankType=competitors&pageSize=1.123", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageIndex=xyz
     */
    it("should return error 400 when pageIndex is not number", function (done) {
        assert400("rankType=competitors&pageIndex=xyz", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageIndex=0
     */
    it("should return error 400 when pageIndex is 0", function (done) {
        assert400("rankType=competitors&pageIndex=0", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageIndex=-2
     */
    it("should return error 400 when pageIndex is -2", function (done) {
        assert400("rankType=competitors&pageIndex=-2", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageIndex=100000000000000000000
     */
    it("should return error 400 when pageIndex is too big number", function (done) {
        assert400("rankType=competitors&pageIndex=100000000000000000000", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageIndex=1.123
     */
    it("should return error 400 when pageIndex is float number", function (done) {
        assert400("rankType=competitors&pageIndex=1.123", done);
    });

    /**
     * /v2/data/marathon/statistics/tops?rankType=competitors&pageIndex=1
     */
    it("should return error 400 when pageIndex is set and pageSize is missing", function (done) {
        assert400("rankType=competitors&pageIndex=1", done);
    });
});