/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author bugbuka
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var supertest = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var _ = require('underscore');
var testHelper = require('./helpers/testHelper');
var SQL_DIR =  __dirname + "/sqls/challengeUnregistration/";
var SQL_DIR2 = "sqls/challengeUnregistration/";
var TEST_FILE_DIR = "test/test_files/";

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

var grantForumAccess = require('../config').config.general.grantForumAccess;
/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = require('../config').config.general.oauthClientId;
var SECRET = require('../config').config.general.oauthClientSecret;
var jwt = require('jsonwebtoken');

describe('Challenge Unregistration API', function () {
    this.timeout(120000); // The api with testing remote db could be quit slow

    /**
     * Users that we have setup.
     */
    var user11 = 'facebook|fb400011',
        user12 = 'facebook|fb400012';

    /**
     * Return the authentication header to be used for the given user.
     * @param {Object} user the user to authenticate
     */
    function getAuthHeader(user) {
        var authHeader = "Bearer " + jwt.sign({sub: user}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
        return authHeader;
    }

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.series([
            function (cb) {
                if (grantForumAccess !== true) {
                    cb();
                    return;
                }
                testHelper.runSqlFile(SQL_DIR + "jive__clean", "jive", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", "tcs_catalog", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "common_oltp__clean", "common_oltp", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__clean", "informixoltp", cb);
            }
        ], done);
    }

    /**
     * This function is run before all tests.
     * Generate tests data.
     * @param {Function<err>} done the callback
     */
    before(function (done) {
        async.series([
            clearDb,
            function (cb) {
                if (grantForumAccess !== true) {
                    cb();
                    return;
                }
                testHelper.runSqlFile(SQL_DIR + "jive__insert_test_data", "jive", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "common_oltp__insert_test_data", "common_oltp", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__insert_test_data", "tcs_catalog", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_test_data", "informixoltp", cb);
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

    //validate against a table
    function validateTable(sqlfile, done) {
        console.log("Now validate based on sqlfile: " + sqlfile);
        async.waterfall([
            function (callback) {
                testHelper.runSqlFromJSON(sqlfile, true, callback);
            },
            function (result, callback) {
                console.log('The query result:' + JSON.stringify(result));
                assert.ok(result.length === 0, 'result is empty');
                console.log('matched');
                callback(null, null);
            }
        ], done);
    }

    //validateDatabase for test successInput
    function validateDatabaseForDevelop(done) {
        async.series([
            function (callback) {
                validateTable(
                    SQL_DIR2 + "tcs_catalog__select_component_inquiry.json",
                    callback
                );
            },
            function (callback) {
                validateTable(
                    SQL_DIR2 + "tcs_catalog__select_project_result.json",
                    callback
                );
            },
            function (callback) {
                validateTable(
                    SQL_DIR2 + "tcs_catalog__select_software_challenge_resource.json",
                    callback
                );
            },
            function (callback) {
                validateTable(
                    SQL_DIR2 + "tcs_catalog__select_software_challenge_resource_info.json",
                    callback
                );
            },
            function (callback) {
                validateTable(
                    SQL_DIR2 + "tcs_catalog__select_software_challenge_component_inquiry.json",
                    callback
                );
            },
            function (callback) {
                if (grantForumAccess !== true) {
                    callback();
                    return;
                }

                validateTable(
                    SQL_DIR2 + "jive__select_jiveuserperm.json",
                    callback
                );
            }
        ], done);
    }

    //validateDatabase for test successInput
    function validateDatabaseForDesign(done) {
        async.series([
            function (callback) {
                validateTable(
                    SQL_DIR2 + "tcs_catalog__select_studio_challenge_resource.json",
                    callback
                );
            },
            function (callback) {
                validateTable(
                    SQL_DIR2 + "tcs_catalog__select_studio_challenge_resource_info.json",
                    callback
                );
            }
        ], done);
    }

    // Check if the data are in expected structure and data
    it('Unregister software challenge should success', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000001/unregister")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user11))
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                console.log('Registration completed. Now verify the database is the same as predicted data');
                validateDatabaseForDevelop(done);
            });
    });

    // Unreigster again the same user, the same challenge as above, should fail.
    it('Unregister again should fail', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000001/unregister")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user11))
            .expect('Content-Type', /json/)
            .expect(403, done);
    });


    /// Check if the data are in expected structure and data
    it('Unregister studio challenge should success', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000002/unregister")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user11))
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                validateDatabaseForDesign(done);
            });
    });

    // Check if the data are in expected structure and data
    // It's a copilot posting challenge.
    it('User unregister a copilot posting challenge', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000003/unregister")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user11))
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                console.log('Registration completed. Now verify the database is the same as predicted data');
                validateDatabaseForDevelop(done);
            });
    });

    // negative challengeId number.
    it('negative challenge number', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/-40000002/unregister")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user12))
            .expect('Content-Type', /json/)
            .expect(400, done);
    });

    // the challengeId param is not a number.
    it('Challenge is NOT a number', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/NAN/unregister")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user12))
            .expect('Content-Type', /json/)
            .expect(400, done);
    });

    // the challengeId param exceed MAX_INT.
    it('Challenge number exceed MAX_INT', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/214748364700/unregister")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user12))
            .expect('Content-Type', /json/)
            .expect(400, done);
    });
});