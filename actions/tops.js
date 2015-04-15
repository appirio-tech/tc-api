/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.6
 * @author Sky_, mekanizumu, muzehyun, Ghost_141
 * @changes from 1.0
 * merged with Member Registration API
 * changes in 1.1:
 * - add stub for Top Ranked Members for studio, SRM and Marathon
 * changes in 1.2:
 * - implement marathon tops
 * changes in 1.3:
 * - implement SRM Tops
 * changes in 1.4:
 * Move contestTypes to helper class and rename it to softwareChallengeTypes.
 * changes in 1.5:
 * implement the studio top api.
 * changes in 1.6:
 * implement the top track members of develop, design and data.
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
        challengeType = connection.params.contestType.toLowerCase(),
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
                helper.checkContains(Object.keys(helper.softwareChallengeTypes), challengeType, "challengeType");
            if (error) {
                cb(error);
                return;
            }
            active = helper.softwareChallengeTypes[challengeType].active;
            if (pageIndex === -1) {
                pageIndex = 1;
                pageSize = MAX_INT;
            }
            sqlParams.firstRowIndex = (pageIndex - 1) * pageSize;
            sqlParams.pageSize = pageSize;
            sqlParams.phaseId = helper.softwareChallengeTypes[challengeType].phaseId;
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
                    userId: row.coder_id,
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
                helper.checkMaxNumber(pageIndex, MAX_INT, 'pageIndex') ||
                helper.checkMaxNumber(pageSize, MAX_INT, 'pageSize') ||
                helper.checkPageIndex(pageIndex, 'pageIndex') ||
                helper.checkPositiveInteger(pageSize, 'pageSize') ||
                helper.checkContains(Object.keys(helper.studioChallengeTypes), challengeType, 'challengeType');
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
            sqlParams.phaseId = helper.studioChallengeTypes[challengeType].phaseId;
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
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    transaction : 'read', // this action is read-only
    databases : ["topcoder_dw", "tcs_dw"],
    run : function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getTops#run", 'debug');
            getTops(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for getting studio top users
 */
exports.getStudioTops = {
    name: 'getStudioTops',
    description: 'getStudioTops',
    inputs : {
        required: ['challengeType'],
        optional : ['pageIndex', 'pageSize']
    },
    blockedConnectionTypes : [],
    outputExample : {},
    transaction : 'read', // this action is read-only
    databases : ['tcs_catalog'],
    cacheEnabled: false,
    version : 'v2',
    run : function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute getStudioTops#run', 'debug');
            getStudioTops(api, connection, connection.dbConnectionMap, next);
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
    inputs: {
        required: [],
        optional: ["rankType", "pageIndex", "pageSize"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["topcoder_dw"],
    run: function (api, connection, next) {
        api.log("Execute getMarathonTops#run", 'debug');
        if (!connection.dbConnectionMap) {
            api.helper.handleNoConnection(api, connection, next);
            return;
        }
        var helper = api.helper,
            sqlParams = {},
            pageIndex,
            pageSize,
            error,
            rankType = (connection.params.rankType) ? connection.params.rankType.toLowerCase() : 'competitors',
            dbConnectionMap = connection.dbConnectionMap,
            result = {};
        pageIndex = Number(connection.params.pageIndex || 1);
        pageSize = Number(connection.params.pageSize || 10);

        async.waterfall([
            function (cb) {
                var queryName = "";
                if (_.isDefined(connection.params.pageIndex) && pageIndex !== -1) {
                    error = helper.checkDefined(connection.params.pageSize, "pageSize");
                }
                error = error ||
                    helper.checkMaxNumber(pageIndex, MAX_INT, "pageIndex") ||
                    helper.checkMaxNumber(pageSize, MAX_INT, "pageSize") ||
                    helper.checkPageIndex(pageIndex, "pageIndex") ||
                    helper.checkPositiveInteger(pageSize, "pageSize") ||
                    helper.checkContains(["competitors", "schools", "countries"], rankType, "rankType");
                if (error) {
                    cb(error);
                    return;
                }
                if (pageIndex === -1) {
                    pageIndex = 1;
                    pageSize = MAX_INT;
                }
                switch (rankType) {
                case "competitors":
                    queryName = "get_top_ranked_marathon_members_competitors";
                    break;
                case "schools":
                    queryName = "get_top_ranked_marathon_members_school";
                    break;
                case "countries":
                    queryName = "get_top_ranked_marathon_members_country";
                    break;
                }
                sqlParams.firstRowIndex = (pageIndex - 1) * pageSize;
                sqlParams.pageSize = pageSize;
                async.parallel({
                    data: function (cbx) {
                        api.dataAccess.executeQuery(queryName, sqlParams, dbConnectionMap, cbx);
                    },
                    count: function (cbx) {
                        api.dataAccess.executeQuery(queryName + "_count", {}, dbConnectionMap, cbx);
                    }
                }, cb);
            }, function (results, cb) {
                if (results.data.length === 0) {
                    cb(new NotFoundError("No results found"));
                    return;
                }
                var total = results.count[0].total, rank;
                result.total = total;
                result.pageIndex = pageIndex;
                result.pageSize = Number(connection.params.pageIndex) === -1 ? total : pageSize;
                result.data = [];
                if (rankType === "competitors") {
                    result.data = _.map(results.data, function (ele) {
                        return {
                            rank: ele.rank,
                            handle: ele.handle,
                            rating: ele.rating,
                            country: ele.country
                        };
                    });
                } else {
                    rank = (pageIndex - 1) * pageSize + 1;
                    result.data = _.map(results.data, function (ele) {
                        var obj = {
                            rank: rank,
                            name: ele.name,
                            country: ele.country,
                            memberCount: ele.member_count,
                            rating: ele.rating
                        };
                        if (rankType === "countries") {
                            delete obj.name;
                        }
                        rank = rank + 1;
                        return obj;
                    });
                }
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
};


/**
 * The API for getting srm top users
 */
exports.getSRMTops = {
    name: "getSRMTops",
    description: "getSRMTops",
    inputs: {
        required: [],
        optional: ["rankType", "pageIndex", "pageSize"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["topcoder_dw"],
    run: function (api, connection, next) {
        api.log("Execute getSRMTops#run", 'debug');
        var helper = api.helper,
            sqlParams = {},
            pageIndex,
            pageSize,
            error,
            rankType = (connection.params.rankType) ? connection.params.rankType.toLowerCase() : 'competitors',
            dbConnectionMap = connection.dbConnectionMap,
            result = {};
        if (!connection.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        pageIndex = Number(connection.params.pageIndex || 1);
        pageSize = Number(connection.params.pageSize || 10);

        async.waterfall([
            function (cb) {
                var queryName = "";
                if (_.isDefined(connection.params.pageIndex) && pageIndex !== -1) {
                    error = helper.checkDefined(connection.params.pageSize, "pageSize");
                }
                error = error ||
                    helper.checkMaxNumber(pageIndex, MAX_INT, "pageIndex") ||
                    helper.checkMaxNumber(pageSize, MAX_INT, "pageSize") ||
                    helper.checkPageIndex(pageIndex, "pageIndex") ||
                    helper.checkPositiveInteger(pageSize, "pageSize") ||
                    helper.checkContains(["competitors", "schools", "countries"], rankType, "rankType");
                if (error) {
                    cb(error);
                    return;
                }
                if (pageIndex === -1) {
                    pageIndex = 1;
                    pageSize = MAX_INT;
                }
                switch (rankType) {
                case "competitors":
                    queryName = "get_top_ranked_srm_members_competitor";
                    break;
                case "schools":
                    queryName = "get_top_ranked_srm_members_school";
                    break;
                case "countries":
                    queryName = "get_top_ranked_srm_members_country";
                    break;
                }
                sqlParams.firstRowIndex = (pageIndex - 1) * pageSize;
                sqlParams.pageSize = pageSize;
                async.parallel({
                    data: function (cbx) {
                        api.dataAccess.executeQuery(queryName, sqlParams, dbConnectionMap, cbx);
                    },
                    count: function (cbx) {
                        api.dataAccess.executeQuery(queryName + "_count", sqlParams, dbConnectionMap, cbx);
                    }
                }, cb);
            }, function (results, cb) {
                if (results.data.length === 0) {
                    cb(new NotFoundError("No results found"));
                    return;
                }
                var total = results.count[0].total, rank;
                result.total = total;
                result.pageIndex = pageIndex;
                result.pageSize = Number(connection.params.pageIndex) === -1 ? total : pageSize;
                result.data = [];
                if (rankType === "competitors") {
                    result.data = _.map(results.data, function (ele) {
                        return {
                            rank: ele.rank,
                            handle: ele.handle,
                            rating: ele.rating,
                            country: ele.country
                        };
                    });
                } else {
                    rank = (pageIndex - 1) * pageSize + 1;
                    result.data = _.map(results.data, function (ele) {
                        var obj = {
                            rank: rank,
                            name: ele.name,
                            country: ele.country,
                            memberCount: ele.member_count,
                            rating: ele.rating
                        };
                        if (rankType === "countries") {
                            delete obj.name;
                        }
                        rank = rank + 1;
                        return obj;
                    });
                }
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
};

/**
 * The valid track types
 */
var VALID_TRACK_TYPES = ['design', 'develop', 'data'];

/**
 * Maximum page size
 */
var MAX_PAGE_SIZE = 1000;

/**
 * The API for top track members of develop, design and data.
 */
exports.getTopTrackMembers = {
    name: 'getTopTrackMembers',
    description: 'The API for top track members of develop, design and data.',
    inputs: {
        required: ['trackType'],
        optional: ['pageIndex', 'pageSize']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['topcoder_dw', 'tcs_dw', 'tcs_catalog'],
    run: function (api, connection, next) {
        api.log('Execute getTopTrackMembers#run', 'debug');
        var helper = api.helper,
            trackType = connection.params.trackType.toLowerCase(),
            pageIndex = Number(connection.params.pageIndex || 1),
            pageSize = Number(connection.params.pageSize || 50),
            dbConnectionMap = connection.dbConnectionMap,
            result = {},
            error,
            sqlParams = {};
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                if (_.isDefined(connection.params.pageIndex)) {
                    error = helper.checkDefined(connection.params.pageSize, 'pageSize');
                }
                error = error ||
                    helper.checkMaxNumber(pageIndex, MAX_INT, 'pageIndex') ||
                    helper.checkMaxNumber(pageSize, MAX_PAGE_SIZE, 'pageSize') ||
                    helper.checkPageIndex(pageIndex, 'pageIndex') ||
                    helper.checkPositiveInteger(pageSize, 'pageSize') ||
                    helper.checkContains(VALID_TRACK_TYPES, trackType, 'trackType');
                if (error) {
                    cb(error);
                    return;
                }
                if (pageIndex === -1) {
                    pageIndex = 1;
                    pageSize = MAX_PAGE_SIZE;     // No paging, show max allowed.
                }
                // Retrieves total number of top members for the given track.
                api.dataAccess.executeQuery('get_top_members_' + trackType + '_count', sqlParams, dbConnectionMap, cb);
            }, function (rows, cb) {
                if (rows.length === 0) {
                    cb(new Error('no rows returned from get_top_members_' + trackType + '_count'));
                    return;
                }
                result.total = rows[0].count;
                result.pageIndex = pageIndex;
                result.pageSize = pageSize;
                result.data = [];
                sqlParams.firstRowIndex = (pageIndex - 1) * pageSize;
                sqlParams.pageSize = pageSize;

                if (trackType === "data") {
                    sqlParams.pageSize = 2 * pageIndex * pageSize;
                }
                // Retrieves paged and ordered top members for the given track.
                api.dataAccess.executeQuery('get_top_members_' + trackType, sqlParams, dbConnectionMap, cb);
            }, function (rows, cb) {
                var rank = (pageIndex - 1) * pageSize + 1,
                    handleArr = [],
                    data;
                if (rows.length === 0) {
                    cb(new NotFoundError('No results found'));
                    return;
                }
                if (trackType === "data") {
                    // The original data contains many duplicate data.
                    // For example if a user has algorithm and marathon rating, we just need the highest one from him.
                    // So what we need to do is filter out duplicate rows from results.
                    // Since we sort the query results by its rating in desc then we just need to filter out all rows
                    // that its handle shows up second times.
                    data = _.filter(rows, function (r) {
                        if (handleArr.indexOf(r.handle) > 0) {
                            return false;
                        }
                        handleArr.push(r.handle);
                        return true;
                    });
                    // pagination
                    data = data.slice(sqlParams.firstRowIndex, sqlParams.firstRowIndex + pageSize);

                    result.data = data.map(function (item) {
                        var res =  {
                            rank: rank,
                            handle: item.handle,
                            userId: item.user_id,
                            color: helper.getCoderColor(item.rating),
                            rating: item.rating,
                            highestRatingType: item.challenge_type.trim()
                        };
                        rank = rank + 1;
                        return res;
                    });
                } else {
                    rows.forEach(function (row) {
                        var color, highestRatingType;
                        switch (trackType) {
                        case 'design':
                            color = 'N/A';
                            break;
                        case 'develop':
                            color = helper.getCoderColor(row.rating);
                            highestRatingType = helper.getPhaseName(row.phase_id);
                            break;
                        }
                        result.data.push({
                            rank: rank,
                            handle: row.handle,
                            userId: row.coder_id,
                            color: color,
                            rating: row.rating,
                            highestRatingType: highestRatingType
                        });
                        rank = rank + 1;
                    });
                }

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
};
