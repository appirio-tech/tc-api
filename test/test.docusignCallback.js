/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author kurtrips
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, vars: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");
var _ = require("underscore");
var config = require("../config").config;

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/docusign/callback/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Test Docusign Callback Action', function () {

    /**
     * Creates a Request object using the given URL.
     * Sets the expected response code using the expectedStatusCode parameter
     * @param {String} url the url to connect
     * @param {Number} expectedStatusCode the expected status code of the response
     */
    function getRequest(url, expectedStatusCode) {
        var req = request(API_ENDPOINT)
            .post(url)
            .set('Accept', 'application/json')
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
                testHelper.runSqlFile(SQL_DIR + "informixoltp__clean", "informixoltp", cb);
            },
            function (cb) {
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
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_test_data", "informixoltp", cb);
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
     * Checks that the response has the correct message
     * @param err the error (if any) in the response
     * @param resp the response
     * @param message the expected message
     * @param done the callback to call when we are done
     */
    function assertMessage(err, resp, message, done) {
        if (err) {
            done(err);
            return;
        }
        assert.equal(resp.body.message, message);
        done();
    }

    var reqBody = {
        connectKey: 'ABCDED-12435-EDFADSEC',
        envelopeStatus: 'Completed',
        envelopeId: '9E045DB0-B50F-11E3-A5E2-0800200C9A66',
        tabs: [
            {
                "tabLabel": "Signature 1",
                "tabValue": ""
            },
            {
                "tabLabel": "Address",
                "tabValue": "123 Aloo"
            },
            {
                "tabLabel": "Handle",
                "tabValue": "Hung"
            }
        ]
    };

    /**
     * Test docusignCallback when connectKey is not the same as in config
     * should return 404
     */
    it('should return 404 error when connectKey is not the same as in config', function (done) {
        var req = getRequest('/v2/terms/docusignCallback', 404);

        var body = _.clone(reqBody);
        body.connectKey = 'ABCDED-56789-EDFADSEC';
        req.send(body)
            .end(function (err, resp) {
                assertMessage(err, resp, 'Connect Key is missing or invalid.', done);
            });
    });

    /**
     * Test docusignCallback when envelopeStatus is not Complete
     * should return 200 after simply logging
     */
    it('should return 200 when envelopeStatus is not Complete', function (done) {
        var req = getRequest('/v2/terms/docusignCallback', 200);
        var body = _.clone(reqBody);
        body.envelopeStatus = 'Declined';
        req.send(body).end(function (err, resp) {
            //The is_completed of the envelope in DB must still be same
            testHelper.runSqlSelectQuery("* from docusign_envelope where docusign_envelope_id = '" + body.envelopeId + "'", "informixoltp", function (err, result) {
                assert.equal(result[0].is_completed, 0, 'The is_completed of the envelope in DB must still be same');
                done();
            });
        });
    });

    /**
     * Test docusignCallback when envelopeStatus is empty
     * should return 200 after simply logging
     */
    it('should return 200 when envelopeStatus is emoty', function (done) {
        var req = getRequest('/v2/terms/docusignCallback', 200);
        var body = _.clone(reqBody);
        body.envelopeStatus = ' ';
        req.send(body).end(function (err, resp) {
            //The is_completed of the envelope in DB must still be same
            testHelper.runSqlSelectQuery("* from docusign_envelope where docusign_envelope_id = '" + body.envelopeId + "'", "informixoltp", function (err, result) {
                assert.equal(result[0].is_completed, 0, 'The is_completed of the envelope in DB must still be same');
                done();
            });
        });
    });

    /**
     * Test docusignCallback when envelope with given id is not found
     * should return 200 after simply logging
     */
    it('should return 200 when envelope with given id is not found', function (done) {
        var req = getRequest('/v2/terms/docusignCallback', 200);
        var body = _.clone(reqBody);
        body.envelopeId = '9E045DB0-B50F-11E3-A5E2-0800200C9A67';
        req.send(body).end(done);
    });

    /**
     * Test docusignCallback when envelope with given id is found but the template id is unknown
     * should return 200 after setting the is_completed but no handlers will be called
     */
    it('should return 200 when envelope with given id is found but the template id is unknown', function (done) {
        var req = getRequest('/v2/terms/docusignCallback', 200);
        var body = _.clone(reqBody);
        body.envelopeId = '32A09D40-B51E-11E3-A5E2-0800200C9A66';
        req.send(body).end(function (err, resp) {
            //The is_completed of the envelope in DB must be set to 1
            testHelper.runSqlSelectQuery("* from docusign_envelope where docusign_envelope_id = '" + body.envelopeId + "'", "informixoltp", function (err, result) {
                assert.equal(result[0].is_completed, 1, 'The is_completed of the envelope in DB must be set to 1');
                done();
            });
        });
    });

    /**
     * Test docusignCallback when user has a ban for terms of use 
     * should return 200. The terms of use must not be inserted
     */
    it('should return 200 with user has a ban for terms of use', function (done) {
        var req = getRequest('/v2/terms/docusignCallback', 200);
        var body = _.clone(reqBody);
        body.envelopeId = '4E0E0DB0-B528-11E3-A5E2-0800200C9A66';
        req.send(body).end(function (err, resp) {
            //The terms of use must not be inserted for user
            testHelper.runSqlSelectQuery("* from user_terms_of_use_xref where user_id = 124772 and terms_of_use_id = 20753", "common_oltp", function (err, result) {
                assert.equal(result.length, 0, 'The terms of use must not be inserted for user.');
                done();
            });
        });
    });

    /**
     * Test docusignCallback when user already has terms of use 
     * should return 200. The terms of use must not be inserted again
     */
    it('should return 200 when user already has terms of use', function (done) {
        var req = getRequest('/v2/terms/docusignCallback', 200);
        var body = _.clone(reqBody);
        body.envelopeId = 'AD6212F0-B525-11E3-A5E2-0800200C9A66';
        req.send(body).end(function (err, resp) {
            //The terms of use must already exists and must not be inserted again
            testHelper.runSqlSelectQuery("* from user_terms_of_use_xref where user_id = 132456 and terms_of_use_id = 20753", "common_oltp", function (err, result) {
                assert.equal(result.length, 1, 'The terms of use must already exist for user.');
                assert.equal(result[0].modify_date, '2013-12-12T00:00:00.000+0000', 'The modified date must remain the same.');
                done();
            });
        });
    });

    /**
     * Test docusignCallback for success
     * should return 200. The is_completed must be set in docusign_envelope and entry must be inserted in user_terms_of_use_xref
     */
    it('should return 200 for success', function (done) {
        var req = getRequest('/v2/terms/docusignCallback', 200);
        req.send(reqBody).end(function (err, resp) {
            testHelper.runSqlSelectQuery("* from user_terms_of_use_xref where user_id = 124764 and terms_of_use_id = 20753",
                "common_oltp", function (err, result) {
                    assert.equal(result.length, 1, 'The terms of use must now exist for user.');

                    testHelper.runSqlSelectQuery("* from docusign_envelope where docusign_envelope_id = '" + reqBody.envelopeId + "'",
                        "informixoltp", function (err, result) {
                            assert.equal(result[0].is_completed, 1, 'The is_completed of the envelope in DB must be set to 1');
                            done();
                        });
                });
        });
    });
});
