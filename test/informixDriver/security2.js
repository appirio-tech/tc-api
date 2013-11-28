/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";
var assert = require('chai').assert;
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true */


var setting = {
    "hostname": "informixoltp_tcp",
    "user": "informix",
    "password": "1nf0rm1x",
    "database": "common_dw",
};
var bindings = require("nodejs-db-informix");

describe('Security tests for informix driver', function() {
    this.timeout(30000);


    it('single quote should be escaped', function(done) {
        var connection = new bindings.Informix(setting);
        connection.connect(function(err) {
            assert.ifError(err);
            connection.query("", [{type: "String", value: "xxx'yyy" }], function(err, rows, col) {
                assert.ifError(err);
                assert.equal(0, rows.length);
                done();
            }, { async: true, cast: true })
                .select('* from rating_dim where color = ?')
                .execute();
        });
    });
    

    it('double quote should be escaped', function(done) {
        var connection = new bindings.Informix(setting);
        connection.connect(function(err) {
            assert.ifError(err);
            connection.query("", [{ type: "String", value: 'xxx"yyy' }], function(err, rows, col) {
                assert.ifError(err);
                assert.equal(0, rows.length);
                done();
            }, { async: true, cast: true })
                .select('* from rating_dim where color = ?')
                .execute();
        });
    });
    
    
    it('\\n should be escaped', function(done) {
        var connection = new bindings.Informix(setting);
        connection.connect(function(err) {
            assert.ifError(err);
            connection.query("", [{ type: "String", value: 'xxx\nyyy' }], function(err, rows, col) {
                assert.ifError(err);
                assert.equal(0, rows.length);
                done();
            }, { async: true, cast: true })
                .select('* from rating_dim where color = ?')
                .execute();
        });
    });
    
    it('\\r should be escaped', function(done) {
        var connection = new bindings.Informix(setting);
        connection.connect(function(err) {
            assert.ifError(err);
            connection.query("", [{ type: "String", value: 'xxx\ryyy' }], function(err, rows, col) {
                assert.ifError(err);
                assert.equal(0, rows.length);
                done();
            }, { async: true, cast: true })
                .select('* from rating_dim where color = ?')
                .execute();
        });
    });
    
    it('\\x00 should be escaped', function(done) {
        var connection = new bindings.Informix(setting);
        connection.connect(function(err) {
            assert.ifError(err);
            connection.query("", [{ type: "String", value: 'xxx\x00yyy' }], function(err, rows, col) {
                assert.ifError(err);
                assert.equal(0, rows.length);
                done();
            }, { async: true, cast: true })
                .select('* from rating_dim where color = ?')
                .execute();
        });
    });
    
    it('\\x1a should be escaped', function(done) {
        var connection = new bindings.Informix(setting);
        connection.connect(function(err) {
            assert.ifError(err);
            connection.query("", [{ type: "String", value: 'xxx\x1ayyy' }], function(err, rows, col) {
                assert.ifError(err);
                assert.equal(0, rows.length);
                done();
            }, { async: true, cast: true })
                .select('* from rating_dim where color = ?')
                .execute();
        });
    });
});