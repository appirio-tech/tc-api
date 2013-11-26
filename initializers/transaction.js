/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */
"use strict";

/*jslint unparam: true */

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
            var dbConnectionMap = {}, dbConnection, callback;

            actionTemplate.databases.forEach(function (databaseName) {
                dbConnection = api.dataAccess.createConnection(databaseName);

                dbConnectionMap[databaseName] = dbConnection;

                api.log("to connect " + databaseName);

                callback = function (err, result) {
                    if (err) {
                        connection.error = err;
                        next(connection, false);
                    } else {
                        api.log("Database begin transaction result: " + result, "debug");
                    }

                    next(connection, true);
                };

                // connnect to the connection
                dbConnection.on('error', function (err) {
                    this.disconnect();
                    api.log("Database connection to " + databaseName + " error: " + err + " " + (err.stack || ''), 'error');
                    connection.error = err;
                    next(connection, false);
                }).connect(function (err) {
                    if (err) {
                        this.disconnect();
                        api.log("Database " + databaseName + " cannot be connected: " + err + " " + (err.stack || ''), 'error');
                        connection.error = err;
                        next(connection, false);
                    } else {
                        api.log("Database " + databaseName + " connected", 'info');

                        // if the aciton is transactional, start a transaction
                        if (actionTemplate.transaction === "write") {
                            // Begin transaction
                            this.query('BEGIN WORK', [], callback, {
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
        if (actionTemplate.dbConnection !== null && actionTemplate.dbConnection !== undefined && actionTemplate.transaction !== null && actionTemplate.transaction !== undefined) {
            actionTemplate.databases.forEach(function (databaseName) {
                var dbConnection = actionTemplate.dbConnectionMap[databaseName], callback;
                callback = function (err, result) {
                    dbConnection.disconnect();
                    api.log("Connection is closed", "debug");
                    if (err) {
                        connection.error = err;
                    } else {
                        api.log("Database end transaction result: " + result, "debug");
                    }

                    next(connection);
                };

                // if the action is transactional, end the transaction
                if (actionTemplate.transaction === "write") {
                    dbConnection.query(connection.error ? 'ROLLBACK WORK' : 'COMMIT WORK', [], callback, {
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
                    dbConnection.disconnect();
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
