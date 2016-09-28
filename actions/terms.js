/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.2
 * @author TCSCODER, hesibo, snowone
 *
 * changes in 1.1:
 *    add support for docusign template id for terms of use details api
 * 
 * changes in 1.2:
 *    add the new "getTermsForUser" action
 */
"use strict";

var _ = require("underscore");
var async = require("async");
var UnauthorizedError = require("../errors/UnauthorizedError");
var NotFoundError = require('../errors/NotFoundError');
var BadRequestError = require("../errors/BadRequestError");
var IllegalArgumentError = require("../errors/IllegalArgumentError");
var ForbiddenError = require('../errors/ForbiddenError');

/**
 * This function validate termsOfUseId parameter and set the sql parameter.
 *
 *
 * @param {Object} connection - The connection object for the current request
 * @param {Object} helper - The helper object
 * @param {Object} sqlParams - the parameters for sql query.
 * @param {Function<connection, render>} callback - The callback to be called after this function is done
 */
function validateTermsOfUseId(connection, helper, sqlParams, callback) {
    var termsOfUseId = Number(connection.params.termsOfUseId),
        error = helper.checkPositiveInteger(termsOfUseId, 'termsOfUseId') ||
            helper.checkMaxNumber(termsOfUseId, helper.MAX_INT, 'termsOfUseId');
    if (error) {
        callback(error);
    } else {
        sqlParams.termsOfUseId = termsOfUseId;
        callback();
    }
}

/**
 * Gets the term details given the term id.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next The callback to be called after this function is done
 */
var getTermsOfUse = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        result = {},
        noauth = connection.params.noauth == "true";

    //Check if the user is logged-in
    if (!noauth && connection.caller.accessLevel === "anon") {
        helper.handleError(api, connection, new UnauthorizedError("Authentication credential was missing."));
        next(connection, true);
        return;
    }

    sqlParams.userId = connection.caller ? connection.caller.userId || '' : '';

    async.waterfall([
        function (cb) {
            // validate termsOfUseId parameter and set sql parameter
            validateTermsOfUseId(connection, helper, sqlParams, cb);
        },
        function (cb) {
            api.dataAccess.executeQuery(noauth ? "get_terms_of_use_noauth" : "get_terms_of_use", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {
                cb(new NotFoundError('No such terms of use exists.'));
                return;
            }

            var camelCaseMap = {
                'agreeability_type': 'agreeabilityType',
                'terms_of_use_id': 'termsOfUseId'
            };
            // check whether this is for docusign template and that template exists
            if (rows[0].agreeability_type_id === 4) {
                if (!rows[0].docusign_template_id) {
                    cb(new Error('Docusign template id is missing.'));
                    return;
                }
                camelCaseMap.docusign_template_id = 'docusignTemplateId';
            } else {
                delete rows[0].docusign_template_id;
            }
            delete rows[0].agreeability_type_id;

            _.each(rows[0], function (value, key) {
                key = camelCaseMap[key] || key;
                result[key] = value;
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
 * Gets the terms details of the given list 
 * and the terms agreement status for the given user
 * 
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next The callback to be called after this function is done
 */
var getTermsForUser = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {};

    async.waterfall([
        // Check if the user is logged in
        function (cb) {
            if (connection.caller.accessLevel === "anon") {
                cb(new UnauthorizedError("Authentication credential was missing."));
            } else {
                cb();
            }
        },
        // Check the userId parameter
        function (cb) {
            var error = helper.checkIdParameter(connection.params.userId, "User ID");
            cb(error || null);
        },
        // Check if the user has a right to get this information
        function (cb) {
            sqlParams.userId = connection.params.userId;
            if (connection.caller.accessLevel !== "admin"
                    && Number(connection.caller.userId) !== Number(sqlParams.userId)) {
                cb(new ForbiddenError("This user cannot get these data of other users"));
            } else {
                cb();
            }
        },
        // Check terms of use Ids 
        function (cb) {
            sqlParams.termsIds = connection.params.termsOfUseIds.split(",");
            async.each(sqlParams.termsIds, function (termsId, cb) {
                var error = helper.checkIdParameter(termsId, "Each Terms Of Use ID");
                cb(error || null);
            }, cb);
        },
        // Run query
        function (cb) {
            api.dataAccess.executeQuery("get_terms_for_user", sqlParams, dbConnectionMap, cb);
        },
        // Prepare and submit the result
        function (rows, cb) {
            var columnMap = {
                    "type": "terms_type",
                    "agreeabilityType": "agreeability_type",
                    "agreed": "agreed",
                    "text": "terms_text",
                    "title": "title",
                    "termsOfUseId": "terms_of_use_id",
                    "url": "url"
                };

            _.each(rows, function (row) {
                _.each(columnMap, function (field, property) {
                    var tmp = row[field];
                    delete row[field];
                    row[property] = tmp;
                });
            });
            cb(null, rows);
        }
    ], function (err, result) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = { terms: result };
        }
        next(connection, true);
    });
};

/**
 * This function gets the challenge results for both develop (software) and design (studio) contests.
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap - The database connection map for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
var agreeTermsOfUse = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper, sqlParams = {}, i;

    //Check if the user is logged-in
    if (connection.caller.accessLevel === "anon") {
        helper.handleError(api, connection, new UnauthorizedError("Authentication credential was missing."));
        next(connection, true);
        return;
    }

    sqlParams.userId = connection.caller.userId;

    async.series([
        function (callback) {
            // validate termsOfUseId parameter and set sql parameter
            validateTermsOfUseId(connection, helper, sqlParams, callback);
        },
        function (callback) {
            api.dataAccess.executeQuery("get_terms_of_use", sqlParams, dbConnectionMap, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if (result.length > 0) {
                        if (result[0].agreeability_type !== "Electronically-agreeable") {
                            callback(new BadRequestError("The term is not electronically agreeable."));
                        } else {
                            callback();
                        }
                    } else {
                        callback(new NotFoundError("No such terms of use exists."));
                    }
                }
            });
        },
        function (callback) {
            api.dataAccess.executeQuery("check_user_terms_of_use_exist", sqlParams, dbConnectionMap, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if (result.length > 0) {
                        callback(new BadRequestError("You have agreed to this terms of use before."));
                    } else {
                        callback();
                    }
                }
            });
        },
        function (callback) {
            api.dataAccess.executeQuery("get_dependency_terms_of_use", sqlParams, dbConnectionMap, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    for (i = 0; i < result.length; i = i + 1) {
                        if (_.isUndefined(result[i].user_id)) {
                            callback(new BadRequestError("You can't agree to this terms of use before you have agreed to all the dependencies terms of use."));
                            return;
                        }
                    }
                    callback();
                }
            });
        },
        function (callback) {
            api.dataAccess.executeQuery("check_user_terms_of_use_ban", sqlParams, dbConnectionMap, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    if (result.length > 0) {
                        callback(new ForbiddenError("Sorry, you can not agree to this terms of use."));
                    } else {
                        callback();
                    }
                }
            });
        },
        function (callback) {
            api.dataAccess.executeQuery("insert_user_terms_of_use", sqlParams, dbConnectionMap, callback);
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            api.log("Agree terms of use succeeded.", "debug");
            connection.response = {"success" : true};
        }

        next(connection, true);
    });
};

/**
 * The API for getting terms of use by id
 */
exports.getTermsOfUse = {
    name: "getTermsOfUse",
    description: "getTermsOfUse",
    inputs: {
        required: ["termsOfUseId"],
        optional: ["noauth"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    databases : ["common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getTermsOfUse#run", 'debug');
            getTermsOfUse(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for getting the terms details of the given list 
 * and the terms agreement status for the given user
 */
exports.getTermsForUser = {
    name: "getTermsForUser",
    description: "Get the terms details of the given list "
        + "and the terms agreement status for the given user",
    inputs: {
        required: ["termsOfUseIds", "userId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: "v2",
    transaction: "read",
    databases: ["common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getTermsForUser#run", 'debug');
            getTermsForUser(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for agree terms of use. It is transactional.
 */
exports.agreeTermsOfUse = {
    name: "agreeTermsOfUse",
    description: "agree terms of use",
    inputs: {
        required: ["termsOfUseId"],
        optional: []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : "v2",
    transaction : "write",
    cacheEnabled : false,
    databases : ["common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute agreeTermsOfUse#run", 'debug');
            agreeTermsOfUse(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
