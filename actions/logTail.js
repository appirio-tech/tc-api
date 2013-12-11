/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author delemach
 */
"use strict";
var exec = require('child_process').exec;



/**
 * Get recent log
 */
exports.getLogTail = {
    name: 'getLogTail',
    description: 'tail of log',
    inputs: {
        required: [],
        optional: ['lines']
    },
    blockedConnectionTypes : [],
    cacheEnabled : false,
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {

        var lines = connection.params.lines || 30,
            logfile = api.configData.general.paths.log + "/" + api.pids.title + '.log',
            cmd = 'tail ' + logfile + ' -n ' + lines;
        exec(cmd, function (err, stdout, stderr) {
            if (err) {
                connection.error = stderr;
            } else {
                //console.log(stdout);
                connection.response = { log: stdout };
            }
            next(connection, true);
        });
    }
};


/**
 * workaround for files with only one action in them
 */
exports.dummy = {
    name: 'dummy',
    description: 'dummy',
    inputs: {
        required: [],
        optional: []
    },
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
            next(connection, true);
    }
};
