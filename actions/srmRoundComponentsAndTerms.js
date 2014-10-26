/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 *
 *  - Implement set srm round components / terms api.
 */

/*jslint node: true, nomen: true, plusplus: true, stupid: true, unparam: true */
"use strict";
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var IllegalArgumentError = require('../errors/IllegalArgumentError');

/**
 * Check whether the given value is defined and id parameter.
 * @param value - the given value.
 * @param name - the name
 * @param error - the error
 * @param helper - the helper instance
 * @returns {*} - the error
 */
function checkDefinedIdParameter(value, name, error, helper) {
    if (!error) {
        error = helper.checkDefined(value, name);
    }
    if (!error) {
        error = helper.checkIdParameter(value, name);
    }
    return error;
}

/**
 * Checks whether the given value is defined and non negative integer.
 * @param value - the value
 * @param name - the name
 * @param error - the error
 * @param helper - the helper instance
 * @returns {*} - the error
 */
function checkDefinedNonNegativeInteger(value, name, error, helper) {
    if (!error) {
        error = helper.checkDefined(value, name);
    }
    if (!error) {
        error = helper.checkNonNegativeInteger(value, name);
    }
    return error;
}

/**
 * Checks the components array.
 *
 * @param api the api instance.
 * @param dbConnectionMap the database connection map
 * @param components the components array.
 * @param callback the callback method
 */
function checkComponents(api, dbConnectionMap, components, callback) {
    var helper = api.helper, error = helper.checkArray(components, "components", false), existingComponentDivisionIds = [];
    if (error) {
        callback(error);
        return;
    }

    async.eachSeries(components, function (component, cbx) {
        async.waterfall([
            function (cb) {
                error = checkDefinedIdParameter(component.componentId, "componentId", error, helper);

                if (!error) {
                    error = helper.checkDefined(component.points, "points");
                }
                if (!error) {
                    error = helper.checkNonNegativeNumber(component.points, "points");
                }

                if (!error) {
                    error = helper.checkDefined(component.divisionId, "divisionId");
                }
                if (!error) {
                    // it allows -1 in division table.
                    error = helper.checkInteger(component.divisionId, "divisionId");
                }

                error = checkDefinedIdParameter(component.difficultyId, "difficultyId", error, helper);

                error = checkDefinedNonNegativeInteger(component.openOrder, "openOrder", error, helper);

                error = checkDefinedNonNegativeInteger(component.submitOrder, "submitOrder", error, helper);

                if (!error) {
                    api.dataAccess.executeQuery("get_round_component_id", {component_id: component.componentId}, dbConnectionMap, cb);
                } else {
                    cb(null, null);
                }
            }, function (results, cb) {
                if (!error) {
                    if (results.length === 0) {
                        error = new IllegalArgumentError("The componentId " + component.componentId + " does not exist in database.");
                    }
                }

                if (!error) {
                    api.dataAccess.executeQuery("get_round_division_id", {division_id: component.divisionId}, dbConnectionMap, cb);
                } else {
                    cb(null, null);
                }
            }, function (results, cb) {
                if (!error) {
                    if (results.length === 0) {
                        error = new IllegalArgumentError("The divisionId " + component.divisionId + " does not exist in database.");
                    }
                }

                if (!error) {
                    api.dataAccess.executeQuery("get_round_difficulty_id", {difficulty_id: component.difficultyId}, dbConnectionMap, cb);
                } else {
                    cb(null, null);
                }
            }, function (results, cb) {
                if (!error) {
                    if (results.length === 0) {
                        error = new IllegalArgumentError("The difficultyId " + component.difficultyId + " does not exist in database.");
                    }
                }

                if (!error) {
                    if (_.contains(existingComponentDivisionIds, component.componentId + '-' + component.divisionId)) {
                        error = new IllegalArgumentError("The componentId " + component.componentId
                            + " and divisionId " + component.divisionId + " group should be unique.");
                    } else {
                        existingComponentDivisionIds.push(component.componentId + '-' + component.divisionId);
                    }
                }

                cb(error);
            }
        ], function (err) {
            if (err) {
                cbx(err);
                return;
            }
            cbx(null, error);
        });
    }, function (err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, null);
    });
}

/**
 * Checks round id.
 *
 * @param api the api instance.
 * @param dbConnectionMap the database connection map
 * @param roundId the round id.
 * @param callback the callback method
 */
function checkRoundId(api, dbConnectionMap, roundId, callback) {
    var helper = api.helper, error = helper.checkIdParameter(roundId, "roundId");

    async.waterfall([
        function (cb) {
            if (!error) {
                api.dataAccess.executeQuery("get_round_id", {roundId: roundId}, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (!error) {
                if (results.length === 0) {
                    error = new IllegalArgumentError("The roundId " + roundId + " does not exist in database.");
                }
            }
            cb(error);
        }
    ], function (err) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, null);
    });
}

/**
 * Set round components.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var setRoundComponents = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        roundId = Number(connection.params.roundId),
        components = connection.params.components;

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            checkRoundId(api, dbConnectionMap, roundId, cb);
        }, function (error, cb) {
            checkComponents(api, dbConnectionMap, components, cb);
        }, function (error, cb) {
            sqlParams.round_id = roundId;
            api.dataAccess.executeQuery("delete_round_components", sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            async.eachSeries(components, function (component, cbx) {
                sqlParams.round_id = roundId;
                sqlParams.component_id = component.componentId;
                sqlParams.points = component.points;
                sqlParams.division_id = component.divisionId;
                sqlParams.difficulty_id = component.difficultyId;
                sqlParams.open_order = component.openOrder;
                sqlParams.submit_order = component.submitOrder;
                api.dataAccess.executeQuery("insert_round_component", sqlParams, dbConnectionMap, function (err) {
                    cbx(err);
                });
            }, cb);
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {"success": true};
        }
        next(connection, true);
    });
};


/**
 * Check round terms.
 *
 * @param api the api instance.
 * @param terms the round terms
 * @param callback the callback method
 */
function checkRoundTerms(api, terms, callback) {
    var helper = api.helper, error = helper.checkString(terms, "terms");

    if (!error) {
        if (terms.trim().length === 0) {
            error = new IllegalArgumentError("The round terms should not be empty.");
        }
    }

    if (error) {
        callback(error);
    } else {
        callback(null, null);
    }
}

/**
 * Sets round terms.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var setRoundTerms = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        roundId = Number(connection.params.roundId),
        terms = connection.params.terms;

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            checkRoundId(api, dbConnectionMap, roundId, cb);
        }, function (error, cb) {
            checkRoundTerms(api, terms, cb);
        }, function (error, cb) {
            sqlParams.round_id = roundId;
            api.dataAccess.executeQuery("delete_round_terms", sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            helper.updateTextColumn(api, "INSERT INTO round_terms(round_id, terms_content) VALUES (?, ?)", "informixoltp",
                [{type: 'int', value : roundId}, {type: 'text', value : terms}], cb);
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {"success": true};
        }
        next(connection, true);
    });
};

/**
 * Gets round terms.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var getRoundTerms = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        roundId = Number(connection.params.roundId),
        roundTermsContent = '';

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            cb(helper.checkIdParameter(roundId, "roundId"));
        }, function (cb) {
            sqlParams.round_id = roundId;
            api.dataAccess.executeQuery("get_round_terms", sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            if (!results || results.length === 0) {
                var error = new IllegalArgumentError("The round terms can't be found with such roundId = " + roundId);
                cb(error);
            } else {
                roundTermsContent = results[0].terms_content;
                cb();
            }
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {"roundTermsContent": roundTermsContent};
        }
        next(connection, true);
    });
};

/**
 * The API for Set Round Components.
 */
exports.setRoundComponents = {
    name: "setRoundComponents",
    description: "Set Round Components",
    inputs: {
        required: ['roundId', 'components'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute setRoundComponents#run", 'debug');
            setRoundComponents(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for Set Round Terms.
 */
exports.setRoundTerms = {
    name: "setRoundTerms",
    description: "Set Round Terms",
    inputs: {
        required: ['roundId', 'terms'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute setRoundTerms#run", 'debug');
            setRoundTerms(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for Get Round Terms.
 */
exports.getRoundTerms = {
    name: "getRoundTerms",
    description: "Get Round Terms",
    inputs: {
        required: ['roundId'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getRoundTerms#run", 'debug');
            getRoundTerms(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
