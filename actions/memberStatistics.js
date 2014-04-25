/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.16
 * @author Sky_, Ghost_141, muzehyun, hesibo, isv, LazyChild, jamestc
 * changes in 1.1:
 * - implement marathon statistics
 * changes in 1.2:
 * - implement studio and software statistics
 * changes in 1.3:
 * - implement srm (Algorithm) statistics
 * changes in 1.4:
 * - Update the checkUserExists function since the query has been standardized.
 * changes in 1.5:
 * - implement get user basic profile.
 * changes in 1.6:
 * - Update srm (Algorithm) statistics and marathon statistics api to add 'history' and 'distribution' field.
 * changes in 1.7:
 * - implement software rating history and distribution
 * changes in 1.8:
 * - Update studio statistics api to retrieve data from tcs_catalog database.
 * changes in 1.9
 * - update user basic profile to support private info
 * - remove badge related parts
 * changes in 1.10:
 * - update get software member statistics api to improve performance.
 * - update checkUserExists and checkUserActivated so they can be executed in parallel.
 * changes in 1.11:
 * - add API for recent winning design submissions
 * changes in 1.12
 * - moved checkUserExists function to /initializers/helper.js and replaced all calls to checkUserExists with
 * -  call to api.helper.checkUserExists
 * - removed unused import for IllegalArgumentError
 * changes in 1.13
 * - add getCopilotStatistics API.
 * changes in 1.14
 * - added my profile api
 * - modified public profile api(basic user profile api), only return public information
 * changes in 1.15
 * - enabled granular data access in getBasicUserProfile via optional query param
 * Changes in 1.16:
 * - Implement the upload member photo API.
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var S = require('string');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var BadRequestError = require('../errors/BadRequestError');
var NotFoundError = require('../errors/NotFoundError');
var UnauthorizedError = require('../errors/UnauthorizedError');

/**
 * check whether given user is activated.
 * @param {String} handle - the handle to check.
 * @param {Object} api - the action hero api object
 * @param {Object} dbConnectionMap - the database connection map
 * @param {Function<err>} callback - the callback function
 */
function checkUserActivated(handle, api, dbConnectionMap, callback) {
    api.dataAccess.executeQuery('check_coder_activated', { handle: handle }, dbConnectionMap, function (err, result) {
        if (err) {
            callback(err, null);
            return;
        }
        if (result && result[0] && result[0].status === 'A') {
            callback(err, null);
        } else {
            callback(err, new BadRequestError('User is not activated.'));
        }
    });
}

/**
 * Check if the user exist and activated.
 * @param {String} handle - the user handle.
 * @param {Object} api - the api object.
 * @param {Object} dbConnectionMap - the database connection map object.
 * @param {Function} callback - the callback function.
 * @since 1.10
 */
function checkUserExistAndActivate(handle, api, dbConnectionMap, callback) {
    async.waterfall([
        function (cb) {
            // check user existence and activated status.
            async.parallel({
                exist: function (cb) {
                    api.helper.checkUserExists(handle, api, dbConnectionMap, cb);
                },
                activate: function (cb) {
                    checkUserActivated(handle, api, dbConnectionMap, cb);
                }
            }, cb);
        },
        function (results, cb) {
            // handle the error situation.
            if (results.exist) {
                cb(results.exist);
                return;
            }
            if (results.activate) {
                cb(results.activate);
                return;
            }
            cb();
        }
    ], callback);
}

/**
 * Get the user basic profile information.
 * @param {Object} api - the api object.
 * @param {String} handle - the handle parameter
 * @param {Boolean} privateInfoEligibility - flag indicate whether private information is included in result
 * @param {Object} dbConnectionMap - the database connection map.
 * @param {Object} connection - the connection.
 * @param {Function} next - the callback function.
 */
function getBasicUserProfile(api, handle, privateInfoEligibility, dbConnectionMap, connection, next) {
    var helper = api.helper,
        sqlParams = {
            handle: handle
        },
        result,
        loadData,
        requestedData,
        parts;

    // check for an optional data query string param than enables loading a subset of data
    requestedData = connection.rawConnection.parsedURL.query.data;
    if (_.isDefined(requestedData)) {
        // NOTE: an empty value is acceptable and indicates only basic data is returned
        loadData = {};
        if (requestedData) {
            // data is comma delimited string of requested data
            parts = requestedData.split(',');
            _.each(parts, function (part) {
                loadData[part] = true;
            });
        }
        api.log("Requested data param found: " + requestedData, "debug");
    } else {
        loadData = {earnings: true, ratings: true, achievements: true, address: true, email: true}; // load all data by default
    }

    async.waterfall([
        function (cb) {
            if (privateInfoEligibility) {
                checkUserActivated(handle, api, dbConnectionMap, function (err, result) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(result);
                    }
                });
            } else {
                checkUserExistAndActivate(handle, api, dbConnectionMap, cb);
            }
        }, function (cb) {
            var execQuery = function (name) {
                return function (cbx) {
                    api.dataAccess.executeQuery('get_user_basic_profile_' + name, sqlParams, dbConnectionMap, cbx);
                };
            };
            async.parallel({
                basic: execQuery('basic'),
                earning: loadData.earnings ? execQuery('overall_earning') : function (cbx) { cbx(); },
                ratingSummary: loadData.ratings ? execQuery('rating_summary') : function (cbx) { cbx(); },
                achievements: loadData.achievements ? execQuery('achievements') : function (cbx) { cbx(); },
                privateInfo: loadData.address && privateInfoEligibility ? execQuery('private') : function (cbx) { cbx(); },
                emails: loadData.email && privateInfoEligibility ? execQuery('private_email') : function (cbx) { cbx(); }
            }, cb);
        }, function (results, cb) {
            var basic = results.basic[0],
                ratingSummary,
                achievements,
                emails,
                appendIfNotEmpty,
                privateInfo,
                address;

            result = {
                handle: basic.handle,
                country: basic.country,
                memberSince: basic.member_since,
                quote: basic.quote,
                photoLink: basic.photo_link || ''
            };

            if (loadData.earnings && _.isDefined(basic.show_earnings) && basic.show_earnings !== 'hide') {
                result.overallEarning = results.earning[0].overall_earning;
            }

            if (loadData.ratings) {
                ratingSummary = [];
                results.ratingSummary.forEach(function (item) {
                    ratingSummary.push({
                        name: helper.getPhaseName(item.phase_id),
                        rating: item.rating,
                        colorStyle: helper.getColorStyle(item.rating)
                    });
                });
                result.ratingSummary = ratingSummary;
            }

            if (loadData.achievements) {
                achievements = [];
                results.achievements.forEach(function (item) {
                    achievements.push({
                        date: item.achievement_date,
                        description: item.description
                    });
                });
                // TODO: why is this capitalized?
                result.Achievements = achievements;
            }

            if (privateInfoEligibility && loadData.email) {
                emails = [];
                results.emails.forEach(function (item) {
                    emails.push({
                        email: item.email,
                        type: item.type,
                        status: item.status
                    });
                });
                result.emails = emails;
            }

            if (privateInfoEligibility && loadData.address && results.privateInfo && results.privateInfo[0]) {
                appendIfNotEmpty = function (str) {
                    var ret = '';
                    if (str && str.length > 0) {
                        ret += ', ' + str;
                    }
                    return ret;
                };

                privateInfo = results.privateInfo[0];

                result.name = privateInfo.first_name + ' ' + privateInfo.last_name;
                result.age = privateInfo.age;
                result.gender = privateInfo.gender;
                result.shirtSize = privateInfo.shirt_size;

                address = privateInfo.address1;
                // if address1 is undefined, there is no address.
                if (address) {
                    address += appendIfNotEmpty(privateInfo.address2);
                    address += appendIfNotEmpty(privateInfo.address3);
                    address += ', ' + privateInfo.city;
                    address += appendIfNotEmpty(privateInfo.state);
                    address += ', ' + privateInfo.zip + ', ' + privateInfo.country;
                    result.address = address;
                }
            }

            if (result.isPM) {
                delete result.ratingSummary;
            }

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
}

/**
 * map the history info from database to json object.
 * @param {Object} rows the database results.
 * @returns {Array} the array that contains the history info.
 */
function mapHistory(rows) {
    var ret = [];
    rows.forEach(function (item) {
        ret.push({
            challengeId: item.challenge_id,
            challengeName: item.challenge_name,
            date: item.date,
            rating: item.rating,
            placement: item.placement,
            percentile: item.percentile === 'N/A' ? 'N/A' : Number(item.percentile).toFixed(2) + '%'
        });
    });
    return ret;
}

/**
 * Handle upload member photo here.
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @param {Function} next - the callback function.
 * @since 1.16
 */
function uploadMemberPhoto(api, connection, next) {
    var helper = api.helper,
        caller = connection.caller,
        photo = connection.params.photo,
        storePath = api.config.general.memberPhoto.storeDir,
        sqlParams = {},
        dbConnectionMap = connection.dbConnectionMap,
        fileToDelete,
        fileName;

    async.waterfall([
        function (cb) {
            if (photo.constructor.name !== 'File') {
                cb(new BadRequestError('The photo has to be a file.'));
                return;
            }
            // Check the upload file type.
            if (helper.checkContains(api.config.general.memberPhoto.validTypes, photo.type.substring(photo.type.lastIndexOf('/') + 1), 'photoType')) {
                cb(new BadRequestError('The photo has to be in following format: ' + api.config.general.memberPhoto.validTypes + '.'));
                return;
            }
            cb(helper.checkMember(connection, 'Authorization information needed.'));
        },
        function (cb) {
            fs.stat(photo.path, function (err, stats) {
                if (stats.size > api.config.general.memberPhoto.fileSizeLimit) {
                    cb(new BadRequestError('The photo should be less than 1Mb.'));
                    return;
                }
                cb();
            });
        },
        function (cb) {
            // Get the old file location.
            sqlParams.user_id = caller.userId;
            api.dataAccess.executeQuery('get_old_member_photo', sqlParams, dbConnectionMap, cb);
        },
        function (results, cb) {
            var handle = caller.handle;
            // Use the file type from the file name which is more accurate. For example xxx.jpg will be jpg instead of jpeg.
            fileName = handle + '.' + photo.name.substring(photo.name.lastIndexOf('.') + 1).toLowerCase();
            if (results.length !== 0) {
                fileToDelete = results[0].image_path;
            }
            cb();
        },
        function (cb) {
            // The server is linux server so the path separator is always '/'.
            if (!new S(storePath).endsWith('/')) {
                // If the store path is not ends with '/' fix it.
                storePath += '/';
            }
            sqlParams.path = storePath;
            // Get path id from database.
            api.dataAccess.executeQuery('get_path', sqlParams, dbConnectionMap, cb);
        },
        function (results, cb) {
            if (results.length === 0) {
                // If we don't have this store path in server. Insert it.
                api.idGenerator.getNextIDFromDb('PATH_SEQ', 'informixoltp', dbConnectionMap, function (err, pathId) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    sqlParams.path_id = pathId;
                    api.dataAccess.executeQuery('insert_path', sqlParams, dbConnectionMap, function (err) { cb(err); });
                });
            } else {
                // If we have this path, just store it for later.
                sqlParams.path_id = results[0].path_id;
                cb();
            }
        },
        function (cb) {
            // Get image id from database.
            api.dataAccess.executeQuery('get_image', sqlParams, dbConnectionMap, cb);
        },
        function (results, cb) {
            sqlParams.file_name = fileName;
            sqlParams.image_type_id = 1;
            if (results.length === 0) {
                // We don't have coder_image_xref and image record in database. Insert them all.
                api.idGenerator.getNextIDFromDb('IMAGE_SEQ', 'informixoltp', dbConnectionMap, function (err, imageId) {
                    // Get the image id first.
                    if (err) {
                        cb(err);
                        return;
                    }
                    sqlParams.image_id = imageId;
                    sqlParams.link = sqlParams.path + sqlParams.file_name;

                    async.waterfall([
                        // Insert image and coder image xref in sequence.
                        function (cbx) {
                            api.dataAccess.executeQuery('insert_image',  sqlParams, dbConnectionMap, function (err) {
                                cbx(err);
                            });
                        },
                        function (cbx) {
                            api.dataAccess.executeQuery('insert_coder_image_xref', sqlParams, dbConnectionMap, function (err) {
                                cbx(err);
                            });
                        }
                    ], cb);
                });
            } else {
                // We have records in database, update them.
                sqlParams.image_id = results[0].image_id;
                api.dataAccess.executeQuery('update_image', sqlParams, dbConnectionMap, function (err) {
                    cb(err);
                });
            }
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
            next(connection, true);
        } else {
            async.waterfall([
                function (cb) {
                    // Delete the old file first.
                    // If we get the file path from database before then we need to delete it. If we don't get it just ignore the delete part.
                    if (_.isDefined(fileToDelete)) {
                        // Only delete the exist file.
                        fs.exists(fileToDelete, function (exist) {
                            if (exist) {
                                // If the delete fail, an error will be passed. So we can rollback.
                                fs.unlink(fileToDelete, cb);
                            } else {
                                cb();
                            }
                        });
                    } else {
                        // If nothing to delete then move to next step.
                        cb();
                    }
                },
                function (cb) {
                    // Write the new file.
                    fs.readFile(photo.path, function (err, data) {
                        if (err) {
                            cb(err);
                        } else {
                            fs.writeFile(path.join(storePath, fileName), data, cb);
                        }
                    });
                }
            ], function (err) {
                if (err) {
                    // Handle the error if delete old file and write new file has error.
                    helper.handleError(api, connection, err);
                } else {
                    // All success.
                    connection.response = { message: "Success" };
                }
                next(connection, true);
            });
        }
    });
}

/**
 * map the distribution info from database to json object.
 * @param {Object} rows the database results.
 */
function mapDistribution(rows) {
    var ret = [], maxRating, step, i, start, num, pairs;
    maxRating = _.max(rows, function (item) {
        return item.rating;
    }).rating;
    pairs = _.object(_.map(rows, function (item) {
        return item.rating;
    }), _.map(rows, function (item) {
        return item.number;
    }));

    step = parseInt(maxRating / 100, 10) + 1;
    for (i = 0; i < step; i = i + 1) {
        start = i * 100;
        num = pairs[start];
        ret.push({
            range: start + '-' + (start + 99),
            number: _.isDefined(num) ? num : 0
        });
    }
    return ret;
}

/**
 * The API for getting marathon statistics
 */
exports.getMarathonStatistics = {
    name: "getMarathonStatistics",
    description: "getMarathonStatistics",
    inputs: {
        required: ["handle"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["topcoder_dw"],
    run: function (api, connection, next) {
        api.log("Execute getAlgorithmStatistics#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            handle = connection.params.handle,
            helper = api.helper,
            sqlParams = {
                handle: handle,
                algoRatingType: 3
            },
            result;
        if (!connection.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                checkUserExistAndActivate(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                var executeQuery = function (sqlName, cbx) {
                    api.dataAccess.executeQuery(sqlName, sqlParams, dbConnectionMap, cbx);
                };

                async.parallel({
                    details: function (cbx) {
                        executeQuery('get_member_marathon_statistics', cbx);
                    },
                    history: function (cbx) {
                        executeQuery('get_member_marathon_statistics_history', cbx);
                    },
                    distribution: function (cbx) {
                        executeQuery('get_srm_or_marathon_statistics_distribution', cbx);
                    }
                }, cb);
            }, function (results, cb) {
                var details = results.details[0], history = results.history, distribution = results.distribution;
                if (results.details.length === 0) {
                    cb(new NotFoundError('statistics not found'));
                    return;
                }
                result = {
                    "handle": details.handle,
                    "rating": details.rating,
                    "percentile": details.percentile === 'N/A' ? 'N/A' : Number(details.percentile).toFixed(2) + '%',
                    "rank": details.rank || 'not ranked',
                    "countryRank": details.country_rank || 'not ranked',
                    "schoolRank": details.school_rank || 'not ranked',
                    "volatility": details.vol,
                    "maximumRating": details.maximum_rating,
                    "minimumRating": details.minimum_rating,
                    "defaultLanguage": details.default_language,
                    "competitions": details.competitions,
                    "mostRecentEventName": details.most_recent_event_name,
                    "mostRecentEventDate": _.isDefined(details.most_recent_event_date) ? details.most_recent_event_date.toString('MM.dd.yy') : '',
                    "bestRank": details.best_rank,
                    "wins": details.wins,
                    "topFiveFinishes": details.top_five_finishes,
                    "topTenFinishes": details.top_ten_finishes,
                    "avgRank": details.avg_rank,
                    "avgNumSubmissions": details.avg_num_submissions,

                    "History": mapHistory(history),
                    "Distribution": mapDistribution(distribution)
                };
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
    }
};


/**
 * The API for getting software statistics
 */
exports.getSoftwareStatistics = {
    name: "getSoftwareStatistics",
    description: "getSoftwareStatistics",
    inputs: {
        required: ["handle"],
        optional: ['track']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["topcoder_dw", "tcs_catalog"],
    run: function (api, connection, next) {
        api.log("Execute getSoftwareStatistics#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            handle = connection.params.handle,
            track = connection.params.track,
            helper = api.helper,
            sqlParams = {
                handle: handle
            },
            result = {
                handle: handle,
                Tracks: {}
            };
        if (!connection.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                // check track
                if (_.isDefined(track)) {
                    cb(helper.checkTrackName(track.toLowerCase(), false));
                } else {
                    cb();
                }
            }, function (cb) {
                checkUserExistAndActivate(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                var execQuery = function (name, cbx) {
                        api.dataAccess.executeQuery(name,
                            sqlParams,
                            dbConnectionMap,
                            cbx);
                    },
                    phaseIds = _.isDefined(track) ? [helper.getPhaseId(track)] :
                            _(helper.softwareChallengeTypes).values().map(function (item) { return item.phaseId; }),
                    challengeTypes = _.map(phaseIds, function (item) {
                        return item - 111;
                    });

                sqlParams.phaseIds = phaseIds;
                sqlParams.challengeTypes = challengeTypes;

                async.parallel({
                    basics: function (cbx) {
                        execQuery("get_software_member_statistics_track_basic", cbx);
                    },
                    submissions: function (cbx) {
                        execQuery('get_software_member_statistics_track_submissions', cbx);
                    },
                    rating: function (cbx) {
                        execQuery('get_software_member_statistics_track_rating', cbx);
                    }
                }, cb);
            }, function (results, cb) {
                var round2 = function (n) {
                    return Math.round(n * 100) / 100;
                };
                results.basics.forEach(function (track) {
                    var type = helper.getPhaseName(track.category_id);
                    result.Tracks[type] = {
                        rating: track.rating,
                        reliability: track.reliability ? track.reliability.toFixed(2) + '%' : 'n/a',
                        activePercentile: track.active_percentile.toFixed(2) + "%",
                        activeRank: track.active_rank,
                        activeCountryRank: track.active_country_rank,
                        activeSchoolRank: track.active_school_rank,
                        overallPercentile: track.overall_percentile.toFixed(2) + "%",
                        overallRank: track.overall_rank,
                        overallCountryRank: track.overall_country_rank,
                        overallSchoolRank: track.overall_school_rank,
                        volatility: track.vol
                    };
                });
                results.submissions.forEach(function (row) {
                    var data = result.Tracks[row.category_name];
                    // NOTE: there are currently submissions without track data
                    if (data) {
                        _.extend(data, {
                            competitions: row.num_ratings,
                            submissions: row.submissions,
                            submissionRate: _.getPercent(row.submission_rate, 2),
                            inquiries: row.num_ratings,
                            passedScreening: row.passed_screening,
                            screeningSuccessRate: _.getPercent(row.screening_success_rate, 2),
                            passedReview: row.passed_review,
                            reviewSuccessRate: _.getPercent(row.review_success_rate, 2),
                            appeals: row.appeals,
                            appealSuccessRate: _.getPercent(row.appeal_success_rate, 2),
                            maximumScore: round2(row.max_score),
                            minimumScore: round2(row.min_score),
                            averageScore: round2(row.avg_score),
                            averagePlacement: round2(row.avg_placement),
                            wins: row.wins,
                            winPercentage: _.getPercent(row.win_percent, 2)
                        });
                    } else {
                        api.log("unable to update submission data. no track data for handle " + handle + " in category " + row.category_name, "warning");
                    }
                });

                results.rating.forEach(function (row) {
                    var data = result.Tracks[row.category_name];
                    // there may not be a track
                    if (data) {
                        _.extend(data, {
                            maximumRating: row.max_rating,
                            minimumRating: row.min_rating
                        });
                    } else {
                        api.log("unable to update rating data. no track data for handle " + handle + " in category " + row.category_name, "warning");
                    }
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
    }
};


/**
 * The API for getting studio statistics
 */
exports.getStudioStatistics = {
    name: "getStudioStatistics",
    description: "getStudioStatistics",
    inputs: {
        required: ["handle"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["topcoder_dw", "tcs_catalog"],
    run: function (api, connection, next) {
        api.log("Execute getStudioStatistics#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            handle = connection.params.handle,
            helper = api.helper,
            sqlParams = {
                handle: handle
            },
            result = {
                handle: handle,
                Tracks: {}
            };
        if (!connection.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }

        async.waterfall([
            function (cb) {
                checkUserExistAndActivate(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                api.dataAccess.executeQuery('get_studio_member_statistics_track', sqlParams, dbConnectionMap, cb);
            }, function (results, cb) {
                results.forEach(function (row) {
                    var track = {};
                    if (row.submissions !== 0 || row.completed_contests !== 0) {
                        if (row.submissions > 0) {
                            _.extend(track, {
                                numberOfSubmissions: row.submissions,
                                numberOfPassedScreeningSubmissions: row.passed_screening,
                                numberOfWinningSubmissions: row.wins
                            });
                        }
                        if (row.completed_contests > 0) {
                            _.extend(track, {
                                copilotCompletedContests: row.completed_contests,
                                copilotFailedContests: row.failed_contests
                            });
                        }
                        result.Tracks[row.challenge_type] = track;
                    }
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
    }
};


/**
 * The API for getting algorithm statistics
 */
exports.getAlgorithmStatistics = {
    name: "getAlgorithmStatistics",
    description: "getAlgorithmStatistics",
    inputs: {
        required: ["handle"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["topcoder_dw"],
    run: function (api, connection, next) {
        api.log("Execute getAlgorithmStatistics#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            handle = connection.params.handle,
            helper = api.helper,
            sqlParams = {
                handle: handle,
                algoRatingType: 1
            },
            result;
        if (!connection.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                checkUserExistAndActivate(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                var execQuery = function (name) {
                    return function (cbx) {
                        api.dataAccess.executeQuery('get_srm_statistics_' + name,
                            sqlParams,
                            dbConnectionMap,
                            cbx);
                    };
                };
                async.parallel({
                    basic: execQuery("basic"),
                    challenges: execQuery("challenges"),
                    div1: execQuery("division_1"),
                    div2: execQuery("division_2"),
                    history: execQuery('history'),
                    distribution: function (cbx) { api.dataAccess.executeQuery('get_srm_or_marathon_statistics_distribution', sqlParams, dbConnectionMap, cbx); }
                }, cb);
            }, function (results, cb) {
                if (results.basic.length === 0) {
                    cb(new NotFoundError('statistics not found'));
                    return;
                }
                var details = results.basic[0],
                    getSuccess = function (failed, total) {
                        if (total === 0) {
                            return "0.00%";
                        }
                        return (100 - failed / total * 100).toFixed(2) + "%";
                    },
                    mapLevel = function (ele) {
                        return {
                            "submitted": ele.submitted,
                            "failedChallenge": ele.failed_challenge,
                            "failedSys.Test": ele.failed_sys_test,
                            "success%": getSuccess(ele.failed_challenge + ele.failed_sys_test, ele.submitted)
                        };
                    },
                    mapChallenge = function (ele) {
                        return {
                            "failedChallenge": ele.failed_challenge,
                            "challenges": ele.challenges,
                            "success%": getSuccess(ele.failed_challenge, ele.challenges)
                        };
                    },
                    createTotal = function (total, level) {
                        total.submitted = total.submitted + level.submitted;
                        total.failedChallenge = total.failedChallenge + level.failed_challenge;
                        total["failedSys.Test"] = total["failedSys.Test"] + level.failed_sys_test;
                        total["success%"] = getSuccess(total.failedChallenge +
                            total["failedSys.Test"], total.submitted);
                        return total;
                    },
                    createTotalChallenge = function (total, level) {
                        total.failedChallenge = total.failedChallenge + level.failed_challenge;
                        total.challenges = total.challenges + level.challenges;
                        total["success%"] = getSuccess(total.failedChallenge, total.challenges);
                        return total;
                    };
                result = {
                    handle: details.handle,
                    rating: details.rating,
                    percentile: details.percentile + (details.percentile === "N/A" ? "" : "%"),
                    rank: details.rank || "not ranked",
                    countryRank: details.country_rank || "not ranked",
                    schoolRank: details.school_rank || "not ranked",
                    volatility: details.volatility,
                    maximumRating: details.maximum_rating,
                    minimumRating: details.minimum_rating,
                    defaultLanguage: details.default_language,
                    competitions: details.competitions,
                    mostRecentEventName: details.most_recent_event_name,
                    mostRecentEventDate: details.most_recent_event_date ? details.most_recent_event_date.toString("MM.dd.yy") : '',
                    Divisions: {
                        "Division I": {},
                        "Division II": {}
                    },
                    Challenges: {
                        Levels: {}
                    },
                    History: mapHistory(results.history),
                    Distribution: mapDistribution(results.distribution)
                };
                results.div1.forEach(function (ele) {
                    result.Divisions["Division I"][ele.level_name] = mapLevel(ele);
                });
                results.div2.forEach(function (ele) {
                    result.Divisions["Division II"][ele.level_name] = mapLevel(ele);
                });
                result.Divisions["Division I"]["Level Total"] = _.reduce(results.div1, createTotal, {
                    "submitted": 0,
                    "failedChallenge": 0,
                    "failedSys.Test": 0,
                    "success%": "0.00%"
                });
                result.Divisions["Division II"]["Level Total"] = _.reduce(results.div2, createTotal, {
                    "submitted": 0,
                    "failedChallenge": 0,
                    "failedSys.Test": 0,
                    "success%": "0.00%"
                });
                results.challenges.forEach(function (ele) {
                    result.Challenges.Levels[ele.level_name] = mapChallenge(ele);
                });
                result.Challenges.Levels.Total = _.reduce(results.challenges, createTotalChallenge, {
                    "failedChallenge": 0,
                    "challenges": 0,
                    "success%": "0.00%"
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
    }
};

exports.getBasicUserProfile = {
    name: 'getBasicUserProfile',
    description: 'getBasicUserProfile',
    inputs: {
        required: ['handle'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['informixoltp', 'topcoder_dw', 'common_oltp'],
    run: function (api, connection, next) {
        if (!connection.dbConnectionMap) {
            api.helper.handleNoConnection(api, connection, next);
        } else {
            api.log('Execute getBasicUserProfile#run', 'debug');
            getBasicUserProfile(api, connection.params.handle, false, connection.dbConnectionMap, connection, next);
        }
    }
};

/**
 * This is the function that actually get software rating history and distribution
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
var getSoftwareRatingHistoryAndDistribution = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        result = {
            history: [],
            distribution: []
        },
        challengeType = connection.params.challengeType.toLowerCase(),
        handle = connection.params.handle,
        error,
        phaseId;
    async.waterfall([
        function (cb) {
            error = error ||
                helper.checkContains(Object.keys(helper.softwareChallengeTypes), challengeType, "challengeType");
            if (error) {
                cb(error);
                return;
            }
            phaseId = helper.softwareChallengeTypes[challengeType].phaseId;
            sqlParams.handle = handle;
            sqlParams.phaseId = phaseId;
            api.helper.checkUserExists(handle, api, dbConnectionMap, cb);
        }, function (notFoundError, cb) {
            if (notFoundError) {
                cb(notFoundError);
                return;
            }
            api.dataAccess.executeQuery("get_software_rating_history", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            rows.forEach(function (row) {
                result.history.push({
                    challengeId: row.project_id,
                    challengeName: row.component_name,
                    date: row.rating_date,
                    rating: row.new_rating
                });
            });
            api.dataAccess.executeQuery("get_software_rating_distribution", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            var dist_data, dist_keys;
            dist_data = rows[0];
            dist_keys = _.keys(dist_data);
            dist_keys.sort();
            dist_keys.forEach(function (key) {
                result.distribution.push({
                    "range": key.replace('range_', '').replace('_', '-'),
                    "number": dist_data[key]
                });
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
 * The API for getting software rating history and distribution
 */
exports.getSoftwareRatingHistoryAndDistribution = {
    name: "getSoftwareRatingHistoryAndDistribution",
    description: "getSoftwareRatingHistoryAndDistribution",
    inputs: {
        required: ['handle', 'challengeType'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ['tcs_dw', 'topcoder_dw'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getSoftwareRatingHistoryAndDistribution#run", 'debug');
            getSoftwareRatingHistoryAndDistribution(api, connection, connection.dbConnectionMap, next);
        } else {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};

/**
 * Gets the recent wining design submissions
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Object} dbConnectionMap - The database connection map for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 *
 * @since 1.11
 */
var getRecentWinningDesignSubmissions = function (api, connection, dbConnectionMap, next) {
    var result = {},
        sqlParams = {},
        helper = api.helper,
        numberOfRecentWins = Number(connection.params.numberOfRecentWins || 7);

    async.waterfall([
        function (callback) {
            var error = helper.checkPositiveInteger(numberOfRecentWins, "numberOfRecentWins") ||
                helper.checkMaxNumber(numberOfRecentWins, helper.MAX_INT, "numberOfRecentWins");
            if (error) {
                callback(error);
            } else {
                sqlParams.numberOfRecentWins = numberOfRecentWins;
                sqlParams.handle = connection.params.handle;
                callback();
            }
        },
        function (callback) {
            api.helper.checkUserExists(sqlParams.handle, api, dbConnectionMap, callback);
        },
        function (err, callback) {
            if (err) {
                callback(err);
                return;
            }
            api.dataAccess.executeQuery("get_recent_winning_design_submissions", sqlParams, dbConnectionMap, callback);
        },
        function (res, callback) {
            result.size = res.length;
            result.recentWinningSubmissions = _.map(res, function (element) {
                var winningSubmission = {
                    contestName: element.contest_name,
                    rank: element.rank,
                    prize: element.prize,
                    submissionDate: element.submission_date,
                    viewable: element.viewable.toLowerCase() === "true",
                    preview: api.config.designSubmissionLink + element.submission_id + "&sbt=small"
                };
                if (!winningSubmission.viewable) {
                    delete winningSubmission.preview;
                }
                return winningSubmission;
            });
            callback();
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
 * The API for getting recent winning design submissions.
 *
 * @since 1.11
 */
exports.getRecentWinningDesignSubmissions = {
    name: "getRecentWinningDesignSubmissions",
    description: "get recent winning design submissions",
    inputs: {
        required: ["handle"],
        optional: ["numberOfRecentWins"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["tcs_catalog", "topcoder_dw"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getRecentWinningDesignSubmissions#run", 'debug');
            getRecentWinningDesignSubmissions(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};


/**
 * The API for getting copilot Statistics.
 *
 * @since 1.13
 */
exports.getCopilotStatistics = {
    name: "getCopilotStatistics",
    description: "getCopilotStatistics",
    inputs: {
        required: ["handle"],
        optional: ["track"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["tcs_catalog", "topcoder_dw"],
    run: function (api, connection, next) {
        api.log("Execute getCopilotStats#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            handle = connection.params.handle,
            track = connection.params.track,
            helper = api.helper,
            sqlParams = {
                handle: handle
            },
            result = {
                handle: handle,
                Tracks: {}
            };
        if (!connection.dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                // check track
                if (_.isDefined(track)) {
                    cb(helper.checkTrackName(track.toLowerCase(), false));
                } else {
                    cb();
                }
            }, function (cb) {
                checkUserExistAndActivate(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                var execQuery = function (name, cbx) {
                        api.dataAccess.executeQuery(name,
                            sqlParams,
                            dbConnectionMap,
                            cbx);
                    },
                    phaseIds = _.isDefined(track) ? [helper.getPhaseId(track)] :
                            _(helper.softwareChallengeTypes).values().map(function (item) { return item.phaseId; }),
                    challengeTypes = _.map(phaseIds, function (item) {
                        return item - 111;
                    });

                sqlParams.phaseIds = phaseIds;
                sqlParams.challengeTypes = challengeTypes;

                execQuery("get_software_member_statistics_copilot", cb);
            }, function (results, cb) {
                results.forEach(function (track) {
                    if (track.completed_contests === 0) {
                        return;
                    }
                    if (!result.Tracks[track.category_name]) {
                        result.Tracks[track.category_name] = {};
                    }
                    var data = result.Tracks[track.category_name], copilotFulfillment;
                    if (data) {
                        if (track.completed_contests !== 0) {
                            data.copilotCompletedContests = track.completed_contests;
                            data.copilotRepostedContests = track.reposted_contests;
                            data.copilotFailedContests = track.failed_contests;
                            copilotFulfillment = 1 - data.copilotFailedContests / data.copilotCompletedContests;
                            data.copilotFulfillment = _.getPercent(copilotFulfillment, 0);
                        }
                    } else {
                        api.log("unable to update copilot data. no track data for handle " + handle + " for track " + track, "warning");
                    }
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
    }
};

/**
 * The API for getting my profile.
 *
 * @since 1.14
 */
exports.getMyProfile = {
    name: "getMyProfile",
    description: "get my profile",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["informixoltp", "topcoder_dw", "common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getMyProfile#run", "debug");
            if (connection.caller.accessLevel === "anon") {
                api.helper.handleError(api, connection, new UnauthorizedError("Authentication credential was missing."));
                next(connection, true);
            } else {
                getBasicUserProfile(api, connection.caller.handle, true, connection.dbConnectionMap, connection, next);
            }
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for upload member photo.
 *
 * @since 1.16
 */
exports.uploadMemberPhoto = {
    name: 'uploadMemberPhoto',
    description: 'upload member photo api',
    inputs: {
        required: ['photo'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'write',
    databases: ['informixoltp'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute uploadMemberPhoto#run", "debug");
            uploadMemberPhoto(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
