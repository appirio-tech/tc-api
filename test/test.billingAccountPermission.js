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
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var moment = require('moment');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/billingAccountPermission/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Billing Account Permission API', function () {
    this.timeout(120000);

    var errorObject = require('../test/test_files/expected_billing_account_permission_error_message'),
        member1 = testHelper.generateAuthHeader({ sub: "ad|132456" }),
        member2 = testHelper.generateAuthHeader({ sub: "ad|132457" }),
        defaultPostData = { users: "heffan" },
        projectManagerCreateDate1,
        projectManagerCreateDate2;

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + 'time_oltp__clean', 'time_oltp', done);
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
     * @param {Number} billingAccountId - the billing account id.
     * @param {Number} expectStatus - the expected request response status.
     * @param {Object} authHeader - the auth header for request.
     * @param {Object} postData - the data post to api endpoint.
     * @param {Function} cb - the call back function.
     */
    function createRequest(billingAccountId, expectStatus, authHeader, postData, cb) {
        var req = request(API_ENDPOINT)
            .post('/v2/platform/billings/' + billingAccountId + '/users')
            .set('Accept', 'application/json');
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        req.expect('Content-Type', /json/)
            .send(postData)
            .expect(expectStatus)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {Number} billingAccountId - the billing account id.
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} authHeader - the request auth header.
     * @param {Object} postData - the data post to api endpoint.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(billingAccountId, expectStatus, errorMessage, authHeader, postData, cb) {
        createRequest(billingAccountId, expectStatus, authHeader, postData, function (err, result) {
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
     * Assert the success response.
     * @param {Number} billingAccountId - the billing account id.
     * @param {Object} authHeader - the request auth header.
     * @param {String} expectResponse - the expected response file name.
     * @param {Object} postData - the data post to api endpoint.
     * @param {Function} cb - the callback function.
     */
    function assertSuccess(billingAccountId, authHeader, expectResponse, postData, cb) {
        createRequest(billingAccountId, 200, authHeader, postData, function (err, res) {
            testHelper.assertResponse(err, res, expectResponse, cb);
        });
    }

    /**
     * Test when caller is anonymous.
     */
    it('should return unauthorized Error. The caller is anonymous.', function (done) {
        assertBadResponse(2001, 401, errorObject.unauthorized, null, defaultPostData, done);
    });

    /**
     * Test when caller is just a member.
     */
    it('should return unauthorized Error. The caller is member.', function (done) {
        assertBadResponse(2001, 403, errorObject.forbidden, member2, defaultPostData, done);
    });

    /**
     * Test when billingAccountId is not number.
     */
    it('should return bad request. The billingAccountId is not number.', function (done) {
        assertBadResponse("abc", 400, errorObject.billingAccountId.notNumber, member1, { users: "heffan" },
            done);
    });

    /**
     * Test when billingAccountId is not integer.
     */
    it('should return bad request. The billingAccountId is not integer.', function (done) {
        assertBadResponse(1.2345, 400, errorObject.billingAccountId.notInteger,
            member1, { users: "heffan" }, done);
    });

    /**
     * Test when billingAccountId is not positive.
     */
    it('should return bad request. The billingAccountId is not positive.', function (done) {
        assertBadResponse(-1, 400, errorObject.billingAccountId.notPositive,
            member1, { users: "heffan" }, done);
    });

    /**
     * Test when billingAccountId is zero.
     */
    it('should return bad request. The billingAccountId is zero.', function (done) {
        assertBadResponse(0, 400, errorObject.billingAccountId.notPositive,
            member1, { users: "heffan" }, done);
    });

    /**
     * Test when billingAccountId is too big.
     */
    it('should return bad request. The billingAccountId is too big.', function (done) {
        assertBadResponse(2147483648, 400, errorObject.billingAccountId.tooBig,
            member1, { users: "heffan" }, done);
    });

    /**
     * The billing account is not existed.
     */
    it('should return bad request. The billingAccount is not existed.', function (done) {
        assertBadResponse(2002, 400, errorObject.billingAccountId.notExist, member1,
            { users: "heffan" }, done);
    });

    /**
     * The user is not in topcoder system.
     */
    it('should return bad request. The user is not exist.', function (done) {
        assertBadResponse(2001, 400, errorObject.notExistedUser, member1,
            { users: "noOne" }, done);
    });


    /**
     * The users are empty string or just spaces.
     */
    it('should return bad request. The users are not valid string.', function (done) {
        assertBadResponse(2001, 400, errorObject.invalidUser, member1, { users: "," }, done);
    });

    it('should return bad request. The users are not valid string.', function (done) {
        assertBadResponse(2001, 400, errorObject.invalidUser, member1, { users: " , " }, done);
    });

    it('should return bad request. The users are not valid string.', function (done) {
        assertBadResponse(2001, 400, errorObject.invalidUser, member1, { users: ",," }, done);
    });

    it('should return bad request. The users are not valid string.', function (done) {
        assertBadResponse(2001, 400, errorObject.invalidUser, member1, { users: " , ," }, done);
    });

    /**
     * The api will insert record into user_account, address, contact table for twight
     * and return an error message for user noOne.
     */
    it('should return success response with failed users array.', function (done) {
        async.waterfall([
            function (cb) {
                assertSuccess(2001, member1, "test_files/expected_billing_account_permission_1.json",
                    { users: "twight,noOne" }, cb);
            },
            function (cb) {
                // Check the data in database.
                async.parallel({
                    userAccount: function (cbx) {
                        testHelper.runSqlSelectQuery(
                            " * " +
                                "FROM user_account ua " +
                                "INNER JOIN address_relation ar ON ar.entity_id = ua.user_account_id AND ar.address_type_id = 4 " +
                                "INNER JOIN address ad ON ad.address_id = ar.address_id " +
                                "INNER JOIN contact_relation cr ON cr.entity_id = ua.user_account_id AND cr.contact_type_id = 4 " +
                                "INNER JOIN contact c ON c.contact_id = cr.contact_id WHERE ua.user_name = 'twight'",
                            "time_oltp",
                            cbx
                        );
                    },
                    projectManager: function (cbx) {
                        testHelper.runSqlSelectQuery(" * FROM project_manager WHERE project_id = 2001", "time_oltp", cbx);
                    }
                }, cb);
            },
            function (res, cb) {
                projectManagerCreateDate1 = res.projectManager[0].creation_date;
                assert.equal(res.userAccount.length, 1, "wrong number of user_account records in database.");
                assert.equal(res.projectManager.length, 1, "wrong number of project_manager records in database.");
                cb();
            }
        ], done);
    });

    /**
     * The request only have twight as user.
     * The twight have the project_manager record in database. So the api should delete old one and insert new one.
     */
    it('should return success response only.', function (done) {
        async.waterfall([
            function (cb) {
                setTimeout(cb, 10000);
            },
            function (cb) {
                assertSuccess(2001, member1, "test_files/expected_billing_account_permission_2.json",
                    { users: "twight" }, cb);
            },
            function (cb) {
                // Check the data in database.
                testHelper.runSqlSelectQuery(" * FROM project_manager WHERE project_id = 2001", "time_oltp", cb);
            },
            function (res, cb) {
                projectManagerCreateDate2 = res[0].creation_date;
                assert.isTrue(moment(projectManagerCreateDate1).isBefore(projectManagerCreateDate2),
                    "the current project manager date should before old one.");
                assert.notEqual(projectManagerCreateDate1, projectManagerCreateDate2, "project manager shouldn't be same.");
                assert.equal(res.length, 1, "wrong number of project_manager records in database.");
                cb();
            }
        ], done);
    });

    /**
     * The user is duplicate.
     */
    it('should return success response. The user is duplicate and api will handle that', function (done) {
        assertSuccess(2001, member1, "test_files/expected_billing_account_permission_2.json",
            { users: "twight,twight" }, done);
    });

    /**
     * There are two valid users.
     */
    it('should return success response. The user is duplicate and api will handle that', function (done) {
        assertSuccess(2001, member1, "test_files/expected_billing_account_permission_3.json",
            { users: "twight,heffan" }, done);
    });
});
