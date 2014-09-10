/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author isv
 */
"use strict";

/*global describe, it, before, beforeEach, after, afterEach, __dirname */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var SQL_DIR = __dirname + "/sqls/dataScienceChallenges/";
var EXPECTED_DIR = __dirname + "/test_files/dataScienceChallenges/";

describe('Test Past Data Science Challenges API', function () {

    this.timeout(120000);

    /**
     * Clears the database.
     * 
     * @param {Function<err>} done the callback.
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__clean", 'tcs_dw', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clean", 'topcoder_dw', cb);
            }
        ], done);
    }

    /**
     * This function is run before all tests. Generate tests data.
     * 
     * @param {Function<err>} done the callback.
     */
    before(function (done) {
        async.waterfall([
            clearDb,
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__insert_test_data", "tcs_dw", cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__insert_test_data", "topcoder_dw", cb);
            }
        ], done);
    });

    /**
     * This function is run after all tests. Clean up all data.
     * 
     * @param {Function<err>} done the callback
     */
    after(function (done) {
        clearDb(done);
    });

    /**
     * Tests the Past Data Science Challenges action against failure test case. Posts a request for getting the list of
     * past Data Science challenges based on specified filter settings and expects the server to respond with HTTP
     * response of specified status providing the specified expected error details.
     *
     * @param {String} pageIndex - page index parameter.
     * @param {String} pageSize - page size parameter.
     * @param {String} sortColumn - sort column name parameter.
     * @param {String} sortOrder - sort order parameter.
     * @param {String} dateFrom - submission end FROM parameter.
     * @param {String} dateTo - submission end TO parameter.
     * @param {Number} expectedStatusCode - status code for HTTP response expected to be returned from server.
     * @param {String} expectedErrorMessage - error message expected to be returned from server.
     * @param {Function} callback - a callback to be called when test finishes.
     */
    function testFailureScenario(pageIndex, pageSize, sortColumn, sortOrder, dateFrom, dateTo, expectedStatusCode,
                                 expectedErrorMessage, callback) {
        var queryParams = '?';
        if (pageIndex !== null) {
            queryParams += 'pageIndex=' + pageIndex;
        }
        if (pageSize !== null) {
            queryParams += '&pageSize=' + pageSize;
        }
        if (sortColumn !== null) {
            queryParams += '&sortColumn=' + sortColumn;
        }
        if (sortOrder !== null) {
            queryParams += '&sortOrder=' + sortOrder;
        }
        if (dateFrom !== null) {
            queryParams += '&submissionEndFrom=' + dateFrom;
        }
        if (dateTo !== null) {
            queryParams += '&submissionEndTo=' + dateTo;
        }

        request(API_ENDPOINT)
            .get('/v2/data/data-science/challenges/past' + queryParams)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(expectedStatusCode)
            .end(function (err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                var body = res.body;
                assert.equal(body.error.details, expectedErrorMessage);
                callback();
            });
    }

    /**
     * Tests the Past Data Science Challenges action against successful test case. Posts a request for getting the list
     * of past Data Science challenges based on specified filter settings and expects the server to respond with HTTP
     * response of 200 status and response matching the content of specified ile.
     *
     * @param {String} pageIndex - page index parameter.
     * @param {String} pageSize - page size parameter.
     * @param {String} sortColumn - sort column name parameter.
     * @param {String} sortOrder - sort order parameter.
     * @param {String} dateFrom - submission end FROM parameter.
     * @param {String} dateTo - submission end TO parameter.
     * @param {Number} expectedResultFile - a name of file with content of expected result.
     * @param {Function} callback - a callback to be called when test finishes.
     */
    function testSuccessScenario(pageIndex, pageSize, sortColumn, sortOrder, dateFrom, dateTo, expectedResultFile, callback) {
        var queryParams = '?';
        if (pageIndex !== null) {
            queryParams += 'pageIndex=' + pageIndex;
        }
        if (pageSize !== null) {
            queryParams += '&pageSize=' + pageSize;
        }
        if (sortColumn !== null) {
            queryParams += '&sortColumn=' + sortColumn;
        }
        if (sortOrder !== null) {
            queryParams += '&sortOrder=' + sortOrder;
        }
        if (dateFrom !== null) {
            queryParams += '&submissionEndFrom=' + dateFrom;
        }
        if (dateTo !== null) {
            queryParams += '&submissionEndTo=' + dateTo;
        }

        request(API_ENDPOINT)
            .get('/v2/data/data-science/challenges/past' + queryParams)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                var body = res.body,
                    expected = require(EXPECTED_DIR + expectedResultFile + '.json');

                delete body.serverInformation;
                delete body.requesterInformation;

                assert.deepEqual(body, expected, "Wrong response returned for " + expectedResultFile);

                callback();
            });
    }

    // Failure test cases
    it('Negative pageIndex parameter', function (done) {
        testFailureScenario(-90, null, null, null, null, null, 400, 'pageIndex should be equal to -1 or greater than 0',
            done);
    });

    it('Zero pageIndex parameter', function (done) {
        testFailureScenario(0, null, null, null, null, null, 400, 'pageIndex should be equal to -1 or greater than 0',
            done);
    });

    it('Non-number pageIndex parameter', function (done) {
        testFailureScenario('a', null, null, null, null, null, 400, 'pageIndex should be number.',
            done);
    });

    it('Too large pageIndex parameter', function (done) {
        testFailureScenario(2147483648, null, null, null, null, null, 400, 'pageIndex should be less or equal to 2147483647.',
            done);
    });

    it('Negative pageSize parameter', function (done) {
        testFailureScenario(1, -90, null, null, null, null, 400, 'pageSize should be positive.', done);
    });

    it('Zero pageSize parameter', function (done) {
        testFailureScenario(1, 0, null, null, null, null, 400, 'pageSize should be positive.', done);
    });

    it('Non-number pageSize parameter', function (done) {
        testFailureScenario(1, 'a', null, null, null, null, 400, 'pageSize should be number.', done);
    });

    it('Too large pageSize parameter', function (done) {
        testFailureScenario(1, 2147483648, null, null, null, null, 400, 'pageSize should be less or equal to 2147483647.',
            done);
    });

    it('Wrong sortColumn parameter', function (done) {
        testFailureScenario(1, 10, 'ddd', null, null, null, 400, 'sortColumn should be an element of challengetype,'
            + 'challengename,challengeid,numsubmissions,numregistrants,registrationstartdate,submissionenddate,'
            + 'challengecommunity,postingdate.', done);
    });

    it('Wrong sortOrder parameter', function (done) {
        testFailureScenario(1, 10, 'challengeId', 'misc', null, null, 400, 'sortOrder should be an element of asc,desc.',
            done);
    });

    it('Wrong submissionEndFrom parameter', function (done) {
        testFailureScenario(1, 10, 'challengeId', 'asc', 'xdsdsds', null, 400,
            'Invalid submissionEndFrom. Expected format is YYYY-MM-DD', done);
    });

    it('Wrong submissionEndTo parameter', function (done) {
        testFailureScenario(1, 10, 'challengeId', 'asc', '2010-01-01', 'cididi', 400,
            'Invalid submissionEndTo. Expected format is YYYY-MM-DD', done);
    });

    it('Wrong submissionEndFrom - submissionEndTo parameters range', function (done) {
        testFailureScenario(1, 10, 'challengeId', 'asc', '2010-01-01', '2009-01-01', 400,
            'submissionEndFrom must be before submissionEndTo', done);
    });

    it('No filtering', function (done) {
        testSuccessScenario(null, null, null, null, null, null, 'expected_no_filter', done);
    });

    it('Filtering by submission end from', function (done) {
        testSuccessScenario(null, null, null, null, '2014-01-01', null, 'expected_submission_end_from', done);
    });

    it('Filtering by submission end to', function (done) {
        testSuccessScenario(null, null, null, null, null, '2014-01-01', 'expected_submission_end_to', done);
    });

    it('Filtering by submission end from and to', function (done) {
        testSuccessScenario(null, null, null, null, '2010-06-25', '2010-06-27', 'expected_submission_end_from_to', done);
    });


    it('Sorting by challengeType', function (done) {
        testSuccessScenario(null, null, 'challengeType', null, null, null, 'expected_sorting_by_challengeType', done);
    });

    it('Sorting by challengeName', function (done) {
        testSuccessScenario(null, null, 'challengeName', null, null, null, 'expected_sorting_by_challengeName', done);
    });

    it('Sorting by challengeId', function (done) {
        testSuccessScenario(null, null, 'challengeId', null, null, null, 'expected_sorting_by_challengeId', done);
    });

    it('Sorting by numSubmissions', function (done) {
        testSuccessScenario(null, null, 'numSubmissions', null, null, null, 'expected_sorting_by_numSubmissions', done);
    });

    it('Sorting by numRegistrants', function (done) {
        testSuccessScenario(null, null, 'numRegistrants', null, null, null, 'expected_sorting_by_numRegistrants', done);
    });

    it('Sorting by registrationStartDate', function (done) {
        testSuccessScenario(null, null, 'registrationStartDate', null, null, null, 'expected_sorting_by_registrationStartDate', done);
    });

    it('Sorting by submissionEndDate', function (done) {
        testSuccessScenario(null, null, 'submissionEndDate', null, null, null, 'expected_sorting_by_submissionEndDate', done);
    });

    it('Sorting by challengeCommunity', function (done) {
        testSuccessScenario(null, null, 'challengeCommunity', null, null, null, 'expected_sorting_by_challengeCommunity', done);
    });

    it('Sorting by postingDate', function (done) {
        testSuccessScenario(null, null, 'postingDate', null, null, null, 'expected_sorting_by_postingDate', done);
    });

    it('Sorting in ascending order', function (done) {
        testSuccessScenario(null, null, 'postingDate', 'asc', null, null, 'expected_sorting_by_postingDate_ascending', done);
    });

    it('No paging requested explicitly', function (done) {
        testSuccessScenario(-1, null, null, null, null, null, 'expected_no_paging', done);
    });

    it('Pagination requested', function (done) {
        testSuccessScenario(2, 2, null, null, null, null, 'expected_paging', done);
    });

    it('Full set of parameters set', function (done) {
        testSuccessScenario(1, 3, 'challengeId', 'asc', '2014-01-01', '2015-01-01', 'expected_full', done);
    });
});
