/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.2
 * @author muzehyun, hesibo
 * changes in 1.1:
 * - add test for private info
 * changes in 1.2:
 * - remove test for private basic user profile
 * - add test for my profile api
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
var jwt = require('jsonwebtoken');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/basicUserProfile/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var CLIENT_ID = require('../config').config.general.oauthClientId;
var SECRET = require('../config').config.general.oauthClientSecret;

describe('Get Basic User Profile API', function () {
    this.timeout(120000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__clean', 'tcs_catalog', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__clean", "informixoltp", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__clean", "tcs_dw", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'topcoder_dw__clean', 'topcoder_dw', cb);
            }
        ], done);
    }

    /**
     * This function is run before each test.
     * Generate tests data.
     * @param {Function<err>} done the callback
     */
    beforeEach(function (done) {
        async.waterfall([
            clearDb,
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__insert_test_data", "topcoder_dw", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__insert_test_data', 'tcs_catalog', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_test_data", "informixoltp", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_dw__insert_test_data', 'tcs_dw', cb);
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
     * Used to check response content.
     * @param {String} url - the url to call.
     * @param {String} name - the expected file name.
     * @param {Function} cb - the call back function.
     */
    var assertBasicUserProfile = function (url, name, cb) {
        request(API_ENDPOINT)
            .get(url)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    cb(err);
                    return;
                }
                var body = res.body, expected = require(name);
                delete body.serverInformation;
                delete body.requesterInformation;
                if (body.Achievements) {
                    body.Achievements.forEach(function (item) {
                        delete item.date;
                    });
                }
                assert.deepEqual(body, expected);
                cb();
            });
    };

    /**
     * Test /v2/users/heffan
     * Should return success results for heffan.
     */
    it('should return success results for heffan', function (done) {
        assertBasicUserProfile('/v2/users/heffan', './test_files/expected_basic_user_profile_heffan', done);
    });

    /**
     * Test /v2/users/heffan?data=
     * Should return success results for heffan without earnings, ratings and achievements.
     */
    it('should return success results for heffan without earning, ratings and achievements', function (done) {
        assertBasicUserProfile('/v2/users/heffan?data=', './test_files/expected_basic_user_profile_heffan_no_data', done);
    });

    /**
     * Test /v2/users/heffan?data=achievements
     * Should return success results for heffan with just achievements
     */
    it('should return success results for heffan with just achievements', function (done) {
        assertBasicUserProfile('/v2/users/heffan?data=achievements', './test_files/expected_basic_user_profile_heffan_ach', done);
    });

    /**
     * Test /v2/users/heffan?data=rating
     * Should return success results for heffan with just rating summary
     */
    it('should return success results for heffan with just ratings', function (done) {
        assertBasicUserProfile('/v2/users/heffan?data=ratings', './test_files/expected_basic_user_profile_heffan_ratings', done);
    });

    /**
     * Test /v2/users/heffan?data=earnings,rating
     * should show overallEarning and rating fields in the response.
     */
    it('should show earnings and rating', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__update_show_earning', 'informixoltp', cb);
            },
            function (cb) {
                assertBasicUserProfile('/v2/users/heffan?data=earnings,ratings', './test_files/expected_basic_user_profile_heffan_earning_ratings', cb);
            }
        ], function (err) {
            if (err) {
                done(err);
                return;
            }
            done();
        });
    });

    /**
     * Test /v2/users/super.
     * Should return success results for super.
     */
    it('should return success results for super', function (done) {
        assertBasicUserProfile('/v2/users/super', './test_files/expected_basic_user_profile_super', done);
    });

    /**
     * Test /v2/users/heffan.
     * The heffan is now be upgraded to software copilot. The isCopilot.software should be true now.
     */
    /* isCopilot removed
    it('should be a software copilot', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__update_software_copilot', 'tcs_catalog', cb);
            },
            function (cb) {
                request(API_ENDPOINT)
                    .get('/v2/users/heffan')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        var body = res.body;
                        assert.equal(body.isCopilot.software, true, 'Invalid software_copilot status');
                        cb();
                    });
            }
        ], function (err) {
            if (err) {
                done(err);
                return;
            }
            done();
        });
    });
    */

    /**
     * Test /v2/users/heffan.
     * heffan has been upgraded to studio copilot. The isCopilot.studio should be true now.
     */
    /* isCopilot removed
    it('should be a studio copilot', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__update_studio_copilot', 'tcs_catalog', cb);
            },
            function (cb) {
                request(API_ENDPOINT)
                    .get('/v2/users/heffan')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        var body = res.body;
                        assert.equal(body.isCopilot.studio, true, 'Invalid studio_copilot status');
                        cb();
                    });
            }
        ], function (err) {
            if (err) {
                done(err);
                return;
            }
            done();
        });
    });
    */

    /**
     * Test /v2/users/heffan.
     * heffan is PM now. So the rating summary data should not be showed.
     */
    /* isPM removed
    it('should show no rating summary data', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__update_is_pm', 'informixoltp', cb);
            },
            function (cb) {
                assertBasicUserProfile('/v2/users/heffan', './test_files/expected_basic_user_profile_heffan_is_pm', cb);
            }
        ], function (err) {
            if (err) {
                done(err);
                return;
            }
            done();
        });
    });
    */


    /**
     * Test /v2/users/heffan
     * should show overallEarning field in the response.
     */
    it('should show earning', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__update_show_earning', 'informixoltp', cb);
            },
            function (cb) {
                assertBasicUserProfile('/v2/users/heffan', './test_files/expected_basic_user_profile_heffan_show_earning', cb);
            }
        ], function (err) {
            if (err) {
                done(err);
                return;
            }
            done();
        });
    });

    /**
     * Test /v2/users/notfounduser
     * should return a 404 error since the user is not existed.
     */
    it('should return 404 error', function (done) {
        request(API_ENDPOINT)
            .get('/v2/users/notfounduser')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(404)
            .end(done);
    });

    /**
     * Test /v2/users/test
     * should return 400 error since the user is not activated.
     */
    it('should return 400 error', function (done) {
        request(API_ENDPOINT)
            .get('/v2/users/test')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(400)
            .end(done);
    });

});

describe('My Profile API', function () {
    this.timeout(120000); // The api with testing remote db could be quit slow

    /*
     * sub value in JWT. It has format {provider}|{id}
     */
    var userHeffan = "ad|132456",
        userSuper = "ad|132457",
        userUser = "ad|132458",
        userDokTester = "ad|20",
        userYoshi = "ad|124916";

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'topcoder_dw__clean', 'topcoder_dw', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'common_oltp__clean', 'common_oltp', cb);
            }
        ], done);
    }

    /**
     * This function is run before each test.
     * Generate tests data.
     * @param {Function<err>} done the callback
     */
    before(function (done) {
        async.waterfall([
            clearDb,
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__insert_test_data", "topcoder_dw", cb);
            },
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
     * Generate an auth header
     * @param {Object} data the data to generate
     * @return {String} the generated string
     */
    function generateAuthHeader(data) {
        return "Bearer " + jwt.sign(data || {}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
    }

    /**
     * Create request and return it
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/user/profile')
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect('Content-Type', /json/).expect(statusCode);
    }

    /**
     * Get response and assert response from /v2/users/:user
     * @param {String} user requred user
     * @param {Object} expectedResponse the expected response
     * @param {String} authHeader the Authorization header. Optional
     * @param {Function<err>} done the callback
     */
    function assertResponse(expectedResponse, authHeader, done) {
        createRequest(200, authHeader)
            .end(function (err, res) {
                assert.ifError(err);
                assert.ok(res.body);
                var response = res.body;
                delete response.serverInformation;
                delete response.requesterInformation;
                response.Achievements.forEach(function (item) {
                    delete item.date;
                });
                assert.deepEqual(response, expectedResponse);
                done(err);
            });
    }

    /**
     * /v2/user/profile without auth header
     * expect 401
     */
    it('should return 401 when no auth header', function (done) {
        createRequest(401, null).end(function (err, res) {
            assert.ifError(err);
            assert.equal(res.body.error.details, "Authentication credential was missing.", "Invalid error detail");
            done();
        });
    });

    /**
     * /v2/user/profile with unactivated user's auth header
     * expect 400
     */
    it('should return 400 when user is unactivated', function (done) {
        createRequest(400, generateAuthHeader({ sub: userYoshi})).end(function (err, res) {
            assert.ifError(err);
            assert.equal(res.body.error.details, "User is not activated.", "Invalid error detail");
            done();
        });
    });

    /**
     * /v2/user/profile with heffan auth header
     * expecting profile with private information
     */
    it('should return private info for heffan', function (done) {
        var authHeader = generateAuthHeader({ sub: userHeffan}),
            expectedResponse = require('./test_files/user_profile_private/expected_basic_user_profile_heffan_private.json');
        assertResponse(expectedResponse, authHeader, done);
    });

    /**
     * /v2/user/profile with super auth header
     * expecting profile with private information
     */
    it('should return private info for super', function (done) {
        var authHeader = generateAuthHeader({ sub: userSuper}),
            expectedResponse = require('./test_files/user_profile_private/expected_basic_user_profile_super_private.json');
        assertResponse(expectedResponse, authHeader, done);
    });

    /**
     * /v2/user/profile with user auth header
     * expecting profile with private information
     */
    it('should return private info for user', function (done) {
        var authHeader = generateAuthHeader({ sub: userUser}),
            expectedResponse = require('./test_files/user_profile_private/expected_basic_user_profile_user_private.json');
        assertResponse(expectedResponse, authHeader, done);
    });

    /**
     * /v2/user/profile with dok_tester auth header
     * expecting profile with private information
     */
    it('should return private info for dok_tester', function (done) {
        var authHeader = generateAuthHeader({ sub: userDokTester}),
            expectedResponse = require('./test_files/user_profile_private/expected_basic_user_profile_dok_tester_private.json');
        assertResponse(expectedResponse, authHeader, done);
    });
});
