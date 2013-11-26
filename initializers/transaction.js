/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */
"use strict";

/*jslint unparam: true */

var handleConnectionFailure = function (api, connection, actionTemplate, error, next) {
    api.log("Close all opened connections", "debug");
    var connectionClosedCount = 0;
    actionTemplate.databases.forEach(function (databaseName) {
        var callback;
        callback = function (err, result) {
            actionTemplate.dbConnectionMap[databaseName].disconnect();
            api.log("Connection is closed", "debug");
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
        if (actionTemplate.transaction === "write") {
            if (actionTemplate.dbConnectionMap[databaseName].isConnected()) {
                actionTemplate.dbConnectionMap[databaseName].query('ROLLBACK WORK', [], callback, {
                    start : function (q) {
                        api.log('Start to execute ' + q, 'debug');
                    },
                    finish : function (f) {
                        api.log('Finish executing ' + f, 'debug');
                    },
                    async : false,
                    cast : true
                }).execute();
            }
        } else {
            actionTemplate.dbConnectionMap[databaseName].disconnect();
            connection.error = error;
            next(connection, false);
        }
    });
};

/**
 * Expose the "transaction" utility.
 *
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Function} next The callback function to be called when everyting is done
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

            actionTemplate.databases.forEach(function (databaseName) {
                dbConnection = api.dataAccess.createConnection(databaseName);

                dbConnectionMap[databaseName] = dbConnection;
            });

            actionTemplate.databases.forEach(function (databaseName) {
                callback = function (err, result) {
                    if (err) {
                        handleConnectionFailure(api, connection, actionTemplate, err, next);
                        return;
                    }

                    connectionOpenedCount += 1;
                    if (connectionOpenedCount === actionTemplate.databases.length) {
                        api.log("All connections are opened", "debug");
                        next(connection, true);
                    }
                };

                // connnect to the connection
                dbConnectionMap[databaseName].on('error', function (err) {
                    dbConnectionMap[databaseName].disconnect();
                    api.log("Database connection to " + databaseName + " error: " + err + " " + (err.stack || ''), 'error');
                    handleConnectionFailure(api, connection, actionTemplate, err, next);
                }).connect(function (err) {
                    if (err) {
                        dbConnectionMap[databaseName].disconnect();
                        api.log("Database " + databaseName + " cannot be connected: " + err + " " + (err.stack || ''), 'error');
                        handleConnectionFailure(api, connection, actionTemplate, err, next);
                    } else {
                        api.log("Database " + databaseName + " connected", 'info');

                        // if the aciton is transactional, start a transaction
                        if (actionTemplate.transaction === "write") {
                            // Begin transaction
                            dbConnectionMap[databaseName].query('BEGIN WORK', [], callback, {
                                start : function (q) {
                                    api.log('Start to execute ' + q, 'debug');
                                },
                                finish : function (f) {
                                    api.log('Finish executing ' + f, 'debug');
                                },
                                async : false,
                                cast : true
                            }).execute();
                        } else {
                            next(connection, true);
                        }
                    }

                });
            });

            actionTemplate.dbConnectionMap = dbConnectionMap;
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
        var connectionClosedCount = 0;
        if (actionTemplate.dbConnectionMap !== null && actionTemplate.dbConnectionMap !== undefined && actionTemplate.transaction !== null && actionTemplate.transaction !== undefined) {
            actionTemplate.databases.forEach(function (databaseName) {
                var callback;
                callback = function (err, result) {
                    actionTemplate.dbConnectionMap[databaseName].disconnect();
                    api.log("Connection is closed", "debug");
                    if (err) {
                        connection.error = err;
                        next(connection);
                        return;
                    }

                    connectionClosedCount += 1;
                    if (connectionClosedCount === actionTemplate.databases.length) {
                        api.log("All connections are closed", "debug");
                        next(connection);
                    }
                };

                // if the action is transactional, end the transaction
                if (actionTemplate.transaction === "write") {
                    actionTemplate.dbConnectionMap[databaseName].query(connection.error ? 'ROLLBACK WORK' : 'COMMIT WORK', [], callback, {
                        start : function (q) {
                            api.log('Start to execute ' + q, 'debug');
                        },
                        finish : function (f) {
                            api.log('Finish executing ' + f, 'debug');
                        },
                        async : false,
                        cast : true
                    }).execute();
                } else {
                    actionTemplate.dbConnectionMap[databaseName].disconnect();
                    next(connection);
                }
            });
        } else {
            next(connection);
        }
    };

    api.actions.postProcessors.push(transactionPostProcessor);

    next();
};
