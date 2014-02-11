/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
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

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/basicUserProfile/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';


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
                body.Achievements.forEach(function (item) {
                    delete item.date;
                });
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

    /**
     * Test /v2/users/heffan.
     * heffan has been upgraded to studio copilot. The isCopilot.studio should be true now.
     */
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

    /**
     * Test /v2/users/heffan.
     * heffan is PM now. So the rating summary data should not be showed.
     */
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


