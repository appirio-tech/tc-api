/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.4
 * @author Sky_, TCSASSEMBLER, freegod, Ghost_141, hesibo
 * changes in 1.1:
 * - implement marathon API
 * changes in 1.2:
 * - Use empty result set instead of 404 error in get marathon challenges API.
 * Changes in 1.3:
 * - Implement the register marathon match challenge API.
 * changes in 1.4:
 * - Implement the get marathon match challenge register info API
 * - refactor register marathon match challenge API
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');
var BadRequestError = require('../errors/BadRequestError');
var ForbiddenError = require('../errors/ForbiddenError');

/**
 * Represents a ListType enum
 */
var ListType = { ACTIVE: "ACTIVE", PAST: "PAST", UPCOMING: "UPCOMING" };

/**
 * Represents a predefined list of valid list type.
 */
var ALLOWABLE_LIST_TYPE = [ListType.ACTIVE, ListType.PAST, ListType.UPCOMING];

/**
 * Represents a predefined list of valid sort column.
 */
var ALLOWABLE_SORT_COLUMN = [
    "roundId", "fullName", "shortName", "startDate", "endDate",
    "winnerHandle", "winnerScore"
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
            dbConnectionMap = connection.dbConnectionMap, filter = {};
        if (!connection.dbConnectionMap) {
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
                    helper.checkFilterDateOptional(filter.startDate, "startDate", "YYYY-MM-DD") ||
                    helper.checkFilterDateOptional(filter.endDate, "endDate", "YYYY-MM-DD");
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
                    firstRowIndex: (pageIndex - 1) * pageSize,
                    pageSize: pageSize,
                    sortColumn: helper.getSortColumnDBName(sortColumn),
                    sortOrder: sortOrder,
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
                case ListType.UPCOMING:
                    scriptName = "get_marathon_match_upcoming_challenges";
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
                var total = results.count[0].total_count;
                if (total === 0 || results.data.length === 0) {
                    result = {
                        data : [],
                        total: total,
                        pageIndex: pageIndex,
                        pageSize: Number(params.pageIndex) === -1 ? total : pageSize
                    };
                    cb();
                    return;
                }
                result = {
                    data: _.map(results.data, function (item) {
                        var challenge = {
                            roundId: item.round_id,
                            fullName: item.full_name,
                            shortName: item.short_name,
                            startDate: item.start_date,
                            endDate: item.end_date,
                            winnerHandle: item.winner_handle,
                            winnerScore: item.winner_score,
                            timeRemaining: item.time_remaining,
                            numberOfRegistrants: item.registrants_count,
                            numberOfSubmissions: item.submission_count
                        };
                        if (listType === ListType.ACTIVE) {
                            delete challenge.winnerHandle;
                            delete challenge.winnerScore;
                        }
                        return challenge;
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
 * Compute progressResources field for challenge details
 *
 * @param {Array<Object>} submissions - the submissions. Result of detail_progress_XXX query.
 * @param {Array<Object>} registrants - the registrants. Result of detail_progress_XXX_registrants query.
 * @param {Array<Object>} competitors - the competitors. Result of detail_progress_competitors query.
 * @param {Number|String} interval - the interval between each progress resource in hours or "m" if interval is month.
 * @param {String} startTime - the startTime.
 * @param {String} endTime - the endTime.
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
            if (new Date(reg.date).getTime() > new Date(item.date).getTime()) {
                i = i + 1;
            } else {
                item.currentNoOfRegistrants = item.currentNoOfRegistrants + reg.current_no_of_registrants;
                break;
            }
        }
    });

    //compute currentNoOfCompetitors
    users = {};
    i = 0;
    competitors.forEach(function (comp) {
        while (i < items.length) {
            item = items[i];
            if (new Date(comp.submit_time).getTime() > new Date(item.date).getTime()) {
                users = {};
                i = i + 1;
            } else {
                users[comp.coder_id] = true;
                item.currentNoOfCompetitors = Object.keys(users).length;
                break;
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
            if (new Date(sub.date).getTime() > new Date(item.date).getTime()) {
                score = -1;
                handle = "";
                i = i + 1;
            } else {
                item.currentNoOfSubmissions = item.currentNoOfSubmissions + sub.current_no_of_submissions;
                if (score < sub.current_top_provisional_score) {
                    score = sub.current_top_provisional_score;
                    handle = sub.top_user_handle;
                    item.currentTopProvisionalScore = score;
                    item.topUserHandle = handle;
                }
                break;
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
        var dbConnectionMap = connection.dbConnectionMap,
            id = Number(connection.params.id),
            helper = api.helper,
            groupType = (connection.params.groupType || "day").toLowerCase(),
            sqlParams = {
                roundId: id
            },
            result = {};
        if (!connection.dbConnectionMap) {
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
                result = {
                    roundId: details.round_id,
                    fullName: details.full_name,
                    shortName: details.short_name,
                    description: helper.convertToString(details.description),
                    numberOfRegistrants: details.number_of_registrants,
                    numberOfCompetitors: details.number_of_competitors,
                    numberOfSubmissions: details.number_of_submissions,
                    startDate: details.start_date,
                    endDate: details.end_date,
                    winnerScore: details.winner_score,
                    winnerHandle: details.winner_handle,
                    systemTestDate: details.system_test_date
                };

                //no winner
                if (_.isNaN(result.winnerScore) && result.winnerHandle === "null") {
                    delete result.winnerHandle;
                    delete result.winnerScore;
                }
                result.currentProgress = {
                    groupType: groupType.toUpperCase(),
                    progressResources: computeProgressResources(results.hour,
                        results.hourRegistrants, results.competitors, interval, details.start_date, details.end_date)
                };
                result.registrantsRatingSummary = _.map(results.summary, function (p) {
                    var ret = {
                        color: p.color,
                        numberOfMembers: p.number_of_members
                    };
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
/**
 * perform checking before register marathon or view register info
 *
 * @param {Object} api - the api object
 * @param {Boolean} isRegister - it is register marathon or not
 * @param {Object} connection - the connection object
 * @param {Object} sqlParams - the sql parameters object
 * @param {Function} callback - the callback function
 *
 * @since 1.4
 */
function preRegisterMarathonCheck(api, isRegister, connection, sqlParams, callback) {
    var dbConnectionMap = connection.dbConnectionMap,
        roundId = Number(decodeURI(connection.params.roundId).trim()),
        execQuery = function (name) {
            return function (cb) {
                api.dataAccess.executeQuery(name, sqlParams, dbConnectionMap, cb);
            };
        };
    async.waterfall([
        function (cb) {
            var error = api.helper.checkPositiveInteger(roundId, 'roundId') ||
                api.helper.checkMaxInt(roundId, 'roundId') ||
                api.helper.checkMember(connection, 'Authorization information needed or incorrect.');
            if (error) {
                cb(error);
                return;
            }
            sqlParams.round_id = roundId;
            sqlParams.user_id = connection.caller.userId;
            // check
            async.parallel({
                checkResult: execQuery('check_marathon_challenge_register'),
                eventInfo: execQuery('get_round_event_info'),
                endPointAccessCheck: execQuery('check_marathon_match_register_class_permission')
            }, cb);
        },
        function (results, cb) {
            var checkResult = results.checkResult[0],
                endPointAccessCheck = results.endPointAccessCheck,
                eventInfo = results.eventInfo[0];
            // If the user don't have the access to register end point.
            if (endPointAccessCheck.length === 0) {
                cb(new ForbiddenError('The user is forbidden to access this endpoint.'));
                return;
            }
            // If the user is not an activated user in TopCoder system.
            if (!checkResult.is_activated) {
                cb(new BadRequestError('You are not eligible to participate in this competition.'));
                return;
            }
            // If the roundId represent nothing.
            if (!checkResult.is_round_exists) {
                cb(new BadRequestError('Round doesn\'t exist ' + roundId + '.'));
                return;
            }
            // If the round event existed. Dig further.
            if (checkResult.is_round_event_existed) {
                // if the you don't register this event.
                if (!_.isDefined(checkResult.is_event_eligibility)) {
                    // not register this round event.
                    cb(new BadRequestError('In order to participate in this competition, you must register ' +
                        'for <font color=\"red\">' + eventInfo.event_name + '</font>. Registration is available: <a ' +
                        'href=\"' + eventInfo.registration_url + '\">here</a>. Please register at the provided URL ' +
                        'first and then repeat registration at Marathon Match Active Contests page.'));
                    return;
                }
                // If the registration of this event is not eligible.
                if (checkResult.is_event_eligibility !== 1) {
                    cb(new BadRequestError('You are not eligible to participate in this competition.'));
                    return;
                }
            }
            // If the caller has already reigstered for this challenge.
            if (isRegister && checkResult.is_round_registered) {
                cb(new BadRequestError('You already registered for this challenge.'));
                return;
            }
            // If the round registration is not open anymore.
            if (!checkResult.is_round_registration_open) {
                cb(new BadRequestError('Registration is not currently open.'));
                return;
            }
            // If the caller in an uneligible country.
            if (checkResult.is_country_not_eligible_1 || checkResult.is_country_not_eligible_2) {
                cb(new BadRequestError('You are not eligible to participate in this competition. Please contact ' +
                    'support@topcoder.com if you have any questions.'));
                return;
            }
            // If the round require invitation and caller doesn't have one.
            if (checkResult.is_require_invitation && !checkResult.is_invited) {
                cb(new BadRequestError('Sorry, this round is by invitation only.'));
                return;
            }
            // If the round is parallel round.
            if (checkResult.is_parallel_round) {
                cb(new BadRequestError('Sorry, you can not register for this round, you must compete in the ' +
                    'version of this round that you were invited to.'));
                return;
            }
            // If this challenge meets its registration limit.
            if (checkResult.round_registration_limit <= checkResult.current_registration_count) {
                cb(new BadRequestError('There are no more spots available for the round.'));
                return;
            }
            cb(null, checkResult);
        }
    ], function (err, checkResult) {
        if (isRegister) {
            callback(err, checkResult);
        } else {
            callback(err);
        }
    });
}

/**
 * Register the marathon match challenge.
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @param {Function} next - the callback function.
 * @since 1.3
 */
function registerMarathonMatchChallenge(api, connection, next) {
    var sqlParams = {},
        execQuery = function (name) {
            return function (cb) {
                api.dataAccess.executeQuery(name, sqlParams, connection.dbConnectionMap, cb);
            };
        };
    async.waterfall([
        function (cb) {
            preRegisterMarathonCheck(api, true, connection, sqlParams, cb);
        },
        function (checkResult, cb) {
            _.extend(sqlParams, {
                eligible: 1,
                userId: connection.caller.userId,
                attended: 'N'
            });
            async.parallel({
                roundRegistration: execQuery('insert_round_registration'),
                roundTerms: execQuery('insert_round_terms_acceptance'),
                algoRating: function (cbx) {
                    if (!checkResult.is_rated) {
                        api.dataAccess.executeQuery('add_algo_rating', sqlParams, connection.dbConnectionMap, cbx);
                        return;
                    }
                    cbx();
                },
                compResult: execQuery('insert_long_comp_result')
            }, function (err) {
                cb(err);
            });
        }
    ], function (err) {
        if (err) {
            api.helper.handleError(api, connection, err);
        } else {
            connection.response = { success: true };
        }
        next(connection, true);
    });
}

/**
 * The API for register marathon match challenge.
 *
 * @since 1.3
 */
exports.registerMarathonChallenge = {
    name: 'registerMarathonChallenge',
    description: 'register marathon match challenge',
    inputs: {
        required: ['roundId'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'write',
    databases: ['informixoltp', 'common_oltp'],
    run: function (api, connection, next) {
        if (!connection.dbConnectionMap) {
            api.helper.handleNoConnection(api, connection, next);
        } else {
            api.log('Execute registerMarathonChallenge#run', 'debug');
            registerMarathonMatchChallenge(api, connection, next);
        }
    }
};

/**
 * Get marathon match challenge register information.
 *
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @param {Function} next - the callback function.
 *
 * @since 1.4
 */
function getMarathonChallengeRegInfo(api, connection, next) {
    var sqlParams = {}, result = {}, questionIdMapping = {}, index = 0;
    async.waterfall([
        function (cb) {
            preRegisterMarathonCheck(api, false, connection, sqlParams, cb);
        },
        function (cb) {
            api.dataAccess.executeQuery('get_marathon_round_term', sqlParams, connection.dbConnectionMap, cb);
        },
        function (term, cb) {
            if (term.length === 0) {
                cb(new NotFoundError('Could not find specified round terms.'));
                return;
            }
            result.term = {
                contestName: term[0].contest_name,
                roundName: term[0].round_name,
                termsContent: term[0].terms_content || ''
            };
            api.dataAccess.executeQuery('get_marathon_round_questions', sqlParams, connection.dbConnectionMap, cb);
        },
        function (questions, cb) {
            sqlParams.question_ids = [];
            result.questions = _.map(questions, function (question) {
                sqlParams.question_ids.push(question.question_id);
                questionIdMapping[question.question_id] = index;
                index = index + 1;
                return {
                    id: question.question_id,
                    style: question.style,
                    type: question.type,
                    text: question.text,
                    answers: []
                };
            });
            if (!_.isEmpty(sqlParams.question_ids)) {
                api.dataAccess.executeQuery('get_marathon_round_question_answers', sqlParams, connection.dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        },
        function (answers, cb) {
            if (!_.isEmpty(sqlParams.question_ids)) {
                answers.forEach(function (answer) {
                    result.questions[questionIdMapping[answer.question_id]].answers.push({
                        id: answer.answer_id,
                        text: answer.text,
                        sortOrder: answer.sort_order || -1,
                        correct: answer.correct === 0 ? false : true
                    });
                });
            }
            cb();
        }
    ], function (err) {
        if (err) {
            api.helper.handleError(api, connection, err);
        } else {
            connection.response = result;
        }
        next(connection, true);
    });
}

/**
 * The API for get marathon match challenge register information.
 *
 * @since 1.4
 */
exports.getMarathonChallengeRegInfo = {
    name: 'getMarathonChallengeRegInfo',
    description: 'get marathon match challenge register information',
    inputs: {
        required: ['roundId'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ['informixoltp', 'common_oltp'],
    run: function (api, connection, next) {
        if (!connection.dbConnectionMap) {
            api.helper.handleNoConnection(api, connection, next);
        } else {
            api.log('Execute getMarathonChallengeRegInfo#run', 'debug');
            getMarathonChallengeRegInfo(api, connection, next);
        }
    }
};
