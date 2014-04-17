/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author ecnu_haozi, TCSASSEMBLER
 *
 * changes in 1.1:
 * -- Add verification for integration the forums operation(Module Assembly - Integrating Forums Wrapper with Challenge Registration API)
 * -- verify forum only if grantForumAccess is true
 *
 * changes in 1.2:
 * -- Add test for 401, without auth header
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
var SQL_DIR =  __dirname + "/sqls/challengeRegistration/";
var SQL_DIR2 = "sqls/challengeRegistration/";
var TEST_FILE_DIR = "test/test_files/";

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

var grantForumAccess = require('../config').config.general.grantForumAccess;
/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = require('../config').config.general.oauthClientId;
var SECRET = require('../config').config.general.oauthClientSecret;
var jwt = require('jsonwebtoken');

describe('Challenge Registration API', function () {
    this.timeout(120000); // The api with testing remote db could be quit slow

    /**
    * Users that we have setup.
    */
    var user11 = 'facebook|fb400011',
        user12 = 'facebook|fb400012',
        user13 = 'facebook|fb400013';

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
        async.waterfall([
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
        async.waterfall([
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

    //judge the actualObject contains all fields in predictObject.
    function predict(predictObject, actualObject) {
        return _.every(_.keys(predictObject), function (key) {
            return predictObject[key] === actualObject[key];
        });
    }

    //validate against a table
    function validateTable(path, encode, sqlfile, done) {
        console.log("Now validate based on sqlfile: " + sqlfile);
        var text, predictObject, actualObject;
        text = fs.readFileSync(path, encode);
        console.log('the text: ' + text);
        predictObject = JSON.parse(text);
        console.log('the parsed object:' + JSON.stringify(predictObject));
        async.waterfall([
            function (callback) {
                testHelper.runSqlFromJSON(sqlfile, true, callback);
            },
            function (result, callback) {
                console.log('The query result:' + JSON.stringify(result));
                assert.ok(result.length !== 0, 'result is not empty');
                actualObject = result[0];
                console.log('the object in database:' + JSON.stringify(actualObject));
                assert.ok(predict(predictObject, actualObject), "should match");
                console.log('matched');
                callback(null, null);
            }
        ], done);
    }

    //validateDatabase for test successInput
    function validateDatabaseForDevelop(done) {
        async.parallel([
            function (callback) {
                validateTable(
                    TEST_FILE_DIR + "expected_challenge_registration_software_component_inquiry.txt",
                    'utf8',
                    SQL_DIR2 + "tcs_catalog__select_component_inquiry.json",
                    callback
                );
            },
            function (callback) {
                validateTable(
                    TEST_FILE_DIR + "expected_challenge_registration_software_project_result.txt",
                    'utf8',
                    SQL_DIR2 + "tcs_catalog__select_project_result.json",
                    callback
                );
            },
            function (callback) {
                validateTable(
                    TEST_FILE_DIR + "expected_challenge_registration_software_resource.txt",
                    'utf8',
                    SQL_DIR2 + "tcs_catalog__select_software_challenge_resource.json",
                    callback
                );
            },
            function (callback) {
                validateTable(
                    TEST_FILE_DIR + "expected_challenge_registration_software_resource_info.txt",
                    'utf8',
                    SQL_DIR2 + "tcs_catalog__select_software_challenge_resource_info.json",
                    callback
                );
            },
            function (callback) {
                if (grantForumAccess !== true) {
                    callback();
                    return;
                }
                validateTable(
                    TEST_FILE_DIR + "expected_jivegroupuser.txt",
                    'utf8',
                    SQL_DIR2 + "jive__select_jivegroupuser.json",
                    callback
                );
            },
            function (callback) {
                validateTable(
                    TEST_FILE_DIR + "expected_challenge_registration_software_notification.txt",
                    'utf8',
                    SQL_DIR2 + "tcs_catalog__select_software_notification.json",
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
                    TEST_FILE_DIR + "expected_challenge_registration_studio_notification.txt",
                    'utf8',
                    SQL_DIR2 + "tcs_catalog__select_studio_notification.json",
                    callback
                );
            },
            function (callback) {
                validateTable(
                    "test/test_files/expected_challenge_registration_studio_resource.txt",
                    'utf8',
                    SQL_DIR2 + "tcs_catalog__select_studio_challenge_resource.json",
                    callback
                );
            },
            function (callback) {
                validateTable(
                    TEST_FILE_DIR + "expected_challenge_registration_studio_resource_info.txt",
                    'utf8',
                    SQL_DIR2 + "tcs_catalog__select_studio_challenge_resource_info.json",
                    callback
                );
            }
        ], done);
    }

    // Check if the data are in expected structure and data
    // Here the notification email will be sent. Modify user11's address and check it manually.
    it('Register software challenge with all of terms of use agreed should success', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000001/register")
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

    // Reigster again the same user, the same challenge as above, should fail.
    it('Register again should fail', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000001/register")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user11))
            .expect('Content-Type', /json/)
            .expect(403, done);
    });

    // when no auth header, should fail, expect 401.
    it('Register again should fail', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000001/register")
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(401, done);
    });

    /// Check if the data are in expected structure and data
    it('Register studio challenge with all of terms of use agreed should success', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000002/register")
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

    // Reigster again the same user, the same challenge as above, should fail.
    it('Register studio challenge again should fail', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000002/register")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user11))
            .expect('Content-Type', /json/)
            .expect(403, done);
    });


    // Only agreed a part of terms of use.
    it('Register software challenge with a part of terms of use agreed should fail', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000001/register")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user12))
            .expect('Content-Type', /json/)
            .expect(403, done);
    });

    // Only agreed a part of terms of use.
    it('Register studio challenge with a part of terms of use agreed should fail', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000002/register")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user12))
            .expect('Content-Type', /json/)
            .expect(403, done);
    });

    // negative challengeId number.
    it('negative challenge number', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/-40000002/register")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user12))
            .expect('Content-Type', /json/)
            .expect(400, done);
    });

    // the challengeId param is not a number.
    it('Challenge is NOT a number', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/NAN/register")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user12))
            .expect('Content-Type', /json/)
            .expect(400, done);
    });

    // the challengeId param exceed MAX_INT.
    it('Challenge number exceed MAX_INT', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/214748364700/register")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user12))
            .expect('Content-Type', /json/)
            .expect(400, done);
    });

    // Only agreed a part of terms of use.
    it('User is from a banned country', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000002/register")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user13))
            .expect('Content-Type', /json/)
            .expect(403, done);
    });


    // Only copilot can register copilot posting.
    it('User is not copilot', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000003/register")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user12))
            .expect('Content-Type', /json/)
            .expect(403, done);
    });

    // Check if the data are in expected structure and data
    // It's a copilot posting challenge.
    it('User register a copilot posting challenge', function (done) {
        supertest(API_ENDPOINT)
            .post("/v2/challenges/40000003/register")
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user11))
            .expect('Content-Type', /json/)
            .expect(200, done);
    });
});
