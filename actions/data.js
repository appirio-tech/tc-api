/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author muzehyun
 * @changes in 1.1
 * - Allowed anonymous user, returns all existing platforms and technologies.
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var BadRequestError = require('../errors/BadRequestError');
var ForbiddenError = require('../errors/ForbiddenError');
var UnauthorizedError = require('../errors/UnauthorizedError');

/**
 * The API for platforms
 */
exports.getPlatforms = {
    name: 'getPlatforms',
    description: 'getPlatforms',
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['tcs_catalog'],
    run: function (api, connection, next) {
        api.log('Execute getPlatforms#run', 'debug');
        var helper = api.helper,
            dbConnectionMap = connection.dbConnectionMap,
            result;
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                api.dataAccess.executeQuery('get_data_platforms', {}, dbConnectionMap, cb);
            }, function (results, cb) {
                result = {
                    count: results.length,
                    platforms: _.pluck(results, 'name')
                };
                cb();
            }
        ], function (err) {
            if (err) {
                helper.handleError(api, connection, err);
            } else {
                connection.response = result;
            }
            next(connection, true);
        });
    }
}; // getPlatforms

/**
 * The API for technologies
 */
exports.getTechnologies = {
    name: 'getTechnologies',
    description: 'getTechnologies',
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['tcs_catalog'],
    run: function (api, connection, next) {
        api.log('Execute getTechnologies#run', 'debug');
        var helper = api.helper,
            dbConnectionMap = connection.dbConnectionMap,
            result;
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                api.dataAccess.executeQuery('get_data_technologies', {}, dbConnectionMap, cb);
            }, function (results, cb) {
                result = {
                    count: results.length,
                    technologies: _.pluck(results, 'name')
                };
                cb();
            }
        ], function (err) {
            if (err) {
                helper.handleError(api, connection, err);
            } else {
                connection.response = result;
            }
            next(connection, true);
        });
    }
}; // getTechnologies