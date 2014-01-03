/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.3
 * @author Sky_, mekanizumu, Ghost_141
 * @changes from 1.0
 * merged with Member Registration API
 * changes in 1.1:
 * - add stub for Top Ranked Members for studio, SRM and Marathon
 * changes in 1.2:
 * - implement marathon tops
 * changes in 1.3:
 * - implement the studio top api.
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');


/**
 * Max value for integer
 */
var MAX_INT = 2147483647;

/**
 * This is the function that actually get the tops.
 * 
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next The callback to be called after this function is done
 */
var getTops = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        pageIndex,
        pageSize,
        error,
        contestType = connection.params.contestType.toLowerCase(),
        result = {},
        active = false;
    pageIndex = Number(connection.params.pageIndex || 1);
    pageSize = Number(connection.params.pageSize || 50);

    async.waterfall([
        function (cb) {
            if (_.isDefined(connection.params.pageIndex)) {
                error = helper.checkDefined(connection.params.pageSize, "pageSize");
            }
            error = error ||
                helper.checkMaxNumber(pageIndex, MAX_INT, "pageIndex") ||
                helper.checkMaxNumber(pageSize, MAX_INT, "pageSize") ||
                helper.checkPageIndex(pageIndex, "pageIndex") ||
                helper.checkPositiveInteger(pageSize, "pageSize") ||
                helper.checkContains(Object.keys(helper.contestTypes), contestType, "contestType");
            if (error) {
                cb(error);
                return;
            }
            active = helper.contestTypes[contestType].active;
            if (pageIndex === -1) {
                pageIndex = 1;
                pageSize = MAX_INT;
            }
            sqlParams.firstRowIndex = (pageIndex - 1) * pageSize;
            sqlParams.pageSize = pageSize;
            sqlParams.phaseId = helper.contestTypes[contestType].phaseId;
            api.dataAccess.executeQuery(active ? "get_tops_active_count" : "get_tops_count", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {
                cb(new Error('no rows returned from get_tops_count'));
                return;
            }
            var total = rows[0].count;
            result.total = total;
            result.pageIndex = pageIndex;
            result.pageSize = pageIndex === -1 ? total : pageSize;
            result.data = [];
            api.dataAccess.executeQuery(active ? "get_tops_active" : "get_tops", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            var rank = (pageIndex - 1) * pageSize + 1;
            if (rows.length === 0) {
                cb(new NotFoundError("No results found"));
                return;
            }
            rows.forEach(function (row) {
                result.data.push({
                    rank: rank,
                    handle: row.handle,
                    userId: row.coderid,
                    color: helper.getCoderColor(row.rating),
                    rating: row.rating
                });
                rank = rank + 1;
            });
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
};


/**
 * This is the function that actually get the studio tops.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next The callback to be called after this function is done
 */
var getStudioTops = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper, sqlParams = {}, pageIndex, pageSize, error, challengeType = connection.params.challengeType.toLowerCase(), result = {};
    pageIndex = Number(connection.params.pageIndex || 1);
    pageSize = Number(connection.params.pageSize || 10);

    async.waterfall([
        function (cb) {
            if (_.isDefined(connection.params.pageIndex)) {
                error = helper.checkDefined(connection.params.pageSize, 'pageSize');
            }
            if (_.isDefined(connection.params.pageSize)) {
                error = helper.checkDefined(connection.params.pageIndex, 'pageIndex');
            }
            error = error ||
                helper.checkMaxNumber(pageIndex, MAX_INT, "pageIndex") ||
                helper.checkMaxNumber(pageSize, MAX_INT, "pageSize") ||
                helper.checkPageIndex(pageIndex, "pageIndex") ||
                helper.checkPositiveInteger(pageSize, "pageSize") ||
                helper.checkContains(Object.keys(helper.studioContestTypes), challengeType, "challengeType");
            if (error) {
                cb(error);
                return;
            }
            if (pageIndex === -1) {
                pageIndex = 1;
                pageSize = MAX_INT;
            }
            sqlParams.firstRowIndex = (pageIndex - 1) * pageSize;
            sqlParams.pageSize = pageSize;
            sqlParams.phaseId = helper.studioContestTypes[challengeType].phaseId;
            api.dataAccess.executeQuery('get_studio_tops_count', sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {
                cb(new Error('no rows returned from get_tops_count'));
                return;
            }
            if (rows[0].count === 0) {
                cb(new NotFoundError('No results found for Studio Tops.'));
                return;
            }
            var total = rows[0].count;
            result.total = total;
            result.pageIndex = pageIndex;
            result.pageSize = pageIndex === -1 ? total : pageSize;
            result.data = [];
            api.dataAccess.executeQuery('get_studio_tops', sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            var rank = (pageIndex - 1) * pageSize + 1;
            if (rows.length === 0) {
                cb(new NotFoundError("No results found for Studio Tops."));
                return;
            }
            rows.forEach(function (row) {
                result.data.push({
                    rank: rank,
                    handle: row.handle,
                    userId: row.user_id,
                    numberOfWinningSubmissions: row.number_of_winning_submissions
                });
                rank = rank + 1;
            });
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
};

/**
 * The API for getting top users
 */
exports.getTops = {
    name: "getTops",
    description: "getTops",
    inputs : {
        required: ["contestType"],
        optional : ["pageIndex", "pageSize"]
    },
    cacheEnabled: false,
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    transaction : 'read', // this action is read-only
    databases : ["topcoder_dw", "tcs_dw"],
    run : function (api, connection, next) {
        if (this.dbConnectionMap) {
            api.log("Execute getTops#run", 'debug');
            getTops(api, connection, this.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * Sample result from specification for srm top users
 */
var sampleSRMTopUsers;

/**
 * Sample result from specification for marathon top users
 */
var sampleMarathonTopUsers;

/**
 * The API for getting studio top users
 */
exports.getStudioTops = {
    name: "getStudioTops",
    description: "getStudioTops",
    inputs : {
        required: ['challengeType'],
        optional : ['pageIndex', 'pageSize']
    },
    blockedConnectionTypes : [],
    outputExample : {},
    cacheEnabled: false,
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog"],
    version : 'v2',
    run : function (api, connection, next) {
        if (this.dbConnectionMap) {
            api.log("Execute getStudioTops#run", 'debug');
            getStudioTops(api, connection, this.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};


/**
 * The API for getting marathon top users
 */
exports.getMarathonTops = {
    name: "getMarathonTops",
    description: "getMarathonTops",
    inputs : {
        required: ["rankType"],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute getMarathonTops#run", 'debug');
        connection.response = sampleMarathonTopUsers;
        next(connection, true);
    }
};

/**
 * The API for getting srm top users
 */
exports.getSRMTops = {
    name: "getSRMTops",
    description: "getSRMTops",
    inputs : {
        required: ["rankType"],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute getSRMTops#run", 'debug');
        connection.response = sampleSRMTopUsers;
        next(connection, true);
    }
};


sampleMarathonTopUsers = {
    "total": 30,
    "pageIndex": 1,
    "pageSize": 3,
    "data": [
        {
            "Rank": 1,
            "Name": "University of Tokyo",
            "Country": "Japan",
            "Member Count": 73,
            "Rating": 3000
        },
        {
            "Rank": 2,
            "Name": "University of Washington",
            "Country": "USA",
            "Member Count": 73,
            "Rating": 3000
        },
        {
            "Rank": 3,
            "Name": "Tsinghua University",
            "Country": "China",
            "Member Count": 73,
            "Rating": 3000
        }
    ]
};


sampleSRMTopUsers = {
    "total": 30,
    "pageIndex": 1,
    "pageSize": 3,
    "data": [
        {
            "Rank": 1,
            "Name": "University of Tokyo",
            "Country": "Japan",
            "Member Count": 73,
            "Rating": 3000
        },
        {
            "Rank": 2,
            "Name": "University of Washington",
            "Country": "USA",
            "Member Count": 73,
            "Rating": 3000
        },
        {
            "Rank": 3,
            "Name": "Tsinghua University",
            "Country": "China",
            "Member Count": 73,
            "Rating": 3000
        }
    ]
};
