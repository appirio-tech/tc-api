/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author Sky_, TCSASSEMBLER
 * changes in 1.1:
 * - implement marathon statistics
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var NotFoundError = require('../errors/NotFoundError');

/**
 * Sample result from specification for Software Member Statistics
 */
var sampleStatistics;

/**
 * Sample result from specification for Studio Member Statistics
 */
var sampleStudioStatistics;

/**
 * Sample result from specification for Algorithm Member Statistics
 */
var sampleAlgorithmStatistics;


/**
 * Check whether given user is registered.
 * If user not exist then NotFoundError is returned to callback.
 * @param {String} handle - the handle to check
 * @param {Object} api - the action hero api object
 * @param {Object} dbConnectionMap - the database connection map
 * @param {Function<err>} callback - the callback function
 */
function checkUserExists(handle, api, dbConnectionMap, callback) {
    api.dataAccess.executeQuery("check_coder_exist", { handle: handle }, dbConnectionMap, function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        if (result && result[0] && result[0].handleexist !== 0) {
            callback();
        } else {
            callback(new NotFoundError("User does not exist."));
        }
    });
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
    cacheEnabled: false,
    transaction: 'read',
    databases: ["topcoder_dw"],
    run: function (api, connection, next) {
        api.log("Execute getAlgorithmStatistics#run", 'debug');
        var dbConnectionMap = this.dbConnectionMap,
            handle = connection.params.handle,
            helper = api.helper,
            sqlParams = {
                ha: handle
            },
            result;
        if (!this.dbConnectionMap) {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = { message: "No connection object." };
            next(connection, true);
            return;
        }
        async.waterfall([
            function (cb) {
                checkUserExists(handle, api, dbConnectionMap, cb);
            }, function (cb) {
                var execQuery = function (name) {
                    return function (cbx) {
                        api.dataAccess.executeQuery("get_member_marathon_" + name,
                            sqlParams,
                            dbConnectionMap,
                            cbx);
                    };
                };
                async.parallel({
                    achievements: execQuery("statistics_achievement"),
                    basic: execQuery("statistics")
                }, cb);
            }, function (results, cb) {
                if (results.basic.length === 0) {
                    cb(new NotFoundError('statistics not found'));
                    return;
                }
                var details = results.basic[0];
                result = {
                    "handle": details.handle,
                    "rating": details.rating,
                    "percentile": details.percentile === "N/A" ? "N/A" : Number(details.percentile).toFixed(2) + "%",
                    "rank": details.rank || 'not ranked',
                    "countryRank": details.country_rank || 'not ranked',
                    "schoolRank": details.school_rank || 'not ranked',
                    "volatility": details.vol,
                    "maximumRating": details.maximum_rating,
                    "minimumRating": details.minimum_rating,
                    "defaultLanguage": details.default_language,
                    "competitions": details.competitions,
                    "mostRecentEventName": details.most_recent_event_name,
                    "mostRecentEventDate": details.most_recent_event_date.toString("MM.dd.yy"),
                    "bestRank": details.best_rank,
                    "wins": details.wins,
                    "topFiveFinishes": details.top_five_finishes,
                    "topTenFinishes": details.top_ten_finishes,
                    "avgRank": details.avg_rank,
                    "avgNumSubmissions": details.avg_num_submissions,
                    "achievements": _.map(results.achievements, function (a) {
                        return a.achievement_name;
                    })
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
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getSoftwareStatistics#run", 'debug');
        connection.response = sampleStatistics;
        next(connection, true);
    }
};

/**
* The API for getting studio statistics
*/
exports.getStudioStatistics = {
    name: "getStudioStatistics",
    description: "getStudioStatistics",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getStudioStatistics#run", 'debug');
        connection.response = sampleStudioStatistics;
        next(connection, true);
    }
};

/**
* The API for getting algorithm statistics
*/
exports.getAlgorithmStatistics = {
    name: "getAlgorithmStatistics",
    description: "getAlgorithmStatistics",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getAlgorithmStatistics#run", 'debug');
        connection.response = sampleAlgorithmStatistics;
        next(connection, true);
    }
};


sampleStatistics = {
    "handle": "iRabbit",
    "Archievements": [
        "Five Rated Algorithm Competition",
        "Twenty-Five Rated Algorithm Competition"
    ],
    "Tracks": {
        "Development": {
            "rating": 1659,
            "percentile": "50%",
            "rank": 9999,
            "country Rank": 9999,
            "school Rank": 9999,
            "volatility": 280,
            "compeititions": 37,
            "maximum Rating": 1693,
            "minimum Rating": 1035,
            "reviewer Rating": 1035,
            "inquiries": 37,
            "submissions": 36,
            "submissionRate": "97.30%",
            "passedScreening": 36,
            "screeningSuccessRate": "100.00%",
            "passedReview": 36,
            "reviewSuccessRate": "100.00%",
            "appeals": 279,
            "appealSuccessRate": "33.33%",
            "maximumScore": 100.00,
            "minimumScore": 86.04,
            "averageScore": 95.64,
            "averagePlacement": 3.19,
            "wins": 21,
            "winPercentage": "58.33%",
            "copilotCompletedContests": 300,
            "copilotRepostedContests": 300,
            "copilotFailedContests": 300,
            "copilotFulfillment": "90%"
        },
        "Assembly": {
            "rating": 1659,
            "percentile": "50%",
            "rank": 9999,
            "country Rank": 9999,
            "school Rank": 9999,
            "volatility": 280,
            "compeititions": 37,
            "maximum Rating": 1693,
            "minimum Rating": 1035,
            "reviewer Rating": 1035,
            "inquiries": 37,
            "submissions": 36,
            "submissionRate": "97.30%",
            "passedScreening": 36,
            "screeningSuccessRate": "100.00%",
            "passedReview": 36,
            "reviewSuccessRate": "100.00%",
            "appeals": 279,
            "appealSuccessRate": "33.33%",
            "maximumScore": 100.00,
            "minimumScore": 86.04,
            "averageScore": 95.64,
            "averagePlacement": 3.19,
            "wins": 21,
            "winPercentage": "58.33%",
            "copilotCompletedContests": 300,
            "copilotRepostedContests": 300,
            "copilotFailedContests": 300,
            "copilotFulfillment": "90%"
        }
    }
};

sampleStudioStatistics = {
    "handle": "iRabbit",
    "Archievements": [
        "Five Rated Algorithm Competition",
        "Twenty-Five Rated Algorithm Competition"
    ],
    "Web Design": {
        "numberOfSubmissions": 100,
        "numberOfPassedScreeningSubmissions": 100,
        "numberofWinningSubmissions": 80,
        "copilotCompletedContests": 100,
        "copilotFailedContests": 100
    },
    "Mobile Design": {
        "numberOfSubmissions": 100,
        "numberOfPassedScreeningSubmissions": 100,
        "numberofWinningSubmissions": 80,
        "copilotCompletedContests": 100,
        "copilotFailedContests": 100
    }
};


sampleAlgorithmStatistics = {
    "handle": "iRabbit",
    "rating": 1659,
    "Percentile": "50%",
    "Rank": 9999,
    "Country Rank": 9999,
    "School Rank": 9999,
    "Volatility": 280,
    "Maximum Rating": 1693,
    "Minimum Rating": 1035,
    "Default Language": "C++",
    "Competitions": 29,
    "Most Recent Event Name": "SRM 441",
    "Most Recent Event Date": "05.27.09",
    "Archievements": [
        "Five Rated Algorithm Competition",
        "Twenty-Five Rated Algorithm Competition"
    ],
    "Divisions": {
        "Division I": {
            "Level One": {
                "Submitted": 25,
                "Failed Challenge": 2,
                "Failed Sys. Test": 4,
                "Success %": "76.00%"
            },
            "Level Two": {
                "Submitted": 25,
                "Failed Challenge": 2,
                "Failed Sys. Test": 4,
                "Success %": "76.00%"
            },
            "Level Three": {
                "Submitted": 25,
                "Failed Challenge": 2,
                "Failed Sys. Test": 4,
                "Success %": "76.00%"
            },
            "Level Total": {
                "Submitted": 25,
                "Failed Challenge": 2,
                "Failed Sys. Test": 4,
                "Success %": "76.00%"
            }
        },
        "Division II": {
            "Level One": {
                "Submitted": 25,
                "Failed Challenge": 2,
                "Failed Sys. Test": 4,
                "Success %": "76.00%"
            },
            "Level Two": {
                "Submitted": 25,
                "Failed Challenge": 2,
                "Failed Sys. Test": 4,
                "Success %": "76.00%"
            },
            "Level Three": {
                "Submitted": 25,
                "Failed Challenge": 2,
                "Failed Sys. Test": 4,
                "Success %": "76.00%"
            },
            "Level Total": {
                "Submitted": 25,
                "Failed Challenge": 2,
                "Failed Sys. Test": 4,
                "Success %": "76.00%"
            }
        }
    },
    "Challenges": {
        "Levels": {
            "Level One": {
                "Failed Challenge": 0,
                "Challenges": 1,
                "Success %": "100%"
            },
            "Level Two": {
                "Failed Challenge": 0,
                "Challenges": 1,
                "Success %": "100%"
            },
            "Level Three": {
                "Failed Challenge": 0,
                "Challenges": 1,
                "Success %": "100%"
            },
            "Total": {
                "Failed Challenge": 0,
                "Challenges": 1,
                "Success %": "100%"
            }
        }
    }
};
