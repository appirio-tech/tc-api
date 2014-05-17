/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCASSEMBLER
 *
 * The test cases of apply studio review opportunities.
 */
'use strict';
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var _ = require('underscore');
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var S = require('string');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/reviewOpportunities/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * The test cases of apply studio review opportunities.
 */
describe('Apply Design Review Opportunity Details API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    var member1 = testHelper.generateAuthHeader({ sub: 'ad|132456' }),
        member2 = testHelper.generateAuthHeader({ sub: 'ad|132458' });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'common_oltp__clean', 'common_oltp', cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__clean', 'tcs_catalog', cb);
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
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__insert_test_data', 'tcs_catalog', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'tcs_catalog__prepare_design_test_data', 'tcs_catalog', cb);
            }, function (cb) {
                testHelper.runSqlFile(SQL_DIR + 'common_oltp__insert_test_data', 'common_oltp', cb);
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
     * create a http request and test it.
     * @param {String} url - the request url.
     * @param {Number} expectStatus - the expected response status code.
     * @param {Object} authHeader - the auth header.
     * @param {Object} postData - the data post to api.
     * @param {Function} cb - the call back function.
     */
    function createPostRequest(url, expectStatus, authHeader, postData, cb) {
        var req = request(API_ENDPOINT)
            .post('/v2/design/reviewOpportunities/' + url + '/apply')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        req.expect(expectStatus)
            .send(postData)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {String} url - the request url
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} authHeader - the request auth header.
     * @param {Object} postData - the data post to api.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(url, expectStatus, errorMessage, authHeader, postData, cb) {
        createPostRequest(url, expectStatus, authHeader, postData, function (err, result) {
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
     * Test when caller is anonymous.
     */
    it('should return unauthorized Error. The caller is anonymous.', function (done) {
        assertBadResponse('3001', 401, 'Anonymous user don\'t have permission to access this api.', null, null, done);
    });


    /**
     * Test when challengeId is not number.
     */
    it('should return bad request. The challengeId is not number.', function (done) {
        assertBadResponse('abc', 400, 'challengeId should be number.',
            member1, null, done);
    });

    /**
     * Test when challengeId is not integer.
     */
    it('should return bad request. The challengeId is not integer.', function (done) {
        assertBadResponse('1.2345', 400, 'challengeId should be Integer.',
            member1, null, done);
    });

    /**
     * Test when challengeId is not positive.
     */
    it('should return bad request. The challengeId is not positive.', function (done) {
        assertBadResponse('-1', 400, 'challengeId should be positive.',
            member1, null, done);
    });

    /**
     * Test when challengeId is too big.
     */
    it('should return bad request. The challengeId is too big.', function (done) {
        assertBadResponse('2147483648', 400, 'challengeId should be less or equal to 2147483647.',
            member1, null, done);
    });

    /**
     * Test when challenge is not existed.
     */
    it('should return bad Request. The challenge is not existed.', function (done) {
        assertBadResponse('8001', 400, 'The specified challenge doesn\'t exist.', member1, null, done);
    });

    it('should return bad Request. Not a member of the review board.', function (done) {
        assertBadResponse('3001', 400, 'Sorry, you are not a member of the review board.', member2, null, done);
    });

    /**
     * Test when resource is taken.
     */
    it('should return bad Request. The resource is taken.', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlQuery('INSERT INTO resource (resource_id, resource_role_id, project_phase_id, ' +
                    'project_id, user_id, create_user, create_date, modify_user,modify_date) ' +
                    'VALUES(4000001, 2, 3003, 3001, 132456, 132456, CURRENT, 132456, CURRENT);', 'tcs_catalog', cb);
            }, function (cb) {
                assertBadResponse('3001', 400, 'The specified Screening review position is already taken.', member1, null, cb);
            }, function (cb) {
                testHelper.runSqlQuery('DELETE FROM resource WHERE project_id = \'3001\';', 'tcs_catalog', cb);
            }
        ], done);
    });

    /**
     * Test when it has pending term of use.
     */
    it('should return bad Request. It has pending term of use.', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlQuery('DELETE FROM user_terms_of_use_xref WHERE user_id = 132456;', 'common_oltp', cb);
            }, function (cb) {
                assertBadResponse('3001', 403, 'You should agree with all terms of use.', member1, null, cb);
            }, function (cb) {
                testHelper.runSqlQuery('INSERT INTO user_terms_of_use_xref(user_id, terms_of_use_id, create_date, ' +
                    'modify_date)VALUES(132456, 20704, current, current);', 'common_oltp', cb);
            }
        ], done);
    });

    /**
     * Test with success condition.
     */
    it('should return success results.', function (done) {
        async.waterfall([
            function (cb) {
                createPostRequest('3001', 200, member1, { isSpecReview: 'true' }, function (err, result) {
                    cb(err, result);
                });
            },
            function (result, cb) {
                testHelper.runSqlSelectQuery(' external_ref_id, notification_type_id from notification ' +
                    'where project_id = 3001;', 'tcs_catalog', cb);
            },
            function (result, cb) {
                assert.isTrue(result[0].external_ref_id === 132456, 'cannot find notification');
                assert.isTrue(result[0].notification_type_id === 1, 'cannot find notification');
                cb();
            }, function (cb) {
                testHelper.runSqlQuery('DELETE FROM notification WHERE project_id = 3001;', 'tcs_catalog', cb);
            }
        ], done);
    });

    /**
     * Test with success condition.
     */
    it('should return success results.', function (done) {
        async.waterfall([
            function (cb) {
                createPostRequest('3001', 200, member1, { isSpecReview: 'false' }, function (err, result) {
                    cb(err, result);
                });
            },
            function (result, cb) {
                testHelper.runSqlSelectQuery(' resource_role_id, project_id, project_phase_id, user_id FROM resource ' +
                    'WHERE project_id = "3001" order by resource_role_id', 'tcs_catalog', cb);
            },
            function (result, cb) {
                assert.isTrue(result[0].resource_role_id === 2, 'cannot find resource');
                assert.isTrue(result[0].project_id === 3001, 'cannot find resource');
                assert.isTrue(result[0].project_phase_id === 3003, 'cannot find resource');
                assert.isTrue(result[0].user_id === 132456, 'cannot find resource');

                assert.isTrue(result[1].resource_role_id === 19, 'cannot find resource');
                assert.isTrue(result[1].project_id === 3001, 'cannot find resource');
                assert.isTrue(result[1].project_phase_id === 3003, 'cannot find resource');
                assert.isTrue(result[1].user_id === 132456, 'cannot find resource');

                testHelper.runSqlSelectQuery(' resource_info_type_id, value from resource_info where' +
                    ' resource_id in (select resource_id from resource where project_id = "3001") ' +
                    'order by resource_id, resource_info_type_id;', 'tcs_catalog', cb);
            },
            function (result, cb) {
                assert.isTrue(result[0].resource_info_type_id === 1, 'cannot find resource_info');
                assert.isTrue(result[0].value === '132456', 'cannot find resource_info');

                assert.isTrue(result[1].resource_info_type_id === 2, 'cannot find resource_info');
                assert.isTrue(result[1].value === 'heffan', 'cannot find resource_info');

                assert.isTrue(result[3].resource_info_type_id === 7, 'cannot find resource_info');
                assert.isTrue(result[3].value === '0.0', 'cannot find resource_info');

                assert.isTrue(result[4].resource_info_type_id === 8, 'cannot find resource_info');
                assert.isTrue(result[4].value === 'No', 'cannot find resource_info');

                assert.isTrue(result[5].resource_info_type_id === 1, 'cannot find resource_info');
                assert.isTrue(result[5].value === '132456', 'cannot find resource_info');

                assert.isTrue(result[6].resource_info_type_id === 2, 'cannot find resource_info');
                assert.isTrue(result[6].value === 'heffan', 'cannot find resource_info');

                assert.isTrue(result[8].resource_info_type_id === 7, 'cannot find resource_info');
                assert.isTrue(result[8].value === '0.0', 'cannot find resource_info');

                assert.isTrue(result[9].resource_info_type_id === 8, 'cannot find resource_info');
                assert.isTrue(result[9].value === 'No', 'cannot find resource_info');

                testHelper.runSqlSelectQuery(' external_ref_id, notification_type_id from notification ' +
                    'where project_id = 3001;', 'tcs_catalog', cb);
            },
            function (result, cb) {
                assert.isTrue(result[0].external_ref_id === 132456, 'cannot find notification');
                assert.isTrue(result[0].notification_type_id === 1, 'cannot find notification');
                cb();
            }
        ], done);
    });
});
