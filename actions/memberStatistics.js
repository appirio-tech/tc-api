/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.17
 * @author Sky_, Ghost_141, muzehyun, hesibo, isv, LazyChild, jamestc, TCASSEMBLER
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
 * Changes in 1.17:
 * - Added fields to get my user profile api.
 * - Added logic to update user profile.
 */
"use strict";
/*jslint node: true, stupid: true, unparam: true, plusplus: true */

var async = require('async');
var _ = require('underscore');
var path = require('path');
var fs = require('fs');
var S = require('string');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var BadRequestError = require('../errors/BadRequestError');
var NotFoundError = require('../errors/NotFoundError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var COMPETITION_ID = 1;
var STUDIO_ID = 6;
var OPENAIM_ID = 8;
var HIGH_SCHOOL_ID = 3;

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
 * Update user preference.
 *
 * @param value the value to update
 * @param preferenceId the preference id
 * @param handle the user handle
 * @param userId the user id
 * @param api the api instance
 * @param dbConnectionMap the database connection map
 * @param callback the callback method
 */
function updateUserPreference(value, preferenceId, handle, userId, api, dbConnectionMap, callback) {
    var sqlParams = {};
    async.waterfall([
        function (cb) {
            sqlParams.handle = handle;
            sqlParams.preferenceIds = preferenceId;
            api.dataAccess.executeQuery('get_user_preference_values', sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            sqlParams.coderId = userId;
            sqlParams.preferenceId = preferenceId;
            sqlParams.value = (value.toLowerCase());
            if (results.length > 0) {
                //update
                api.dataAccess.executeQuery('update_user_preference_values', sqlParams, dbConnectionMap, cb);
            } else {
                //insert
                api.dataAccess.executeQuery('insert_user_preference_values', sqlParams, dbConnectionMap, cb);
            }
        }], function (err) {
        callback(err, null);
    });
}

/**
 * Update demographic response.
 *
 * @param key the key
 * @param value the value
 * @param questionId the question id
 * @param userId the user id
 * @param api the api instance
 * @param dbConnectionMap the database connection map
 * @param callback the callback method
 */
function updateDemographicResponse(key, value, questionId, userId, api, dbConnectionMap, callback) {
    var ageAnswerId, sqlParams = {};
    async.waterfall([
        function (cb) {
            sqlParams.questionId = questionId;
            api.dataAccess.executeQuery('get_demographic_answers', sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            var i;
            for (i = 0; i < results.length; i++) {
                if (value.toLowerCase() === results[i].demographic_answer_text.toLowerCase()) {
                    ageAnswerId = results[i].demographic_answer_id;
                    break;
                }
            }
            if (!_.isDefined(ageAnswerId)) {
                cb(new IllegalArgumentError(value + ' is not a valid ' + key + ' value.'));
                return;
            }

            sqlParams.questionId = questionId;
            sqlParams.coderId = userId;
            api.dataAccess.executeQuery('delete_demographic_responses', sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            sqlParams.questionId = questionId;
            sqlParams.coderId = userId;
            sqlParams.answerId = ageAnswerId;
            api.dataAccess.executeQuery('insert_demographic_response', sqlParams, dbConnectionMap, cb);
        }], function (err) {
        callback(err, null);
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
        parts,
        registrationTypes,
        registrationTypesStr,
        allPreferences;

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
        loadData = {earnings: true, ratings: true, achievements: true, address: true, email: true, privacy: true,
            emailNotification: true}; // load all data by default
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

            cb(null, null);
        }, function (results, cb) {
            if (privateInfoEligibility && loadData.privacy && loadData.emailNotification) {
                sqlParams.handle = handle;
                async.parallel({
                    getRegistrationTypes: function (cbx) { api.dataAccess.executeQuery('get_registration_types', sqlParams, dbConnectionMap, cbx); },
                    getCurrentSchool: function (cbx) { api.dataAccess.executeQuery('get_current_school', sqlParams, dbConnectionMap, cbx); }
                }, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (privateInfoEligibility && loadData.privacy) {
                result.privacy = {};
                if (results.getRegistrationTypes.length > 0) {
                    registrationTypes = results.getRegistrationTypes;
                    var i = 0, competitionType = false, studioType = false, openAIMType = false, highSchoolType = false;
                    for (i = 0; i < registrationTypes.length; i++) {
                        if (registrationTypes[i].id === COMPETITION_ID) {
                            competitionType = true;
                        } else if (registrationTypes[i].id === STUDIO_ID) {
                            studioType = true;
                        } else if (registrationTypes[i].id === OPENAIM_ID) {
                            openAIMType = true;
                        } else if (registrationTypes[i].id === HIGH_SCHOOL_ID) {
                            highSchoolType = true;
                        }

                        if ((competitionType || (studioType && openAIMType)) && !highSchoolType) {
                            break;
                        }
                    }

                    if ((competitionType || (studioType && openAIMType))
                            && !highSchoolType && results.getCurrentSchool.length > 0) {
                        result.privacy.showMySchool = results.getCurrentSchool[0] === 't' ? "show" : "hide";
                    } else {
                        result.privacy.showMySchool = "N/A";
                    }

                }
            }
            cb();
        }, function (cb) {
            if (privateInfoEligibility && loadData.privacy) {
                if (registrationTypes.length > 0) {
                    var tmp = '', k;
                    for (k = 0; k < registrationTypes.length; k++) {
                        if (k > 0) {
                            tmp = tmp + ', ';
                        }
                        tmp = tmp + registrationTypes[k].id;
                    }
                    registrationTypesStr = tmp;
                    sqlParams.registrationTypes = tmp;
                    api.dataAccess.executeQuery('get_all_preferences', sqlParams, dbConnectionMap, cb);
                } else {
                    cb(null, null);
                }
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (privateInfoEligibility && loadData.privacy) {
                //query all user preferences values
                if (_.isDefined(results) && results.length > 0) {
                    allPreferences = results;
                    var tmp = '', k;
                    for (k = 0; k < results.length; k++) {
                        if (k > 0) {
                            tmp = tmp + ', ';
                        }
                        tmp = tmp + results[k].id;
                    }
                    sqlParams.preferenceIds = tmp;
                    api.dataAccess.executeQuery('get_user_preference_values', sqlParams, dbConnectionMap, cb);
                } else {
                    cb(null, null);
                }
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (privateInfoEligibility && loadData.privacy) {
                var itemName, itemValue = 'No', i, j;
                for (i = 0; i < allPreferences.length; i++) {
                    itemName = allPreferences[i].name;
                    if (allPreferences[i].id === 100) {
                        itemName = 'showMyEarnings';
                    } else if (allPreferences[i].id === 24) {
                        itemName = 'receiveMessages';
                    }
                    if (_.isDefined(results) && results.length > 0) {
                        for (j = 0; j < results.length; j++) {
                            if (results[j].id === allPreferences[i].id) {
                                itemValue = results[j].value;
                                break;
                            }
                        }
                    }
                    result.privacy[itemName] = itemValue;
                    itemValue = 'No';
                }
                sqlParams.handle = handle;
                api.dataAccess.executeQuery('get_member_contact_black_list', sqlParams, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (privateInfoEligibility && loadData.privacy) {
                result.privacy.messageBlackList = [];
                var i;
                for (i = 0; i < results.length; i++) {
                    result.privacy.messageBlackList.push(results[i].handle);
                }
            }
            cb();
        }, function (cb) {
            if (privateInfoEligibility && loadData.emailNotification) {
                if (registrationTypes.length > 0) {
                    sqlParams.types = registrationTypesStr;
                    sqlParams.handle = handle;
                    async.parallel({
                        getNotifies: function (cbx) { api.dataAccess.executeQuery('get_notifies', sqlParams, dbConnectionMap, cbx); },
                        getUserNotifies: function (cbx) { api.dataAccess.executeQuery('get_user_notifies', sqlParams, dbConnectionMap, cbx); }
                    }, cb);
                } else {
                    cb(null, null);
                }
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (privateInfoEligibility && loadData.emailNotification) {
                result.emailNotification = {};
                if (results.getNotifies.length > 0) {
                    var itemName, itemValue, i, j, type;
                    for (i = 0; i < results.getNotifies.length; i++) {
                        itemValue = 'No';
                        itemName = results.getNotifies[i].name;
                        type = results.getNotifies[i].type;

                        for (j = 0; j < results.getUserNotifies.length; j++) {
                            if (results.getUserNotifies[j].id === results.getNotifies[i].id) {
                                itemValue = 'Yes';
                                break;
                            }
                        }
                        if (!_.isDefined(result.emailNotification[type])) {
                            result.emailNotification[type] = {};
                        }
                        result.emailNotification[type][itemName] = itemValue;
                    }
                }
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
        storePath = api.config.tcConfig.memberPhoto.storeDir,
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
            if (helper.checkContains(api.config.tcConfig.memberPhoto.validTypes, photo.type.substring(photo.type.lastIndexOf('/') + 1), 'photoType')) {
                cb(new BadRequestError('The photo has to be in following format: ' + api.config.tcConfig.memberPhoto.validTypes + '.'));
                return;
            }
            cb(helper.checkMember(connection, 'Authorization information needed.'));
        },
        function (cb) {
            fs.stat(photo.path, function (err, stats) {
                if (stats.size > api.config.tcConfig.memberPhoto.fileSizeLimit) {
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
                results.submissions.forEach(function (row) {
                    result.Tracks[row.phase_id] = {
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
                    };
                });

                results.basics.forEach(function (track) {
                    // Use the phase id to locate the data.
                    var data = result.Tracks[track.category_id];
                    if (data) {
                        _.extend(data, {
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
                        });
                    } else {
                        api.log("unable to update basic data. no track data for handle " + handle + " in category " + helper.getPhaseName(track.category_id), "warning");
                    }
                });

                results.rating.forEach(function (row) {
                    // Use phase id to locate the data.
                    var data = result.Tracks[row.category_id];
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

                // Transfer phase id to phase name here.
                _.keys(result.Tracks).forEach(function (phaseId) {
                    result.Tracks[helper.getPhaseName(phaseId)] = result.Tracks[phaseId];
                    delete result.Tracks[phaseId];
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
                    challengeId: element.challenge_id,
                    preview: api.config.tcConfig.designSubmissionLink + element.submission_id + "&sbt=small"
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



function updateCountry(countryName, userId, api, dbConnectionMap, callback) {
    var sqlParams = {};
    async.waterfall([
        function (cb) {
            if (countryName.length === 0) {
                cb(new IllegalArgumentError(countryName + ' is empty.'));
                return;
            }
            sqlParams.countryName = countryName;
            api.dataAccess.executeQuery('get_country_code', sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            if (results.length === 0) {
                cb(new IllegalArgumentError(countryName + ' is not a valid country name.'));
                return;
            }

            sqlParams.compCountryCode = results[0].country_code;
            sqlParams.coderId = userId;
            api.dataAccess.executeQuery('update_user_country_code', sqlParams, dbConnectionMap, cb);
        }], function (err) {
        callback(err, null);
    });
}


function updateEmailNotification(emailNotification, registrationTypes, userId, api, dbConnectionMap, callback) {
    var sqlParams = {}, tmp = '', k, registrationTypesStr, yesList = [];
    async.waterfall([
        function (cb) {
            if (registrationTypes.length > 0) {
                for (k = 0; k < registrationTypes.length; k++) {
                    if (k > 0) {
                        tmp = tmp + ', ';
                    }
                    tmp = tmp + registrationTypes[k].id;
                }
                registrationTypesStr = tmp;

                sqlParams.types = registrationTypesStr;
                api.dataAccess.executeQuery('get_notifies', sqlParams, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            //check parameter
            var checkResults = [], i, j, flag, idList = '', allNotifies = JSON.parse(emailNotification),
                keys = _.keys(allNotifies);
            for (i = 0; i < keys.length; i++) {
                flag = false;
                if (i > 0) {
                    idList = idList + ', ';
                }
                if (_.isDefined(allNotifies[keys[i]]) && allNotifies[keys[i]].toLowerCase() !== 'yes'
                        && allNotifies[keys[i]].toLowerCase() !== 'no') {
                    cb(new IllegalArgumentError(keys[i] + ' contains invalid value.'));
                    return;
                }

                for (j = 0; j < results.length; j++) {
                    if (results[j].name.toLowerCase() === keys[i].toLowerCase()) {
                        flag = true;
                        idList = idList + results[j].id;
                        if (_.isDefined(allNotifies[keys[i]]) && allNotifies[keys[i]].toLowerCase() === 'yes') {
                            yesList.push(results[j].id);
                        }
                        break;
                    }
                }

                if (!flag) {
                    checkResults.push(keys[i]);
                }

            }

            if (checkResults.length !== 0) {
                cb(new IllegalArgumentError(checkResults + ' is invalid key.'));
                return;
            }
            //remove notify in user notify table
            sqlParams.userId = userId;
            sqlParams.notifyId = idList;
            api.dataAccess.executeQuery('delete_user_notifies', sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            var insert = function (id, cbx) {
                sqlParams.userId = userId;
                sqlParams.notifyId = id;
                api.dataAccess.executeQuery('insert_user_notify', sqlParams, dbConnectionMap, cbx);
            };
            async.map(yesList, insert, function (err, r) {
                cb();
            });
        }], function (err) {
        callback(err, null);
    });
}

function handleEmail(email, userId, api, dbConnectionMap, callback) {
    var sqlParams = {};
    async.waterfall([
        function (cb) {
            sqlParams.coderId = userId;
            sqlParams.typeId = email.typeId;
            api.dataAccess.executeQuery('get_email', sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            if (results.length === 0) {
                //insert
                async.waterfall([
                    function (callback) {
                        // get the next email id
                        api.idGenerator.getNextID("EMAIL_SEQ", dbConnectionMap, function (err, emailId) {
                            callback(err, emailId);
                        });
                    },
                    function (emailId, callback) {
                        // insert email
                        sqlParams.userId = userId;
                        sqlParams.emailId = emailId;
                        sqlParams.emailTypeId = email.typeId;
                        sqlParams.address = email.email;
                        sqlParams.statusId = email.statusId;
                        sqlParams.primaryInd = ((email.typeId === 1) ? 1 : 0);
                        api.dataAccess.executeQuery('insert_full_email', sqlParams, dbConnectionMap, callback);
                    }
                ], function (err, result) {
                    cb(err, result);
                });
            } else {
                //update
                sqlParams.emailId = results[0].email_id;
                sqlParams.emailTypeId = email.typeId;
                sqlParams.address = email.email;
                sqlParams.statusId = email.statusId;
                api.dataAccess.executeQuery('update_email', sqlParams, dbConnectionMap, cb);
            }
        }], function (err) {
        callback(err, null);
    });
}

function updateEmail(emails, userId, api, dbConnectionMap, callback) {
    var sqlParams = {}, allEmails = JSON.parse(emails), primaryId = -1, secondaryId = -1, i;
    async.waterfall([
        function (cb) {
            //check email at first
            if (allEmails.length > 2) {
                cb(new IllegalArgumentError('It cannot have more than 2 emails.'));
                return;
            }
            if (allEmails.length === 1) {
                //only one is primary
                if (allEmails[0].type.toLowerCase() !== 'primary') {
                    cb(new IllegalArgumentError('One email should be primary email.'));
                    return;
                }
                primaryId = 0;
            } else if (allEmails.length === 2) {
                //one is primary, one is secondary, cannot be same
                for (i = 0; i < allEmails.length; i++) {
                    if (allEmails[i].type.toLowerCase() === 'primary') {
                        primaryId = i;
                    } else if (allEmails[i].type.toLowerCase() === 'secondary') {
                        secondaryId = i;
                    }
                }
                if (primaryId === -1) {
                    cb(new IllegalArgumentError('One of emails should be primary email.'));
                    return;
                }

                if (secondaryId === -1) {
                    cb(new IllegalArgumentError('One of emails should be secondary email.'));
                    return;
                }

                if (allEmails[0].email === allEmails[1].email) {
                    cb(new IllegalArgumentError('The email addresses should not be same.'));
                    return;
                }
            }
            cb();
        }, function (cb) {
            api.dataAccess.executeQuery('get_email_type', sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            //validation
            var typeFlag, j, emailError;
            for (i = 0; i < allEmails.length; i++) {
                typeFlag = false;
                for (j = 0; j < results.length; j++) {
                    if (allEmails[i].type.toLowerCase() === results[j].email_type_desc.toLowerCase()) {
                        typeFlag = true;
                        allEmails[i].typeId = results[j].email_type_id;
                        break;
                    }
                }
                //status is optional
                allEmails[i].statusId = 1;

                //validate email format
                emailError = api.helper.checkEmailAddress(allEmails[i].email, allEmails[i].type + ' email');
                if (emailError) {
                    cb(emailError);
                    return;
                }

                if (!typeFlag) {
                    cb(new IllegalArgumentError(allEmails[i].type + ' is not a valid email type.'));
                    return;
                }
            }

            //delete emails, primary email can't be removed, it's controlled in sql
            sqlParams.coderId = userId;
            api.dataAccess.executeQuery('delete_email', sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            if (primaryId !== -1) {
                handleEmail(allEmails[primaryId], userId, api, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (secondaryId !== -1) {
                handleEmail(allEmails[secondaryId], userId, api, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }], function (err) {
        callback(err, null);
    });
}


function updateAddress(address, userId, api, dbConnectionMap, callback) {
    var sqlParams = {}, allAddress, createdAddressId, countryCode, stateCode;
    async.waterfall([
        function (cb) {
            allAddress = JSON.parse(address);

            if (_.isDefined(allAddress.country)) {
                sqlParams.countryName = allAddress.country;
                api.dataAccess.executeQuery('get_country_code', sqlParams, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (_.isDefined(allAddress.country)) {
                if (results.length === 0) {
                    cb(new IllegalArgumentError('The country in address is not a valid country name.'));
                    return;
                }

                countryCode = results[0].country_code;
                if (countryCode === '840' && _.isDefined(allAddress.state)) {
                    sqlParams.stateName = allAddress.state;
                    api.dataAccess.executeQuery('get_state_code', sqlParams, dbConnectionMap, cb);
                } else {
                    cb(null, null);
                }
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (_.isDefined(allAddress.country) && countryCode === '840' && _.isDefined(allAddress.state)) {
                if (results.length === 0) {
                    cb(new IllegalArgumentError('The state in address is not a valid state name.'));
                    return;
                }
                stateCode = results[0].state_code;
            }

            sqlParams.coderId = userId;
            api.dataAccess.executeQuery('get_address', sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            sqlParams.address1 = allAddress.address1;
            sqlParams.address2 = allAddress.address2;
            sqlParams.address3 = allAddress.address3;
            sqlParams.city = allAddress.city;
            sqlParams.zip = allAddress.zip;
            sqlParams.countryCode = null;
            sqlParams.province = null;
            sqlParams.stateCode = null;

            if (_.isDefined(allAddress.country)) {
                sqlParams.countryCode = countryCode;
            }

            if (_.isDefined(stateCode)) {
                sqlParams.stateCode = stateCode;
            }

            if (_.isDefined(allAddress.province) && countryCode !== '840') {
                sqlParams.province = allAddress.province;
            }

            if (results.length > 0) {
                //update
                sqlParams.addressId = results[0].address_id;
                api.dataAccess.executeQuery('update_address', sqlParams, dbConnectionMap, cb);
            } else {
                //insert
                async.waterfall([
                    function (callback) {
                        api.idGenerator.getNextIDFromDb("ADDRESS_SEQ", "time_oltp", dbConnectionMap, function (err, addressId) {
                            callback(err, addressId);
                        });
                    },
                    function (addressId, callback) {
                        createdAddressId = addressId;
                        sqlParams.addressId = addressId;
                        api.dataAccess.executeQuery('insert_full_address', sqlParams, dbConnectionMap, callback);
                    },
                    function (result, callback) {
                        sqlParams.addressId = createdAddressId;
                        sqlParams.userId = userId;
                        api.dataAccess.executeQuery('insert_address_xref', sqlParams, dbConnectionMap, callback);
                    }
                ], function (err, result) {
                    cb(err, result);
                });
            }
        }], function (err) {
        callback(err, null);
    });
}



function updateMessageBlackList(messageBlackList, userId, api, dbConnectionMap, callback) {
    var sqlParams = {};
    async.waterfall([
        function (cb) {
            sqlParams.userId = userId;
            api.dataAccess.executeQuery('delete_member_contact_black_list', sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            var getUserId = function (item, cbx) {
                api.dataAccess.executeQuery('get_user_by_handle', {handle : item}, dbConnectionMap, cbx);
            };
            async.map(JSON.parse(messageBlackList), getUserId, function (err, result) {
                cb(null, result);
            });
        }, function (results, cb) {
            var i, insertBlockUsers = function (item, cbx) {
                if (_.isDefined(item)) {
                    async.waterfall([
                        function (c) {
                            sqlParams.userId = userId;
                            sqlParams.blockedUserId = item[0].id;
                            api.dataAccess.executeQuery('get_one_member_contact_black', sqlParams, dbConnectionMap, c);
                        }, function (results, c) {
                            if (results.length > 0) {
                                sqlParams.userId = userId;
                                sqlParams.blockedUserId = item[0].id;
                                sqlParams.flag = 1;
                                api.dataAccess.executeQuery('update_member_contact_black', sqlParams, dbConnectionMap, c);
                            } else {
                                api.dataAccess.executeQuery('insert_member_contact_black_list',
                                    {blockUserId : item[0].id, coderId : userId}, dbConnectionMap, cbx);
                            }
                        }], function (err) {
                        cbx(err, null);
                    });
                }
            };
            for (i = 0; _.isDefined(results[i]) && i < results.length; i++) {
                if (results[i].length === 0) {
                    cb(new IllegalArgumentError('messageBlackList contains invalid user handle.'));
                    return;
                }
                if (results[i][0].id === userId) {
                    cb(new IllegalArgumentError('messageBlackList cannot contain current user.'));
                    return;
                }
            }

            async.map(results, insertBlockUsers, function (err, result) {
                cb(null, null);
            });
        }], function (err) {
        callback(err, null);
    });
}



function updateQuote(quote, userId, api, dbConnectionMap, callback) {
    var sqlParams = {};
    async.waterfall([
        function (cb) {
            if (quote.length > 255) {
                cb(new IllegalArgumentError('quote value is too long.'));
                return;
            }
            sqlParams.quote = quote;
            sqlParams.coderId = userId;
            api.dataAccess.executeQuery('update_user_quote', sqlParams, dbConnectionMap, cb);
        }], function (err) {
        callback(err, null);
    });
}

function updateShowMySchool(showMySchool, askHighSchool, userId, api, dbConnectionMap, callback) {
    async.waterfall([
        function (cb) {
            if (!askHighSchool) {
                cb(new IllegalArgumentError('showMySchool value is not allowed to update for this user.'));
                return;
            }
            if (showMySchool.toLowerCase() !== 'yes' && showMySchool.toLowerCase() !== 'no') {
                cb(new IllegalArgumentError('showMySchool value is invalid.'));
                return;
            }

            api.dataAccess.executeQuery('update_current_high_school',
                {viewable : (showMySchool.toLowerCase() === 'yes' ? 1 : 0), coderId : userId}, dbConnectionMap, cb);
        }], function (err) {
        callback(err, null);
    });
}


function updateShowMyEarnings(showMyEarnings, handle, userId, api, dbConnectionMap, callback) {
    async.waterfall([
        function (cb) {
            if (showMyEarnings.toLowerCase() !== 'show' && showMyEarnings.toLowerCase() !== 'hide') {
                cb(new IllegalArgumentError('showMyEarnings value is invalid.'));
                return;
            }
            updateUserPreference(showMyEarnings, '100', handle, userId, api, dbConnectionMap, cb);
        }], function (err) {
        callback(err, null);
    });
}

function updateReceiveMessages(receiveMessages, handle, userId, api, dbConnectionMap, callback) {
    async.waterfall([
        function (cb) {
            if (receiveMessages.toLowerCase() !== 'yes' && receiveMessages.toLowerCase() !== 'no') {
                cb(new IllegalArgumentError('receiveMessages value is invalid.'));
                return;
            }
            updateUserPreference(receiveMessages, '24', handle, userId, api, dbConnectionMap, cb);
        }], function (err) {
        callback(err, null);
    });
}


/**
 * Updates user profile.
 *
 * @param api the api instance.
 * @param handle the handle value
 * @param dbConnectionMap the database connection map
 * @param connection the connection instance
 * @param next the callback method
 */
function updateUserProfile(api, handle, dbConnectionMap, connection, next) {
    var helper = api.helper,
        sqlParams = {
            handle: handle
        },
        result = {},
        registrationTypes,

        userId = 0,
        emailNotification = connection.params.emailNotification,
        countryName = connection.params.country,
        age = connection.params.age,
        gender = connection.params.gender,
        shirtSize = connection.params.shirtSize,
        emails = connection.params.emails,
        address = connection.params.address,
        showMySchool = connection.params.showMySchool,
        messageBlackList = connection.params.messageBlackList,
        showMyEarnings = connection.params.showMyEarnings,
        receiveMessages = connection.params.receiveMessages,
        askHighSchool = false,
        quote = connection.params.quote;


    async.waterfall([
        function (cb) {
            checkUserActivated(handle, api, dbConnectionMap, function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    cb(result);
                }
            });
        }, function (cb) {
            sqlParams.handle = handle;
            async.parallel({
                getRegistrationTypes: function (cbx) { api.dataAccess.executeQuery('get_registration_types', sqlParams, dbConnectionMap, cbx); },
                getCurrentSchool: function (cbx) { api.dataAccess.executeQuery('get_current_school', sqlParams, dbConnectionMap, cbx); },
                getUser: function (cbx) { api.dataAccess.executeQuery('get_user_by_handle', sqlParams, dbConnectionMap, cbx); }
            }, cb);
        }, function (results, cb) {
            if (results.getUser.length > 0) {
                userId = results.getUser[0].id;
            }
            registrationTypes = results.getRegistrationTypes;
            var i, competitionType = false, studioType = false, openAIMType = false, highSchoolType = false,
                emptyQuery = function (cbx) { cbx(); };
            if (_.isDefined(showMySchool)) {
                if (registrationTypes.length > 0) {
                    for (i = 0; i < registrationTypes.length; i++) {
                        if (registrationTypes[i].id === COMPETITION_ID) {
                            competitionType = true;
                        } else if (registrationTypes[i].id === STUDIO_ID) {
                            studioType = true;
                        } else if (registrationTypes[i].id === OPENAIM_ID) {
                            openAIMType = true;
                        } else if (registrationTypes[i].id === HIGH_SCHOOL_ID) {
                            highSchoolType = true;
                        }
                        if ((competitionType || (studioType && openAIMType))
                                && !highSchoolType) {
                            break;
                        }
                    }

                    if ((competitionType || (studioType && openAIMType))
                            && !highSchoolType && results.getCurrentSchool.length > 0) {
                        askHighSchool = true;
                    }
                }
            }

            async.parallel({
                updateEmailNotification: _.isDefined(emailNotification) ?
                        function (cbx) { updateEmailNotification(emailNotification, registrationTypes, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery,

                updateCountryName: _.isDefined(countryName) ?
                        function (cbx) { updateCountry(countryName, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery,
                updateQuote: _.isDefined(quote) ?
                        function (cbx) { updateQuote(quote, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery,

                updateAge: _.isDefined(age) ?
                        function (cbx) { updateDemographicResponse('age', age, 1, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery,

                updateGender: _.isDefined(gender) ?
                        function (cbx) { updateDemographicResponse('gender', gender, 2, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery,

                updateShirtSize: _.isDefined(shirtSize) ?
                        function (cbx) { updateDemographicResponse('shirtSize', shirtSize, 26, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery,

                updateEmail: _.isDefined(emails) ?
                        function (cbx) { updateEmail(emails, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery,

                updateAddress: _.isDefined(address) ?
                        function (cbx) { updateAddress(address, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery,

                updateMessageBlackList: _.isDefined(messageBlackList) ?
                        function (cbx) { updateMessageBlackList(messageBlackList, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery,

                updateShowMySchool: _.isDefined(showMySchool) ?
                        function (cbx) { updateShowMySchool(showMySchool, askHighSchool, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery,

                updateShowMyEarnings: _.isDefined(showMyEarnings) ?
                        function (cbx) { updateShowMyEarnings(showMyEarnings, handle, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery,

                updateReceiveMessages: _.isDefined(receiveMessages) ?
                        function (cbx) { updateReceiveMessages(receiveMessages, handle, userId, api, dbConnectionMap, cbx); }
                    : emptyQuery
            }, cb);
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
 * The action for update my profile api.
 */
exports.updateMyProfile = {
    name: "updateMyProfile",
    description: "update my profile",
    inputs: {
        required: [],
        optional: ['emailNotification', 'country', 'quote', 'age', 'gender', 'shirtSize', 'emails', 'address',
            'messageBlackList', 'showMySchool', 'showMyEarnings', 'receiveMessages']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,
    transaction: 'read',
    databases: ["informixoltp", "topcoder_dw", "common_oltp", "time_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute updateMyProfile#run", "debug");
            if (connection.caller.accessLevel === "anon") {
                api.helper.handleError(api, connection, new UnauthorizedError("Authentication credential was missing."));
                next(connection, true);
            } else {
                updateUserProfile(api, connection.caller.handle, connection.dbConnectionMap, connection, next);
            }
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
