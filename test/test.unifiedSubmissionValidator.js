/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author isv
 */
"use strict";

/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var supertest = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var path = require('path');
var usv = require("../common/unifiedSubmissionValidator");
var config = require("../config/tc-config").tcConfig;

var unifiedSubmissionValidator = usv.getUnifiedSubmissionValidator(null, null);

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Unified Submission Validator API', function () {

    /**
     * Tests the Unified Submission Validator against failure test case. Sends a request for calling the desired method 
     * of the validator and expects the server to respond with HTTP response of specified status providing the specified
     * expected error details.
     *
     * @param {String} methodName - a name of the method to be tested.
     * @param {String} queryParams - optional parameters to be passed to tested method.
     * @param {Number} expectedStatusCode - status code for HTTP response expected to be returned from server.
     * @param {String} expectedErrorMessage - error message expected to be returned from server.
     * @param {Function} callback - a callback to be called when test finishes.
     */
    function testFailureScenario(methodName, queryParams, expectedStatusCode, expectedErrorMessage, callback) {
        supertest(API_ENDPOINT)
            .get('/test/usv/' + methodName + '?' + queryParams)
            .expect('Content-Type', /json/)
            .expect(expectedStatusCode)
            .end(function (err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                var body = res.body;
                if (expectedStatusCode === 200) {
                    assert.equal(body.error, expectedErrorMessage);
                } else {
                    assert.equal(body.error.details, expectedErrorMessage);
                }
                callback();
            });
    }

    /**
     * Tests the Unified Submission Validator against success test case. Sends a request for calling the desired method
     * of the validator and expects the server to respond with HTTP 200 OK response. Passes the response body to
     * callback.
     *
     * @param {String} methodName - a name of the method to be tested.
     * @param {String} queryParams - optional parameters to be passed to tested method.
     * @param {Function} callback - a callback to be called when test finishes.
     */
    function testSuccessScenario(methodName, queryParams, callback) {
        supertest(API_ENDPOINT)
            .get('/test/usv/' + methodName + '?' + queryParams)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                var body = res.body;
                callback(null, body);
            });
    }

    this.timeout(30000);

    it("getFileName - Correct file name must be returned", function (done) {
        var fileName
            = unifiedSubmissionValidator.getFileName(path.sep + 'tmp' + path.sep + 'test_files' + path.sep + 'test.txt');
        assert.equal(fileName, 'test.txt', 'Wrong file name returned');
        done();
    });

    it("calcAlternateFileName - Correct alternative file name must be returned", function (done) {
        var expected,
            fileName
                = unifiedSubmissionValidator.calcAlternateFileName(1000, 132456, 'heffan', 2000, 'my_submission.zip', 'tiny');
        expected = config.designSubmissionsBasePath + path.sep + '1000' + path.sep  + 'heffan_132456' + path.sep + '2000_tiny.zip';

        assert.equal(fileName, expected, 'Wrong alternative file name returned');
        done();
    });

    it("getFileType - should return matching file type", function (done) {
        async.waterfall([
            function (cb) {
                testSuccessScenario('getFileType', 'fileName=test.txt', cb);
            }, function (response, cb) {
                assert.ok(response.fileType);
                assert.equal(response.fileType.extension, 'txt', 'Wrong file type found');
                cb();
            }
        ], done);
    });

    it("getFileType - should return no matching file type", function (done) {
        async.waterfall([
            function (cb) {
                testSuccessScenario('getFileType', 'fileName=test.zzzz', cb);
            }, function (response, cb) {
                assert.notOk(response.fileType);
                cb();
            }
        ], done);
    });

    it("getBundledFileParser - non-archive file type - should respond with HTTP 400", function (done) {
        testFailureScenario('getBundledFileParser', 'filePath=test.txt', 400, 'The file type [2] is not an archive file',
            done);
    });

    it("getBundledFileParser - un-supported file type - should respond with HTTP 400", function (done) {
        testFailureScenario('getBundledFileParser', 'filePath=test.ddd', 400, 'Unsupported file type',
            done);
    });

    it("getBundledFileParser - should return matching file parser", function (done) {
        async.waterfall([
            function (cb) {
                testSuccessScenario('getBundledFileParser', 'filePath=test.zip', cb);
            }, function (response, cb) {
                assert.ok(response.fileParser);
                cb();
            }
        ], done);
    });

    it("validate - valid submission (ZIP) - should return SUCCESS result", function (done) {
        async.waterfall([
            function (cb) {
                testSuccessScenario('validate', 'filePath=test' + path.sep + 'test_files' + path.sep
                    + 'unified_submission_validator' + path.sep + 'valid_submission.zip', cb);
            }, function (response, cb) {
                assert.ok(response.validationResult);
                assert.isTrue(response.validationResult.valid);
                assert.equal(response.validationResult.message, 'Success');
                cb();
            }
        ], done);
    });

    it("validate - invalid submission (no preview file) (ZIP) - should return FAILURE result", function (done) {
        async.waterfall([
            function (cb) {
                testSuccessScenario('validate', 'filePath=test' + path.sep + 'test_files' + path.sep
                    + 'unified_submission_validator' + path.sep + 'no_preview_file_submission.zip', cb);
            }, function (response, cb) {
                assert.ok(response.validationResult);
                assert.isFalse(response.validationResult.valid);
                assert.equal(response.validationResult.message, 'No preview file provided in the submission');
                cb();
            }
        ], done);
    });

    it("validate - invalid submission (no preview image) (ZIP) - should return FAILURE result", function (done) {
        async.waterfall([
            function (cb) {
                testSuccessScenario('validate', 'filePath=test' + path.sep + 'test_files' + path.sep
                    + 'unified_submission_validator' + path.sep + 'no_preview_image_submission.zip', cb);
            }, function (response, cb) {
                assert.ok(response.validationResult);
                assert.isFalse(response.validationResult.valid);
                assert.equal(response.validationResult.message, 'No preview image provided in the submission');
                cb();
            }
        ], done);
    });

    it("validate - invalid submission (no source) (ZIP) - should return FAILURE result", function (done) {
        async.waterfall([
            function (cb) {
                testSuccessScenario('validate', 'filePath=test' + path.sep + 'test_files' + path.sep
                    + 'unified_submission_validator' + path.sep + 'no_source_submission.zip', cb);
            }, function (response, cb) {
                assert.ok(response.validationResult);
                assert.isFalse(response.validationResult.valid);
                assert.equal(response.validationResult.message, 'No native sources provided in the submission');
                cb();
            }
        ], done);
    });

    it("validate - non-existing file - should respond with HTTP 400", function (done) {
        testFailureScenario('validate', 'filePath=test' + path.sep + 'test_files' + path.sep
            + 'unified_submission_validator' + path.sep + 'non_existing.zip', 400,
            'Invalid filename', done);
    });

    it("validate - empty file - should respond with HTTP 400", function (done) {
        testFailureScenario('validate', 'filePath=test' + path.sep + 'test_files' + path.sep
            + 'unified_submission_validator' + path.sep + 'empty.zip', 400,
            'Submission file is empty', done);
    });

    it("validate - valid submission (JAR) - should return SUCCESS result", function (done) {
        async.waterfall([
            function (cb) {
                testSuccessScenario('validate', 'filePath=test' + path.sep + 'test_files' + path.sep
                    + 'unified_submission_validator' + path.sep + 'valid_submission.jar', cb);
            }, function (response, cb) {
                assert.ok(response.validationResult);
                assert.isTrue(response.validationResult.valid);
                assert.equal(response.validationResult.message, 'Success');
                cb();
            }
        ], done);
    });

    it("validate - invalid submission (no preview file) (JAR) - should return FAILURE result", function (done) {
        async.waterfall([
            function (cb) {
                testSuccessScenario('validate', 'filePath=test' + path.sep + 'test_files' + path.sep
                    + 'unified_submission_validator' + path.sep + 'no_preview_file_submission.jar', cb);
            }, function (response, cb) {
                assert.ok(response.validationResult);
                assert.isFalse(response.validationResult.valid);
                assert.equal(response.validationResult.message, 'No preview file provided in the submission');
                cb();
            }
        ], done);
    });

    it("validate - invalid submission (no preview image) (JAR) - should return FAILURE result", function (done) {
        async.waterfall([
            function (cb) {
                testSuccessScenario('validate', 'filePath=test' + path.sep + 'test_files' + path.sep
                    + 'unified_submission_validator' + path.sep + 'no_preview_image_submission.jar', cb);
            }, function (response, cb) {
                assert.ok(response.validationResult);
                assert.isFalse(response.validationResult.valid);
                assert.equal(response.validationResult.message, 'No preview image provided in the submission');
                cb();
            }
        ], done);
    });

    it("validate - invalid submission (no source) (JAR) - should return FAILURE result", function (done) {
        async.waterfall([
            function (cb) {
                testSuccessScenario('validate', 'filePath=test' + path.sep + 'test_files' + path.sep
                    + 'unified_submission_validator' + path.sep + 'no_source_submission.jar', cb);
            }, function (response, cb) {
                assert.ok(response.validationResult);
                assert.isFalse(response.validationResult.valid);
                assert.equal(response.validationResult.message, 'No native sources provided in the submission');
                cb();
            }
        ], done);
    });

    it("ZipFileAnalyzer#getFiles - should return files and contents", function (done) {
        var expected
            = {'dir1/1.txt': [49, 49, 49, 49, 49], 'dir2/2.txt': [50, 50, 50, 50, 50], '3.txt': [51, 51, 51, 51, 51]};

        async.waterfall([
            function (cb) {
                testSuccessScenario('getFiles', 'filePath=test' + path.sep + 'test_files' + path.sep
                    + 'unified_submission_validator' + path.sep + 'get_files.zip', cb);
            }, function (response, cb) {
                assert.ok(response.files);
                assert.deepEqual(response.files, expected, 'Wrong files or contents returned');
                cb();
            }
        ], done);
    });

    it("createDesignSubmissionPath - Correct design submission path must be returned", function (done) {
        var expected,
            designSubmissionPath = usv.createDesignSubmissionPath(1000, 132456, 'heffan');
        expected = config.designSubmissionsBasePath + path.sep + '1000' + path.sep + 'heffan_132456' + path.sep;

        assert.equal(designSubmissionPath, expected, 'Wrong design submission path returned');
        done();
    });

});


