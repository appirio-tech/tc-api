/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.5
 * @author Sky_, mekanizumu, TCSASSEMBLER, freegod, Ghost_141
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
 * changes in 1.4:
 *  - Use empty result set instead of 404 error in get challenges API.
 * changes in 1.5:
 * 1. Update the logic when get results from database since the query has been updated.
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
var DEFAULT_SORT_COLUMN = "challengeName";

/**
 * Represents a predefined list of valid query parameter for active contest.
 */
var ALLOWABLE_QUERY_PARAMETER = [
    "listType", "type", "contestName", "registrationStartDate.type",
    "registrationStartDate.firstDate", "registrationStartDate.secondDate", "submissionEndDate.type",
    "submissionEndDate.firstDate", "submissionEndDate.secondDate", "projectId", SORT_COLUMN,
    "sortOrder", "pageIndex", "pageSize", "prizeLowerBound", "prizeUpperBound", "cmc"];

/**
 * Represents a predefined list of valid sort column for active contest.
 */
var ALLOWABLE_SORT_COLUMN = [
    "challengeName", "challengeName", "challengeId", "cmcTaskId", "registrationEndDate",
    "submissionEndDate", "finalFixEndDate", "prize1", "currentStatus", "digitalRunPoints"
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
 * @param {Object} dbConnectionMap - the database connection map object.
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
 * @param {Object} helper - the helper.
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
 * @param {Date} date - the date to format
 * @return {String} formatted date
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
 * @return {Array} a list of transferred contests
 */
function transferResult(src) {
    var ret = [];
    src.forEach(function (row) {
        var contest = {
            challengeType : row.challengetype,
            challengeName : row.challengename,
            challengeId : row.challengeid,
            projectId : row.projectid,
            forumId : row.forumid,
            numSubmissions : row.numsubmissions,
            numRegistrants : row.numregistrants,
            screeningScorecardId : row.screeningscorecardid,
            reviewScorecardId : row.reviewscorecardid,
            cmcTaskId : convertNull(row.cmctaskid),
            numberOfCheckpointsPrizes : row.numberofcheckpointsprizes,
            topCheckPointPrize : convertNull(row.topcheckPointprize),
            postingDate : formatDate(row.postingdate),
            registrationEndDate : formatDate(row.registrationenddate),
            checkpointSubmissionEndDate : formatDate(row.checkpointsubmissionenddate),
            submissionEndDate : formatDate(row.submissionenddate),
            appealsEndDate : formatDate(row.appealsenddate),
            finalFixEndDate : formatDate(row.finalfixenddate),
            currentPhaseEndDate : formatDate(row.currentphaseenddate),
            currentPhaseRemainingTime : row.currentphaseremainingtime,
            currentStatus : row.currentstatus,
            currentPhaseName : convertNull(row.currentphasename),
            digitalRunPoints: row.digitalrunpoints,
            prize: [],

            //TODO: move these out to constants and/or helper 
            reliabilityBonus: _.isNumber(row.prize1) ? row.prize1 * 0.2 : 0,
            challengeCommunity: (row.isstudio) ? 'design' : 'develop'
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
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 * @param {String} community - The community that represent which contest type will be search.
 */
var searchContests = function (api, connection, dbConnectionMap, next, community) {
    var helper = api.helper,
        query = connection.rawConnection.parsedURL.query,
        copyToFilter = ["type", "contestName", "projectId", "prizeLowerBound",
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

    copyToFilter.forEach(function (p) {
        if (query.hasOwnProperty(p.toLowerCase())) {
            filter[p] = query[p.toLowerCase()];
        }
    });

    //default to software
    sqlParams.project_type_id = SOFTWARE_CATEGORY;
    if (community === 'design') {  sqlParams.project_type_id = STUDIO_CATEGORY; }
    if (community === 'both') {  sqlParams.project_type_id = SOFTWARE_CATEGORY.concat(STUDIO_CATEGORY); }

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
                result.data = [];
                result.total = total;
                result.pageIndex = pageIndex;
                result.pageSize = pageIndex === -1 ? total : pageSize;
                cb();
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
 * This is the function that gets contest details
 * 
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 * @param {Boolean} isStudio - the flag that represent if to search studio contests.
 */
var getContest = function (api, connection, dbConnectionMap, isStudio, next) {
    var contest, error, helper = api.helper, sqlParams, contestType = isStudio ? helper.studio : helper.software;
    async.waterfall([
        function (cb) {
            error = helper.checkPositiveInteger(Number(connection.params.contestId), 'contestId') ||
                helper.checkMaxNumber(Number(connection.params.contestId), MAX_INT, 'contestId');
            if (error) {
                cb(error);
                return;
            }
            sqlParams = {
                contestId: connection.params.contestId,
                project_type_id: contestType.category
            };

            var execQuery = function (name) {
                return function (cbx) {
                    api.dataAccess.executeQuery(name, sqlParams, dbConnectionMap, cbx);
                };
            };
            if (isStudio) {
                async.parallel({
                    details: execQuery('contest_details'),
                    checkpoints: execQuery("get_studio_contest_detail_checkpoints"),
                    submissions: execQuery("get_studio_contest_detail_submissions"),
                    winners: execQuery("get_studio_contest_detail_winners")
                }, cb);
            } else {
                async.parallel({
                    details: execQuery('contest_details'),
                    registrants: execQuery('contest_registrants'),
                    submissions: execQuery('contest_submissions')
                }, cb);
            }
        }, function (results, cb) {
            if (results.details.length === 0) {
                cb(new NotFoundError('Contest not found.'));
                return;
            }
            var data = results.details[0], i = 0, prize = 0,
                mapSubmissions = function (results) {
                    var submissions = [], passedReview = 0, drTable, submission = {};
                    if (isStudio) {
                        submissions = _.map(results.submissions, function (item) {
                            return {
                                submissionId: item.submission_id,
                                submitter: item.handle,
                                submissionTime: formatDate(item.create_date)
                            };
                        });
                    } else {
                        results.submissions.forEach(function (item) {
                            if (item.placement) {
                                passedReview = passedReview + 1;
                            }
                        });
                        drTable = DR_POINT[Math.min(passedReview - 1, 4)];
                        submissions = _.map(results.submissions, function (item) {
                            submission = {
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
                                submission.points = drTable[submission.placement - 1] * results.details[0].digital_run_points;
                            }
                            return submission;
                        });
                    }
                    return submissions;
                },
                mapRegistrants = function (results) {
                    if (!_.isDefined(results)) {
                        return [];
                    }
                    return _.map(results, function (item) {
                        return {
                            handle: item.handle,
                            reliability: item.reliability === null ? "n/a" : item.reliability + "%",
                            registrationDate: formatDate(item.inquiry_date)
                        };
                    });
                },
                mapPrize = function (results) {
                    var prizes = [];
                    for (i = 1; i < 10; i = i + 1) {
                        prize = results["prize" + i];
                        if (prize && prize !== -1) {
                            prizes.push(prize);
                        }
                    }
                    return prizes;
                },
                mapWinners = function (results) {
                    if (!_.isDefined(results)) {
                        return [];
                    }
                    return _.map(results, function (s) {
                        return {
                            submissionId: s.submission_id,
                            submitter: s.submitter,
                            submissionTime: s.submission_time,
                            points: s.points,
                            rank: s.rank
                        };
                    });
                },
                mapCheckPoints = function (results) {
                    if (!_.isDefined(results)) {
                        return [];
                    }
                    return _.map(results, function (s) {
                        return {
                            submissionId: s.submission_id,
                            submitter: s.handle,
                            submissionTime: s.create_date
                        };
                    });
                };
            contest = {
                challengeType : data.challenge_type,
                challengeName : data.challenge_name,
                challengeId : data.challenge_id,
                projectId : data.project_id,
                forumId : data.forum_id,
                introduction: data.introduction,
                detailedRequirements : isStudio ? data.studio_detailed_requirements : data.software_detailed_requirements,
                finalSubmissionGuidelines : data.final_submission_guidelines,
                screeningScorecardId : data.screening_scorecard_id,
                reviewScorecardId : data.review_scorecard_id,
                cmcTaskId : convertNull(data.cmc_task_id),
                numberOfCheckpointsPrizes : data.number_of_checkpoints_prizes,
                topCheckPointPrize : convertNull(data.top_checkpoint_prize),
                postingDate : formatDate(data.posting_date),
                registrationEndDate : formatDate(data.registration_end_date),
                checkpointSubmissionEndDate : formatDate(data.checkpoint_submission_end_date),
                submissionEndDate : formatDate(data.submission_end_date),
                appealsEndDate : formatDate(data.appeals_end_date),
                finalFixEndDate : formatDate(data.final_fix_end_date),
                currentPhaseEndDate : formatDate(data.current_phase_end_date),
                currentStatus : data.current_status,
                currentPhaseName : convertNull(data.current_phase_name),
                currentPhaseRemainingTime : data.current_phase_remaining_time,
                digitalRunPoints: data.digital_run_points,
                reliabilityBonus: helper.getReliabilityBonus(data.prize1),
                challengeCommunity: contestType.community,
                directUrl : helper.getDirectProjectLink(data.challenge_id),

                technology: data.technology.split(', '),
                prize: mapPrize(data),
                registrants: mapRegistrants(results.registrants),
                checkpoints: mapCheckPoints(results.checkpoints),
                submissions: mapSubmissions(results),
                winners: mapWinners(results.winners)
            };

            if (isStudio) {
                delete contest.registrants;
                delete contest.finalSubmissionGuidelines;
                delete contest.reliabilityBonus;
                delete contest.technology;
            } else {
                contest.numberOfSubmissions = results.submissions.length;
                contest.numberOfRegistrants = results.registrants.length;
                delete contest.checkpoints;
                delete contest.winners;
                delete contest.introduction;
            }
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
exports.getSoftwareContest = {
    name: "getSoftwareContest",
    description: "getSoftwareContest",
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
        if (this.dbConnectionMap) {
            api.log("Execute getContest#run", 'debug');
            getContest(api, connection, this.dbConnectionMap, false, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
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
        if (this.dbConnectionMap) {
            api.log("Execute getStudioContest#run", 'debug');
            getContest(api, connection, this.dbConnectionMap, true, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
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
        if (this.dbConnectionMap) {
            api.log("Execute searchContests#run", 'debug');
            searchContests(api, connection, this.dbConnectionMap, next, 'develop');
        } else {
            api.helper.handleNoConnection(api, connection, next);
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
        if (this.dbConnectionMap) {
            api.log("Execute searchContests#run", 'debug');
            searchContests(api, connection, this.dbConnectionMap, next, 'design');
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * Generic API for searching contests
 */
exports.searchSoftwareAndStudioContests = {
    name: "searchSoftwareAndStudioContests",
    description: "searchSoftwareAndStudioContests",
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
        if (this.dbConnectionMap) {
            api.log("Execute searchContests#run", 'debug');
            searchContests(api, connection, this.dbConnectionMap, next, 'both');
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
