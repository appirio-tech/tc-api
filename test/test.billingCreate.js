/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author kurtrips
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true, nomen: true, vars: true */

/**
 * Module dependencies.
 */
require('datejs');
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");
var _ = require("underscore");

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/createBilling/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId;
var SECRET = require('../config/tc-config').tcConfig.oauthClientSecret;
var jwt = require('jsonwebtoken');

describe('Create new billing', function () {

    /**
    * Users that we have setup.
    */
    var user124764 = 'facebook|fb124764',
        user132456 = 'facebook|fb132456';

     /**
     * Return the authentication header to be used for the given user.
     * @param {Object} user the user to authenticate
     */
    function getAuthHeader(user) {
        var authHeader = "Bearer " + jwt.sign({sub: user}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
        return authHeader;
    }

    /**
     * Creates a Request object using the given URL.
     * Sets the Authorization header for the given user.
     * Sets the expected response code using the expectedStatusCode parameter
     * @param {String} url the url to connect
     * @param {Object} user the user to authenticate
     * @param {Number} expectedStatusCode the expected status code of the response
     */
    function getRequest(url, user, expectedStatusCode) {
        var req = request(API_ENDPOINT)
            .post(url)
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user))
            .expect('Content-Type', /json/)
            .expect(expectedStatusCode);
        return req;
    }


    this.timeout(120000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "time_oltp__clean", "time_oltp", cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "common_oltp__clean", "common_oltp", cb);
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
                testHelper.runSqlFile(SQL_DIR + "common_oltp__insert_test_data", "common_oltp", cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + "time_oltp__insert_test_data", "time_oltp", cb);
            }
        ], done);
    });

    /**
     * This function is run after all tests.
     * @param {Function<err>} done the callback
     */
    after(function (done) {
        clearDb(done);
    });

    /**
     * Checks that the response has the correct error message
     * @param err the error (if any) in the response
     * @param resp the response
     * @param message the expected user friendly error message
     * @param done the callback to call when we are done
     */
    function assertError(err, resp, message, done) {
        if (err) {
            done(err);
            return;
        }
        assert.equal(resp.body.error.details, message);
        done();
    }

    /**
     * Test POST /v2/platform/billing when user is not logged-in
     * should return 401 error
     */
    it('should return 401 error when not logged-in', function (done) {
        var req = request(API_ENDPOINT)
            .post('/v2/platform/billing')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(401);

        req.send({ billingAccountName: 'billing_name_101', customerNumber: '101'})
            .end(function (err, resp) {
                assertError(err, resp, "Authentication details missing or incorrect.", done);
            });
    });

    /**
     * Test POST /v2/platform/billing when user is not an admin
     * should return 403 error
     */
    it('should return 403 error when user is not admin', function (done) {
        var req = getRequest('/v2/platform/billing', user124764, 403);

        req.send({ billingAccountName: 'billing_name_102', customerNumber: '102'})
            .end(function (err, resp) {
                assertError(err, resp, "Only admin members are allowed to create a new billing.", done);
            });
    });

    /**
     * Test POST /v2/platform/billing when billingAccountName is empty after trimming
     * should return 400 error
     */
    it('should return 400 error when billingAccountName is empty', function (done) {
        var req = getRequest('/v2/platform/billing', user124764, 400);

        req.send({ billingAccountName: '         \t\t   \n\n ', customerNumber: '102'})
            .end(function (err, resp) {
                assertError(err, resp, "billingAccountName cannot be empty.", done);
            });
    });

    /**
     * Test POST /v2/platform/billing when billingAccountName is too long
     * should return 400 error
     */
    it('should return 400 error when billingAccountName is too long', function (done) {
        var req = getRequest('/v2/platform/billing', user124764, 400);

        req.send({ billingAccountName: 'fkasdfkasjdhf;alksdf8;askjbkjsdbfkjnaskdbfanmsdbv,mabsndkjfhaskdfna,sdfsdfss', customerNumber: '102'})
            .end(function (err, resp) {
                assertError(err, resp, "billingAccountName is too long.", done);
            });
    });

    /**
     * Test POST /v2/platform/billing when billing with billingAccountName already exists
     * should return 400 error
     */
    it('should return 400 error when billingAccountName already exists', function (done) {
        var req = getRequest('/v2/platform/billing', user132456, 400);

        req.send({ billingAccountName: 'existingBillingAccount', customerNumber: 'blaah233wq'})
            .end(function (err, resp) {
                assertError(err, resp, "Billing with this name already exists.", done);
            });
    });

    /**
     * Test POST /v2/platform/billing when client with customerName does not exist
     * should return 400 error
     */
    it('should return 400 error when client with customerName does not exist', function (done) {
        var req = getRequest('/v2/platform/billing', user132456, 400);

        req.send({ billingAccountName: 'blahijsmshhs', customerNumber: 'noSuchCustomerNumber'})
            .end(function (err, resp) {
                assertError(err, resp, "Client with this customer number must already exist but was not found.", done);
            });
    });

    /**
     * Test POST /v2/platform/billing for success
     * The record in billing, address, contact, address_relation and contact_relation should be created properly
     * Also, the records in alient_audit, address_audit and contact_audit must be created properly
     * should return 200
     */
    it('should return 200 when billing created properly', function (done) {
        var req = getRequest('/v2/platform/billing', user132456, 200), billingId;

        req.send({ billingAccountName: 'billingABC', customerNumber: 'customerNumberDEF'})
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }

                billingId = resp.body.billingAccountId;
                assert.isDefined(billingId, "BillingAccountId not generated properly.");
                assert.isNotNull(billingId, "BillingAccountId must not be null.");


                req.send({ billingAccountName: 'modifiedName', customerNumber: 'customerNumberDEF', billingAccountId: billingId})
                    .end(function (err, resp) {
                        if (err) {
                            done(err);
                            return;
                        }

                        billingId = resp.body.billingAccountId;
                        assert.isDefined(billingId, "BillingAccountId not generated properly.");
                        assert.isNotNull(billingId, "BillingAccountId must not be null.");

                        async.waterfall([
                            function (cb) {
                                //Make sure the entry in project table is inserted properly
                                var sql = "* from project where project_id = " + billingId;
                                testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                                    if (err) {
                                        cb(err);
                                        return;
                                    }
                                    assert.equal(result.length, 1, "Exactly one row must be returned");
                                    var expected = {
                                        project_id: billingId,
                                        name: 'modifiedName',
                                        company_id: 1,
                                        payment_terms_id: 1,
                                        description: 'modifiedName',
                                        po_box_number: 'null',
                                        active: 1,
                                        sales_tax: 0,
                                        is_deleted: 0,
                                        creation_user: "132456",
                                        modification_user: "132456",
                                        is_manual_prize_setting: 1
                                    }, actual = _.omit(result[0], ['creation_date', 'modification_date', 'start_date', 'end_date']);
                                    assert.deepEqual(actual, expected, 'Actual and Expected billing did not match.');

                                    //Also make sure that fields that should be null are not present
                                    assert.isUndefined(result[0].project_status_id, "project_status_id must not be present because it is null.");
                                    assert.isUndefined(result[0].client_id, "client_id must not be present because it is null.");
                                    assert.isUndefined(result[0].parent_project_id, "parent_project_id must not be present because it is null.");
                                    assert.isUndefined(result[0].budget, "budget must not be present because it is null.");

                                    //Also make sure that the start_date and end_date are 3 years apart
                                    var startDate = new Date(result[0].start_date);
                                    var expectedEndDate = startDate.addYears(3);
                                    var actualEndDate = new Date(result[0].end_date);
                                    assert.isTrue(actualEndDate.equals(expectedEndDate), "Dates must be 3 years apart.");

                                    cb(null, result[0].start_date, result[0].end_date);
                                });
                            }, function (startDate, endDate, cb) {
                                //Make sure the entry in project_audit table is created properly
                                var sql = "* from project_audit where project_id = " + billingId;
                                testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                                    if (err) {
                                        cb(err);
                                        return;
                                    }

                                    //NOTE - This would be 2 if we had inserted into the audit table ourselves
                                    assert.equal(result.length, 1, "Exactly one row must be returned");

                                    var expected = {
                                        audit_action_id: 1,
                                        project_id: billingId,
                                        name: 'billingABC',
                                        company_id: 1,
                                        description: 'billingABC',
                                        start_date: startDate,
                                        end_date: endDate,
                                        creation_user: "132456",
                                        modification_user: "132456"
                                    }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                                    assert.deepEqual(actual, expected, 'Actual and Expected project_audit did not match.');
                                    cb();
                                });
                            }, function (cb) {
                                //Make sure the entry in client_project table is created properly
                                var sql = "* from client_project where project_id = " + billingId + " and client_id = 78602";
                                testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                                    if (err) {
                                        cb(err);
                                        return;
                                    }

                                    assert.equal(result.length, 1, "Exactly one row must be returned");
                                    var expected = {
                                        client_id: 78602,
                                        project_id: billingId,
                                        creation_user: "132456",
                                        modification_user: "132456"
                                    }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                                    assert.deepEqual(actual, expected, 'Actual and Expected client_project did not match.');
                                    cb();
                                });
                            }, function (cb) {
                                //Make sure the entry in client_project_audi table is created properly
                                var sql = "* from client_project_audit where project_id = " + billingId + " and client_id = 78602";
                                testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                                    if (err) {
                                        cb(err);
                                        return;
                                    }

                                    assert.equal(result.length, 1, "Exactly one row must be returned");
                                    var expected = {
                                        audit_action_id: 1,
                                        client_id: 78602,
                                        project_id: billingId,
                                        creation_user: "132456",
                                        modification_user: "132456"
                                    }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                                    assert.deepEqual(actual, expected, 'Actual and Expected client_project_audit did not match.');
                                    cb();
                                });
                            }, function (cb) {
                                //Make sure the entry in address_relation table is inserted properly
                                var sql = "* from address_relation where entity_id = " + billingId;
                                testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                                    if (err) {
                                        cb(err);
                                        return;
                                    }
                                    assert.equal(result.length, 1, "Exactly one row must be returned");
                                    var expected = {
                                        entity_id: billingId,
                                        address_type_id: 1,
                                        creation_user: "132456",
                                        modification_user: "132456"
                                    }, actual = _.omit(result[0], ['creation_date', 'modification_date', 'address_id']);
                                    assert.deepEqual(actual, expected, 'Actual and Expected address_relation did not match.');
                                    assert.isDefined(result[0].address_id, "Address ID must be present.");
                                    cb(null, result[0].address_id);
                                });
                            }, function (addressId, cb) {
                                //Make sure the entry in address table is inserted properly
                                var sql = "* from address where address_id = " + addressId;
                                testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                                    if (err) {
                                        cb(err);
                                        return;
                                    }
                                    assert.equal(result.length, 1, "Exactly one row must be returned");
                                    var expected = {
                                        address_id: addressId,
                                        line1: "line1",
                                        line2: "line2",
                                        city: "city",
                                        country_name_id: 840,
                                        state_name_id: 7,
                                        zip_code: "06033",
                                        creation_user: "132456",
                                        modification_user: "132456"
                                    }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                                    assert.deepEqual(actual, expected, 'Actual and Expected address did not match.');
                                    cb(null, addressId);
                                });
                            }, function (addressId, cb) {
                                //Make sure the entry in address_audit table is created properly
                                var sql = "* from address_audit where address_id = " + addressId;
                                testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                                    if (err) {
                                        cb(err);
                                        return;
                                    }

                                    //NOTE - This would be 2 if we had inserted into the audit table ourselves
                                    assert.equal(result.length, 1, "Exactly one row must be returned");

                                    var expected = {
                                        audit_action_id: 1,
                                        address_id: addressId,
                                        line1: "line1",
                                        line2: "line2",
                                        city: "city",
                                        state_name_id: 7,
                                        zip_code: "06033",
                                        creation_user: "132456",
                                        modification_user: "132456"
                                    }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                                    assert.deepEqual(actual, expected, 'Actual and Expected address_audit did not match.');
                                    cb();
                                });
                            }, function (cb) {
                                //Make sure the entry in contact_relation table is inserted properly
                                var sql = "* from contact_relation where entity_id = " + billingId;
                                testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                                    if (err) {
                                        cb(err);
                                        return;
                                    }
                                    assert.equal(result.length, 1, "Exactly one row must be returned");
                                    var expected = {
                                        entity_id: billingId,
                                        contact_type_id: 1,
                                        creation_user: "132456",
                                        modification_user: "132456"
                                    }, actual = _.omit(result[0], ['creation_date', 'modification_date', 'contact_id']);
                                    assert.deepEqual(actual, expected, 'Actual and Expected contact_relation did not match.');
                                    assert.isDefined(result[0].contact_id, "Contact ID must be present.");
                                    cb(null, result[0].contact_id);
                                });
                            }, function (contactId, cb) {
                                //Make sure the entry in contact table is inserted properly
                                var sql = "* from contact where contact_id = " + contactId;
                                testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                                    if (err) {
                                        cb(err);
                                        return;
                                    }
                                    assert.equal(result.length, 1, "Exactly one row must be returned");
                                    var expected = {
                                        contact_id: contactId,
                                        first_name: "fname",
                                        last_name: "lname",
                                        phone: "8675309",
                                        email: "tc@topcoder.com",
                                        creation_user: "132456",
                                        modification_user: "132456"
                                    }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                                    assert.deepEqual(actual, expected, 'Actual and Expected contact did not match.');
                                    cb(null, contactId);
                                });
                            }, function (contactId, cb) {
                                //Make sure the entry in contact_audit table is created properly
                                var sql = "* from contact_audit where contact_id = " + contactId;
                                testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                                    if (err) {
                                        cb(err);
                                        return;
                                    }

                                    //NOTE - This would be 2 if we had inserted into the audit table ourselves
                                    assert.equal(result.length, 1, "Exactly one row must be returned");

                                    var expected = {
                                        audit_action_id: 1,
                                        contact_id: contactId,
                                        first_name: "fname",
                                        last_name: "lname",
                                        phone: "8675309",
                                        email: "tc@topcoder.com",
                                        creation_user: "132456",
                                        modification_user: "132456"
                                    }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                                    assert.deepEqual(actual, expected, 'Actual and Expected contact_audit did not match.');
                                    cb();
                                });
                            }
                        ], done);
                    });

                async.waterfall([
                    function (cb) {
                        //Make sure the entry in project table is inserted properly
                        var sql = "* from project where project_id = " + billingId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            assert.equal(result.length, 1, "Exactly one row must be returned");
                            var expected = {
                                project_id: billingId,
                                name: 'billingABC',
                                company_id: 1,
                                payment_terms_id: 1,
                                description: 'billingABC',
                                po_box_number: 'null',
                                active: 1,
                                sales_tax: 0,
                                is_deleted: 0,
                                creation_user: "132456",
                                modification_user: "132456",
                                is_manual_prize_setting: 1
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date', 'start_date', 'end_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected billing did not match.');

                            //Also make sure that fields that should be null are not present
                            assert.isUndefined(result[0].project_status_id, "project_status_id must not be present because it is null.");
                            assert.isUndefined(result[0].client_id, "client_id must not be present because it is null.");
                            assert.isUndefined(result[0].parent_project_id, "parent_project_id must not be present because it is null.");
                            assert.isUndefined(result[0].budget, "budget must not be present because it is null.");

                            //Also make sure that the start_date and end_date are 3 years apart
                            var startDate = new Date(result[0].start_date);
                            var expectedEndDate = startDate.addYears(3);
                            var actualEndDate = new Date(result[0].end_date);
                            assert.isTrue(actualEndDate.equals(expectedEndDate), "Dates must be 3 years apart.");

                            cb(null, result[0].start_date, result[0].end_date);
                        });
                    }, function (startDate, endDate, cb) {
                        //Make sure the entry in project_audit table is created properly
                        var sql = "* from project_audit where project_id = " + billingId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }

                            //NOTE - This would be 2 if we had inserted into the audit table ourselves
                            assert.equal(result.length, 1, "Exactly one row must be returned");

                            var expected = {
                                audit_action_id: 1,
                                project_id: billingId,
                                name: 'billingABC',
                                company_id: 1,
                                description: 'billingABC',
                                start_date: startDate,
                                end_date: endDate,
                                creation_user: "132456",
                                modification_user: "132456"
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected project_audit did not match.');
                            cb();
                        });
                    }, function (cb) {
                        //Make sure the entry in client_project table is created properly
                        var sql = "* from client_project where project_id = " + billingId + " and client_id = 78602";
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }

                            assert.equal(result.length, 1, "Exactly one row must be returned");
                            var expected = {
                                client_id: 78602,
                                project_id: billingId,
                                creation_user: "132456",
                                modification_user: "132456"
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected client_project did not match.');
                            cb();
                        });
                    }, function (cb) {
                        //Make sure the entry in client_project_audi table is created properly
                        var sql = "* from client_project_audit where project_id = " + billingId + " and client_id = 78602";
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }

                            assert.equal(result.length, 1, "Exactly one row must be returned");
                            var expected = {
                                audit_action_id: 1,
                                client_id: 78602,
                                project_id: billingId,
                                creation_user: "132456",
                                modification_user: "132456"
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected client_project_audit did not match.');
                            cb();
                        });
                    }, function (cb) {
                        //Make sure the entry in address_relation table is inserted properly
                        var sql = "* from address_relation where entity_id = " + billingId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            assert.equal(result.length, 1, "Exactly one row must be returned");
                            var expected = {
                                entity_id: billingId,
                                address_type_id: 1,
                                creation_user: "132456",
                                modification_user: "132456"
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date', 'address_id']);
                            assert.deepEqual(actual, expected, 'Actual and Expected address_relation did not match.');
                            assert.isDefined(result[0].address_id, "Address ID must be present.");
                            cb(null, result[0].address_id);
                        });
                    }, function (addressId, cb) {
                        //Make sure the entry in address table is inserted properly
                        var sql = "* from address where address_id = " + addressId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            assert.equal(result.length, 1, "Exactly one row must be returned");
                            var expected = {
                                address_id: addressId,
                                line1: "line1",
                                line2: "line2",
                                city: "city",
                                country_name_id: 840,
                                state_name_id: 7,
                                zip_code: "06033",
                                creation_user: "132456",
                                modification_user: "132456"
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected address did not match.');
                            cb(null, addressId);
                        });
                    }, function (addressId, cb) {
                        //Make sure the entry in address_audit table is created properly
                        var sql = "* from address_audit where address_id = " + addressId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }

                            //NOTE - This would be 2 if we had inserted into the audit table ourselves
                            assert.equal(result.length, 1, "Exactly one row must be returned");

                            var expected = {
                                audit_action_id: 1,
                                address_id: addressId,
                                line1: "line1",
                                line2: "line2",
                                city: "city",
                                state_name_id: 7,
                                zip_code: "06033",
                                creation_user: "132456",
                                modification_user: "132456"
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected address_audit did not match.');
                            cb();
                        });
                    }, function (cb) {
                        //Make sure the entry in contact_relation table is inserted properly
                        var sql = "* from contact_relation where entity_id = " + billingId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            assert.equal(result.length, 1, "Exactly one row must be returned");
                            var expected = {
                                entity_id: billingId,
                                contact_type_id: 1,
                                creation_user: "132456",
                                modification_user: "132456"
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date', 'contact_id']);
                            assert.deepEqual(actual, expected, 'Actual and Expected contact_relation did not match.');
                            assert.isDefined(result[0].contact_id, "Contact ID must be present.");
                            cb(null, result[0].contact_id);
                        });
                    }, function (contactId, cb) {
                        //Make sure the entry in contact table is inserted properly
                        var sql = "* from contact where contact_id = " + contactId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            assert.equal(result.length, 1, "Exactly one row must be returned");
                            var expected = {
                                contact_id: contactId,
                                first_name: "fname",
                                last_name: "lname",
                                phone: "8675309",
                                email: "tc@topcoder.com",
                                creation_user: "132456",
                                modification_user: "132456"
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected contact did not match.');
                            cb(null, contactId);
                        });
                    }, function (contactId, cb) {
                        //Make sure the entry in contact_audit table is created properly
                        var sql = "* from contact_audit where contact_id = " + contactId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }

                            //NOTE - This would be 2 if we had inserted into the audit table ourselves
                            assert.equal(result.length, 1, "Exactly one row must be returned");

                            var expected = {
                                audit_action_id: 1,
                                contact_id: contactId,
                                first_name: "fname",
                                last_name: "lname",
                                phone: "8675309",
                                email: "tc@topcoder.com",
                                creation_user: "132456",
                                modification_user: "132456"
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected contact_audit did not match.');
                            cb();
                        });
                    }
                ], done);
            });
    });
});
