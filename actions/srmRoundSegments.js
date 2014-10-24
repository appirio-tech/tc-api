/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 */
/**
 * Implement the srm round segments api.
 * 
 * Changes in version 1.1 (Module Assembly - Web Arena - Match Configurations):
 * - Modified date format and make it norm to include timezone so that moment.js can parse time correctly
 *
 * @version 1.1
 * @author TCSASSEMBLER
 */

/*jslint node: true, nomen: true, plusplus: true, stupid: true, unparam: true */
"use strict";
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var IllegalArgumentError = require('../errors/IllegalArgumentError');

var DATE_FORMAT = "YYYY-MM-DD HH:mm:ssZZ";
var DB_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss";
/**
 * Check round id.
 *
 * @param api the api instance.
 * @param dbConnectionMap the database connection map
 * @param roundId - the roundId parameter
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
                    error = new IllegalArgumentError("The roundId does not exist in database.");
                }
            }
            cb(error);
        }
    ], function (err) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, error);
    });
}

/**
 * Check the round segments values.
 *
 * @param api the api instance.
 * @param dbConnectionMap the database connection map
 * @param registrationStart - the registration start date parameter
 * @param registrationLength - the registration duration parameter
 * @param codingStart - the coding start date parameter
 * @param codingLength - the coding duration parameter
 * @param intermissionLength - the intermission duration parameter
 * @param challengeLength - the challenge duration parameter
 * @param registrationStatus - the registration status parameter
 * @param codingStatus - the coding status parameter
 * @param intermissionStatus - the intermission status parameter
 * @param challengeStatus - the challenge status parameter
 * @param systemTestStatus - the system test status parameter
 * @param callback the callback method
 */
function checkRoundSegmentsValues(api, dbConnectionMap, registrationStart, registrationLength, codingStart, codingLength, intermissionLength,
         challengeLength, registrationStatus, codingStatus, intermissionStatus, challengeStatus, systemTestStatus, callback) {
    var helper = api.helper, error = null;

    async.waterfall([
        function (cb) {
            error = helper.validateDate(registrationStart, "registrationStart", DATE_FORMAT);

            if (!error) {
                error = helper.checkInteger(registrationLength, "registrationLength") || helper.checkNonNegativeNumber(registrationLength, "registrationLength");
            }

            if (!error) {
                error = helper.validateDate(codingStart, "codingStart", DATE_FORMAT);
            }
            if (!error) {
                error = helper.checkInteger(codingLength, "codingLength") || helper.checkNonNegativeNumber(codingLength, "codingLength");
            }

            if (!error) {
                error = helper.checkInteger(intermissionLength, "intermissionLength") || helper.checkNonNegativeNumber(intermissionLength, "intermissionLength");
            }

            if (!error) {
                error = helper.checkInteger(challengeLength, "challengeLength") || helper.checkNonNegativeNumber(challengeLength, "challengeLength");
            }

            if (!error) {
                error = helper.checkStringParameter(registrationStatus, "registrationStatus", 1);
            }
            if (!error) {
                error = helper.checkStringParameter(codingStatus, "codingStatus", 1);
            }
            if (!error) {
                error = helper.checkStringParameter(intermissionStatus, "intermissionStatus", 1);
            }
            if (!error) {
                error = helper.checkStringParameter(challengeStatus, "challengeStatus", 1);
            }
            if (!error) {
                error = helper.checkStringParameter(systemTestStatus, "systemTestStatus", 1);
            }
            cb(error);
        }
    ], function (err) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, error);
    });
}


/**
 * Set Round Segments.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var setRoundSegments = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        roundId = Number(connection.params.roundId),
        registrationStart = connection.params.registrationStart,
        registrationLength = connection.params.registrationLength,
        codingStart = connection.params.codingStart,
        codingLength = connection.params.codingLength,
        intermissionLength = connection.params.intermissionLength,
        challengeLength = connection.params.challengeLength,
        registrationStatus = connection.params.registrationStatus,
        codingStatus = connection.params.codingStatus,
        intermissionStatus = connection.params.intermissionStatus,
        challengeStatus = connection.params.challengeStatus,
        systemTestStatus = connection.params.systemTestStatus;

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            checkRoundId(api, dbConnectionMap, roundId, cb);
        }, function (error, cb) {
            if (!error) {
                checkRoundSegmentsValues(api, dbConnectionMap, registrationStart, registrationLength, codingStart, codingLength, intermissionLength,
                    challengeLength, registrationStatus, codingStatus, intermissionStatus, challengeStatus, systemTestStatus, cb);
            } else {
                cb(error);
            }

        }, function (error, cb) {
            if (!error) {
                api.dataAccess.executeQuery("delete_round_segments", {roundId: roundId}, dbConnectionMap, cb);
            } else {
                cb(error);
            }
        }, function (results, cb) {
            sqlParams.startTime = helper.formatDate(registrationStart, DB_DATE_FORMAT);
            api.log(sqlParams.startTime);            
            sqlParams.endTime = moment(registrationStart, DATE_FORMAT).add('minutes', registrationLength).format(DB_DATE_FORMAT);
            
            sqlParams.segmentId = helper.SEGMENTS_ID_MAP.REGISTRATION_PHASE;
            sqlParams.status = registrationStatus;
            sqlParams.roundId = roundId;
            api.dataAccess.executeQuery("insert_round_segments", sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            //the registration end time plus 1 minute
            sqlParams.startTime = moment(sqlParams.endTime, DB_DATE_FORMAT).add('minutes', 1).format(DB_DATE_FORMAT);
            sqlParams.endTime = helper.formatDate(codingStart, DB_DATE_FORMAT);
            sqlParams.segmentId = helper.SEGMENTS_ID_MAP.ROOM_ASSIGNMENT_PHASE;
            sqlParams.status = registrationStatus;
            api.dataAccess.executeQuery("insert_round_segments", sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            sqlParams.startTime = sqlParams.endTime;
            sqlParams.endTime = moment(sqlParams.startTime, DB_DATE_FORMAT).add('minutes', codingLength).format(DB_DATE_FORMAT);
            sqlParams.segmentId = helper.SEGMENTS_ID_MAP.CODING_PHASE;
            sqlParams.status = codingStatus;
            api.dataAccess.executeQuery("insert_round_segments", sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            sqlParams.startTime = sqlParams.endTime;
            sqlParams.endTime = moment(sqlParams.startTime, DB_DATE_FORMAT).add('minutes', intermissionLength).format(DB_DATE_FORMAT);
            sqlParams.segmentId = helper.SEGMENTS_ID_MAP.INTERMISSION_PHASE;
            sqlParams.status = intermissionStatus;
            api.dataAccess.executeQuery("insert_round_segments", sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            sqlParams.startTime = sqlParams.endTime;
            sqlParams.endTime = moment(sqlParams.startTime, DB_DATE_FORMAT).add('minutes', challengeLength).format(DB_DATE_FORMAT);
            sqlParams.segmentId = helper.SEGMENTS_ID_MAP.CHALLENGE_PHASE;
            sqlParams.status = challengeStatus;
            api.dataAccess.executeQuery("insert_round_segments", sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            sqlParams.startTime = sqlParams.endTime;
            sqlParams.segmentId = helper.SEGMENTS_ID_MAP.SYSTEM_TEST_PHASE;
            sqlParams.status = systemTestStatus;
            api.dataAccess.executeQuery("insert_round_segments", sqlParams, dbConnectionMap, cb);
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
 * The API for set Round Segments API.
 */
exports.setRoundSegments = {
    name: "setRoundSegments",
    description: "Set Round Segments",
    inputs: {
        required: ['roundId', 'registrationStart', 'registrationLength', 'codingStart', 'codingLength',
            'intermissionLength', 'challengeLength', 'registrationStatus', 'codingStatus', 'intermissionStatus',
            'challengeStatus', 'systemTestStatus'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute setRoundSegments#run", 'debug');
            setRoundSegments(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
