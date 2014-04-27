/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author isv
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
var _ = require("underscore");

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/reportsGetClientActiveChallengeCosts/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';


describe('Get Client Active Challenge Costs API', function () {
    this.timeout(60000);     // The api with testing remote db could be quit slow

    var adminHeader, memberHeader;

    /**
     * Create authorization header before each test
     * @param {Function<err>} done the callback
     */
    beforeEach(function (done) {
        adminHeader = "Bearer " + testHelper.getAdminJwt();
        memberHeader = "Bearer " + testHelper.getMemberJwt();
        done();
    });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", "tcs_catalog", cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "common_oltp__clean", "common_oltp", cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "corporate_oltp__clean", 'corporate_oltp', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "time_oltp__clean", "time_oltp", cb);
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
            function (cb) {
                clearDb(cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "time_oltp__insert_test_data", "time_oltp", cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "corporate_oltp__insert_test_data", 'corporate_oltp', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "common_oltp__insert_test_data", "common_oltp", cb);
            }, function (cb) {
                var files = testHelper.generatePartPaths(SQL_DIR + "tcs_catalog__insert_test_data", "", 11);
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


    /**
     * Create request and return it
     * @param {String} queryString the query string. Optional
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(queryString, statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/reports/client/activeChallenges' + (queryString || ""))
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect('Content-Type', /json/).expect(statusCode);
    }

    /**
     * Make request to member get client challenge costs API and compare response with given file
     * @param {String} queryString the query string. Optional
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} file - the file which contains expected response
     * @param {Function<err>} done - the callback
     */
    function assertResponse(queryString, authHeader, file, done) {
        createRequest(queryString, 200, authHeader)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                var i,
                    item,
                    body = res.body,
                    expected = require("./test_files/" + file);

                delete body.serverInformation;
                delete body.requesterInformation;

                for (i = 0; i < body.active.length; i = i + 1) {
                    item = body.active[i];
                    assert.isTrue(_.isDate(new Date(item.postingDate)));
                    assert.isTrue(_.isDate(new Date(item.completionDate)));
                    assert.isTrue(_.isDate(new Date(item.registrationEndDate)));
                    assert.isTrue(_.isDate(new Date(item.submissionEndDate)));
                    assert.isTrue(_.isDate(new Date(item.checkpointEndDate)));
                    assert.isTrue(_.isDate(new Date(item.lastModificationDate)));
                    assert.isTrue(_.isDate(new Date(item.challengeScheduledEndDate)));
                    delete item.postingDate;
                    delete item.completionDate;
                    delete item.registrationEndDate;
                    delete item.submissionEndDate;
                    delete item.checkpointEndDate;
                    delete item.lastModificationDate;
                    delete item.challengeScheduledEndDate;

                }

                assert.deepEqual(body, expected, "Invalid response");
                done();
            });
    }

    /**
     * Get response and assert response from /reports/client/costs
     * @param {String} queryString the query string. Optional
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(queryString, statusCode, authHeader, errorMessage, done) {
        createRequest(queryString, statusCode, authHeader)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                if (errorMessage) {
                    assert.ok(res.body);
                    assert.ok(res.body.error);
                    if (statusCode === 200) {
                        assert.equal(res.body.error, errorMessage);
                    } else {
                        assert.equal(res.body.error.details, errorMessage);
                    }
                }
                done();
            });
    }

    it("should return results for /reports/client/activeCosts?clientId=9000001", function (done) {
        assertResponse("?clientId=9000001",
            adminHeader, "expected_get_client_active_challenge_costs_1.json", done);
    });

    it("should return results for /reports/client/activeCosts?sfdcAccountId=90000010", function (done) {
        assertResponse("?sfdcAccountId=90000010",
            adminHeader, "expected_get_client_active_challenge_costs_1.json", done);
    });

    it("should return results for /reports/client/activeCosts?customerNumber=900000100", function (done) {
        assertResponse("?customerNumber=900000100",
            adminHeader, "expected_get_client_active_challenge_costs_1.json", done);
    });

    it("should return results for /reports/client/activeCosts?clientId=9000002&sfdcAccountId=90000020&customerNumber=900000200",
        function (done) {
            assertResponse("?clientId=9000002&sfdcAccountId=90000020&customerNumber=900000200",
                adminHeader, "expected_get_client_active_challenge_costs_2.json", done);
        });

    it("should return results for /reports/client/activeCosts?clientId=9000002&customerNumber=900000200",
        function (done) {
            assertResponse("?clientId=9000002&customerNumber=900000200",
                adminHeader, "expected_get_client_active_challenge_costs_2.json", done);
        });

    it("should return results for /reports/client/activeCosts?sfdcAccountId=90000020&customerNumber=900000200",
        function (done) {
            assertResponse("?sfdcAccountId=90000020&customerNumber=900000200",
                adminHeader, "expected_get_client_active_challenge_costs_2.json", done);
        });

    it("should return results for /reports/client/activeCosts?clientId=9000002&sfdcAccountId=90000020",
        function (done) {
            assertResponse("?clientId=9000002&sfdcAccountId=90000020",
                adminHeader, "expected_get_client_active_challenge_costs_2.json", done);
        });

    it("should return results for /reports/client/activeCosts",
        function (done) {
            assertResponse("", adminHeader, "expected_get_client_active_challenge_costs_3.json", done);
        });


    it("should return error if user is anon", function (done) {
        assertErrorResponse("?clientId=9000002&sfdcAccountId=90000020", 401, null, null, done);
    });

    it("should return error if user is member", function (done) {
        assertErrorResponse("?clientId=9000002&sfdcAccountId=90000020", 403, memberHeader, null, done);
    });

    it("should return error if clientId is not a number", function (done) {
        assertErrorResponse("?clientId=a", 400, adminHeader, null, done);
    });

    it("should return error if clientId is a float number", function (done) {
        assertErrorResponse("?clientId=1.4", 400, adminHeader, null, done);
    });

    it("should return error if clientId is 0", function (done) {
        assertErrorResponse("?clientId=0", 400, adminHeader, null, done);
    });

    it("should return error if clientId is -1", function (done) {
        assertErrorResponse("?clientId=-1", 400, adminHeader, null, done);
    });

    it("should return error if clientId is not found", function (done) {
        assertErrorResponse("?clientId=123456789", 404, adminHeader, null, done);
    });

});
