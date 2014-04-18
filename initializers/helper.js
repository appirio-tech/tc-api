/*jslint node: true, nomen: true */
/**
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 */

/**
 * This module contains helper functions.
 * @author Sky_, Ghost_141, muzehyun, kurtrips, isv, LazyChild, hesibo, panoptimum
 * @version 1.27
 * changes in 1.1:
 * - add mapProperties
 * changes in 1.2:
 * - add getPercent to underscore mixin
 * changes in 1.3:
 * - add convertToString
 * changes in 1.4:
 * - add function to get direct project link for a contest.
 * changes in 1.5:
 * - add softwareChallengeTypes and studioTypes.
 * - add function to get phase name based on phase id.
 * changes in 1.6:
 * - add socialProviders and getProviderId
 * - fix creating optional function for validation (to pass js lint)
 * changes in 1.7:
 * - add contestTypes
 * changes in 1.8:
 * - add checkDateFormat
 * - add checkAdmin
 * - change handleError to support UnauthorizedError and ForbiddenError
 * changes in 1.9:
 * - added a platform independent startsWith version to String prototype
 * - added more error types to handleError method
 * changes in 1.10:
 * - add isAdmin and isMember
 * changes in 1.11
 * - added handling of RequestTooLargeError
 * changes in 1.12
 * - add MAX_INT.
 * - update apiName2dbNameMap.
 * - update method isChallengeTypeValid to isChallengeTypeValid. And the check is based on project type now which make more sense.
 * - update method getSortColumnDBName to lowercase the column name when search it.
 * - update checkFilterDate to use checkDateFormat to check date value.
 * - add method formatDate.
 * changes in 1.13
 * - add method checkTrackName, getPhaseId.
 * - add phaseName2Id map.
 * Changes in 1.14:
 * - add method checkMember to check if the caller have at least member access leve.
 * changes in 1.15
 * - added checkUserExists function
 * Changes in 1.16
 * - add checkMember method to check if the user have at least member access level.
 * Changes in 1.17
 * - added method to load all file types (and cache the result for further use)
 * Changes in 1.18
 * - add checkRefresh method to check if the request is force refresh request.
 * changes in 1.19
 * - updated softwareChallengeTypes
 * changes in 1.20
 * - added activation code generation function (copied from memberRegistration.js)
 * Changes in 1.21:
 * - add LIST_TYPE_REGISTRATION_STATUS_MAP and VALID_LIST_TYPE.
 * Changes in 1.22:
 * - add allTermsAgreed method.
 * Changes in 1.23:
 * - add validatePassword method.
 * - introduce the stringUtils in this file.
 * - add PASSWORD_HASH_KEY.
 * changes in 1.24
 * - add PAYMENT_STATUS
 * - add checkSortColumn function
 * - update formatDate function
 * Changes in 1.25:
 * - add method transferDBResults2Response.
 * Changes in 1.26:
 * - add method formatInformixDate
 * Changes in 1.27:
 * - added checkEmailAddress
 */
"use strict";

/**
 * This method adds platform independent startsWith function to String, if it not exists already.
 * @author TCSASSEMBLER
 * @since 1.8
 */
if (typeof String.prototype.startsWith !== 'function') {
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) === 0;
    };
}

var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var stringUtils = require('../common/stringUtils');
var S = require('string');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');
var BadRequestError = require('../errors/BadRequestError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var ForbiddenError = require('../errors/ForbiddenError');
var RequestTooLargeError = require('../errors/RequestTooLargeError');
var helper = {};
var crypto = require("crypto");
var bigdecimal = require('bigdecimal');
var bignum = require('bignum');

/**
 * software type.
 */

helper.software = {
    community: 'develop',
    category: [1, 2]
};

/**
 * studio type.
 */
helper.studio = {
    community: 'design',
    category: [3]
};

/**
 * The studio and software type.
 */
helper.both = {
    community: 'both',
    category: [1, 2, 3]
};

/**
 * payment status
 */
helper.PAYMENT_STATUS = {
    53 : 'Paid',
    55 : 'On Hold',
    56 : 'Owed',
    65 : 'Cancelled',
    68 : 'Expired',
    70 : 'Entered into payment system',
    71 : 'Accruing'
};

/**
 * The max value for integer.
 */
helper.MAX_INT = 2147483647;

/**
 * HASH KEY For Password
 *
 * @since 1.23
 */
helper.PASSWORD_HASH_KEY = process.env.PASSWORD_HASH_KEY || 'default';

/**
 * The name in api response to database name map.
 */
var apiName2dbNameMap = {
    roundid: 'round_id',
    fullname: 'full_name',
    shortname: 'short_name',
    startdate: 'start_date',
    enddate: 'end_date',
    winnerhandle: 'winner_handle',
    winnerscore: 'winner_score',
    totalcompetitors: 'total_competitors',
    divicompetitors: 'div_i_competitors',
    diviicompetitors: 'div_ii_competitors',
    divitotalsolutionssubmitted: 'div_i_total_solutions_submitted',
    diviitotalsolutionssubmitted: 'div_ii_total_solutions_submitted',
    diviaveragesolutionssubmitted: 'div_i_average_solutions_submitted',
    diviiaveragesolutionssubmitted: 'div_ii_average_solutions_submitted',
    divitotalsolutionschallenged: 'div_i_total_solutions_challenged',
    diviitotalsolutionschallenged: 'div_ii_total_solutions_challenged',
    diviaveragesolutionschallenged: 'div_i_average_solutions_challenged',
    diviiaveragesolutionschallenged: 'div_ii_average_solutions_challenged',
    challengetype: 'challenge_type',
    challengename: 'challenge_name',
    challengeid: 'challenge_id',
    cmctaskid: 'cmc_task_id',
    registrationenddate: 'registration_end_date',
    submissionenddate: 'submission_end_date',
    finalfixenddate: 'final_fix_end_date',
    currentstatus: 'current_status',
    digitalrunpoints: 'digital_run_points',
    reviewstart: 'review_start',
    reviewend: 'review_end',
    reviewtype: 'review_type',
    numberofsubmissions: 'number_of_submissions',
    numberofreviewpositionsavailable: 'number_of_review_positions_available',
    round2scheduledstartdate: 'round_2_scheduled_start_date',
    round1scheduledstartdate: 'round_1_scheduled_start_date',
    postingdate: 'posting_date',
    numsubmissions: 'num_submissions',
    numregistrants: 'num_registrants',
    currentphaseremainingtime: 'current_phase_remaining_time',
    currentphasename: 'current_phase_name',
    registrationopen: 'registration_open'
};

/**
 * The challenges types
 */
helper.softwareChallengeTypes = {
    design: {
        name: "Design",
        phaseId: 112
    },
    development: {
        name: "Development",
        phaseId: 113,
        active: true
    },
    specification: {
        name: "Specification",
        phaseId: 117
    },
    architecture: {
        name: "Architecture",
        phaseId: 118
    },
    bug_hunt: {
        name: 'Bug Hunt',
        phaseId: 120
    },
    test_suites: {
        name: "Test Suites",
        phaseId: 124
    },
    assembly: {
        name: "Assembly",
        phaseId: 125
    },
    ui_prototypes: {
        name: "UI Prototypes",
        phaseId: 130
    },
    conceptualization: {
        name: "Conceptualization",
        phaseId: 134
    },
    ria_build: {
        name: "RIA Build",
        phaseId: 135
    },
    ria_component: {
        name: 'RIA Component',
        phaseId: 136
    },
    test_scenarios: {
        name: "Test Scenarios",
        phaseId: 137
    },
    copilot_posting: {
        name: 'Copilot Posting',
        phaseId: 140
    },
    content_creation: {
        name: "Content Creation",
        phaseId: 146
    },
    reporting: {
        name: 'Reporting',
        phaseId: 147
    },
    marathon_match: {
        name: 'Marathon Match',
        phaseId: 148
    },
    first2finish: {
        name: 'First2Finish',
        phaseId: 149
    },
    code: {
        name: 'Code',
        phaseId: 150
    },
    algorithm: {
        name: 'Algorithm',
        phaseId: 999
    }
};

/**
 * The studio challenge types.
 */
helper.studioChallengeTypes = {
    banners_icons: {
        name: "Banners/Icons",
        phaseId: 127
    },
    web_design: {
        name: "Web Design",
        phaseId: 128
    },
    wireframes: {
        name: "Wireframes",
        phaseId: 129
    },
    logo_design: {
        name: "Logo Design",
        phaseId: 131
    },
    print_presentation: {
        name: "Print/Presentation",
        phaseId: 132
    },
    idea_generation: {
        name: "Idea Generation",
        phaseId: 133
    },
    widget_or_mobile_screen_design: {
        name: "Widget or Mobile Screen Design",
        phaseId: 141
    },
    front_end_flash: {
        name: "Front-End Flash",
        phaseId: 142
    },
    application_front_end_design: {
        name: "Application Front-End Design",
        phaseId: 143
    },
    other: {
        name: "Other",
        phaseId: 145
    }
};

/**
 * Max value for integer
 */
helper.MAX_INT = 2147483647;

/**
 * The phase id to name map.
 */
var phaseId2Name = _.object(_.values(_.extend(helper.studioChallengeTypes, helper.softwareChallengeTypes)).map(function (item) {
    return [item.phaseId, item.name];
}));

/**
 * The phase name to id map.
 * @since 1.13
 */
var phaseName2Id = _.object(_.values(_.extend(helper.studioChallengeTypes, helper.softwareChallengeTypes)).map(function (item) {
    return [item.name.toLowerCase(), item.phaseId];
}));

/**
 * Represents a ListType enum
 * @since 1.21
 */
helper.ListType = { ACTIVE: "ACTIVE", OPEN: "OPEN", UPCOMING: "UPCOMING", PAST: "PAST" };

/**
 * valid value for listType.
 * @since 1.21
 */
helper.VALID_LIST_TYPE = [helper.ListType.ACTIVE, helper.ListType.OPEN, helper.ListType.UPCOMING, helper.ListType.PAST];

/**
 * The list type and registration phase status map.
 * @since 1.21
 */
helper.LIST_TYPE_REGISTRATION_STATUS_MAP = {};
helper.LIST_TYPE_REGISTRATION_STATUS_MAP[helper.ListType.ACTIVE] = [2, 3];
helper.LIST_TYPE_REGISTRATION_STATUS_MAP[helper.ListType.OPEN] = [2];
helper.LIST_TYPE_REGISTRATION_STATUS_MAP[helper.ListType.UPCOMING] = [1];
helper.LIST_TYPE_REGISTRATION_STATUS_MAP[helper.ListType.PAST] = [3];

/**
 * The list type and project status map.
 * @since 1.21
 */
helper.LIST_TYPE_PROJECT_STATUS_MAP = {};
helper.LIST_TYPE_PROJECT_STATUS_MAP[helper.ListType.ACTIVE] = [1];
helper.LIST_TYPE_PROJECT_STATUS_MAP[helper.ListType.OPEN] = [1];
helper.LIST_TYPE_PROJECT_STATUS_MAP[helper.ListType.UPCOMING] = [2];
helper.LIST_TYPE_PROJECT_STATUS_MAP[helper.ListType.PAST] = [4, 5, 6, 7, 8, 9, 10, 11];

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
 * @param {Object} obj the obj to check.
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
 * Check Object given object is email address.
 * @param {Object} obj the obj to check.
 * @param {String} objName the obj name.
 * @return {Error} if invalid or null if valid.
 * @since 1.22
 */
helper.checkEmailAddress = function (obj, objName) {
    var pattern = /^(?:(?:\w|[\-+])+)(?:\.(?:\w|[\-+])+)*@(?:\w|\-)+(?:\.(?:\w|\-)+)*(?:\.[abcdefghijklmnopqrstuvwxyz]{2,})$/i,
        error = helper.checkString(obj, objName);
    if (!error && obj.length > 100) {
        error = new IllegalArgumentError(objName + " exceeds 100 characters.");
    }
    if (!error && !pattern.test(obj)) {
        error = new IllegalArgumentError(objName + " should be email address.");
    }
    return error;
};

/**
 * Check Object given object is string and is not null or empty after trimming.
 * @param {Object} obj the obj to check.
 * @param {String} objName the obj name.
 * @return {Error} if invalid or null if valid.
 */
helper.checkStringPopulated = function (obj, objName) {
    if (_.isUndefined(obj)) {
        return new IllegalArgumentError(objName + " should be defined.");
    }
    if (!_.isString(obj)) {
        return new IllegalArgumentError(objName + " should be string.");
    }
    if (_.isNull(obj) || obj.trim() === '') {
        return new IllegalArgumentError(objName + " should be non-null and non-empty string.");
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
    var result = helper.checkMaxInt(obj, objName);
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
 * @param {Object} date the obj to check.
 * @param {String} dateName the obj name.
 * @param {String} dateFormat - the format of the date value.
 * @return {Error} if input not valid.
 */
helper.checkFilterDate = function (date, dateName, dateFormat) {
    var result = helper.checkObject(date, dateName) ||
        helper.checkContains(helper.consts.ALLOWABLE_DATE_TYPE, date.type, dateName + ".type");
    if (result) {
        return result;
    }
    if (date.type.toUpperCase() !== helper.consts.AFTER_CURRENT_DATE &&
            date.type.toUpperCase() !== helper.consts.BEFORE_CURRENT_DATE) {
        result = helper.checkDateFormat(date.firstDate, dateFormat, dateName + '.firstDate');
        if (!new Date(date.firstDate).getTime()) {
            result = result || new IllegalArgumentError(dateName + ".firstDate is invalid");
        }
    }
    if (date.type.toUpperCase() === helper.consts.BETWEEN_DATES) {
        result = result || helper.checkDateFormat(date.secondDate, dateFormat, dateName + '.secondDate');
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
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Object} challengeType - the challengeType object
 * @param {Function<err>} callback - the callback function
 */
helper.isChallengeTypeValid = function (name, dbConnectionMap, challengeType, callback) {
    var error = new IllegalArgumentError("The challengeType parameter is not a correct project category value.");
    if (!name) {
        callback(error);
        return;
    }
    async.waterfall([
        function (cb) {
            helper.api.dataAccess.executeQuery("restapi_statistics_category_name_valid",
                { categoryName: name, projectTypeId: challengeType.category }, dbConnectionMap, cb);
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
 * @param {Number} max the obj name.
 * @param {String} objName the object name.
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
helper.consts = {
    ASCENDING: "asc",
    DESCENDING: "desc",
    BETWEEN_DATES: "BETWEEN_DATES",
    AFTER_CURRENT_DATE: "AFTER_CURRENT_DATE",
    BEFORE_CURRENT_DATE: "BEFORE_CURRENT_DATE",
    AFTER: "AFTER",
    BEFORE: "BEFORE",
    ON: "ON"
};
helper.consts.ALLOWABLE_DATE_TYPE = [helper.consts.AFTER, helper.consts.AFTER_CURRENT_DATE, helper.consts.BEFORE,
    helper.consts.BEFORE_CURRENT_DATE, helper.consts.BETWEEN_DATES, helper.consts.ON];

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
    requestTooLarge: {
        name: 'Request Too Large',
        value: 413,
        description: 'The request is understood, but is larger than the server is willing or able to process.'
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
    api.log("Error occurred: " + err + " " + (err.stack || ''), "error");
    var errdetail, helper = api.helper, baseError = helper.apiCodes.serverError;
    if (err instanceof IllegalArgumentError || err instanceof BadRequestError) {
        baseError = helper.apiCodes.badRequest;
    }
    if (err instanceof NotFoundError) {
        baseError = helper.apiCodes.notFound;
    }
    if (err instanceof UnauthorizedError) {
        baseError = helper.apiCodes.unauthorized;
    }
    if (err instanceof ForbiddenError) {
        baseError = helper.apiCodes.forbidden;
    }
    if (err instanceof RequestTooLargeError) {
        baseError = helper.apiCodes.requestTooLarge;
    }
    errdetail = _.clone(baseError);
    errdetail.details = err.message;
    connection.rawConnection.responseHttpCode = baseError.value;
    connection.response = { error: errdetail };
};

/**
 * Map properties from db object and return new object.
 * Db object has always all properties in lowercase.
 *
 * @param {Object} source - The source db object
 * @param {Array<String>} properties - The properties to map
 * @param {Object} target - The target object that will have appended properties. Optional.
 * @return {Object} the new object
 */
helper.mapProperties = function (source, properties, target) {
    var ret = target || {};
    properties.forEach(function (p) {
        ret[p] = source[p.toLowerCase()];
    });
    return ret;
};

/**
 * Handle no dbConnectionMap
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Function} next - The callback function
 */
helper.handleNoConnection = function (api, connection, next) {
    api.log("dbConnectionMap is null", "debug");
    connection.rawConnection.responseHttpCode = 500;
    connection.response = { message: "No connection object." };
    next(connection, true);
};

/**
 * Convert null string or if string is equal to "null"
 * @param {String} str - the string to convert.
 * @return {String} converted string
 */
helper.convertToString = function (str) {
    if (!str || str === "null") {
        return "";
    }
    return str;
};

/**
 * Get the project link in direct for this challenge.
 * @param {Number} challengeId - the challenge id(project id) of this challenge.
 */
helper.getDirectProjectLink = function (challengeId) {
    return 'https://www.topcoder.com/direct/contest/detail.action?projectId=' + challengeId;
};

/**
 * Get the reliability bonus based on the given first prize.
 * @param {Number} prize - the prize.
 */
helper.getReliabilityBonus = function (prize) {
    return _.isNumber(prize) ? prize * 0.2 : 0;
};

/**
 * Get the sort column name in database based on given sort column.
 * @param {String} apiName - the api name to sort.
 */
helper.getSortColumnDBName = function (apiName) {
    if (_.isDefined(apiName2dbNameMap[apiName.toLowerCase()])) {
        return apiName2dbNameMap[apiName.toLowerCase()];
    }
    return apiName;
};


/**
 * Social providers map to database id
 */
helper.socialProviders = {
    "facebook": 1,
    "google": 2,
    "twitter": 3,
    "github": 4,
    "salesforce": 5,
    "ad": 50
};

/**
 * Retrieve provider information from the provider name.
 *
 * @param {String} provider the provider provided by Auth0.
 * @param {Function<err, providerId>} callback the callback function
 */
helper.getProviderId = function (provider, callback) {
    var providerId;
    if (provider.startsWith("facebook")) {
        providerId = helper.socialProviders.facebook;
    }
    if (provider.startsWith("google")) {
        providerId = helper.socialProviders.google;
    }
    if (provider.startsWith("twitter")) {
        providerId = helper.socialProviders.twitter;
    }
    if (provider.startsWith("github")) {
        providerId = helper.socialProviders.github;
    }
    if (provider.startsWith("salesforce")) {
        providerId = helper.socialProviders.salesforce;
    }
    if (provider.startsWith("ad")) {
        providerId = helper.socialProviders.ad;
    }
    if (providerId) {
        callback(null, providerId);
    } else {
        callback(new Error('Social provider: ' + provider + ' is not defined in config'));
    }
};
/* Encrypt the password using the specified key. After being
 * encrypted with a Blowfish key, the encrypted byte array is
 * then encoded with a base 64 encoding, resulting in the String
 * that is returned.
 *
 * @param password The password to encrypt.
 *
 * @param key The base 64 encoded Blowfish key.
 *
 * @return the encrypted and encoded password
 */
helper.encodePassword = function (password, key) {
    var bKey = new Buffer(key, "base64"),
        cipher = crypto.createCipheriv("bf-ecb", bKey, ''),
        result = cipher.update(password, "utf8", "base64");
    result += cipher.final("base64");
    return result;
};

/**
 * Decrypt the password using the specified key. Takes a password
 * that has been ecrypted and encoded, uses base 64 decoding and
 * Blowfish decryption to return the original string.
 *
 * @param password base64 encoded string.
 *
 * @param key The base 64 encoded Blowfish key.
 *
 * @return the decypted password
 */
helper.decodePassword = function (password, key) {
    var bKey = new Buffer(key, "base64"),
        decipher = crypto.createDecipheriv("bf-ecb", bKey, ''),
        result = decipher.update(password, "base64", "utf8");
    result += decipher.final("utf8");
    return result;
};

/**
 * Represents the actions that allow force refresh.
 *
 * @type {string[]}
 */
var ALLOW_FORCE_REFRESH_ACTIONS = ["getSoftwareChallenge", "getStudioChallenge"];

/**
 * Check whether current request is a force refresh request.
 *
 * @param {Object} connection The connection object for the current request
 * @returns {Boolean} whether this is a force refresh request
 */
helper.checkRefresh = function (connection) {
    if (!_.contains(ALLOW_FORCE_REFRESH_ACTIONS, connection.action)) {
        return false;
    }
    return connection.params.refresh === 't';
};

/**
 * Create unique cache key for given connection.
 * Key depends on action name and query parameters (connection.params).
 *
 * @param {Object} connection The connection object for the current request
 * @param {Boolean} userUnique If true the key incorporates the connection.id identifier, making it unique to a given caller.
 * @return {String} the key
 */
helper.createCacheKey = function (connection, userUnique) {
    var sorted = [], prop, val, json;
    for (prop in connection.params) {
        if (connection.params.hasOwnProperty(prop)) {
            val = connection.params[prop];
            if (_.isString(val)) {
                val = val.toLowerCase();
            }
            sorted.push([prop, val]);
        }
    }
    if (userUnique) {
        sorted.push(['callerId', connection.id]);
    }
    sorted.sort(function (a, b) {
        return a[1] - b[1];
    });
    json = JSON.stringify(sorted);
    return crypto.createHash('md5').update(json).digest('hex');
};

/**
 * Get cached value for given key. If object doesn't exist or is expired then null is returned.
 *
 * @param {Object} key The key object for the current request
 * @param {Function<err, value>} callback The callback function
 * @since 1.1
 */
/*jslint unparam: true */
helper.getCachedValue = function (key, callback) {
    helper.api.cache.load(key, function (err, value) {
        //ignore err
        //err can be only "Object not found" or "Object expired"
        callback(null, value);
    });
};

/**
 * Get the phase name based on phase Id
 * @param {Number} phaseId - the phase id.
 */
helper.getPhaseName = function (phaseId) {
    return phaseId2Name[phaseId];
};

/**
 * Get the phase name by given phase id.
 * @param {String} phaseName - the phase name.
 * @returns {Number} - the phase id.
 * @since 1.13
 */
helper.getPhaseId = function (phaseName) {
    return phaseName2Id[phaseName.toLowerCase()];
};


/**
 * Get the color style information based on given rating.
 * @param {Number} rating - the rating.
 */
helper.getColorStyle = function (rating) {

    if (rating === null) {
        return "color: #000000";
    }

    if (rating < 0) {
        return "color: #FF9900"; // orange
    }
    if (rating < 900) {
        return "color: #999999";// gray
    }
    if (rating < 1200) {
        return "color: #00A900";// green
    }
    if (rating < 1500) {
        return "color: #6666FF";// blue
    }
    if (rating < 2200) {
        return "color: #DDCC00";// yellow
    }
    if (rating > 2199) {
        return "color: #EE0000";// red
    }
    // return black otherwise.
    return "color: #000000";

};


/**
 * Check whether given date is in the given format
 * @param {String} date the date to check
 * @param {String} format the date format
 * @param {String} objName the object name.
 * @return {Error} if input not valid.
 */
helper.checkDateFormat = function (date, format, objName) {
    if (moment(date, format, true).isValid()) {
        return null;
    }
    return new IllegalArgumentError("Invalid " + objName + ". Expected format is " + format);
};

/**
 * Check whether given user is Admin or not
 * @param connection
 * @return {Error} if user is not admin
 */
helper.checkAdmin = function (connection) {
    if (!connection.caller || connection.caller.accessLevel === "anon") {
        return new UnauthorizedError();
    }

    if (connection.caller.accessLevel === "member") {
        return new ForbiddenError();
    }

    if (connection.caller.accessLevel === "admin") {
        return null;
    }
    return new ForbiddenError();
};

/**
 * Check if the caller has at least member access level.
 * @param {Object} connection - the connection object.
 * @param {String} unauthorizedErrorMessage - the error message for unauthorized error.
 * @returns {Error} if the caller don't have at least member access level. An error will be returned.
 * @since 1.13
 */
helper.checkMember = function (connection, unauthorizedErrorMessage) {
    var caller = connection.caller;
    if (!_.isDefined(caller) || caller.accessLevel === 'anon') {
        return new UnauthorizedError(unauthorizedErrorMessage);
    }
    if (!helper.isMember(caller)) {
        return new UnauthorizedError(unauthorizedErrorMessage);
    }
    return null;
};

/**
 * @return {Error} if input not valid.
 */
helper.checkMaxInt = function (obj, objName) {
    return helper.checkMaxNumber(obj, helper.MAX_INT, objName);
};

/**
 * Check if the caller is admin of TopCoder community.
 * @param {Object} caller - the caller of api.
 * @since 1.8
 */
helper.isAdmin = function (caller) {
    return caller.accessLevel === 'admin';
};

/**
 * Check if the caller is member of TopCoder community.
 * @param {Object} caller - the caller of api.
 * @since 1.8
 */
helper.isMember = function (caller) {
    return caller.accessLevel === 'member' || caller.accessLevel === 'admin';
};

/**
 * Check if the date is a valid date value.
 * @param {String} dateVal - the date value.
 * @param {String} dateName - the date name.
 * @param {String} format - the date format.
 * @since 1.8
 */
helper.validateDate = function (dateVal, dateName, format) {
    if (!moment(dateVal, format, true).isValid()) {
        return new IllegalArgumentError(dateName + ' is not a valid date.');
    }
    return null;
};

/**
 * Check dates. Check if the start date is after the end date or the start date and end date are same date.
 * @param {String} startDate - the start date value.
 * @param {String} endDate - the end date value.
 * @since 1.8
 */
helper.checkDates = function (startDate, endDate) {
    if (moment(startDate).isAfter(endDate) || moment(startDate).isSame(endDate)) {
        return new IllegalArgumentError('startDate should be earlier than endDate or at same date.');
    }
    return null;
};

/**
 * Format the date value to determine format.
 * Will return empty string if the date is null.
 * @param {String} date - the date value.
 * @param {String} format - the format.
 * @since 1.8
 */
helper.formatDate = function (date, format) {
    if (date) {
        return moment(date).format(format);
    }
    return '';
};

/**
 * Format the date value.
 * @param {String} date - the date value
 * @param {String} format - the format
 * @since 1.26
 */
helper.formatInformixDate = function (date, format) {
    if (!_.isUndefined(date)) {
        return date.substring(0, format.length);
    }
    return '';
};

/**
 * Check if the track name is a valid one.
 * @param {String} track - the track name.
 * @param {Boolean} isStudio - represent the track is a studio track name or not.
 * @returns {Error} - if the track name is invalid.
 * @since 1.13
 */
helper.checkTrackName = function (track, isStudio) {
    var validTrack = isStudio ? helper.studioChallengeTypes : helper.softwareChallengeTypes,
        validTrackName = _.map(_.values(validTrack), function (item) { return item.name.toLowerCase(); });
    return helper.checkContains(validTrackName, track, 'track');
};

/**
 * Transfer db results to camelize response object.
 * @param {Object} results - the results from database.
 * @since 1.25
 */
helper.transferDBResults2Response = function (results) {
    return _.map(results, function (row) {
        return _.object(_.chain(row).keys().map(function (item) { return new S(item).camelize().s; }).value(), _.values(row));
    });
};

/**
 * Checks whether given user is registered or not. If user not exist then NotFoundError is returned to callback.
 *
 * @param {String} handle - the handle to check
 * @param {Object} api - the action hero api object
 * @param {Object} dbConnectionMap - the database connection map
 * @param {Function<err>} callback - the callback function
 */
helper.checkUserExists = function (handle, api, dbConnectionMap, callback) {
    // Check cache first
    var cacheKey = "users-" + handle;
    api.helper.getCachedValue(cacheKey, function (err, exists) {
        if (!exists) {
            // If there is no hit in cache then query DB to check user account for existence and cache positive result
            // only
            api.log("No hit in users cache for [" + handle + "]. Will query database.", "debug");
            api.dataAccess.executeQuery("check_coder_exist", { handle: handle }, dbConnectionMap, function (err, result) {
                if (err) {
                    callback(err);
                    return;
                }
                if (result && result[0] && result[0].handle_exist !== 0) {
                    var lifetime = api.config.general.defaultUserCacheLifetime;
                    api.cache.save(cacheKey, true, lifetime); // storing primitive boolean "true" value as cache value
                    callback(err, null);
                } else {
                    callback(err, new NotFoundError("User does not exist."));
                }
            });
        } else {
            api.log("There is a hit in users cache for [" + handle + "].", "debug");
            callback(err, null);
        }
    });
};

/**
 * Validate the given password value.
 * @param {String} password - the password value.
 * @returns {Object} - Return error if the given password is invalid.
 * @since 1.23
 */
helper.validatePassword = function (password) {
    var value = password.trim(),
        configGeneral = helper.api.config.general,
        i,
        error;
    error = helper.checkStringPopulated(password, 'password');
    if (error) {
        return error;
    }
    if (value.length > configGeneral.maxPasswordLength) {
        return new IllegalArgumentError('password may contain at most ' + configGeneral.maxPasswordLength + ' characters.');
    }
    if (value.length < configGeneral.minPasswordLength) {
        return new IllegalArgumentError('password must be at least ' + configGeneral.minPasswordLength + ' characters in length.');
    }
    for (i = 0; i < password.length; i += 1) {
        if (!_.contains(stringUtils.PASSWORD_ALPHABET, password.charAt(i))) {
            return new IllegalArgumentError('Your password may contain only letters, numbers and ' + stringUtils.PUNCTUATION);
        }
    }

    return null;
};

/**
 * check if the every terms has been agreed
 *
 * @param {Array} terms - The terms.
 * @returns {Boolean} true if all terms agreed otherwise false.
 * @since 1.22
 */
helper.allTermsAgreed = function (terms) {
    return _.every(terms, function (term) {
        return term.agreed;
    });
};

/**
 * Gets all file types and caches them.
 * @param {Object} api - the action hero api object
 * @param {Object} dbConnectionMap - the database connection map
 * @param {Function<err,fileTypes>} callback - the callback function - expects err as the first param and fileTypes as the second
 * @since 1.13
 */
helper.getFileTypes = function (api, dbConnectionMap, callback) {
    var cacheFileTypesKey = api.config.redis.cacheFileTypesKey,
        cacheDefaultLifetime = api.config.redis.cacheDefaultLifetime;

    //Load from cache and perform rolling timeout
    api.cache.load(cacheFileTypesKey, {expireTimeMS: cacheDefaultLifetime}, function (err, fileTypes) {
        if (!err && fileTypes !== null) {
            //already exists in cache
            callback(null, fileTypes);
        } else {
            //Either error was thrown in cache lookup or fileTypes were not found in cache. So we do the DB lookup
            api.dataAccess.executeQuery("file_types", {}, dbConnectionMap, function (err, fileTypes) {
                if (err) {
                    callback(err);
                    return;
                }
                api.cache.save(cacheFileTypesKey, fileTypes, cacheDefaultLifetime, function (err) {
                    //Even if there is error in saving to cache, we just ignore and call the main callback anyway
                    callback(null, fileTypes);
                });
            });
        }
    });
};

/**
 * Check sort column.
 *
 * @param {Array} sortColumns - the valid sort columns list.
 * @param {Object} sortColumn - the sort column to check.
 * @return {Error} if input not valid.
 *
 * @since 1.24
 */
helper.checkSortColumn = function (sortColumns, sortColumn) {
    var error = helper.checkArray(sortColumns, "sortColumns");
    if (error) {
        return error;
    }
    if (helper.getLowerCaseList(sortColumns).indexOf(sortColumn) === -1) {
        return new IllegalArgumentError("The sort column '" + sortColumn + "' is invalid, it should be element of " + sortColumns + ".");
    }
    return null;
};

/*
 * this is the random int generator class
 */
function codeRandom(coderId) {
    var cr = {},
        multiplier = 0x5DEECE66D,
        addend = 0xB,
        mask = 281474976710655;
    cr.seed = bignum(coderId).xor(multiplier).and(mask);
    cr.nextInt = function () {
        var oldseed = cr.seed,
            nextseed;
        do {
            nextseed = oldseed.mul(multiplier).add(addend).and(mask);
        } while (oldseed.toNumber() === nextseed.toNumber());
        cr.seed = nextseed;
        return nextseed.shiftRight(16).toNumber();
    };

    return cr;
}

/**
 * get the code string by coderId
 * @param coderId  the coder id of long type.
 * @return the coder id generated hash string.
 */
function generateActivationCode(coderId) {
    var r = codeRandom(coderId);
    var nextBytes = function (bytes) {
        for (var i = 0, len = bytes.length; i < len;)
            for (var rnd = r.nextInt(), n = Math.min(len - i, 4); n-- > 0; rnd >>= 8) {
                var val = rnd & 0xff;
                if (val > 127) {
                    val = val - 256;
                }
                bytes[i++] = val;
            }
    };
    var randomBits = function(numBits) {
        if (numBits < 0)
            throw new Error("numBits must be non-negative");
        var numBytes = Math.floor((numBits + 7) / 8); // avoid overflow
        var randomBits = new Int8Array(numBytes);

        // Generate random bytes and mask out any excess bits
        if (numBytes > 0) {
            nextBytes(randomBits);
            var excessBits = 8 * numBytes - numBits;
            randomBits[0] &= (1 << (8 - excessBits)) - 1;
        }
        return randomBits;
    }
    var id = coderId + "";
    var baseHash = bignum(new bigdecimal.BigInteger("TopCoder", 36));
    var len = coderId.toString(2).length;
    var arr = randomBits(len);
    var bb = bignum.fromBuffer(new Buffer(arr));
    var hash = bb.add(baseHash).toString();
    while (hash.length < id.length) {
        hash = "0" + hash;
    }
    hash = hash.substring(hash.length - id.length);

    var result = new bigdecimal.BigInteger(id + hash);
    result = result.toString(36).toUpperCase();
    return result;
}

/**
 * get the coder id string by activation code
 * @param activationCode the activation code string.
 * @return the coder id.
 */
var getCoderIdFromActivationCode = function (activationCode) {
    var idhash, coderId;

    try {
        idhash = bignum(new bigdecimal.BigInteger(activationCode, 36)).toString();
    } catch (err) {
        return 0;
    }

    if (idhash.length % 2 !== 0) {
        return 0;
    }
    coderId = idhash.substring(0, idhash.length / 2);

    return coderId;
};

helper.getCoderIdFromActivationCode = getCoderIdFromActivationCode;
helper.generateActivationCode = generateActivationCode;

/**
* Expose the "helper" utility.
*
* @param {Object} api The api object that is used to access the infrastructure
* @param {Function<err>} next The callback function to be called when everything is done
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
        },

        /**
         * Format float number to percent with fixed decimal places.
         * @param {Number} number - the number to fix
         * @param {Number} fixedSize - the decimal places
         * @return {String} the formatted percent
         */
        getPercent: function (number, fixedSize) {
            return (number * 100).toFixed(fixedSize) + "%";
        }
    });

    /**
     * Create optional version for given function
     * @param {String} funName the function name
     */
    function createOptionalFunction(funName) {
        if (/^check/.test(funName) && _.isFunction(helper[funName])) {
            helper[funName + "Optional"] = function (val) {
                if (!_.isDefined(val)) {
                    return null;
                }
                return helper[funName].apply(this, arguments);
            };
        }
    }
    var prop;
    /**
     * Create optional validation
     */
    for (prop in helper) {
        if (helper.hasOwnProperty(prop)) {
            createOptionalFunction(prop);
        }
    }

    next();
};
