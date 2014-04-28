/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author  Ghost_141
 */
'use strict';
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var _ = require('underscore');
var request = require('supertest');
var assert = require('chai').assert;
var expect = require('chai').expect;
var async = require('async');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/reviewOpportunities/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Review Opportunities API', function () {
    this.timeout(60000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_get_software_studio_review_opportunities_error_message');

    /**
     * create a http request and test it.
     * @param {String} url - the request url.
     * @param {Number} expectStatus - the expected response status code.
     * @param {Function} cb - the call back function.
     */
    function createGetRequest(url, expectStatus, cb) {
        request(API_ENDPOINT)
            .get(url)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(expectStatus)
            .end(cb);
    }

    /**
     * Assert the bad request
     * @param {String} url - the request url.
     * @param {Number} expectStatus - the expected response status code.
     * @param {String} expectMessage - the expected error message.
     * @param {Function} cb - the call back function.
     */
    function assertBadCall(url, expectStatus, expectMessage, cb) {
        createGetRequest(url, expectStatus, function (err, result) {
            if (err) {
                cb(err);
                return;
            }
            assert.equal(result.body.error.details, expectMessage, 'invalid error message');
            cb();
        });
    }

    describe('--Software Review Opportunities API--', function () {
        var URL = '/v2/develop/reviewOpportunities';
        /**
         * Clear database
         * @param {Function<err>} done the callback
         */
        function clearDb(done) {
            async.waterfall([
                function (cb) {
                    testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__clean', 'tcs_catalog', cb);
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

        /**
         * Assert the response.
         * @param err the error.
         * @param result the actual result.
         * @param filePath the expected response.
         * @param cb the callback.
         */
        function assertResponse(err, result, filePath, cb) {
            if (err) {
                cb(err);
                return;
            }
            var expected = require('../test/test_files/' + filePath),
                actual = testHelper.getTrimmedData(result.res.text);
            actual.data.forEach(function (item) {
                assert.isTrue(_.isDate(new Date(item.reviewStart)));
                assert.isTrue(_.isDate(new Date(item.reviewEnd)));
                delete item.reviewStart;
                delete item.reviewEnd;
            });
            assert.deepEqual(actual, expected, 'invalid response');
            cb();
        }

        /**
         * Test when only pageSize is set.
         */
        it('should return success results. The pageSize is set but the pageIndex is not set.', function (done) {
            createGetRequest(URL + '?pageSize=10', 200, done);
        });

        /**
         * Test when only pageIndex is set.
         */
        it('should return success results. The pageIndex is set but the pageSize is not set.', function (done) {
            createGetRequest(URL + '?pageIndex=1', 200, done);
        });

        /**
         * Test when only sortOrder is set.
         */
        it('should return success results. The sortOrder is set but the sortColumn is not set.', function (done) {
            createGetRequest(URL + '?sortOrder=asc', 200, done);
        });

        /**
         * Test when only sortColumn is set.
         */
        it('should return success results. The sortColumn is set but the sortOrder is not set.', function (done) {
            createGetRequest(URL + '?sortColumn=challengeName', 200, done);
        });

        /**
         * Test when sortOrder is in upper case.
         */
        it('should return success results. The sortOrder is in upper case.', function (done) {
            createGetRequest(URL + '?sortOrder=ASC', 200, done);
        });

        /**
         * Test when sortColumn is in upper case.
         */
        it('should return success results. The sortColumn is in upper case', function (done) {
            createGetRequest(URL + '?sortColumn=REVIEWSTART', 200, done);
        });

        /**
         * Test /v2/reviews/opportunities?pageSize=-1.
         */
        it('should return bad request. The pageSize is negative', function (done) {
            assertBadCall(URL + '?pageSize=-1', 400, errorObject.pageSize.negative, done);
        });

        /**
         * Test /v2/reviews/opportunities?pageSize=0.
         */
        it('should return bad request. The pageSize is zero.', function (done) {
            assertBadCall(URL + '?pageSize=0', 400, errorObject.pageSize.negative, done);
        });

        /**
         * Test /v2/reviews/opportunities?pageSize=abc.
         */
        it('should return bad request. The pageSize is not a number.', function (done) {
            assertBadCall(URL + '?pageSize=abc', 400, errorObject.pageSize.notNumber, done);
        });

        /**
         * Test /v2/reviews/opportunities?pageSize=1.234.
         */
        it('should return bad request. The pageSize is not integer.', function (done) {
            assertBadCall(URL + '?pageSize=1.234', 400, errorObject.pageSize.notInteger, done);
        });

        /**
         * Test /v2/reviews/opportunities?pageSize=2147483648.
         */
        it('should return bad request. The pageSize is larger than 2147483647.', function (done) {
            assertBadCall(URL + '?pageSize=2147483648', 400, errorObject.pageSize.tooBig, done);
        });

        /**
         * Test /v2/reviews/opportunities?pageIndex=-2.
         */
        it('should return bad request. The pageIndex is negative', function (done) {
            assertBadCall(URL + '?pageIndex=-2', 400, errorObject.pageIndex.negative, done);
        });

        /**
         * Test /v2/reviews/opportunities?pageIndex=0.
         */
        it('should return bad request. The pageIndex is zero.', function (done) {
            assertBadCall(URL + '?pageIndex=0', 400, errorObject.pageIndex.negative, done);
        });

        /**
         * Test /v2/reviews/opportunities?pageIndex=abc.
         */
        it('should return bad request. The pageIndex is not a number.', function (done) {
            assertBadCall(URL + '?pageIndex=abc', 400, errorObject.pageIndex.notNumber, done);
        });

        /**
         * Test /v2/reviews/opportunities?pageIndex=1.234.
         */
        it('should return bad request. The pageIndex is not integer.', function (done) {
            assertBadCall(URL + '?pageIndex=1.234', 400, errorObject.pageIndex.notInteger, done);
        });

        /**
         * Test /v2/reviews/opportunities?sortOrder=abc
         */
        it('should return bad request. The sortOrder is invalid.', function (done) {
            assertBadCall(URL + '?sortOrder=abc', 400, errorObject.sortOrder.invalid, done);
        });

        /**
         * Test when sort column is invalid.
         */
        it('should return bad request. The sortColumn is invalid.', function (done) {
            assertBadCall(URL + '?sortColumn=abc', 400, errorObject.sortColumn.invalidForDevelop, done);
        });

        /**
         * Test when challenge type is invalid.
         */
        it('should return bad request. The challengeType is invalid.', function (done) {
            assertBadCall(URL + '?challengeType=abc', 400, errorObject.challengeType.invalidForDevelop, done);
        });

        /**
         * Test when challenge type is a valid studio type.
         */
        it('should return bad request. The challengeType is a valid studio challenge type.', function (done) {
            assertBadCall(URL + '?challengeType=Web Design', 400, errorObject.challengeType.invalidForDevelop, done);
        });

        /**
         * Test when reviewType is invalid.
         */
        it('should return bad request. The challengeType is invalid.', function (done) {
            assertBadCall(URL + '?reviewType=abc', 400, errorObject.reviewType.invalidDevelop, done);
        });

        /**
         * Test when reviewType is a valid value for studio api.
         */
        it('should return bad request. The reviewType is valid value for studio api.', function (done) {
            assertBadCall(URL + '?reviewType=screening', 400, errorObject.reviewType.invalidDevelop, done);
        });

        /**
         * Test when the filter date's type is missing.
         */
        it('should return bad request. The reviewStartDate.type is missing.', function (done) {
            assertBadCall(URL + '?reviewStartDate.firstDate=2014-01-01', 400, errorObject.reviewStartDate.missingType, done);
        });

        /**
         * Test when filter date's firstDate has invalid format.
         */
        it('should return bad request. The reviewStartDate.firstDate is in invalid format.', function (done) {
            assertBadCall(URL + '?reviewStartDate.type=on&reviewStartDate.firstDate=2014.1.1', 400,
                errorObject.reviewStartDate.invalidFormat, done);
        });

        /**
         * Test when filter date's secondDate is missing.
         */
        it('should return bad request. The reviewStartDate.secondDate is missing.', function (done) {
            assertBadCall(URL + '?reviewStartDate.type=BETWEEN_DATES&reviewStartDate.firstDate=2014-01-01', 400,
                errorObject.reviewStartDate.missingSecondDate, done);
        });

        /**
         * Test when reviewPaymentLowerBound is not number.
         */
        it('should return bad request. The reviewPaymentLowerBound is not number.', function (done) {
            assertBadCall(URL + '?reviewPaymentLowerBound=abc', 400, errorObject.reviewPaymentLowerBound.notNumber, done);
        });

        /**
         * Test when reviewPaymentUpperBound is not number.
         */
        it('should return bad request. The reviewPaymentUpperBound is not number.', function (done) {
            assertBadCall(URL + '?reviewPaymentUpperBound=abc', 400, errorObject.reviewPaymentUpperBound.notNumber, done);
        });

        /**
         * Test for success results
         */
        it('should return success results.', function (done) {
            createGetRequest(URL, 200, function (err, result) {
                assertResponse(err, result, 'expected_get_software_review_opportunities_1', done);
            });
        });

        /**
         * Test challengeName column
         */
        it('should return success results. Test sortColumn challengeName.', function (done) {
            createGetRequest(URL + '?sortColumn=challengeName', 200, done);
        });

        /**
         * Test reviewStart column
         */
        it('should return success results. Test sortColumn reviewStart.', function (done) {
            createGetRequest(URL + '?sortColumn=reviewStart', 200, done);
        });

        /**
         * Test reviewEnd column
         */
        it('should return success results. Test sortColumn reviewEnd.', function (done) {
            createGetRequest(URL + '?sortColumn=reviewEnd', 200, done);
        });

        /**
         * Test challengeType column
         */
        it('should return success results. Test sortColumn challengeType.', function (done) {
            createGetRequest(URL + '?sortColumn=challengeType', 200, done);
        });

        /**
         * Test reviewType column
         */
        it('should return success results. Test sortColumn reviewType.', function (done) {
            createGetRequest(URL + '?sortColumn=reviewType', 200, done);
        });

        /**
         * Test numberOfSubmissions column
         */
        it('should return success results. Test sortColumn numberOfSubmissions.', function (done) {
            createGetRequest(URL + '?sortColumn=numberOfSubmissions', 200, done);
        });

        /**
         * Test numberOfReviewPositionsAvailable column
         */
        it('should return success results. Test sortColumn numberOfReviewPositionsAvailable.', function (done) {
            createGetRequest(URL + '?sortColumn=numberOfReviewPositionsAvailable', 200, done);
        });

        /**
         * Test challengeName filter
         */
        it('should return success results. test challengeName filter.', function (done) {
            createGetRequest(URL + '?challengeName=2001', 200, function (err, result) {
                assertResponse(err, result, 'expected_get_software_review_opportunities_2', done);
            });
        });

        /**
         * Test challengeType filter.
         */
        it('should return success results. test challengeType filter.', function (done) {
            createGetRequest(URL + '?challengeType=First2Finish', 200, function (err, result) {
                assertResponse(err, result, 'expected_get_software_review_opportunities_3', done);
            });
        });

        /**
         * Test reviewType filter.
         */
        it('should return success results. test reviewType filter.', function (done) {
            createGetRequest(URL + '?reviewType=Contest Review', 200, function (err, result) {
                assertResponse(err, result, 'expected_get_software_review_opportunities_2', done);
            });
        });

        /**
         * Test reviewPaymentUpperBound filter.
         */
        it('should return success results. test reviewPaymentUpperBound filter.', function (done) {
            createGetRequest(URL + '?reviewPaymentUpperBound=120', 200, function (err, result) {
                assertResponse(err, result, 'expected_get_software_review_opportunities_4', done);
            });
        });

        /**
         * Test reviewPaymentLowerBound filter.
         */
        it('should return success results. test reviewPaymentLowerBound filter.', function (done) {
            createGetRequest(URL + '?reviewPaymentLowerBound=400', 200, function (err, result) {
                assertResponse(err, result, 'expected_get_software_review_opportunities_2', done);
            });
        });

        /**
         * Test date filter.
         */
        it('should return success results. test date filter.', function (done) {
            createGetRequest(URL + '?reviewStartDate.type=after_current_date', 200, function (err, result) {
                assertResponse(err, result, 'expected_get_software_review_opportunities_1', done);
            });
        });

    });

    describe('--Studio Review Opportunities API--', function () {
        var URL = '/v2/design/reviewOpportunities';

        /**
         * Clear database
         * @param {Function<err>} done the callback
         */
        function clearDb(done) {
            async.waterfall([
                function (cb) {
                    testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__clean', 'tcs_catalog', cb);
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

        /**
         * Test when challenge type is a valid studio type.
         */
        it('should return bad request. The challengeType is a valid studio challenge type.', function (done) {
            assertBadCall(URL + '?challengeType=Assembly Competition', 400, errorObject.challengeType.invalidForDesign, done);
        });

        /**
         * Test when sortColumn is invalid for design api.
         */
        it('should return bad request. The sortColumn is invalid.', function (done) {
            assertBadCall(URL + '?sortColumn=reviewStart', 400, errorObject.sortColumn.invalidForDesign, done);
        });

        /**
         * Test success results.
         */
        it('should return success results.', function (done) {
            createGetRequest(URL, 200, function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                var actual = testHelper.getTrimmedData(result.res.text),
                    expected = require('../test/test_files/expected_get_studio_review_opportunities_1');
                actual.data.forEach(function (item) {
                    delete item.round1ScheduledStartDate;
                    delete item.round2ScheduledStartDate;
                });
                assert.deepEqual(actual, expected, 'invalid response');
                done();
            });
        });

        /**
         * Test challengeName column
         */
        it('should return success results. Test sortColumn challengeName.', function (done) {
            createGetRequest(URL + '?sortColumn=challengeName', 200, done);
        });

        /**
         * Test round2ScheduledStartDate column
         */
        it('should return success results. Test sortColumn round2ScheduledStartDate.', function (done) {
            createGetRequest(URL + '?sortColumn=round2ScheduledStartDate', 200, done);
        });

        /**
         * Test round1ScheduledStartDate column
         */
        it('should return success results. Test sortColumn round1ScheduledStartDate.', function (done) {
            createGetRequest(URL + '?sortColumn=round1ScheduledStartDate', 200, done);
        });

        /**
         * Test reviewType column
         */
        it('should return success results. Test sortColumn reviewType.', function (done) {
            createGetRequest(URL + '?sortColumn=reviewType', 200, done);
        });

        /**
         * Test reviewer column
         */
        it('should return success results. Test sortColumn reviewer.', function (done) {
            createGetRequest(URL + '?sortColumn=reviewer', 200, done);
        });

    });

});
