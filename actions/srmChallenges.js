/*
 * Copyright (C) 2013-2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.3
 * @author Sky_, TCSASSEMBLER, freegod, panoptimum
 * changes in 1.1:
 * - implement srm API
 * changes in 1.2:
 * - Use empty result set instead of 404 error in get srm challenges API.
 * changes in 1.3
 * - implement APIs for managing SRM contests for admin:
 *   - list SRM contests
 *   - create SRM contest
 *   - update SRM contest
 */
/*jslint node: true, nomen: true */
"use strict";
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');
var ForbiddenError = require('../errors/ForbiddenError');

/**
 * Represents a predefined list of valid sort column for active challenge.
 */
var ALLOWABLE_SORT_COLUMN = [
    "roundId", "name", "startDate", "totalCompetitors", "divICompetitors", "divIICompetitors",
    "divITotalSolutionsSubmitted", "divIAverageSolutionsSubmitted", "divIITotalSolutionsSubmitted",
    "divIIAverageSolutionsSubmitted", "divITotalSolutionsChallenged",
    "divIAverageSolutionsChallenged", "divIITotalSolutionsChallenged", "divIIAverageSolutionsChallenged", "submissionEndDate"
];

/**
 * The date format for input date parameter for input date parameter
 * startDate, endDate, adStart, adEnd
 */
var DATE_FORMAT = "YYYY-MM-DD hh:mm";
/**
 * Max value for integer
 */
var MAX_INT = 2147483647;

/**
 * The default page size
 */
var DEFAULT_PAGE_SIZE = 50;

/**
 * Default number of leaders to show in SRM details
 */
var LEADER_COUNT = 5;

/**
 * Forbidden error message for non-admin users
 */
var NON_ADMIN_MESSAGE = "Admin access only.",
    UNAUTHORIZED_MESSAGE = "Authorized access only.";
/**
* The API for searching SRM challenges
*/
exports.searchSRMChallenges = {
    name: "searchSRMChallenges",
    description: "searchSRMChallenges",
    inputs: {
        required: [],
        optional: ["pageSize", "pageIndex", "sortColumn", "sortOrder"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["topcoder_dw"],
    run: function (api, connection, next) {
        api.log("Execute searchSRMChallenges#run", 'debug');
        var helper = api.helper, params = connection.params, sqlParams,
            pageIndex, pageSize, sortColumn, sortOrder, error, result,
            dbConnectionMap = connection.dbConnectionMap;
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }

        sortOrder = (params.sortOrder || "asc").toLowerCase();
        sortColumn = (params.sortColumn || "roundId").toLowerCase();
        // for now
        if (sortColumn === 'submissionenddate') {
            sortColumn = "roundid";
        }
        pageIndex = Number(params.pageIndex || 1);
        pageSize = Number(params.pageSize || DEFAULT_PAGE_SIZE);

        if (!_.isDefined(params.sortOrder) && sortColumn === "roundid") {
            sortOrder = "desc";
        }

        async.waterfall([
            function (cb) {
                var allowedSort = helper.getLowerCaseList(ALLOWABLE_SORT_COLUMN);
                if (_.isDefined(params.pageIndex) && pageIndex !== -1) {
                    error = helper.checkDefined(params.pageSize, "pageSize");
                }
                error = error ||
                    helper.checkMaxNumber(pageIndex, MAX_INT, "pageIndex") ||
                    helper.checkMaxNumber(pageSize, MAX_INT, "pageSize") ||
                    helper.checkPageIndex(pageIndex, "pageIndex") ||
                    helper.checkPositiveInteger(pageSize, "pageSize") ||
                    helper.checkContains(["asc", "desc"], sortOrder, "sortOrder") ||
                    helper.checkContains(allowedSort, sortColumn, "sortColumn");
                if (error) {
                    cb(error);
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
                    sortOrder: sortOrder
                };

                async.parallel({
                    count: function (cbx) {
                        api.dataAccess.executeQuery("get_srm_challenges_count",
                            sqlParams,
                            dbConnectionMap,
                            cbx);
                    },
                    data: function (cbx) {
                        api.dataAccess.executeQuery("get_srm_challenges",
                            sqlParams,
                            dbConnectionMap,
                            cbx);
                    }
                }, cb);
            }, function (results, cb) {
                if (results.data.length === 0) {
                    result = {
                        total: 0,
                        pageIndex: pageIndex,
                        pageSize: Number(params.pageIndex) === -1 ? 0 : pageSize,
                        data: []
                    };
                    cb();
                    return;
                }
                var total = results.count[0].total_count;
                result = {
                    total: total,
                    pageIndex: pageIndex,
                    pageSize: Number(params.pageIndex) === -1 ? total : pageSize,
                    data: []
                };
                results.data.forEach(function (item) {
                    var challenge = {
                        roundId: item.round_id,
                        name: item.name,
                        startDate: item.start_date,
                        submissionEndDate: item.end_date,
                        totalCompetitors: item.total_competitors,
                        divICompetitors: item.div_i_competitors,
                        divIICompetitors: item.div_ii_competitors,
                        divITotalSolutionsSubmitted: item.div_i_total_solutions_submitted,
                        divIAverageSolutionsSubmitted: item.div_i_average_solutions_submitted,
                        divIITotalSolutionsSubmitted: item.div_ii_total_solutions_submitted,
                        divIIAverageSolutionsSubmitted: item.div_ii_average_solutions_submitted,
                        divITotalSolutionsChallenged: item.div_i_total_solutions_challenged,
                        divIAverageSolutionsChallenged: item.div_i_average_solutions_challenged,
                        divIITotalSolutionsChallenged: item.div_ii_total_solutions_challenged,
                        divIIAverageSolutionsChallenged: item.div_ii_average_solutions_challenged
                    };

                    result.data.push(challenge);
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
* The API for getting SRM challenge
*/
exports.getSRMChallenge = {
    name: "getSRMChallenge",
    description: "getSRMChallenge",
    inputs: {
        required: ["id"],
        optional: ["er"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["topcoder_dw"],
    run: function (api, connection, next) {
        api.log("Execute getSRMChallenge#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            id = Number(connection.params.id),
            er = Number(connection.params.er || LEADER_COUNT),
            helper = api.helper,
            sqlParams = {
                roundId: id,
                er: er
            },
            result;
        if (!connection.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                var error = helper.checkPositiveInteger(id, "id") ||
                    helper.checkMaxNumber(id, MAX_INT, "id") ||
                    helper.checkPositiveInteger(er, "er") ||
                    helper.checkMaxNumber(er, MAX_INT, "er");
                cb(error);
            },
            function (cb) {
                var execQuery = function (name, cbx) {
                    api.dataAccess.executeQuery(name,
                        sqlParams,
                        dbConnectionMap,
                        cbx);
                };
                async.parallel({
                    basic: function (cbx) {
                        execQuery("get_srm_detail_basic", cbx);
                    },
                    leaders: function (cbx) {
                        execQuery("get_srm_detail_leader", cbx);
                    },
                    problems: function (cbx) {
                        execQuery("get_srm_detail_problem", cbx);
                    }
                }, cb);
            }, function (results, cb) {
                if (results.basic.length === 0) {
                    cb(new NotFoundError("SRM challenge not found"));
                    return;
                }
                var groupedLeaders = _.groupBy(results.leaders, "division"),
                    groupedProblems = _.groupBy(results.problems, "division"),
                    mapLeader = function (a) {
                        delete a.division;
                        return a;
                    },
                    mapProblem = function (a) {
                        return {
                            "level": a.level,
                            "problemName": a.problem_name,
                            "submissions": a.submissions,
                            "correct%": a.correct_percent * 100,
                            "averagePoints": a.average_points
                        };
                    };
                result = {
                    roundId: id,
                    name: results.basic[0].name,
                    leaders: {
                        divisionI: _.map(groupedLeaders["Division-I"], mapLeader),
                        divisionII: _.map(groupedLeaders["Division-II"], mapLeader)
                    },
                    problems: {
                        divisionI: _.map(groupedProblems["Division-I"], mapProblem),
                        divisionII: _.map(groupedProblems["Division-II"], mapProblem)
                    }
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
 * The API to list SRM Contests
 */
exports.listSRMContests = {
    name: "listSRMContests",
    description: "List SRM Contests",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        api.log("Execute listSRMContests#run", 'debug');
        var formatDate = function (date) {
            var result = null;
            if (_.isString(date)) {
                result =  moment(date).format(DATE_FORMAT);
            }
            return result;
        };
        async.series(
            [
                function (cb) {
                    cb(api.helper.checkAdmin(connection, UNAUTHORIZED_MESSAGE, NON_ADMIN_MESSAGE));
                },
                _.bind(
                    api.dataAccess.executeQuery,
                    api.dataAccess,
                    "get_all_srm_contests",
                    {},
                    connection.dbConnectionMap
                )
            ],
            function (error, results) {
                if (error) {
                    api.helper.handleError(api, connection, error);
                } else {
                    if (results[1] && results[1].length > 0) {
                        connection.response = _.map(
                            results[1],
                            function (contest) {
                                return _.reduce(
                                    {
                                        contestId: (_.isNull(contest.contest_id) || _.isUndefined(contest.contest_id))
                                               ? null : contest.contest_id,
                                        name: contest.contest_name || null,
                                        startDate: formatDate(contest.start_date),
                                        endDate: formatDate(contest.end_date),
                                        status: contest.status || null,
                                        groupId: (_.isNull(contest.group_id) || _.isUndefined(contest.group_id))
                                            ? null : contest.group_id,
                                        adText: contest.ad_text || null,
                                        adStart: formatDate(contest.ad_start),
                                        adEnd: formatDate(contest.ad_end),
                                        adTask: contest.ad_task || null,
                                        adCommand: contest.ad_command || null,
                                        activateMenu: (_.isNull(contest.activate_menu)  ||
                                                       _.isUndefined(contest.activate_menu))
                                                    ? null : contest.activate_menu,
                                        season: (_.isNull(contest.season_id)  || _.isUndefined(contest.season_id))
                                              ? null : {seasonId: contest.season_id, name: contest.season_name}
                                    },
                                    function (memo, value, key) {
                                        if (!_.isNull(value)) {memo[key] = value; }
                                        return memo;
                                    },
                                    {}
                                );
                            }
                        );
                    } else {
                        connection.response = [];
                    }
                }
                next(connection, true);
            }
        );
    }
};

/**
 * This function checks if the numeric length property of an object exceeds
 * a given threshold.
 * @param obj - the object to be tested
 * @param length - an integer representing the threshold to be applied
 * @param name - a string representing the object name
 * @return IllegalArgumentError if the threshold is exceeded, null otherwise
 */
function checkExceedsLength(obj, length, name) {
    return obj.length > length ? new IllegalArgumentError(
        "Length of " + name + " must not exceed " + length + " characters."
    ) : null;
}

/**
 * This function checks if a string contains unescaped double quotes
 * @param obj - the string to be checked
 * @param name - the name of the string object
 * @return IllegalArgumentError if the string contains unescaped double quotes, null otherwise
 */
function checkIllegalCharacters(obj, name) {
    var pre = null,
        i,
        message = name + " contains unescaped quotes.";
    if (obj === '"') {
        return new IllegalArgumentError(message);
    }
    for (i = 0; i < obj.length; i += 1) {
        if (pre === '"') {
            if (obj.charAt(i) === '"') { // double quote is escaped by another double quote
                pre = null;
            } else { // double quote isn't followed by another double quote
                return new IllegalArgumentError(message);
            }
        } else if (obj.charAt(i) === '"') {
            pre = '"';
        }
    }
    if (pre === '"') { // last character is unescaped quote
        return new IllegalArgumentError(message);
    }
    return null;
}

/**
 * This function validates and prepares the Arguments to createSRMContest and updateSRMContest
 *
 * @param {Array} args - list of the parameters to be validated
 * @param {Object} api - the api object
 * @param {Object} connection - the connection object
 */
function validateAndPrepareSRMContestApiArguments(args, api, connection) {
    var helper = api.helper,
        params = connection.params,
        validators = {
            id: function (cb) {
                var id = parseInt(params.id, 10),
                    error = helper.checkIdParameter(id, "id");
                if (error) {
                    cb(error);
                } else {
                    async.parallel(
                        {
                            contestExists: _.bind(
                                api.dataAccess.executeQuery,
                                api.dataAccess,
                                "get_srm_contest",
                                {contestId: id},
                                connection.dbConnectionMap
                            )
                        },
                        function (error, results) {
                            if (error) {
                                cb(error);
                            } else {
                                if (results.contestExists.length === 0) {
                                    cb(new IllegalArgumentError("id is unknown."));
                                } else {
                                    cb(null, id);
                                }
                            }
                        }
                    );
                }
            },
            contestId: function (cb) {
                var contestId = parseInt(params.contestId, 10),
                    error = helper.checkIdParameter(contestId, "contestId");
                if (error) {
                    cb(error);
                } else {
                    cb(null, contestId);
                }
            },
            name: function (cb) {
                var name = params.name,
                    error = helper.checkStringPopulated(name, "name")
                         || checkExceedsLength(name, 50, "name")
                         || checkIllegalCharacters(name, "name");
                if (error) {
                    cb(error);
                } else {
                    cb(null, name);
                }
            },
            startDate: function (cb) {
                var startDate = params.startDate, error;
                if (_.isNull(startDate) || _.isUndefined(startDate)) {
                    cb(null, null);  // startDate is nullable
                } else {
                    error = helper.validateDate(startDate, 'startDate', DATE_FORMAT);
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, startDate);
                    }
                }
            },
            endDate: [
                'startDate',
                function (cb, results) {
                    var endDate = params.endDate,
                        startDate = results.startDate,
                        error;
                    if (_.isNull(endDate) || _.isUndefined(endDate)) {
                        cb(null, null); // endDate is nullable
                    } else {
                        error = helper.validateDate(endDate, 'endDate', DATE_FORMAT);
                        if (error) {
                            cb(error);
                        } else {
                            if (startDate && !moment(startDate).isBefore(endDate)) {
                                cb(new IllegalArgumentError("startDate does not precede endDate."));
                            } else {
                                cb(null, endDate);
                            }
                        }
                    }
                }
            ],
            status: function (cb) {
                var status = params.status, error;
                if (_.isNull(status) || _.isUndefined(status)) {
                    cb(null, null); // status is nullable
                } else {
                    error = helper.checkStringPopulated(status, "status")
                         || (status.length !== 1 ? new IllegalArgumentError("status must be of length 1") : null)
                         || (/^[AFPI]$/.test(status) ? null : new IllegalArgumentError("status unknown."));
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, status);
                    }
                }
            },
            groupId: function (cb) {
                var groupId, error;
                if (_.isNull(params.groupId) || _.isUndefined(params.groupId)) {
                    cb(null, null); // groupId is nullable
                } else {
                    groupId = parseInt(params.groupId, 10);
                    error = helper.checkInteger(groupId, "groupId");
                    if (error) {
                        cb(error);
                    } else {
                        async.series(
                            [
                                _.bind(
                                    api.dataAccess.executeQuery,
                                    api.dataAccess,
                                    "get_group",
                                    {groupId: groupId},
                                    connection.dbConnectionMap
                                )
                            ],
                            function (error, results) {
                                if (error) {
                                    cb(error);
                                } else {
                                    if (results[0].length > 0) {
                                        cb(null, groupId);
                                    } else {
                                        cb(new IllegalArgumentError("groupId is unknown."));
                                    }
                                }
                            }
                        );
                    }
                }
            },
            adText: function (cb) {
                var adText = params.adText, error;
                if (_.isNull(adText) || _.isUndefined(adText)) {
                    cb(null, null); // adText is nullable
                } else {
                    error = helper.checkString(adText, "adText")
                         || checkExceedsLength(adText, 250, "adText")
                         || checkIllegalCharacters(adText, "adText");
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, adText);
                    }
                }
            },
            adStart: function (cb) {
                var adStart = params.adStart, error;
                if (_.isNull(adStart) || _.isUndefined(adStart)) {
                    cb(null, null); // adStart is nullable
                } else {
                    error = helper.validateDate(adStart, 'adStart', DATE_FORMAT);
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, adStart);
                    }
                }
            },
            adEnd: [
                'adStart',
                function (cb, results) {
                    var adEnd = params.adEnd,
                        adStart = results.adStart,
                        error;
                    if (_.isNull(adEnd) || _.isUndefined(adEnd)) {
                        cb(null, null); // adEnd is nullable
                    } else {
                        error = helper.validateDate(adEnd, 'adEnd', DATE_FORMAT);
                        if (error) {
                            cb(error);
                        } else {
                            if (adStart && !moment(adStart).isBefore(adEnd)) {
                                cb(new IllegalArgumentError("adStart does not precede adEnd."));
                            } else {
                                cb(null, adEnd);
                            }
                        }
                    }
                }
            ],
            adTask: function (cb) {
                var adTask = params.adTask, error;
                if (_.isNull(adTask) || _.isUndefined(adTask)) {
                    cb(null, null); // adTask is nullable
                } else {
                    error = helper.checkString(adTask, "adTask")
                         || checkExceedsLength(adTask, 30, "adTask")
                         || checkIllegalCharacters(adTask, "adTask");
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, adTask);
                    }
                }
            },
            adCommand: function (cb) {
                var adCommand = params.adCommand, error;
                if (_.isNull(adCommand) || _.isUndefined(adCommand)) {
                    cb(null, null); // adCommand is nullable
                } else {
                    error = helper.checkString(adCommand, "adCommand")
                         || checkExceedsLength(adCommand, 30, "adCommand")
                         || checkIllegalCharacters(adCommand, "adCommand");
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, adCommand);
                    }
                }
            },
            activateMenu: function (cb) {
                var activateMenu, error;
                if (_.isNull(params.activateMenu) || _.isUndefined(params.activateMenu)) {
                    cb(null, null); // activateMenu is nullable
                } else {
                    activateMenu = parseInt(params.activateMenu, 10);
                    error = helper.checkInteger(activateMenu, "activateMenu");
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, activateMenu);
                    }
                }
            },
            seasonId: function (cb) {
                var seasonId, error;
                if (_.isNull(params.seasonId) || _.isUndefined(params.seasonId)) {
                    cb(null, null); // seasonId is nullable
                } else {
                    seasonId = parseInt(params.seasonId, 10);
                    error = helper.checkIdParameter(seasonId, "seasonId");
                    if (error) {
                        cb(error);
                    } else {
                        async.series(
                            [
                                _.bind(
                                    api.dataAccess.executeQuery,
                                    api.dataAccess,
                                    "get_season",
                                    {seasonId: seasonId},
                                    connection.dbConnectionMap
                                )
                            ],
                            function (error, results) {
                                if (error) {
                                    cb(error);
                                } else {
                                    if (results[0].length === 0) {
                                        cb(new IllegalArgumentError("seasonId is unknown."));
                                    } else {
                                        cb(null, seasonId);
                                    }
                                }
                            }
                        );
                    }
                }
            }
        },
        validations = _.reduce(
            args,
            function (memo, validator) {
                memo[validator] = validators[validator];
                return memo;
            },
            {}
        );
    validations.sqlParams = _.flatten(
        [
            args,
            function (cb, results) {
                var escape = {
                    name: true,
                    status: true,
                    adText: true,
                    adTask: true,
                    adCommand: true,
                    startDate: true,
                    endDate: true,
                    adStart: true,
                    adEnd: true
                },
                    date = {
                        startDate: true,
                        endDate: true,
                        adStart: true,
                        adEnd: true
                    };
                cb(null, _.reduce(
                    args,
                    function (memo, item) {
                        if (_.isNull(results[item]) || _.isUndefined(results[item])) {
                            memo[item] = "NULL";
                        } else {
                            if (escape[item]) {
                                // normalize seconds in dates
                                memo[item] = '"' + results[item] + (date[item] ? ":00" : "")  + '"';
                            } else {
                                memo[item] = results[item];
                            }
                        }
                        return memo;
                    },
                    {}
                ));
            }
        ]
    );

    return function (done) {
        async.auto(validations, done);
    };
}

/**
 * The API to create a SRM Contest
 */
exports.createSRMContest = {
    name: "createSRMContest",
    description: "Create a SRM Contest",
    inputs: {
        required: ['name', 'contestId'],
        optional: [
            'startDate',
            'endDate',
            'status',
            'groupId',
            'adText',
            'adStart',
            'adEnd',
            'adTask',
            'adCommand',
            'activateMenu',
            'seasonId'
        ]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        api.log("Execute createSRMContest#run", 'debug');
        var helper = api.helper,
            dbConnectionMap = connection.dbConnectionMap;
        async.auto(
            {
                admin: function (cb) {
                    cb(helper.checkAdmin(connection, UNAUTHORIZED_MESSAGE, NON_ADMIN_MESSAGE));
                },
                common: [ // do common validations
                    'admin',
                    validateAndPrepareSRMContestApiArguments(
                        [
                            'name',
                            'contestId',
                            'startDate',
                            'endDate',
                            'status',
                            'groupId',
                            'adText',
                            'adStart',
                            'adEnd',
                            'adTask',
                            'adCommand',
                            'activateMenu',
                            'seasonId'
                        ],
                        api,
                        connection
                    )
                ],
                validate : [ // do validations only required by this api
                    'common',
                    function (cb, results) {
                        var validate = results.common;
                        async.parallel(
                            {
                                contestExists: _.bind(
                                    api.dataAccess.executeQuery,
                                    api.dataAccess,
                                    "get_srm_contest",
                                    {contestId: validate.contestId},
                                    dbConnectionMap
                                )
                            },
                            function (error, results) {
                                if (error) {
                                    cb(error);
                                } else {
                                    if (results.contestExists.length > 0) {
                                        cb(new IllegalArgumentError("contestId is already in use."));
                                    } else {
                                        cb(null, validate);
                                    }
                                }
                            }
                        );
                    }
                ],
                insert: [
                    'validate',
                    function (cb, results) {
                        api.dataAccess.executeQuery(
                            "insert_srm_contest",
                            results.validate.sqlParams,
                            dbConnectionMap,
                            cb
                        );
                    }
                ]
            },
            function (error) {
                if (error) {
                    api.helper.handleError(api, connection, error);
                } else {
                    connection.response = {success: true};
                }
                next(connection, true);
            }
        );
    }
};

/**
 * The API to update a SRM Contest
 */
exports.updateSRMContest = {
    name: "updateSRMContest",
    description: "Update a SRM Contest",
    inputs: {
        required: ['id',
                   'contestId',
                   'name'
                  ],
        optional: ['startDate',
                   'endDate',
                   'status',
                   'groupId',
                   'adText',
                   'adStart',
                   'adEnd',
                   'adEnd',
                   'adEnd',
                   'adTask',
                   'adCommand',
                   'activateMenu',
                   'seasonId'
                  ]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        api.log("Execute updateSRMContest#run", 'debug');
        var helper = api.helper,
            dbConnectionMap = connection.dbConnectionMap;
        async.auto(
            {
                admin: function (cb) {
                    cb(helper.checkAdmin(connection, UNAUTHORIZED_MESSAGE, NON_ADMIN_MESSAGE));
                },
                validate: [
                    'admin',
                    validateAndPrepareSRMContestApiArguments(
                        [
                            'id',
                            'contestId',
                            'name',
                            'startDate',
                            'endDate',
                            'status',
                            'groupId',
                            'adText',
                            'adStart',
                            'adEnd',
                            'adEnd',
                            'adEnd',
                            'adTask',
                            'adCommand',
                            'activateMenu',
                            'seasonId'
                        ],
                        api,
                        connection
                    )
                ],
                updateContestId: [
                    'validate',
                    function (cb, results) {
                        var id = results.validate.id,
                            contestId = results.validate.contestId;
                        if (id !== contestId) {
                            async.series(
                                [
                                    _.bind(
                                        api.dataAccess.executeQuery,
                                        api.dataAccess,
                                        "insert_srm_contest",
                                        results.validate.sqlParams,
                                        dbConnectionMap
                                    ),
                                    _.bind(
                                        api.dataAccess.executeQuery,
                                        api.dataAccess,
                                        "update_srm_contest",
                                        results.validate.sqlParams,
                                        dbConnectionMap
                                    ),
                                    _.bind(
                                        api.dataAccess.executeQuery,
                                        api.dataAccess,
                                        "update_srm_contest_id",
                                        {contestId: contestId, id: id},
                                        dbConnectionMap
                                    ),
                                    _.bind(
                                        api.dataAccess.executeQuery,
                                        api.dataAccess,
                                        "delete_srm_contest",
                                        {id: id},
                                        dbConnectionMap
                                    )
                                ],
                                cb
                            );
                        } else {
                            cb();
                        }
                    }
                ],
                updateContest: [
                    'updateContestId',
                    function (cb, results) {
                        // don't update the same contest twice with the same data
                        // as done in AdminServicesBean#modifyContest(int, ContestData)
                        if (!results.updateContestId) {
                            api.dataAccess.executeQuery(
                                "update_srm_contest",
                                results.validate.sqlParams,
                                dbConnectionMap,
                                cb
                            );
                        } else {
                            cb();
                        }
                    }
                ]
            },
            function (error) {
                if (error) {
                    api.helper.handleError(api, connection, error);
                } else {
                    connection.response = {success: true};
                }
                next(connection, true);
            }
        );
    }
};
