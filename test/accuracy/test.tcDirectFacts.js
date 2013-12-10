/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author KeSyren, TCSASSEMBLER
 * change in 1.1:
 * - use before and after to setup and clean data
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");

var testHelper = require('../helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/tcDirectFacts/";

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var ACTION = '/v2/platform/statistics';

describe('Get TC Direct Facts', function () {
    this.timeout(30000);

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", "tcs_catalog", done);
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

    describe('GET /v2/platform/statistics', function () {
        var r, active_contests_count, active_members_count, active_projects_count, completed_projects_count,
            prize_purse;
        /// Check if the data are in expected structure and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION).set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                console.log(res.body);
                active_contests_count = res.body[0].active_contests_count;
                active_members_count = res.body[0].active_members_count;
                active_projects_count = res.body[0].active_projects_count;
                completed_projects_count = res.body[0].completed_projects_count;
                prize_purse = res.body[0].prize_purse;
                assert.equal(active_contests_count, 3, "wrong number of active_contests_count");
                assert.equal(active_members_count, 1, "wrong number of active_members_count");
                assert.equal(active_projects_count, 1, "wrong number of active_projects_count");
                assert.equal(completed_projects_count, 3, "wrong number of completed_projects_count");
                assert.equal(prize_purse, 4500, "wrong number of prize_purse");
                done();
            });
        });
    });
});
