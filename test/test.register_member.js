/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author TCSASSEMBLER
 * change in 1.1:
 * - use before and after to setup and clean data
 * - use testHelper for data access
 * - merge successInput and validateDatabase into one test
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
var bindings = require("nodejs-db-informix");
var async = require("async");
var bcrypt = require('bcrypt');
var testHelper = require('./helpers/testHelper');
var SQL_DIR = "sqls/register_member/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Test Register Member API', function () {
    this.timeout(120000); // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFromJSON(SQL_DIR + "common_oltp__clean.json", cb);
            }, function (cb) {
                testHelper.runSqlFromJSON(SQL_DIR + "informixoltp__clean.json", cb);
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
                testHelper.runSqlFromJSON(SQL_DIR + "common_oltp__insert_test_data.json", cb);
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

    /// Check if the data are in expected struture and data
    it('should return errors if inputs are spaces only', function (done) {
        var text = fs.readFileSync("test/test_files/exptected_member_register_invalid_1.txt", 'utf8'),
            expected = JSON.parse(text);

        supertest(API_ENDPOINT)
            .post('/v2/develop/users').set('Accept', 'application/json')
            .send({ firstName: ' ', lastName: ' ', handle: ' ', email: ' ', password: '123456', country: ' ' })
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.deepEqual(expected, JSON.parse(result.res.text).message, "Invalid error message");
                }
                done(err);
            });
    });


    /// Check if the data are in expected struture and data
    it('should return errors: invalid country, email, firstname, lastname, handle, social', function (done) {
        var text = fs.readFileSync("test/test_files/exptected_member_register_invalid_2.txt", 'utf8'),
            expected = JSON.parse(text);

        supertest(API_ENDPOINT)
            .post('/v2/develop/users').set('Accept', 'application/json')
            .send({ firstName: 'foooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo', lastName: 'DELETE * FROM USER', handle: '_(#@*$', email: 'foofoo4foobar.com', password: '123456', country: 'xxx', socialProviderId: 1, socialUserName: "foo  DROP TABLE bar", socialEmail: "foobarfoobar.com", socialEmailVerified: 'xxx' })
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.deepEqual(expected, JSON.parse(result.res.text).message, "Invalid error message");
                }
                done(err);
            });
    });

    /// Check if the data are in expected struture and data
    it('should return errors: invalid handle and invalid social id', function (done) {
        var text = fs.readFileSync("test/test_files/exptected_member_register_invalid_3.txt", 'utf8'),
            expected = JSON.parse(text);

        supertest(API_ENDPOINT)
            .post('/v2/develop/users').set('Accept', 'application/json')
            .send({ firstName: 'foo', lastName: 'bar', handle: '1invalidHandle1', email: 'testHandleFoobar@foobar.com', password: '123456', country: 'Angola', socialProviderId: 999, socialUserName: "foobar", socialEmail: "foobar@foobar.com", socialEmailVerified: 't' })
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.deepEqual(expected, JSON.parse(result.res.text).message, "Invalid error message");
                }
                done(err);
            });
    });

    //validateDatabase for test successInput
    var validateDatabase = function (done) {
        var text, userExpected, securityUserExpected, userGroupExpected, userSocialExpected;

        text = fs.readFileSync("test/test_files/exptected_member_register_validate_user.txt", 'utf8');
        userExpected = JSON.parse(text);
        text = fs.readFileSync("test/test_files/exptected_member_register_validate_security_user.txt", 'utf8');
        securityUserExpected = JSON.parse(text);
        text = fs.readFileSync("test/test_files/exptected_member_register_validate_user_group.txt", 'utf8');
        userGroupExpected = JSON.parse(text);
        text = fs.readFileSync("test/test_files/exptected_member_register_validate_user_social.txt", 'utf8');
        userSocialExpected = JSON.parse(text);

        async.series([
            function (callback) {
                testHelper.runSqlFromJSON(SQL_DIR + "common_oltp__select_user.json", true, callback);
            },
            function (callback) {
                testHelper.runSqlFromJSON(SQL_DIR + "common_oltp__select_security_user.json", true, callback);
            },
            function (callback) {
                testHelper.runSqlFromJSON(SQL_DIR + "common_oltp__select_user_group.json", true, callback);
            },
            function (callback) {
                testHelper.runSqlFromJSON(SQL_DIR + "common_oltp__select_user_social.json", true, callback);
            }
        ],
            function (err, results) {
                if (!err) {
                    assert.deepEqual(userExpected, results[0], "Invalid returned message");
                    assert.deepEqual(userGroupExpected, results[2], "Invalid returned message");
                    assert.deepEqual(userSocialExpected, results[3], "Invalid returned message");

                    assert.equal(securityUserExpected[0].login_id, results[1][0].login_id, "Invalid returned message");
                    assert.equal(securityUserExpected[0].user_id, results[1][0].user_id, "Invalid returned message");

                    bcrypt.compare("123456", results[1][0].password, function (err, res) {
                        // res == true
                        assert(res === true, "Password is not correct");
                        done(err);
                    });
                } else {
                    done(err);
                }
            });
    };

    /// Check if the data are in expected struture and data
    it('should register successfully', function (done) {
        var text = fs.readFileSync("test/test_files/exptected_member_register_success.txt", 'utf8'),
            expected = JSON.parse(text);

        supertest(API_ENDPOINT)
            .post('/v2/develop/users').set('Accept', 'application/json')
            .send({ firstName: 'foo', lastName: 'bar', handle: 'testHandleFoo', email: 'testHandleFoo@foobar.com', password: '123456', country: 'Angola', socialProviderId: 1, socialUserName: "foobar", socialEmail: "foobar@foobar.com", socialEmailVerified: 't' })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(expected, JSON.parse(result.res.text).userId, "Invalid returned message");
                validateDatabase(done);
            });
    });

    /// Check if the data are in expected struture and data
    it('should return if handle and email exists', function (done) {
        var text = fs.readFileSync("test/test_files/exptected_member_register_invalid_existing.txt", 'utf8'),
            expected = JSON.parse(text);

        supertest(API_ENDPOINT)
            .post('/v2/develop/users').set('Accept', 'application/json')
            .send({ firstName: 'foo', lastName: 'bar', handle: 'testHandleFoo', email: 'testHandleFoo@foobar.com', password: '123456', country: 'Angola', socialProviderId: 1, socialUserName: "foobar", socialEmail: "foobar@foobar.com", socialEmailVerified: 't' })
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    assert.deepEqual(expected, JSON.parse(result.res.text).message, "Invalid error message");
                }
                done(err);
            });
    });

    /// Check if the data are in expected struture and data
    it('should send email', function (done) {
        supertest(API_ENDPOINT)
            .post('/v2/develop/users').set('Accept', 'application/json')
            .send({ firstName: 'foo', lastName: 'bar', handle: 'testForEmail', email: 'testForEmail@foobar.com', password: '123456', country: 'Angola' })
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err) {
                // examine the sent email manually
                done(err);
            });
    });

});