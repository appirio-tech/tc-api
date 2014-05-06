/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true, vars: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");
var _ = require("underscore");

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/desDownloadSubmission/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId;
var SECRET = require('../config/tc-config').tcConfig.oauthClientSecret;
var jwt = require('jsonwebtoken');

describe('Download Design Submission API', function () {

    /**
    * Social logins that we have setup.
    */
    var user124764 = 'facebook|fb124764', //Hung
        user124772 = 'facebook|fb124772', //Partha
        user124766 = 'facebook|fb124766', //twight
        user124834 = 'facebook|fb124834', //lightspeed (studio admin)
        user124852 = 'facebook|fb124852', //plinehan
        user124835 = 'facebook|fb124835', //reassembler
        user124853 = 'facebook|fb124853', //chelseasimon
        user124856 = 'facebook|fb124856', //wyzmo
        user124857 = 'facebook|fb124857', //cartajs
        user124861 = 'facebook|fb124861', //ksmith
        user124916 = 'facebook|fb124916', //Yoshi
        user132456 = 'facebook|fb132456', //heffan
        user124776 = 'facebook|fb124776'; //sandking


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
     * @param {String} expectedContentType the expected content type of the response
     */
    function getRequest(url, user, expectedStatusCode, expectedContentType) {
        var req = request(API_ENDPOINT)
            .get(url)
            .set('Authorization', getAuthHeader(user))
            .expect('Content-Type', expectedContentType)
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
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", "tcs_catalog", cb);
            },
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
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__insert_test_data", "tcs_catalog", cb);
            }
        ], done);
    });

    /**
     * This function is run after all tests.
     * Clean up all data.
     * @param {Function<err>} done the callback
     */
    after(function (done) {
        done();
        //clearDb(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionId is negative
     * should return 400 error
     */
    it('should return 400 error when submission id is negative', function (done) {
        var req = getRequest('/v2/design/download/-88821', user124764, 400, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionId is 0
     * should return 400 error
     */
    it('should return 400 error when submission id is 0', function (done) {
        var req = getRequest('/v2/design/download/0', user124764, 400, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionId is not a number
     * should return 400 error
     */
    it('should return 400 error when submission id is not a number', function (done) {
        var req = getRequest('/v2/design/download/blahblah', user124764, 400, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionId is larger than max integer
     * should return 400 error
     */
    it('should return 400 error when submission id is larger than max integer', function (done) {
        var req = getRequest('/v2/design/download/2579842759873495873894759834758937498357948539457', user124764, 400, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionImageTypeId is not a number
     * should return 400 error
     */
    it('should return 400 error when submissionImageTypeId is not a number', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionImageTypeId=abcd', user124764, 400, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionImageTypeId is larger than max integer
     * should return 400 error
     */
    it('should return 400 error when submissionImageTypeId is larger than max integer', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionImageTypeId=834253289749283749328749823749236473248236487263847', user124764, 400, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionImageTypeId is not a valid value
     * should return 400 error
     */
    it('should return 400 error when submissionImageTypeId is not a valid value', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionImageTypeId=27', user124764, 400, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionFileIndex is not a number
     * should return 400 error
     */
    it('should return 400 error when submissionFileIndex is not a number', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionFileIndex=abcd', user124764, 400, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionFileIndex is larger than max integer
     * should return 400 error
     */
    it('should return 400 error when submissionFileIndex is larger than max integer', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionFileIndex=834253289749283749328749823749236473248236487263847', user124764, 400, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionFileIndex is not positive
     * should return 400 error
     */
    it('should return 400 error when submissionFileIndex is not positive', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionFileIndex=0', user124764, 400, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionType is not a valid value
     * should return 400 error
     */
    it('should return 400 error when submissionType is not a valid value', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionType=micro', user124764, 400, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId but user is not logged-in
     * should return 401 error
     */
    it('should return 401 error when not authenticated', function (done) {
        request(API_ENDPOINT)
            .get('/v2/design/download/654021')
            .expect('Content-Type', /json/)
            .expect(401, done);
    });

    /**
     * Test /v2/design/download/:submissionId when upload does not exist
     * should return 404 error
     */
    it('should return 404 error when submission does not exist', function (done) {
        var req = getRequest('/v2/design/download/654999', user124764, 404, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "No such submission exists.");
            done();
        });
    });

    /**
     * Test /v2/design/download/:submissionId when project is not a design project
     * should return 400 error
     */
    it('should return 400 error when not a design project', function (done) {
        var req = getRequest('/v2/design/download/654024', user124764, 400, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "Non-Design challenge submissions are not supported by this API.");
            done();
        });
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase but user is studio admin, so download is allowed
     * should return 200
     */
    it('should return 200 when project is still in submission phase but user is studio admin, so download is allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124834, 200, 'application/zip');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase but user is the submitter himself, so download is allowed
     * should return 200
     */
    it('should return 200 when project is still in submission phase but user is submitter himself, so download is allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124764, 200, 'application/zip');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase but user is the screener, so download is not allowed
     * should return 403
     */
    it('should return 403 when project is still in submission phase but user is screener, so download is not allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124766, 403, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase and user is reviewer, so download is not allowed
     * should return 403 forbidden error
     */
    it('should return 403 error when project is still in submission phase and user is reviewer, so download is not allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124852, 403, /json/);
        req.end(done);
    });


    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase and user is another submitter, so download is not allowed
     * should return 403 forbidden error
     */
    it('should return 403 error when project is still in submission phase and user is another submitter, so download is not allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124772, 403, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase but user is copilot, so preview download is allowed
     * should return 200
     */
    it('should return 200 when project is still in submission phase but user is copilot, so preview download is allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124776, 200, 'application/zip');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase but user is client manager, so preview download is allowed
     * should return 200
     */
    it('should return 200 when project is still in submission phase but user is client manager, so preview download is allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124835, 200, 'application/zip');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase and user is copilot, so original download is allowed
     * should return 200
     */
    it('should return 200 when project is still in submission phase and user is copilot, so original download is allowed', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionType=original', user124776, 200, 'application/zip');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase and user is client manager, so original download is not allowed
     * should return 403 frobidden error
     */
    it('should return 403 error when project is still in submission phase and user is client manager, so original download is not allowed', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionType=original', user124835, 403, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase but user has Direct permissions, so preview download is allowed
     * should return 200
     */
    it('should return 200 when project is still in submission phase but user has cockpit permissions, so preview download is allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124853, 200, 'application/zip');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase but user is Direct client administrator, so preview download is allowed
     * should return 200
     */
    it('should return 200 when project is still in submission phase but user is Direct client admin, so preview download is allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124856, 200, 'application/zip');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase but user is member of tc direct projects group, so preview download is allowed
     * should return 200
     */
    it('should return 200 when project is still in submission phase but user is member of tc direct projects group, so preview download is allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124857, 200, 'application/zip');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase but user is member of billing projects group, so preview download is allowed
     * should return 200
     */
    it('should return 200 when project is still in submission phase but user is member of billing projects group, so preview download is allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124861, 200, 'application/zip');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project is still in submission phase but user is member of group with auto-grant, so preview download is allowed
     * should return 200
     */
    it('should return 200 when project is still in submission phase but user is member of group with auto-grant, so preview download is allowed', function (done) {
        var req = getRequest('/v2/design/download/654021', user124916, 200, 'application/zip');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project review is over and user is general user and submissions are not vieable, so preview download is not allowed
     * should return 403 forbidden error
     */
    it('should return 403 error when project review is over and user is general user and submissions are not viewable', function (done) {
        var req = getRequest('/v2/design/download/654025', user132456, 403, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when project review is over and user is general user and submissions are viewable, so preview download is allowed
     * should return 200
     */
    it('should return 200 when project review is over and user is general user and submissions are viewable, so preview download is allowed', function (done) {
        var req = getRequest('/v2/design/download/654036', user132456, 200, 'application/zip');
        req.end(done);
    });

        /**
     * Test /v2/design/download/:submissionId when file of given type is downloaded
     * should return 200
     */
    it('should return 200 when file of given type is downloaded', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionImageTypeId=28', user124764, 200, 'image/png');
        req.expect('Content-Disposition', 'inline; filename=tablet-01.png');
        req.expect('Content-Length', '683');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when file of given type is downloaded and file index is also specified
     * This test also demonstrates the usage of an alternative path of image
     * should return 200
     */
    it('should return 200 when file of given type is downloaded and file index is also specified', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionImageTypeId=28&submissionFileIndex=2', user124764, 200, 'image/png');
        req.expect('Content-Disposition', 'inline; filename=mail-01.png');
        req.expect('Content-Length', '1339');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when file index is too large and file is not found
     * should return 404
     */
    it('should return 404 when file index is too large and file is not found', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionImageTypeId=28&submissionFileIndex=3', user124764, 404, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when submissionType is used instead of submissionImageTypeId
     * should return 200
     */
    it('should return 200 when submissionType is used instead of submissionImageTypeId', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionType=small', user124764, 200, 'image/png');
        req.expect('Content-Disposition', 'inline; filename=tablet-02.png');
        req.expect('Content-Length', '382');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when preview is requested but the preview zip is not found, so one full gallery image is returned
     * should return 200
     */
    it('should return 200 when when preview is requested but not found, so one full gallery image is returned', function (done) {
        var req = getRequest('/v2/design/download/654027', user124764, 200, 'image/png');
        req.expect('Content-Disposition', 'inline; filename=globe-01.png');
        req.expect('Content-Length', '14666');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when image with submissionImageTypeId is not found
     * should return 404
     */
    it('should return 404 when image with submissionImageTypeId is not found', function (done) {
        var req = getRequest('/v2/design/download/654021?submissionImageTypeId=31', user124764, 404, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when file is requested. Tests whether gif files are properly handled
     * should return 200
     */
    it('should return 200 when file is requested. Tests whether gif files are properly handled', function (done) {
        var req = getRequest('/v2/design/download/654027?submissionImageTypeId=26&submissionFileIndex=1', user124764, 200, 'image/gif');
        req.expect('Content-Disposition', 'inline; filename=sample.gif');
        req.expect('Content-Length', '113318');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when file is requested. Tests whether jpg files are properly handled
     * should return 200
     */
    it('should return 200 when file is requested. Tests whether jpg files are properly handled', function (done) {
        var req = getRequest('/v2/design/download/654027?submissionImageTypeId=26&submissionFileIndex=2', user124764, 200, 'image/jpeg');
        req.expect('Content-Disposition', 'inline; filename=sample.jpg');
        req.expect('Content-Length', '31394');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when file is requested. Tests whether bmp files are properly handled
     * Also tests that files are returned properly regardless of the case of the extension (which is BMP here)
     * should return 200
     */
    it('should return 200 when file is requested. Tests whether bmp files are properly handled', function (done) {
        var req = getRequest('/v2/design/download/654027?submissionImageTypeId=26&submissionFileIndex=3', user124764, 200, 'image/bmp');
        req.expect('Content-Disposition', 'inline; filename=sample.BMP');
        req.expect('Content-Length', '49206');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when file is requested. Tests whether iconfiles are properly handled
     * should return 200
     */
    it('should return 200 when file is requested. Tests whether ico files are properly handled', function (done) {
        var req = getRequest('/v2/design/download/654027?submissionImageTypeId=26&submissionFileIndex=4', user124764, 200, 'image/ico');
        req.expect('Content-Disposition', 'inline; filename=sample.ico');
        req.expect('Content-Length', '110050');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when original submission is requested by submitter
     * Note that the filename is the response is the original file name
     * should return 200
     */
    it('should return 200 when original submission is requested by submitter', function (done) {
        var req = getRequest('/v2/design/download/654036?submissionType=original', user124764, 200, 'application/zip');
        req.expect('Content-Disposition', 'inline; filename=full36.zip');
        req.expect('Content-Length', '374211');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when original submission is requested by studio admin
     * Note that the filename is the response is the file name with the submitter id
     * should return 200
     */
    it('should return 200 when original submission is requested by studio admin', function (done) {
        var req = getRequest('/v2/design/download/654036?submissionType=original', user124834, 200, 'application/zip');
        req.expect('Content-Disposition', 'inline; filename=654036.zip');
        req.expect('Content-Length', '374211');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when original submission is requested by manager
     * The submission should be downloadable even if it not marked for purchase
     * should return 200
     */
    it('should return 200 when original submission is requested by manager', function (done) {
        var req = getRequest('/v2/design/download/654036?submissionType=original', user124766, 200, 'application/zip');
        req.expect('Content-Disposition', 'inline; filename=654036.zip');
        req.expect('Content-Length', '374211');
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when original submission is requested by client but is not allowed as it is not purchased
     * should return 403
     */
    it('should return 403 when original submission is requested by client but is not allowed as it is not purchased', function (done) {
        var req = getRequest('/v2/design/download/654036?submissionType=original', user124852, 403, /json/);
        req.end(done);
    });

    /**
     * Test /v2/design/download/:submissionId when original submission is requested by client and is allowed as it is purchased
     * should return 200
     */
    it('should return 200 when original submission is requested by client and is allowed as it is purchased', function (done) {
        var req = getRequest('/v2/design/download/654037?submissionType=original', user124852, 200, 'application/zip');
        req.expect('Content-Disposition', 'inline; filename=654037.zip');
        req.expect('Content-Length', '374211');
        req.end(done);
    });
});
