/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * - implement marathon API
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');


/**
 * Represents a ListType enum
 */
var ListType = { ACTIVE: "ACTIVE", PAST: "PAST" };

/**
 * Represents a predefined list of valid list type.
 */
var ALLOWABLE_LIST_TYPE = [ListType.ACTIVE, ListType.PAST];

/**
 * Represents a predefined list of valid sort column.
 */
var ALLOWABLE_SORT_COLUMN = [
    "roundId", "fullName", "shortName", "startDate", "endDate",
    "winnerHandle", "winnerScore"
];

/**
 * Represents columns for marathon data in search API
 */
var SEARCH_API_COLUMNS = ALLOWABLE_SORT_COLUMN;

/**
 * Represents columns returned by get_marathon_match_detail_basic query
 */
var DETAILS_BASIC_COLUMNS = ["roundId", "fullName", "shortName", "numberOfRegistrants", "numberOfSubmissions",
    "numberOfCompetitors", "startDate", "endDate", "systemTestDate", "winnerHandle", "winnerScore"];

/**
 * Represents columns returned by get_marathon_match_detail_registrants_rating_summary query
 */
var DETAILS_SUMMARY_COLUMNS = ["color", "numberOfMembers"];

/**
 * Max value for integer
 */
var MAX_INT = 2147483647;
/**
 * Min date for sql query
 */
var MIN_DATE = "1900-01-01";
/**
 * Max date for sql query
 */
var MAX_DATE = "2199-01-01";
/**
 * This data format instance will transfer date to a string that can use in query.
 */
var databaseDateFormat = "yyyy-MM-dd";

/**
 * Allowed parameters for filtering
 */
var FILTER_COLUMS = [
    "roundId",
    "fullName",
    "shortName",
    "startDate.type",
    "startDate.firstDate",
    "startDate.secondDate",
    "endDate.type",
    "endDate.firstDate",
    "endDate.secondDate",
    "winnerScoreLowerBound",
    "winnerScoreUpperBound",
    "winnerHandle"
];


/**
 * Set the date to request by given input.
 *
 * @param {Object} sqlParams - the data access request.
 * @param {Object} dateInterval - the date interval from filter.
 * @param {String} inputCodePrefix - the input code prefix.
 */
function setDateToParams(helper, sqlParams, dateInterval, inputCodePrefix) {
    var dateType = dateInterval.type,
        firstDate = new Date(dateInterval.firstDate).toString(databaseDateFormat),
        secondDate = new Date(dateInterval.secondDate).toString(databaseDateFormat),
        today = new Date().toString(databaseDateFormat);

    if (dateType.toUpperCase() === helper.consts.BEFORE) {
        sqlParams[inputCodePrefix + "end"] = firstDate;
    } else if (dateType.toUpperCase() === helper.consts.AFTER) {
        sqlParams[inputCodePrefix + "start"] = firstDate;
    } else if (dateType.toUpperCase() === helper.consts.ON) {
        sqlParams[inputCodePrefix + "start"] = firstDate;
        sqlParams[inputCodePrefix + "end"] = firstDate;
    } else if (dateType.toUpperCase() === helper.consts.BEFORE_CURRENT_DATE) {
        sqlParams[inputCodePrefix + "end"] = today;
    } else if (dateType.toUpperCase() === helper.consts.AFTER_CURRENT_DATE) {
        sqlParams[inputCodePrefix + "start"] = today;
    } else if (dateType.toUpperCase() === helper.consts.BETWEEN_DATES) {
        sqlParams[inputCodePrefix + "start"] = firstDate;
        sqlParams[inputCodePrefix + "end"] = secondDate;
    }
}

/**
* The API for searching Marathon challenges
*/
exports.searchMarathonChallenges = {
    name: "searchMarathonChallenges",
    description: "searchMarathonChallenges",
    inputs: {
        required: [],
        optional: ["listType", "pageSize", "pageIndex", "sortColumn", "sortOrder"].concat(FILTER_COLUMS)
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["topcoder_dw", "informixoltp"],
    run: function (api, connection, next) {
        var helper = api.helper, params = connection.params, sqlParams,
            pageIndex, pageSize, sortColumn, sortOrder, listType, error, result,
            dbConnectionMap = this.dbConnectionMap, filter = {};
        if (!this.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }

        listType = (params.listType || ListType.ACTIVE).toUpperCase();
        sortOrder = (params.sortOrder || "asc").toLowerCase();
        sortColumn = (params.sortColumn || "roundId").toLowerCase();
        pageIndex = Number(params.pageIndex || 1);
        pageSize = Number(params.pageSize || 50);

        if (!_.isDefined(params.sortOrder) && sortColumn === "roundid") {
            sortOrder = "desc";
        }

        //create date or return null if all properties are null
        function createDate(type, firstDate, secondDate) {
            if (!type && !firstDate && !secondDate) {
                return null;
            }
            return {
                type: String(type).toUpperCase(),
                firstDate: firstDate,
                secondDate: secondDate
            };
        }
        filter.startDate = createDate(
            params["startDate.type"],
            params["startDate.firstDate"],
            params["startDate.secondDate"]
        );
        filter.endDate = createDate(
            params["endDate.type"],
            params["endDate.firstDate"],
            params["endDate.secondDate"]
        );
        filter.roundId = params.roundId ? Number(params.roundId) : null;
        filter.fullName = params.fullName;
        filter.shortName = params.shortName;
        filter.winnerHandle = params.winnerHandle;
        filter.winnerScoreLowerBound = Number(params.winnerScoreLowerBound || 0);
        filter.winnerScoreUpperBound = Number(params.winnerScoreUpperBound || 1e50);

        async.waterfall([
            function (cb) {
                var allowedSort = helper.getLowerCaseList(ALLOWABLE_SORT_COLUMN), scriptName;
                if (_.isDefined(params.pageIndex) && pageIndex !== -1) {
                    error = helper.checkDefined(params.pageSize, "pageSize");
                }
                error = error ||
                    helper.checkMaxNumber(pageIndex, MAX_INT, "pageIndex") ||
                    helper.checkMaxNumber(pageSize, MAX_INT, "pageSize") ||
                    helper.checkPageIndex(pageIndex, "pageIndex") ||
                    helper.checkPositiveInteger(pageSize, "pageSize") ||
                    helper.checkContains(ALLOWABLE_LIST_TYPE, listType, "listType") ||
                    helper.checkContains(["asc", "desc"], sortOrder, "sortOrder") ||
                    helper.checkContains(allowedSort, sortColumn, "sortColumn") ||
                    helper.checkNonNegativeNumberOptional(filter.roundId, "roundId") ||
                    helper.checkNonNegativeNumber(filter.winnerScoreLowerBound, "winnerScoreLowerBound") ||
                    helper.checkNonNegativeNumber(filter.winnerScoreUpperBound, "winnerScoreUpperBound") ||
                    helper.checkFilterDateOptional(filter.startDate, "startDate") ||
                    helper.checkFilterDateOptional(filter.endDate, "endDate");
                if (error) {
                    cb(error);
                    return;
                }

                if (listType === ListType.ACTIVE && ["winnerhandle", "winnerscore"].indexOf(sortColumn) !== -1) {
                    cb(new IllegalArgumentError("sortColumn " + sortColumn + " is not supported for listType ACTIVE"));
                    return;
                }

                if (pageIndex === -1) {
                    pageIndex = 1;
                    pageSize = MAX_INT;
                }
                sqlParams = {
                    fri: (pageIndex - 1) * pageSize,
                    ps: pageSize,
                    sc: sortColumn,
                    sdir: sortOrder,
                    round_id: filter.roundId || 0,
                    full_name: filter.fullName || "",
                    short_name: filter.shortName || "",
                    winner_handle: filter.winnerHandle || "",
                    score_lower: filter.winnerScoreLowerBound,
                    score_upper: filter.winnerScoreUpperBound,
                    start_time_end: MAX_DATE,
                    start_time_start: MIN_DATE,
                    end_time_end: MAX_DATE,
                    end_time_start: MIN_DATE
                };
                if (filter.startDate) {
                    setDateToParams(helper, sqlParams, filter.startDate, "start_time_");
                }
                if (filter.endDate) {
                    setDateToParams(helper, sqlParams, filter.endDate, "end_time_");
                }
                switch (listType) {
                case ListType.ACTIVE:
                    dbConnectionMap.topcoder_dw.disconnect(); //Solution for multiple connection bug
                    scriptName = "get_marathon_match_active_challenges";
                    break;
                case ListType.PAST:
                    scriptName = "get_marathon_match_past_challenges";
                    break;
                }
                async.parallel({
                    count: function (cbx) {
                        api.dataAccess.executeQuery(scriptName + "_count",
                            sqlParams,
                            dbConnectionMap,
                            cbx);
                    },
                    data: function (cbx) {
                        api.dataAccess.executeQuery(scriptName,
                            sqlParams,
                            dbConnectionMap,
                            cbx);
                    }
                }, cb);
            }, function (results, cb) {
                if (results.data.length === 0) {
                    cb(new NotFoundError("No results found"));
                    return;
                }
                var total = results.count[0].totalcount;
                result = {
                    data: _.map(results.data, function (item) {
                        var contest = helper.mapProperties(item, SEARCH_API_COLUMNS);
                        if (listType === ListType.ACTIVE) {
                            delete contest.winnerHandle;
                            delete contest.winnerScore;
                        }
                        return contest;
                    }),
                    total: total,
                    pageIndex: pageIndex,
                    pageSize: Number(params.pageIndex) === -1 ? total : pageSize
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
};

/**
 * Compute progressResources field for contest details
 * 
 * @param {Array<Object>} submissions - the submissions. Result of detail_progress_XXX query.
 * @param {Array<Object>} registrants - the registrants. Result of detail_progress_XXX_registrants query.
 * @param {Array<Object>} competitors - the competitors. Result of detail_progress_competitors query.
 * @param {Number|String} interval - the interval between each progress resource in hours or "m" if interval is month.
 * @param {String} interval - the startTime.
 * @param {String} interval - the endTime.
 * @return {Array<Object>} the computed array
 */
function computeProgressResources(submissions, registrants, competitors, interval, startTime, endTime) {
    var i, score, handle, h, users, d1, items = [], item;
    if (registrants.length === 0) {
        return [];
    }

    startTime = new Date(startTime).getTime();
    endTime = new Date(endTime).getTime();
    //generate all intervals between startTime and endTime
    do {
        if (interval === "m") {
            d1 = new Date(startTime);
            h = d1.getUTCHours();
            d1.setMonth(d1.getMonth() + 1);
            d1.setUTCHours(h); //timezone issue
            startTime = d1.getTime();
        } else {
            startTime = startTime + interval * 1000 * 60 * 60;
        }
        if (startTime > endTime) {
            startTime = endTime;
        }
        items.push({
            currentTopProvisionalScore: 0,
            currentNoOfSubmissions: 0,
            currentNoOfCompetitors: 0,
            currentNoOfRegistrants: 0,
            date: new Date(startTime).toISOString(),
            topUserHandle: ""
        });
    } while (startTime < endTime);

    //compute currentNoOfRegistrants
    i = 0;
    registrants.forEach(function (reg) {
        while (i < items.length) {
            item = items[i];
            if (new Date(reg.date).getTime() <= new Date(item.date).getTime()) {
                item.currentNoOfRegistrants = item.currentNoOfRegistrants +
                    reg.currentnoofregistrants;
                break;
            } else {
                i = i + 1;
            }
        }
    });

    //compute currentNoOfCompetitors
    users = {};
    i = 0;
    competitors.forEach(function (comp) {
        while (i < items.length) {
            item = items[i];
            if (new Date(comp.submit_time).getTime() <= new Date(item.date).getTime()) {
                users[comp.coder_id] = true;
                item.currentNoOfCompetitors = Object.keys(users).length;
                break;
            } else {
                users = {};
                i = i + 1;
            }
        }
    });

    //compute currentNoOfSubmissions, currentTopProvisionalScore and topUserHandle
    score = -1;
    handle = "";
    i = 0;
    submissions.forEach(function (sub) {
        while (i < items.length) {
            item = items[i];
            if (new Date(sub.date).getTime() <= new Date(item.date).getTime()) {
                item.currentNoOfSubmissions = item.currentNoOfSubmissions + sub.currentnoofsubmissions;
                if (score < sub.currenttopprovisionalscore) {
                    score = sub.currenttopprovisionalscore;
                    handle = sub.topuserhandle;
                    item.currentTopProvisionalScore = score;
                    item.topUserHandle = handle;
                }
                break;
            } else {
                score = -1;
                handle = "";
                i = i + 1;
            }
        }
    });


    return _.filter(items, function (ele) {
        return ele.currentNoOfSubmissions +
            ele.currentNoOfCompetitors +
            ele.currentNoOfRegistrants !== 0;
    });
}

/**
* The API for getting Marathon challenge
*/
exports.getMarathonChallenge = {
    name: "getMarathonChallenge",
    description: "getMarathonChallenge",
    inputs: {
        required: ["id"],
        optional: ["groupType"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        api.log("Execute getMarathonChallenge#run", 'debug');
        var dbConnectionMap = this.dbConnectionMap,
            id = Number(connection.params.id),
            helper = api.helper,
            groupType = (connection.params.groupType || "day").toLowerCase(),
            sqlParams = {
                rd: id
            },
            result = {};
        if (!this.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                var error = helper.checkPositiveInteger(id, "id") ||
                    helper.checkMaxNumber(id, MAX_INT, "id") ||
                    helper.checkContains(["day", "hour", "month", "week"], groupType, "groupType");
                cb(error);
            },
            function (cb) {
                var execQuery = function (name) {
                    return function (cbx) {
                        api.dataAccess.executeQuery("get_marathon_match_detail_" + name,
                            sqlParams,
                            dbConnectionMap,
                            cbx);
                    };
                };
                async.parallel({
                    basic: execQuery("basic"),
                    hour: execQuery("progress_hour"),
                    hourRegistrants: execQuery("progress_hour_registrants"),
                    summary: execQuery("registrants_rating_summary"),
                    competitors: execQuery("progress_competitors")
                }, cb);
            }, function (results, cb) {
                if (results.basic.length === 0) {
                    cb(new NotFoundError("Marathon challenge not found"));
                    return;
                }
                var details = results.basic[0], interval = "";
                switch (groupType) {
                case "hour":
                    interval = 1;
                    break;
                case "day":
                    interval = 24;
                    break;
                case "week":
                    interval = 24 * 7;
                    break;
                case "month":
                    interval = "m";
                    break;
                default:
                }
                result = helper.mapProperties(details, DETAILS_BASIC_COLUMNS);

                //no winner
                if (_.isNaN(result.winnerScore) && result.winnerHandle === "null") {
                    delete result.winnerHandle;
                    delete result.winnerScore;
                }
                result.currentProgress = {
                    groupType: groupType.toUpperCase(),
                    progressResources: computeProgressResources(results.hour,
                        results.hourRegistrants, results.competitors, interval, details.startdate, details.enddate)
                };
                result.registrantsRatingSummary = _.map(results.summary, function (p) {
                    var ret = helper.mapProperties(p, DETAILS_SUMMARY_COLUMNS);
                    ret.color = ret.color.trim();
                    return ret;
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
    }
};
