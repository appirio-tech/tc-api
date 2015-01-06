/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 */
/**
 * Implement the get rounds api.
 *
 * @version 1.0
 * @author TCASSEMBLER
 */
/*jslint node: true, nomen: true, plusplus: true, stupid: true, unparam: true */
"use strict";
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
/**
 * The output date format.
 * @type {string} the date format
 */
var OUTPUT_DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
/**
 * The input date format.
 * @type {string} the date format.
 */
var INPUT_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// the filter columns
var FILTER_COLUMNS = [
    "name",
    "type",
    "status"
];

// the time filter columns
var TIME_FILTER_COLUMNS = [
    "registrationPhaseStartTimeFrom",
    "registrationPhaseStartTimeTo",
    "registrationPhaseEndTimeFrom",
    "registrationPhaseEndTimeTo",
    "codingPhaseStartTimeFrom",
    "codingPhaseStartTimeTo",
    "codingPhaseEndTimeFrom",
    "codingPhaseEndTimeTo",
    "intermissionPhaseStartTimeFrom",
    "intermissionPhaseStartTimeTo",
    "intermissionPhaseEndTimeFrom",
    "intermissionPhaseEndTimeTo",
    "challengePhaseStartTimeFrom",
    "challengePhaseStartTimeTo",
    "challengePhaseEndTimeFrom",
    "challengePhaseEndTimeTo",
    "systemTestPhaseStartTimeFrom",
    "systemTestPhaseStartTimeTo",
    "systemTestPhaseEndTimeFrom",
    "systemTestPhaseEndTimeTo",
    "roomAssignmentPhaseStartTimeFrom",
    "roomAssignmentPhaseStartTimeTo",
    "roomAssignmentPhaseEndTimeFrom",
    "roomAssignmentPhaseEndTimeTo",
    "moderatedChatPhaseStartTimeFrom",
    "moderatedChatPhaseStartTimeTo",
    "moderatedChatPhaseEndTimeFrom",
    "moderatedChatPhaseEndTimeTo"
];

// the sort columns
var SORT_COLUMNS = {
    "registrationPhaseStartTime": "start_time_1",
    "registrationPhaseEndTime": "end_time_1",
    "codingPhaseStartTime": "start_time_2",
    "codingPhaseEndTime": "end_time_2",
    "intermissionPhaseStartTime": "start_time_3",
    "intermissionPhaseEndTime": "end_time_3",
    "challengePhaseStartTime": "start_time_4",
    "challengePhaseEndTime": "end_time_4",
    "systemTestPhaseStartTime": "start_time_5",
    "systemTestPhaseEndTime": "end_time_5",
    "roomAssignmentPhaseStartTime": "start_time_7",
    "roomAssignmentPhaseEndTime": "end_time_7",
    "moderatedChatPhaseStartTime": "start_time_6",
    "moderatedChatPhaseEndTime": "end_time_6"
};

/**
 * Get sort column database name.
 * @param name the sort name
 * @returns {*} the converted name
 */
function getSortColumnDBName(name) {
    var keys = Object.keys(SORT_COLUMNS), i;
    for (i = 0; i < keys.length; i++) {
        if (keys[i].toLowerCase() === name.toLowerCase()) {
            return SORT_COLUMNS[keys[i]];
        }
    }

    return 'start_time_1';
}

/**
 * Validate time filters.
 * @param params the parameters instance
 * @param error the error instance
 * @param start the start time filter key
 * @param end the end time filter key
 * @returns {*} the checked result
 */
function validateTimeGroup(params, error, start, end) {
    if (!error && _.isDefined(params[start]) && _.isDefined(params[end])) {
        if (moment(decodeURIComponent(params[start]), INPUT_DATE_FORMAT)
                .isAfter(moment(decodeURIComponent(params[end]), INPUT_DATE_FORMAT))) {
            error = new IllegalArgumentError(start + ' should not be later than ' + end + '.');
        }
    }
    return error;
}

/**
 * Checks whether the time filter is invalid date format.
 * @param params the parameters instance
 * @param error the error instance
 * @param helper the helper instance
 * @returns {*} the checked result
 */
function validateTimeFilter(params, error, helper) {
    var i;
    for (i = 0; i < TIME_FILTER_COLUMNS.length; i++) {
        if (_.isDefined(params[TIME_FILTER_COLUMNS[i]]) && !error) {
            error = helper.validateDate(decodeURIComponent(params[TIME_FILTER_COLUMNS[i]]),
                TIME_FILTER_COLUMNS[i], INPUT_DATE_FORMAT);
        }
        if (error) {
            break;
        }
    }

    error = validateTimeGroup(params, error, 'registrationPhaseStartTimeFrom', 'registrationPhaseStartTimeTo');
    error = validateTimeGroup(params, error, 'registrationPhaseEndTimeFrom', 'registrationPhaseEndTimeTo');
    error = validateTimeGroup(params, error, 'codingPhaseStartTimeFrom', 'codingPhaseStartTimeTo');
    error = validateTimeGroup(params, error, 'codingPhaseEndTimeFrom', 'codingPhaseEndTimeTo');
    error = validateTimeGroup(params, error, 'intermissionPhaseStartTimeFrom', 'intermissionPhaseStartTimeTo');
    error = validateTimeGroup(params, error, 'intermissionPhaseEndTimeFrom', 'intermissionPhaseEndTimeTo');
    error = validateTimeGroup(params, error, 'challengePhaseStartTimeFrom', 'challengePhaseStartTimeTo');
    error = validateTimeGroup(params, error, 'challengePhaseEndTimeFrom', 'challengePhaseEndTimeTo');
    error = validateTimeGroup(params, error, 'systemTestPhaseStartTimeFrom', 'systemTestPhaseStartTimeTo');
    error = validateTimeGroup(params, error, 'systemTestPhaseEndTimeFrom', 'systemTestPhaseEndTimeTo');
    error = validateTimeGroup(params, error, 'roomAssignmentPhaseStartTimeFrom', 'roomAssignmentPhaseStartTimeTo');
    error = validateTimeGroup(params, error, 'roomAssignmentPhaseEndTimeFrom', 'roomAssignmentPhaseEndTimeTo');
    error = validateTimeGroup(params, error, 'moderatedChatPhaseStartTimeFrom', 'moderatedChatPhaseStartTimeTo');
    error = validateTimeGroup(params, error, 'moderatedChatPhaseEndTimeFrom', 'moderatedChatPhaseEndTimeTo');

    return error;
}

/**
 * Get time filter in sql format.
 * @param params the parameters instance
 * @returns {string} the sql statement
 */
function getTimeFilter(params) {
    var sql = '', type = '', time = '', rs, i;
    for (i = 0; i < TIME_FILTER_COLUMNS.length; i++) {
        if (_.isDefined(params[TIME_FILTER_COLUMNS[i]])) {
            if (TIME_FILTER_COLUMNS[i].indexOf('From') !== -1) {
                type = '>';
            } else {
                type = '<';
            }

            if (TIME_FILTER_COLUMNS[i].indexOf('StartTime') !== -1) {
                time = 'start_time';
            } else {
                time = 'end_time';
            }

            if (TIME_FILTER_COLUMNS[i].indexOf('registrationPhase') !== -1) {
                rs = 'rs1';
            } else if (TIME_FILTER_COLUMNS[i].indexOf('codingPhase') !== -1) {
                rs = 'rs2';
            } else if (TIME_FILTER_COLUMNS[i].indexOf('intermissionPhase') !== -1) {
                rs = 'rs3';
            } else if (TIME_FILTER_COLUMNS[i].indexOf('challengePhase') !== -1) {
                rs = 'rs4';
            } else if (TIME_FILTER_COLUMNS[i].indexOf('systemTestPhase') !== -1) {
                rs = 'rs5';
            } else if (TIME_FILTER_COLUMNS[i].indexOf('moderatedChatPhase') !== -1) {
                rs = 'rs6';
            } else if (TIME_FILTER_COLUMNS[i].indexOf('roomAssignmentPhase') !== -1) {
                rs = 'rs7';
            }
            sql = sql + ' AND ' + rs + '.' + time + ' ' + type + ' "' + decodeURIComponent(params[TIME_FILTER_COLUMNS[i]]) + '"';
        }
    }

    return sql;
}
/**
 * Get rounds from database.
 * @param api the api instance
 * @param connection the database connection
 * @param dbConnectionMap the connection map
 * @param next the callback method
 */
var getRounds = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper, sqlParams,
        result = {}, params = connection.params, pageIndex, pageSize, sortColumn,
        sortOrder, error, filterCondition, statusCondition = '', allowedSort,
        data = [], statuses, allowedStatus, tmp, i, tmpTypeId;

    sortOrder = (params.sortOrder || "asc").toLowerCase();
    sortColumn = (params.sortColumn || "registrationPhaseStartTime").toLowerCase();
    pageIndex = Number(params.pageIndex || 1);
    pageSize = Number(params.pageSize || 50);

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            allowedSort = helper.getLowerCaseList(Object.keys(SORT_COLUMNS));
            if (_.isDefined(params.pageIndex) && pageIndex !== -1) {
                if (!_.isDefined(params.pageSize)) {
                    error = new IllegalArgumentError('pageSize should not be null or undefined if pageIndex is provided.');
                }
            }
            error = error ||
                helper.checkMaxNumber(pageSize, helper.MAX_INT, "pageSize") ||
                helper.checkPageIndex(pageIndex, "pageIndex") ||
                helper.checkPositiveInteger(pageSize, "pageSize") ||
                helper.checkContains(["asc", "desc"], sortOrder, "sortOrder") ||
                helper.checkContains(allowedSort, sortColumn, "sortColumn");

            // check status filter
            if (_.isDefined(params.status) && !error) {
                statuses = params.status.split(',');
                allowedStatus = ['active', 'past', 'draft'];
                tmp = '';
                for (i = 0; i < statuses.length; i++) {
                    error = helper.checkContains(allowedStatus, statuses[i].toLowerCase(), "status");
                    if (error) {
                        break;
                    }
                    if (statuses[i].toLowerCase() === 'active') {
                        tmp = 'a';
                    } else if (statuses[i].toLowerCase() === 'past') {
                        tmp = 'p';
                    } else if (statuses[i].toLowerCase() === 'draft') {
                        tmp = 'f';
                    }
                    statusCondition = statusCondition + '"' + tmp + '"';
                    if (i !== (statuses.length - 1)) {
                        statusCondition = statusCondition + ',';
                    }
                }
            }

            error = validateTimeFilter(params, error, helper);

            if (error) {
                cb(error);
                return;
            }
            if (_.isDefined(params.type)) {
                // check type filter
                helper.getCatalogCachedValue(decodeURIComponent(params.type).split(','), dbConnectionMap, 'round_type_lu', cb);
            } else {
                cb(null, null);
            }
        }, function (typeIds, cb) {
            if (pageIndex === -1) {
                pageIndex = 1;
                pageSize = helper.MAX_INT;
            }

            filterCondition = ' r.round_id > 0 ';
            if (_.isDefined(params.name)) {
                // set name filter
                filterCondition = filterCondition + ' AND LOWER(name) LIKE LOWER("%' + decodeURIComponent(params.name) + '%")';
            }

            if (statusCondition !== '') {
                // set status filter
                filterCondition = filterCondition + ' AND LOWER(r.status) IN (' + statusCondition + ')';
            }

            // set phase time filters
            filterCondition = filterCondition + getTimeFilter(params);

            if (typeIds !== null) {
                tmpTypeId = '';
                for (i = 0; i < typeIds.length; i++) {
                    tmpTypeId = tmpTypeId + typeIds[i];
                    if (i !== typeIds.length - 1) {
                        tmpTypeId = tmpTypeId + ',';
                    }
                }
                // set type filter
                filterCondition = filterCondition + ' AND r.round_type_id IN (' + tmpTypeId + ')';
            }

            sqlParams = {
                firstRowIndex: (pageIndex - 1) * pageSize,
                pageSize: pageSize,
                filterCondition: filterCondition,
                sortColumn: getSortColumnDBName(sortColumn),
                sortOrder: sortOrder
            };

            // query database to get result
            async.parallel({
                count: function (cbx) {
                    api.dataAccess.executeQuery("get_rounds_count",
                        sqlParams,
                        dbConnectionMap,
                        cbx);
                },
                rounds: function (cbx) {
                    api.dataAccess.executeQuery("get_rounds",
                        sqlParams,
                        dbConnectionMap,
                        cbx);
                }
            }, cb);
        }, function (results, cb) {
            var total = results.count[0].total_count, rounds = results.rounds, idStr = '', record, j;

            result = {
                total: total,
                pageIndex: pageIndex,
                pageSize: Number(params.pageIndex) === -1 ? total : pageSize
            };

            for (i = 0; i < rounds.length; i++) {
                idStr = idStr + rounds[i].id;
                if (i !== (rounds.length - 1)) {
                    idStr = idStr + ',';
                }

                record = {
                    "id": rounds[i].id,
                    "name": rounds[i].name,
                    "shortName": rounds[i].short_name,
                    "type": rounds[i].round_type_desc,
                    "status": rounds[i].round_status ? rounds[i].round_status.trim() : rounds[i].round_status,
                    "registrationLimit": rounds[i].registration_limit,
                    "invitationalType": rounds[i].invitational ? rounds[i].invitational.trim() : rounds[i].invitational,
                    "region": rounds[i].region_name,
                    "roundSchedule": []
                };

                for (j = 1; j <= 7; j++) {
                    if (!_.isUndefined(rounds[i]["start_time_" + j])
                            && !_.isUndefined(rounds[i]["end_time_" + j])
                            && !_.isUndefined(rounds[i]["status_" + j])) {
                        record["roundSchedule"].push({
                            "phaseName": rounds[i]["name_" + j],
                            "startTime": rounds[i]["start_time_" + j] ? moment(rounds[i]["start_time_" + j]).format(OUTPUT_DATE_FORMAT) : undefined,
                            "endTime": rounds[i]["end_time_" + j] ? moment(rounds[i]["end_time_" + j]).format(OUTPUT_DATE_FORMAT) : undefined,
                            "status": rounds[i]["status_" + j] ? rounds[i]["status_" + j].trim() : rounds[i]["status_" + j]
                        });
                    }
                }
                data.push(record);
            }

            if (idStr !== '') {
                sqlParams.roundIdList = idStr;
                // get round terms
                api.dataAccess.executeQuery("get_round_terms_by_ids",
                    sqlParams,
                    dbConnectionMap,
                    cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            var j;
            if (results !== null) {
                for (i = 0; i < results.length; i++) {
                    for (j = 0; j < data.length; j++) {
                        // only return the first term
                        if (results[i].round_id === data[j].id && !data[j]["roundTerms"]) {
                            data[j]["roundTerms"] = results[i].terms_content;
                            break;
                        }
                    }
                }
            }

            result.data = data;
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
 * The API for get Rounds API.
 */
exports.getRounds = {
    name: "getRounds",
    description: "Get Rounds",
    inputs: {
        required: [],
        optional: ["pageSize", "pageIndex", "sortColumn", "sortOrder"].concat(FILTER_COLUMNS).concat(TIME_FILTER_COLUMNS)
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getRounds#run", 'debug');
            getRounds(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
