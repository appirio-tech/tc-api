/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";
var assert = require('chai').assert;
var async = require('async');
/*global describe, it, before, beforeEach, after, afterEach */
/*jslint node: true, stupid: true */

describe('Test parameterizeQuery', function () {
    var api;

    beforeEach(function (done) {
        api = {
            log: function () {
                return null;
            }
        };
        async.series([
            function (cb) {
                require('../initializers/helper').helper(api, cb);
            }, function (cb) {
                require('../initializers/dataAccess').dataAccess(api, cb);
            }, function (cb) {
                api.dataAccess._start(api, cb);
            }
        ], done);
    });

    it('should parametrize query#1', function (done) {
        var query = "select * from table where a = @a@",
            params = { a: 1 },
            expected = "select * from table where a = 1";

        api.dataAccess._parameterizeQuery(query, params, function (err, q) {
            assert.ifError(err);
            assert.equal(expected, q);
            done();
        });
    });

    it('should parametrize query#2', function (done) {
        var query = "select * from table where a = @a@ and b = @b@ and c = @a@",
            params = { a: 1, b: 2 },
            expected = "select * from table where a = 1 and b = 2 and c = 1";

        api.dataAccess._parameterizeQuery(query, params, function (err, q) {
            assert.ifError(err);
            assert.equal(expected, q);
            done();
        });
    });


    it('should parametrize query#3 (missing parameter)', function (done) {
        var query = "select * from table where a = @a@ and b = @b@ and c = @c@",
            params = { a: 1, b: 2 },
            expected = "select * from table where a = 1 and b = 2 and c = ";

        api.dataAccess._parameterizeQuery(query, params, function (err, q) {
            assert.ifError(err);
            assert.equal(expected, q);
            done();
        });
    });

    it('should parametrize query (sql injection)', function (done) {
        var query = "select * from table where a LIKE '@a@'",
            params = { a: "'sql injection" },
            expected = "select * from table where a LIKE '''sql injection'";

        api.dataAccess._parameterizeQuery(query, params, function (err, q) {
            assert.ifError(err);
            assert.equal(expected, q);
            done();
        });
    });

});