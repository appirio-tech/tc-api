/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author  Ghost_141
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
var SQL_DIR = __dirname + "/sqls/studio_review_opportunity_details/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Studio Review Opportunity Details API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow

    var errorMessage = fs.readFileSync(__dirname + '/test_files/expected_get_studio_review_opportunity_details_error_message.txt', 'utf8'),
        errorObject = JSON.parse(errorMessage);
    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", "tcs_catalog", cb);
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
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__insert_test_data', 'tcs_catalog', cb);
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

    it('should return Not Found Error. the contest didn\'t exist', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities/2002')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function (err, result) {
                if (!err) {
                    assert(result.body.error.details.trim(), "The studio contest is not found.", 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Success results.', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities/4001')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('should return Bad Request. contest id is not number', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities/abc')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.challengeId.number, 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. contest id is 0', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities/0')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.challengeId.positive, 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. contest id is negative', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities/-1')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.challengeId.positive, 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. contest id is too big', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities/2147483648')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.challengeId.too_big, 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

});
