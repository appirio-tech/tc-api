/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCASSEMBLER
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true, nomen:true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");
var extend = require('underscore').extend;
var _ = require('underscore');
var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/srmRoundManagement/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

var SINGLE_ROUND_TYPE = 1;
/**
 * Long round type id. From com.topcoder.netCommon
 */
var LONG_ROUND_TYPE_ID = 10;

/**
 * Contest room type id
 */
var CONTEST_ROOM_TYPE_ID = 2;

/**
 * Admin room type id
 */
var ADMIN_ROOM_TYPE_ID = 1;

/**
 * Practice round type id.
 */
var PRACTICE_ROUND_TYPE_ID = 3;

/**
 * Practice chat room id.
 */
var PRACTICE_ROOM_TYPE_ID = 3;

/**
 * Moderated chat round type id
 */
var MODERATED_CHAT_ROUND_TYPE_ID = 4;

/**
 * Moderated chat room id.
 */
var MODERATED_CHAT_ROOM_TYPE_ID = 4;

/**
 * Query to get all related field for a round
 */
var ALL_RELATED_FIELD = "* FROM " +
        "round rd " +
        "LEFT OUTER JOIN broadcast ON rd.round_id=broadcast.round_id " +
        "LEFT OUTER JOIN invite_list ON rd.round_id=invite_list.round_id " +
        "LEFT OUTER JOIN round_segment ON rd.round_id=round_segment.round_id " +
        "LEFT OUTER JOIN round_event ON rd.round_id=round_event.round_id " +
        "LEFT OUTER JOIN round_registration ON rd.round_id=round_registration.round_id " +
        "LEFT OUTER JOIN system_test_result ON rd.round_id=system_test_result.round_id " +
        "LEFT OUTER JOIN challenge ON rd.round_id=challenge.round_id " +
        "LEFT OUTER JOIN component_state ON rd.round_id=component_state.round_id " +
        "LEFT OUTER JOIN round_component ON rd.round_id=round_component.round_id " +
        "LEFT OUTER JOIN round_question ON rd.round_id=round_question.round_id " +
        "LEFT OUTER JOIN request ON rd.round_id=request.round_id " +
        "LEFT OUTER JOIN room_result ON rd.round_id=room_result.round_id " +
        "LEFT OUTER JOIN room ON rd.round_id=room.round_id " +
        "LEFT OUTER JOIN round_room_assignment ON rd.round_id=round_room_assignment.round_id " +
        "LEFT OUTER JOIN round_language ON rd.round_id=round_language.round_id " +
        "LEFT OUTER JOIN survey_question ON rd.round_id = survey_question.survey_id " +
        "LEFT OUTER JOIN survey ON rd.round_id=survey.survey_id " +
        "WHERE rd.round_id=";

/**
 * Query to get all other untouch field for a round being modified
 */
var ALL_OTHER_FIELD = "* FROM " +
        "round rd " +
        "LEFT OUTER JOIN round_registration ON rd.round_id=round_registration.round_id " +
        "LEFT OUTER JOIN room ON rd.round_id=room.round_id " +
        "LEFT OUTER JOIN room_result ON rd.round_id=room_result.round_id " +
        "LEFT OUTER JOIN component_state ON rd.round_id=component_state.round_id " +
        "LEFT OUTER JOIN system_test_result ON rd.round_id=system_test_result.round_id " +
        "LEFT OUTER JOIN challenge ON rd.round_id=challenge.round_id " +
        "WHERE rd.round_id=";

/**
 * Get room for a round
 */
var GET_ROOM_FROM_ROUND = "* FROM " +
        "round rd " +
        "LEFT OUTER JOIN room ON rd.round_id=room.round_id " +
        "WHERE rd.round_id=";

describe('SRM Round Management APIs', function () {
    var i;
    this.timeout(80000);     // The api with testing remote db could be quit slow

    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        testHelper.runSqlFile(SQL_DIR + "informixoltp__clear", "informixoltp", done);
    }


    /**
     * This function is run after each test case.
     * Clean up all data.
     * @param {Function<err>} done the callback
     */
    after(function (done) {
        clearDb(done);
    });


    describe("List Round for Contest", function () {
        describe("Invalid request", function () {
            /**
             * Create request to list rounds API and assert 400 http code
             * @param {int} contestId - the contest id
             * @param {String} message - expected error details
             * @param {Function} done - the callback function
             */
            function assert400(contestId, message, done) {
                request(API_ENDPOINT)
                    .get('/v2/data/srm/rounds/' + contestId)
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + testHelper.getAdminJwt())
                    .expect('Content-Type', /json/)
                    .expect(400)
                    .end(function (err, res) {
                        if (err) {
                            done(err);
                        } else {
                            assert.equal(res.body.error.details, message);
                            done();
                        }
                    });
            }

            it("should 401 if anony", function (done) {
                request(API_ENDPOINT)
                    .get('/v2/data/srm/rounds/1000')
                    .set('Accept', 'application/json')
                    .expect('Content-Type', /json/)
                    .expect(401)
                    .end(done);
            });

            it("should 403 if member", function (done) {
                request(API_ENDPOINT)
                    .get('/v2/data/srm/rounds/1000')
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + testHelper.getMemberJwt())
                    .expect('Content-Type', /json/)
                    .expect(403)
                    .end(done);
            });

            /**
             * /v2/data/srm/rounds/abc (NAN)
             */
            it("should return error 400 when contestid is not number", function (done) {
                assert400("abc", 'contestId should be number.', done);
            });

            /**
             * /v2/data/srm/rounds/-1
             */
            it("should return error 400 when contestid is negative", function (done) {
                assert400(-1, 'contestId should be positive.', done);
            });

            /**
             * /v2/data/srm/rounds/1.23
             */
            it("should return error 400 when contestid is float", function (done) {
                assert400(1.23, 'contestId should be Integer.', done);
            });

            /**
             * /v2/data/srm/rounds/1233333333333333333333333
             */
            it("should return error 400 when contestid is too big", function (done) {
                assert400(12333333333333, 'contestId should be less or equal to 2147483647.', done);
            });
        });



        describe("Valid request", function () {
            /**
             * This function is run before all tests.
             * Generate tests data.
             * @param {Function<err>} done the callback
             */
            before(function (done) {
                async.waterfall([
                    function (cb) {
                        clearDb(cb);
                    }, function (cb) {
                        testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_rounds", "informixoltp", cb);
                    }
                ], done);
            });
            /**
             * Helper method for validating result for current test data
             * @param {int} contestId - the contest id
             * @param {String} expectFile - the filename of expected json.
             * @param {Function} done - the callback function
             */
            function validateResult(contestId, expectFile, done) {
                request(API_ENDPOINT)
                    .get('/v2/data/srm/rounds/' + contestId)
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + testHelper.getAdminJwt())
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var results = res.body,
                            expected = require("./test_files/srmRoundManagement/" + expectFile);
                        delete results.serverInformation;
                        delete results.requesterInformation;
                        assert.deepEqual(results, expected, "unexpected response");
                        done();
                    });
            }

            /**
             * Wrapper of validateResult
             * @param {int} contestId
             * @return {Function} function for `it`
             */
            function checker(contestId) {
                return function (done) {
                    validateResult(contestId, 'contest' + contestId + '.json', done);
                };
            }

            /**
             * /v2/data/srm/rounds/:contestId
             */
            for (i = 30001; i <= 30003; i = i + 1) {
                it("should return results for contest " + i, checker(i));
            }
        });

    });

    describe("Delete SRM Contest Round", function () {

        describe('Invalid request', function () {
            // invalid requests
            /**
             * Create request to delete round API and assert status code and error message
             * @param {int} roundId - the round id
             * @param {Object} params - configuration of request.
             * @param {Function} done - the callback function
             */
            function assertFail(roundId, params, done) {
                var r = request(API_ENDPOINT)
                        .post('/v2/data/srm/rounds/' + roundId)
                        .set('Accept', 'application/json')
                        .expect('Content-Type', /json/)
                        .expect(params.status);
                if (params.auth) {
                    r.set('Authorization', "Bearer " + params.auth);
                }
                r.end(function (err, res) {
                    if (err) {
                        done(err);
                    } else {
                        assert.equal(res.body.error.details, params.message);
                        done();
                    }
                });
            }

            it("should return error 401 when anonymous", function (done) {
                assertFail(123, {
                    status: 401,
                    message: 'You need to be authorized first.'
                }, done);
            });

            it("should return error 403 when member", function (done) {
                assertFail(123, {
                    status: 403,
                    message: 'You are forbidden for this API.',
                    auth: testHelper.getMemberJwt()
                }, done);
            });

            /**
             * /v2/data/srm/rounds/abc/delete (NAN)
             */
            it("should return error 400 when roundid is not number", function (done) {
                assertFail("abc", {
                    status: 400,
                    message: 'roundId should be number.',
                    auth: testHelper.getAdminJwt()
                }, done);
            });

            /**
             * /v2/data/srm/rounds/-1/delete
             */
            it("should return error 400 when contestid is negative", function (done) {
                assertFail(-1, {
                    status: 400,
                    message: 'roundId should be positive.',
                    auth: testHelper.getAdminJwt()
                }, done);
            });

            /**
             * /v2/data/srm/rounds/1.2/delete
             */
            it("should return error 400 when contestid is float", function (done) {
                assertFail(1.23, {
                    status: 400,
                    message: 'roundId should be Integer.',
                    auth: testHelper.getAdminJwt()
                }, done);
            });

            /**
             * /v2/data/srm/rounds/1233333333333333333333333/delete
             */
            it("should return error 400 when contestid is too big", function (done) {
                assertFail(12345678901234, {
                    status: 400,
                    message: 'roundId should be less or equal to 2147483647.',
                    auth: testHelper.getAdminJwt()
                }, done);
            });
        });

        describe('Valid Request', function () {
            /**
             * This function is run before all tests.
             * Generate tests data.
             * @param {Function<err>} done the callback
             */
            before(function (done) {
                async.waterfall([
                    function (cb) {
                        clearDb(cb);
                    }, function (cb) {
                        testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_rounds", "informixoltp", cb);
                    }
                ], done);
            });



            /**
             * Create request to delete contest round API and assert success.
             * @param {int} roundId - the round id
             * @param {Function} done - the callback function
             */
            function assertDeleteSucc(roundId, done) {
                async.waterfall([
                    function (cb) {
                        request(API_ENDPOINT)
                            .post('/v2/data/srm/rounds/' + roundId)
                            .set('Accept', 'application/json')
                            .set('Authorization', 'Bearer ' + testHelper.getAdminJwt())
                            .expect('Content-Type', /json/)
                            .expect(200)
                            .end(function (err, res) {
                                if (err) {
                                    cb(err);
                                    return;
                                }
                                assert.equal(res.body.message, 'ok');
                                cb();
                            });
                    },
                    function (cb) {
                        testHelper.runSqlSelectQuery(
                            ALL_RELATED_FIELD + roundId + ";",
                            "informixoltp",
                            cb
                        );
                    },
                    function (result, cb) {
                        assert.equal(result.length, 0, 'every thing should be delete.');
                        cb();
                    }
                ], done);

            }

            /**
             * Helper method for validating result for current test data
             * @param {int} contestId - the contest id
             * @param {String} expectJSON - the expected json.
             * @param {Function} done - the callback function
             */
            function validateResult(contestId, expectJSON, done) {
                request(API_ENDPOINT)
                    .get('/v2/data/srm/rounds/' + contestId)
                    .set('Accept', 'application/json')
                    .set('Authorization', 'Bearer ' + testHelper.getAdminJwt())
                    .expect('Content-Type', /json/)
                    .expect(200)
                    .end(function (err, res) {
                        if (err) {
                            done(err);
                            return;
                        }
                        var results = res.body;
                        delete results.serverInformation;
                        delete results.requesterInformation;
                        assert.deepEqual(results, expectJSON, "unexpected response");
                        done();
                    });
            }


            it("should delete simple round", function (done) {
                async.series([
                    function (cb) {
                        var expected = require('./test_files/srmRoundManagement/contest30010.json');
                        validateResult(30010, expected, cb);
                    },
                    function (cb) {
                        assertDeleteSucc(41001, cb);
                    },
                    function (cb) {
                        var expected = require('./test_files/srmRoundManagement/contest30010.json');
                        expected.data = _.filter(expected.data, function (round) {
                            return round.id !== 41001;
                        });
                        expected.total = expected.total - 1;
                        validateResult(30010, expected, cb);
                    }
                ], done);
            });

            it("should delete complex round", function (done) {
                async.series([
                    function (cb) {
                        var expected = require('./test_files/srmRoundManagement/contest30011.json');
                        validateResult(30011, expected, cb);
                    },
                    function (cb) {
                        assertDeleteSucc(41006, cb);
                    },
                    function (cb) {
                        var expected = require('./test_files/srmRoundManagement/contest30011.json');
                        expected.data = _.filter(expected.data, function (round) {
                            return round.id !== 41006;
                        });
                        expected.total = expected.total - 1;
                        validateResult(30011, expected, cb);
                    }
                ], done);
            });

            it("should 404 if deleting round is not existed", function (done) {
                async.waterfall([
                    function (cb) {
                        request(API_ENDPOINT)
                        // deleting something not existed
                            .post('/v2/data/srm/rounds/600000')
                            .set('Accept', 'application/json')
                            .set('Authorization', 'bearer ' + testHelper.getAdminJwt())
                            .expect('Content-Type', /json/)
                            .expect(404)
                            .end(cb);
                    },
                    function (res, cb) {
                        assert(res.body.error.details, "deleting round is not existed");
                        cb();
                    }
                ], done);
            });
        });
    });

    describe("Create SRM Contest Round", function () {


        /**
         * create a http request with auth header and test it.
         * @param {Number} expectStatus - the expected response status code.
         * @param {Object} postData - the data post to api.
         * @param {Function} cb - the call back function.
         */
        function createPostRequest(expectStatus, postData, cb) {
            var req = request(API_ENDPOINT)
                    .post('/v2/data/srm/rounds')
                    .set('Accept', 'application/json')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Bearer ' + testHelper.getAdminJwt())
                    .expect('Content-Type', /json/);
            req.expect(expectStatus)
                .send(postData)
                .end(cb);
        }

        /**
         * Create request to create round API and assert status code and error message.
         * @param {object} params - params to configure
         * @param {Function} done - the callback function
         */
        function assertFail(params, done) {
            var req = request(API_ENDPOINT)
                    .post('/v2/data/srm/rounds')
                    .set('Accept', 'application/json')
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/);
            if (params.auth) {
                req.set('Authorization', 'Bearer ' + params.auth);
            }
            req.expect(params.status)
                .send(params.json)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    } else {
                        assert.equal(res.body.error.details, params.message);
                        done();
                    }
                });
        }

        /**
         * Create request to create round API and assert 200 http code
         * @param {object} json - the post data
         * @param {Function} done - the callback function
         */
        function assert200(json, done) {

            createPostRequest(200, json, function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(res.body.message, 'ok');
                done();
            });
        }

        /**
         * Helper method for validating result for current test data
         * @param {int} contestId - the contest id
         * @param {String} expectFile - the filename of expected json.
         * @param {Function} done - the callback function
         */
        function validateResult(contestId, expectFile, done) {
            request(API_ENDPOINT)
                .get('/v2/data/srm/rounds/' + contestId)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + testHelper.getAdminJwt())
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var results = res.body,
                        expected = require("./test_files/srmRoundManagement/" + expectFile);
                    delete results.serverInformation;
                    delete results.requesterInformation;
                    assert.deepEqual(results, expected, "unexpected response");
                    done();
                });
        }

        /**
         * Helper method to do deep clone for request.
         * @param {Object} request request to be cloned
         * @return {Object} cloned request
         */
        function requestClone(request) {
            var result = _.clone(request);
            result.type = _.clone(request.type);
            result.region = _.clone(request.region);
            result.roomAssignment = _.clone(request.roomAssignment);
            return result;
        }

        var newRound = require('./test_files/srmRoundManagement/contest30003_create.json')
                .data[0],
            goodRequest = require('./test_files/srmRoundManagement/good_request.json'),
            typeList = [
                4, // Moderated chat round type id
                3, // Practice round type id
                10, // Long round type id
                14, // Long problem practice round type id.
                9, // Team practice round type id.
                23, // AMD long problem practice round type id.
                7 // TEAM_SINGLE_ROUND_MATCH_TYPE_ID
            ];

        describe('Invalid request', function () {

            it('should 401 if anonymous', function (done) {
                var rrequest = requestClone(goodRequest);
                assertFail({
                    json: rrequest,
                    status: 401,
                    message: 'You need to be authorized first.'
                }, done);
            });

            it('should 403 if member', function (done) {
                var rrequest = requestClone(goodRequest);
                assertFail({
                    json: rrequest,
                    auth: testHelper.getMemberJwt(),
                    status: 403,
                    message: 'You are forbidden for this API.'
                }, done);
            });

            /**
             * Check 400 response if contest_id NaN
             */
            it("should return 400 when contest_id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.contest_id = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'contest_id should be number.'
                }, done);
            });


            /**
             * Check 400 response if contest_id too big
             */
            it("should return 400 when contest_id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.contest_id = 12345678901234;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'contest_id should be less or equal to 2147483647.'
                }, done);
            });


            /**
             * Check 400 response if contest_id is negative
             */
            it("should return 400 when contest_id is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.contest_id = -1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'contest_id should be positive.'
                }, done);
            });


            /**
             * Check 400 response if id NaN
             */
            it("should return 400 when id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.id = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'id should be number.'
                }, done);
            });


            /**
             * Check 400 response if id too big
             */
            it("should return 400 when id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.id = 12345678901234;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'id should be less or equal to 2147483647.'
                }, done);
            });


            /**
             * Check 400 response if id is negative
             */
            it("should return 400 when id is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.id = -1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'id should be positive.'
                }, done);
            });


            /**
             * Check 400 response if type is not object
             */
            it("should return 400 when type is not a object", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.type = 123;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'type should be object'
                }, done);
            });


            /**
             * Check 400 response if type.id NaN
             */
            it("should return 400 when type.id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.type.id = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'type.id should be number.'
                }, done);
            });


            /**
             * Check 400 response if type.id too big
             */
            it("should return 400 when type.id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.type.id = 12345678901234;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'type.id should be less or equal to 2147483647.'
                }, done);
            });


            /**
             * Check 400 response if type.id is negative
             */
            it("should return 400 when type.id is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.type.id = -1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'type.id should be positive.'
                }, done);
            });


            /**
             * Check 400 response if invitationalType NaN
             */
            it("should return 400 when invitationalType not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.invitationalType = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'invitationalType should be number.'
                }, done);
            });


            /**
             * Check 400 response if invitationalType is negative
             */
            it("should return 400 when invitationalType is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.invitationalType = -1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'invitationalType should be non-negative.'
                }, done);
            });


            /**
             * Check 400 response if invitationalType is not integer
             */
            it("should return 400 when invitationalType is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.invitationalType = 1.1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'invitationalType should be Integer.'
                }, done);
            });


            /**
             * Check 400 reseponse if region is not object
             */
            it("should return 400 when region is not a object", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.region = 123;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'region should be object'
                }, done);
            });


            /**
             * Check 400 response if region.region_id NaN
             */
            it("should return 400 when region.region_id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.region.region_id = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'region.region_id should be number.'
                }, done);
            });


            /**
             * Check 400 response if region.region_id too big
             */
            it("should return 400 when region.region_id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.region.region_id = 12345678901234;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'region.region_id should be less or equal to 2147483647.'
                }, done);
            });


            /**
             * Check 400 response if region.region_id is negative
             */
            it("should return 400 when region.region_id is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.region.region_id = -1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'region.region_id should be positive.'
                }, done);
            });


            /**
             * Check 400 response if registrationLimit NaN
             */
            it("should return 400 when registrationLimit not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.registrationLimit = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'registrationLimit should be number.'
                }, done);
            });


            /**
             * Check 400 response if registrationLimit is negative
             */
            it("should return 400 when registrationLimit is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.registrationLimit = -1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'registrationLimit should be non-negative.'
                }, done);
            });


            /**
             * Check 400 response if registrationLimit is not integer
             */
            it("should return 400 when registrationLimit is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.registrationLimit = 1.1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'registrationLimit should be Integer.'
                }, done);
            });


            /**
             * Check 400 reseponse if roomAssignment is not object
             */
            it("should return 400 when roomAssignment is not a object", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment = 123;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment should be object'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.codersPerRoom NaN
             */
            it("should return 400 when roomAssignment.codersPerRoom not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.codersPerRoom = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.codersPerRoom should be number.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.codersPerRoom is negative
             */
            it("should return 400 when roomAssignment.codersPerRoom is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.codersPerRoom = -1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.codersPerRoom should be non-negative.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.codersPerRoom is not integer
             */
            it("should return 400 when roomAssignment.codersPerRoom is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.codersPerRoom = 1.1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.codersPerRoom should be Integer.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.type NaN
             */
            it("should return 400 when roomAssignment.type not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.type = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.type should be number.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.type too big
             */
            it("should return 400 when roomAssignment.type not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.type = 12345678901234;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.type should be less or equal to 2147483647.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.type is negative
             */
            it("should return 400 when roomAssignment.type is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.type = -1;
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.type should be positive.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.isByDivision is not a boolean
             */
            it("should return 400 when roomAssignment.isByDivision is not a boolean", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.isByDivision = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.isByDivision should be 0, 1, true or false.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.isByRegion is not a boolean
             */
            it("should return 400 when roomAssignment.isByRegion is not a boolean", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.isByRegion = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.isByRegion should be 0, 1, true or false.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.isFinal is not a boolean
             */
            it("should return 400 when roomAssignment.isFinal is not a boolean", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.isFinal = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.isFinal should be 0, 1, true or false.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.p NaN
             */
            it("should return 400 when roomAssignment.p not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.p = 'abc';
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.p should be number.'
                }, done);
            });


            /**
             * Check 400 response if name is not a string
             */
            it("should return 400 when name is not a string", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.name = {};
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'name should be string.'
                }, done);
            });


            /**
             * Check 400 response if status is not a string
             */
            it("should return 400 when status is not a string", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.status = {};
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'status should be string.'
                }, done);
            });


            /**
             * Check 400 response if short_name is not a string
             */
            it("should return 400 when short_name is not a string", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.short_name = {};
                assertFail({
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'short_name should be string.'
                }, done);
            });


        });

        describe('Valid Request', function () {
            /**
             * This function is run before all tests.
             * Generate tests data.
             * @param {Function<err>} done the callback
             */
            before(function (done) {
                async.waterfall([
                    function (cb) {
                        clearDb(cb);
                    }, function (cb) {
                        testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_rounds", "informixoltp", cb);
                    }
                ], done);
            });
            /**
             * Create a round for a contest and list it.
             */
            it('should create new round for contest', function (done) {
                async.series([
                    validateResult.bind(undefined, 30003, 'contest30003.json'),
                    function (cb) {
                        var round = requestClone(newRound);
                        round.contest_id = newRound.contest.id;
                        assert200(round, cb);
                    },
                    validateResult.bind(undefined, 30003, 'contest30003_create.json')
                ], done);
            });

            /**
             * create different round type to cover different room creation.
             */
            _.each(typeList, function (typeid) {
                it('should be able to create round type ' + typeid, function (done) {
                    var request = _.clone(goodRequest);
                    request.contest_id = 30004;
                    request.id = 40020 + typeid;
                    request.type.id = typeid;
                    assert200(request, done);
                });
            });

            it('check room for MODERATED_CHAT_ROUND_TYPE', function (done) {
                var request = _.clone(goodRequest);
                request.contest_id = 30004;
                request.id = 41120;
                request.type.id = MODERATED_CHAT_ROUND_TYPE_ID;
                async.waterfall([
                    function (cb) {
                        assert200(request, cb);
                    },
                    function (cb) {
                        testHelper.runSqlSelectQuery(
                            GET_ROOM_FROM_ROUND + request.id,
                            'informixoltp',
                            cb
                        );
                    },
                    function (result, cb) {
                        assert.equal(result.length, 1, 'create one room');
                        assert.equal(result[0].room_type_id, MODERATED_CHAT_ROOM_TYPE_ID, 'moderated room type');
                        cb();
                    }
                ], done);
            });

            it('check room for practice round', function (done) {
                var request = _.clone(goodRequest);
                request.contest_id = 30004;
                request.id = 41121;
                request.type.id = PRACTICE_ROUND_TYPE_ID;
                async.waterfall([
                    function (cb) {

                        assert200(request, cb);
                    },
                    function (cb) {
                        testHelper.runSqlSelectQuery(
                            GET_ROOM_FROM_ROUND + request.id,
                            'informixoltp',
                            cb
                        );
                    },
                    function (result, cb) {
                        assert.equal(result.length, 1, 'create one room');
                        assert.equal(result[0].room_type_id, PRACTICE_ROOM_TYPE_ID, 'practice room type');
                        cb();
                    }
                ], done);
            });

            it('check room for normal round', function (done) {
                var request = _.clone(goodRequest);
                request.contest_id = 30004;
                request.id = 41122;
                request.type.id = SINGLE_ROUND_TYPE;
                async.waterfall([
                    function (cb) {
                        assert200(request, cb);
                    },
                    function (cb) {
                        testHelper.runSqlSelectQuery(
                            GET_ROOM_FROM_ROUND + request.id,
                            'informixoltp',
                            cb
                        );
                    },
                    function (result, cb) {
                        assert.equal(result.length, 1, 'create one room');
                        assert.equal(result[0].room_type_id, ADMIN_ROOM_TYPE_ID, 'admin room type');
                        cb();
                    }
                ], done);
            });

            it('check room for long round', function (done) {
                var request = _.clone(goodRequest);
                request.contest_id = 30004;
                request.id = 41123;
                request.type.id = LONG_ROUND_TYPE_ID;
                async.waterfall([
                    function (cb) {
                        assert200(request, cb);
                    },
                    function (cb) {
                        testHelper.runSqlSelectQuery(
                            GET_ROOM_FROM_ROUND + request.id,
                            'informixoltp',
                            cb
                        );
                    },
                    function (result, cb) {
                        assert.equal(result.length, 2, 'create two room');
                        assert.equal(result[0].room_type_id, ADMIN_ROOM_TYPE_ID, 'admin room type');
                        assert.equal(result[1].name, "Room 1", 'div1 room');
                        cb();
                    }
                ], done);
            });

            /**
             * create round with duplicate round id should failed
             */
            it('should fail when create two round with same id', function (done) {
                var request = _.clone(goodRequest);
                request.contest_id = 30005;
                request.id = 40015;
                async.series([
                    assert200.bind(undefined, request),
                    createPostRequest.bind(undefined, 500, request)
                ], done);
            });
        });


    });


    describe("Modify SRM Contest Round", function () {

        /**
         * create a http request with auth header and test it.
         * @param {integer} oldRoundId - the old round id.
         * @param {Number} expectStatus - the expected response status code.
         * @param {Object} postData - the data post to api.
         * @param {Function} cb - the call back function.
         */
        function createPostRequest(oldRoundId, expectStatus, postData, cb) {
            var req = request(API_ENDPOINT)
                    .post('/v2/data/srm/rounds/' + oldRoundId + '/edit')
                    .set('Accept', 'application/json')
                    .set('Content-Type', 'application/json')
                    .set('Authorization', 'Bearer ' + testHelper.getAdminJwt())
                    .expect('Content-Type', /json/);
            req.expect(expectStatus)
                .send(postData)
                .end(cb);
        }

        /**
         * Create request to modify round API and assert status code and error message.
         * @param {object} params - params to configure
         * @param {Function} done - the callback function
         */
        function assertFail(params, done) {
            var req = request(API_ENDPOINT)
                    .post('/v2/data/srm/rounds/' + params.oldRoundId + '/edit')
                    .set('Accept', 'application/json')
                    .set('Content-Type', 'application/json')
                    .expect('Content-Type', /json/);
            if (params.auth) {
                req.set('Authorization', 'Bearer ' + params.auth);
            }
            req.expect(params.status)
                .send(params.json)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                    } else {
                        assert.equal(res.body.error.details, params.message);
                        done();
                    }
                });
        }

        /**
         * Helper method for validating result for current test data
         * @param {int} contestId - the contest id
         * @param {String} expectFile - the filename of expected json.
         * @param {Function} done - the callback function
         */
        function validateResult(contestId, expectFile, done) {
            request(API_ENDPOINT)
                .get('/v2/data/srm/rounds/' + contestId)
                .set('Accept', 'application/json')
                .set('Authorization', 'Bearer ' + testHelper.getAdminJwt())
                .expect('Content-Type', /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        done(err);
                        return;
                    }
                    var results = res.body,
                        expected = require("./test_files/srmRoundManagement/" + expectFile);
                    delete results.serverInformation;
                    delete results.requesterInformation;
                    assert.deepEqual(results, expected, "unexpected response");
                    done();
                });
        }

        /**
         * Helper method to do deep clone for request.
         * @param {Object} request request to be cloned
         * @return {Object} cloned request
         */
        function requestClone(request) {
            var result = _.clone(request);
            result.type = _.clone(request.type);
            result.region = _.clone(request.region);
            result.roomAssignment = _.clone(request.roomAssignment);
            return result;
        }

        var goodRequest = require('./test_files/srmRoundManagement/good_request.json');

        describe('Invalid Request', function () {

            it('should 401 if anonymous', function (done) {
                var rrequest = requestClone(goodRequest);
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    status: 401,
                    message: 'You need to be authorized first.'
                }, done);
            });

            it('should 403 if member', function (done) {
                var rrequest = requestClone(goodRequest);
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getMemberJwt(),
                    status: 403,
                    message: 'You are forbidden for this API.'
                }, done);
            });

            it("should return 400 when oldRoundId not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                assertFail({
                    oldRoundId: 'abc',
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'oldRoundId should be number.'
                }, done);
            });

            it("should return 400 when oldRoundId is too big", function (done) {
                var rrequest = requestClone(goodRequest);
                assertFail({
                    oldRoundId: 1234567890123456,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'oldRoundId should be less or equal to 2147483647.'
                }, done);
            });

            it("should return 400 when oldRoundId is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                assertFail({
                    oldRoundId: -1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'oldRoundId should be positive.'
                }, done);
            });

            it("should return 400 when oldRoundId is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                assertFail({
                    oldRoundId: 1.1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'oldRoundId should be Integer.'
                }, done);
            });

            /**
             * Check 400 response if contest_id NaN
             */
            it("should return 400 when contest_id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.contest_id = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'contest_id should be number.'
                }, done);
            });


            /**
             * Check 400 response if contest_id too big
             */
            it("should return 400 when contest_id is too big", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.contest_id = 12345678901234;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'contest_id should be less or equal to 2147483647.'
                }, done);
            });


            /**
             * Check 400 response if contest_id is negative
             */
            it("should return 400 when contest_id is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.contest_id = -1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'contest_id should be positive.'
                }, done);
            });


            /**
             * Check 400 response if contest_id is not integer
             */
            it("should return 400 when contest_id is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.contest_id = 1.1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'contest_id should be Integer.'
                }, done);
            });


            /**
             * Check 400 response if id NaN
             */
            it("should return 400 when id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.id = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'id should be number.'
                }, done);
            });


            /**
             * Check 400 response if id too big
             */
            it("should return 400 when id is too big", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.id = 12345678901234;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'id should be less or equal to 2147483647.'
                }, done);
            });


            /**
             * Check 400 response if id is negative
             */
            it("should return 400 when id is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.id = -1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'id should be positive.'
                }, done);
            });


            /**
             * Check 400 response if id is not integer
             */
            it("should return 400 when id is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.id = 1.1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'id should be Integer.'
                }, done);
            });


            /**
             * Check 400 reseponse if type is not object
             */
            it("should return 400 when type is not a object", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.type = 123;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'type should be object'
                }, done);
            });


            /**
             * Check 400 response if type.id NaN
             */
            it("should return 400 when type.id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.type.id = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'type.id should be number.'
                }, done);
            });


            /**
             * Check 400 response if type.id too big
             */
            it("should return 400 when type.id is too big", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.type.id = 12345678901234;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'type.id should be less or equal to 2147483647.'
                }, done);
            });


            /**
             * Check 400 response if type.id is negative
             */
            it("should return 400 when type.id is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.type.id = -1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'type.id should be positive.'
                }, done);
            });


            /**
             * Check 400 response if type.id is not integer
             */
            it("should return 400 when type.id is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.type.id = 1.1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'type.id should be Integer.'
                }, done);
            });


            /**
             * Check 400 response if invitationalType NaN
             */
            it("should return 400 when invitationalType not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.invitationalType = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'invitationalType should be number.'
                }, done);
            });


            /**
             * Check 400 response if invitationalType is negative
             */
            it("should return 400 when invitationalType is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.invitationalType = -1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'invitationalType should be non-negative.'
                }, done);
            });


            /**
             * Check 400 response if invitationalType is not integer
             */
            it("should return 400 when invitationalType is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.invitationalType = 1.1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'invitationalType should be Integer.'
                }, done);
            });


            /**
             * Check 400 reseponse if region is not object
             */
            it("should return 400 when region is not a object", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.region = 123;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'region should be object'
                }, done);
            });


            /**
             * Check 400 response if region.region_id NaN
             */
            it("should return 400 when region.region_id not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.region.region_id = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'region.region_id should be number.'
                }, done);
            });


            /**
             * Check 400 response if region.region_id too big
             */
            it("should return 400 when region.region_id is too big", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.region.region_id = 12345678901234;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'region.region_id should be less or equal to 2147483647.'
                }, done);
            });


            /**
             * Check 400 response if region.region_id is negative
             */
            it("should return 400 when region.region_id is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.region.region_id = -1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'region.region_id should be positive.'
                }, done);
            });


            /**
             * Check 400 response if region.region_id is not integer
             */
            it("should return 400 when region.region_id is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.region.region_id = 1.1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'region.region_id should be Integer.'
                }, done);
            });


            /**
             * Check 400 response if registrationLimit NaN
             */
            it("should return 400 when registrationLimit not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.registrationLimit = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'registrationLimit should be number.'
                }, done);
            });


            /**
             * Check 400 response if registrationLimit is negative
             */
            it("should return 400 when registrationLimit is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.registrationLimit = -1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'registrationLimit should be non-negative.'
                }, done);
            });


            /**
             * Check 400 response if registrationLimit is not integer
             */
            it("should return 400 when registrationLimit is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.registrationLimit = 1.1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'registrationLimit should be Integer.'
                }, done);
            });


            /**
             * Check 400 reseponse if roomAssignment is not object
             */
            it("should return 400 when roomAssignment is not a object", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment = 123;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment should be object'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.codersPerRoom NaN
             */
            it("should return 400 when roomAssignment.codersPerRoom not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.codersPerRoom = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.codersPerRoom should be number.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.codersPerRoom is negative
             */
            it("should return 400 when roomAssignment.codersPerRoom is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.codersPerRoom = -1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.codersPerRoom should be non-negative.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.codersPerRoom is not integer
             */
            it("should return 400 when roomAssignment.codersPerRoom is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.codersPerRoom = 1.1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.codersPerRoom should be Integer.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.type NaN
             */
            it("should return 400 when roomAssignment.type not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.type = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.type should be number.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.type too big
             */
            it("should return 400 when roomAssignment.type is too big", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.type = 12345678901234;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.type should be less or equal to 2147483647.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.type is negative
             */
            it("should return 400 when roomAssignment.type is negative", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.type = -1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.type should be positive.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.type is not integer
             */
            it("should return 400 when roomAssignment.type is not integer", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.type = 1.1;
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.type should be Integer.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.isByDivision is not a boolean
             */
            it("should return 400 when roomAssignment.isByDivision is not a boolean", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.isByDivision = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.isByDivision should be 0, 1, true or false.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.isByRegion is not a boolean
             */
            it("should return 400 when roomAssignment.isByRegion is not a boolean", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.isByRegion = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.isByRegion should be 0, 1, true or false.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.isFinal is not a boolean
             */
            it("should return 400 when roomAssignment.isFinal is not a boolean", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.isFinal = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.isFinal should be 0, 1, true or false.'
                }, done);
            });


            /**
             * Check 400 response if roomAssignment.p NaN
             */
            it("should return 400 when roomAssignment.p not a number", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.roomAssignment.p = 'abc';
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'roomAssignment.p should be number.'
                }, done);
            });


            /**
             * Check 400 response if name is not a string
             */
            it("should return 400 when name is not a string", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.name = {};
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'name should be string.'
                }, done);
            });


            /**
             * Check 400 response if status is not a string
             */
            it("should return 400 when status is not a string", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.status = {};
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'status should be string.'
                }, done);
            });


            /**
             * Check 400 response if short_name is not a string
             */
            it("should return 400 when short_name is not a string", function (done) {
                var rrequest = requestClone(goodRequest);
                rrequest.short_name = {};
                assertFail({
                    oldRoundId: 1,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 400,
                    message: 'short_name should be string.'
                }, done);
            });
        });

        describe('Valid Request', function () {
            /**
             * This function is run before all tests.
             * Generate tests data.
             * @param {Function<err>} done the callback
             */
            before(function (done) {
                async.waterfall([
                    function (cb) {
                        clearDb(cb);
                    }, function (cb) {
                        testHelper.runSqlFile(SQL_DIR + "informixoltp__insert_rounds", "informixoltp", cb);
                    }
                ], done);
            });

            it("should return 404 when modifying round does not exist", function (done) {
                var rrequest = requestClone(goodRequest);
                assertFail({
                    oldRoundId: 600000,
                    json: rrequest,
                    auth: testHelper.getAdminJwt(),
                    status: 404,
                    message: 'modifying round is not existed.'
                }, done);
            });

            it('should modify to same round id', function (done) {
                var round = {
                    contest_id: 30007,
                    id: 40055,
                    type: {id: 19},
                    invitationalType: 12,
                    region: {region_id: 2},
                    registrationLimit: 2222,
                    roomAssignment: {
                        codersPerRoom: 150,
                        type: 3,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 1000.1
                    },
                    name: 'modified round',
                    status: 'F',
                    short_name: 'modified short name'
                },
                    fields,
                    touchingFields = ['invitational', 'region_id', 'registration_limit', 'round_type_id',
                                      'short_name', 'round_id', 'contest_id', 'status'];
                async.waterfall([
                    function (cb) {
                        testHelper.runSqlSelectQuery(
                            ALL_OTHER_FIELD + round.id + ";",
                            "informixoltp",
                            cb
                        );
                    },
                    function (result, cb) {
                        fields = _.map(result, function (x) { return _.omit(x, touchingFields); });
                        cb();
                    },
                    createPostRequest.bind(undefined, round.id, 200, round),
                    function (res, cb) {
                        assert.equal(res.body.message, 'ok');
                        validateResult(round.contest_id, 'contest' + round.contest_id + '.json', cb);
                    },
                    // check if the origin contest still got the round.
                    validateResult.bind(undefined, 30006, 'empty.json'),
                    // check db
                    function (cb) {
                        testHelper.runSqlSelectQuery(
                            ALL_OTHER_FIELD + round.id + ";",
                            "informixoltp",
                            cb
                        );
                    },
                    function (result, cb) {
                        result = _.map(result, function (x) { return _.omit(x, touchingFields); });
                        assert.deepEqual(result, fields, 'afterward should be the same as before');
                        cb();
                    }
                ], done);
            });

            it('should modify to different round id', function (done) {
                var round = {
                    contest_id: 30008,
                    id: 40065,
                    type: {id: 19},
                    invitationalType: 12,
                    region: {region_id: 2},
                    registrationLimit: 2222,
                    roomAssignment: {
                        codersPerRoom: 150,
                        type: 3,
                        isByDivision: 0,
                        isByRegion: 0,
                        isFinal: 0,
                        p: 1000.1
                    },
                    name: 'modified round',
                    status: 'F',
                    short_name: 'modified short name'
                },
                    fields,
                    touchingFields = ['invitational', 'region_id', 'registration_limit', 'round_type_id',
                                      'short_name', 'round_id', 'contest_id', 'status'];


                async.waterfall([
                    function (cb) {
                        testHelper.runSqlSelectQuery(
                            ALL_OTHER_FIELD + 40060 + ";",
                            "informixoltp",
                            cb
                        );
                    },
                    function (result, cb) {
                        fields = _.map(result, function (x) { return _.omit(x, touchingFields); });
                        cb();
                    },
                    createPostRequest.bind(undefined, 40060, 200, round),
                    function (res, cb) {
                        assert.equal(res.body.message, 'ok');
                        validateResult(round.contest_id, 'contest' + round.contest_id + '.json', cb);
                    },
                    // check if the origin contest still got the round.
                    validateResult.bind(undefined, 30009, 'empty.json'),
                    // check db
                    function (cb) {
                        testHelper.runSqlSelectQuery(
                            ALL_OTHER_FIELD + round.id + ";",
                            "informixoltp",
                            cb
                        );
                    },
                    function (result, cb) {
                        result = _.map(result, function (x) { return _.omit(x, touchingFields); });
                        assert.deepEqual(result, fields, 'afterward should be the same as before');
                        cb();
                    }
                ], done);
            });
        });

    });
});
