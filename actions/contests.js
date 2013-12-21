/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.3
 * @author Sky_, mekanizumu, TCSASSEMBLER
 * @changes from 1.0
 * merged with Member Registration API
 * changes in 1.1:
 * 1. add stub for Get Studio Contest Detail
 * changes in 1.2:
 * 1. Add an optional parameter to search contest api - cmc
 * 2. Display cmc value search contest and contest detail API response.
 * 3. Remove contest description from search contest API response.
 * changes in 1.3:
 * 1. move studio API to separated file
 */
"use strict";

require('datejs');
var async = require('async');
var S = require('string');
var _ = require('underscore');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');

/**
 * Represents the sort column value. This value will be used in log, check, get information from request etc.
 */
var SORT_COLUMN = "sortColumn";

/**
 * Represents the default sort column.
 */
var DEFAULT_SORT_COLUMN = "contestName";

/**
 * Represents a predefined list of valid query parameter for active contest.
 */
var ALLOWABLE_QUERY_PARAMETER = [
    "listType", "type", "catalog", "contestName", "registrationStartDate.type",
    "registrationStartDate.firstDate", "registrationStartDate.secondDate", "submissionEndDate.type",
    "submissionEndDate.firstDate", "submissionEndDate.secondDate", "projectId", SORT_COLUMN,
    "sortOrder", "pageIndex", "pageSize", "prizeLowerBound", "prizeUpperBound", "cmc"];

/**
 * Represents a predefined list of valid sort column for active contest.
 */
var ALLOWABLE_SORT_COLUMN = [
    "type", "catalog", "contestName", "numberOfSubmissions", "numberOfRatedRegistrants", "numberOfUnratedRegistrants",
    "registrationEndDate", "submissionEndDate", "firstPrize", "digitalRunPoints", "contestId",
    "projectId", "reliabilityBonus"
];

/**
 * Represents a ListType enum
 */
var ListType = { ACTIVE: "ACTIVE", OPEN: "OPEN", UPCOMING: "UPCOMING", PAST: "PAST" };

/**
 * Represents a predefined list of valid list type.
 */
var ALLOWABLE_LIST_TYPE = [ListType.ACTIVE, ListType.OPEN, ListType.UPCOMING, ListType.PAST];

/**
 * Represents Percentage of Placement Points for digital run
 */
var DR_POINT = [[1], [0.7, 0.3], [0.65, 0.25, 0.10], [0.6, 0.22, 0.1, 0.08], [0.56, 0.2, 0.1, 0.08, 0.06]];

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
 * Project_type_id for Software category
 */
var SOFTWARE_CATEGORY = [1, 2];


/**
 * Project_type_id for Studio category
 */
var STUDIO_CATEGORY = [3];


/**
 * The list type command multiple value map. This map will used to store the mapped query/command name for each
 * contest type.
 */
var LIST_TYPE_COMMAND_MAP = {};
LIST_TYPE_COMMAND_MAP[ListType.ACTIVE] = ["search_active_contest", "search_active_contest_count"];
LIST_TYPE_COMMAND_MAP[ListType.OPEN] = ["search_open_contest", "search_open_contest_count"];
LIST_TYPE_COMMAND_MAP[ListType.UPCOMING] = ["search_upcoming_contest", "search_upcoming_contest_count"];
LIST_TYPE_COMMAND_MAP[ListType.PAST] = ["search_past_contest", "search_past_contest_count"];


/**
 * This data format instance will transfer date to a string that can use in query.
 */
var databaseDateFormat = "yyyy-MM-dd";


/**
 * This method will used to check the query parameter and sort column of the request.
 *
 * @param {Object} helper - the helper.
 * @param {String} type - the contest type.
 * @param {Object} queryString - the query string object
 * @param {String} sortColumn - the sort column from the request.
 * @param {Object} allowableValuesMap - a multiple map contains the allowed sort column
 *      and query parameter for all four types.
 */
function checkQueryParameterAndSortColumn(helper, type, queryString, sortColumn) {
    var allowedQuery = helper.getLowerCaseList(ALLOWABLE_QUERY_PARAMETER),
        allowedSort = helper.getLowerCaseList(ALLOWABLE_SORT_COLUMN),
        currentQuery = helper.getLowerCaseList(Object.keys(queryString)),
        error;
    currentQuery.forEach(function (n) {
        if (allowedQuery.indexOf(n) === -1) {
            error = error ||
                new IllegalArgumentError("The query parameter contains invalid parameter for contest type '" +
                    type + "'.");
        }
    });
    if (allowedSort.indexOf(sortColumn.toLowerCase()) === -1) {
        error = error || new IllegalArgumentError("The sort column '" + sortColumn +
            "' is invalid for contest type '" + type + "'.");
    }
    return error;
}


/**
 * This method is used to validate input parameter of the request.
 * @param {Object} helper - the helper.
 * @param {Object} query - the query string.
 * @param {Object} filter - the filter.
 * @param {Integer} pageIndex - the page index.
 * @param {Integer} pageSize - the page size.
 * @param {String} sortColumn - the sort column.
 * @param {String} sortOrder - the sort order.
 * @param {String} type - the type of contest.
 * @param {Function<err>} callback - the callback function.
 */
function validateInputParameter(helper, query, filter, pageIndex, pageSize, sortColumn, sortOrder, type, dbConnectionMap, callback) {
    var error = helper.checkContains(['asc', 'desc'], sortOrder, "sortOrder") ||
            helper.checkPageIndex(pageIndex, "pageIndex") ||
            helper.checkPositiveInteger(pageSize, "pageSize") ||
            helper.checkContains(ALLOWABLE_LIST_TYPE, type.toUpperCase(), "type") ||
            checkQueryParameterAndSortColumn(helper, type, query, sortColumn);

    if (_.isDefined(filter.registrationStartDate)) {
        error = error || helper.checkFilterDate(filter.registrationStartDate, "registrationStartDate");
    }
    if (_.isDefined(filter.submissionEndDate)) {
        error = error || helper.checkFilterDate(filter.submissionEndDate, "submissionEndDate");
    }
    if (_.isDefined(filter.contestFinalizationDate)) {
        error = error || helper.checkFilterDate(filter.contestFinalizationDate, "contestFinalizationDate");
    }
    if (_.isDefined(filter.projectId)) {
        error = error || helper.checkPositiveInteger(Number(filter.projectId), "projectId");
    }
    if (_.isDefined(filter.prizeLowerBound)) {
        error = error || helper.checkNonNegativeNumber(Number(filter.prizeLowerBound), "prizeLowerBound");
    }
    if (_.isDefined(filter.prizeUpperBound)) {
        error = error || helper.checkNonNegativeNumber(Number(filter.prizeUpperBound), "prizeUpperBound");
    }
    if (error) {
        callback(error);
        return;
    }
    if (_.isDefined(query.type)) {
        helper.isCategoryNameValid(query.type, dbConnectionMap, callback);
    } else {
        callback();
    }
}

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
 * This method will set up filter for sql query.
 *
 * @param {Object} helper - the helper.
 * @param {String} listType - the type of searching contest.
 * @param {Object} filter - the filter from http request.
 * @param {Object} sqlParams - the parameters for sql query.
 */
function setFilter(helper, listType, filter, sqlParams) {
    sqlParams.pjn = "%";
    sqlParams.hn = "%";
    sqlParams.prilower = 0;
    sqlParams.priupper = MAX_INT;
    sqlParams.tcdirectid = 0;

    sqlParams.registstartend = MAX_DATE;
    sqlParams.subendend = MAX_DATE;
    sqlParams.frendend = MAX_DATE;
    sqlParams.fractualend = MAX_DATE;
    sqlParams.frendend = MAX_DATE;

    sqlParams.registstartstart = MIN_DATE;
    sqlParams.subendstart = MIN_DATE;
    sqlParams.frendstart = MIN_DATE;
    sqlParams.fractualstart = MIN_DATE;
    sqlParams.frendstart = MIN_DATE;

    if (_.isDefined(filter.type)) {
        sqlParams.ctn = filter.type.toLowerCase();
    }
    if (_.isDefined(filter.catalog)) {
        sqlParams.catalog = filter.catalog.toLowerCase();
    }
    if (_.isDefined(filter.contestName)) {
        sqlParams.pjn = "%" + filter.contestName.toLowerCase() + "%";
    }
    if (_.isDefined(filter.prizeLowerBound)) {
        sqlParams.prilower = filter.prizeLowerBound.toLowerCase();
    }
    if (_.isDefined(filter.prizeUpperBound)) {
        sqlParams.priupper = filter.prizeUpperBound.toLowerCase();
    }
    if (_.isDefined(filter.registrationStartDate)) {
        setDateToParams(helper, sqlParams, filter.registrationStartDate, "registstart");
    }
    if (_.isDefined(filter.submissionEndDate)) {
        setDateToParams(helper, sqlParams, filter.submissionEndDate, "subend");
    }
    if (_.isDefined(filter.contestFinalizationDate)) {
        switch (listType) {
        case ListType.ACTIVE:
            setDateToParams(helper, sqlParams, filter.contestFinalizationDate, "frend");
            break;
        case ListType.OPEN:
            setDateToParams(helper, sqlParams, filter.contestFinalizationDate, "fractual");
            break;
        case ListType.PAST:
            setDateToParams(helper, sqlParams, filter.contestFinalizationDate, "frend");
            break;
        }
    }
    if (_.isDefined(filter.projectId)) {
        sqlParams.tcdirectid = filter.projectId;
    }
    if (_.isDefined(filter.cmc)) {
        sqlParams.cmc = filter.cmc;
    }
}

/**
 * Convert null string or if string is equal to "null"
 * @param {String} str - the string to convert.
 * @return {String} converted string
 */
function convertNull(str) {
    if (!str || str === "null") {
        return "";
    }
    return str;
}


/**
 * Format date
 * @param {Date} the date to format
 * @return {String} formated date
 */
function formatDate(date) {
    if (!date) {
        return "";
    }
    return date;
}

/**
 * This method will get data from the query result.
 *
 * @param {Array} src - the query result.
 * @return {Array} a list of transfered contests
 */
function transferResult(src) {
    var ret = [];
    src.forEach(function (row) {
        var contest = {
            type: row.type,
            catalog: row.catalog,
            contestName: row.contestname,
            numberOfSubmissions: row.numberofsubmissions,
            numberOfRatedRegistrants: row.numberofunratedregistrants,
            numberOfUnratedRegistrants: row.numberofratedregistrants,
            contestId: row.contestid,
            projectId: row.projectid,
            registrationEndDate: formatDate(row.registrationenddate),
            submissionEndDate: formatDate(row.submissionenddate),
            prize: [],
            reliabilityBonus: row.reliabilitybonus,
            digitalRunPoints: row.digitalrunpoints,
            cmc: convertNull(row.cmc)
        },
            i,
            prize;
        for (i = 1; i < 10; i = i + 1) {
            prize = row["prize" + i];
            if (prize && prize !== -1) {
                contest.prize.push(prize);
            }
        }
        ret.push(contest);
    });
    return ret;
}


/**
 * This is the function that actually search contests
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 * @param {Boolean} software - The flag if search only software contests
 */
var searchContests = function (api, connection, next, software) {
    var helper = api.helper,
    	dbConnectionMap = connection.dbConnectionMap,
        query = connection.rawConnection.parsedURL.query,
        copyToFilter = ["type", "catalog", "contestName", "projectId", "prizeLowerBound",
            "prizeUpperBound", "cmc"],
        sqlParams = {},
        filter = {},
        pageIndex,
        pageSize,
        sortColumn,
        sortOrder,
        listType,
        prop,
        command,
        commandCount,
        result = {},
        total;
    for (prop in query) {
        if (query.hasOwnProperty(prop)) {
            query[prop.toLowerCase()] = query[prop];
        }
    }

    sortOrder = query.sortorder || "asc";
    sortColumn = query.sortcolumn || DEFAULT_SORT_COLUMN;
    listType = (query.listtype || ListType.ACTIVE).toUpperCase();
    pageIndex = Number(query.pageindex || 1);
    pageSize = Number(query.pagesize || 50);

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
    filter.registrationStartDate = createDate(
        query["registrationstartdate.type"],
        query["registrationstartdate.firstdate"],
        query["registrationstartdate.seconddate"]
    );

    filter.submissionEndDate = createDate(
        query["submissionenddate.type"],
        query["submissionenddate.firstdate"],
        query["submissionenddate.seconddate"]
    );

    filter.contestFinalizationDate = createDate(
        query["contestfinalizationdate.type"],
        query["contestfinalizationdate.firstdate"],
        query["contestfinalizationdate.seconddate"]
    );

    copyToFilter.forEach(function (p) {
        if (query.hasOwnProperty(p.toLowerCase())) {
            filter[p] = query[p.toLowerCase()];
        }
    });

    sqlParams.project_type_id = software ? SOFTWARE_CATEGORY : STUDIO_CATEGORY;

    async.waterfall([
        function (cb) {
            validateInputParameter(helper, query, filter, pageIndex, pageSize, sortColumn, sortOrder, listType, dbConnectionMap, cb);
        }, function (cb) {
            if (pageIndex === -1) {
                pageIndex = 1;
                pageSize = MAX_INT;
            }
            command = LIST_TYPE_COMMAND_MAP[listType][0];
            commandCount = LIST_TYPE_COMMAND_MAP[listType][1];
            setFilter(helper, listType, filter, sqlParams);
            sqlParams.fri = (pageIndex - 1) * pageSize;
            sqlParams.ps = pageSize;
            sqlParams.sf = sortColumn.toLowerCase();
            sqlParams.sd = sortOrder.toLowerCase();
            api.dataAccess.executeQuery(commandCount, sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            total = rows[0].total;
            api.dataAccess.executeQuery(command, sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {
                cb(new NotFoundError("No results found"));
                return;
            }
            result.data = transferResult(rows);
            result.total = total;
            result.pageIndex = pageIndex;
            result.pageSize = pageIndex === -1 ? total : pageSize;
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
 * This is the function that actually search contests
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
var getContest = function (api, connection, next) {
    var contest, error, helper = api.helper, sqlParams, dbConnectionMap = connection.dbConnectionMap;
    async.waterfall([
        function (cb) {
            error = helper.checkInteger(Number(connection.params.contestId));
            if (error) {
                cb(error);
                return;
            }
            sqlParams = { contestId: connection.params.contestId };
            api.dataAccess.executeQuery("contest_details", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            var data = rows[0], i, prize;
            if (rows.length === 0) {
                cb(new NotFoundError("Contest not found"));
                return;
            }
            contest = {
                challengeType : data.challengetype,
                challengeName : data.challengename,
                challengeId : data.challengeid,
                projectId : data.projectid,
                forumId : data.forumid,
                detailedRequirements : data.detailedrequirements,
                finalSubmissionGuidelines : data.finalsubmissionguidelines,
                screeningScorecardId : data.screeningscorecardid,
                reviewScorecardId : data.reviewscorecardid,
                cmcTaskId : convertNull(data.cmctaskid),
                numberOfCheckpointsPrizes : data.numberofcheckpointsprizes,
                topCheckPointPrize : convertNull(data.topcheckPointprize),
                postingDate : formatDate(data.postingdate),
                registrationEndDate : formatDate(data.registrationenddate),
                checkpointSubmissionEndDate : formatDate(data.checkpointsubmissionenddate),
                submissionEndDate : formatDate(data.submissionenddate),
                appealsEndDate : formatDate(data.appealsenddate),
                finalFixEndDate : formatDate(data.finalfixenddate),
                currentPhaseEndDate : formatDate(data.currentphaseenddate),
                currentStatus : data.currentstatus,
                currentPhaseName : convertNull(data.currentphasename),
                digitalRunPoints: data.digitalrunpoints,

                //TODO: move these out to constants and/or helper
                reliabilityBonus: _.isNumber(data.prize1) ? data.prize1 * 0.2 : 0,
                directUrl : 'https://www.topcoder.com/direct/contest/detail.action?projectId=' + data.challengeid,

                prize: [],
                registrants: [],
                submissions: []
            };
            for (i = 1; i < 10; i = i + 1) {
                prize = data["prize" + i];
                if (prize && prize !== -1) {
                    contest.prize.push(prize);
                }
            }
            api.dataAccess.executeQuery("contest_registrants", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            contest.numberOfRegistrants = rows.length;
            rows.forEach(function (item) {
                contest.registrants.push({
                    handle: item.handle,
                    reliability: item.reliability === null ? "n/a" : item.reliability + "%",
                    registrationDate: formatDate(item.inquiry_date)
                });
            });
            api.dataAccess.executeQuery("contest_submissions", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            contest.numberOfSubmissions = rows.length;
            var passedReview = 0, drTable;
            rows.forEach(function (item) {
                if (item.placement) {
                    passedReview = passedReview + 1;
                }
            });
            drTable = DR_POINT[Math.min(passedReview - 1, 4)];
            rows.forEach(function (item) {
                var submission = {
                    handle: item.handle,
                    placement: item.placement || "",
                    screeningScore: item.screening_score,
                    initialScore: item.initial_score,
                    finalScore: item.final_score,
                    points: 0,
                    submissionStatus: item.submission_status,
                    submissionDate: formatDate(item.submission_date)
                };
                if (submission.placement && drTable.length >= submission.placement) {
                    submission.points = drTable[submission.placement - 1] * contest.digitalRunPoints;
                }
                contest.submissions.push(submission);
            });
            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = contest;
        }
        next(connection, true);
    });
};

/**
 * The API for getting contest
 */
exports.getContest = {
    name: "getContest",
    description: "getContest",
    inputs: {
        required: ["contestId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getContest#run", 'debug');
            getContest(api, connection, next);
        } else {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};

/**
 * The API for searching contests
 */
exports.searchSoftwareContests = {
    name: "searchSoftwareContests",
    description: "searchSoftwareContests",
    inputs: {
        required: [],
        optional: ALLOWABLE_QUERY_PARAMETER
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute searchContests#run", 'debug');
            searchContests(api, connection, next, true);
        } else {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};

/**
 * The API for searching contests
 */
exports.searchStudioContests = {
    name: "searchStudioContests",
    description: "searchStudioContests",
    inputs: {
        required: [],
        optional: ALLOWABLE_QUERY_PARAMETER
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["tcs_catalog"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute searchStudioContests#run", 'debug');
            searchContests(api, connection, next, false);
        } else {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};

/**
 * Sample result from specification for Get Studio Contest Detail
 */
var sampleStudioContest;

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
    run: function (api, connection, next) {
        api.log("Execute getStudioContest#run", 'debug');
        connection.response = sampleStudioContest;
        next(connection, true);
    }
};


sampleStudioContest = {
    "type": "Web Design",
    "contestName": "Cornell - Responsive Storyboard Economics Department Site Redesign Contest",
    "description": "Welcome to ¡°Cornell ¨C Responsive Storyboard Economics Site Redesign contest¡±. " +
        "The goal of this contest  is to redesign look and feel for one of our college site departments " +
        "(economics) using base design and customer feedback provided in this contest. There are two pages " +
        "that needs to be redesigned a",
    "prize": [1000, 250],
    "milestone": {
        "prize": 100,
        "number": 5
    },
    "points": 500,
    "nextDeadlineTime": "10.31.2013 10:10 EDT",
    "nextDeadlineName": "Checkpoint Submission Deadline",
    "checkpoints": [
        {
            "submissionId": 12345,
            "submitter": "iamtong",
            "submissionTime": "10.31.2013 10:10 EDT"
        },
        {
            "submissionId": 12345,
            "submitter": "iamtong",
            "submissionTime": "10.31.2013 10:10 EDT"
        }
    ],
    "submissions": [
        {
            "submissionId": 12345,
            "submitter": "iamtong",
            "submissionTime": "10.31.2013 10:10 EDT"
        },
        {
            "submissionId": 12345,
            "submitter": "iamtong",
            "submissionTime": "10.31.2013 10:10 EDT"
        }
    ],
    "winners": [
        {
            "submissionId": 12345,
            "submitter": "iamtong",
            "submissionTime": "10.31.2013 10:10 EDT",
            "points": 50,
            "rank": 1
        },
        {
            "submissionId": 12345,
            "submitter": "iamtong",
            "submissionTime": "10.31.2013 10:10 EDT",
            "points": 50,
            "rank": 2
        }
    ]
};
