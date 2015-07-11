/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author Ghost_141
 * Changes in 1.1:
 * - Add technologies and platforms filter.
 */
"use strict";
var heapdump = require('heapdump');

var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var BadRequestError = require('../errors/BadRequestError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var ForbiddenError = require('../errors/ForbiddenError');


exports.dumpMemory = {
    name: 'dumpMemory',
    description: 'dump memory',
    inputs: {
        required: [],
        optional: []
    },
    // blockedConnectionTypes: [],
    //outputExample: {},
    version: 'v2',
    // transaction: 'read',
    // databases: [],
    // outputExample: {
    //     string: "hello"
    //   },
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
