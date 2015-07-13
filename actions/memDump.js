/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 */
"use strict";
var heapdump = require('heapdump');

exports.dumpMemory = {
    name: 'dumpMemory',
    description: 'dump memory',
    inputs: {
        required: [],
        optional: []
    },
    outputExample: {},
    cacheEnabled: false,
    version: 'v2',
    run: function (api, connection, next) {
        if (process.env.ADMIN_API_KEY && connection.params.apiKey === process.env.ADMIN_API_KEY) {
            heapdump.writeSnapshot(function(err, filename) {
                if (err) {
                    connection.result = 'error: ' + err;
                }
                else {
                    connection.result = 'dump written to: ' + filename;
                }
                next(connection, true);
            });
        } else {
            next(connection, true);
        }
    }
};
