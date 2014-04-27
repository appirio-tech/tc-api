/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author  TCSASSEMBLER
 */
'use strict';
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var _ = require('underscore');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/challengeCosts/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var BASE_URL = '/v2/reports/costs';

describe('Get Challenge Costs API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_get_challenge_costs_error_message'),
        admin = "ad|132456",
        member = "ad|132457",
        adminAuthHeader = testHelper.generateAuthHeader({ sub: admin }),
        memberAuthHeader = testHelper.generateAuthHeader({ sub: member });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'time_oltp__clean', 'time_oltp', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__clean', 'informixoltp', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__clean', 'tcs_catalog', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'corporate_oltp__clean', 'corporate_oltp', cb);
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
                testHelper.runSqlFile(SQL_DIR + 'corporate_oltp__insert_test_data', 'corporate_oltp', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__insert_test_data', 'tcs_catalog', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__insert_test_data', 'informixoltp', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'time_oltp__insert_test_data', 'time_oltp', cb);
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
     * Create a http request and test it.
     * @param {String} url - the request url.
     * @param {Number} expectStatus - the expected request response status.
     * @param {Object} authHeader - the auth header for request.
     * @param {Function} cb - the call back function.
     */
    function createRequest(url, expectStatus, authHeader, cb) {
        var req = request(API_ENDPOINT)
            .get(url)
            .set('Accept', 'application/json');
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        req.expect('Content-Type', /json/)
            .expect(expectStatus)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {String} url - the request url
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} authHeader - the request auth header.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(url, expectStatus, errorMessage, authHeader, cb) {
        createRequest(url, expectStatus, authHeader, function (err, result) {
            if (!err) {
                assert.equal(result.body.error.details, errorMessage, 'invalid error message');
            } else {
                cb(err);
                return;
            }
            cb();
        });
    }

    /**
     * Test /v2/reports/costs/1900.01.01/2014-12-12
     */
    it('should return bad request. The startDate is in bad format(1900.01.01).', function (done) {
        assertBadResponse(BASE_URL + '/1900.01.01' + '/2014-12-12', 400,
            errorObject.inputParameter.invalidStartDate, adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1/2014-12-12
     */
    it('should return bad request. The startDate is in bad format(1900-1).', function (done) {
        assertBadResponse(BASE_URL + '/1900-1' + '/2014-12-12', 400,
            errorObject.inputParameter.invalidStartDate, adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-ab-1/2014-1-1
     */
    it('should return bad request. The startDate is in bad format(1900-ab-1).', function (done) {
        assertBadResponse(BASE_URL + '/1900-ab-1' + '/2014-1-1', 400, errorObject.inputParameter.invalidStartDate,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-13-1/2014-1-1
     */
    it('should return bad request. The startDate is in bad format(1900-13-1).', function (done) {
        assertBadResponse(BASE_URL + '/1900-13-1' + '/2014-1-1', 400, errorObject.inputParameter.invalidStartDate,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-01-01/2014.1.1
     */
    it('should return bad request. The endDate is in bad format(2014.1.1).', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1' + '/2014.1.1', 400, errorObject.inputParameter.invalidEndDate,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1
     */
    it('should return bad request. The endDate is in bad format(2014-1).', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1' + '/2014-1', 400, errorObject.inputParameter.invalidEndDate,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-ab-1
     */
    it('should return bad request. The startDate is in bad format(1900-ab-1).', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1' + '/2014-ab-1', 400, errorObject.inputParameter.invalidEndDate,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-13-1
     */
    it('should return bad request. The startDate is in bad format(2014-13-1).', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1' + '/2014-13-1', 400, errorObject.inputParameter.invalidEndDate,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/2014-1-1/2013-12-31
     */
    it('should return bad request. The startDate should before endDate or at same date', function (done) {
        assertBadResponse(BASE_URL + '/2014-1-1' + '/2013-12-31', 400, errorObject.inputParameter.wrongSeq,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?clientId=-1
     */
    it('should return bad request. The clientId should not be negative.', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?clientId=-1', 400, errorObject.clientId.negative,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?clientId=abc
     */
    it('should return bad request. The clientId should be a number', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?clientId=abc', 400, errorObject.clientId.notNumber,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?clientId=2147483648
     */
    it('should return bad request. The clientId it too large', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?clientId=2147483648', 400, errorObject.clientId.tooBig,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?clientId=1.2345
     */
    it('should return bad request. The clientId should be integer.', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?clientId=1.2345', 400, errorObject.clientId.notInteger,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?challengeId=-1
     */
    it('should return bad request. The challengeId should not be negative.', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?challengeId=-1', 400, errorObject.challengeId.negative,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?challengeId=abc
     */
    it('should return bad request. The challengeId should be a number', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?challengeId=abc', 400, errorObject.challengeId.notNumber,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?challengeId=2147483648
     */
    it('should return bad request. The challengeId it too large', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?challengeId=2147483648', 400, errorObject.challengeId.tooBig,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?challengeId=1.2345
     */
    it('should return bad request. The challengeId should be integer.', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?challengeId=1.2345', 400, errorObject.challengeId.notInteger,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?billingId=-1
     */
    it('should return bad request. The billingId should not be negative.', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?billingId=-1', 400, errorObject.billingId.negative,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?billingId=abc
     */
    it('should return bad request. The billingId should be a number', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?billingId=abc', 400, errorObject.billingId.notNumber,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?billingId=2147483648
     */
    it('should return bad request. The billingId it too large', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?billingId=2147483648', 400, errorObject.billingId.tooBig,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?billingId=1.2345
     */
    it('should return bad request. The billingId should be integer.', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?billingId=1.2345', 400, errorObject.billingId.notInteger,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?projectId=-1
     */
    it('should return bad request. The projectId should not be negative.', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?projectId=-1', 400, errorObject.projectId.negative,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?projectId=abc
     */
    it('should return bad request. The projectId should be a number', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?projectId=abc', 400, errorObject.projectId.notNumber,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?projectId=2147483648
     */
    it('should return bad request. The projectId it too large', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?projectId=2147483648', 400, errorObject.projectId.tooBig,
            adminAuthHeader, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2014-1-1?projectId=1.2345
     */
    it('should return bad request. The projectId should be integer.', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1/2014-1-1' + '?projectId=1.2345', 400, errorObject.projectId.notInteger,
            adminAuthHeader, done);
    });

    /**
     * Test member call api.
     */
    it('should return unauthorized error. The caller is not a admin', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1' + '/2014-1-1', 401, errorObject.auth, memberAuthHeader, done);
    });

    /**
     * Test a anon call api.
     */
    it('should return unauthorized error. The caller is not a tc member.', function (done) {
        assertBadResponse(BASE_URL + '/1900-1-1' + '/2014-1-1', 401, errorObject.auth, null, done);
    });

    /**
     * Test /v2/reports/costs/1900-1-1/2999-1-1.
     */
    it('should return success results.', function (done) {
        var expected = require('../test/test_files/expected_get_challenge_costs_1');
        createRequest(BASE_URL + '/1900-1-1/2999-1-1', 200, adminAuthHeader, function (err, result) {
            if (!err) {
                var actual = testHelper.getTrimmedData(result.res.text);
                actual.history.forEach(function (item) {
                    assert.isTrue(_.isDate(new Date(item.launchDate)));
                    assert.isTrue(_.isDate(new Date(item.completionDate)));
                    delete item.launchDate;
                    delete item.completionDate;
                });
                assert.deepEqual(actual, expected, 'invalid response');
            } else {
                done(err);
                return;
            }
            done();
        });
    });

    /**
     * Test /v2/reports/costs/2014-1-1/2999-1-1
     */
    it('should return success results. Test date range function.', function (done) {
        var expected = require('../test/test_files/expected_get_challenge_costs_2');
        createRequest(BASE_URL + '/2014-1-1/2999-1-1', 200, adminAuthHeader, function (err, result) {
            if (!err) {
                var actual = testHelper.getTrimmedData(result.res.text);
                actual.history.forEach(function (item) {
                    assert.isTrue(_.isDate(new Date(item.launchDate)));
                    assert.isTrue(_.isDate(new Date(item.completionDate)));
                    delete item.launchDate;
                    delete item.completionDate;
                });
                assert.deepEqual(actual, expected, 'invalid response');
            } else {
                done(err);
                return;
            }
            done();
        });
    });

    /**
     * Test /v2/reports/costs/2014
     */
    it('should return success results. When challengeId is set the other id parameter will loss efficacy.', function (done) {
        async.parallel({
            noClientId: function (cb) {
                createRequest(BASE_URL + '/1900-1-1/2999-1-1?challengeId=10001', 200, adminAuthHeader, cb);
            },
            clientId: function (cb) {
                createRequest(BASE_URL + '/1900-1-1/2999-1-1?challengeId=10001&clientId=10000', 200, adminAuthHeader, cb);
            }
        }, function (err, results) {
            if (err) {
                done(err);
                return;
            }
            assert.deepEqual(testHelper.getTrimmedData(results.noClientId.res.text),
                testHelper.getTrimmedData(results.clientId.res.text), 'invalid response');
            done();
        });
    });

    /**
     * Test 404 not found.
     */
    it('should return 404 not found. The challenge is not existed.', function (done) {
        createRequest(BASE_URL + '/2015-1-1/2016-1-1', 404, adminAuthHeader, done);
    });

});
