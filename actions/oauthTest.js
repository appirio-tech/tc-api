/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";

/**
 * The test api method for caching
 */
exports.action = {
    name: 'oauthTest',
    description: 'oauthTest',
    inputs: {
        required: [],
        optional: []
    },
    cacheEnabled: false,
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute oauthTest#run", 'debug');
        connection.response = connection.caller;
        next(connection, true);
    }
};
