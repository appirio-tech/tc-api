/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, vars: true, unparam: true */

/**
 * Module dependencies.
 */
require('datejs');
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");
var _ = require("underscore");
var config = require("../config").config;

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/docusign/recipientViewUrl/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = require('../config').config.general.oauthClientId;
var SECRET = require('../config').config.general.oauthClientSecret;
var jwt = require('jsonwebtoken');

describe('Test Docusign Get Recipient View Url', function () {

    /**
    * Users that we have setup.
    */
    var user124764 = 'facebook|fb124764';

    /**
     * The recipientViewUrls we receive during out testing
     */
    var recipientViewUrls = [];

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
            }
        ], done);
    });

    /**
     * This function is run after all tests.
     * Prints the recipient view urls that we receive during our test calls
     * @param {Function<err>} done the callback
     */
    after(function (done) {
        var i;
        for (i = 0; i < recipientViewUrls.length; i = i + 1) {
            console.log(recipientViewUrls[i]);
        }
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
     * Checks the success of the get recipient view url call.
     * @param resp the response
     * @param templateId the template id
     * @param done the callback to call
     */
    function assertSuccess(err, resp, templateId, done) {
        if (err) {
            done(err);
            return;
        }

        assert.isDefined(resp.body.recipientViewUrl, "recipient view url must be returned.");
        assert.isDefined(resp.body.envelopeId, "envelopeId must be returned.");
        recipientViewUrls.push(resp.body.recipientViewUrl);

        testHelper.runSqlSelectQuery("* from docusign_envelope where user_id = 124764 and docusign_template_id = '" + templateId + "'",
            "informixoltp", function (err, result) {
                assert.equal(result.length, 1, 'Record must be created in docusign_envelope table');
                assert.equal(result[0].docusign_envelope_id, resp.body.envelopeId, 'Record must be created with the correct envelopeId');
                assert.equal(result[0].is_completed, 0, 'is_completed must be set to false');
                done();
            });
    }

    /**
     * Test getDocumentViewURL when user is no logged
     * should return 401 error
     */
    it('should return 401 error when not logged-in', function (done) {
        var req = request(API_ENDPOINT)
            .post('/v2/terms/docusign/viewURL')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(401);

        req.send({ templateId: config.docusign.affidavitTemplateId})
            .end(function (err, resp) {
                assertError(err, resp, "Authentication details missing or incorrect.", done);
            });
    });

    /**
     * Test getDocumentViewURL when tabs is in incorrect format
     * should return 400
     */
    it('should return 400 error when tabs is in incorrect format', function (done) {
        var req = getRequest('/v2/terms/docusign/viewURL', user124764, 400);

        req.send({ templateId: config.docusign.affidavitTemplateId, tabs: 'key=value'})
            .end(function (err, resp) {
                assertError(err, resp, "tabs parameter is not in correct format. Key values must be a separated by a || (double pipe).", done);
            });
    });

    /**
     * Test getDocumentViewURL when template id is in incorrect format
     * should return 400
     */
    it('should return 400 error when template id is in incorrect format', function (done) {
        var req = getRequest('/v2/terms/docusign/viewURL', user124764, 400);

        req.send({ templateId: 'blahblah'})
            .end(function (err, resp) {
                assertError(err, resp, "templateId is not a valid uuid.", done);
            });
    });

    /**
     * Test getDocumentViewURL when user passes non-existent template id
     * should return 404
     */
    it('should return 404 error when user passes non-existent template id', function (done) {
        var req = getRequest('/v2/terms/docusign/viewURL', user124764, 404);

        req.send({ templateId: '799c2910-b0c5-11e3-a5e2-0800200c9a66'})
            .end(function (err, resp) {
                assertError(err, resp, 'Template with given id was not found.', done);
            });
    });

    /**
     * Test getDocumentViewURL when requesting signature via template fails
     * This is a bit of a contrived example. I will set the email of the user to an invalid one
     * should return 500
     */
    it('should return 500 error when requesting signature via template fails', function (done) {
        var correctEmail;
        async.waterfall([
            function (cb) {
                //Get the correct email
                testHelper.runSqlSelectQuery('email from email_user where user_id = 124764', "common_oltp", function (err, result) {
                    correctEmail = result[0].email;
                    cb();
                });
            }, function (cb) {
                //Set the email of the user to some bogus email
                testHelper.runSqlQuery("UPDATE email set address='bademail' where user_id = 124764", 'common_oltp', function () {
                    cb();
                });
            }, function (cb) {
                var req = getRequest('/v2/terms/docusign/viewURL', user124764, 500);
                req.send({ templateId: config.docusign.assignmentV2TemplateId })
                    .end(function (err, resp) {
                        assertError(err, resp, 'Requesting Signature via template failed.', cb);
                    });
            }, function (cb) {
                //Set the email of the user back to the correct email
                testHelper.runSqlQuery("UPDATE email set address='" + correctEmail + "' where user_id = 124764", 'common_oltp', function () {
                    cb();
                });
            }
        ], done);
    });

    /**
     * Test getDocumentViewURL for success using W-9 template
     * should return 200
     */
    it('should return 200 for success using W-9 template', function (done) {
        var req = getRequest('/v2/terms/docusign/viewURL', user124764, 200);

        req.send({ templateId: config.docusign.w9TemplateId})
            .end(function (err, resp) {
                assertSuccess(err, resp, config.docusign.w9TemplateId, done);
            });
    });

    /**
     * Test getDocumentViewURL for success using W-8 BEN template
     * should return 200
     */
    it('should return 200 for success using W-8 BEN template', function (done) {
        var req = getRequest('/v2/terms/docusign/viewURL', user124764, 200);

        req.send({ templateId: config.docusign.w8benTemplateId})
            .end(function (err, resp) {
                assertSuccess(err, resp, config.docusign.w8benTemplateId, done);
            });
    });

    /**
     * Test getDocumentViewURL for success appirio mutual NDA template
     * should return 200
     */
    it('should return 200 for success using appirio mutual NDA template', function (done) {
        var req = getRequest('/v2/terms/docusign/viewURL', user124764, 200);

        req.send({ templateId: config.docusign.appirioMutualNDATemplateId})
            .end(function (err, resp) {
                assertSuccess(err, resp, config.docusign.appirioMutualNDATemplateId, done);
            });
    });

    /**
     * Test getDocumentViewURL for success using affidavit template
     * should return 200
     */
    it('should return 200 for success using affidavit template', function (done) {
        var req = getRequest('/v2/terms/docusign/viewURL', user124764, 200);

        req.send({ templateId: config.docusign.affidavitTemplateId})
            .end(function (err, resp) {
                assertSuccess(err, resp, config.docusign.affidavitTemplateId, done);
            });
    });

    /**
     * Test getDocumentViewURL for success using affidavit template
     * Tests when the envelope_id already exists for given user and template, in DB (because of previous test)
     * A new record must be created again in DB.
     * should return 200
     */
    it('should return 200 for success when envelope info already exists in DB', function (done) {
        var req = getRequest('/v2/terms/docusign/viewURL', user124764, 200);

        req.send({ templateId: config.docusign.affidavitTemplateId })
            .end(function (err, resp) {
                testHelper.runSqlSelectQuery("* from docusign_envelope where user_id = 124764 and docusign_template_id = '" + config.docusign.affidavitTemplateId + "'",
                    "informixoltp", function (err, result) {
                        assert.equal(result.length, 2, 'A new record must be created in docusign_envelope table. Record count must be 2 now.');
                        done();
                    });
            });
    });

    /**
     * Test getDocumentViewURL for success using Assignment v2 template
     * This test also demonstrates the usage of tabs parameters
     * should return 200
     */
    it('should return 200 for success using Assignment v2 template and 2 tabs parameter', function (done) {
        var req = getRequest('/v2/terms/docusign/viewURL', user124764, 200);

        req.send('templateId=' + config.docusign.assignmentV2TemplateId + '&tabs=Handle||anix&tabs=Address||123,Disneyland')
            .end(function (err, resp) {
                assertSuccess(err, resp, config.docusign.assignmentV2TemplateId, done);
            });
    });
});
