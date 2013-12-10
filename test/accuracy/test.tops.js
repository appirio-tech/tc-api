/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author jpy, TCSASSEMBLER
 * change in 1.1:
 * - use before and after to setup and clean data
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true, unparam: true */

var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;
var async = require("async");

var testHelper = require('../helpers/testHelper');
var SQL_DIR = __dirname + "/sqls/tops/";
var API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8080';
var ACTION = '/v2/develop/statistics/tops/';

describe('Get Tops API', function () {
    this.timeout(30000);
    var total, pageSize, pageIndex, i, data, r;


    /**
     * Clear database
     * @param {Function<err>} done the callback
     */
    function clearDb(done) {
        async.waterfall([
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "topcoder_dw__clean", "topcoder_dw", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__clean", "tcs_dw", cb);
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
                var files = testHelper.generatePartPaths(SQL_DIR + "topcoder_dw__insert_test_data", "", 2);
                testHelper.runSqlFiles(files, "topcoder_dw", cb);
            },
            function (cb) {
                testHelper.runSqlFile(SQL_DIR + "tcs_dw__insert_test_data", "tcs_dw", cb);
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


    describe('GET /develop/statistics/tops/design', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'design?pageSize=10&pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/design', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'design?pageSize=50&pageIndex=2')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 2, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/design', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'design?pageSize=50&pageIndex=-1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/development', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'development?pageSize=10&pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/conceptualization', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'conceptualization?pageSize=10&pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/specification', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'specification?pageSize=10&pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/architecture', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'architecture?pageSize=10&pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/assembly', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'assembly?pageSize=10&pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/test_suites', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'test_suites?pageSize=10&pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/test_scenarios', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'test_scenarios?pageSize=10&pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/ui_prototype', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'ui_prototype?pageSize=10&pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/content_creation', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'content_creation?pageSize=10&pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /develop/statistics/tops/ria_build', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            r = request(API_ENDPOINT);
            r = r.get(ACTION + 'ria_build?pageSize=10&pageIndex=1')
                .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);

            // end request
            r.end(function (err, res) {
                total = res.body.total;
                pageSize = res.body.pageSize;
                pageIndex = res.body.pageIndex;
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                data = res.body.data;
                // verify that the order of the list is correct
                for (i = 0; i < data.length - 1; i = i + 1) {
                    assert.isTrue(data[i].rank <= data[i + 1].rank, 'order is wrong');
                    assert.isTrue(data[i].rating >= data[i + 1].rating, 'order is wrong');
                }
                for (i = 0; i < data.length; i = i + 1) {
                    // verify each item that the fields are all included
                    assert.ok(data[i].handle, "invalid type");
                    assert.ok(data[i].color, "invalid contestName");
                }
                done();
            });
        });
    });
});
