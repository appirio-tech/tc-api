/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: pvmagacho
 */
"use strict";
/*global describe, it, before, beforeEach, after, afterEach */

/**
 * Module dependencies.
 */
var async = require("async");
var java = require('java');
var jdbc = require('informix-wrapper');
var assert = require('assert');
var clone = require('underscore').clone;

var startDate = new Date();

var log = function(msg, type){
    console.log(msg + ' (time elapsed = ' + (new Date().getTime() - startDate.getTime()) + 'ms)');
};

// Use this to point to the correct server.
var host = process.env.TC_DB_HOST;

var settings = {};

function executeQuery(db, sql, done) {
    log('\n\nQuery about to initiate', 'info');

    settings.database = db;

    var c = new jdbc(settings, log);
    c.on('error', function (err) {
        c.disconnect();
        done(err, null);
    }).initialize().connect(function (err) {
        if (err) {
            done(err, null);
        } else {
            // Run the query
            c.query(sql, function (err, result) {
                    if (err) {
                        log("Error while executing query: " + err + " " + (err.stack || ''), 'error');
                        done(err, null);
                    } else {
                        log('Done query', 'debug');
                        done(null, result);
                    }
                }, {
                    start: function (q) {
                        log('Start to execute ' + q, 'debug');
                    },
                    finish: function (f) {
                        c.disconnect();
                        log('Finish executing ' + f, 'debug');
                    }
                }).execute();
            }
    });

    log('End method\n\n');
}

describe("Informix JDDBC Library", function() {
    this.timeout(0);  // No timeout restriction

    after(function() {
        try {
            java.callStaticMethod('java.lang.System', 'exit', 0, function() {});
        } catch (e) {
            log('Error : ' + e);
        }
    });

    describe("Failure tests", function() {
        it("invalid host name", function(done) {
            settings = {
                "user" : "informix",
                "host" : "www.namedoesnotexist.com.xx",
                "port" : 2021,
                "password" : "1nf0rm1x",
                "database": "",
                "server" : "informixoltp_tcp",
                "minpool" : 0,
                "maxpool" : 20,
                "maxsize" : 0,
                "idleTimeout" : 3000,
                "timeout" : 3000
            };

            async.series([
                function(callback) {
                     executeQuery('corporate_oltp', 'select * from command_group_lu', function(err, result) {
                        callback(err, result);
                    });
                },
            ], function(err, count) {
                // The err should be null or undefined.
                assert.ok(err !== null, "There should be ERROR: ");
                done();
            });
        });

        /* TO BE FIXED The driver doesn't timeout in 3 seconds, instead, each test takes about more than 8 mins*/
        it("connection refused - no informix database in server", function(done) {
            settings = {
                "user" : "informix",
                "host" : "www.google.com",
                "port" : 2021,
                "password" : "1nf0rm1x",
                "database": "",
                "server" : "informixoltp_tcp",
                "minpool" : 0,
                "maxpool" : 20,
                "maxsize" : 0,
                "idleTimeout" : 3600,
                "timeout" : 3000
            };

            async.series([
                function(callback) {
                     executeQuery('corporate_oltp', 'select * from command_group_lu', function(err, result) {
                        callback(err, result);
                    });
                },
            ], function(err, count) {
                // The err should be null or undefined.
                assert.ok(err !== null, "There should be ERROR: ");
                done();
            });
        });

        it("connection refused - wrong port", function(done) {
            settings = {
                "user" : "informix",
                "host" : host,
                "port" : 3333,
                "password" : "1nf0rm1x",
                "database": "",
                "server" : "informixoltp_tcp",
                "minpool" : 0,
                "maxpool" : 20,
                "maxsize" : 0,
                "idleTimeout" : 3000,
                "timeout" : 3000
            };

            async.series([
                function(callback) {
                     executeQuery('corporate_oltp', 'select * from command_group_lu', function(err, result) {
                        callback(err, result);
                    });
                },
            ], function(err, count) {
                // The err should be null or undefined.
                assert.ok(err !== null, "There should be ERROR: ");
                done();
            });
        });

        it("connection refused - wrong server", function(done) {
            settings = {
                "user" : "informix",
                "host" : host,
                "port" : 2021,
                "password" : "1nf0rm1x",
                "database": "",
                "server" : "wrongserver",
                "minpool" : 0,
                "maxpool" : 20,
                "maxsize" : 0,
                "idleTimeout" : 3000,
                "timeout" : 3000
            };

            async.series([
                function(callback) {
                     executeQuery('corporate_oltp', 'select * from command_group_lu', function(err, result) {
                        callback(err, result);
                    });
                },
            ], function(err, count) {
                // The err should be null or undefined.
                assert.ok(err !== null, "There should be ERROR: ");
                done();
            });
        });
    });
});

