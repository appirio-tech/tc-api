/*
 * Copyright (C) 2016 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSCODER
 */
"use strict";

var async = require('async');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var DuplicateResourceError = require('../errors/DuplicateResourceError');
var NotFoundError = require('../errors/NotFoundError');

/**
 * This is the function that will actually get all copilots.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var getCopilots = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper;
    async.waterfall([function (cb) {
        cb(helper.checkAdmin(connection, "You need to login for this api.", 'You don\'t have access to this api.'));
    }, function (cb) {
        api.dataAccess.executeQuery("get_copilots", {}, dbConnectionMap, cb);
    }, function (result, cb) {
        var ret = [], i, entity;
        for (i = 0; i < result.length; i = i + 1) {
            entity = {};
            entity.id = result[i].user_id;
            entity.name = result[i].handle;
            entity.softwareCopilot = result[i].is_software_copilot;
            entity.studioCopilot = result[i].is_studio_copilot;
            ret.push(entity);
        }
        cb(null, {
            allCopilots: ret
        });
    }], function (err, result) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = result;
        }
        next(connection, true);
    });
};

/**
 * The API for getting all copilots
 */
exports.copilots = {
    name: "copilots",
    description: "retrieve all copilots",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ['tcs_catalog'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute copilots#run", 'debug');
            getCopilots(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * This is the function that will actually create copilot.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var createCopilot = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        username = connection.params.username,
        isSoftwareCopilot = connection.params.isSoftwareCopilot,
        isStudioCopilot = connection.params.isStudioCopilot,
        userId,
        operatorId,
        parameters,
        result = {
            success: true
        };
    async.waterfall([function (cb) {
        cb(helper.checkAdmin(connection, "You need to login for this api.", 'You don\'t have access to this api.')
            || helper.checkBoolean(isSoftwareCopilot, 'isSoftwareCopilot')
            || helper.checkBoolean(isStudioCopilot, 'isStudioCopilot'));
    }, function (cb) {
        operatorId = connection.caller.userId;
        helper.validateUserAndGetUserId(username, dbConnectionMap, cb);
    }, function (id, cb) {
        userId = id;
        if (!isStudioCopilot && !isSoftwareCopilot) {
            return cb(new IllegalArgumentError("Studio Copilot and Software Copilot Checkbox should have at least one checked"));
        }
        helper.getCopilotProfileIdByUserId(userId, dbConnectionMap, cb);
    }, function (copilotProfileId, cb) {
        if (copilotProfileId > 0) {
            return cb(new DuplicateResourceError("The user " + username + " is already added as copilot"));
        }
        parameters = {
            userId: userId,
            isSoftwareCopilot: isSoftwareCopilot ? 't' : 'f',
            isStudioCopilot: isStudioCopilot ? 't' : 'f',
            operatorId: operatorId
        };
        api.dataAccess.executeQuery("insert_new_copilot", parameters, dbConnectionMap, cb);
    }, function (effectedRows, cb) {
        if (effectedRows === 1) {
            result.message = "Copilot " + username + " has been successfully added";
        }
        cb(null);
    }], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = result;
        }
        next(connection, true);
    });

};

/**
 * The API for creating Copilot
 */
exports.createCopilot = {
    name: "createCopilot",
    description: "create copilot",
    inputs: {
        required: ['username', 'isSoftwareCopilot', 'isStudioCopilot'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'write',
    databases: ['tcs_catalog', 'common_oltp'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute createCopilot#run", 'debug');
            createCopilot(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * This is the function that will actually remove copilot.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var removeCopilot = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper, username = connection.params.username, parameters,
        result = {
            success: true
        };
    async.waterfall([function (cb) {
        cb(helper.checkAdmin(connection, "You need to login for this api.", 'You don\'t have access to this api.'));
    }, function (cb) {
        helper.validateUserAndGetUserId(username, dbConnectionMap, cb);
    }, function (userId, cb) {
        parameters = {
            userId: userId
        };
        helper.getCopilotProfileIdByUserId(userId, dbConnectionMap, cb);
    }, function (copilotProfileId, cb) {
        if (copilotProfileId <= 0) {
            return cb(new NotFoundError(username + " is not in the copilot pool"));
        }
        api.dataAccess.executeQuery("remove_copilot", parameters, dbConnectionMap, cb);
    }, function (effectedRows, cb) {
        if (effectedRows === 1) {
            result.message = "Copilot " + username + " has been successfully removed";
        }
        cb(null);
    }], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = result;
        }
        next(connection, true);
    });

};

/**
 * The API for removing copilot
 */
exports.removeCopilot = {
    name: "removeCopilot",
    description: "remove copilot",
    inputs: {
        required: ['username'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'write',
    databases: ['tcs_catalog', 'common_oltp'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute removeCopilot#run", 'debug');
            removeCopilot(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
