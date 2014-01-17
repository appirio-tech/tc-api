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
var SQL_DIR = __dirname + "/sqls/studioTops/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Studio Tops API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow

    var errorMessage = fs.readFileSync('test/test_files/expected_get_studio_tops_error_message.txt', 'utf8'),
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
                var files = testHelper.generatePartPaths(SQL_DIR + "tcs_catalog__insert_test_data", "", 4);
                testHelper.runSqlFiles(files, "tcs_catalog", cb);
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

    function check(type, done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/' + type + '?pageIndex=1&pageSize=2')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                assert.ifError(err);
                var body = res.body;
                assert.equal(body.total, 5, 'total are not equal');
                assert.equal(body.pageIndex, 1, 'pageIndex are not equal');
                assert.equal(body.pageSize, 2, 'pageSize are not equal');
                assert.ok(body.data);
                assert.equal(body.data.length, 2);
                assert.equal(body.data[0].rank, 1, 'rank are not equal');
                assert.equal(body.data[0].handle, 'heffan', 'handle are not equal');
                assert.equal(body.data[0].userId, 132456, 'userId are not equal');
                assert.equal(body.data[0].numberOfWinningSubmissions, 5, 'numberOfWinningSubmissions are not equal');
                assert.equal(body.data[1].rank, 2, 'rank are not equal');
                assert.equal(body.data[1].handle, 'super', 'handle are not equal');
                assert.equal(body.data[1].userId, 132457, 'userId are not equal');
                assert.equal(body.data[1].numberOfWinningSubmissions, 4, 'numberOfWinningSubmissions are not equal');
                done();
            });
    }

    it('test banners_icons category', function (done) {
        check("banners_icons", done);
    });

    it('test web_design category', function (done) {
        check("web_design", done);
    });
    it('test wireframes category', function (done) {
        check("wireframes", done);
    });
    it('test logo_design category', function (done) {
        check("logo_design", done);
    });
    it('test print_presentation category', function (done) {
        check("print_presentation", done);
    });

    it('test idea_generation category', function (done) {
        check("idea_generation", done);
    });

    it('test widget_or_mobile_screen_design category', function (done) {
        check("widget_or_mobile_screen_design", done);
    });
    it('test front_end_flash category', function (done) {
        check("front_end_flash", done);
    });
    it('test application_front_end_design category', function (done) {
        check("application_front_end_design", done);
    });
    it('test other category', function (done) {
        check("other", done);
    });

    it('should return results. challengeType is in uppercase', function (done) {
        check("WEB_DESIGN", done);
    });

    it('should return Bad Request. Wrong type', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/zncjsajhdbf')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.challengeType.wrong_type, 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

    it('should return Bad Request. pageIndex is not number', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/web_design?pageIndex=xxx&pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageIndex.number.trim(), 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

    it('should return Bad Request. pageIndex should is 0', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/web_design?pageIndex=0&pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageIndex.positive.trim(), 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

    it('should return Bad Request. pageIndex should is negative but not -1', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/web_design?pageIndex=-2&pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageIndex.positive.trim(), 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

    it('should return Bad Request. pageIndex should is too big', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/web_design?pageIndex=2147483648&pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageIndex.too_big.trim(), 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

    it('should return Bad Request. pageIndex is missing', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/web_design?pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageIndex.missing.trim(), 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

    it('should return Bad Request. pageSize is not number', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/web_design?pageSize=xxx&pageIndex=1')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageSize.number.trim(), 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

    it('should return Bad Request. pageSize should is 0', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/web_design?pageIndex=1&pageSize=0')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageSize.positive.trim(), 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

    it('should return Bad Request. pageSize should is negative', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/web_design?pageIndex=1&pageSize=-2')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageSize.positive.trim(), 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

    it('should return Bad Request. pageSize should is too big', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/web_design?pageSize=2147483648&pageIndex=1')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageSize.too_big.trim(), 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

    it('should return Bad Request. pageSize is missing', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/web_design?pageIndex=1')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageSize.missing.trim(), 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

    it('should return Not found', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/statistics/tops/web_design?pageIndex=100&pageSize=200')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function (err, result) {
                if (!err) {
                    assert(result.body.error.details.trim(), "No results found for Studio Tops.", 'Invalid error message');
                } else {
                    return done(err);
                }
                done();
            });
    });

});
