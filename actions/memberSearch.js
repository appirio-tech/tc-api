/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASEMBLER
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var IllegalArgumentError = require('../errors/IllegalArgumentError');

/**
 * This is the function that actually get software rating history and distribution
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
var searchUsers = function (api, connection, dbConnectionMap, next) {
    var i, helper = api.helper,
        result = {},
        sqlParams = {},
        pageIndex = Number(connection.params.pageIndex || 1),
        pageSize = Number(connection.params.pageSize || helper.MAX_PAGE_SIZE),
        caseSensitive = (connection.params.caseSensitive || "false").toLowerCase(),
        handle = connection.params.handle;

    async.waterfall([
        function (callback) {
            if (caseSensitive !== "true" && caseSensitive !== "false") {
                callback(new IllegalArgumentError("caseSensitive should be 'true' or 'false'."));
                return;
            }

            var error = helper.checkPositiveInteger(pageIndex, "pageIndex") ||
                helper.checkMaxNumber(pageIndex, helper.MAX_INT, "pageIndex") ||
                helper.checkPositiveInteger(pageSize, "pageSize") ||
                helper.checkMaxNumber(pageSize, helper.MAX_PAGE_SIZE, "pageSize") ||
                helper.checkStringPopulated(handle, "handle");
            if (error) {
                callback(error);
            } else {
                sqlParams.firstRowIndex = (pageIndex - 1) * pageSize;
                sqlParams.pageSize = pageSize;
                sqlParams.caseSensitive = caseSensitive;
                sqlParams.partial = handle.indexOf("%") !== -1 || handle[0] === "_" ? 1 : 0;
                for (i = 0; i < handle.length - 1; i = i + 1) {
                    if (handle[i] !== "\\" && handle[i + 1] === "_") {
                        sqlParams.partial = 1;
                        break;
                    }
                }
                sqlParams.handle = sqlParams.partial === 1 ? handle : handle.replace("\\", "");
                callback();
            }
        },
        function (callback) {
            var execQuery = function (name) {
                return function (cb) {
                    api.dataAccess.executeQuery(name, sqlParams, dbConnectionMap, cb);
                };
            };
            async.parallel({
                tot : execQuery("search_users_count"),
                items : execQuery("search_users")
            }, callback);
        },
        function (res, callback) {
            result.total = res.tot[0].total;
            result.pageIndex = pageIndex;
            result.pageSize = pageSize;
            result.users = _.map(res.items, function (item) {
                return {
                    handle : item.handle,
                    userId: item.user_id
                };
            });
            callback();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = result;
        }
        next(connection, true);
    });
};

/**
 * The API for searching users.
 */
exports.searchUsers = {
    name: "searchUsers",
    description: "searchUsers",
    inputs: {
        required: ["handle"],
        optional: ["pageIndex", "pageSize", "caseSensitive"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: "v2",
    transaction: "read", // this action is read-only
    databases: ["common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute searchUsers#run", 'debug');
            searchUsers(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
