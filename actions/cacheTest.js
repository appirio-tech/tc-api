/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";

/**
 * Counter for non-cache hits (requests)
 */
var hits = 0;

/**
 * Default cache lifetime
 */
var DEFAULT_CACHE = 60000 * 5;

/**
 * Return response for cacheTest and cacheTestOAuth methods.
 *
 * @param {Object} connection - the action hero connection object
 * @param Function<connection, toRender> - the callback function
 */
function returnResponse(connection, next) {
    hits = hits + 1;
    connection.response = {
        test: "OK",
        hits: hits,
        date: new Date().toString()
    };
    next(connection, true);
}

/**
 * The test api method for caching
 */
exports.cacheTest = {
    name: 'cacheTest',
    description: 'cacheTest',
    inputs: {
        required: [],
        optional: ["paramOne", "paramTwo"]
    },
    cacheEnabled: true,
    cacheLifetime: DEFAULT_CACHE,
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute cacheTest#run", 'debug');
        returnResponse(connection, next);
    }
};

/**
 * The test api method with disabled caching
 */
exports.cacheDisabled = {
    name: 'cacheDisabled',
    description: 'cacheDisabled',
    inputs: {
        required: [],
        optional: ["paramOne", "paramTwo"]
    },
    cacheEnabled: false,
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute cacheDisabled#run", 'debug');
        returnResponse(connection, next);
    }
};

/**
 * The test api method for caching with OAuth
 */
exports.cacheTestOAuth = {
    name: 'cacheTestOAuth',
    description: 'cacheTestOAuth',
    inputs: {
        required: [],
        optional: ["paramOne", "paramTwo"]
    },
    permissionScope: 'CONTEST_REST',
    cacheEnabled: true,
    cacheLifetime: DEFAULT_CACHE,
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute cacheTestOAuth#run", 'debug');
        returnResponse(connection, next);
    }
};

/**
 * The test api method for caching, return always error
 */
exports.cacheTestError = {
    name: 'cacheTestError',
    description: 'cacheTestError',
    inputs: {
        required: [],
        optional: []
    },
    cacheEnabled: true,
    cacheLifetime: DEFAULT_CACHE,
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute cacheTestError#run", 'debug');
        hits = hits + 1;
        api.helper.handleError(api, connection, new Error('some error'));
        next(connection, true);
    }
};

/**
 * The helper api method for getting hits
 */
exports.cacheTestGetHits = {
    name: 'cacheTestGetHits',
    description: 'cacheTestGetHits',
    inputs: {
        required: [],
        optional: []
    },
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    run: function (api, connection, next) {
        api.log("Execute cacheTestGetHits#run", 'debug');
        connection.response = {
            hits: hits
        };
        next(connection, true);
    }
};

/**
 * The helper api method for resetting hits
 */
exports.cacheTestResetHits = {
    name: 'cacheTestResetHits',
    description: 'cacheTestResetHits',
    inputs: {
        required: [],
        optional: []
    },
    outputExample: {},
    cacheEnabled: false,
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute cacheTestResetHits#run", 'debug');
        hits = 0;
        next(connection, true);
    }
};