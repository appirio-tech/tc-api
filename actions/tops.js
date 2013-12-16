/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author Sky_, mekanizumu
 * @changes from 1.0
 * merged with Member Registration API
 * changes in 1.1:
 * - add stub for Top Ranked Members for studio, SRM and Marathon
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
 * The contests types
 */
var contestTypes = {
    design: {
        name: "Design",
        phaseId: 112
    },
    development: {
        name: "Development",
        phaseId: 113,
        active: true
    },
    conceptualization: {
        name: "Conceptualization",
        phaseId: 134
    },
    specification: {
        name: "Specification",
        phaseId: 117
    },
    architecture: {
        name: "Architecture",
        phaseId: 118
    },
    assembly: {
        name: "Assembly",
        phaseId: 125
    },
    test_suites: {
        name: "Test Suites",
        phaseId: 124
    },
    test_scenarios: {
        name: "Test Scenarios",
        phaseId: 137
    },
    ui_prototype: {
        name: "UI Prototype",
        phaseId: 130
    },
    ria_build: {
        name: "RIA Build",
        phaseId: 135
    },
    content_creation: {
        name: "Content Creation",
        phaseId: 146
    }
};


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
                error = helper.checkDefined(connection.params.pageSize);
            }
            error = error ||
                helper.checkMaxNumber(pageIndex, MAX_INT, "pageIndex") ||
                helper.checkMaxNumber(pageSize, MAX_INT, "pageSize") ||
                helper.checkPageIndex(pageIndex, "pageIndex") ||
                helper.checkPositiveInteger(pageSize, "pageSize") ||
                helper.checkContains(Object.keys(contestTypes), contestType, "contestType");
            if (error) {
                cb(error);
                return;
            }
            active = contestTypes[contestType].active;
            if (pageIndex === -1) {
                pageIndex = 1;
                pageSize = MAX_INT;
            }
            sqlParams.fri = (pageIndex - 1) * pageSize;
            sqlParams.ps = pageSize;
            sqlParams.phaseId = contestTypes[contestType].phaseId;
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
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};

/**
 * Sample result from specification for studio top users
 */
var sampleStudioTopUsers;

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
        required: [],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute getStudioTops#run", 'debug');
        connection.response = sampleStudioTopUsers;
        next(connection, true);
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

sampleStudioTopUsers = {
    "total": 30,
    "pageIndex": 1,
    "pageSize": 3,
    "data": [
        {
            "Rank": 1,
            "Handle": "Petr",
            "userId": 123457898,
            "Color": "Red",
            "numberOfWinningSubmissions": 3000
        },
        {
            "Rank": 2,
            "Handle": "ACRush",
            "userId": 123457899,
            "Color": "Red",
            "numberOfWinningSubmissions": 2500
        },
        {
            "Rank": 3,
            "Handle": "lympanda",
            "userId": 123457891,
            "Color": "Yellow",
            "numberOfWinningSubmissions": 2000
        }
    ]
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
