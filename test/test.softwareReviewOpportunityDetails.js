/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author  Ghost_141
 */
'use strict';
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var _ = require('underscore');
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/softwareReviewOpportunityDetails/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Software Review Opportunity Details API', function () {
    this.timeout(60000);     // The api with testing remote db could be quit slow

    var errorObject = require('../test/test_files/expected_get_software_review_opportunity_details_error_message'),
        URL = '/v2/develop/reviewOpportunities/',
        admin = testHelper.generateAuthHeader({ sub: 'ad|132456' }),
        member = testHelper.generateAuthHeader({ sub: 'ad|132457' });

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
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
     * @param {Function} cb - the call back function.
     */
    function createGetRequest(url, expectStatus, authHeader, cb) {
        var req = request(API_ENDPOINT)
            .get(url)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/);
        if (authHeader) {
            req.set('Authorization', authHeader);
        }
        req.expect(expectStatus)
            .end(cb);
    }

    /**
     * assert the bad response.
     * @param {String} url - the request url
     * @param {Number} expectStatus - the expect status.
     * @param {String} errorMessage - the expected error message.
     * @param {Object} authHeader - the request auth header.
     * @param {Function} cb - the callback function.
     */
    function assertBadResponse(url, expectStatus, errorMessage, authHeader, cb) {
        createGetRequest(url, expectStatus, authHeader, function (err, result) {
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
     * Test when challengeId is negative.
     */
    it('should return bad request. The challengeId is negative.', function (done) {
        assertBadResponse(URL + '-1', 400, errorObject.challengeId.negative, member, done);
    });

    /**
     * Test when challengeId is zero.
     */
    it('should return bad request. The challengeId is zero.', function (done) {
        assertBadResponse(URL + '0', 400, errorObject.challengeId.negative, member, done);
    });

    /**
     * Test when challengeId is too big.
     */
    it('should return bad request. The challengeId is too big.', function (done) {
        assertBadResponse(URL + '2147483648', 400, errorObject.challengeId.tooBig, member, done);
    });

    /**
     * Test when challengeId is not integer.
     */
    it('should return bad request. The challengeId is not integer.', function (done) {
        assertBadResponse(URL + '1.2345', 400, errorObject.challengeId.notInteger, member, done);
    });

    /**
     * Test when challengeId is not number.
     */
    it('should return bad request. The challengeId is not number.', function (done) {
        assertBadResponse(URL + 'abc', 400, errorObject.challengeId.notNumber, member, done);
    });

    /**
     * Test when anonymous call this api.
     */
    it('should return unauthorized error. The caller is anonymous.', function (done) {
        assertBadResponse(URL + '2001', 401, errorObject.unauthorized, null, done);
    });

    /**
     * Test when admin call this api.
     */
    it('should return success results. The caller is admin.', function (done) {
        createGetRequest(URL + '2004', 200, admin, function (err, result) {
            result.res.body.phases.forEach(function (item) {
                assert.isTrue(_.isDate(new Date(item.scheduledStartTime)));
                assert.isTrue(_.isDate(new Date(item.scheduledEndTime)));

                delete item.scheduledStartTime;
                delete item.scheduledEndTime;
            });

            result.res.body.applications.forEach(function (item) {
                assert.isTrue(_.isDate(new Date(item.applicationDate)));

                delete item.applicationDate;
            });

            testHelper.assertResponse(err, result, 'test_files/expected_get_software_review_opportunity_detail_1', done);
        });
    });

    /**
     * Test when member call this api.
     */
    it('should return success results. The caller is member.', function (done) {
        createGetRequest(URL + '2004', 200, member, function (err, result) {
            result.res.body.phases.forEach(function (item) {
                assert.isTrue(_.isDate(new Date(item.scheduledStartTime)));
                assert.isTrue(_.isDate(new Date(item.scheduledEndTime)));

                delete item.scheduledStartTime;
                delete item.scheduledEndTime;
            });

            result.res.body.applications.forEach(function (item) {
                assert.isTrue(_.isDate(new Date(item.applicationDate)));

                delete item.applicationDate;
            });
            testHelper.assertResponse(err, result, 'test_files/expected_get_software_review_opportunity_detail_1', done);
        });
    });

    /**
     * Test when the challenge don't have review opportunity and the caller is admin.
     */
    it('should return bad request. The challenge don\'t have review opportunity(The caller is member).',
        function (done) {
            assertBadResponse(URL + '2001', 400, errorObject.invalidChallenge, member, done);
        });

    /**
     * Test when challenge don't have the review opportunity and the caller is member.
     */
    it('should return bad request. The challenge don\'t have the review opportunity(The caller is admin).',
        function (done) {
            assertBadResponse(URL + '2001', 400, errorObject.invalidChallenge, admin, done);
        });

    /**
     * Test when challenge is a studio challenge and the caller is member.
     */
    it('should return bad request. The challenge is a studio challenge(The caller is member).', function (done) {
        assertBadResponse(URL + '2008', 400, errorObject.invalidChallenge, member, done);
    });

    /**
     * Test when challenge is a studio challenge and the caller is admin.
     */
    it('should return bad request. The challenge is a studio challenge(The caller is admin).', function (done) {
        assertBadResponse(URL + '2008', 400, errorObject.invalidChallenge, admin, done);
    });

    /**
     * Test when the challenge is a private challenge. The caller is a member who don't belong to the group.
     */
    it('should return bad request. The challenge is a private challenge(The caller is a member).', function (done) {
        assertBadResponse(URL + '2009', 403, errorObject.privateChallenge, member, done);
    });

    /**
     * Test when the challenge is a private challenge. The caller is a admin who don't belong to the group.
     */
    it('should return bad request. The challenge is a private challenge(The caller is a admin).', function (done) {
        assertBadResponse(URL + '2009', 403, errorObject.privateChallenge, admin, done);
    });

    /**
     * Test when member is in the private group.
     */
    it('should return success results. The member is in the group.', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlQuery('INSERT INTO user_group_xref(user_group_id, login_id, group_id, create_user_id, ' +
                    'security_status_id, create_date) VALUES(2001, 132457, 208, 132457, 1, current);', 'tcs_catalog', cb);
            },
            function (cb) {
                createGetRequest(URL + '2009', 200, member, cb);
            }
        ], done);
    });

    /**
     * Test when admin is in the private group.
     */
    it('should return success results. The admin is in the group.', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlQuery('INSERT INTO user_group_xref(user_group_id, login_id, group_id, create_user_id, ' +
                    'security_status_id, create_date) VALUES(2002, 132456, 208, 132456, 1, current);', 'tcs_catalog', cb);
            },
            function (cb) {
                createGetRequest(URL + '2009', 200, admin, cb);
            }
        ], done);
    });

    /**
     * Test when a reviewer is assigned.
     */
    it('should return success results. Assign a secondary reviewer.', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlQueries([
                    'UPDATE review_application SET review_application_status_id = 3 WHERE review_application_id = 2003;',
                    'INSERT INTO resource(resource_id, resource_role_id, project_id, create_user, create_date, ' +
                        'modify_user, modify_date) VALUES(2002, 4, 2004, 132456, current, 132456, current);',
                    'INSERT INTO resource_info(resource_id, resource_info_type_id, value, create_user, create_date, ' +
                        'modify_user, modify_date) VALUES(2002, 1, \'132458\', 132456, current, 132456, current);'
                ], 'tcs_catalog', cb);
            },
            function (cb) {
                createGetRequest(URL + '2004', 200, member, function (err, result) {
                    result.res.body.phases.forEach(function (item) {
                        assert.isTrue(_.isDate(new Date(item.scheduledStartTime)));
                        assert.isTrue(_.isDate(new Date(item.scheduledEndTime)));

                        delete item.scheduledStartTime;
                        delete item.scheduledEndTime;
                    });

                    result.res.body.applications.forEach(function (item) {
                        assert.isTrue(_.isDate(new Date(item.applicationDate)));

                        delete item.applicationDate;
                    });
                    testHelper.assertResponse(err, result, 'test_files/expected_get_software_review_opportunity_detail_2', cb);
                });
            }
        ], done);
    });

    /**
     * Test
     */
    it('should return success results. Assign another secondary reviewer. The positions list should not have secondary ' +
        'reviewer now.', function (done) {
            async.waterfall([
                function (cb) {
                    testHelper.runSqlQueries([
                        'INSERT INTO review_application(review_application_id, user_id, review_auction_id, ' +
                            'review_application_role_id, review_application_status_id, create_date, modify_date) ' +
                            'VALUES(2004, 124766, 2001, 2, 3, current, current);',
                        'INSERT INTO resource(resource_id, resource_role_id, project_id, create_user, create_date, ' +
                            'modify_user, modify_date) VALUES(2003, 4, 2004, 132456, current, 132456, current);',
                        'INSERT INTO resource_info(resource_id, resource_info_type_id, value, create_user, create_date, ' +
                            'modify_user, modify_date) VALUES(2003, 1, \'124766\', 132456, current, 132456, current);'
                    ], 'tcs_catalog', cb);
                },
                function (cb) {
                    createGetRequest(URL + '2004', 200, member, function (err, result) {
                        result.res.body.phases.forEach(function (item) {
                            assert.isTrue(_.isDate(new Date(item.scheduledStartTime)));
                            assert.isTrue(_.isDate(new Date(item.scheduledEndTime)));

                            delete item.scheduledStartTime;
                            delete item.scheduledEndTime;
                        });

                        result.res.body.applications.forEach(function (item) {
                            assert.isTrue(_.isDate(new Date(item.applicationDate)));

                            delete item.applicationDate;
                        });

                        assert.lengthOf(result.res.body.positions, 1, 'invalid positions list');
                        testHelper.assertResponse(err, result, 'test_files/expected_get_software_review_opportunity_detail_3', cb);
                    });
                }
            ], done);
        });

    it('should return success results. Test the spec review opportunity.', function (done) {
        createGetRequest(URL + '2010', 200, member, function (err, result) {
            result.res.body.phases.forEach(function (item) {
                assert.isTrue(_.isDate(new Date(item.scheduledStartTime)));
                assert.isTrue(_.isDate(new Date(item.scheduledEndTime)));

                delete item.scheduledStartTime;
                delete item.scheduledEndTime;
            });

            result.res.body.applications.forEach(function (item) {
                assert.isTrue(_.isDate(new Date(item.applicationDate)));

                delete item.applicationDate;
            });
            testHelper.assertResponse(err, result, 'test_files/expected_get_software_review_opportunity_detail_4', done);
        });
    });

    /**
     * Test First2Finish challenge.
     */
    it('should return success results. Test the iterative review opportunity.', function (done) {
        createGetRequest(URL + '2011', 200, member, function (err, result) {
            result.res.body.phases.forEach(function (item) {
                assert.isTrue(_.isDate(new Date(item.scheduledStartTime)));
                assert.isTrue(_.isDate(new Date(item.scheduledEndTime)));

                delete item.scheduledStartTime;
                delete item.scheduledEndTime;
            });

            result.res.body.applications.forEach(function (item) {
                assert.isTrue(_.isDate(new Date(item.applicationDate)));

                delete item.applicationDate;
            });
            testHelper.assertResponse(err, result, 'test_files/expected_get_software_review_opportunity_detail_5', done);
        });
    });
});
