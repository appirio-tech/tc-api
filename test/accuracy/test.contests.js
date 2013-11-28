/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author jpy
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true, maxlen: 200 */

/**
 * Module dependencies.
 */
var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;

var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var TOTAL = 'total';
var ACTION = '/v2/design/challenges';
var DEVELOP_ACTION = '/v2/develop/challenges';

describe('Search Contests', function () {
    this.timeout(30000);     // The api with testing remote db could be quit slow
    var total, pageSize, pageIndex, i, data;

    describe('GET /v2/design/challenges?sortColumn=ContestName&sortOrder=asc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=ContestName&sortOrder=asc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].contestName.localeCompare(data[i + 1].contestName) <= 0, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=ContestName&sortOrder=desc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=ContestName&sortOrder=desc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].contestName.localeCompare(data[i + 1].contestName) >= 0, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=type&sortOrder=asc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=type&sortOrder=asc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].type.localeCompare(data[i + 1].type) <= 0, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=type&sortOrder=desc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=type&sortOrder=desc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].type.localeCompare(data[i + 1].type) >= 0, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=numberOfSubmissions&sortOrder=asc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=numberOfSubmissions&sortOrder=asc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].numberOfSubmissions <= data[i + 1].numberOfSubmissions, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=numberOfSubmissions&sortOrder=desc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=numberOfSubmissions&sortOrder=desc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].numberOfSubmissions >= data[i + 1].numberOfSubmissions, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=numberOfSubmissions&sortOrder=asc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=numberOfRatedRegistrants&sortOrder=asc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].numberOfRatedRegistrants <= data[i + 1].numberOfRatedRegistrants, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=numberOfRatedRegistrants&sortOrder=desc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=numberOfRatedRegistrants&sortOrder=desc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].numberOfRatedRegistrants >= data[i + 1].numberOfRatedRegistrants, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=numberOfUnratedRegistrants&sortOrder=asc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=numberOfUnratedRegistrants&sortOrder=asc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].numberOfUnratedRegistrants <= data[i + 1].numberOfUnratedRegistrants, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=numberOfUnratedRegistrants&sortOrder=desc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=numberOfUnratedRegistrants&sortOrder=desc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].numberOfUnratedRegistrants >= data[i + 1].numberOfUnratedRegistrants, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=registrationEndDate&sortOrder=asc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=registrationEndDate&sortOrder=asc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(new Date(data[i].registrationEndDate) <= new Date(data[i + 1].registrationEndDate), 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=registrationEndDate&sortOrder=desc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=registrationEndDate&sortOrder=desc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(new Date(data[i].registrationEndDate) >= new Date(data[i + 1].registrationEndDate), 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });
    describe('GET /v2/design/challenges?sortColumn=submissionEndDate&sortOrder=asc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=submissionEndDate&sortOrder=asc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(new Date(data[i].submissionEndDate) <= new Date(data[i + 1].submissionEndDate), 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=submissionEndDate&sortOrder=desc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=submissionEndDate&sortOrder=desc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(new Date(data[i].submissionEndDate) >= new Date(data[i + 1].submissionEndDate), 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=firstPrize&sortOrder=asc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=firstPrize&sortOrder=asc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].prize[0] <= data[i + 1].prize[0], 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=firstPrize&sortOrder=desc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=firstPrize&sortOrder=desc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].prize[0] >= data[i + 1].prize[0], 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=digitalRunPoints&sortOrder=asc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=digitalRunPoints&sortOrder=asc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].digitalRunPoints <= data[i + 1].digitalRunPoints, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=digitalRunPoints&sortOrder=desc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=digitalRunPoints&sortOrder=desc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].digitalRunPoints >= data[i + 1].digitalRunPoints, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=reliabilityBonus&sortOrder=asc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=reliabilityBonus&sortOrder=asc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].reliabilityBonus <= data[i + 1].reliabilityBonus, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=reliabilityBonus&sortOrder=desc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=reliabilityBonus&sortOrder=desc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].reliabilityBonus >= data[i + 1].reliabilityBonus, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });


    describe('GET /v2/design/challenges?sortColumn=contestId&sortOrder=asc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=contestId&sortOrder=asc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].contestId <= data[i + 1].contestId, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?sortColumn=contestId&sortOrder=desc', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?sortColumn=contestId&sortOrder=desc')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].contestId >= data[i + 1].contestId, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?pageSize=2&pageIndex=2', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?pageSize=2&pageIndex=2')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 2, "wrong default page size");
                assert.equal(pageIndex, 2, "wrong default page index");

                data = res.body.data;
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?pageSize=2&pageIndex=-1', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?pageSize=2&pageIndex=-1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");

                data = res.body.data;
                assert.equal(data.length, 6, "wrong result");
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].type, "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?type=Wireframes', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?type=Wireframes')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 2, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                assert.equal(data.length, 2, "wrong result");
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.equal(data[i].type, "Wireframes", "invalid type");
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });


    describe('GET /v2/design/challenges?submissionenddate.type=BEFORE&submissionenddate.firstDate=2013-09-01', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?submissionenddate.type=BEFORE&submissionenddate.firstDate=2013-09-01')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 1, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                assert.equal(data.length, 1, "wrong result");
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?submissionenddate.type=ON&submissionenddate.firstDate=2013-08-25', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?submissionenddate.type=ON&submissionenddate.firstDate=2013-08-25')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 1, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                assert.equal(data.length, 1, "wrong result");
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?submissionenddate.type=BETWEEN_DATES&submissionenddate.firstDate=2013-08-24&submissionenddate.secondDate=2013-08-26', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?submissionenddate.type=BETWEEN_DATES&submissionenddate.firstDate=2013-08-24&submissionenddate.secondDate=2013-08-26')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 1, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                assert.equal(data.length, 1, "wrong result");
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });



    describe('GET /v2/design/challenges?projectId=30010006', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?projectId=30010006')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 1, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                assert.equal(data.length, 1, "wrong result");
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });
    describe('GET /v2/design/challenges?listType=active', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?listType=active')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 6, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                assert.equal(data.length, 6, "wrong result");
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].description, "invalid description");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?listType=open', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?listType=open')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 15, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                assert.equal(data.length, 15, "wrong result");
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });

    describe('GET /v2/design/challenges?listType=past', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + '?listType=past')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body[TOTAL];
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 329, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                assert.equal(data.length, 50, "wrong result");
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].contestName, "invalid contestName");
                    assert.ok(data[i].numberOfSubmissions >= 0, "invalid numberOfSubmissions");
                    assert.ok(data[i].numberOfRatedRegistrants >= 0, "invalid numberOfRatedRegistrants");
                    assert.ok(data[i].numberOfUnratedRegistrants >= 0, "invalid numberOfUnratedRegistrants");
                    assert.ok(data[i].contestId, "invalid contestId");
                    assert.ok(data[i].projectId, "invalid projectId");
                    assert.ok(data[i].registrationEndDate, "invalid registrationEndDate");
                    assert.ok(data[i].submissionEndDate, "invalid submissionEndDate");
                    assert.ok(data[i].prize, "invalid prize");
                    assert.ok(data[i].reliabilityBonus, "invalid reliabilityBonus");
                    assert.ok(data[i].digitalRunPoints, "invalid digitalRunPoints");
                }
                done();
            });
        });
    });
});

describe('Get Contests Details', function () {
    var data;
    this.timeout(30000);     // The api with testing remote db could be quit slow

    describe('GET /v2/develop/challenges/30010361', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(DEVELOP_ACTION + '/30010361').set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                data = res.body;
                assert.equal(data.type, "Print/Presentation");
                assert.equal(data.contestName, "Client 30010001 Billing Account 2 Project 1 Print/Presentation Contest 361");
                assert.equal(data.description, "Contest Introduction for Client 30010001 Billing Account 2 Project 1 Print/Presentation Contest 361");
                assert.equal(data.numberOfSubmissions, 0);
                assert.equal(data.numberOfRegistrants, 20);
                assert.equal(data.numberOfPassedScreeningSubmissions, 0);
                assert.equal(data.contestId, 30010361);
                assert.equal(data.projectId, 30010004);
                assert.equal(data.milestonePrize, 87);
                assert.equal(data.milestoneNumber, 1);
                assert.equal(data.reliabilityBonus, 340);
                assert.equal(data.digitalRunPoints, 510);
                assert.equal(data.registrants.length, 20);
                done();
            });
        });
    });

    describe('GET /v2/develop/challenges/30010015', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(DEVELOP_ACTION + '/30010015').set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                data = res.body;
                assert.equal(data.type, "Application Front-End Design");
                assert.equal(data.contestName, "Client 30010001 Billing Account 1 Project 1 Application Front-End Design Contest 15");
                assert.equal(data.description, "Contest Introduction for Client 30010001 Billing Account 1 Project 1 Application Front-End Design Contest 15");
                assert.equal(data.numberOfSubmissions, 26);
                assert.equal(data.numberOfRegistrants, 19);
                assert.equal(data.numberOfPassedScreeningSubmissions, 12);
                assert.equal(data.contestId, 30010015);
                assert.equal(data.projectId, 30010001);
                assert.equal(data.milestonePrize, 53);
                assert.equal(data.milestoneNumber, 1);
                assert.equal(data.reliabilityBonus, 340);
                assert.equal(data.digitalRunPoints, 510);
                assert.equal(data.registrants.length, 19);
                done();
            });
        });
    });
});
