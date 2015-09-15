/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */
"use strict";

/*jslint unparam: true */

var CONN_TIMEOUT = 5000;
var DISCONN_TIMEOUT = 5000;

var handleConnectionFailure = function (api, connection, actionTemplate, error, next) {
    api.log("Close all opened connections", "debug");
    var connectionClosedCount = 0;
    actionTemplate.databases.forEach(function (databaseName) {
        var callback;
        callback = function (err, result) {
            connection.dbConnectionMap[databaseName].disconnect();
            api.log("Connection is closed for " + databaseName, "debug");
            if (err) {
                connection.error = err;
                next(connection, false);
                return;
            }

            connectionClosedCount += 1;
            if (connectionClosedCount === actionTemplate.databases.length) {
                connection.error = error;
                next(connection, false);
            }
        };

        // if the action is transactional, end the transaction
        if (actionTemplate.transaction === "write" && connection.dbConnectionMap[databaseName].isConnected()) {
            connection.dbConnectionMap[databaseName].endTransaction(error, callback);
        } else {
            callback(error);
        }
    });
};

/**
 * Expose the "transaction" utility.
 *
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Function} next The callback function to be called when everything is done
 */
exports.transaction = function (api, next) {
    var transactionPreProcessor, transactionPostProcessor;
    /**
     * The pre processor to create connection and optionally start a transaction.
     * The result will be passed to the "next" callback.
     *
     * @param {Object} connection - the action hero connection
     * @param {Object} actionTemplate - The action template
     * @param {Function} next - The callback function
     */
    transactionPreProcessor = function (connection, actionTemplate, next) {
        if (actionTemplate.transaction === "read" || actionTemplate.transaction === "write") {
            var dbConnectionMap = {}, dbConnection, callback, connectionOpenedCount = 0;
            
            var connectTimeout = function() {
                api.log("Timed out without obtaining all DB connections", "error");
                handleConnectionFailure(api, connection, actionTemplate, "Open Timeout", next);
            }
            
            var clearMe = setTimeout(connectTimeout, CONN_TIMEOUT);

            actionTemplate.databases.forEach(function (databaseName) {
                dbConnection = api.dataAccess.createConnection(databaseName);

                dbConnectionMap[databaseName] = dbConnection;
            });

            actionTemplate.databases.forEach(function (databaseName) {
                callback = function (err, result) {
                    connection.dbConnectionMap = dbConnectionMap;
                    if (err) {
                        clearTimeout(clearMe);
                        handleConnectionFailure(api, connection, actionTemplate, err, next);
                        return;
                    }

                    connectionOpenedCount += 1;
                    if (connectionOpenedCount === actionTemplate.databases.length) {
                        clearTimeout(clearMe);
                        api.log("All connections are opened", "debug");
                        next(connection, true);
                    }
                };

                // connect to the connection
                dbConnectionMap[databaseName].on('error', function (err) {
                    dbConnectionMap[databaseName].disconnect();
                    api.log("Database connection to " + databaseName + " error: " + err + " " + (err.stack || ''), 'error');
                    handleConnectionFailure(api, connection, actionTemplate, err, next);
                }).initialize().connect(function (err) {
                    if (err) {
                        dbConnectionMap[databaseName].disconnect();
                        api.log("Database " + databaseName + " cannot be connected: " + err + " " + (err.stack || ''), 'error');
                        handleConnectionFailure(api, connection, actionTemplate, err, next);
                    } else {
                        api.log("Database " + databaseName + " connected", 'debug');

                        // if the action is transactional, start a transaction
                        if (actionTemplate.transaction === "write" && dbConnectionMap[databaseName].isConnected()) {
                            // Begin transaction
                            dbConnectionMap[databaseName].beginTransaction(callback);
                        } else {
                            callback();
                        }
                    }

                });
            });

        } else {
            next(connection, true);
        }
    };

    api.actions.preProcessors.push(transactionPreProcessor);

    /**
     * The post processor to disconnect a connection and optionally commit/rollback a transaction.
     * The result will be passed to the "next" callback.
     *
     * @param {Object} connection - the action hero connection
     * @param {Object} actionTemplate - The action template
     * @param {Object} toRender - The to render object
     * @param {Function} next - The callback function
     */
    transactionPostProcessor = function (connection, actionTemplate, toRender, next) {
        
        var disconnectTimeout = function() {
            api.error("Timed out without closing all DB connections", "error");
            // I dont want to call next(connection); here because I want to allow the execution to to continue in case connection can be closed after timeout
        }
        
        var clearMe = setTimeout(disconnectTimeout, DISCONN_TIMEOUT);
        
        var connectionClosedCount = 0;
        if (connection.dbConnectionMap !== null && connection.dbConnectionMap !== undefined && actionTemplate.transaction !== null && actionTemplate.transaction !== undefined) {
            actionTemplate.databases.forEach(function (databaseName) {
                var callback;
                callback = function (err, result) {
                    connection.dbConnectionMap[databaseName].disconnect();
                    api.log("Connection is closed", "debug");
                    if (err) {
                        clearTimeout(clearMe);
                        connection.error = err;
                        next(connection);
                        return;
                    }

                    connectionClosedCount += 1;
                    if (connectionClosedCount === actionTemplate.databases.length) {
                        clearTimeout(clearMe);
                        api.log("All connections are closed", "debug");
                        next(connection);
                    }
                };

                // if the action is transactional, end the transaction
                if (actionTemplate.transaction === "write" && connection.dbConnectionMap[databaseName].isConnected()) {
                    connection.dbConnectionMap[databaseName].endTransaction(connection.response.error, callback);
                } else {
                    callback();
                }
            });
        } else {
            next(connection);
        }
    };

    api.actions.postProcessors.push(transactionPostProcessor);

    next();
};
