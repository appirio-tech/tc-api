/*jslint nomen: true */
/*
 * Copyright (C) 2016 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSCODER
 */
"use strict";
var _ = require('underscore');
var async = require('async');
var DuplicateResourceError = require('../errors/DuplicateResourceError');

/**
 * This is the function that will actually get all admins.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var getAdmins = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper;
    async.waterfall([function (cb) {
        cb(helper.checkAdmin(connection, "You need to login for this api.", 'You don\'t have access to this api.'));
    }, function (cb) {
        api.dataAccess.executeQuery("get_admins", {}, dbConnectionMap, cb);
    }, function (result, cb) {
        var ret = {}, i, entity, type, id;
        for (i = 0; i < result.length; i = i + 1) {
            type = result[i].type.trim();
            id = result[i].user_id;
            if (!ret[id]) {
                ret[id] = {
                    id: result[i].user_id,
                    name: result[i].handle,
                    adminGroup: false,
                    adminRole: false,
                    managerResource: false
                };
            }
            entity = ret[id];
            if (type === 'Admin Group') {
                entity.adminGroup = true;
            } else if (type === 'Admin Role') {
                entity.adminRole = true;
            } else if (type === 'Manager Resource') {
                entity.managerResource = true;
            }
        }
        cb(null, {
            allAdmins: _.values(ret)
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
 * The API for getting all admins
 */
exports.admins = {
    name: "admins",
    description: "retrieve all TopCoder admins",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'read', // this action is read-only
    databases: ['tcs_catalog'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute admins#run", 'debug');
            getAdmins(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * This is the function that will actually create admin.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var createAdmin = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper, username = connection.params.username, userId, operatorId, parameters,
        result = {
            success: true
        };
    async.waterfall([function (cb) {
        cb(helper.checkAdmin(connection, "You need to login for this api.", 'You don\'t have access to this api.'));
    }, function (cb) {
        operatorId = connection.caller.userId;
        helper.validateUserAndGetUserId(username, dbConnectionMap, cb);
    }, function (id, cb) {
        userId = id;
        async.auto({
            nextUserGroupId: function (ca) {
                api.dataAccess.executeQuery("get_next_admin_user_group_id", {}, dbConnectionMap, ca);
            },
            nextResourceId: function (ca) {
                api.dataAccess.executeQuery("get_next_admin_resource_id", {}, dbConnectionMap, ca);
            }
        }, cb);
    }, function (results, cb) {
        parameters = {
            userId: userId,
            userGroupId: results.nextUserGroupId[0].next_id,
            operatorId: operatorId,
            resourceId: results.nextResourceId[0].next_id
        };
        api.dataAccess.executeQuery("insert_admin_group", parameters, dbConnectionMap, function (err) {
            if (helper.isDuplicateResourceError(err)) {
                cb(new DuplicateResourceError("User " + username + " has already been added to Admin Group", err));
            } else {
                cb(err);
            }
        });
    }, function (cb) {
        api.dataAccess.executeQuery("clear_user_rating", parameters, dbConnectionMap, function (err) {
            cb(err);
        });
    }, function (cb) {
        api.dataAccess.executeQuery("get_admin_resource", {
            userId: userId
        }, dbConnectionMap, cb);
    }, function (resourceIds, cb) {
        if (!resourceIds || !resourceIds.length) {
            api.dataAccess.executeQuery("insert_new_admin_resource", parameters, dbConnectionMap, function (err) {
                if (err) {
                    return cb(err);
                }
                api.dataAccess.executeQuery("insert_new_admin_resource_info", parameters, dbConnectionMap, function (err) {
                    cb(err);
                });
            });
        } else {
            cb(null);
        }
    }, function (cb) {
        api.dataAccess.executeQuery("insert_admin_role", parameters, dbConnectionMap, function (err) {
            if (helper.isDuplicateResourceError(err)) {
                cb(new DuplicateResourceError("User " + username + " has already been assigned Admin role", err));
            } else {
                cb(err);
            }
        });
    }], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            result.message = username + " has been successfully added as TopCoder Admin";
            connection.response = result;
        }
        next(connection, true);
    });

};

/**
 * The API for creating admin
 */
exports.createAdmin = {
    name: "createAdmin",
    description: "create TopCoder admin",
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
            api.log("Execute createAdmin#run", 'debug');
            createAdmin(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * This is the function that will actually remove admin.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var removeAdmin = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper, username = connection.params.username, operatorId, parameters,
        result = {
            success: true
        };
    async.waterfall([function (cb) {
        cb(helper.checkAdmin(connection, "You need to login for this api.", 'You don\'t have access to this api.'));
    }, function (cb) {
        operatorId = connection.caller.userId;
        helper.validateUserAndGetUserId(username, dbConnectionMap, cb);
    }, function (userId, cb) {
        parameters = {
            userId: userId,
            operatorId: operatorId
        };
        api.dataAccess.executeQuery("remove_admin_group", parameters, dbConnectionMap, function (err) {
            cb(err);
        });
    }, function (cb) {
        api.dataAccess.executeQuery("remove_admin_resource_info", parameters, dbConnectionMap, function (err) {
            cb(err);
        });
    }, function (cb) {
        api.dataAccess.executeQuery("remove_admin_resource", parameters, dbConnectionMap, function (err) {
            cb(err);
        });
    }, function (cb) {
        api.dataAccess.executeQuery("remove_admin_role", parameters, dbConnectionMap, function (err) {
            cb(err);
        });
    }], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            result.message = "TopCoder Admin: " + username + " has been successfully removed";
            connection.response = result;
        }
        next(connection, true);
    });

};

/**
 * The API for removing admin
 */
exports.removeAdmin = {
    name: "removeAdmin",
    description: "remove TopCoder admin",
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
            api.log("Execute removeAdmin#run", 'debug');
            removeAdmin(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
