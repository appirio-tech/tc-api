/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.4
 * @author vangavroche, Sky_, pvmagacho, Ghost_141
 * changes in 1.1:
 * 1. change executeQuery to support parameterization.
 * changes in 1.2
 * 1. read sql information from json files
 * changes in 1.3
 * 1. removed C++ informix driver
 * 2. added JDBC informix driver.
 * Changes in 1.4:
 * 1. add method executeSqlQuery. It will be used to execute sql directly instead of query from preloaded files.
 * 2. Fix some jslint error.
 */
"use strict";
/*jslint unparam: true, stupid: true */

/**
 * Default jdbc connection pool configuration. Used when environment variables are not set.
 */
var DEFAULT_MINPOOL = 1;
var DEFAULT_MAXPOOL = 60;
var DEFAULT_MAXSIZE = 0;
var DEFAULT_IDLETIMEOUT = 3600; // 3600s
var DEFAULT_TIMEOUT = 30000; // 30s

/**
 * Module dependencies.
 */
var _ = require('underscore');
var fs = require("fs");
var async = require("async");
var java = require('java');
var Jdbc = require('informix-wrapper');
var helper;
var configs = require("../config.js");

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
                // password hash doesn't work well with paramReg, so special handling is performed
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

        _teardown : function (api, next) {
            try {
                // Explicit exit JVM (needed because the JVM was started with the -Xrs option)
                java.callStaticMethod('java.lang.System', 'exit', 0);
            } catch (e) {
                api.log('Error : ' + e, 'error');
            }

            next();
        },

        /**
         * Create a database connection.
         * @param {String} databaseName the database name.
         * @return {Object} the created connection.
         */
        createConnection : function (databaseName) {
            var error, dbServerPrefix = configs.config.databaseMapping[databaseName],
                user, password, hostname, server, port, settings;
            error = helper.checkDefined(dbServerPrefix, "database server prefix");
            if (error) {
                throw error;
            }

            user = process.env[dbServerPrefix + "_USER"];
            password = process.env[dbServerPrefix + "_PASSWORD"];
            hostname = process.env[dbServerPrefix + "_HOST"];
            server = process.env[dbServerPrefix + "_NAME"];
            port = process.env[dbServerPrefix + "_PORT"];

            // Initialize the database settings
            settings = {
                "user" : user,
                "host" : hostname,
                "port" : parseInt(port, 10),
                "password" : password,
                "database" : databaseName,
                "server" : server,
                "minpool" : parseInt(process.env.MINPOOL, 10) || DEFAULT_MINPOOL,
                "maxpool" : parseInt(process.env.MAXPOOL, 10) || DEFAULT_MAXPOOL,
                "maxsize" : parseInt(process.env.MAXSIZE, 10) || DEFAULT_MAXSIZE,
                "idleTimeout" : parseInt(process.env.IDLETIMEOUT, 10) || DEFAULT_IDLETIMEOUT,
                "timeout" : parseInt(process.env.TIMEOUT, 10) || DEFAULT_TIMEOUT
            };

            return new Jdbc(settings, api.log);
        },

        _parameterizeQuery: parameterizeQuery,

        /**
         * Execute the query given the query name. Handles select/insert/delete/update queries.
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

            error = helper.checkObject(connection, "connection");

            if (error) {
                next(error);
                return;
            }

            sql = queries[queryName].sql;
            if (!sql) {
                api.log('Unregistered query ' + queryName + ' is asked for.', 'error');
                next('The query for name ' + queryName + ' is not registered');
                return;
            }

            async.waterfall([
                function (cb) {
                    parameterizeQuery(sql, parameters, cb);
                }, function (parametrizedQuery, cb) {
                    sql = parametrizedQuery;
                    api.log("Database connected", 'info');

                    // the connection might have been closed due to other errors, so this check must be done
                    if (connection.isConnected()) {
                        // Run the query
                        connection.query(sql, cb, {
                            start: function (q) {
                                api.log('Start to execute ' + q, 'debug');
                            },
                            finish: function (f) {
                                api.log('Finish executing ' + f, 'debug');
                            }
                        }).execute();
                    }
                }
            ], function (err, result) {
                if (err) {
                    api.log("Error occurred: " + err + " " + (err.stack || ''), 'error');
                } else {
                    api.log("Query executed", "debug");
                }

                next(err, result);
            });
        },

        /**
         * Execute the given sql query. Handles select/insert/delete/update queries.
         * The result will be passed to the "next" callback.
         *
         * @param {String} sql - the sql query.
         * @param {Object} parameters - the query parameter.
         * @param {String} dbName - the database that query against.
         * @param {Object} connectionMap - the database connection object.
         * @param {Function} next - the callback function.
         * @since 1.4
         */
        executeSqlQuery: function (sql, parameters, dbName, connectionMap, next) {
            api.log("Execute sql query '" + sql + "'", "debug");

            var error = helper.checkFunction(next, "next"), connection;
            if (!_.isUndefined(parameters)) {
                error = error || helper.checkObject(parameters, "parameters");
            } else {
                parameters = {};
            }
            if (error) {
                throw error;
            }
            error = helper.checkString(sql, "sql") ||
                helper.checkString(dbName, 'dbName');
            if (error) {
                next(error);
                return;
            }

            connection = connectionMap[dbName];

            error = helper.checkObject(connection, "connection");

            if (error) {
                next(error);
                return;
            }

            async.waterfall([
                function (cb) {
                    parameterizeQuery(sql, parameters, cb);
                }, function (parametrizedQuery, cb) {
                    sql = parametrizedQuery;
                    api.log("Database connected", 'info');

                    // the connection might have been closed due to other errors, so this check must be done
                    if (connection.isConnected()) {
                        // Run the query
                        connection.query(sql, cb, {
                            start: function (q) {
                                api.log('Start to execute ' + q, 'debug');
                            },
                            finish: function (f) {
                                api.log('Finish executing ' + f, 'debug');
                            }
                        }).execute();
                    }
                }
            ], function (err, result) {
                if (err) {
                    api.log("Error occurred: " + err + " " + (err.stack || ''), 'error');
                } else {
                    api.log("Query executed", "debug");
                }

                next(err, result);
            });

        }
    };
    next();
};
