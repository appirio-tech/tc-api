/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author vangavroche, Sky_
 * changes in 1.1:
 * 1. change executeQuery to support parameterization.
 */
"use strict";
/*jslint unparam: true*/
/**
 * Module dependencies.
 */
var bindings = require("nodejs-db-informix");
var fs = require("fs");
var async = require("async");
var helper;

/**
 * Initialize the database settings for the Contest API
 */
var settings = {
    "user": process.env.TC_DB_USER,
    "password": process.env.TC_DB_PASSWORD,
    "database": "tcs_catalog"
};

/**
 * Regex for sql paramters e.g @param_name@
 */
var paramReg = /@(\w+?)@/;


/**
 * Represent read sql queries
 */
var queries = {};

/**
 * Escape sql parameter. It only doubles quotes in string
 * @param {Object} param - any parameter
 * @param {Function<err, param>} cb - the callback function
 */
function escapeParam(param, cb) {
    //escape string ' to ''
    if (!helper.checkString(param)) {
        cb(null, param.replace(/'/g, "''"));
        //check all elements of array
    } else if (!helper.checkArray(param)) {
        async.map(param, escapeParam, function (err, arr) {
            if (err) {
                cb(err);
            } else {
                cb(null, arr.join(", "));
            }
        });
    } else if (!helper.checkObject(param)) {
        cb(new Error('objects are not supported as query parameter'));
    } else {
        cb(null, String(param));
    }
}

/**
 * Recursive method for replacing all parameters in query. Parameter sanitization is performed also.
 * @param {String} query - the sql query
 * @param {Object} params - the map of parameters. E.g. params {sort: 'asc', limit: 1}
 * @param {Function<err, query>} callback - the callback function
 */
function parameterizeQuery(query, params, callback) {
    var match = paramReg.exec(query), paramName;
    if (!match) {
        callback(null, query);
        return;
    }
    paramName = match[1];
    async.waterfall([
        function (cb) {
            if (!params.hasOwnProperty(paramName)) {
                cb(null, "");
                return;
            }
            escapeParam(params[paramName], cb);
        }, function (param, cb) {
            query = query.replace(paramReg, param);
            cb();
        }
    ], function (err) {
        if (err) {
            callback(err);
        } else {
            parameterizeQuery(query, params, callback);
        }
    });
}


/**
 * Expose the "dataAccess" utility.
 *
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Function<err>} next The callback function to be called when everyting is done
 */
exports.dataAccess = function (api, next) {

    api.dataAccess = {

        _start: function (api, next) {
            helper = api.helper;
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
                            encoding: 'utf8'
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

        _parameterizeQuery: parameterizeQuery,

        /**
         * Execute the query given the query name.
         * The result will be passed to the "next" callback.
         * 
         * @param {String} queryName - name of the query to be executed
         * @param {Object} parameters - the map of parameters for sql query. E.g. params {sort: 'asc', limit: 1}
         * @param {Function<err, result>} next - the callback function
         */
        executeQuery: function (queryName, parameters, next) {
            api.log("Execute query '" + queryName + "'", "debug");
            api.log("Query parameters " + JSON.stringify(parameters), "debug");

            var error = helper.checkFunction(next, "next"), connection, sql;
            if (error) {
                throw error;
            }
            error = helper.checkString(queryName, "queryName");
            if (!helper.checkDefined(parameters)) {
                error = error || helper.checkObject(parameters, "parameters");
            } else {
                parameters = {};
            }
            if (error) {
                next(error);
                return;
            }
            sql = queries[queryName];

            if (!sql) {
                api.log('Unregisterd query ' + queryName + ' is asked for.', 'error');
                next('The query for name ' + queryName + ' is not registered');
                return;
            }

            async.waterfall([
                function (cb) {
                    // Remove the 'select' keyword
                    sql = sql.trim();
                    if (sql.substring(0, 6).toLowerCase() === 'select') {
                        sql = sql.substring(6);
                    }
                    parameterizeQuery(sql, parameters, cb);
                }, function (parametrizedQuery, cb) {
                    sql = parametrizedQuery;
                    connection = new bindings.Informix(settings);
                    connection.on('error', cb);
                    connection.connect(cb);
                }, function (result, cb) {
                    api.log("Database connected", 'info');
                    // Run the query
                    connection.query("", [], cb, {
                        start: function (q) {
                            api.log('Start to execute ' + q, 'debug');
                        },
                        finish: function (f) {
                            api.log('Finish executing ' + f, 'debug');
                        },
                        async: false,
                        cast: true
                    }).select(sql).execute();
                }
            ], function (err, result) {
                //error is returned when there is no results
                if (err === "msg: Could not execute query.") {
                    api.log("Query executed with empty result", "debug");
                    err = null;
                    result = [];
                } else if (err) {
                    api.log("Error occured: " + err + " " + (err.stack || ''), 'error');
                } else {
                    api.log("Query executed", "debug");
                }
                if (connection) {
                    connection.disconnect();
                }
                next(err, result);
            });
        }
    };
    next();
};
