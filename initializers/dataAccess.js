/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: vangavroche
 */
"use strict";

/**
 * Module dependencies.
 */
var bindings = require("nodejs-db-informix");
var fs = require("fs");
var async = require("async");

/**
 * Initialize the database settings for the Contest API
 */
var settings = {
    "user" : process.env.TC_DB_USER,
    "password" : process.env.TC_DB_PASSWORD,
    "database" : "tcs_catalog"
};

/**
 * Expose the "dataAccess" utility.
 *
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Function} next The callback function to be called when everyting is done
 */
exports.dataAccess = function (api, next) {

    var queries = {};

    api.dataAccess = {

        _start : function (api, next) {

            // load queries:
            api.log("Loading Queries");
            var dir = ('./queries');

            fs.readdir(dir, function (err, files) {
                if (err) {
                    api.log("Error occurred when reading the queries: " + err + " " + (err.stack || ''), "error");
                    next(err);
                } else {
                    // skip the directories
                    var i, queryFiles = [], loadFile;
                    for (i = 0; i < files.length; i += 1) {
                        /*jslint stupid: true */
                        if (!fs.lstatSync(dir + '/' + files[i]).isDirectory()) {
                            queryFiles.push(files[i]);
                        } else {
                            api.log('Directory ' + files[i] + ' is not loaded as query', 'info');
                        }
                        /*jslint */
                    }
                    // function to get content of all query files:
                    loadFile = function (filename, done) {
                        fs.readFile(dir + "/" + filename, {
                            encoding : 'utf8'
                        }, done);
                    };
                    async.map(queryFiles, loadFile, function (err, results) {
                        if (err) {
                            api.log("Error occurred when loading the queries: " + err + " " + (err.stack || ''), "error");
                            next(err);
                        } else {
                            for (i = 0; i < queryFiles.length; i += 1) {
                                api.log("Loading query " + queryFiles[i] + " : " + results[i], 'info');
                                queries[queryFiles[i]] = results[i];
                            }
                            next(null);
                        }
                    });
                }
            });
        },

        /**
         * Execute the query given the query name.
         * The result will be passed to the "next" callback.
         * 
         * @param {String} queryName - Name of the query to the executed
         * @param {Array} variables - Variables of the query to replace the "?"
         * @param {Function} next - The callback function
         */
        executeQuery : function (queryName, variables, next) {

            api.log("Execute query '" + queryName + "'", "debug");
            api.log("Query variables " + variables, "debug");

            // Load query
            var sql = queries[queryName], callback, connection;

            if (!sql) {
                api.log('Unregisterd query ' + queryName + ' is asked for.', 'error');
                next('The query for name ' + queryName + ' is not registered');
                return;
            }

            // Remove the 'select' keyword
            sql = sql.trim();
            if (sql.substring(0, 6).toLowerCase() === 'select') {
                sql = sql.substring(6);
            }

            callback = function (err, result) {
                api.log("Query executed", "debug");
                next(err, result);
            };
            connection = new bindings.Informix(settings);

            // connnect to the connection
            connection.on('error', function (err) {
                this.disconnect();
                api.log("Database connection error: " + err + " " + (err.stack || ''), 'error');
                next(err);
            }).connect(function (err) {
                if (err) {
                    this.disconnect();
                    api.log("Database cannot be connected: " + err + " " + (err.stack || ''), 'error');
                    next(err);
                } else {
                    api.log("Database connected", 'info');

                    // Run the query
                    this.query('', [], callback, {
                        start : function (q) {
                            api.log('Start to execute ' + q, 'debug');
                        },
                        finish : function (f) {
                            api.log('Finish executing ' + f, 'debug');
                        },
                        async : false,
                        cast : true
                    }).select(sql).execute();

                    this.disconnect();
                }

            });

        }
    };
    next();
};
