/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
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
var SQL_DIR = __dirname + "/sqls/createCustomer/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId;
var SECRET = require('../config/tc-config').tcConfig.oauthClientSecret;
var jwt = require('jsonwebtoken');

describe('Create new customer', function () {

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
     * Test POST /v2/platform/customer when user is not logged-in
     * should return 401 error
     */
    it('should return 401 error when not logged-in', function (done) {
        var req = request(API_ENDPOINT)
            .post('/v2/platform/customer')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(401);

        req.send({ name: 'client_name_101', customerNumber: '101'})
            .end(function (err, resp) {
                assertError(err, resp, "Authentication details missing or incorrect.", done);
            });
    });

    /**
     * Test POST /v2/platform/customer when user is not an admin
     * should return 403 error
     */
    it('should return 403 error when user is not admin', function (done) {
        var req = getRequest('/v2/platform/customer', user124764, 403);

        req.send({ name: 'client_name_102', customerNumber: '102'})
            .end(function (err, resp) {
                assertError(err, resp, "Only admin members are allowed to create a new customer.", done);
            });
    });

    /**
     * Test POST /v2/platform/customer when name is empty after trimming
     * should return 400 error
     */
    it('should return 400 error when name is empty', function (done) {
        var req = getRequest('/v2/platform/customer', user124764, 400);

        req.send({ name: '         \t\t   \n\n ', customerNumber: '102'})
            .end(function (err, resp) {
                assertError(err, resp, "name cannot be empty.", done);
            });
    });

    /**
     * Test POST /v2/platform/customer when customer number is empty after trimming
     * should return 400 error
     */
    it('should return 400 error when customer number is empty', function (done) {
        var req = getRequest('/v2/platform/customer', user124764, 400);

        req.send({ name: 'blahah', customerNumber: '    \t   \t \n   \t'})
            .end(function (err, resp) {
                assertError(err, resp, "customerNumber cannot be empty.", done);
            });
    });

    /**
     * Test POST /v2/platform/customer when name is too long
     * should return 400 error
     */
    it('should return 400 error when name is too long', function (done) {
        var req = getRequest('/v2/platform/customer', user124764, 400);

        req.send({ name: 'fkasdfkasjdhf;alksdf8;askjbkjsdbfkjnaskdbfanmsdbv,mabsndkjfhaskdfna,sdfsdfss', customerNumber: '102'})
            .end(function (err, resp) {
                assertError(err, resp, "Customer Name is too long.", done);
            });
    });

    /**
     * Test POST /v2/platform/customer when customerName is too long
     * should return 400 error
     */
    it('should return 400 error when customerName is too long', function (done) {
        var req = getRequest('/v2/platform/customer', user124764, 400);

        req.send({ name: 'shotName', customerNumber: 'reallyLooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooongCustomerNumber'})
            .end(function (err, resp) {
                assertError(err, resp, "Customer Number is too long.", done);
            });
    });

    /**
     * Test POST /v2/platform/customer when client with name and customerName already exists
     * should return 400 error
     */
    it('should return 400 error when name and customerName already exists', function (done) {
        var req = getRequest('/v2/platform/customer', user132456, 400);

        req.send({ name: 'existingName', customerNumber: 'existingCustomerNumber'})
            .end(function (err, resp) {
                assertError(err, resp, "Client with this name and customer number already exists.", done);
            });
    });

    /**
     * Test POST /v2/platform/customer when client with name already exists
     * should return 400 error
     */
    it('should return 400 error when name already exists', function (done) {
        var req = getRequest('/v2/platform/customer', user132456, 400);

        req.send({ name: 'anotherExistingName', customerNumber: 'asdfhajdsfh'})
            .end(function (err, resp) {
                assertError(err, resp, "Client with this name already exists.", done);
            });
    });

    /**
     * Test POST /v2/platform/customer when client with customerName already exists
     * should return 400 error
     */
    it('should return 400 error when customerName already exists', function (done) {
        var req = getRequest('/v2/platform/customer', user132456, 400);

        req.send({ name: 'blahijsmshhs', customerNumber: 'anotherExistingCustomerNumber'})
            .end(function (err, resp) {
                assertError(err, resp, "Client with this customer number already exists.", done);
            });
    });

    /**
     * Test POST /v2/platform/customer for success
     * The record in client, address, contact, address_relation and contact_relation should be created properly
     * Also, the records in alient_audit, address_audit and contact_audit must be created properly
     * should return 20 error
     */
    it('should return 200 when client created properly', function (done) {
        var req = getRequest('/v2/platform/customer', user132456, 200);

        req.send({ name: 'clientABC', customerNumber: 'customerNumberDEF'})
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }

                var clientId = resp.body.clientId;
                assert.isDefined(clientId, "ClientId not generated properly.");
                assert.isNotNull(clientId, "ClientId must not be null.");

                async.waterfall([
                    function (cb) {
                        //Make sure the entry in client table is inserted properly
                        var sql = "* from client where client_id = " + clientId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            assert.equal(result.length, 1, "Exactly one row must be returned");
                            var expected = {
                                client_id: resp.body.clientId,
                                name: 'clientABC',
                                customer_number: 'customerNumberDEF',
                                company_id: 1,
                                payment_term_id: 1,
                                status: 1,
                                salestax: 0,
                                is_deleted: 0,
                                creation_user: "132456",
                                modification_user: "132456"
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date', 'start_date', 'end_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected client did not match.');

                            //Also make sure that code_name, client_status_id and cmc_account_id are null
                            assert.isUndefined(result[0].code_name, "code_name must not be present because it is null.");
                            assert.isUndefined(result[0].client_status_id, "client_status_id must not be present because it is null.");
                            assert.isUndefined(result[0].cmc_account_id, "cmc_account_id must not be present because it is null.");

                            //Also make sure that the start_date and end_date are 3 years apart
                            var startDate = new Date(result[0].start_date);
                            var expectedEndDate = startDate.addYears(3);
                            var actualEndDate = new Date(result[0].end_date);
                            assert.isTrue(actualEndDate.equals(expectedEndDate), "Dates must be 3 years apart.");

                            cb();
                        });
                    }, function (cb) {
                        //Make sure the entry in client_audit table is created properly
                        var sql = "* from client_audit where client_id = " + clientId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }

                            //NOTE - This would be 2 if we had inserted into the audit table ourselves
                            assert.equal(result.length, 1, "Exactly one row must be returned");

                            var expected = {
                                audit_action_id: 1,
                                client_id: clientId,
                                name: 'clientABC',
                                company_id: 1,
                                creation_user: "132456",
                                modification_user: "132456"
                            }, actual = _.omit(result[0], ['creation_date', 'modification_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected client_audit did not match.');
                            cb();
                        });
                    }, function (cb) {
                        //Make sure the entry in address_relation table is inserted properly
                        var sql = "* from address_relation where entity_id = " + clientId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            assert.equal(result.length, 1, "Exactly one row must be returned");
                            var expected = {
                                entity_id: clientId,
                                address_type_id: 2,
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
                        var sql = "* from contact_relation where entity_id = " + clientId;
                        testHelper.runSqlSelectQuery(sql, "time_oltp", function (err, result) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            assert.equal(result.length, 1, "Exactly one row must be returned");
                            var expected = {
                                entity_id: clientId,
                                contact_type_id: 2,
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
