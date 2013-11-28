/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.3
 * @author vangavroche, Sky_, pvmagacho
 * changes in 1.1:
 * 1. change executeQuery to support parameterization.
 * changes in 1.2
 * 1. read sql information from json files
 * changes in 1.3
 * 1. added async flag to database connection.
 * 2. added JDBC driver option (experimental).
 * 3. moved database disconnect method to 'finish' event when using asynchronous calls.
 *
 */
"use strict";
/*jslint unparam: true*/

/**
 * Module dependencies.
 */
var bindings = require("nodejs-db-informix");
var JDBCObject = require('jdbc');
var fs = require("fs");
var _ = require('underscore');
var async = require("async");
var helper;

/**
 * Check for JDBC flag
 */
var useJdbc = (process.env.USE_JDBC !== null && undefined !== process.env.USE_JDBC && process.env.USE_JDBC === 'YES');

/**
 * Initialize the database settings for the Contest API
 */
var settings = {
	"user" : process.env.TC_DB_USER,
	"host" : process.env.TC_DB_HOST,
	"port" : parseInt(process.env.TC_DB_PORT, 10),
	"password" : process.env.TC_DB_PASSWORD
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
    if (_.isString(param)) {
        cb(null, param.replace(/'/g, "''"));
        //check all elements of array
    } else if (_.isArray(param)) {
        async.map(param, escapeParam, function (err, arr) {
            if (err) {
                cb(err);
            } else {
                cb(null, arr.join(", "));
            }
        });
    } else if (_.isObject(param)) {
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
            if (paramName === 'password') {
                // password hash doens't work well with paramReg, so special handling is performed
                query = query.replace("@password@", param);
            } else {
                query = query.replace(paramReg, param);
            }

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
            var dir = './queries',
                relativeDir = '../queries';

            async.waterfall([
                function (cb) {
                    fs.readdir(dir, cb);
                }, function (files, cb) {
                    async.forEach(files, function (file, cbx) {
                        /*jslint stupid: true */
                        if (fs.lstatSync(dir + '/' + file).isDirectory() || !/\.json$/.test(file)) {
                            cbx();
                            return;
                        }
                        /*jslint */
                        api.log("Reading " + file, "debug");
                        var json = require(relativeDir + "/" + file);
                        queries[json.name] = json;
                        fs.readFile(dir + "/" + json.sqlfile, {
                            encoding: 'utf8'
                        }, function (err, sql) {
                            json.sql = sql;
                            cbx(err);
                        });
                    }, cb);
                }
            ], function (err) {
                if (err) {
                    api.log("Error occurred when reading the queries: " + err + " " + (err.stack || ''), "error");
                }
                next(err);
            });
        },

        /**
         * Create a database connection.
         * @param {String} databaseName the database name.
         * @return {Object} the created connection.
         */
        createConnection : function (databaseName) {
        	var config;
        	api.log((useJdbc ? 'Using JDBC' : 'Using CSDK'), 'info');

        	if (useJdbc) {
        		config = {
                    libpath: __dirname + '/../lib/ifxjdbc.jar',
                    drivername: 'com.informix.jdbc.IfxDriver',
                    url: 'jdbc:informix-sqli://' + settings.host + ':' + settings.port + '/' +
                                databaseName + ':INFORMIXSERVER=informixoltp_tcp;user=' +
                                settings.user + ';password=' + settings.password
                };

        		return new JDBCObject(config, api.log);
            } else {
	            config = {
	            	"user" : settings.user,
	            	"password" : settings.password,
	            	"database" : databaseName
	            };
            	return new bindings.Informix(config);
            }
        },

        _parameterizeQuery: parameterizeQuery,

        /**
         * Execute the query given the query name.
         * The result will be passed to the "next" callback.
         *
         * @param {String} queryName - name of the query to be executed
         * @param {Object} parameters - the map of parameters for sql query. E.g. params {sort: 'asc', limit: 1}
         * @param {Object} connectionMap - The database connection map, with key being the database name and value being the database connection
         * @param {Function<err, result>} next - the callback function
         */
        executeQuery: function (queryName, parameters, connectionMap, next) {
            api.log("Execute query '" + queryName + "'", "debug");
            api.log("Query parameters " + JSON.stringify(parameters), "debug");

            var error = helper.checkFunction(next, "next"), sql, connection;
            if (error) {
                throw error;
            }
            error = helper.checkString(queryName, "queryName");
            if (_.isDefined(parameters)) {
                error = error || helper.checkObject(parameters, "parameters");
            } else {
                parameters = {};
            }
            if (error) {
                next(error);
                return;
            }

            connection = connectionMap[queries[queryName].db];

            sql = queries[queryName].sql;
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
					api.log("Database connected", 'info');
					// Run the query
					connection.query("", [], cb, {
						start: function (q) {
							api.log('Start to execute ' + q, 'debug');
						},
						finish: function (f) {
							api.log('Finish executing ' + f, 'debug');
						},
						async: true,
						cast: true
					}).select(sql).execute();

					api.log("End method", 'info');
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

				next(err, result);
			});
        },

        /**
         * Execute the update given the query name.
         * The result will be passed to the "next" callback.
         *
         * @param {String} queryName - name of the query to be executed
         * @param {Object} parameters - the map of parameters for sql query. E.g. params {sort: 'asc', limit: 1}
         * @param {Object} connectionMap - The database connection map, with key being the database name and value being the database connection
         * @param {Function<err, result>} next - the callback function
         */
        executeUpdate: function (queryName, parameters, connectionMap, next) {
            api.log("Execute query '" + queryName + "'", "debug");
            api.log("Query parameters " + JSON.stringify(parameters), "debug");

            var error = helper.checkFunction(next, "next"), sql, connection;
            if (error) {
                throw error;
            }
            error = helper.checkString(queryName, "queryName");
            if (_.isDefined(parameters)) {
                error = error || helper.checkObject(parameters, "parameters");
            } else {
                parameters = {};
            }
            if (error) {
                next(error);
                return;
            }

            connection = connectionMap[queries[queryName].db];

            sql = queries[queryName].sql;
            if (!sql) {
                api.log('Unregisterd query ' + queryName + ' is asked for.', 'error');
                next('The query for name ' + queryName + ' is not registered');
                return;
            }

            async.waterfall([
                function (cb) {
                    parameterizeQuery(sql, parameters, cb);
                }, function (parametrizedQuery, cb) {
                    sql = parametrizedQuery;
                    api.log("Will execute update: " + sql, 'info');
                    // Run the query
                    connection.query(sql, [], cb, {
                        start: function (q) {
                            api.log('Start to execute ' + q, 'debug');
                        },
                        finish: function (f) {
                            api.log('Finish executing ' + f, 'debug');
                        },
                        async: false,
                        cast: true
                    }).execute();
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

                next(err, result);
            });
        }
    };
    next();
};
