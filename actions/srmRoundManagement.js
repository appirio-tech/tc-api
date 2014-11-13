/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 */
/**
 * Create, modify, list and delete SRM round.
 *
 * Changes in version 1.1 (Module Assembly - Web Arena - Match Configurations):
 * - Updated ListSRMContestRounds to send UTC time in milliseconds for registration and coding start time
 *
 * @version 1.1
 * @author TCSASSEMBLER
 */
/*jslint node: true, nomen: true */
"use strict";
var async = require('async');
var _ = require('underscore');
var NotFoundError = require('../errors/NotFoundError');

/**
 * Max value for integer
 */
var MAX_INT = 2147483647;

/**
 * Long round type id. From com.topcoder.netCommon
 */
var LONG_ROUND_TYPE_ID = 10;

/**
 * Practice round type id.
 */
var PRACTICE_ROUND_TYPE_ID = 3;

/**
 * Long problem practice round type id.
 */
var LONG_PROBLEM_PRACTICE_ROUND_TYPE_ID = 14;

/**
 * AMD long problem practice round type id.
 */
var AMD_LONG_PROBLEM_PRACTICE_ROUND_TYPE_ID = 23;

/**
 * Moderated chat round type id
 */
var MODERATED_CHAT_ROUND_TYPE_ID = 4;

/**
 * Team type ids.
 */
var TEAM_SINGLE_ROUND_MATCH_TYPE_ID = 7;
var TEAM_TOURNAMENT_ROUND_TYPE_ID = 8;
var TEAM_PRACTICE_ROUND_TYPE_ID = 9;

/**
 * Different types of marathon round's id.
 */
var MARATHON_MATCH_TYPE_ID = 13;
var MARATHON_MATCH_PRACTICE_TYPE_ID = 14;
var INTEL_MARATHON_MATCH_TYPE_ID = 15;
var INTEL_MARATHON_MATCH_PRACTICE_TYPE_ID = 16;
var MARATHON_MATCH_TOURNAMENT_ROUND_TYPE_ID = 19;
var AMD_MARATHON_MATCH_TYPE_ID = 22;
var AMD_MARATHOND_MATCH_Practice_TYPE_ID = 23;

/**
 * Admin room type id
 */
var ADMIN_ROOM_TYPE_ID = 1;

/**
 * Contest room type id
 */
var CONTEST_ROOM_TYPE_ID = 2;

/**
 * Practice chat room id.
 */
var PRACTICE_ROOM_TYPE_ID = 3;

/**
 * Moderated chat room id.
 */
var MODERATED_CHAT_ROOM_TYPE_ID = 4;

/**
 * Team contest room type id.
 */
var TEAM_CONTEST_ROOM_TYPE_ID = 6;

/**
 * Team practice chat room type id.
 */
var TEAM_PRACTICE_ROOM_TYPE_ID = 7;

/**
 * Format datetime from DB result
 * @param {String} dbdatetime - datetime from db
 * @return {Date} - date object
 */
function formatDateTimeFromDB(dbdatetime) {
    var s;
    if (dbdatetime) {
        s = dbdatetime.toString();
        s = s.slice(0, s.length - 5) + "+0000";
        return new Date(s);
    }
    return new Date(0);
}

/**
 * Calculate duration between two JDBC DateTime objects (in sec)
 * @param {DataTime} start start datetime
 * @param {DateTime} end end datetime
 */
function duration(start, end) {
    var end_time = end ? new Date(end.toString()).getTime() : 0,
        start_time = start ? new Date(start.toString()).getTime() : 0;
    return Math.round((end_time - start_time) / 60000);
}

/**
* The API for listing SRM Rounds for one contest.
* It's an reimplement of com.topcoder.server.ejb.AdminServices.AdminServicesBean.getRounds.
* So it tries to keep with the same logic as getRounds.
* Response format is also following com.topcoder.server.contest.RoundData
* except some foreign-key fields which could be implied
* via object's context.
*/
exports.listSRMContestRounds = {
    name: "listSRMContestRounds",
    description: "listSRMContestRounds",
    inputs: {
        required: ["contestId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        api.log("Execute listSRMContestRounds#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            id = Number(connection.params.contestId),
            helper = api.helper;
        if (!connection.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                var error = helper.checkAdmin(connection, "You need to be authorized first.", "You are forbidden for this API.") ||
                    helper.checkIdParameter(id, 'contestId');
                cb(error);

            },
            function (cb) {
                api.dataAccess.executeQuery("list_srm_contest_rounds",
                    {contestId: id},
                    dbConnectionMap,
                    cb);
            },
            function (results, cb) {
                async.mapSeries(results, function (result, cbx) {
                    // Helper for execute get_round_xxx queries.
                    function getRoundHelper(queryname, func) {
                        return function (cb) {
                            async.waterfall([
                                function (cb) {
                                    api.dataAccess.executeQuery(queryname,
                                        {round_id: result.round_id},
                                        dbConnectionMap,
                                        cb);
                                },
                                func
                            ], cb);
                        };
                    }

                    var r = {
                        contest: {
                            id: id
                        },
                        id: result.round_id,
                        name: result.name,
                        status: result.status,
                        registrationLimit: result.registration_limit,
                        invitationalType: result.invitational,
                        short_name: result.short_name,
                        type: {
                            id: result.round_type_id,
                            desc: result.round_type_desc
                        }
                    },
                        // Define a few helper functions to retrieve RoundData's nested data fields, and
                        // execute them via async
                        getRoundSegments = getRoundHelper("get_round_segments", function (segments, cb) {
                            var rr = {};
                            _.forEach(segments, function (segment) {
                                var end_time = segment.end_time ? new Date(segment.end_time.toString()).getTime() : 0,
                                    start_time = segment.start_time ? new Date(segment.start_time.toString()).getTime() : 0;
                                segment.duration = Math.round((end_time - start_time) / 60000);
                                switch (segment.segment_id) {
                                case 1:
                                    rr.registrationStart = helper.formatDateWithTimezone(formatDateTimeFromDB(segment.start_time));
                                    rr.registrationStartTime = start_time;
                                    rr.registrationLength = segment.duration;
                                    rr.registrationStatus = segment.status;
                                    break;
                                case 2:
                                    rr.codingStart = helper.formatDateWithTimezone(formatDateTimeFromDB(segment.start_time));
                                    rr.codingStartTime = start_time;
                                    rr.codingLength = segment.duration;
                                    rr.codingStatus = segment.status;
                                    break;
                                case 3:
                                    rr.intermissionLength = segment.duration;
                                    rr.intermissionStatus = segment.status;
                                    break;
                                case 4:
                                    rr.challengeLength = segment.duration;
                                    rr.challengeStatus = segment.status;
                                    break;
                                case 5:
                                    rr.systemTestStatus = segment.status;
                                    break;
                                }
                            });
                            if (segments.length === 0) {
                                rr = undefined;
                            } else {
                                rr.roundId = result.round_id;
                            }
                            cb(null, rr);
                        }),

                        getRoundSurvey = getRoundHelper("get_round_survey", function (surveys, cb) {
                            var rr,
                                survey;
                            if (surveys.length !== 0) {
                                survey = surveys[0];
                                rr = {
                                    roundId: result.round_id,
                                    length: duration(survey.start_date, survey.end_date),
                                    name: survey.name,
                                    startDate: helper.formatDateWithTimezone(formatDateTimeFromDB(survey.start_date)),
                                    surveyText: survey.text,
                                    status: {
                                        id: survey.status_id,
                                        desc: survey.status_desc
                                    }
                                };
                            }
                            cb(null, rr);
                        }),
                        getRoundEvent = getRoundHelper("get_round_event_info", function (events, cb) {
                            var rr,
                                event;
                            if (events.length !== 0) {
                                event = events[0];
                                rr = {
                                    roundId: result.round_id,
                                    eventId: event.event_id,
                                    eventName: event.event_name,
                                    registrationUrl: event.registration_url
                                };
                            }
                            cb(null, rr);
                        }),
                        getRoundLanguages = getRoundHelper("get_round_languages", function (languages, cb) {
                            var rr = _.map(languages, function (language) {
                                return {
                                    id: language.language_id,
                                    description: language.language_name
                                };
                            });
                            cb(null, {roundId: result.round_id, languages: rr});
                        });

                    if (result.round_type_id === LONG_ROUND_TYPE_ID) {
                        r.segments = {
                            roundId: result.round_id,
                            registrationLength: 0,
                            codingLength: 450,
                            intermissionLength: 0,
                            challengeLength: 0
                        };
                    }

                    async.waterfall([
                        function (cby) {
                            async.series({
                                segments: getRoundSegments,
                                event: getRoundEvent,
                                survey: getRoundSurvey,
                                languages: getRoundLanguages
                            }, cby);
                        },
                        function (parallelresult, cby) {
                            if (parallelresult.segments) {
                                r.segments = parallelresult.segments;
                            }
                            if (parallelresult.event) {
                                r.event = parallelresult.event;
                            }
                            if (parallelresult.survey) {
                                r.survey = parallelresult.survey;
                            }
                            if (parallelresult.languages) {
                                r.languages = parallelresult.languages;
                            }
                            if (!_.isUndefined(result.algorithm) && result.algorithm !== 0) {
                                r.roomAssignment = {
                                    roundId: result.round_id,
                                    codersPerRoom: result.coders_per_room,
                                    type: result.algorithm,
                                    isByDivision: result.by_division,
                                    isFinal: result.final,
                                    isByRegion: result.by_region,
                                    p: result.p
                                };
                            } else {
                                r.roomAssignment = {
                                    "roundId": result.round_id
                                };
                            }
                            if (!_.isUndefined(result.region_name)) {
                                r.region = {
                                    region_id: result.region_id,
                                    region_name: result.region_name
                                };
                            }
                            cby(null, r);
                        }
                    ], cbx);
                }, cb);
            }],
            function (err, results) {
                if (err) {
                    helper.handleError(api, connection, err);
                } else {
                    connection.response = {
                        total: results.length,
                        data: results
                    };
                }
                next(connection, true);
            });
    }
};


/**
 * Helper function to check if `obj` contains all neccessary fields for a contest round
 * @param {Object} helper the api.helper util.
 * @param {Object} obj obj to check
 * @return {Error} null or error if there is.
 */
function checkContestRound(helper, obj) {
    var error = helper.checkIdParameter(obj.contest_id, 'contest_id') ||
        helper.checkIdParameter(obj.id, 'id') ||
        helper.checkObject(obj.type, 'type') ||
        helper.checkIdParameter(obj.type.id, 'type.id') ||
        helper.checkNonNegativeInteger(obj.invitationalType, 'invitationalType') ||
        helper.checkObject(obj.region, 'region') ||
        helper.checkIdParameter(obj.region.region_id, 'region.region_id') ||
        helper.checkNonNegativeInteger(obj.registrationLimit, 'registrationLimit') ||
        helper.checkObject(obj.roomAssignment, 'roomAssignment') ||
        helper.checkNonNegativeInteger(obj.roomAssignment.codersPerRoom, 'roomAssignment.codersPerRoom') ||
        helper.checkIdParameter(obj.roomAssignment.type, 'roomAssignment.type') ||
        helper.checkBoolean(obj.roomAssignment.isByDivision, 'roomAssignment.isByDivision') ||
        helper.checkBoolean(obj.roomAssignment.isByRegion, 'roomAssignment.isByRegion') ||
        helper.checkBoolean(obj.roomAssignment.isFinal, 'roomAssignment.isFinal') ||
        helper.checkNumber(obj.roomAssignment.p, 'roomAssignment.p') ||
        helper.checkString(obj.name, 'name') ||
        helper.checkString(obj.status, 'status') ||
        helper.checkString(obj.short_name, 'short_name');
    if (!error) {
        obj.roomAssignment.isByDivision = obj.roomAssignment.isByDivision ? 1 : 0;
        obj.roomAssignment.isByRegion = obj.roomAssignment.isByRegion ? 1 : 0;
        obj.roomAssignment.isFinal = obj.roomAssignment.isFinal ? 1 : 0;
    }
    return error;
}

/**
* The API creates a Round.
* It's an reimplement of com.topcoder.server.ejb.AdminServices.AdminServicesBean.addRound
* So it tries to keep with the same logic as it. You should post to it a json whose fields
* are directly (name by name) maps to com.topcoder.server.contest.RoundData
* and all nessecery fields should be valid.
*/

exports.createSRMContestRound = {
    name: "createSRMContestRound",
    description: "createSRMContestRound",
    inputs: {
        required: ['contest_id', 'type', 'invitationalType', 'region',
                   'registrationLimit', 'roomAssignment', 'name', 'status', 'short_name'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        api.log("Execute createSRMContestRound#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            params = connection.params || {},
            helper = api.helper;

        if (!connection.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.series([
            function (cb) {
                /*
                 * Set this dummy round id for first parameter check
                 * It will be generated from round_seq.
                 */
                params.id = MAX_INT;
                var error =
                        checkContestRound(helper, params) ||
                        helper.checkAdmin(connection, "You need to be authorized first.", "You are forbidden for this API.");
                cb(error);
            },
            function (cb) {
                async.waterfall([
                    function (cbx) {
                        api.idGenerator.getNextIDFromDb("ROUND_SEQ", "informixoltp", dbConnectionMap, cbx);
                    },
                    function (roundId, cbx) {
                        params.id = roundId;
                        api.dataAccess.executeQuery('insert_srm_contest_round',
                            {
                                contest_id: params.contest_id,
                                round_id: params.id,
                                round_type_id: params.type.id,
                                registration_limit: params.registrationLimit,
                                invitational: params.invitationalType,
                                region_id: params.region.region_id,
                                name: params.name,
                                status: params.status,
                                short_name: params.short_name
                            },
                            dbConnectionMap, cbx);
                    }
                ], cb);
            },
            function (cb) {
                api.dataAccess.executeQuery('insert_round_room_assignment',
                    { round_id: params.id},
                    dbConnectionMap,
                    cb);
            },
            function (cb) {
                api.dataAccess.executeQuery('update_room_assignment', {
                    round_id: params.id,
                    coders_per_room: params.roomAssignment.codersPerRoom,
                    algorithm: params.roomAssignment.type,
                    by_division: params.roomAssignment.isByDivision,
                    by_region: params.roomAssignment.isByRegion,
                    final: params.roomAssignment.isFinal,
                    p: params.roomAssignment.p
                }, dbConnectionMap, cb);
            },
            function (cb) {
                var practiceRoomList = [
                    PRACTICE_ROUND_TYPE_ID,
                    TEAM_PRACTICE_ROUND_TYPE_ID,
                    LONG_PROBLEM_PRACTICE_ROUND_TYPE_ID,
                    AMD_LONG_PROBLEM_PRACTICE_ROUND_TYPE_ID
                ],
                    isTeamRound = function (roundTypeId) {
                        return _.contains([
                            TEAM_PRACTICE_ROUND_TYPE_ID,
                            TEAM_TOURNAMENT_ROUND_TYPE_ID,
                            TEAM_SINGLE_ROUND_MATCH_TYPE_ID
                        ], roundTypeId);
                    },
                    isLongRound = function (roundTypeId) {
                        return _.contains([
                            LONG_ROUND_TYPE_ID,
                            MARATHON_MATCH_TYPE_ID,
                            MARATHON_MATCH_PRACTICE_TYPE_ID,
                            INTEL_MARATHON_MATCH_TYPE_ID,
                            INTEL_MARATHON_MATCH_PRACTICE_TYPE_ID,
                            MARATHON_MATCH_TOURNAMENT_ROUND_TYPE_ID,
                            AMD_MARATHON_MATCH_TYPE_ID,
                            AMD_MARATHOND_MATCH_Practice_TYPE_ID
                        ], roundTypeId);
                    },
                    createRoom = function (division_id, name, room_type, cb) {
                        async.waterfall([
                            function (cbx) {
                                api.idGenerator.getNextIDFromDb("ROOM_SEQ",
                                    "informixoltp",
                                    dbConnectionMap,
                                    cbx);
                            },
                            function (roomid, cbx) {
                                api.dataAccess.executeQuery('insert_room',
                                    {
                                        room_id: roomid,
                                        round_id: params.id,
                                        division_id: division_id,
                                        name: name,
                                        room_type_id: room_type
                                    }, dbConnectionMap, cbx);
                            }
                        ], cb);
                    },
                    createModeratedCharRoom = function (cb) {
                        createRoom(-1, 'Moderated Chat Room', MODERATED_CHAT_ROOM_TYPE_ID, cb);
                    },
                    createPracticeRoom = function (cb) {
                        api.dataAccess.executeQuery('insert_room',
                            {
                                room_id: params.id,
                                round_id: params.id,
                                division_id: 1,
                                name: params.name,
                                room_type_id: isTeamRound(params.type.id) ?
                                        TEAM_PRACTICE_ROOM_TYPE_ID : PRACTICE_ROOM_TYPE_ID
                            }, dbConnectionMap, cb);
                    },
                    createAdminRoom = function (cb) {
                        createRoom(-1, 'Admin Room', ADMIN_ROOM_TYPE_ID, cb);
                    },
                    createDiv1Room = function (cb) {
                        api.dataAccess.executeQuery('insert_room',
                            {
                                room_id: params.id,
                                round_id: params.id,
                                division_id: 1,
                                name: "Room 1",
                                room_type_id: isTeamRound(params.type.id) ?
                                        TEAM_CONTEST_ROOM_TYPE_ID : CONTEST_ROOM_TYPE_ID
                            }, dbConnectionMap, cb);
                    };
                if (params.type.id === MODERATED_CHAT_ROUND_TYPE_ID) {
                    createModeratedCharRoom(cb);
                } else if (_.contains(practiceRoomList, params.type.id)) {
                    createPracticeRoom(cb);
                } else {
                    async.series([
                        createAdminRoom,
                        function (cbx) {
                            if (isLongRound(params.type.id)) {
                                createDiv1Room(cbx);
                            } else {
                                cbx(null);
                            }
                        }
                    ], cb);
                }
            }
        ],
            function (err) {
                if (err) {
                    helper.handleError(api, connection, err);
                } else {
                    connection.response = {
                        roundId: params.id
                    };
                }
                next(connection, true);
            });
    }
};


/**
* The API modifies a Round.
* It's an reimplement of com.topcoder.server.ejb.AdminServices.AdminServicesBean.modifyRound
* So it tries to keep with the same logic as it. You should post to it a json whose fields
* are directly (name by name) maps to com.topcoder.server.contest.RoundData
* and all nessecery fields for modification should be valid.
*/

exports.modifySRMContestRound = {
    name: "modifySRMContestRound",
    description: "modifySRMContestRound",
    inputs: {
        required: ['contest_id', 'id', 'type', 'invitationalType', 'region', 'oldRoundId',
                   'registrationLimit', 'roomAssignment', 'name', 'status', 'short_name'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        api.log("Execute modifySRMContestRound#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            params = connection.params || {},
            helper = api.helper,
            oldRoundId = Number(params.oldRoundId),
            newRoundId = params.id;

        if (!connection.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.series([
            function (cb) {
                console.log("oldRoundId = " + oldRoundId);
                var error =
                    helper.checkIdParameter(oldRoundId, 'oldRoundId') ||
                    checkContestRound(helper, params) ||
                    helper.checkAdmin(connection, "You need to be authorized first.", "You are forbidden for this API.");
                cb(error);
            },
            // check if modifying round existed.
            function (cb) {
                async.waterfall([
                    api.dataAccess.executeQuery.bind(undefined, 'get_round_onlyid', {
                        round_id: oldRoundId
                    }, dbConnectionMap),
                    function (result, cbx) {
                        if (result.length === 0) {
                            cbx(new NotFoundError('modifying round is not existed.'));
                        } else {
                            cbx(null);
                        }
                    }], cb);
            },
            function (cb) {
                function insertRoundOnlyId(cb) {
                    api.dataAccess.executeQuery('insert_round_onlyid', {
                        round_id: params.id,
                        name: params.name
                    }, dbConnectionMap, cb);
                }
                function updateRoundId(oldRoundId, newRoundId, cb) {
                    api.dataAccess.executeQuery('update_round_id', {
                        oldRoundId: oldRoundId,
                        newRoundId: newRoundId
                    }, dbConnectionMap, cb);
                }
                // Insert a round room assignment row for new round
                // if the old round does not have one.
                function insertRoundRoomAssignmentIfNeeded(oldRoundId, newRoundId, cb) {
                    async.waterfall([
                        function (cbx) {
                            api.dataAccess.executeQuery('get_round_room_assignment', {
                                round_id: oldRoundId
                            }, dbConnectionMap, cbx);
                        },
                        function (result, cbx) {
                            if (result.length === 0) {
                                api.dataAccess.executeQuery('insert_round_room_assignment',
                                        { round_id: newRoundId},
                                        dbConnectionMap,
                                        cb);
                            } else {
                                cbx(null);
                            }
                        }
                    ], cb);
                }
                if (oldRoundId !== newRoundId) {
                    async.series([
                        insertRoundOnlyId,
                        // check if a new round room needs to be inserted.
                        insertRoundRoomAssignmentIfNeeded.bind(undefined, oldRoundId, newRoundId),
                        updateRoundId.bind(undefined, oldRoundId, newRoundId),
                        function (cb) {
                            api.dataAccess.executeQuery('delete_contest_round', {
                                round_id: oldRoundId
                            }, dbConnectionMap, cb);
                        }
                    ], cb);
                } else {
                    cb(null);
                }
            },
            function (cb) {
                api.dataAccess.executeQuery('update_contest_round', {
                    contest_id: params.contest_id,
                    round_id: params.id,
                    round_type_id: params.type.id,
                    registration_limit: params.registrationLimit,
                    invitational: params.invitationalType,
                    region_id: params.region.region_id,
                    name: params.name,
                    status: params.status,
                    short_name: params.short_name
                }, dbConnectionMap, cb);
            },
            function (cb) {
                api.dataAccess.executeQuery('update_room_assignment', {
                    round_id: params.id,
                    coders_per_room: params.roomAssignment.codersPerRoom,
                    algorithm: params.roomAssignment.type,
                    by_division: params.roomAssignment.isByDivision,
                    by_region: params.roomAssignment.isByRegion,
                    final: params.roomAssignment.isFinal,
                    p: params.roomAssignment.p
                }, dbConnectionMap, cb);
            }
        ],
            function (err) {
                if (err) {
                    helper.handleError(api, connection, err);
                } else {
                    connection.response = {
                        message: "ok"
                    };
                }
                next(connection, true);
            });
    }
};


/**
* The API delete a Round by roundId and it also erases some related data.
* It's an reimplement of com.topcoder.server.ejb.AdminServices.AdminServicesBean.deleteRound
* So it tries to keep with the same logic as it.
*/

exports.deleteSRMContestRound = {
    name: "deleteSRMContestRound",
    description: "deleteSRMContestRound",
    inputs: {
        required: ['roundId'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        api.log("Execute deleteSRMContestRound#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            params = connection.params || {},
            helper = api.helper;
        params.roundId = Number(params.roundId);
        if (!connection.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }

        async.series([
            function (cb) {
                var error =
                        helper.checkIdParameter(params.roundId, 'roundId') ||
                        helper.checkAdmin(connection, "You need to be authorized first.", "You are forbidden for this API.");
                cb(error);
            },
            // check if deleting round existed.
            function (cb) {
                async.waterfall([
                    api.dataAccess.executeQuery.bind(undefined, 'get_round_onlyid', {
                        round_id: params.roundId
                    }, dbConnectionMap),
                    function (result, cbx) {
                        if (result.length === 0) {
                            cbx(new NotFoundError('deleting round is not existed'));
                        } else {
                            cbx(null);
                        }
                    }], cb);
            },
            function (cb) {
                api.dataAccess.executeQuery('delete_contest_round',
                    {
                        round_id: params.roundId
                    }, dbConnectionMap, cb);
            }
        ],
            function (err) {
                if (err) {
                    helper.handleError(api, connection, err);
                } else {
                    connection.response = {
                        message: "ok"
                    };
                }
                next(connection, true);
            });
    }
};
