/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 */
 /**
 * The logic to handle following APIs:
 *  - List Problems API
 *  - List Round Problems API
 *  - List Round Problem Components API
 * 
 * Changes in version 1.1 (Module Assembly - Web Arena UI - Contest Management and Problem Assignment v1.0)
 * - listRoundProblems will include round id
 * - listRoundProblemComponents will include round id
 *
 * @version 1.1
 * @author TCSASSEMBLER
 */
/*jslint node: true, nomen: true, plusplus: true */
"use strict";
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');
var ForbiddenError = require('../errors/ForbiddenError');

/**
 * Parsed the problem from database query result.
 *
 * @param item - the database query result.
 * @returns {{id: *, name: (*|string|string|string|exports.action.name|string), type: {id: *, description: *}, status: {id: *, description: *}}}
 */
function parseProblem(item) {
    var type = {id: item.problem_type_id, description: item.problem_type_desc},
       status = {id: item.status_id, description: item.status_desc};
    return {id: item.problem_id, name: item.name, proposedDivisionId: item.division_id, type: type, status: status};
}

/**
 * Get round problems.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var listRoundProblems = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        result = [],
        sqlParams = {},
        roundId = Number(connection.params.roundId);

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            cb(helper.checkIdParameter(roundId, "roundId"));
        }, function (cb) {
            sqlParams.roundId = roundId;
            api.dataAccess.executeQuery("get_srm_assigned_problems", sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            if (results.length === 0) {
                cb(new NotFoundError("Cannot find records by given roundId."));
                return;
            }
            _.each(results, function (item) {
                var division = {id: item.division_id, desc: item.division_desc},
                    problem = parseProblem(item);
                    problem.roundId = roundId;
                result.push({division: division, problemData: problem});
            });

            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {assignedProblems: result};
        }
        next(connection, true);
    });
};

/**
 * Get round problem components.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var listRoundProblemComponents = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        result = [],
        sqlParams = {},
        problemList = [],
        paramProblemId = connection.params.problemId,
        paramDivisionId = connection.params.divisionId,
        roundId = Number(connection.params.roundId),
        problemId = Number(connection.params.problemId),
        divisionId = Number(connection.params.divisionId);

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            // check parameters
            var error = helper.checkIdParameter(roundId, "roundId");
            if (_.isDefined(paramProblemId) && error === null) {
                error = helper.checkIdParameter(problemId, "problemId");
            }
            if (_.isDefined(paramDivisionId) && error === null) {
                error = helper.checkIdParameter(divisionId, "divisionId");
            }

            if (error === null) {
                if ((!_.isDefined(paramProblemId) && _.isDefined(paramDivisionId)) || (_.isDefined(paramProblemId) && !_.isDefined(paramDivisionId))) {
                    error = new IllegalArgumentError("Both problemId and divisionId should be provided if you provided one of them.");
                }
            }
            cb(error);
        }, function (cb) {
            if (!_.isDefined(paramProblemId) && !_.isDefined(paramDivisionId)) {
                // global
                sqlParams.roundId = roundId;
                api.dataAccess.executeQuery("get_round_problem_components_global", sqlParams, dbConnectionMap, cb);
            } else {
                sqlParams.roundId = roundId;
                sqlParams.problemId = problemId;
                sqlParams.divisionId = divisionId;
                api.dataAccess.executeQuery("get_round_problem_components", sqlParams, dbConnectionMap, cb);
            }
        }, function (results, cb) {
            if (results.length === 0) {
                cb(new NotFoundError("Cannot find records by given roundId."));
                return;
            }
            _.each(results, function (item) {
                var componentType = {id: item.component_type_id, description: item.component_type_desc},
                    tmpProblemId = problemId,
                    componentData,
                    difficulty,
                    division;
                if (!_.isDefined(paramProblemId) && !_.isDefined(paramDivisionId)) {
                    // The only different place is problem id.
                    tmpProblemId = item.problem_id;
                }
                // cache the problem id for param types search
                if (!_.contains(problemList, tmpProblemId)) {
                    problemList.push(tmpProblemId);
                }
                componentData = {id: item.component_id, problemId: tmpProblemId, className: item.class_name, methodName: item.method_name,
                    resultType: item.data_type_desc, paramTypes: null, type: componentType };
                difficulty = {id: item.difficulty_id, desc: item.difficulty_desc};
                division = {id: item.division_id, desc: item.division_desc};

                result.push({difficulty: difficulty, division: division, openOrder: item.open_order,
                    pointValue: item.points, componentData: componentData, submitOrder: item.submit_order, roundId: roundId});

            });
            cb();
        }, function (cb) {
            if (result.length === 0 || problemList.length === 0) {
                cb();
                return;
            }
            async.waterfall([
                function (cbx) {
                    var tmp = "", i;
                    for (i = 0; i < problemList.length; i++) {
                        if (i > 0) {
                            tmp = tmp + ", ";
                        }
                        tmp = tmp + problemList[i];
                    }

                    sqlParams.porblemIdList = tmp;
                    api.dataAccess.executeQuery('get_problem_component_param_types',  sqlParams, dbConnectionMap, cbx);
                },
                function (results, cbx) {
                    var paramTypes = {};
                    _.each(results, function (item) {
                        var key = item.problem_id + "-" + item.component_id;
                        if (!_.has(paramTypes, key)) {
                            paramTypes[key] = [];
                        }
                        paramTypes[key].push(item.data_type_desc);
                    });

                    _.each(result, function (item) {
                        if (!_.isUndefined(item.componentData)) {
                            item.componentData.paramTypes = paramTypes[item.componentData.problemId + "-" + item.componentData.id];
                        }
                    });
                    cbx();
                }
            ], cb);
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {components: result};
        }
        next(connection, true);
    });
};

/**
 * Get SRM problems.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var listSRMProblems = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        result = [],
        sqlParams = {};

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            api.dataAccess.executeQuery("get_srm_problems", sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            _.each(results, function (item) {
                result.push(parseProblem(item));
            });

            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {problems: result};
        }
        next(connection, true);
    });
};

/**
 * The API for list SRM Problems.
 */
exports.listSRMProblems = {
    name: "listSRMProblems",
    description: "List SRM Problems",
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
        if (connection.dbConnectionMap) {
            api.log("Execute listSRMProblems#run", 'debug');
            listSRMProblems(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for list SRM Round Problems.
 */
exports.listRoundProblems = {
    name: "listRoundProblems",
    description: "List SRM Round Problems",
    inputs: {
        required: ["roundId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute listRoundProblems#run", 'debug');
            listRoundProblems(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for list SRM Round Problems Components.
 */
exports.listRoundProblemComponents = {
    name: "listRoundProblemComponents",
    description: "List SRM Round Problem Components",
    inputs: {
        required: ["roundId"],
        optional: ["problemId", "divisionId"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute listRoundProblemComponents#run", 'debug');
            listRoundProblemComponents(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
