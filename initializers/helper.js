/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 */

/**
* This module contains helper functions.
* @author Sky_
* @version 1.0
*/
"use strict";

var async = require('async');
var _ = require('underscore');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');
var helper = {};


/**
 * Checks whether given object is defined.
 * @param {Object}obj the obj to check.
 * @param {String}objName  the object name
 * @return {Error} Error if invalid or null if valid.
 */
helper.checkDefined = function (obj, objName) {
    if (_.isNull(obj) || _.isUndefined(obj)) {
        return new IllegalArgumentError(objName + " should not be null or undefined");
    }
    return null;
};


/**
 * Checks whether given object is object type.
 * @param {Object}obj the type of object
 * @param {String}objName the object name
 * @return {Error} Error if invalid or null if valid.
 */
helper.checkObject = function (obj, objName) {
    if (!_.isObject(obj)) {
        return new IllegalArgumentError(objName + " should be object");
    }
    return null;
};


/**
 * Checks whether given object is function.
 * @param {Object} obj - the type of object
 * @param {String} objName - the object name
 * @return {Error} if invalid or null if valid.
 */
helper.checkFunction = function (obj, objName) {
    if (!_.isFunction(obj)) {
        return new IllegalArgumentError(objName + " should be function.");
    }
    return null;
};


/**
 * Check Object given object is string.
 * @param {Obejct} obj the obj to check.
 * @param {String} objName the obj name.
 * @return {Error} if invalid or null if valid.
 */
helper.checkString = function (obj, objName) {
    if (!_.isString(obj)) {
        return new IllegalArgumentError(objName + " should be string.");
    }
    return null;
};

/**
 * Checks whether given object is array.
 * @param {Object} obj - the type of object
 * @param {String} objName - the object name
 * @param {Boolean} allowEmpty - flag if array can be empty or not
 * @return {Error} if invalid or null if valid.
 */
helper.checkArray = function (obj, objName, allowEmpty) {
    var error = helper.checkDefined(obj, objName);
    if (error) {
        return error;
    }
    if (!_.isArray(obj)) {
        return new IllegalArgumentError(objName + " should be Array.");
    }
    if (!allowEmpty && obj.length === 0) {
        return new IllegalArgumentError(objName + " should be non-empty Array.");
    }
    return null;
};



/**
 * Checks whether given object is a number.
 * @param {Object} obj - the type of object
 * @param {String} objName - the object name
 * @return {Error} if invalid or null if valid.
 */
helper.checkNumber = function (obj, objName) {
    if (!_.isNumber(obj) || _.isNaN(obj) || !_.isFinite(obj)) {
        return new IllegalArgumentError(objName + " should be number.");
    }
    return null;
};

/**
 * Checks whether given object is number greater or equal to 0.
 * @param {Object} obj - the type of object
 * @param {String} objName - the object name
 * @return {Error} if invalid or null if valid.
 */
helper.checkNonNegativeNumber = function (obj, objName) {
    var error = helper.checkNumber(obj, objName);
    if (error) {
        return error;
    }
    if (obj < 0) {
        return new IllegalArgumentError(objName + " should be greater or equal to 0");
    }
    return null;
};

/**
 * Check array contains a obj
 * @param {Array} elements the array.
 * @param {Object} obj the obj to check.
 * @param {String} objName the obj name.
 * @return {Error} if input not valid.
 */
helper.checkContains = function (elements, obj, objName) {
    var error = helper.checkArray(elements, "elements"), i;
    if (error) {
        return error;
    }
    for (i = 0; i < elements.length; i = i + 1) {
        if (elements[i] === obj) {
            return null;
        }
    }
    return new IllegalArgumentError(objName + " should be an element of " + elements + ".");
};

/**
 * Check Integer valid or not.
 * @param {Object} obj the obj to check.
 * @param {String} objName the obj name.
 * @return {Error} if input not valid.
 */
helper.checkInteger = function (obj, objName) {
    var result = helper.checkNumber(obj, objName);
    if (result) {
        return result;
    }
    if (obj % 1 !== 0) {
        result = new IllegalArgumentError(objName + " should be Integer.");
    }
    return result;
};


/**
 * Check Integer is valid page index (-1 or greater than 0) or not.
 * @param {Object} obj the obj to check.
 * @param {String} objName the obj name.
 * @return {Error} if input not valid.
 */
helper.checkPageIndex = function (obj, objName) {
    var result = helper.checkInteger(obj, objName);
    if (result) {
        return result;
    }
    if (obj !== -1 && obj < 1) {
        result = new IllegalArgumentError(objName + " should be equal to -1 or greater than 0");
    }
    return result;
};

/**
 * Check positive Integer valid or not.
 * @param {Object} obj the obj to check.
 * @param {String} objName the obj name.
 * @return {Error} if input not valid.
 */
helper.checkPositiveInteger = function (obj, objName) {
    var result = helper.checkInteger(obj, objName);
    if (result) {
        return result;
    }
    if (obj <= 0) {
        result = new IllegalArgumentError(objName + " should be positive.");
    }
    return result;
};


/**
 * Check date valid or not.
 * @param {Object} obj the obj to check.
 * @param {String} objName the obj name.
 * @return {Error} if input not valid.
 */
helper.checkFilterDate = function (date, dateName) {
    var result = helper.checkObject(date, dateName) ||
        helper.checkContains(helper.const.ALLOWABLE_DATE_TYPE, date.type, dateName + ".type");
    if (result) {
        return result;
    }
    if (date.type.toUpperCase() !== helper.const.AFTER_CURRENT_DATE &&
            date.type.toUpperCase() !== helper.const.BEFORE_CURRENT_DATE) {
        result = helper.checkString(date.firstDate, dateName + ".firstDate");
        if (!new Date(date.firstDate).getTime()) {
            result = result || new IllegalArgumentError(dateName + ".firstDate is invalid");
        }
    }
    if (date.type.toUpperCase() === helper.const.BETWEEN_DATES) {
        result = result || helper.checkString(date.secondDate, dateName + ".secondDate");
        if (!new Date(date.secondDate).getTime()) {
            result = result || new IllegalArgumentError(dateName + ".secondDate is invalid");
        }
    }
    return result;
};

/**
 * Convert array of string to lowercase
 * @param {Array} arr - the array of strings
 * @return {Array} the array with lowercase strings
 */
helper.getLowerCaseList = function (arr) {
    var ret = [];
    arr.forEach(function (s) {
        ret.push(s.toLowerCase());
    });
    return ret;
};

/**
  * This method tests if the given category name is valid or not.
  * @param {String} name - name of the category.
  * @param {Function<err>} callback - the callback function
  */
helper.isCategoryNameValid = function (name, callback) {
    var error = new IllegalArgumentError("The type parameter is not a correct project category value.");
    if (!name) {
        callback(error);
        return;
    }
    async.waterfall([
        function (cb) {
            helper.api.dataAccess.executeQuery("restapi_statistics_category_name_valid", { ctn: name }, cb);
        }, function (result, cb) {
            if (!result.length) {
                cb(error);
                return;
            }
            if (result[0].val > 0) {
                cb();
            } else {
                cb(error);
            }
        }
    ], callback);
};
/**
 * Check whether given integer is not greater than given max.
 * @param {Object} obj the obj to check.
 * @param {String} objName the obj name.
 * @return {Error} if input not valid.
 */
helper.checkMaxNumber = function (obj, max, objName) {
    var result = helper.checkInteger(obj, objName);
    if (result) {
        return result;
    }
    if (obj > max) {
        result = new IllegalArgumentError(objName + " should be less or equal to " + max + ".");
    }
    return result;
};

/**
 * Get color for given rating
 * @param {Number} rating - the rating
 * @return {String} the color name
 */
helper.getCoderColor = function (rating) {
    if (rating < 0) {
        return "Orange";
    }
    if (rating === 0) {
        return "Black";
    }
    if (rating > 0 && rating < 900) {
        return "Gray";
    }
    if (rating > 899 && rating < 1200) {
        return "Green";
    }
    if (rating > 1199 && rating < 1500) {
        return "Blue";
    }
    if (rating > 1499 && rating < 2200) {
        return "Yellow";
    }
    if (rating > 2199) {
        return "Red";
    }
    return "";
};

/**
 * Constant data
 */
helper.const = {
    ASCENDING: "asc",
    DESCENDING: "desc",
    BETWEEN_DATES: "BETWEEN_DATES",
    AFTER_CURRENT_DATE: "AFTER_CURRENT_DATE",
    BEFORE_CURRENT_DATE: "BEFORE_CURRENT_DATE",
    AFTER: "AFTER",
    BEFORE: "BEFORE",
    ON: "ON",
};
helper.const.ALLOWABLE_DATE_TYPE = [helper.const.AFTER, helper.const.AFTER_CURRENT_DATE, helper.const.BEFORE,
    helper.const.BEFORE_CURRENT_DATE, helper.const.BETWEEN_DATES, helper.const.ON];

/**
 * Api codes
 */
helper.apiCodes = {
    OK: {
        name: 'OK',
        value: 200,
        description: 'Success'
    },
    notModified: {
        name: 'Not Modified',
        value: 304,
        description: 'There was no new data to return.'
    },
    badRequest: {
        name: 'Bad Request',
        value: 400,
        description: 'The request was invalid. An accompanying message will explain why.'
    },
    unauthorized: {
        name: 'Unauthorized',
        value: 401,
        description: 'Authentication credentials were missing or incorrect.'
    },
    forbidden: {
        name: 'Forbidden',
        value: 403,
        description: 'The request is understood, but it has been refused or access is not allowed.'
    },
    notFound: {
        name: 'Not Found',
        value: 404,
        description: 'The URI requested is invalid or the requested resource does not exist.'
    },
    serverError: {
        name: 'Internal Server Error',
        value: 500,
        description: 'Something is broken. Please contact support.'
    }
};



/**
 * Handle error, set http code and error details to response
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} err - The error to return
 */
helper.handleError = function (api, connection, err) {
    api.log("Error occured: " + err + " " + (err.stack || ''), "error");
    var errdetail, helper = api.helper, baseError = helper.apiCodes.serverError;
    if (err instanceof IllegalArgumentError) {
        baseError = helper.apiCodes.badRequest;
    }
    if (err instanceof NotFoundError) {
        baseError = helper.apiCodes.notFound;
    }
    errdetail = _.clone(baseError);
    errdetail.details = err.message;
    connection.rawConnection.responseHttpCode = baseError.value;
    connection.response = { error: errdetail };
};

/**
* Expose the "helper" utility.
*
* @param {Object} api The api object that is used to access the infrastructure
* @param {Function<err>} next The callback function to be called when everyting is done
*/
exports.helper = function (api, next) {
    api.helper = helper;
    helper.api = api;


    _.mixin({
        isDefined: function (obj) {
            return !_.isNull(obj) && !_.isUndefined(obj);
        },

        checkArgument: function (expr, errorMessage) {
            if (!expr) {
                return new IllegalArgumentError(errorMessage);
            }
            return null;
        }
    });

    next();
};
