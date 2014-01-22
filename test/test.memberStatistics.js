/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author muzehyun
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach, __dirname */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var SQL_DIR = __dirname + "/sqls/member_statistics/";
var DATABASE_NAME = "tcs_dw";

describe('Test Software Rating History And Distribution API (Success)', function () {
    this.timeout(60000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "tcs_dw__clean", DATABASE_NAME, done);
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
                var files = testHelper.generatePartPaths(SQL_DIR + "tcs_dw__insert_test_data", "", 5);
                testHelper.runSqlFiles(files, DATABASE_NAME, cb);
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
     * This function is run all challenge types.
     * Compares result with expected.
     * @param {Function<err>} done the callback
     */
    function testChallengeType(challengeType, done) {
        var text = fs.readFileSync('test/test_files/member_statistics/expected_history_' + challengeType + '.txt', 'utf8'),
            expected = testHelper.getTrimmedData(text);
        request(API_ENDPOINT)
            .get('/v2/develop/statistics/CevyC/' + challengeType)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                var actual = testHelper.getTrimmedData(result.res.text);
                assert.deepEqual(actual, expected, 'Invalid returned message');
                done(err);
            });
    }

    it('test design challenge types', function (done) {
        testChallengeType('design', done);
    });

    it('test development challenge types', function (done) {
        testChallengeType('development', done);
    });

    it('test conceptualization challenge types', function (done) {
        testChallengeType('conceptualization', done);
    });

    it('test specification challenge types', function (done) {
        testChallengeType('specification', done);
    });

    it('test architecture challenge types', function (done) {
        testChallengeType('architecture', done);
    });

    it('test assembly challenge types', function (done) {
        testChallengeType('assembly', done);
    });

    it('test test_suites challenge types', function (done) {
        testChallengeType('test_suites', done);
    });

    it('test test_scenarios challenge types', function (done) {
        testChallengeType('test_scenarios', done);
    });

    it('test ui_prototypes challenge types', function (done) {
        testChallengeType('ui_prototypes', done);
    });

    it('test ria_build challenge types', function (done) {
        testChallengeType('ria_build', done);
    });

    it('test content_creation challenge types', function (done) {
        testChallengeType('content_creation', done);
    });

    it('test empty history', function (done) {
        var text = fs.readFileSync('test/test_files/member_statistics/expected_empty_history.txt', 'utf8'),
            expected = testHelper.getTrimmedData(text);
        request(API_ENDPOINT)
            .get('/v2/develop/statistics/nohistory/content_creation')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                var actual = testHelper.getTrimmedData(result.res.text);
                assert.deepEqual(expected, actual, 'Invalid returned message');
                done(err);
            });
    });
});

describe('Test Software Rating History And Distribution API (Fail)', function () {
    this.timeout(60000); // The api with testing remote db could be quit slow

    it('invalid challengeType', function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/statistics/CevyC/invalid')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(done);
    });

    it('invalid handle', function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/statistics/wronghandle/design')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(done);
    });
});
