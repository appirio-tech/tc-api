/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author kurtrips
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true, nomen: true, vars: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");
var http = require('http');
var _ = require('underscore');
var config = require('../config.js');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/devUploadSubmission/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = require('../config').config.general.oauthClientId;
var SECRET = require('../config').config.general.oauthClientSecret;
var jwt = require('jsonwebtoken');

describe('Submit for develop challenge', function () {

    /**
    * Users that we have setup.
    */
    var user124764 = 'facebook|fb124764',
        user124834 = 'facebook|fb124834';

    /**
     * The mock thrugood server for testing
     */
    var mockThurgoodServer;

    /**
     * The path to a sample zipped submission
     */
    var sampleSubmissionPath = './test/test_files/dev_upload_submission/sample_submission.zip';

    /**
     * The path to a sample zipped submission which is too large
     */
    var sampleSubmissionPathTooLarge = './test/test_files/dev_upload_submission/sample_submission_too_large.zip';

     /**
     * Return the authentication header to be used for the given user.
     * @param {Object} user the user to authenticate
     */
    function getAuthHeader(user) {
        return "Bearer " + jwt.sign({sub: user}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
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
        return request(API_ENDPOINT)
            .post(url)
            .set('Accept', 'application/json')
            .set('Authorization', getAuthHeader(user))
            .expect('Content-Type', /json/)
            .expect(expectedStatusCode);
    }


    this.timeout(120000); // The api with testing remote db could be quit slow

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
            }, function (cb) {
                // This is the mock Thurgood server
                // It returns success always with data._id = 123456
                mockThurgoodServer = http.createServer(function (request, response) {
                    response.writeHead(200, {"Content-Type": "applcation/json"});
                    var res = {
                        success: 'true',
                        data: {
                            _id: 123456
                        }
                    };
                    response.end(JSON.stringify(res));
                });

                // Listen on port 8090, IP defaults to 127.0.0.1
                mockThurgoodServer.listen(8090);

                // Put a friendly message on the terminal
                console.log("Mock Thurgood Server running at http://127.0.0.1:8090/");
                cb();
            }
        ], done);
    });

    /**
     * This function is run after all tests.
     * Close the mock thurgood server.
     * @param {Function<err>} done the callback
     */
    after(function (done) {
        mockThurgoodServer.close();
        clearDb(done);
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit for success
     * should return json containing uploadId and submissionId
     * respective entries in upload, submission and resource_submission tables must be present
     * the file must be present in the submissions folder
     * the thurgood id must be set in submission table
     */
    it('should submit successfully', function (done) {
        var req = getRequest('/v2/develop/challenges/77701/submit', user124764, 200);
        var buffer = fs.readFileSync(sampleSubmissionPath);

        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }

                async.series([
                    function (cb) {
                        //Check if the row was created properly in upload table
                        var sql = "* from upload where upload_id = " + resp.body.uploadId;
                        testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                            var expected = {
                                project_phase_id: 77702,
                                resource_id: 77711,
                                parameter: resp.body.uploadId + '_sample_submission.zip',
                                modify_user: '124764',
                                project_id: 77701,
                                upload_type_id: 1,
                                create_user: '124764',
                                upload_status_id: 1,
                                upload_id: resp.body.uploadId
                            };
                            var actual = _.omit(result[0], ['create_date', 'modify_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected of upload table did not match');
                            cb(err, result);
                        });
                    }, function (cb) {
                        //Check if the row was created properly in submission table
                        var sql = "* from submission where submission_id = " + resp.body.submissionId;
                        testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                            var expected = {
                                submission_id: resp.body.submissionId,
                                upload_id: resp.body.uploadId,
                                submission_status_id: 1,
                                submission_type_id: 1,
                                modify_user: '124764',
                                create_user: '124764',
                                thurgood_job_id: '123456'
                            };
                            var actual = _.omit(result[0], ['create_date', 'modify_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected of submission table did not match');
                            cb(err, result);
                        });
                    }, function (cb) {
                        //Check if the row was created properly in resource_submission table
                        var sql = "* from resource_submission where submission_id = " + resp.body.submissionId;
                        testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                            var expected = {
                                resource_id: 77711,
                                modify_user: '124764',
                                create_user: '124764',
                                submission_id: resp.body.submissionId
                            };
                            var actual = _.omit(result[0], ['create_date', 'modify_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected of resource_submission table did not match');
                            cb(err, result);
                        });
                    }
                ], done);
            });
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit for success when checkpoint submission is made
     * should return json containing uploadId and submissionId
     * respective entries in upload, submission and resource_submission tables must be present
     * the file must be present in the submissions folder
     * the thurgood id must NOT be set in submission table because it applies only to final submissions
     */
    it('should submit checkpoint successfully', function (done) {
        var req = getRequest('/v2/develop/challenges/77701/submit?type=checkpoint', user124764, 200);
        var buffer = fs.readFileSync(sampleSubmissionPath);

        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }

                async.series([
                    function (cb) {
                        //Check if the row was created properly in upload table
                        var sql = "* from upload where upload_id = " + resp.body.uploadId;
                        testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                            var expected = {
                                project_phase_id: 77705,
                                resource_id: 77711,
                                parameter: resp.body.uploadId + '_sample_submission.zip',
                                modify_user: '124764',
                                project_id: 77701,
                                upload_type_id: 1,
                                create_user: '124764',
                                upload_status_id: 1,
                                upload_id: resp.body.uploadId
                            };
                            var actual = _.omit(result[0], ['create_date', 'modify_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected of upload table did not match');
                            cb(err, result);
                        });
                    }, function (cb) {
                        //Check if the row was created properly in submission table. No thurgood_job_id must be present
                        var sql = "* from submission where submission_id = " + resp.body.submissionId;
                        testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                            var expected = {
                                submission_id: resp.body.submissionId,
                                upload_id: resp.body.uploadId,
                                submission_status_id: 1,
                                submission_type_id: 3,
                                modify_user: '124764',
                                create_user: '124764'
                            };
                            var actual = _.omit(result[0], ['create_date', 'modify_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected of submission table did not match');
                            cb(err, result);
                        });
                    }, function (cb) {
                        //Check if the row was created properly in resource_submission table
                        var sql = "* from resource_submission where submission_id = " + resp.body.submissionId;
                        testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                            var expected = {
                                resource_id: 77711,
                                modify_user: '124764',
                                create_user: '124764',
                                submission_id: resp.body.submissionId
                            };
                            var actual = _.omit(result[0], ['create_date', 'modify_date']);
                            assert.deepEqual(actual, expected, 'Actual and Expected of resource_submission table did not match');
                            cb(err, result);
                        });
                    }
                ], done);
            });
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit for success
     * the project has no thurgood properties
     * the thurgood id in the submission table must be null
     */
    it('should submit successfully for project with no thurgood properties', function (done) {
        var req = getRequest('/v2/develop/challenges/77707/submit', user124764, 200),
            buffer = fs.readFileSync(sampleSubmissionPath);

        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }

                //Check if the thurgoodJobId in submission table is null
                var sql = "thurgood_job_id from submission where submission_id = " + resp.body.submissionId;
                testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                    assert.deepEqual(result[0], {}, "The thurgood_job_id must be null in DB");
                    done(err);
                });
            });
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit for success when multiple submissions are made but are not allowed
     * The submissions are made in this order checkpoint1, checkpoint2, submission1, submission2
     * checkpoint1 must become inactive when checkpoint2 is made
     * checkpoint2 must remain active when submission1 is made
     * submission1 must become inactive after submission2 is made
     */
    it('should submit successfully when multiple submissions are made but are not allowed', function (done) {
        var c1uid,
            c1sid,
            c2uid,
            c2sid,
            s1uid,
            s1sid,
            s2uid,
            s2sid;

        async.series([
            function (cb) {
                var req = getRequest('/v2/develop/challenges/77708/submit?type=checkpoint', user124764, 200),
                    buffer = fs.readFileSync(sampleSubmissionPath);
                req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
                    .end(function (err, resp) {
                        c1uid = resp.body.uploadId;
                        c1sid = resp.body.submissionId;
                        cb(err);
                    });
            }, function (cb) {
                var req = getRequest('/v2/develop/challenges/77708/submit?type=checkpoint', user124764, 200),
                    buffer = fs.readFileSync(sampleSubmissionPath);
                req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
                    .end(function (err, resp) {
                        c2uid = resp.body.uploadId;
                        c2sid = resp.body.submissionId;
                        cb(err);
                    });
            }, function (cb) {
                var req = getRequest('/v2/develop/challenges/77708/submit', user124764, 200),
                    buffer = fs.readFileSync(sampleSubmissionPath);
                req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
                    .end(function (err, resp) {
                        s1uid = resp.body.uploadId;
                        s1sid = resp.body.submissionId;
                        cb(err);
                    });
            }, function (cb) {
                var req = getRequest('/v2/develop/challenges/77708/submit', user124764, 200),
                    buffer = fs.readFileSync(sampleSubmissionPath);
                req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
                    .end(function (err, resp) {
                        s2uid = resp.body.uploadId;
                        s2sid = resp.body.submissionId;
                        cb(err);
                    });
            }, function (cb) {
                //Now we test for correctness
                var sql = "u.upload_id, u.upload_status_id, s.submission_id, s.submission_status_id from upload u, submission s where " +
                    "u.upload_id = s.upload_id AND s.submission_id IN (" + c1sid + "," + c2sid + "," + s1sid + "," + s2sid + ")"
                    + " AND u.upload_id IN (" + c1uid + "," + c2uid + "," + s1uid + "," + s2uid + ")";
                testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                    //The checkpoint1 must be deleted
                    var c1rec = _.findWhere(result, {upload_id: c1uid});
                    assert.equal(c1rec.upload_status_id, 2);
                    assert.equal(c1rec.submission_status_id, 5);

                    //The checkpoint2 must still be active
                    var c2rec = _.findWhere(result, {upload_id: c2uid});
                    assert.equal(c2rec.upload_status_id, 1);
                    assert.equal(c2rec.submission_status_id, 1);

                    //The submission1 must be deleted
                    var s1rec = _.findWhere(result, {upload_id: s1uid});
                    assert.equal(s1rec.upload_status_id, 2);
                    assert.equal(s1rec.submission_status_id, 5);

                    //The submission2 must be active
                    var s2rec = _.findWhere(result, {upload_id: s2uid});
                    assert.equal(s2rec.upload_status_id, 1);
                    assert.equal(s2rec.submission_status_id, 1);

                    cb(err);
                });
            }
        ], done);
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit for success when multiple submissions are made and are allowed
     * The submissions are made in this order checkpoint1, checkpoint2, submission1, submission2
     * All submissions and uploads must remain active.
     */
    it('should submit successfully when multiple submissions are made and are allowed', function (done) {
        var c1uid,
            c1sid,
            c2uid,
            c2sid,
            s1uid,
            s1sid,
            s2uid,
            s2sid;

        async.series([
            function (cb) {
                var req = getRequest('/v2/develop/challenges/77709/submit?type=checkpoint', user124764, 200),
                    buffer = fs.readFileSync(sampleSubmissionPath);
                req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
                    .end(function (err, resp) {
                        c1uid = resp.body.uploadId;
                        c1sid = resp.body.submissionId;
                        cb(err);
                    });
            }, function (cb) {
                var req = getRequest('/v2/develop/challenges/77709/submit?type=checkpoint', user124764, 200),
                    buffer = fs.readFileSync(sampleSubmissionPath);
                req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
                    .end(function (err, resp) {
                        c2uid = resp.body.uploadId;
                        c2sid = resp.body.submissionId;
                        cb(err);
                    });
            }, function (cb) {
                var req = getRequest('/v2/develop/challenges/77709/submit', user124764, 200),
                    buffer = fs.readFileSync(sampleSubmissionPath);
                req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
                    .end(function (err, resp) {
                        s1uid = resp.body.uploadId;
                        s1sid = resp.body.submissionId;
                        cb(err);
                    });
            }, function (cb) {
                var req = getRequest('/v2/develop/challenges/77709/submit', user124764, 200),
                    buffer = fs.readFileSync(sampleSubmissionPath);
                req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
                    .end(function (err, resp) {
                        s2uid = resp.body.uploadId;
                        s2sid = resp.body.submissionId;
                        cb(err);
                    });
            }, function (cb) {
                //Now we test for correctness
                var sql = "u.upload_id, u.upload_status_id, s.submission_id, s.submission_status_id from upload u, submission s where " +
                    "u.upload_id = s.upload_id AND s.submission_id IN (" + c1sid + "," + c2sid + "," + s1sid + "," + s2sid + ")"
                    + " AND u.upload_id IN (" + c1uid + "," + c2uid + "," + s1uid + "," + s2uid + ")";
                testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                    //The checkpoint1 must be active
                    var c1rec = _.findWhere(result, {upload_id: c1uid});
                    assert.equal(c1rec.upload_status_id, 1);
                    assert.equal(c1rec.submission_status_id, 1);

                    //The checkpoint2 must be active
                    var c2rec = _.findWhere(result, {upload_id: c2uid});
                    assert.equal(c2rec.upload_status_id, 1);
                    assert.equal(c2rec.submission_status_id, 1);

                    //The submission1 must be active
                    var s1rec = _.findWhere(result, {upload_id: s1uid});
                    assert.equal(s1rec.upload_status_id, 1);
                    assert.equal(s1rec.submission_status_id, 1);

                    //The submission2 must be active
                    var s2rec = _.findWhere(result, {upload_id: s2uid});
                    assert.equal(s2rec.upload_status_id, 1);
                    assert.equal(s2rec.submission_status_id, 1);

                    cb(err);
                });
            }
        ], done);
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when user is not logged-in
     * should return 401 error
     */
    it('should return 401 error when not logged-in', function (done) {
        var req = request(API_ENDPOINT)
            .post('/v2/develop/challenges/77701/submit')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(401);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(done);
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when challenge id is not a number
     * should return 400 error
     */
    it('should return 400 error challenge id is not a number', function (done) {
        var req = getRequest('/v2/develop/challenges/blah/submit', user124764, 400);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(done);
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when challenge id is too large
     * should return 400 error
     */
    it('should return 400 error challenge id is too large', function (done) {
        var req = getRequest('/v2/develop/challenges/2893473289749283749237489327498273497238947/submit', user124764, 400);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(done);
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when file data is empty
     * should return 400 error
     */
    it('should return 400 error when file data is empty', function (done) {
        var req = getRequest('/v2/develop/challenges/77701/submit', user124764, 400);

        req.send({ fileName: 'sample_submission.zip', fileData: '     ' })
            .end(done);
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when file name is empty
     * should return 400 error
     */
    it('should return 400 error when file name is empty', function (done) {
        var req = getRequest('/v2/develop/challenges/77701/submit', user124764, 400);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: '     ', fileData: buffer.toString('base64') })
            .end(done);
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when type is not allowed
     * should return 400 error
     */
    it('should return 400 error when type is not allowed', function (done) {
        var req = getRequest('/v2/develop/challenges/77701/submit?type=nono', user124764, 400);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(done);
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when file name is more than 256 chars
     * should return 400 error
     */
    it('should return 400 error when file name is more than 256 chars', function (done) {
        var req = getRequest('/v2/develop/challenges/77701/submit', user124764, 400);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'kdhbfkjdshfkjshdkfjhsdkjfhdskjfhksjdhfkjdshfkjdshfkjsdhfkjdshfkjdshfkjdshfkjhdskjfhsdkjfhkjsdhfkjsdhfkjsdhfkjshdkjfhsdkjfhskjdhfkjdshfkjshdkjfhskjdfhskjdfhkjsdhfkjsdhfkjdshfkjhsdkjfhkjsdhfkjdshfkjshdfkjhsdkjfhkjsdhfkjdshkjfhskjdfhkjsdhfkjsdhfkjhsdkjfhkjsdhfkjsdhkjdsjfkhskjdhfkjsdhfkjsh.txt', fileData: buffer.toString('base64') })
            .end(done);
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when contest does not exist
     * should return 404 error
     */
    it('should return 404 error when contest does not exist', function (done) {
        var req = getRequest('/v2/develop/challenges/77799/submit', user124764, 404);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "No such challenge exists.");
                done();
            });
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when contest is not a develop challenge
     * should return 400 error
     */
    it('should return 400 error when contest is not a develop challenge', function (done) {
        var req = getRequest('/v2/develop/challenges/77702/submit', user124764, 400);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "Non-develop challenges are not supported.");
                done();
            });
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when submission phase is not open
     * should return 400 error
     */
    it('should return 400 error when contest submission phase is not open', function (done) {
        var req = getRequest('/v2/develop/challenges/77703/submit', user124764, 400);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "Submission phase for this challenge is not open.");
                done();
            });
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when type is checkpoint and checkpoint submission phase is not open
     * should return 400 error
     */
    it('should return 400 error when type is checkpoint and checkpoint submission phase is not open', function (done) {
        var req = getRequest('/v2/develop/challenges/77704/submit?type=checkpoint', user124764, 400);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "Checkpoint submission phase for this challenge is not open.");
                done();
            });
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when contest type is MM
     * should return 400 error
     */
    it('should return 400 error when contest type is MM', function (done) {
        var req = getRequest('/v2/develop/challenges/77705/submit', user124764, 400);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "Submission to Marathon Matches and Spec Reviews are not supported.");
                done();
            });
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when contest type is Spec Review
     * should return 400 error
     */
    it('should return 400 error when contest type is Spec Review', function (done) {
        var req = getRequest('/v2/develop/challenges/77706/submit', user124764, 400);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "Submission to Marathon Matches and Spec Reviews are not supported.");
                done();
            });
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when user does not have Submitter role
     * should return 403 error
     */
    it('should return 403 error when user does not have Submitter role', function (done) {
        var req = getRequest('/v2/develop/challenges/77701/submit', user124834, 403);

        var buffer = fs.readFileSync(sampleSubmissionPath);
        req.send({ fileName: 'sample_submission.zip', fileData: buffer.toString('base64') })
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "You cannot submit for this challenge as you are not a Submitter.");
                done();
            });
    });

    /**
     * Test /v2/develop/challenges/:challengeId/submit when user submits a file which is larger than what we have configured
     * should return 413 error
     */
    it('should return 413 error user submits a file which is larger than what we have configured', function (done) {
        var req = getRequest('/v2/develop/challenges/77701/submit', user124764, 413);

        var buffer = fs.readFileSync(sampleSubmissionPathTooLarge);
        req.send({ fileName: 'sample_submission_too_large.zip', fileData: buffer.toString('base64') })
            .end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details,
                    "The submission file size is greater than the max allowed size: " + (config.config.submissionMaxSizeBytes / 1024) + " KB.");
                done();
            });
    });
});
