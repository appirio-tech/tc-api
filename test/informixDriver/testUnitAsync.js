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
var bindings = require("nodejs-db-informix");
var assert = require('assert');

var log = function(msg){
    console.log(new Date() + " " + msg);
};

function executeQuery(db, sql, done){
	var settings = {
			"user" : "informix",
			"host" : "informixoltp_tcp",
			"port" : 2021,
			"password" : "1nf0rm1x",
			"database" : db
	};

    log('Query about to initiate');
    var connection = new bindings.Informix(settings);

	// connnect to the connection
	connection.on('error', function (err) {
		this.disconnect();
		log("Database connection error: " + err + " " + (err.stack || ''), 'error');
	}).connect({
		async: true
	},
		function (err) {
			if (err) {
				this.disconnect();
				done(err);
			} else {
				log("Database connected", 'info');
				// Run the query
				var count = 1;
				var execute = function(next) {
				var done = function(err, result, meta){
					assert.equal(null, err, "There shouldn't be err: " + err);
					assert.ok(result.length > 1, "There should be some value selected");
					assert.ok(meta.length > 1, "The column meta should be in the result");
					next(err, result);
				};

				connection.query('', [], done, {
					start : function (q) {
						log('Start to execute ' + q, 'debug');
					},
					finish : function () {
						log('Finish executing', 'debug');
						log("Database disconnect", 'info');
					},
					async : true,
					cast : true
				}).select(sql).execute();
					log('Query initiated ' + count++);
				};

				async.parallel([
					execute, execute, execute
				], function(err, result){
					connection.disconnect();
					done(err, result);
				});
			}
		});

    log('Connection Attempted to make');
}


describe("Informix Library", function(){
    this.timeout(0);  // No timeout restriction
    describe("Multiple Async Queries", function() {
		it("should return proper result regardless of the order", function(done){
			async.parallel([
				function(callback) {
					executeQuery('corporate_oltp', '* from command_group_lu', function(err, result){
						callback(err, result);
					});
				},
				function(callback) {
					executeQuery('common_oltp', '* from address_type_lu', function(err, result){
						callback(err, result);
					});
				}
			], function(err, results){
				// The err should be null or undefined.
				assert.ok(err === null || err === undefined, "There should be no ERROR: " + err);
				done();
			});
		});
    });
});

