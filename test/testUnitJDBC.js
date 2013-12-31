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

function executeQuery(db, sql, done, params) {
    log('\n\nQuery about to initiate', 'info');

    var isWrite = false;

    settings.database = db;

    if (sql.trim().toLowerCase().indexOf('insert') === 0 ||
        sql.trim().toLowerCase().indexOf('update') === 0 ||
        sql.trim().toLowerCase().indexOf('delete') === 0) {
        isWrite = true;
    }

    var c = new jdbc(settings, log);
    c.on('error', function (err) {
        if (isWrite) {
            c.endTransaction(err, function(error) {
                c.disconnect();
                done(error, null);
            });
        } else {
            c.disconnect();
            done(err, null);
        }
    }).initialize().connect(function (err) {
        if (err) {
            done(err, null);
        } else {
            // Run the query
            if (isWrite) {
                c.beginTransaction(function() {
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
                            c.endTransaction(null, function() {
                                c.disconnect();
                                log('Finish executing ' + f, 'debug');
                            });
                        }
                    }).execute(params);
                });
            } else {
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
                }).execute(params);
            }
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

    describe("Multiple Async Queries", function() {
        beforeEach(function() {
            settings = {
                "user" : "informix",
                "host" : host,
                "port" : 2021,
                "password" : "1nf0rm1x",
                "database": "",
                "server" : "informixoltp_tcp",
                "minpool" : 0,
                "maxpool" : 20,
                "maxsize" : 0,
                "idleTimeout" : 60,
                "timeout" : 30000
            };

            executeQuery('corporate_oltp', "delete command_group_lu where command_group_id > 9999", function(err, count) {
            });
        });

        it("should return proper result for select", function(done) {
            async.parallel([
                function(callback) {
                    executeQuery('corporate_oltp', 'select * from command_group_lu', function(err, result) {
                        callback(err, result);
                    });
                },
                function(callback) {
                    executeQuery('common_oltp', 'select * from address_type_lu', function(err, result) {
                        callback(err, result);
                    });
                }
            ], function(err, results) {
                // The err should be null or undefined.
                assert.ok(err === null || err === undefined, "There should be no ERROR: " + err);
                assert.ok(results[0].length > 0, 'Should have results');
                assert.ok(results[1].length > 0, 'Should have results');
                done();
            });
        });

        it("should return proper result for insert/delete", function(done) {
            async.series([
                function(callback) {
                    executeQuery('corporate_oltp', "insert into command_group_lu(command_group_name, command_group_id) values('Name', 10000)", function(err, count) {
                        callback(err, count);
                    });
                },
                function(callback) {
                    executeQuery('corporate_oltp', 'select * from command_group_lu where command_group_id = 10000', function(err, result) {
                        callback(err, result);
                    });
                },
                function(callback) {
                    executeQuery('corporate_oltp', "delete command_group_lu where command_group_id = 10000", function(err, count) {
                        callback(err, count);
                    });
                }
            ], function(err, results) {
                // The err should be null or undefined.
                assert.ok(err === null || err === undefined, "There should be no ERROR: " + err);
                assert.equal(results[0], 1);
                assert.equal(results[1][0].command_group_name, 'Name');
                assert.equal(results[2], 1);
                done();
            });
        });
    });

    describe("Prepared Queries", function() {
        beforeEach(function() {
            settings = {
                "user" : "informix",
                "host" : host,
                "port" : 2021,
                "password" : "1nf0rm1x",
                "database": "",
                "server" : "informixoltp_tcp",
                "minpool" : 0,
                "maxpool" : 20,
                "maxsize" : 0,
                "idleTimeout" : 60,
                "timeout" : 30000
            };

            executeQuery('corporate_oltp', "delete command_group_lu where command_group_id > 9999", function(err, count) {
            });
        });

        it("should return proper result for prepared insert/select/delete", function(done) {
            async.series([
                function(callback) {
                    executeQuery('corporate_oltp', "insert into command_group_lu(command_group_name, command_group_id) values(?, ?)", function(err, count) {
                        callback(err, count);
                    },  [{type: "string", value: "Name"}, {type: "int", value: 10000}]);
                },
                function(callback) {
                    executeQuery('corporate_oltp', 'select * from command_group_lu where command_group_id = ?', function(err, result) {
                        callback(err, result);
                    }, [{type: "int", value: 10000}]);
                },
                function(callback) {
                    executeQuery('corporate_oltp', "delete command_group_lu where command_group_id = ?", function(err, count) {
                        callback(err, count);
                    }, [{type: "int", value: 10000}]);
                }
            ], function(err, results) {
                // The err should be null or undefined.
                assert.ok(err === null || err === undefined, "There should be no ERROR: " + err);
                assert.equal(results[0], 1);
                assert.equal(results[1][0].command_group_name, 'Name');
                assert.equal(results[2], 1);
                done();
            });
        });
    });
});

