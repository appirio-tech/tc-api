/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: vangavroche
 */
"use strict";

var task = {};

/////////////////////////////////////////////////////////////////////
// metadata
task.name = "runAction";
task.description = "I will run an action and return the connection object";
task.scope = "any";
task.frequency = 0;

/////////////////////////////////////////////////////////////////////
// functional

task.run = function (api, params, next) {
    var connection, actionProcessor;
    if (params === null) {
        params = {};
    }

    connection = new api.connection({
        type : 'task',
        remotePort : '0',
        remoteIP : '0',
        rawConnection : {}
    });
    connection.params = params;
    // params.action should be set

    actionProcessor = new api.actionProcessor({
        connection : connection,
        callback : function (connection) {
            if (connection.error) {
                api.log("task error: " + connection.error, "error", {
                    params : JSON.stringify(params)
                });
            } else {
                api.log("[ action @ task ]", "debug", {
                    params : JSON.stringify(params)
                });
            }
            connection.destroy(function () {
                next(connection, true);
            });
        }
    });
    actionProcessor.processAction();
};

/////////////////////////////////////////////////////////////////////
// exports
exports.task = task;
