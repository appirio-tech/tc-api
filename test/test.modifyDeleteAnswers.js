/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author isv
 */
"use strict";

/*global describe, it, before, beforeEach, after, afterEach, __dirname */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var SQL_DIR = __dirname + "/sqls/modifyDeleteAnswer/";

describe('Test Modify/Delete Round Question Answer API', function () {

    var heffan = testHelper.generateAuthHeader({ sub: 'ad|132456' }),
        wyzmo = testHelper.generateAuthHeader({ sub: 'ad|124856' });

    this.timeout(120000);

    /**
     * Clears the database.
     *
     * @param {Function<err>} done the callback.
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__clean", 'informixoltp', cb);
            }
        ], done);
    }

    /**
     * This function is run before all tests. Generate tests data.
     *
     * @param {Function<err>} done the callback.
     */
    before(function (done) {
        async.waterfall([
            clearDb,
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_test_data", "informixoltp", cb);
            }
        ], done);
    });

    /**
     * This function is run after all tests. Clean up all data.
     *
     * @param {Function<err>} done the callback
     */
    after(function (done) {
        clearDb(done);
    });

    /**
     * Tests the Modify Round Question Answer action against failure test case. Posts a request for modifying the answer
     * with specified data and expects the server to respond with HTTP response of specified status providing the
     * specified expected error details.
     *
     * @param {Object} user - user account to cal the action.
     * @param {String} answerId - answer ID parameter.
     * @param {String} text - text parameter.
     * @param {String} sortOrder - sort order parameter.
     * @param {String} correct - correct parameter.
     * @param {Number} expectedStatusCode - status code for HTTP response expected to be returned from server.
     * @param {String} expectedErrorMessage - error message expected to be returned from server.
     * @param {Function} callback - a callback to be called when test finishes.
     */
    function testModifyFailureScenario(user, answerId, text, sortOrder, correct, expectedStatusCode,
                                       expectedErrorMessage, callback) {
        var queryParams = '?';
        if (text !== null) {
            queryParams += 'text=' + text;
        }
        if (sortOrder !== null) {
            queryParams += '&sortOrder=' + sortOrder;
        }
        if (correct !== null) {
            queryParams += '&correct=' + correct;
        }

        if (user !== null) {
            request(API_ENDPOINT)
                .put('/v2/data/srm/answer/' + answerId + queryParams)
                .set('Accept', 'application/json')
                .set('Authorization', user)
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
        } else {
            request(API_ENDPOINT)
                .put('/v2/data/srm/answer/' + answerId + queryParams)
                .set('Accept', 'application/json')
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
    }

    /**
     * Tests the Delete Round Question Answer action against failure test case. Posts a request for deleting the answer
     * with specified data and expects the server to respond with HTTP response of specified status providing the
     * specified expected error details.
     *
     * @param {Object} user - user account to cal the action.
     * @param {String} answerId - answer ID parameter.
     * @param {Number} expectedStatusCode - status code for HTTP response expected to be returned from server.
     * @param {String} expectedErrorMessage - error message expected to be returned from server.
     * @param {Function} callback - a callback to be called when test finishes.
     */
    function testDeleteFailureScenario(user, answerId, expectedStatusCode, expectedErrorMessage, callback) {
        if (user !== null) {
            request(API_ENDPOINT)
                .del('/v2/data/srm/answer/' + answerId)
                .set('Accept', 'application/json')
                .set('Authorization', user)
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
        } else {
            request(API_ENDPOINT)
                .del('/v2/data/srm/answer/' + answerId)
                .set('Accept', 'application/json')
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
    }

    /**
     * Tests the Modify Round Question Answer action against successful test case. Posts a request for modifying the
     * answer based on specified parameters and expects the server to respond with HTTP response of 200 status and
     * successful result.
     *
     * @param {Object} user - user account to cal the action.
     * @param {String} answerId - answer ID parameter.
     * @param {String} text - text parameter.
     * @param {String} sortOrder - sort order parameter.
     * @param {String} correct - correct parameter.
     * @param {Function} callback - a callback to be called when test finishes.
     */
    function testModifySuccessScenario(user, answerId, text, sortOrder, correct, callback) {
        var queryParams = '?';
        if (text !== null) {
            queryParams += 'text=' + text;
        }
        if (sortOrder !== null) {
            queryParams += '&sortOrder=' + sortOrder;
        }
        if (correct !== null) {
            queryParams += '&correct=' + correct;
        }

        request(API_ENDPOINT)
            .put('/v2/data/srm/answer/' + answerId + queryParams)
            .set('Accept', 'application/json')
            .set('Authorization', user)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    callback(err);
                    return;
                }

                var body = res.body;

                assert.isTrue(body.success, "Invalid response on successful answer modification");

                async.waterfall([
                    function (cb) {
                        testHelper.runSqlSelectQuery('* FROM answer WHERE answer_id = ' + answerId, 'informixoltp', cb);
                    }, function (result, cb) {
                        assert.equal(result.length, 1, 'Answer is not found in database');
                        assert.equal(result[0].answer_text, text, 'Answer text is not saved correctly');
                        assert.equal(result[0].sort_order, sortOrder, 'Answer sort order is not saved correctly');
                        assert.equal(result[0].correct, correct ? 1 : 0, 'Answer correct is not saved correctly');
                        cb();
                    }
                ], callback);
            });
    }

    /**
     * Tests the Delete Round Question Answer action against successful test case. Posts a request for deleting the
     * answer based on specified parameters and expects the server to respond with HTTP response of 200 status and 
     * successful result.
     *
     * @param {Object} user - user account to cal the action.
     * @param {String} answerId - answer ID parameter.
     * @param {Boolean} success - expected result.
     * @param {Function} callback - a callback to be called when test finishes.
     */
    function testDeleteSuccessScenario(user, answerId, success, callback) {
        request(API_ENDPOINT)
            .del('/v2/data/srm/answer/' + answerId)
            .set('Accept', 'application/json')
            .set('Authorization', user)
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                var body = res.body;

                assert.equal(body.success, success, "Invalid response on successful answer deletion");

                async.waterfall([
                    function (cb) {
                        testHelper.runSqlSelectQuery('1 FROM answer WHERE answer_id = ' + answerId, 'informixoltp', cb);
                    }, function (result, cb) {
                        assert.equal(result.length, 0, 'Answer is not deleted from database');
                        cb();
                    }
                ], callback);
            });
    }

    // Failure test cases
    it('MODIFY: Anonymous access', function (done) {
        testModifyFailureScenario(null, 1, 'Text', 1, 'true', 401, 'Authorized information needed.', done);
    });

    it('MODIFY: Non-admin access', function (done) {
        testModifyFailureScenario(wyzmo, 1, 'Text', 1, 'true', 403, 'Admin access only.', done);
    });

    it('MODIFY: Negative answerId parameter', function (done) {
        testModifyFailureScenario(heffan, -1, 'Text', 1, 'true', 400, 'answerId should be positive.', done);
    });

    it('MODIFY: Zero answerId parameter', function (done) {
        testModifyFailureScenario(heffan, 0, 'Text', 1, 'true', 400, 'answerId should be positive.', done);
    });

    it('MODIFY: Too large answerId parameter', function (done) {
        testModifyFailureScenario(heffan, 2147483648, 'Text', 1, 'true', 400,
            'answerId should be less or equal to 2147483647.', done);
    });

    it('MODIFY: Non-numeric answerId parameter', function (done) {
        testModifyFailureScenario(heffan, 'a', 'Text', 1, 'true', 400, 'answerId should be number.', done);
    });

    it('MODIFY: No text parameter', function (done) {
        testModifyFailureScenario(heffan, 1001, null, 1, 'true', 200,
            'Error: text is a required parameter for this action', done);
    });

    it('MODIFY: Empty text parameter', function (done) {
        testModifyFailureScenario(heffan, 1001, '', 1, 'true', 200,
            'Error: text is a required parameter for this action', done);
    });

    it('MODIFY: Too long text parameter', function (done) {
        var i,
            longText = '';

        for (i = 0; i < 300; i = i + 1) {
            longText += 'x';
        }

        testModifyFailureScenario(heffan, 1001, longText, 1, 'true', 400,
            'text exceeds 250 characters.', done);
    });

    it('MODIFY: No sortOrder parameter', function (done) {
        testModifyFailureScenario(heffan, 1001, 'Text', null, 'true', 200,
            'Error: sortOrder is a required parameter for this action', done);
    });

    it('MODIFY: Empty sortOrder parameter', function (done) {
        testModifyFailureScenario(heffan, 1001, 'Text', '', 'true', 200,
            'Error: sortOrder is a required parameter for this action', done);
    });

    it('MODIFY: Negative sortOrder parameter', function (done) {
        testModifyFailureScenario(heffan, 1001, 'Text', -1, 'true', 400, 'sortOrder should be positive.', done);
    });

    it('MODIFY: Non-numeric sortOrder parameter', function (done) {
        testModifyFailureScenario(heffan, 1001, 'Text', 'a', 'true', 400, 'sortOrder should be number.', done);
    });

    it('MODIFY: Too large sortOrder parameter', function (done) {
        testModifyFailureScenario(heffan, 1001, 'Text', 2147483648, 'true', 400,
            'sortOrder should be less or equal to 2147483647.', done);
    });

    it('MODIFY: No correct parameter', function (done) {
        testModifyFailureScenario(heffan, 1001, 'Text', 1, null, 200,
            'Error: correct is a required parameter for this action', done);
    });

    it('MODIFY: Empty correct parameter', function (done) {
        testModifyFailureScenario(heffan, 1001, 'Text', 1, '', 200,
            'Error: correct is a required parameter for this action', done);
    });

    it('MODIFY: Invalid correct parameter', function (done) {
        testModifyFailureScenario(heffan, 1001, 'Text', 1, 'neither', 400,
            'The correct should be boolean type.', done);
    });

    it('MODIFY: Unknown answerId parameter', function (done) {
        testModifyFailureScenario(heffan, 200100, 'Text', 1, 'true', 404,
            'The answerId does not exist in database.', done);
    });

    it('DELETE: Anonymous access', function (done) {
        testDeleteFailureScenario(null, 1, 401, 'Authorized information needed.', done);
    });

    it('DELETE: Non-admin access', function (done) {
        testDeleteFailureScenario(wyzmo, 1, 403, 'Admin access only.', done);
    });

    it('DELETE: Negative answerId parameter', function (done) {
        testDeleteFailureScenario(heffan, -1, 400, 'answerId should be positive.', done);
    });

    it('DELETE: Zero answerId parameter', function (done) {
        testDeleteFailureScenario(heffan, 0, 400, 'answerId should be positive.', done);
    });

    it('DELETE: Too large answerId parameter', function (done) {
        testDeleteFailureScenario(heffan, 2147483648, 400, 'answerId should be less or equal to 2147483647.', done);
    });

    it('DELETE: Non-numeric answerId parameter', function (done) {
        testDeleteFailureScenario(heffan, 'a', 400, 'answerId should be number.', done);
    });

    // Accuracy test cases
    it('DELETE: existing answer', function (done) {
        testDeleteSuccessScenario(heffan, 1001, true, done);
    });

    it('DELETE: non-existing answer', function (done) {
        testDeleteSuccessScenario(heffan, 2001, false, done);
    });

    it('MODIFY: existing answer', function (done) {
        testModifySuccessScenario(heffan, 1002, 'NEW TEXT', 5, false, done);
    });
});
