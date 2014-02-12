/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
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

var testHelper = require('./helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/termsOfUse/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';

/**
 * Objects and values required for generating the OAuth token
 */
var CLIENT_ID = require('../config').configData.general.oauthClientId;
var SECRET = require('../config').configData.general.oauthClientSecret;
var jwt = require('jsonwebtoken');

describe('Get Terms Of Use API', function () {

	/**
    * Users that we have setup.
    */
	var user11 = 'facebook|fb400011',
		user12 = 'facebook|fb400012',
		user13 = 'facebook|fb400013',
		user14 = 'facebook|fb400014',
		user15 = 'facebook|fb400015',
		user16 = 'facebook|fb400016',
		user17 = 'facebook|fb400017'; 


    /**
     * Return the authentication header to be used for the given user. 
     * @param {Object} user the user to authenticate
     */
	function getAuthHeader(user) {
		var authHeader = "Bearer " + jwt.sign({sub: user}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});	
		return authHeader;
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
        var req = request(API_ENDPOINT)
            .get(url)
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
        // clearDb(done);
		done();
    });

    /**
     * Makes call to API and checks response content.
     * @param {String} url - the url to call.
     * @param {String} name - the expected file name.
     * @param {Function} cb - the call back function.
     */
    var checkAPI = function (url, user, name, cb) {
        request(API_ENDPOINT)
            .get(url)
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
			.set('Authorization', getAuthHeader(user))
            .expect(200)
            .end(function (err, res) {
                if (err) {
                    cb(err);
                    return;
                }
                var body = res.body, expected = require('./test_files/' + name + '.json');
                delete body.serverInformation;
                delete body.requestorInformation;
                assert.deepEqual(body, expected);
                cb();
            });
    };

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
		var req = getRequest('/v2/terms/40000099', user11, 404);
		done();
    });

    /**
     * Test /v2/terms/detail/:termId where termId is non existent
     * should return 404 error
     */
    it('should return 404 error', function (done) {
		var req = getRequest('/v2/terms/detail/99099', user11, 404);
		done();
    });

    /**
     * Test /v2/terms/:challengeId where challenge registration is not open
     * should return 403 error
     */
    it('should return 403 error because registration not open', function (done) {
   		var req = getRequest('/v2/terms/40000002', user11, 403);
		req.end(function(err, resp) {
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
		req.end(function(err, resp) {
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
		req.end(function(err, resp) {
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
		req.end(function(err, resp) {
			if (err) {
				done(err);
				return;
			}			
			assert.equal(resp.body.error.details, "You cannot participate in this challenge as your country information is either missing or is banned.");
			done();
		}); 
    });

    /**
     * Test /v2/terms/:challengeId where user's country is missing.
     * should return 403 error
     */
    it('should return 403 error because user country is missing', function (done) {
   		var req = getRequest('/v2/terms/40000001', user17, 403);
		req.end(function(err, resp) {
			if (err) {
				done(err);
				return;
			}			
			assert.equal(resp.body.error.details, "You cannot participate in this challenge as your country information is either missing or is banned.");
			done();
		}); 
    });

    /**
     * Test /v2/terms/:challengeId where challenge is only meant for a group and user does not belong to that group.
     * should return 403 error
     */
    it('should return 403 error because challenge is only meant for a group and user does not belong to that group', function (done) {
   		var req = getRequest('/v2/terms/40000004', user12, 403);
		req.end(function(err, resp) {
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
		req.end(function(err, resp) {
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
		req.end(function(err, resp) {
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

});
