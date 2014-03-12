/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author muzehyun
 * @changes in 1.1
 * - Allowed anonymous user, fixed expected result
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach, __dirname */
/*jslint node: true, stupid: true, unparam: true */

/**
 * Module dependencies.
 */
var request = require('supertest');
var assert = require('chai').assert;
var expect = require('chai').expect;
var async = require('async');
var _ = require('underscore');
var testHelper = require('./helpers/testHelper');

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var SQL_DIR = __dirname + "/sqls/data/";

describe('', function () {
    this.timeout(60000); // The api with testing remote db could be quit slow
    var memberHeader;

    /**
     * Create authorization header before each test
     * @param {Function<err>} done the callback
     */
    beforeEach(function (done) {
        memberHeader = "Bearer " + testHelper.getMemberJwt();
        done();
    });

    /**
     * Create request and return it
     * @param {String} url the request url
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @return {Object} request
     */
    function createRequest(url, statusCode, authHeader) {
        var req = request(API_ENDPOINT)
            .get('/v2/data/' + url)
            .set('Accept', 'application/json');
        if (authHeader) {
            req = req.set('Authorization', authHeader);
        }
        return req.expect(statusCode);
    }

    /**
     * Make request and verify result
     * @param {String} url the request url
     * @param {String} authHeader the Authorization header. Optional
     * @param {Function<err>} done - the callback
     */
    function assertResponse(url, authHeader, key, expected, done) {
        createRequest(url, 200, authHeader)
            .end(function (err, result) {
                if (err) {
                    done(err);
                    return;
                }
                assert.ok(result.body);
                assert.ok(result.body.count);
                assert.equal(result.body.count, expected.length);
                assert.ok(result.body[key]);
                assert.deepEqual(result.body[key], expected);
                done();
            });
    }

    /**
     * Get response and assert response
     * @param {String} url the request url
     * @param {Number} statusCode the expected status code
     * @param {String} authHeader the Authorization header. Optional
     * @param {String} errorMessage the expected error message header. Optional
     * @param {Function<err>} done the callback
     */
    function assertErrorResponse(url, statusCode, authHeader, errorMessage, done) {
        createRequest(url, statusCode, authHeader)
            .end(function (err, res) {
                if (err) {
                    done(err);
                    return;
                }
                if (errorMessage) {
                    assert.ok(res.body);
                    assert.ok(res.body.error);
                    if (statusCode === 200) {
                        assert.equal(res.body.error, errorMessage);
                    } else {
                        assert.equal(res.body.error.details, errorMessage);
                    }
                }
                done();
            });
    }

    describe('Test Platforms API', function () {
        
        var expected = ["AWS",
                        "Beanstalk",
                        "Box",
                        "Brivo Labs",
                        "Cloud Foundry",
                        "CloudFactor",
                        "DocuSign",
                        "EC2",
                        "Facebook",
                        "FinancialForce",
                        "Force.com",
                        "Gaming",
                        "Google",
                        "HTML",
                        "Heroku",
                        "MESH01",
                        "Microsoft Azure",
                        "Mobile",
                        "NodeJS",
                        "Other",
                        "Salesforce.com",
                        "Smartsheet",
                        "Twilio",
                        "Wordpress",
                        "iOS"];

        /**
         * It should return 401 error for anonymouse user
         */
        it("should return 200 success for anonymouse user and valid platforms data", function (done) {
            assertResponse('platforms', null, 'platforms', expected, done);
        });

        /**
         * It should return 200 success for any user and valid platforms data
         */
        it("should return 200 success for any user and valid platforms data", function (done) {
            assertResponse('platforms', memberHeader, 'platforms', expected, done);
        });
    });

    describe('Test Technologies API', function () {
        
        var expected = [".NET",
                        ".NET 2.0",
                        ".NET 3.0",
                        ".NET 3.5",
                        ".NET System.Addins",
                        "ADO.NET",
                        "AJAX",
                        "ASP.NET",
                        "ASP.NET AJAX",
                        "ActionScript",
                        "Active Directory",
                        "Apache Derby",
                        "Applet",
                        "C",
                        "C#",
                        "C++",
                        "COM",
                        "COM+",
                        "CSS",
                        "Castor",
                        "ClickOnce",
                        "Custom Tag",
                        "Dojo",
                        "EJB",
                        "EJB 3",
                        "Eclipse Plugin",
                        "Flash",
                        "Flex",
                        "HTML",
                        "HTTP",
                        "Hibernate",
                        "IIS",
                        "J2EE",
                        "J2ME",
                        "JBoss Seam",
                        "JDBC",
                        "JFace",
                        "JMS",
                        "JPA",
                        "JSF",
                        "JSON",
                        "JSP",
                        "JUnit",
                        "Java",
                        "Java Application",
                        "JavaBean",
                        "JavaScript",
                        "LDAP",
                        "MIDP 2.0",
                        "MSMQ",
                        "Microsoft SilverLight",
                        "MySQL",
                        "Objective C",
                        "Oracle 10g",
                        "Oracle 9i",
                        "PHP",
                        "PostgreSQL",
                        "RMI",
                        "Remoting",
                        "Ruby",
                        "SQL Server 2000",
                        "SQL Server 2005",
                        "SWT",
                        "Servlet",
                        "Spring",
                        "Struts",
                        "Swing",
                        "VB",
                        "VB.NET",
                        "WPF",
                        "Web Services",
                        "WinForms Controls",
                        "Windows Communication Foundation",
                        "Windows Server 2003",
                        "Windows Workflow Foundation",
                        "XAML",
                        "XML",
                        "XSL",
                        "XUL"];

        /**
         * It should return 401 error for anonymouse user
         */
        it("should return 200 success for anonymouse user and valid technologies data", function (done) {
            assertResponse('technologies', null, 'technologies', expected, done);
        });

        /**
         * It should return 200 success for any user and valid technologies data
         */
        it("should return 200 success for any user and valid technologies data", function (done) {
            assertResponse('technologies', memberHeader, 'technologies', expected, done);
        });
    });
});
