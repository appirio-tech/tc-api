/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";


require('datejs');
var async = require('async');
var _ = require('underscore');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');


/**
 * Represents a ListType enum
 */
var ListType = { ACTIVE: "ACTIVE", OPEN: "OPEN", UPCOMING: "UPCOMING", PAST: "PAST" };

/**
 * Represents a predefined list of valid list type.
 */
var ALLOWABLE_LIST_TYPE = [ListType.ACTIVE, ListType.OPEN, ListType.UPCOMING, ListType.PAST];

/**
 * Represents a predefined list of valid sort column for active contest.
 */
var ALLOWABLE_SORT_COLUMN = [
    "type", "contestName", "startDate", "round1EndDate", "endDate",
    "timeLeft", "prize", "points", "registrants", "submissions"
];

var FILTER_COLUMS = [
    "type",
    "contestName",
    "startDate.type",
    "startDate.firstDate",
    "startDate.secondDate",
    "round1EndDate.type",
    "round1EndDate.firstDate",
    "round1EndDate.secondDate",
    "endDate.type",
    "endDate.firstDate",
    "endDate.secondDate",
    "prizeLowerBound",
    "prizeUpperBound",
    "cmc"
];

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
 * Map property name from API to column name in db script
 */
var apiName2dbMap = {
    type: "type_name",
    contestname: "name",
    startdate: "start_time",
    round1enddate: "milestone_date",
    enddate: "end_time",
    timeleft: "time_left",
    prize: "prize_total",
    points: "dr_points",
    registrants: "registrants",
    submissions: "submission_count"
};


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
 * The API for searching contests
 */
exports.searchStudioContests = {
    name: "searchStudioContests",
    description: "searchStudioContests",
    inputs: {
        required: [],
        optional: ["listType", "pageSize", "pageIndex", "sortColumn", "sortOrder"].concat(FILTER_COLUMS)
    },
    blockedConnectionTypes: [],
    outputExample: {},
    cacheEnabled: false,
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["tcs_catalog"],
    run: function (api, connection, next) {
        api.log("Execute searchStudioContests#run", 'debug');
        if (!this.dbConnectionMap) {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = { message: "No connection object." };
            next(connection, true);
            return;
        }
        var helper = api.helper, params = connection.params, sqlParams,
            pageIndex, pageSize, sortColumn, sortOrder, listType, error, result,
            dbConnectionMap = this.dbConnectionMap, filter = {};

        sortOrder = (params.sortOrder || "asc").toLowerCase();
        sortColumn = (params.sortColumn || "contestName").toLowerCase();
        listType = (params.listType || ListType.ACTIVE).toUpperCase();
        pageIndex = Number(params.pageIndex || 1);
        pageSize = Number(params.pageSize || 50);

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
        filter.round1EndDate = createDate(
            params["round1EndDate.type"],
            params["round1EndDate.firstDate"],
            params["round1EndDate.secondDate"]
        );
        filter.endDate = createDate(
            params["endDate.type"],
            params["endDate.firstDate"],
            params["endDate.secondDate"]
        );
        filter.type = params.type;
        filter.contestName = params.contestName;
        filter.cmc = params.cmc;
        filter.prizeLowerBound = Number(params.prizeLowerBound || 0);
        filter.prizeUpperBound = Number(params.prizeUpperBound || MAX_INT);

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
                    helper.checkNonNegativeNumber(filter.prizeLowerBound, "prizeLowerBound") ||
                    helper.checkNonNegativeNumber(filter.prizeUpperBound, "prizeUpperBound") ||
                    helper.checkFilterDateOptional(filter.startDate, "startDate") ||
                    helper.checkFilterDateOptional(filter.round1EndDate, "round1EndDate") ||
                    helper.checkFilterDateOptional(filter.endDate, "endDate");
                if (error) {
                    cb(error);
                    return;
                }

                if (listType === ListType.PAST && sortColumn === "timeleft") {
                    cb(new IllegalArgumentError("sortColumn timeLeft is not supported for listType PAST"));
                    return;
                }

                if (pageIndex === -1) {
                    pageIndex = 1;
                    pageSize = MAX_INT;
                }
                sqlParams = {
                    fri: (pageIndex - 1) * pageSize,
                    ps: pageSize,
                    sc: apiName2dbMap[sortColumn],
                    sdir: sortOrder,
                    type_name: filter.type || "",
                    name: filter.contestName || "",
                    cmc: filter.cmc || "",
                    prize_lower: filter.prizeLowerBound,
                    prize_upper: filter.prizeUpperBound,
                    start_time_end: MAX_DATE,
                    start_time_start: MIN_DATE,
                    end_time_end: MAX_DATE,
                    end_time_start: MIN_DATE,
                    milestone_date_end: MAX_DATE,
                    milestone_date_start: MIN_DATE
                };
                if (filter.startDate) {
                    setDateToParams(helper, sqlParams, filter.startDate, "start_time_");
                }
                if (filter.endDate) {
                    setDateToParams(helper, sqlParams, filter.endDate, "end_time_");
                }
                if (filter.round1EndDate) {
                    setDateToParams(helper, sqlParams, filter.round1EndDate, "milestone_date_");
                }
                switch (listType) {
                case ListType.ACTIVE:
                    scriptName = "get_studio_contests_active";
                    break;
                case ListType.OPEN:
                    scriptName = "get_studio_contests_open";
                    break;
                case ListType.PAST:
                    scriptName = "get_studio_contests_past";
                    break;
                case ListType.UPCOMING:
                    scriptName = "get_studio_contests_upcoming";
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
                var total = results.count[0].total_count;
                result = {
                    data: [],
                    total: total,
                    pageIndex: pageIndex,
                    pageSize: Number(params.pageIndex) === -1 ? total : pageSize
                };
                results.data.forEach(function (item) {
                    var days = Math.ceil(item.time_left / (60 * 24)), contest; //minutes to days
                    contest = {
                        challengeType: item.type_name,
                        challengeName: item.name,
                        startDate: item.start_time,
                        round1EndDate: item.milestone_date,
                        endDate: item.end_time,
                        timeLeft: days + (days === 1 ? " day" : " days"),
                        prize: item.prize_total,
                        points: item.dr_points,
                        registrants: item.registrants,
                        submissions: item.submission_count,
                        cmc: item.cmc || ""
                    };
                    if (listType === ListType.PAST) {
                        delete contest.timeLeft;
                    }
                    result.data.push(contest);
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


/**
 * The API for getting studio contest
 */
exports.getStudioContest = {
    name: "getStudioContest",
    description: "getStudioContest",
    inputs: {
        required: ["contestId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["tcs_catalog", "tcs_dw"],
    run: function (api, connection, next) {
        api.log("Execute getStudioContest#run", 'debug');
        if (!this.dbConnectionMap) {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = { message: "No connection object." };
            next(connection, true);
            return;
        }
        var helper = api.helper,
            contestId = Number(connection.params.contestId),
            result,
            dbConnectionMap = this.dbConnectionMap;

        async.waterfall([
            function (cb) {
                var error = helper.checkPositiveInteger(contestId, "contestId") ||
                        helper.checkMaxNumber(contestId, MAX_INT, "contestId");
                cb(error);
            },
            function (cb) {
                var execQuery = function (name) {
                    return function (cbx) {
                        api.dataAccess.executeQuery(name,
                            { ct: contestId },
                            dbConnectionMap,
                            cbx);
                    };
                };
                async.parallel({
                    details: execQuery("get_studio_contest_detail"),
                    checkpoints: execQuery("get_studio_contest_detail_checkpoints"),
                    prize: execQuery("get_studio_contest_detail_prize"),
                    submissions: execQuery("get_studio_contest_detail_submissions"),
                    winners: execQuery("get_studio_contest_detail_winners")
                }, cb);
            }, function (results, cb) {
                if (results.details.length === 0) {
                    cb(new NotFoundError("Contest not found"));
                    return;
                }
                var mapCheckpointOrSubmission = function (s) {
                    return {
                        submissionId: s.submission_id,
                        submitter: s.handle,
                        submissionTime: s.create_date
                    };
                },
                    details = results.details[0];
                result = {
                    challengeType: details.challengetype,
                    challengeName: details.challengename,
                    detailedRequirements: helper.convertToString(details.detailedrequirements),
                    prize: _.map(results.prize, function (s) {
                        return s.amount;
                    }),
                    numberOfCheckpointsPrizes: details.numberofcheckpointsprizes,
                    topCheckPointPrize: details.topcheckpointprize,
                    digitalRunPoints: details.dr_point,
                    currentPhaseEndDate: details.currentphaseenddate,
                    currentStatus: details.currentstatus.trim(),
                    checkpoints: _.map(results.checkpoints, mapCheckpointOrSubmission),
                    submissions: _.map(results.submissions, mapCheckpointOrSubmission),
                    winners: _.map(results.winners, function (s) {
                        return {
                            submissionId: s.submission_id,
                            submitter: s.submitter,
                            submissionTime: s.submission_time,
                            points: s.points,
                            rank: s.rank
                        };
                    })
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
