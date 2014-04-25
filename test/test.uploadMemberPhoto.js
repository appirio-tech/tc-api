/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author  TCSASSEMBLER
 */
'use strict';
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var path = require('path');
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var S = require('string');

var testHelper = require('./helpers/testHelper');
var configs = require('../config');
var SQL_DIR = __dirname + '/sqls/uploadMemberPhoto/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Upload Member Photo API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_upload_member_photo_error_message'),
        heffan = testHelper.generateAuthHeader({ sub: 'ad|132456' }),
        superu = testHelper.generateAuthHeader({ sub: 'ad|132457' }),
        user = testHelper.generateAuthHeader({ sub: 'ad|132458' }),
        filePath = configs.config.general.memberPhoto.storeDir;

    if (!new S(configs.config.general.memberPhoto.storeDir).endsWith('/')) {
        filePath += '/';
    }

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + 'informixoltp__clean', 'informixoltp', done);
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
                testHelper.runSqlFile(SQL_DIR + 'informixoltp__insert_test_data', 'informixoltp', cb);
            },
            function (cb) {
                // Update the path manually
                testHelper.runSqlQuery('UPDATE path SET path = "' + filePath + '" WHERE path_id = 2001', 'informixoltp', cb);
            },
            function (cb) {
                // Copy the tests file to store place.
                fs.readFile('./test/test_files/upload_member_photo/test.bmp', function (err, data) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    fs.writeFile(filePath + 'super.bmp', data, cb);
                });
            }
        ], done);
    });

    /**
     * This function is run after all tests.
     * Clean up all data.
     * @param {Function<err>} done the callback
     */
    after(function (done) {
        async.parallel({
            database: function (cbx) {
                clearDb(cbx);
            },
            server: function (cbx) {
                async.each(['user.jpeg', 'super.jpg', 'heffan.png'], function (fileName, cb) {
                    fs.unlink(path.join(filePath, fileName), cb);
                }, function (err) {
                    cbx(err);
                });
            }
        }, done);
    });

    /**
     * Create a http request and test it.
     * @param {Number} expectStatus - the expected request response status.
     * @param {Object} authHeader - the auth header for request.
     * @param {Object} fileName - the file post to api endpoint.
     * @param {Function} cb - the call back function.
     */
    function createRequest(expectStatus, authHeader, fileName, cb) {
        var req = request(API_ENDPOINT)
            .post('/v2/users/photo')
            .set('Accept', 'application/json');
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        req.expect('Content-Type', /json/)
            .expect(expectStatus)
            .attach('photo', './test/test_files/upload_member_photo/' + fileName)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} authHeader - the request auth header.
     * @param {Object} fileName - the file post to api.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(expectStatus, errorMessage, authHeader, fileName, cb) {
        createRequest(expectStatus, authHeader, fileName, function (err, result) {
            if (!err) {
                assert.equal(result.body.error.details, errorMessage, 'invalid error message');
            } else {
                cb(err);
                return;
            }
            cb();
        });
    }

    /**
     * Assert the success response.
     * @param {Object} authHeader - the auth header.
     * @param {String} fileName - the file name.
     * @param {Function} cb - the callback function.
     */
    function assertSuccess(authHeader, fileName, cb) {
        createRequest(200, authHeader, fileName, function (err, result) {
            if (err) {
                cb(err);
                return;
            }
            assert.equal(result.body.message, 'Success', 'invalid response');
            cb();
        });
    }

    /**
     * Test anonymous caller.
     */
    it('should return unauthorized error. The caller is anonymous.', function (done) {
        assertBadResponse(401, errorObject.unauthorized, null, 'test.bmp', done);
    });

    /**
     * Test when photo type is invalid.
     */
    it('should return bad Request. The type is invalid.', function (done) {
        assertBadResponse(400, errorObject.invalidType, heffan, 'test.txt', done);
    });

    /**
     * Test when photo is not a file.
     */
    it('should return bad Request. The photo is not a file type.', function (done) {
        request(API_ENDPOINT)
            .post('/v2/users/photo')
            .set('Accept', 'application/json')
            .set('Authorization', heffan)
            .expect('Content-Type', /json/)
            .expect(400)
            .send({ photo: 1 })
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(res.body.error.details, errorObject.notFile, 'invalid error message');
                done();
            });
    });

    /**
     * Test when photo is too large.
     */
    it('should return bad Request. The photo is too large.', function (done) {
        assertBadResponse(400, errorObject.tooLarge, heffan, 'tooLarge.jpg', done);
    });

    /**
     * Test when caller never upload a photo before.
     */
    it('should return success response. The user never upload a photo before.', function (done) {
        async.waterfall([
            function (cb) {
                assertSuccess(user, 'test.jpeg', cb);
            },
            function (cb) {
                // Check if the database is updated.
                testHelper.runSqlSelectQuery(
                    ' p.path' +
                        ', i.image_id' +
                        ', i.file_name ' +
                        'FROM coder_image_xref cix ' +
                        'INNER JOIN image i ON cix.image_id = i.image_id AND i.image_type_id = 1 ' +
                        'INNER JOIN path p ON p.path_id = i.path_id ' +
                        'WHERE cix.coder_id = 132458',
                    'informixoltp',
                    cb
                );
            },
            function (results, cb) {
                assert.equal(results[0].path, filePath, 'invalid filePath');
                assert.isTrue(results[0].image_id >= 1000000, 'invalid image id');
                assert.equal(results[0].file_name, 'user.jpeg', 'invalid file name');
                cb();
            },
            function (cb) {
                // Check the file exist on server.
                fs.exists(path.join(filePath, 'user.jpeg'), function (exist) {
                    assert.isTrue(exist);
                    cb();
                });
            }
        ], done);
    });

    /**
     * The caller is uploaded before and the old file is still exist.
     */
    it('should return success results. The caller has uploaded photo before.', function (done) {
        async.waterfall([
            function (cb) {
                assertSuccess(superu, 'test.jpg', cb);
            },
            function (cb) {
                // Check if the database is updated.
                testHelper.runSqlSelectQuery(
                    ' p.path' +
                        ', i.image_id' +
                        ', i.file_name ' +
                        'FROM coder_image_xref cix ' +
                        'INNER JOIN image i ON cix.image_id = i.image_id AND i.image_type_id = 1 ' +
                        'INNER JOIN path p ON p.path_id = i.path_id ' +
                        'WHERE cix.coder_id = 132457',
                    'informixoltp',
                    cb
                );
            },
            function (results, cb) {
                assert.equal(results[0].path, filePath, 'invalid filePath');
                assert.isTrue(results[0].image_id === 2001, 'invalid image id');
                assert.equal(results[0].file_name, 'super.jpg', 'invalid file name');
                cb();
            },
            function (cb) {
                // Check the new file exist on server.
                fs.exists(path.join(filePath, 'super.jpg'), function (exist) {
                    assert.isTrue(exist, 'new file should be exist');
                    cb();
                });
            },
            function (cb) {
                fs.exists(path.join(filePath, 'super.bmp'), function (exist) {
                    assert.isFalse(exist, 'old file should be deleted');
                    cb();
                });
            }
        ], done);
    });

    /**
     * The caller uploaded before and the old file is missing.
     */
    it('should return success results. The caller uploaded the file before and the file is missing.', function (done) {
        async.waterfall([
            function (cb) {
                assertSuccess(heffan, 'test.bmp', cb);
            },
            function (cb) {
                // Check if the database is updated.
                testHelper.runSqlSelectQuery(
                    ' p.path' +
                        ', i.image_id' +
                        ', i.file_name ' +
                        'FROM coder_image_xref cix ' +
                        'INNER JOIN image i ON cix.image_id = i.image_id AND i.image_type_id = 1 ' +
                        'INNER JOIN path p ON p.path_id = i.path_id ' +
                        'WHERE cix.coder_id = 132456',
                    'informixoltp',
                    cb
                );
            },
            function (results, cb) {
                assert.equal(results[0].path, filePath, 'invalid filePath');
                assert.isTrue(results[0].image_id === 2002, 'invalid image id');
                assert.equal(results[0].file_name, 'heffan.bmp', 'invalid file name');
                cb();
            },
            function (cb) {
                // Check the new file exist on server.
                fs.exists(path.join(filePath, 'heffan.bmp'), function (exist) {
                    assert.isTrue(exist, 'new file should be exist');
                    cb();
                });
            }
        ], done);
    });

    /**
     * Test png file.
     */
    it('should return success results. Test png file.', function (done) {
        assertSuccess(heffan, 'test.png', done);
    });
});
