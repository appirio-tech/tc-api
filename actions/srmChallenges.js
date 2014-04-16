/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.2
 * @author Sky_, TCSASSEMBLER, freegod
 * changes in 1.1:
 * - implement srm API
 * changes in 1.2:
 * - Use empty result set instead of 404 error in get srm challenges API.
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');

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
