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
var DOCS_DIR = __dirname + "/test_files/dev_download_submission";
var SQL_DIR = __dirname + "/sqls/devDownloadSubmission/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId;
var SECRET = require('../config/tc-config').tcConfig.oauthClientSecret;
var jwt = require('jsonwebtoken');

describe('Download Submission API', function () {

    /**
    * Users that we have setup.
    */
    var user124764 = 'facebook|fb124764', //Hung
        user124772 = 'facebook|fb124772', //Partha
        user124766 = 'facebook|fb124766', //twight
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
     * Checks whether the entry in project_download_audit table is made correctly
     * @param {Number} uploadId The uploadId of the document being downloaded
     * @param {Number} userId The id of user trying to download
     * @param {Boolean} successful whether the download was successful
     * @param {Function} done the callback to call after we are done
     */
    function checkProjectDownloadAudit(uploadId, userId, successful, done) {
        var sql = "* from project_download_audit where upload_id = " + uploadId + " and user_id = " + userId;
        testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
            var expected = {
                upload_id: uploadId,
                user_id: userId,
                successful: successful
            };
            assert.equal(result.length, 1, 'Exactly one record must be present for these parameters in project_download_audit table');
            var actual = _.omit(result[0], ['ip_address', 'date']); //Cannot be sure what ip will be used on test. date will be CURRENT
            assert.isNotNull(result[0].ip_address);
            assert.isNotNull(result[0].date);
            assert.deepEqual(actual, expected, 'Actual and Expected of project_download_audit table did not match');
            done(err);
        });
    }

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "common_oltp__clean", "common_oltp", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", "tcs_catalog", cb);
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
        clearDb(done);
    });

    /**
     * Test /v2/develop/download/:submissionId but submissionId is negative
     * should return 400 error
     */
    it('should return 400 error when submission id is negative', function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/download/-88821')
            .expect('Content-Type', /json/)
            .expect(400, done);
    });

    /**
     * Test /v2/develop/download/:submissionId but submissionId is 0
     * should return 400 error
     */
    it('should return 400 error when submission id is 0', function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/download/0')
            .expect('Content-Type', /json/)
            .expect(400, done);
    });

    /**
     * Test /v2/develop/download/:submissionId but submissionId is larger than max integer
     * should return 400 error
     */
    it('should return 400 error when submission id is larger than max integer', function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/download/2579842759873495873894759834758937498357948539457')
            .expect('Content-Type', /json/)
            .expect(400, done);
    });

    /**
     * Test /v2/develop/download/:submissionId but user is not logged-in and it is not thurgood request
     * should return 401 error
     */
    it('should return 401 error when not authenticated and not a thurgood request', function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/download/88821')
            .expect('Content-Type', /json/)
            .expect(401, done);
    });

    /**
     * Test /v2/develop/download/:submissionId and user is not logged-in but it is a thurgood request
     * The file should be downloaded even if user not logged-in
     */
    it('should download file for thurgood request', function (done) {
        request(API_ENDPOINT)
            .get('/v2/develop/download/88821?username=iamthurgood&password=secret')
            .expect('Content-Type', "application/zip")
            .expect(200, done);
    });

    /**
     * Test /v2/develop/download/:submissionId when upload does not exist
     * should return 404 error
     */
    it('should return 404 error when upload does not exist', function (done) {
        var req = getRequest('/v2/develop/download/88899', user124764, 404, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "No such upload exists.");
            done();
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when project is not a develop project
     * should return 400 error
     */
    it('should return 400 error when not a develop project', function (done) {
        var req = getRequest('/v2/develop/download/88881', user124764, 400, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "Non-Develop challenge submissions are not supported by this API.");
            done();
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when project is a marathon match
     * should return 400 error
     */
    it('should return 400 error when marathon match', function (done) {
        var req = getRequest('/v2/develop/download/88882', user124764, 400, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "Marathon Match and Spec Review submissions are not supported by this API.");
            done();
        });
    });

    /*
     * Test /v2/develop/download/:submissionId when upload is a submission but is deleted
     * should return 400 error
     */
    it('should return 404 error when upload deleted', function (done) {
        var req = getRequest('/v2/develop/download/88822', user124764, 404, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "This submission has been deleted.");
            done();
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when user is the copilot regardless of the phase
     * Here the contest is in submission phase, so only manager level users and the submitter can download the submission
     * should return 200
     */
    it('should return 200 when user is copilot for the contest', function (done) {
        var req = getRequest('/v2/develop/download/88821', user124776, 200, "application/zip");
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            checkProjectDownloadAudit(88821, 124776, true, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when user is the submitter regardless of the phase
     * Here the contest is in submission phase, so only manager level users and the submitter can download the submission
     * should return 200
     */
    it('should return 200 when user is submitter for the contest', function (done) {
        var req = getRequest('/v2/develop/download/88821', user124764, 200, "application/zip");
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            checkProjectDownloadAudit(88821, 124764, true, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when user is the screener but the screening phase is not yet open
     * should return 403
     * should log the failed download attempt to the project_download_audit table
     */
    it('should return 403 when user is screener for the contest but the screening phase is not yet open', function (done) {
        var req = getRequest('/v2/develop/download/88821', user124766, 403, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "You are not allowed to download the submission in this phase.");
            checkProjectDownloadAudit(88821, 124766, false, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when user is the screener and current phase is screening
     * The user has 2 roles, Reviewer and Screener, but Screener takes precedence here.
     * should return 200
     */
    it('should return 200 when user is screener and current phase is screening', function (done) {
        var req = getRequest('/v2/develop/download/88824', user124766, 200, "application/zip");
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            checkProjectDownloadAudit(88824, 124766, true, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when user is the reviewer but the review phase is not yet open
     * should return 403
     * should log the failed download attempt to the project_download_audit table
     */
    it('should return 403 when user is reviewer for the contest but the review phase is not yet open', function (done) {
        var req = getRequest('/v2/develop/download/88824', user124772, 403, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "You are not allowed to download the submission in this phase.");
            checkProjectDownloadAudit(88824, 124772, false, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when user is the reviewer and current phase is review
     * should return 200
     */
    it('should return 200 when user is reviewer and current phase is review', function (done) {
        var req = getRequest('/v2/develop/download/88825', user124772, 200, "application/zip");
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            checkProjectDownloadAudit(88825, 124772, true, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when user tries to submit someone else's submission but review process not over
     * should return 403
     * should log the failed download attempt to the project_download_audit table
     */
    it('should return 403 when when user tries to submit someone else\'s submission but review process not over', function (done) {
        var req = getRequest('/v2/develop/download/88825', user124776, 403, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "You are not allowed to download another submitter's submission in this phase.");
            checkProjectDownloadAudit(88825, 124776, false, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when user failed screening and tries do download someone else's submission
     * should return 403
     * should log the failed download attempt to the project_download_audit table
     */
    it('should return 403 when when user failed screening and tries do download someone else\'s submission', function (done) {
        var req = getRequest('/v2/develop/download/88826', user124776, 403, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "You are not allowed to download the submission because you did not pass screening.");
            checkProjectDownloadAudit(88826, 124776, false, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when user tries to download another user's submission.
     * The user is another submitter who passed review and current phase is aggregation (so review process is over). So method should succeed
     * should return 200
     */
    it('should return 200 when user tries to download another user\'s submission.', function (done) {
        var req = getRequest('/v2/develop/download/88826', user124772, 200, "application/zip");
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            checkProjectDownloadAudit(88826, 124772, true, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when iterative reviewer tried to download a submission already reviewed by him.
     * should return 200 as method should succeed
     */
    it('should return 200 when iterative reviewer tried to download a submission already reviewed by him.', function (done) {
        var req = getRequest('/v2/develop/download/88831', user124766, 200, "application/zip");
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            checkProjectDownloadAudit(88831, 124766, true, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when iterative reviewer tries to download next in queue submission.
     * should return 200 as method should succeed
     */
    it('should return 200 when iterative reviewer tries to download next in queue submission', function (done) {
        var req = getRequest('/v2/develop/download/88834', user124766, 200, "application/zip");
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            checkProjectDownloadAudit(88834, 124766, true, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when iterative reviewer tries to download submission not yet reviewed and not next in queue
     * should return 403
     * should log the failed download attempt to the project_download_audit table
     */
    it('should return 403 when when iterative reviewer tries to download submission not yet reviewed and not next in queue', function (done) {
        var req = getRequest('/v2/develop/download/88835', user124766, 403, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "You are not allowed to download this submission.");
            checkProjectDownloadAudit(88835, 124766, false, done);
        });
    });

    /**
     * Test /v2/develop/download/:submissionId for success when zip format
     * should return 200
     */
    it('should return 200 and testing for zip format', function (done) {
        var filename = "test.zip";
        var expectedLength = fs.statSync(DOCS_DIR + "/" + filename).size;

        var req = getRequest('/v2/develop/download/88840', user124764, 200, "application/zip");
        req.expect('Content-Disposition', 'attachment; filename=' + filename);
        req.expect('Content-Length', String(expectedLength));
        req.end(done);
    });

    /**
     * Test /v2/develop/download/:submissionId for success when tar.gz format
     * should return 200
     */
    it('should return 200 and testing for tar.gz format', function (done) {
        var filename = "test.tar.gz";
        var expectedLength = fs.statSync(DOCS_DIR + "/" + filename).size;

        var req = getRequest('/v2/develop/download/88841', user124764, 200, "application/octet-stream");
        req.expect('Content-Disposition', 'attachment; filename=' + filename);
        req.expect('Content-Length', String(expectedLength));
        req.end(done);
    });

    /**
     * Test /v2/develop/download/:submissionId for success when doc format
     * should return 200
     */
    it('should return 200 and testing for doc format', function (done) {
        var filename = "test.doc";
        var expectedLength = fs.statSync(DOCS_DIR + "/" + filename).size;

        var req = getRequest('/v2/develop/download/88842', user124764, 200, "application/msword");
        req.expect('Content-Disposition', 'attachment; filename=' + filename);
        req.expect('Content-Length', String(expectedLength));
        req.end(done);
    });

    /**
     * Test /v2/develop/download/:submissionId for success when 7z format
     * should return 200
     */
    it('should return 200 and testing for 7z format', function (done) {
        var filename = "test.7z";
        var expectedLength = fs.statSync(DOCS_DIR + "/" + filename).size;

        var req = getRequest('/v2/develop/download/88843', user124764, 200, "application/x-7z-compressed");
        req.expect('Content-Disposition', 'attachment; filename=' + filename);
        req.expect('Content-Length', String(expectedLength));
        req.end(done);
    });

    /**
     * Test /v2/develop/download/:submissionId for success when jar format
     * should return 200
     */
    it('should return 200 and testing for jar format', function (done) {
        var filename = "test.jar";
        var expectedLength = fs.statSync(DOCS_DIR + "/" + filename).size;

        var req = getRequest('/v2/develop/download/88844', user124764, 200, "application/java-archive");
        req.expect('Content-Disposition', 'attachment; filename=' + filename);
        req.expect('Content-Length', String(expectedLength));
        req.end(done);
    });

    /**
     * Test /v2/develop/download/:submissionId for success when docx format
     * should return 200
     */
    it('should return 200 and testing for docx format', function (done) {
        var filename = "test.docx";
        var expectedLength = fs.statSync(DOCS_DIR + "/" + filename).size;

        var req = getRequest('/v2/develop/download/88845', user124764, 200, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        req.expect('Content-Disposition', 'attachment; filename=' + filename);
        req.expect('Content-Length', String(expectedLength));
        req.end(done);
    });

    /**
     * Test /v2/develop/download/:submissionId when user is the checkpoint reviewer and project is in checkpoint screening and upload is checkpoint
     * should return 403
     */
    it('should return 403 when user is the checkpoint reviewer and project is in checkpoint screening and upload is checkpoint', function (done) {
        var req = getRequest('/v2/develop/download/88851', user124772, 403, /json/);
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, "You are not allowed to download the submission in this phase.");
            done();
        });
    });

    /**
     * Test /v2/develop/download/:submissionId when user is checkpoint screener and project is in checkpoint screening and upload is checkpoint
     * should return 200
     */
    it('should return 200 when user is the checkpoint screener and project is in checkpoint screening and upload is checkpoint', function (done) {
        var req = getRequest('/v2/develop/download/88851', user124776, 200, "application/zip");
        req.end(done);
    });

    /**
     * Test /v2/develop/download/:submissionId when user is checkpoint reviewer and project is in checkpoint review and upload is checkpoint
     * should return 200
     */
    it('should return 200 when user is the checkpoint reviewer and project is in checkpoint review and upload is checkpoint', function (done) {
        var req = getRequest('/v2/develop/download/88852', user124772, 200, "application/zip");
        req.end(done);
    });

    /**
     * Test /v2/develop/download/:submissionId when user is the post-mortem reviewer and upload is checkpoint (regardless of phase)
     * should return 200
     */
    it('should return 200 when when user is the post-mortem reviewer and upload is checkpoint (regardless of phase)', function (done) {
        var req = getRequest('/v2/develop/download/88823', user124772, 200, "application/zip");
        req.end(done);
    });

    /*
     * Test /v2/develop/download/:submissionId when upload is deleted but user has role to view all submissions
     * should return 200
     */
    it('should return 200 success when upload deleted but user has role to view all submissions', function (done) {
        var req = getRequest('/v2/develop/download/88822', user124776, 200, "application/zip");
        req.end(done);
    });

    /**
     * Test /v2/develop/download/:submissionId when user is normal reviewer and project is in checkpoint review and upload is checkpoint
     * should return 403
     */
    it('should return 403 when user is normal reviewer and project is in checkpoint review and upload is checkpoint', function (done) {
        var req = getRequest('/v2/develop/download/88852', user124766, 403, /json/);
        req.end(done);
    });
});
