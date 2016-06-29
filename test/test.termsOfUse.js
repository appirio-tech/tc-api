/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.3
 * @author TCSASSEMBLER, muzehyun
 *
 * changes in 1.1:
 * add test for agree terms of use api
 *
 * changes in 1.2:
 * add tests for retrieving docusign template id
 * 
 * changes in 1.3
 * add tests for getting terms details for an user
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");
var _ = require("underscore");

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/termsOfUse/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = require('../config/tc-config').tcConfig.oauthClientId;
var SECRET = require('../config/tc-config').tcConfig.oauthClientSecret;
var jwt = require('jsonwebtoken');

describe('Terms Of Use API', function () {
    this.timeout(120000); // The api with testing remote db could be quit slow

    describe('Get Terms Of Use API', function () {

        /**
         * Users that we have setup.
         */
        var user11 = 'facebook|fb400011',
            user12 = 'facebook|fb400012',
            user13 = 'facebook|fb400013',
            user14 = 'facebook|fb400014',
            user18 = 'facebook|fb400018';

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
                .get(url)
                .set('Accept', 'application/json')
                .set('Authorization', testHelper.generateAuthHeader({ sub: user }))
                .expect('Content-Type', /json/)
                .expect(expectedStatusCode);
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
         * Makes call to API and checks response content.
         * @param {String} url - the url to call.
         * @param {String} user - the user.
         * @param {String} name - the expected file name.
         * @param {Function} cb - the call back function.
         */
        function checkAPI(url, user, name, cb) {
            request(API_ENDPOINT)
                .get(url)
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .set('Authorization', testHelper.generateAuthHeader({ sub: user }))
                .expect(200)
                .end(function (err, res) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    var body = res.body, expected = require('./test_files/' + name + '.json');
                    delete body.serverInformation;
                    delete body.requesterInformation;
                    assert.deepEqual(body, expected);
                    cb();
                });
        }

        /**
         * Test /v2/terms/:challengeId but user is not logged-in
         * should return 401 error
         */
        it('should return 401 error', function (done) {
            request(API_ENDPOINT)
                .get('/v2/terms/40000001')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(401, done);
        });

        /**
         * Test /v2/terms/detail/:termId but user is not logged-in
         * should return 401 error
         */
        it('should return 401 error', function (done) {
            request(API_ENDPOINT)
                .get('/v2/terms/detail/4001')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(401, done);
        });

        /**
         * Test /v2/terms/:challengeId where challengeId is non existent
         * should return 404 error
         */
        it('should return 404 error', function (done) {
            getRequest('/v2/terms/40000099', user11, 404).end(function (err) {
                done(err);
            });
        });

        /**
         * Test /v2/terms/detail/:termId where termId is non existent
         * should return 404 error
         */
        it('should return 404 error', function (done) {
            getRequest('/v2/terms/detail/99099', user11, 404).end(function (err) {
                done(err);
            });
        });

        /**
         * Test /v2/terms/:challengeId where challenge registration is not open
         * should return 403 error
         */
        it('should return 403 error because registration not open', function (done) {
            var req = getRequest('/v2/terms/40000002', user11, 403);
            req.end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "Registration Phase of this challenge is not open.");
                done();
            });
        });

        /**
         * Test /v2/terms/:challengeId where challenge registration is open but user fb400012 is already registered
         * should return 403 error
         */
        it('should return 403 error because user already registered for challenge', function (done) {
            var req = getRequest('/v2/terms/40000003', user12, 403);
            req.end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "You are already registered for this challenge.");
                done();
            });
        });

        /**
         * Test /v2/terms/:challengeId where user fb400012 is suspended
         * should return 403 error
         */
        it('should return 403 error because user is suspended', function (done) {
            var req = getRequest('/v2/terms/40000001', user13, 403);
            req.end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "You cannot participate in this challenge due to suspension.");
                done();
            });
        });

        /**
         * Test /v2/terms/:challengeId where user's country is banned.
         * should return 403 error
         */
        it('should return 403 error because user country is banned', function (done) {
            var req = getRequest('/v2/terms/40000001', user14, 403);
            req.end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "You cannot participate in this challenge as your country is banned.");
                done();
            });
        });

        /**
         * Test /v2/terms/:challengeId where challenge is only meant for a group and user does not belong to that group.
         * should return 403 error
         */
        it('should return 403 error because challenge is only meant for a group and user does not belong to that group', function (done) {
            var req = getRequest('/v2/terms/40000004', user12, 403);
            req.end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "You are not part of the groups eligible for this challenge.");
                done();
            });
        });

        /**
         * Test /v2/terms/:challengeId where user is not in copilot pool
         * should return 403 error
         */
        it('should return 403 error because user not in copilot pool for copilot challenge', function (done) {
            var req = getRequest('/v2/terms/40000005', user12, 403);
            req.end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "You cannot participate in this challenge because you are not an active member of the copilot pool.");
                done();
            });
        });

        /**
         * Test /v2/terms/:challengeId for success
         * should return the terms for the challenge
         * It also shows that user11 has agreed to 2 terms
         */
        it('should return the terms for the challenge for user11', function (done) {
            checkAPI('/v2/terms/40000001', user11, 'expected_terms_for_challenge_40000001_user11', done);
        });

        /**
         * Test /v2/terms/:challengeId for success
         * should return the terms for the challenge with template id
         */
        it('should return the terms for the challenge for user18 with template id', function (done) {
            checkAPI('/v2/terms/40000015', user18, 'expected_terms_for_challenge_40000015_user18', done);
        });

        /**
         * Test /v2/terms/:challengeId for error
         * should return 404 for the challenge with no template id
         */
        it('should return 404 when template id is not exisiting', function (done) {
            getRequest('/v2/terms/40000016', user18, 404).end(function (err) {
                done(err);
            });
        });

        /**
         * Test /v2/terms/:challengeId for success
         * should return the terms for the challenge
         * It also shows that user12 has agreed to none of the terms
         */
        it('should return the terms for the challenge for user12', function (done) {
            checkAPI('/v2/terms/40000001', user12, 'expected_terms_for_challenge_40000001_user12', done);
        });

        /**
         * Test /v2/terms/:challengeId for success where role=Submitter
         * should return the terms for the challenge for Submitters
         */
        it('should return the terms for the challenge for submitters', function (done) {
            checkAPI('/v2/terms/40000001?role=Submitter', user12, 'expected_terms_for_challenge_40000001_role_Submitter', done);
        });

        /**
         * Test /v2/terms/:challengeId for success where role=Reviewer
         * should return the terms for the challenge for Reviewer
         */
        it('should return the terms for the challenge for reviewers', function (done) {
            checkAPI('/v2/terms/40000001?role=Reviewer', user12, 'expected_terms_for_challenge_40000001_role_Reviewer', done);
        });

        /**
         * Test /v2/terms/:challengeId for success where role=Client Manager
         * should return the terms for the challenge for Client Manager
         */
        it('should return the terms for the challenge for reviewers', function (done) {
            checkAPI('/v2/terms/40000001?role=Client%20Manager', user11, 'expected_terms_for_challenge_40000001_role_Client_Manager', done);
        });

        /**
         * Test /v2/terms/:challengeId where role is not known
         * should return 400 error
         */
        it('should return 400 error because role does not exist', function (done) {
            var req = getRequest('/v2/terms/40000001?role=NoSuchRole', user11, 400);
            req.end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "The role: NoSuchRole was not found.");
                done();
            });
        });

        /**
         * Test /v2/terms/detail/:termOfUseId for success
         * should return the terms of use for the given id
         */
        it('should return the terms of use for the given id', function (done) {
            checkAPI('/v2/terms/detail/20963', user11, 'expected_terms_detail_20963', done);
        });

        /**
         * Test /v2/terms/detail/:termOfUseId for success with docusign template id
         * should return the terms of use for the given id and the docusign tempalte id
         */
        it('should return the terms of use for the given id, which has docusign template', function (done) {
            checkAPI('/v2/terms/detail/21114', user11, 'expected_terms_detail_21114', done);
        });

        /**
         * Test /v2/terms/detail/:termOfUseId for failure with docusign template id
         * should return an error indicating the docusign template id is missing
         */
        it('should return error when docusign template id is missing', function (done) {
            var req = getRequest('/v2/terms/detail/21115', user11, 500);
            req.end(function (err, resp) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(resp.body.error.details, "Docusign template id is missing.");
                done();
            });
        });
    });

    describe('Get Terms Details For A User API', function () {
        var SQL_DIR = __dirname + '/sqls/termsForUser/',
            heffan = 'ad|132456',
            user = 'ad|132458',
            heffanAuthHeader = testHelper.generateAuthHeader({ sub: heffan }),
            userAuthHeader = testHelper.generateAuthHeader({ sub: user }),
            goodUser = '132458',
            badUser = '0',
            goodTerms = '40000001,40000002,40000003,40000004,40000005',
            badTerms = 'abra,cadabra';

        /**
         * Clear database
         * @param {Function<err>} done the callback
         */
        function clearDb(done) {
            testHelper.runSqlFile(SQL_DIR + 'common_oltp__clean', 'common_oltp', done);
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
         * Create request and return it
         * @param {String} userId - the id of the user to get data for
         * @param {String} termsOfUseIds - the comma separated list of terms of use ids
         * @param {String} authHeader - the Authorization header
         * @param {Number} statusCode - the expected status code
         * @return {Object} request
         */
        function createRequest(userId, termsOfUseIds, authHeader, statusCode) {
            var req = request(API_ENDPOINT)
                .get('/v2/terms/for/' + userId + '/' + termsOfUseIds)
                .set('Accept', 'application/json');
            if (authHeader) {
                req = req.set('Authorization', authHeader);
            }
            return req.expect('Content-Type', /json/).expect(statusCode);
        }

        /**
         * Assert error request
         * @param {String} userId - the id of the user to get data for
         * @param {String} termsOfUseIds - the comma separated list of terms of use ids
         * @param {String} authHeader - the Authorization header
         * @param {Number} statusCode - the expected status code
         * @param {String} errorDetail - the expected error detail
         * @param {Function} done the callback function
         */
        function assertError(userId, termsOfUseIds, authHeader, statusCode, errorDetail, done) {
            createRequest(userId, termsOfUseIds, authHeader, statusCode).end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(res.body.error.details, errorDetail, 'Invalid error detail');
                done();
            });
        }

        /**
         * Test the result returned by the correct query
         * @param {Object} err - the error
         * @param {Object} res - result returned by the request
         * @param {Function} done - the callback function
         */
        function checkGoodResult(err, res, done) {
            if (err) {
                done(err);
                return;
            }
            assert.property(res.body, 'terms', 'response should contain "terms"');
            assert.isArray(res.body.terms, 'terms should be an array');
            assert.equal(res.body.terms.length, 5, 'terms should contain 5 items');
            _.each(res.body.terms, function (item) {
                assert.property(item, 'agreed', 'each terms item should contain "agreed"');
                assert.property(item, 'termsOfUseId', 'each terms item should contain "termsOfUseId"');
                var shouldBeAgreed = item.termsOfUseId === 40000001 || item.termsOfUseId === 40000002;
                assert.equal(!!item.agreed, shouldBeAgreed,
                        'agreed should be true for 40000001 and 40000002, and only for them');
            });
            done();
        }


        it('should not allow unauthorized request', function (done) {
            assertError(goodUser, goodTerms, null, 401, 'Authentication credential was missing.', done);
        });

        it('should not let ordinary user get terms for another user', function (done) {
            assertError('132456', goodTerms, userAuthHeader, 403, 'This user cannot get these data of other users', done);
        });

        it('should return the correct result for the correct user and terms', function (done) {
            createRequest(goodUser, goodTerms, userAuthHeader, 200).end(function (err, res) {
                checkGoodResult(err, res, done);
            });
        });

        it('should allow an admin to get terms for another user', function (done) {
            createRequest(goodUser, goodTerms, heffanAuthHeader, 200).end(function (err, res) {
                checkGoodResult(err, res, done);
            });
        });

        it('should return error on invalid user id', function (done) {
            assertError(badUser, goodTerms, heffanAuthHeader, 400, 'User ID should be positive.', done);
        });

        it('should return error on invalid terms ids', function (done) {
            assertError(goodUser, badTerms, userAuthHeader, 400, 'Each Terms Of Use ID should be number.', done);
        });
    });

    describe('Agree Terms Of Use API', function () {
        var SQL_DIR = __dirname + '/sqls/agreeTermsOfUse/',
            heffan = "ad|132456",
            user = 'ad|132458',
            heffanAuthHeader = testHelper.generateAuthHeader({ sub: heffan }),
            userAuthHeader = testHelper.generateAuthHeader({ sub: user });

        /**
         * Clear database
         * @param {Function<err>} done the callback
         */
        function clearDb(done) {
            testHelper.runSqlFile(SQL_DIR + "common_oltp__clean", "common_oltp", done);
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
         * Create request and return it
         * @param {String} termsOfUseId - the terms of use id
         * @param {Number} statusCode - the expected status code
         * @param {String} authHeader - the Authorization header. Optional
         * @return {Object} request
         */
        function createRequest(termsOfUseId, statusCode, authHeader) {
            var req = request(API_ENDPOINT)
                .post("/v2/terms/" + termsOfUseId + "/agree")
                .set("Accept", "application/json");
            if (authHeader) {
                req = req.set("Authorization", authHeader);
            }
            return req.expect("Content-Type", /json/).expect(statusCode);
        }

        /**
         * Assert error request
         * @param {String} termsOfUseId - the terms of use id
         * @param {Number} statusCode - the expected status code
         * @param {String} authHeader - the Authorization header. Optional
         * @param {String} errorDetail - the error detail.
         * @param {Function} done the callback function
         */
        function assertError(termsOfUseId, statusCode, authHeader, errorDetail, done) {
            createRequest(termsOfUseId, statusCode, authHeader).end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                assert.equal(res.body.error.details, errorDetail, "Invalid error detail");
                done();
            });
        }

        /**
         * Test /v2/terms/30003/agree with user heffan.
         * user have agreed to this terms of use before, expect 400
         */
        it("should return error 400 when term have been agreed", function (done) {
            assertError("30003", 400, heffanAuthHeader, "You have agreed to this terms of use before.", done);
        });

        /**
         * Test /v2/terms/40000/agree with user heffan.
         * This terms doesn't exist, expect 404
         */
        it("should return error 404 when term with specific id doesn't exist", function (done) {
            assertError("40000", 404, heffanAuthHeader, "No such terms of use exists.", done);
        });

        /**
         * Test /v2/terms/30001/agree with user heffan.
         * This terms is not electronically agreeable, expect 400
         */
        it("should return error 400 when term is not electronically agreeable", function (done) {
            assertError("30001", 400, heffanAuthHeader, "The term is not electronically agreeable.", done);
        });

        /**
         * Test /v2/terms/30006/agree with user heffan.
         * This terms can't be agreed before agree the dependency terms, expect 400
         */
        it("should return error 400 when term can't be agreed before agree the dependency terms", function (done) {
            assertError("30006", 400, heffanAuthHeader, "You can't agree to this terms of use before you have agreed to all the dependencies terms of use.", done);
        });

        /**
         * Test /v2/terms/30005/agree with user heffan.
         * The user was banned to agree this terms, expect 403
         */
        it("should return error 403 when user was banned to agree this terms", function (done) {
            assertError("30005", 403, heffanAuthHeader, "Sorry, you can not agree to this terms of use.", done);
        });

        /**
         * Test /v2/terms/    /agree with user heffan.
         * The termsOfUseId is not a number, expect 400
         */
        it("should return error 400 when termsOfUseId is empty spaces", function (done) {
            assertError("    ", 400, heffanAuthHeader, "termsOfUseId should be positive.", done);
        });

        /**
         * Test /v2/terms/abc/agree with user heffan.
         * The termsOfUseId is not a number, expect 400
         */
        it("should return error 400 when termsOfUseId is not a number", function (done) {
            assertError("abc", 400, heffanAuthHeader, "termsOfUseId should be number.", done);
        });

        /**
         * Test /v2/terms/-1/agree with user heffan.
         * The termsOfUseId should be positive, expect 400
         */
        it("should return error 400 when termsOfUseId is not positive", function (done) {
            assertError("-1", 400, heffanAuthHeader, "termsOfUseId should be positive.", done);
        });

        /**
         * Test /v2/terms/1.23/agree with user heffan.
         * The termsOfUseId should be Integer, expect 400
         */
        it("should return error 400 when termsOfUseId is not an Integer", function (done) {
            assertError("1.23", 400, heffanAuthHeader, "termsOfUseId should be Integer.", done);
        });

        /**
         * Test /v2/terms/1111111111111111/agree with user heffan.
         * The termsOfUseId is too large, expect 400
         */
        it("should return error 400 when termsOfUseId is too large", function (done) {
            assertError("1111111111111111", 400, heffanAuthHeader, "termsOfUseId should be less or equal to 2147483647.", done);
        });

        /**
         * Test /v2/terms/30004/agree without user.
         * no user header, expect 401
         */
        it("should return error 401 when no user", function (done) {
            assertError("30004", 401, null, "Authentication credential was missing.", done);
        });

        /**
         * Test /v2/terms/30007/agree with user heffan.
         * agree terms of use successfully.
         */
        it("should return 200 when user 'heffan' agree terms 30007 successfully", function (done) {
            createRequest("30007", 200, heffanAuthHeader).end(function (err, res) {
                assert.ifError(err);
                assert.isTrue(res.body.success, "success should be true.");
                testHelper.runSqlFromJSON("/sqls/agreeTermsOfUse/select_heffan_terms_of_use_xref.json", true, function (err, result) {
                    if (!err) {
                        assert.isTrue(result.length > 0, "can't agree terms of use 30007");
                        done();
                    } else {
                        done(err);
                    }
                });
            });
        });

        /**
         * Test /v2/terms/30006/agree with user user.
         * agree terms of use successfully.
         */
        it("should return 200 when user 'user' agree terms 30006 successfully", function (done) {
            createRequest("30006", 200, userAuthHeader).end(function (err, res) {
                assert.ifError(err);
                assert.isTrue(res.body.success, "success should be true.");
                testHelper.runSqlFromJSON("/sqls/agreeTermsOfUse/select_user_terms_of_use_xref.json", true, function (err, result) {
                    if (!err) {
                        assert.isTrue(result.length > 0, "can't agree terms of use 30006");
                        done();
                    } else {
                        done(err);
                    }
                });
            });
        });
    });

});
