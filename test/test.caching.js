/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';


describe('Test Cache', function () {
    this.timeout(30000); // The api with testing remote db could be quit slow


    /**
     * Reset hit counter, call /test/cache/reset
     * @param {Function<err>} done the callback
     */
    function resetCounter(done) {
        request(API_ENDPOINT)
            .get('/test/cache/reset')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err) {
                done(err);
            });
    }
    /**
     * Get hit counter, call /test/cache/hits
     * @param {Function<err, counts>} done the callback
     */
    function getCounter(done) {
        request(API_ENDPOINT)
            .get('/test/cache/hits')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                done(err, res.body.hits);
            });
    }

    /**
     * Get response from /test/cache
     * @param {String} query the query string. Optional
     * @param {Function<err, object>} done the callback
     */
    function getResponse(query, done) {
        if (typeof query === 'function') {
            done = query;
            query = "";
        }
        request(API_ENDPOINT)
            .get('/test/cache?' + query)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                assert.ifError(err);
                assert.ok(res.body);
                assert.ok(res.body.test);
                var response = res.body;
                delete response.serverInformation;
                delete response.requestorInformation;
                done(err, response);
            });
    }


    /**
     * Get response from /test/cache/disabled
     * @param {Function<err>} done the callback
     */
    function getResponseDisabledCache(done) {
        request(API_ENDPOINT)
            .get('/test/cache/disabled')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err) {
                done(err);
            });
    }

    /**
     * Get response from /test/cache/error
     * @param {Function<err>} done the callback
     */
    function getErrorResponse(done) {
        request(API_ENDPOINT)
            .get('/test/cache/error')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(500)
            .end(function (err, res) {
                assert.ifError(err);
                assert.ok(res.body);
                done(err);
            });
    }

    /**
     * Call /test/cache/reset to reset hits counter before each test
     * @param {Function<err>} done the callback
     */
    beforeEach(function (done) {
        resetCounter(done);
    });

    /**
     * Generate random string
     * @param {Number} length - the number of characters to generate. Optional. Default 10.
     * @return {String} the generated string
     */
    function generateParam(length) {
        var text = "",
            i,
            possible = "abcdefghijklmnopqrstuvwxyz";
        if (!length) {
            length = 10;
        }
        for (i = 0; i < length; i = i + 1) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    /**
     * Test if caching is working correct.
     * Call /test/cache/
     * Check hits, should be 1
     * Call /test/cache/ should return same result as before
     * Check hits again, should be 1 also
     */
    it('should return cached response', function (done) {
        var response,
            paramOne = generateParam();
        async.waterfall([
            function (cb) {
                getResponse("paramOne=" + paramOne, cb);
            },
            function (res, cb) {
                response = res;
                cb();
            },
            getCounter,
            function (hits, cb) {
                assert.equal(1, hits);
                cb();
            },
            function (cb) {
                getResponse("paramOne=" + paramOne, cb);
            },
            function (res, cb) {
                assert.equal(JSON.stringify(response), JSON.stringify(res));
                cb();
            },
            getCounter,
            function (hits, cb) {
                assert.equal(1, hits);
                cb();
            }
        ], done);
    });


    /**
     * Test if caching is disabled when cacheEnabled is set to false
     * Call /test/cache/disabled
     * Check hits, should be 1
     * Call /test/cache/disabled
     * Check hits, should be 2
     */
    it('should not cache when cacheEnabled is false ', function (done) {
        async.waterfall([
            getResponseDisabledCache,
            getCounter,
            function (hits, cb) {
                assert.equal(1, hits);
                cb();
            },
            getResponseDisabledCache,
            getCounter,
            function (hits, cb) {
                assert.equal(2, hits);
                cb();
            }
        ], done);
    });

    /**
     * Test if caching is working correct when query parameters are in different order.
     * Call /test/cache?paramOne=a&paramTwo=b
     * Check hits, should be 1
     * Call /test/cache?paramTwo=b&paramOne=a should return same result as before
     * Check hits again, should be 1 also
     */
    it("should return cached response for different query order", function (done) {
        var response,
            paramOne = generateParam(),
            paramTwo = generateParam();
        async.waterfall([
            function (cb) {
                getResponse("paramOne=" + paramOne + "&paramTwo=" + paramTwo, cb);
            },
            function (res, cb) {
                response = res;
                cb();
            },
            getCounter,
            function (hits, cb) {
                assert.equal(1, hits);
                cb();
            },
            function (cb) {
                getResponse("paramTwo=" + paramTwo + "&paramOne=" + paramOne, cb);
            },
            function (res, cb) {
                assert.equal(JSON.stringify(response), JSON.stringify(res));
                cb();
            },
            getCounter,
            function (hits, cb) {
                assert.equal(1, hits);
                cb();
            }
        ], done);
    });


    /**
     * Test if caching is working correct when query parameters contain extra parameter
     * Call /test/cache?paramOne=a&paramTwo=b
     * Check hits, should be 1
     * Call /test/cache?paramOne=a&paramTwo=b&extraQueryParm=c should return same result as before
     * Check hits again, should be 1 also
     */
    it("should return cached response and ignore extra query parameters", function (done) {
        var response,
            paramOne = generateParam(),
            paramTwo = generateParam(),
            paramExtra = generateParam(),
            query = "paramOne=" + paramOne + "&paramTwo=" + paramTwo;
        async.waterfall([
            function (cb) {
                getResponse(query, cb);
            },
            function (res, cb) {
                response = res;
                cb();
            },
            getCounter,
            function (hits, cb) {
                assert.equal(1, hits);
                cb();
            },
            function (cb) {
                getResponse(query + "&extraQueryParm=" + paramExtra, cb);
            },
            function (res, cb) {
                assert.equal(JSON.stringify(response), JSON.stringify(res));
                cb();
            },
            getCounter,
            function (hits, cb) {
                assert.equal(1, hits);
                cb();
            }
        ], done);
    });

    /**
     * Test if caching is working correct when query parameters have different case
     * Call /test/cache?paramOne=a
     * Check hits, should be 1
     * Call /test/cache?paramOne=A should return same result as before
     * Check hits again, should be 1 also
     */
    it("query string values are not case sensitive", function (done) {
        var response,
            paramOne = generateParam();
        async.waterfall([
            function (cb) {
                getResponse("paramOne=" + paramOne + "aaa", cb);
            },
            function (res, cb) {
                response = res;
                cb();
            },
            getCounter,
            function (hits, cb) {
                assert.equal(1, hits);
                cb();
            },
            function (cb) {
                getResponse("paramOne=" + paramOne + "AAA", cb);
            },
            function (res, cb) {
                assert.equal(JSON.stringify(response), JSON.stringify(res));
                cb();
            },
            getCounter,
            function (hits, cb) {
                assert.equal(1, hits);
                cb();
            }
        ], done);
    });

    /**
     * Test if errors are cached
     * Call /test/cache/error
     * Check hits, should be 1
     * Call /test/cache/error
     * Check hits, should be 2
     * ... etc.
     */
    it("errors should be not cached", function (done) {
        async.waterfall([
            getErrorResponse,
            getCounter,
            function (hits, cb) {
                assert.equal(1, hits);
                cb();
            },
            getErrorResponse,
            getCounter,
            function (hits, cb) {
                assert.equal(2, hits);
                cb();
            },
            getErrorResponse,
            getCounter,
            function (hits, cb) {
                assert.equal(3, hits);
                cb();
            }
        ], done);
    });

});