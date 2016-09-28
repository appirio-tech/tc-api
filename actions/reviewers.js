/*jslint nomen: true */
/*
 * Copyright (C) 2013-2016 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author Sky_,TCSCODER
 * Changes in 1.1:
 * - add routes for Reviewer Management API
 *  - Add Reviewer
 *  - Remove Reviewer
 *  - Get All Reviewers
 */
"use strict";
var _ = require('underscore');
var async = require('async');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');
var DuplicateResourceError = require('../errors/DuplicateResourceError');

/**
 * The project type id for studio (design).
 */
var STUDIO_PROJECT_TYPE_ID = 3;
/**
 * The category id of CODE.
 */
var CODE_CATEGORY_ID = 39;

/**
 * The category id of First2Finish.
 */
var F2F_CATEGORY_ID = 38;

/**
 * Sample result from specification for Challenge Reviewers Collection
 */
var sampleReviewers;

/**
 * The API for getting challenge reviewers collection
 */
exports.action = {
    name: "getChallengeReviewers",
    description: "getChallengeReviewers",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getChallengeReviewers#run", 'debug');
        connection.response = sampleReviewers;
        next(connection, true);
    }
};


sampleReviewers = {
    "total": 4,
    "data": [
        {
            "id": "23040226",
            "handle": "AE-86",
            "rating": "1212",
            "photo": "1.gif"
        },
        {
            "id": "23040228",
            "handle": "AE-88",
            "rating": "1920",
            "photo": "2.gif"
        },
        {
            "id": "23040258",
            "handle": "AE-90",
            "rating": "1386",
            "photo": "3.gif"
        },
        {
            "id": "13040058",
            "handle": "XYZ",
            "rating": "1776",
            "photo": "4.gif"
        }
    ]
};

/**
 * This is the function that will actually get all reviewers.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var getReviewers = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper, categoryId = Number(connection.params.categoryId);
    async.waterfall([function (cb) {
        cb(helper.checkAdmin(connection, "You need to login for this api.", 'You don\'t have access to this api.')
            || helper.checkIdParameter(categoryId, 'categoryId'));
    }, function (cb) {
        api.dataAccess.executeQuery("get_reviewers", {categoryId: categoryId}, dbConnectionMap, cb);
    }, function (result, cb) {
        var ret = [], i, entity;
        for (i = 0; i < result.length; i = i + 1) {
            entity = {};
            entity.id = result[i].user_id;
            entity.name = result[i].handle;
            entity.projectCategoryId = result[i].project_category_id;
            entity.projectCategoryName = result[i].project_category_name;
            entity.immune = Number(result[i].immune_ind) === 1;
            ret.push(entity);
        }
        cb(null, {
            categoryId: categoryId,
            reviewers: ret
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
 * The API for getting all reviewers of review board of a specific challenge category
 */
exports.reviewers = {
    name: "reviewers",
    description: "retrieve the reviewers of review board of a specific challenge category",
    inputs: {
        required: ['categoryId'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ['tcs_catalog'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute reviewers#run", 'debug');
            getReviewers(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * This is the function that will actually create reviewer.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var createReviewer = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        username = connection.params.username,
        categoryId = Number(connection.params.categoryId),
        immune = connection.params.immune,
        userId,
        operatorId,
        parameters,
        result = {
            success: true
        };
    async.waterfall([function (cb) {
        cb(helper.checkAdmin(connection, "You need to login for this api.", 'You don\'t have access to this api.')
            || helper.checkIdParameter(categoryId, 'categoryId') ||
            (_.isUndefined(immune) ? null : helper.checkBoolean(immune, 'immune')));
    }, function (cb) {
        operatorId = connection.caller.userId;
        helper.validateUserAndGetUserId(username, dbConnectionMap, cb);
    }, function (id, cb) {
        userId = id;
        helper.getProjectCategoryByCategoryId(categoryId, dbConnectionMap, cb);
    }, function (projectCategory, cb) {
        if (!projectCategory) {
            return cb(new IllegalArgumentError("Category Id " + categoryId + " is not a valid category ID"));
        }
        var isImmunity = projectCategory.typeId === STUDIO_PROJECT_TYPE_ID || categoryId === CODE_CATEGORY_ID || categoryId === F2F_CATEGORY_ID;
        // will use immune from user input if exist
        if (!_.isUndefined(immune)) {
            isImmunity = immune;
        }
        // will use 1 or 0 finally
        isImmunity = isImmunity  ? 1 : 0;
        parameters = {
            userId: userId,
            operatorId: operatorId,
            categoryId: categoryId,
            isImmunity: isImmunity
        };
        api.dataAccess.executeQuery("insert_reviewer", parameters, dbConnectionMap, function (err, effectedRows) {
            if (helper.isDuplicateResourceError(err)) {
                cb(new DuplicateResourceError("User " + username + " is in the specific review board", err));
            } else {
                if (!err && effectedRows === 1) {
                    result.message = username + " has been successfully added into " + projectCategory.name + " Review Board";
                }
                cb(err);
            }
        });
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
 * The API for creating reviewer
 */
exports.createReviewer = {
    name: "createReviewer",
    description: "add reviewer",
    inputs: {
        required: ['username', 'categoryId'],
        optional: ['immune']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'write',
    databases: ['tcs_catalog', 'common_oltp'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute createReviewer#run", 'debug');
            createReviewer(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * This is the function that will actually remove reviewer.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var removeReviewer = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        username = connection.params.username,
        categoryId = Number(connection.params.categoryId),
        parameters,
        userId,
        projectCategory,
        result = {
            success: true
        };
    async.waterfall([function (cb) {
        cb(helper.checkAdmin(connection, "You need to login for this api.", 'You don\'t have access to this api.')
            || helper.checkIdParameter(categoryId, 'categoryId'));
    }, function (cb) {
        helper.validateUserAndGetUserId(username, dbConnectionMap, cb);
    }, function (id, cb) {
        userId = id;
        helper.getProjectCategoryByCategoryId(categoryId, dbConnectionMap, cb);
    }, function (projectCategoryResult, cb) {
        projectCategory = projectCategoryResult;
        if (!projectCategory) {
            return cb(new IllegalArgumentError("Category Id " + categoryId + " is not a valid category ID"));
        }
        parameters = {
            userId: userId,
            categoryId: categoryId
        };
        api.dataAccess.executeQuery("get_reviewer", parameters, dbConnectionMap, cb);
    }, function (userIds, cb) {
        if (!userIds || !userIds.length) {
            return cb(new NotFoundError("There is no reviewer with the username:" + username + " in category: " + projectCategory.name));
        }
        api.dataAccess.executeQuery("remove_reviewer", parameters, dbConnectionMap, cb);
    }, function (effectedRows, cb) {
        if (effectedRows >= 1) {
            result.message = username + " has been successfully removed from " + projectCategory.name + " Review Board";
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
 * The API for removing reviewer
 */
exports.removeReviewer = {
    name: "removeReviewer",
    description: "remove reviewer",
    inputs: {
        required: ['username', 'categoryId'],
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
            api.log("Execute removeReviewer#run", 'debug');
            removeReviewer(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};