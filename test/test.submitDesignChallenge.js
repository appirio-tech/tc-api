/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author kurtrips, isv
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
var _ = require('underscore');
var async = require('async');
var config = require('../config.js');
var usv = require("../common/unifiedSubmissionValidator");

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/desUploadSubmission/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = require('../config').config.general.oauthClientId;
var SECRET = require('../config').config.general.oauthClientSecret;
var jwt = require('jsonwebtoken');

/**
 * Stores submission ids for testing
 */
var submissionIds = [];

describe('Submit for design challenge', function () {

    /**
    * Users that we have setup.
    */
    var user124764 = 'facebook|fb124764',
        user124766 = 'facebook|fb124766';

    /**
     * The path to a sample submission zip
     */
    var sampleSubmissionPath = './test/test_files/des_upload_submission/submission.zip';

    /**
     * The path to a sample source zip
     */
    var sampleSourcePath = './test/test_files/des_upload_submission/source.zip';

    /**
     * The path to a sample preview file
     */
    var samplePreviewPath = './test/test_files/des_upload_submission/preview.jpg';

    /**
     * The path to an unknown type file
     */
    var unknownTypePath = './test/test_files/des_upload_submission/strange.blah';

    /**
     * Deletes specified folder recursively.
     * 
     * @param {String} path - a path to folder to be deleted.
     */
    function deleteFolderRecursive(path) {
        if (fs.existsSync(path)) {
            fs.readdirSync(path).forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }

    /**
     * Return the authentication header to be used for the given user.
     * @param {Object} user the user to authenticate
     */
    function getAuthHeader(user) {
        var authHeader = "Bearer " + jwt.sign({sub: user}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
        return authHeader;
    }

    /**
     * Creates a Request object using the given URL and with the 3 submission files
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
            .expect(expectedStatusCode)
            .attach('submissionFile', sampleSubmissionPath)
            .attach('sourceFile', sampleSourcePath)
            .attach('previewFile', samplePreviewPath);

        return req;
    }

    /**
     * Creates a Request object using the given URL without the 3 submission files
     * Sets the Authorization header for the given user.
     * Sets the expected response code using the expectedStatusCode parameter
     * @param {String} url the url to connect
     * @param {Object} user the user to authenticate
     * @param {Number} expectedStatusCode the expected status code of the response
     */
    function getBareRequest(url, user, expectedStatusCode) {
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
                testHelper.runSqlFile(SQL_DIR + "common_oltp__clean", "common_oltp", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean", "tcs_catalog", cb);
            }
        ], done);
    }

    /**
     * Checks if records have been inserted into image, submission_image tables and image files have been generated for
     * tested submission.
     * 
     * @param {Number} submissionId - ID for generated submission.
     * @param {Function} callback - a callback to be notified when done.
     */
    function checkGeneratedImages(submissionId, callback) {
        var images = [],
            imageFileName,
            imageMapped,
            submissionDir = usv.createDesignSubmissionPath(432001, 124764, 'hung');

        async.waterfall([
            function (cb) {
                // check image table
                var sql = "* from image ORDER BY image_id";
                testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        assert.equal(result.length, 21, 'Wrong number of images inserted into image table');
                        result.forEach(function (row) {
                            images.push({imageId: row.image_id, typeId: row.image_type_id, fileName: row.file_name});
                        });
                        cb();
                    }
                });

            }, function (cb) {
                // check submission_image table
                var sql = "* from submission_image WHERE submission_id = " + submissionId + " ORDER BY image_id";
                testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        imageMapped = false;
                        assert.equal(result.length, 21, 'Wrong number of images inserted into submission_image table');
                        result.forEach(function (row) {
                            images.forEach(function (image) {
                                if (image.imageId === row.image_id) {
                                    imageMapped = true;
                                }
                            });
                        });
                        assert.isTrue(imageMapped, "Wrong image mapped to submission");
                        cb();
                    }
                });
            }, function (cb) {
                // check files
                images.forEach(function (image) {
                    imageFileName = submissionDir + image.fileName;
                    assert.isTrue(fs.existsSync(imageFileName), "Generated image file is not found");
                });
                assert.isTrue(fs.existsSync(submissionDir + submissionId + "_image.jpg"), "Preview image file is not found");
                assert.isTrue(fs.existsSync(submissionDir + submissionId + "_imagew.png"), "Watermarked preview image file is not found");
                assert.isTrue(fs.existsSync(submissionDir + submissionId + "_preview.zip"), "Preview ZIP file is not found");
                cb();
            }

        ], callback);
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
     * This function is run before each test.
     * Generate tests data.
     * @param {Function<err>} done the callback
     */
    beforeEach(function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean.part1", "tcs_catalog", cb);
            }, function (cb) {
                var submissionDir = usv.createDesignSubmissionPath(432001, 124764, 'hung');
                if (fs.existsSync(submissionDir)) {
                    deleteFolderRecursive(submissionDir);
                }
                cb();
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
     * This function is run after each test.
     * Cleans up tests data.
     * @param {Function<err>} done the callback
     */
    afterEach(function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_catalog__clean.part1", "tcs_catalog", cb);
            }, function (cb) {
                var submissionDir = usv.createDesignSubmissionPath(432001, 124764, 'hung');
                if (fs.existsSync(submissionDir)) {
                    deleteFolderRecursive(submissionDir);
                }
                cb();
            }
        ], done);
    });

    /**
     * Test design submission - when user is not authenticated
     */
    it('should return 401 when user is not authenticated', function (done) {
        var req = request(API_ENDPOINT)
            .post('/v2/design/challenges/432001/submit')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .attach('submissionFile', sampleSubmissionPath)
            .attach('sourceFile', sampleSourcePath)
            .attach('previewFile', samplePreviewPath)
            .expect(401);
        req.end(done);
    });

    /**
     * Test design submission - when challengeId is not a number
     */
    it('should return 400 when challengeId is not a number', function (done) {
        var req = getRequest('/v2/design/challenges/abcd/submit', user124764, 400);
        req.end(done);
    });

    /**
     * Test design submission - when challengeId is negative
     */
    it('should return 400 when challengeId is negative', function (done) {
        var req = getRequest('/v2/design/challenges/-1/submit', user124764, 400);
        req.end(done);
    });

    /**
     * Test design submission - when challengeId is 0
     */
    it('should return 400 when challengeId is 0', function (done) {
        var req = getRequest('/v2/design/challenges/0/submit', user124764, 400);
        req.end(done);
    });

    /**
     * Test design submission - when challengeId is too big
     */
    it('should return 400 when challengeId is too big', function (done) {
        var req = getRequest('/v2/design/challenges/2784298347328974932874982374923648762398472893742893742233/submit', user124764, 400);
        req.end(done);
    });

    /**
     * Test design submission - when rank is not a number
     */
    it('should return 400 when rank is not a number', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.field('rank', 'abcdef');
        req.end(done);
    });

    /**
     * Test design submission - when type is neither submission not checkpoint
     */
    it('should return 400 when rank is neither submission not checkpoint', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.field('type', 'abcdef');
        req.end(done);
    });

    /**
     * Test design submission - when challenge does not exist
     */
    it('should return 404 when challenge does not exist', function (done) {
        var req = getRequest('/v2/design/challenges/432999/submit', user124764, 404);
        req.end(function (err, resp) {
            assert.equal(resp.body.error.details, 'No such challenge exists.');
            done();
        });
    });

    /**
     * Test design submission - when challenge is not a design challenge
     */
    it('should return 400 when challenge is not a design challenge', function (done) {
        var req = getRequest('/v2/design/challenges/432002/submit', user124764, 400);
        req.end(function (err, resp) {
            assert.equal(resp.body.error.details, 'Non-design challenges are not supported.');
            done();
        });
    });

    /**
     * Test design submission - when challenge is not active
     */
    it('should return 400 when challenge is not active', function (done) {
        var req = getRequest('/v2/design/challenges/432003/submit', user124764, 400);
        req.end(function (err, resp) {
            assert.equal(resp.body.error.details, 'Challenge is not currently open for submission.');
            done();
        });
    });

    /**
     * Test design submission - when challenge is active but current timestamp is before registration phase
     */
    it('should return 400 when challenge is active but current timestamp is before registration phase', function (done) {
        var req = getRequest('/v2/design/challenges/432004/submit', user124764, 400);
        req.end(function (err, resp) {
            assert.equal(resp.body.error.details, 'Challenge is not currently open for submission.');
            done();
        });
    });

    /**
     * Test design submission - when challenge is active but current timestamp is after submission phase
     */
    it('should return 400 when challenge is active but current timestamp is after submission phase', function (done) {
        var req = getRequest('/v2/design/challenges/432005/submit', user124764, 400);
        req.end(function (err, resp) {
            assert.equal(resp.body.error.details, 'Challenge is not currently open for submission.');
            done();
        });
    });

    /**
     * Test design submission - when checkpoint submission is made but checkpoint phase is not open
     */
    it('should return 400 when checkpoint submission is made but checkpoint phase is not open', function (done) {
        var req = getRequest('/v2/design/challenges/432006/submit?type=checkpoint', user124764, 400);
        req.end(function (err, resp) {
            assert.equal(resp.body.error.details, 'Challenge is not currently open for checkpoint submission.');
            done();
        });
    });

    /**
     * Test design submission - when user is not allowed to submit for challenge
     */
    it('should return 403 when user is not allowed to submit for challenge', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124766, 403);
        req.end(function (err, resp) {
            assert.equal(resp.body.error.details, 'You are not authorized to submit for this challenge.');
            done();
        });
    });

    /**
     * Test design submission - when font data is sent but not of equal length
     */
    it('should return 400 when font data is sent but not of equal length', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.field('fonts', 'font1||font2');
        req.field('fontNames', 'arial||calibri');
        req.field('fontUrls', 'http://www.google.com');
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, 'font parameters are not all of same length.');
            done();
        });
    });

    /**
     * Test design submission - when font data has an empty font source
     */
    it('should return 400 when font data is sent but has empty font source', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.field('fonts', 'font1|| ||font3');
        req.field('fontNames', 'arial||calibri||droid');
        req.field('fontUrls', 'http://www.google.com||http://www.google.co.ru||http://www.google.co.in');
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, 'Missing Font Source for index: 1');
            done();
        });
    });

    /**
     * Test design submission - when font data has an empty font name
     */
    it('should return 400 when font data is sent but has empty font name', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.field('fonts', 'font1||font2||font3');
        req.field('fontNames', 'arial|| ||droid');
        req.field('fontUrls', 'http://www.google.com||http://www.google.co.ru||http://www.google.co.in');
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, 'Missing Font Name for index: 1');
            done();
        });
    });

    /**
     * Test design submission - when font url is empty for a non standard font
     * Note that in the test error is at index 1 and not 0, because font at index 0 is a standard one
     */
    it('should return 400 when font data is sent but has empty font url', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.field('fonts', 'Studio Standard Fonts list||font2||font3');
        req.field('fontNames', 'arial||sans||droid');
        req.field('fontUrls', ' || ||http://www.google.co.in');
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, 'Missing Font URL for index: 1');
            done();
        });
    });

    /**
     * Test design submission - when stockArt data is sent but not of equal length
     */
    it('should return 400 when stockArt data is sent but not of equal length', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.field('stockArtFileNumbers', '1||2');
        req.field('stockArtNames', 'sa1||sa2');
        req.field('stockArtUrls', 'http://www.google.com');
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, 'stockArt parameters are not all of same length.');
            done();
        });
    });

    /**
     * Test design submission - when stockArt data has an empty stockArt file number
     */
    it('should return 400 when stockArt data is sent but has empty stockArt file number', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.field('stockArtFileNumbers', '1|| ||3');
        req.field('stockArtNames', 'sa1||sa2||sa3');
        req.field('stockArtUrls', 'http://www.google.com||http://www.google.co.ru||http://www.google.co.in');
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, 'Missing Stock Art file number for index: 1');
            done();
        });
    });

    /**
     * Test design submission - when stockArt data has an empty stockArt name
     */
    it('should return 400 when stockArt data is sent but has an empty stckArt name', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.field('stockArtFileNumbers', '1||2||3');
        req.field('stockArtNames', 'sa1|| ||sa3');
        req.field('stockArtUrls', 'http://www.google.com||http://www.google.co.ru||http://www.google.co.in');
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, 'Missing Stock Art name for index: 1');
            done();
        });
    });

    /**
     * Test design submission - when stockArt url is empty
     */
    it('should return 400 when stockArt data is sent but has an empty url', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.field('stockArtFileNumbers', 'stockArt1||stockArt2||stockArt3');
        req.field('stockArtNames', 'sa1||sa2||sa3');
        req.field('stockArtUrls', 'http://www.google.com|| ||http://www.google.co.in');
        req.end(function (err, resp) {
            if (err) {
                done(err);
                return;
            }
            assert.equal(resp.body.error.details, 'Missing Stock Art url for index: 1');
            done();
        });
    });

    /**
     * Test design submission - when unknown file type is sent
     */
    it('should return 400 when unknown file type is sent', function (done) {
        var req = getBareRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.attach('submissionFile', sampleSubmissionPath)
            .attach('sourceFile', sampleSourcePath)
            .attach('previewFile', unknownTypePath);

        req.end(function (err, resp) {
            assert.equal(resp.body.error.details, 'Unknown file type submitted.');
            done();
        });
    });

    /**
     * Test design submission - when zip is expected but not sent
     */
    it('should return 400 when zip is expected but not sent', function (done) {
        var req = getBareRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.attach('submissionFile', samplePreviewPath)
            .attach('sourceFile', sampleSourcePath)
            .attach('previewFile', samplePreviewPath);

        req.end(function (err, resp) {
            assert.equal(resp.body.error.details, 'Invalid file type submitted.');
            done();
        });
    });

    /**
     * Test design submission - when image is expected but not sent
     */
    it('should return 400 when image is expected but not sent', function (done) {
        var req = getBareRequest('/v2/design/challenges/432001/submit', user124764, 400);
        req.attach('submissionFile', sampleSubmissionPath)
            .attach('sourceFile', sampleSourcePath)
            .attach('previewFile', sampleSourcePath);

        req.end(function (err, resp) {
            assert.equal(resp.body.error.details, 'Invalid file type submitted.');
            done();
        });
    });

    /**
     * Test design submission for success
     * The tables must be populated properly
     * The zip pointed by upload.parameter must exist on the system
     * Note: Reviewer must examine the zip manually
     * Also tests that all optional parameters are handled properly
     * Also note that rank is automatically set to 1 even if we send it in as 0 (could even send it as negative)
     */
    it('should return 200 when success', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 200),
            dirName,
            targetFile;

        req.field('comment', 'just a test comment');
        req.field('fonts', 'font1||font2||font3');
        req.field('fontNames', 'arial||sans||droid');
        req.field('fontUrls', 'http://www.google.com||http://www.google.co.ru||http://www.google.co.in');
        req.field('stockArtFileNumbers', '1||2||3');
        req.field('stockArtNames', 'sa1||sa2||sa3');
        req.field('stockArtUrls', 'http://www.google.ca||http://www.google.ba||www.google.aa');
        req.field('rank', '0');

        req.end(function (err, resp) {
            var submissionId = resp.body.submissionId;
            submissionIds.push(submissionId);
            var uploadId = resp.body.uploadId;
            var parameter;
            assert.isDefined(submissionId, "created submissionId must be returned in response.");
            assert.isDefined(uploadId, "created uploadId must be returned in response.");

            async.waterfall([
                function (cb) {
                    var sql = "* from upload where upload_id = " + uploadId;
                    testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                        var expected = {
                            project_phase_id: 432002,
                            resource_id: 432011,
                            modify_user: '124764',
                            project_id: 432001,
                            upload_type_id: 1,
                            create_user: '124764',
                            upload_status_id: 1,
                            upload_id: uploadId
                        };
                        var actual = _.omit(result[0], ['create_date', 'modify_date', 'parameter']);
                        parameter = result[0].parameter;
                        assert.deepEqual(actual, expected, 'Actual and Expected of upload table did not match');
                        cb();
                    });
                },
                function (cb) {
                    var sql = "* from submission where submission_id = " + submissionId;
                    testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                        var expected = {
                            submission_id: submissionId,
                            upload_id: uploadId,
                            submission_status_id: 1,
                            submission_type_id: 1,
                            modify_user: '124764',
                            create_user: '124764',
                            user_rank: 1
                        };
                        var actual = _.omit(result[0], ['create_date', 'modify_date']);
                        assert.deepEqual(actual, expected, 'Actual and Expected of submission table did not match');
                        cb();
                    });
                }, function (cb) {
                    //Check if the row was created properly in resource_submission table
                    var sql = "* from resource_submission where submission_id = " + submissionId;
                    testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                        var expected = {
                            resource_id: 432011,
                            modify_user: '124764',
                            create_user: '124764',
                            submission_id: submissionId
                        };
                        var actual = _.omit(result[0], ['create_date', 'modify_date']);
                        assert.deepEqual(actual, expected, 'Actual and Expected of resource_submission table did not match');
                        cb();
                    });
                }, function (cb) {
                    //The unified zip must exist in test/tmp/design_submissions/432001/hung_124764/
                    dirName = usv.createDesignSubmissionPath(432001, 124764, 'hung');
                    targetFile = dirName + parameter;
                    assert.isTrue(fs.existsSync(targetFile), "The unified zip must exist");
                    cb();

                    /*Please inspect the zip manually, specially that the declaration.txt inside the submission.zip of submission directory*/
                }, function (cb) {
                    // Verify that the necessary records have been inserted into image, submission_image tables
                    checkGeneratedImages(submissionId, cb);
                }
            ], done);
        });
    });

    /**
     * Test design submission - when rank is changed
     * rank is sent in as 1 so the previous submission with rank 1 now becomes rank 2
     */
    it('should return 200 when rank is changed', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 200);
        req.field('rank', '1');

        req.end(function (err, resp) {
            var submissionId = resp.body.submissionId;
            var previousSubmissionId = submissionIds[0];

            async.waterfall([
                function (cb) {
                    var sql = "user_rank, submission_id from submission where submission_id IN (" + previousSubmissionId + "," + submissionId + ") order by submission_id";
                    testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                        assert.equal(result[0].user_rank, 2);
                        assert.equal(result[1].user_rank, 1);
                        cb();
                    });
                }, function (cb) {
                    checkGeneratedImages(submissionId, cb);
                }
            ], done);
        });
    });

    /**
     * Test design submission - when rank is changed
     * rank is sent in as 10 so the rank is set to 3 actually as previous submission have rank 1,2
     */
    it('should return 200 when rank is changed', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit', user124764, 200);
        req.field('rank', '10');

        req.end(function (err, resp) {
            var submissionId = resp.body.submissionId;

            async.waterfall([
                function (cb) {
                    var sql = "user_rank from submission where submission_id = " + submissionId;
                    testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                        assert.equal(result[0].user_rank, 3);
                        cb();
                    });
                }, function (cb) {
                    checkGeneratedImages(submissionId, cb);
                }
            ], done);
        });
    });

    /**
     * Test design submission for success when chcekpoint submission is made
     * Also tests that all optional parameters, when missing, do not cause the code to break.
     */
    it('should return 200 when checkpoint submission is made', function (done) {
        var req = getRequest('/v2/design/challenges/432001/submit?type=checkpoint', user124764, 200);

        req.end(function (err, resp) {
            var submissionId = resp.body.submissionId;
            var uploadId = resp.body.uploadId;
            assert.isDefined(submissionId, "created submissionId must be returned in response.");
            assert.isDefined(uploadId, "created uploadId must be returned in response.");

            async.waterfall([
                function (cb) {
                    var sql = "* from upload where upload_id = " + uploadId;
                    testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                        var expected = {
                            project_phase_id: 432003,
                            resource_id: 432011,
                            modify_user: '124764',
                            project_id: 432001,
                            upload_type_id: 1,
                            create_user: '124764',
                            upload_status_id: 1,
                            upload_id: uploadId
                        };
                        var actual = _.omit(result[0], ['create_date', 'modify_date', 'parameter']);
                        assert.deepEqual(actual, expected, 'Actual and Expected of upload table did not match');
                        cb();
                    });
                },
                function (cb) {
                    var sql = "* from submission where submission_id = " + submissionId;
                    testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                        var expected = {
                            submission_id: submissionId,
                            upload_id: uploadId,
                            submission_status_id: 1,
                            submission_type_id: 3,
                            modify_user: '124764',
                            create_user: '124764'
                        };
                        var actual = _.omit(result[0], ['create_date', 'modify_date']);
                        assert.deepEqual(actual, expected, 'Actual and Expected of submission table did not match');
                        cb();
                    });
                }, function (cb) {
                    //Check if the row was created properly in resource_submission table
                    var sql = "* from resource_submission where submission_id = " + submissionId;
                    testHelper.runSqlSelectQuery(sql, "tcs_catalog", function (err, result) {
                        var expected = {
                            resource_id: 432011,
                            modify_user: '124764',
                            create_user: '124764',
                            submission_id: submissionId
                        };
                        var actual = _.omit(result[0], ['create_date', 'modify_date']);
                        assert.deepEqual(actual, expected, 'Actual and Expected of resource_submission table did not match');
                        cb();
                    });
                }, function (cb) {
                    checkGeneratedImages(submissionId, cb);
                }
            ], done);
        });
    });
});
