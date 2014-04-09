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
var _ = require('underscore');
var request = require('supertest');
var assert = require('chai').assert;
var async = require('async');
var S = require('string');

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + '/sqls/applyDevelopReviewOpportunity/';
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

describe('Get Software Review Opportunity Details API', function () {
    this.timeout(180000);     // The api with testing remote db could be quit slow

    var msgObj = require('../test/test_files/expected_apply_software_review_opportunities_response_message'),
        member1 = testHelper.generateAuthHeader({ sub: 'ad|132457' }),
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
            },
            function (cb) {
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
    function createGetRequest(url, expectStatus, authHeader, postData, cb) {
        var req = request(API_ENDPOINT)
            .post('/v2/develop/reviewOpportunities/' + url + '/apply')
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
        createGetRequest(url, expectStatus, authHeader, postData, function (err, result) {
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
        assertBadResponse('2001', 401, msgObj.unauthorized, null, null, done);
    });


    /**
     * Test when challengeId is not number.
     */
    it('should return bad request. The challengeId is not number.', function (done) {
        assertBadResponse('abc', 400, msgObj.challengeId.notNumber,
            member1, null, done);
    });

    /**
     * Test when challengeId is not integer.
     */
    it('should return bad request. The challengeId is not integer.', function (done) {
        assertBadResponse('1.2345', 400, msgObj.challengeId.notInteger,
            member1, null, done);
    });

    /**
     * Test when challengeId is not positive.
     */
    it('should return bad request. The challengeId is not positive.', function (done) {
        assertBadResponse('-1', 400, msgObj.challengeId.notPositive,
            member1, null, done);
    });

    /**
     * Test when challengeId is zero.
     */
    it('should return bad request. The challengeId is zero.', function (done) {
        assertBadResponse('0', 400, msgObj.challengeId.notPositive,
            member1, null, done);
    });

    /**
     * Test when challengeId is too big.
     */
    it('should return bad request. The challengeId is too big.', function (done) {
        assertBadResponse('2147483648', 400, msgObj.challengeId.tooBig,
            member1, null, done);
    });

    /**
     * Test when reviewApplicationRoleId is invalid.
     */
    it('should return bad Request. The reviewApplicationRoleId is invalid', function (done) {
        assertBadResponse('2001', 400, msgObj.invalidReviewApplicationRole, member1, {
            reviewApplicationRoleId: 10
        }, done);
    });

    /**
     * Test when challenge is not existed.
     */
    it('should return bad Request. The challenge is not existed.', function (done) {
        assertBadResponse('8001', 400, msgObj.invalidChallenge, member1, null, done);
    });

    /**
     * Test when challenge is existed but don't have any review opportunities.
     */
    it('should return bad Request. The challenge don\'t have any review opportunities.', function (done) {
        assertBadResponse('2002', 400, msgObj.invalidChallenge, member1, null, done);
    });

    /**
     * Test when challenge review registration is not open.
     */
    it('should return bad Request. The challenge review registration is not open.', function (done) {
        assertBadResponse('2003', 400, msgObj.invalidChallenge, member1, null, done);
    });

    /**
     * Test when requested review application role id is not belong to this challenge.
     */
    it('should return bad Request. The requested review application role id is not belong to this challenge.', function (done) {
        assertBadResponse('2001', 400, msgObj.invalidReviewApplicationId, member1, { reviewApplicationRoleId: 3 }, done);
    });

    /**
     * Test the caller is not a reviewer for this kind of challenge.
     */
    it('should return bad Request. The caller is not reviewer for this kind of challenge.', function (done) {
        assertBadResponse('2004', 403, msgObj.notReviewer, member2, { reviewApplicationRoleId: 1 }, done);
    });

    /**
     * Test when caller is not allowed to access this challenge.
     */
    it('should return bad Request. The caller is not allowed to access this challenge.', function (done) {
        assertBadResponse('2005', 403, msgObj.forbidden, member1, null, done);
    });

    /**
     * Test when caller has already been as a reviewer.
     */
    it('should return bad Request. The caller has already been assigned as a reviewer.', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlQuery('INSERT INTO resource(resource_id, resource_role_id, project_id, create_user, create_date, modify_user, modify_date) VALUES(2015, 2, 2001, 132456, current, 132456, current); ' +
                    'INSERT INTO resource_info(resource_id, resource_info_type_id, value, create_user, create_date, modify_user, modify_date)VALUES(2015, 1, "132457", 132456, current, 132456, current); ' +
                    'INSERT INTO resource(resource_id, resource_role_id, project_id, create_user, create_date, modify_user, modify_date) VALUES(2016, 4, 2001, 132456, current, 132456, current); ' +
                    'INSERT INTO resource_info(resource_id, resource_info_type_id, value, create_user, create_date, modify_user, modify_date)VALUES(2016, 1, "132457", 132456, current, 132456, current); ' +
                    'INSERT INTO resource(resource_id, resource_role_id, project_id, create_user, create_date, modify_user, modify_date) VALUES(2017, 8, 2001, 132456, current, 132456, current); ' +
                    'INSERT INTO resource_info(resource_id, resource_info_type_id, value, create_user, create_date, modify_user, modify_date)VALUES(2017, 1, "132457", 132456, current, 132456, current); ' +
                    'INSERT INTO resource(resource_id, resource_role_id, project_id, create_user, create_date, modify_user, modify_date) VALUES(2018, 9, 2001, 132456, current, 132456, current); ' +
                    'INSERT INTO resource_info(resource_id, resource_info_type_id, value, create_user, create_date, modify_user, modify_date)VALUES(2018, 1, "132457", 132456, current, 132456, current);', 'tcs_catalog', cb);
            },
            function (cb) {
                assertBadResponse('2001', 400, msgObj.alreadyAReviewer, member1, { reviewApplicationRoleId: 1 }, cb);
            },
            function (cb) {
                testHelper.runSqlQueries(['DELETE FROM resource_info WHERE resource_id >= 2015;', 'DELETE FROM resource WHERE resource_id >= 2015'], 'tcs_catalog', cb);
            }
        ], done);
    });

    /**
     * Test when challenge don't have open positions.
     */
    it('should return bad Request. The challenge don\'t have any open positions.', function (done) {
        assertBadResponse('2006', 400, msgObj.noOpenPositions, member1, { reviewApplicationRoleId: 1 }, done);
    });

    /**
     * Test when there is no positions for applying primary reviewer.
     */
    it('should return bad Request. There is no open positions for applying role.', function (done) {
        assertBadResponse('2007', 400, msgObj.noPositionsForPrimaryReviewer, member2, { reviewApplicationRoleId: 1 }, done);
    });

    /**
     * Test when challenge don't have open positions for applying secondary reviewer.
     */
    it('should return bad Request. The challenge don\'t have open secondary reviewer positions.', function (done) {
        assertBadResponse('2009', 400, msgObj.noPositionsForSecondaryReviewer, member1, { reviewApplicationRoleId: 2 }, done);
    });

    /**
     * Test when there is still terms of use not agreed.
     */
    it('should return bad Request. The terms of use are not all agreed.', function (done) {
        assertBadResponse('2001', 403, msgObj.notAgreedTerms, member2, { reviewApplicationRoleId: 2 }, done);
    });

    /**
     * Test when the register is success and the assignment date is passed.
     */
    it('should return success results. The review application is created. The assignment date is passed.', function (done) {
        async.waterfall([
            function (cb) {
                createGetRequest('2001', 200, member1, { reviewApplicationRoleId: 1 }, function (err, result) {
                    cb(err, result);
                });
            },
            function (result, cb) {
                assert.equal(result.body.message, msgObj.success.afterAssignment, 'invalid response');

                testHelper.runSqlSelectQuery('* FROM review_application WHERE review_auction_id = 2001;', 'tcs_catalog', cb);
            },
            function (result, cb) {
                assert.isTrue(result[0].review_application_id >= 3000000, 'invalid review application id');
                assert.isTrue(result[0].review_application_role_id === 1, 'invalid review application role id');
                assert.isTrue(result[0].review_application_status_id === 1, 'invalid review application status id');
                cb();
            }
        ], done);
    });

    /**
     * Test when register is success and the assignment is not passed.
     */
    it('should return success results. The review application is created. The assignment is not passed.', function (done) {
        async.waterfall([
            function (cb) {
                createGetRequest('2008', 200, member1, { reviewApplicationRoleId: 1 }, function (err, result) {
                    cb(err, result);
                });
            },
            function (result, cb) {
                assert.isTrue(new S(result.body.message).startsWith(msgObj.success.beforeAssignmentPrefix), 'invalid prefix');
                assert.isTrue(new S(result.body.message).endsWith(msgObj.success.beforeAssignmentSuffix), 'invalid suffix');

                testHelper.runSqlSelectQuery('* FROM review_application WHERE review_auction_id = 2008;', 'tcs_catalog', cb);
            },
            function (result, cb) {
                assert.isTrue(result[0].review_application_id >= 3000000, 'invalid review application id');
                assert.isTrue(result[0].review_application_role_id === 1, 'invalid review application role id');
                assert.isTrue(result[0].review_application_status_id === 1, 'invalid review application status id');
                cb();
            }
        ], done);
    });

    /**
     * Test when register cancelled all his registration.
     */
    it('should return success results. The review application is cancelled.', function (done) {
        async.waterfall([
            function (cb) {
                createGetRequest('2001', 200, member1, null, function (err, result) {
                    cb(err, result);
                });
            },
            function (result, cb) {
                assert.equal(result.body.message, msgObj.success.cancelled, 'invalid response');

                testHelper.runSqlSelectQuery(' * FROM review_application WHERE review_auction_id = 2001;', 'tcs_catalog', cb);
            },
            function (result, cb) {
                assert.isTrue(result[0].review_application_role_id === 1, 'invalid review application role id ' + result[0].review_application_role_id);
                assert.isTrue(result[0].review_application_status_id === 2, 'invalid review application status id ' + result[0].review_application_status_id);
                cb();
            }
        ], done);
    });

    /**
     * Test when caller apply the primary reviewer first and then cancel it and apply the secondary reviewer.
     */
    it('should return success results. The caller apply the primary reviewer before and cancel it and apply secondary reviewer.', function (done) {
        async.waterfall([
            function (cb) {
                createGetRequest('2001', 200, member1, { reviewApplicationRoleId: 1 }, function (err) {
                    cb(err);
                });
            },
            function (cb) {
                testHelper.runSqlSelectQuery(' * FROM review_application WHERE review_auction_id = 2001 AND review_application_status_id = 1;', 'tcs_catalog', cb);
            },
            function (result, cb) {
                assert.isTrue(result[0].review_application_id >= 3000000);
                assert.isTrue(result[0].review_application_role_id === 1);
                cb();
            },
            function (cb) {
                createGetRequest('2001', 200, member1, { reviewApplicationRoleId: 2 }, function (err) {
                    cb(err);
                });
            },
            function (cb) {
                testHelper.runSqlSelectQuery(' * FROM review_application WHERE review_auction_id = 2001 AND ' +
                    'review_application_role_id = 1;', 'tcs_catalog', cb);
            },
            function (result, cb) {
                result.forEach(function (item) {
                    assert.isTrue(item.review_application_status_id === 2);
                });
                cb();
            },
            function (cb) {
                testHelper.runSqlSelectQuery(' * FROM review_application WHERE review_auction_id = 2001 AND ' +
                    'review_application_role_id = 2;', 'tcs_catalog', cb);
            },
            function (result, cb) {
                result.forEach(function (item) {
                    assert.isTrue(item.review_application_status_id === 1);
                });
                cb();
            }
        ], done);
    });

    /**
     * Test when caller apply the primary reviewer first and apply the primary reviewer and secondary reviewer
     */
    it('should return success results. The caller apply the primary reviewer first and apply the primary reviewer and secondary reviewer.', function (done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlQueries(['DELETE FROM resource_info WHERE resource_id >= 2001;', 'DELETE FROM resource WHERE resource_id >= 2001;'], 'tcs_catalog',
                    function (err) {
                        cb(err);
                    });
            },
            function (cb) {
                createGetRequest('2001', 200, member1, { reviewApplicationRoleId: 1 }, function (err) {
                    cb(err);
                });
            },
            function (cb) {
                createGetRequest('2001', 200, member1, { reviewApplicationRoleId: [1, 2] }, function (err) {
                    cb(err);
                });
            },
            function (cb) {
                testHelper.runSqlSelectQuery(' * FROM review_application WHERE review_auction_id = 2001 AND ' +
                    'review_application_status_id = 1 AND user_id = 132457 ORDER BY review_application_role_id ASC;', 'tcs_catalog', cb);
            },
            function (result, cb) {
                assert.equal(result.length, 2, 'invalid results length');
                assert.equal(result[0].review_application_role_id, 1, 'invalid response');
                assert.equal(result[1].review_application_role_id, 2, 'invalid response');
                cb();
            }
        ], done);
    });



});
