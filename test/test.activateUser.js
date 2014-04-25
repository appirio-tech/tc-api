/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author muzehyun
 */
'use strict';
/*global describe, it, before, beforeEach, after, afterEach, __dirname */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var expect = require('chai').expect;
var async = require('async');
var _ = require('underscore');
var testHelper = require('./helpers/testHelper');
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var SQL_DIR = __dirname + '/sqls/activateUser/';
var IllegalArgumentError = require('../errors/IllegalArgumentError');

/**
 * dummy api object to be used for helper method
 */
var api = {
    log: function (str) {
        console.log(str);
        return;
    },
    helper: {
        checkDefined : function (obj, objName) {
            if (_.isNull(obj) || _.isUndefined(obj)) {
                return new IllegalArgumentError(objName + ' should not be null or undefined');
            }
            return null;
        }
    }
};

/**
 * ldap param
 */
var ldapParams = {
    userId: '901005',
    handle: 'newuser5',
    password: 'password'
};

describe('Test Activate User API', function () {
    this.timeout(60000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'common_oltp__clean', 'common_oltp', cb);
            },
            function (cb) {
                require('../initializers/ldapHelper').ldapHelper(api, function () {
                    api.ldapHelper.removeMemberProfileLDAPEntry('901005', function () {
                        cb();   // ignore non-exist error
                    });
                });
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
                testHelper.runSqlFile(SQL_DIR + 'common_oltp__insert_test_data', 'common_oltp', cb);
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
     * @param {String} code the code request parameters
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(code, statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/users/activate?code=' + code)
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect(statusCode);
    }

    /**
     * Make request
     * @param {String} code the code request parameters
     * @param {String} authHeader the Authorization header. Optional
     * @param {Function<err>} done - the callback
     */
    function assertResponse(code, authHeader, done) {
        createRequest(code, 200, authHeader)
            .end(function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                assert.ok(result.body);
                done();
            });
    }

    /**
     * Get response and assert response
     * @param {String} code the code request parameters
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(code, statusCode, authHeader, errorMessage, done) {
        createRequest(code, statusCode, authHeader)
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

    /**
     * It should return 400 error for invalid code
     */
    it('should return 400 error for invalid code', function (done) {
        assertErrorResponse('99DVQSN1234', 400, null, 'Invalid activation code', done);
    });

    /**
     * It should return 200 error for empty spaces
     */
    it('should return 200 error for emptyspaces', function (done) {
        assertErrorResponse('   ', 200, null, 'Error: code is a required parameter for this action', done);
    });

    /**
     * It should return 200 error for zero length
     */
    it('should return 200 error for zero length', function (done) {
        assertErrorResponse('', 200, null, 'Error: code is a required parameter for this action', done);
    });

    /**
     * It should return 400 error for invalid code
     */
    it('should return 400 error for invalid code', function (done) {
        assertErrorResponse('1', 400, null, 'Invalid activation code', done);
    });

    /**
     * It should return 400 error for already activated user 901001
     */
    it('should return 400 error for already activated user', function (done) {
        assertErrorResponse('BHWX0OQX', 400, null, 'User has been activated', done);
    });

    /**
     * It should return 400 error for no email entry 901002
     */
    it('should return 400 error for no email entry', function (done) {
        assertErrorResponse('BHWXM4CV', 400, null, 'Invalid activation code', done);
    });

    /**
     * It should return 400 error for email is already activated 901003
     */
    it('should return 400 error for email is already activated', function (done) {
        assertErrorResponse('BHWY7JZ6', 400, null, 'Email has been activated', done);
    });

    /**
     * It should return 400 error for user exist but code not match 901004
     */
    it('should return 400 error for user exist but code not match', function (done) {
        assertErrorResponse('BHWYSZK2', 400, null, 'Invalid activation code', done);
    });

    /**
     * It should return 500 error for no ldap entry 901005
     */
    it('should return 500 error for no ldap entry', function (done) {
        async.waterfall([
            function (cb) {
                require('../initializers/ldapHelper').ldapHelper(api, function () {
                    api.ldapHelper.removeMemberProfileLDAPEntry('901005', function () {
                        cb();   // ignore non-exist error
                    });
                });
            },
            function (cb) {
                assertErrorResponse('BHWZEF6D', 500, null, null, cb);
            }
        ], done);
    });

    /**
     * It should return 200 success for valid activation code 901005
     */
    it('should return 200 success for valid activation code', function (done) {
        async.waterfall([
            function (cb) {
                require('../initializers/ldapHelper').ldapHelper(api, function () {
                    api.ldapHelper.addMemberProfileLDAPEntry(ldapParams, function (err) {
                        cb(err);
                    });
                });
            },
            function (cb) {
                assertResponse('BHWZEF6D', null, cb);
            },
            function (cb) {
                testHelper.runSqlSelectQuery('* FROM user WHERE user_id = 901005', 'common_oltp', function (err, results) {
                    if (err) {
                        done(err);
                        return;
                    }
                    assert.ok(results);
                    assert.isTrue(results.length > 0);
                    assert.isDefined(results[0].status);
                    assert.equal(results[0].status, 'A');
                    cb();
                });
            },
            function (cb) {
                require('../initializers/ldapHelper').ldapHelper(api, function () {
                    api.ldapHelper.retrieveMemberProfileLDAPEntry({userId: '901005'}, function (err, result) {
                        assert.ok(result);
                        assert.isDefined(result.status, 'undefined status');
                        assert.equal(result.status, 'A', 'invalid status value');
                        cb();
                    });
                });
            }
        ], done);
    });
});
