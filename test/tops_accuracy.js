/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author jpy
 */
"use strict";

var fs = require('fs');
var request = require('supertest');
var assert = require('chai').assert;

var API_ENDPOINT = 'http://localhost:8080';
var ACTION = '/v2/software/statistics/tops/';

describe('Get Tops API', function () {
    this.timeout(30000);

    describe('GET /software/statistics/tops/design', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'design?pageSize=10&pageIndex=1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/design', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'design?pageSize=50&pageIndex=2')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 50, "wrong default page size");
                assert.equal(pageIndex, 2, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/design', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'design?pageSize=50&pageIndex=-1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/development', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'development?pageSize=10&pageIndex=1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/conceptualization', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'conceptualization?pageSize=10&pageIndex=1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/specification', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'specification?pageSize=10&pageIndex=1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/architecture', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'architecture?pageSize=10&pageIndex=1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/assembly', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'assembly?pageSize=10&pageIndex=1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/test_suites', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'test_suites?pageSize=10&pageIndex=1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/test_scenarios', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'test_scenarios?pageSize=10&pageIndex=1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/ui_prototype', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'ui_prototype?pageSize=10&pageIndex=1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/content_creation', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'content_creation?pageSize=10&pageIndex=1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });

    describe('GET /software/statistics/tops/ria_build', function () {

        /// Check if the data are in expected struture and data
        it('should response with expected structure and data', function (done) {

            var r = request(API_ENDPOINT);
            r = r.get(ACTION + 'ria_build?pageSize=10&pageIndex=1')
                        .set('Accept', 'application/json');

            // should respond with JSON
            r.expect('Content-Type', /json/);

            // should respond with 200 status
            r.expect(200);
            
            // end request
            r.end(function(err, res) {
                var total = res.body['total'];
                var pageSize = res.body['pageSize'];
                var pageIndex = res.body['pageIndex'];
                assert.equal(total, 60, "wrong number of total");
                assert.equal(pageSize, 10, "wrong default page size");
                assert.equal(pageIndex, 1, "wrong default page index");

                var data = res.body['data'];
                // verify that the order of the list is correct
                for (var i = 0; i < data.length - 1; i++) {
                    assert.isTrue(data[i]['rank'] <= data[i + 1]['rank'], 'order is wrong');
                    assert.isTrue(data[i]['rating'] >= data[i + 1]['rating'], 'order is wrong');
                }
                for (var i = 0; i < data.length; i++) {
                    // verify each item that the fields are all included
                    assert.ok(data[i]['handle'], "invalid type");
                    assert.ok(data[i]['color'], "invalid contestName");
                }
                done();
            });
        });
    });


});
