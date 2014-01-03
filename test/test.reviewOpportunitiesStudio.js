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
var SQL_DIR = __dirname + "/sqls/studio_review_opportunities/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Studio Review Opportunities API', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow

    var errorMessage = fs.readFileSync('test/test_files/expected_get_studio_review_opportunities_error_message.txt', 'utf8'),
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

    it('should return Bad Request. pageIndex is not number', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?pageIndex=xxx&pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageIndex.number.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. pageIndex should is 0', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?pageIndex=0&pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageIndex.positive.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. pageIndex should is negative but not -1', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?pageIndex=-2&pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageIndex.positive.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. pageIndex should is too big', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?pageIndex=2147483648&pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageIndex.too_big.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. pageIndex is missing', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageIndex.missing.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. pageSize is not number', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?pageSize=xxx&pageIndex=1')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageSize.number.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. pageSize should is 0', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?pageIndex=1&pageSize=0')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageSize.positive.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. pageSize should is negative', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?pageIndex=1&pageSize=-2')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageSize.positive.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. pageSize should is too big', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?pageSize=2147483648&pageIndex=1')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.pageSize.too_big.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
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
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. sortColumn not a valid column name', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?sortColumn=abc&sortOrder=asc')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.sortColumn.invalid.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Success results. sortColumn is valid but in uppercase', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?sortColumn=REVIEWERPAYMENT&sortOrder=desc')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('should return Success results. sortColumn is valid but in lowercase', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?sortColumn=reviewerpayment&sortOrder=desc')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('should return Bad Request. sortColumn is missing', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?sortOrder=asc')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.sortColumn.missing.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Bad Request. sortOrder not a valid column name', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?sortOrder=abc&sortColumn=type')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.sortOrder.invalid.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Success results. sortOrder is valid but in uppercase', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?sortColumn=type&sortOrder=DESC')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('should return Success results. sortOrder is valid but in lowercase', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?sortColumn=type&sortOrder=desc')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('should return Bad Request. sortOrder is missing', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?sortColumn=type')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(result.body.error.details.trim(), errorObject.sortOrder.missing.trim(), 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Not found', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?pageIndex=100&pageSize=200')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(function (err, result) {
                if (!err) {
                    assert(result.body.error.details.trim(), "No Studio Review Opportunities found.", 'Invalid error message');
                } else {
                    done(err);
                    return;
                }
                done();
            });
    });

    it('should return Success results. paging and soring are all default value', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('should return Success results. paging is set', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?pageIndex=1&pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('should return Success results. sorting is set', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?sortColumn=type&sortOrder=desc')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

    it('should return Success results. sorting and paging are set', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/reviewOpportunities?sortColumn=type&sortOrder=desc&pageIndex=1&pageSize=10')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(done);
    });

});
