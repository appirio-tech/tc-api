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
var JDBCObject = require('jdbc');
var assert = require('assert');
var _ = require('underscore');

var log = function(msg){
    console.log(new Date() + " " + msg);
};

function executeQuery(db, sql, done, variables) {
	var settings = {
			"user" : "informix",
			"host" : "192.168.0.100",
			"port" : 2021,
			"password" : "1nf0rm1x"
	};

    log('Query about to initiate');
	var config = {
		libpath: __dirname + '/../lib/ifxjdbc.jar',
		drivername: 'com.informix.jdbc.IfxDriver',
		url: 'jdbc:informix-sqli://' + settings.host + ':' + settings.port + '/' +
					db + ':INFORMIXSERVER=informixoltp_tcp;user=' +
					settings.user + ';password=' + settings.password
	};

	variables = variables || [];
	for (var j = 0; j < variables.length; j++) {
		if (!variables[j].hasOwnProperty("type") || !variables[j].hasOwnProperty("value")) {
			log('Invalid parameters provided');
			done('Invalid parameters provided');
			return;
		}

		if (!_.isString(variables[j].type)) {
			done('Not a string');
			return;
		}
	}

	var c = new JDBCObject();
	log('JDBC object created with guid ' + c._guid, 'debug');

	c.initialize(config, function (error) {
		if (error) {
			log("No database connection: " + error, 'error');
			next("No database connection");
		} else {
			// Run the query
			var count = 1;
			var execute = function(next) {
				var done = function(err, result) {
					assert.equal(null, err, "There shouldn't be err: " + err);
					assert.ok(result.length > 1, "There should be some value selected");
					next(err, result);
				};

				var tmpJDBC = _.clone(c);
				tmpJDBC.executeQuery(sql, variables, function (err, result) {
					if (err) {
						log("Error while executing query: " + err + " " + (err.stack || ''), 'error');
						next(err);
					} else {
						log("Done query", 'info');
						done(err, result);
					}
				});
			};

			async.parallel([
				execute
			], function(err, result){
				c.close();
				log("Database disconnect", 'info');
				done(err, result);
			});
		}
	});

    log('Connection Attempted to make');
}

describe("Informix Library", function(){
    this.timeout(0);  // No timeout restriction

    describe("Success -", function() {
		it("should return proper result regardless of the order", function(done){
			async.parallel([
				function(callback) {
					executeQuery('corporate_oltp', 'select * from command_group_lu where command_group_id > ?',
						function(err, result) {
						callback(err, result);
					}, [{type: "Int", value: 1}]);
				}
			], function(err, results){
				// The err should be null or undefined.
				assert.ok(err === null || err === undefined, "There should be no ERROR: " + err);
				done();
			});
		});
    });

    describe("Error -", function() {
		it("should return error message", function(done){
			executeQuery('corporate_oltp', 'select * from command_group_lu where command_group_id > ?',
				function(err, result) {
					assert.ok(err);
					done();
			}, [{}]);
		});

		it("should return error message", function(done){
			executeQuery('corporate_oltp', 'select * from command_group_lu where command_group_id > ?',
				function(err, result) {
					assert.ok(err);
					done();
			}, []);
		});

		it("should return error message", function(done){
			executeQuery('corporate_oltp', 'select * from command_group_lu where command_group_id > ?',
				function(err, result) {
					assert.ok(err);
					done();
			}, [{tt: "Int", value: 11}]);
		});

		it("should return error message", function(done){
			executeQuery('corporate_oltp', 'select * from command_group_lu where command_group_id > ?',
				function(err, result) {
					assert.ok(err);
					done();
			}, [{type: "Invalid", value: 11}]);
		});

		it("should return error message", function(done){
			executeQuery('corporate_oltp', 'select * from command_group_lu where command_group_id > ?',
				function(err, result) {
					assert.ok(err);
					done();
			}, [{type: 111, value: 11}]);
		});
    });
});

