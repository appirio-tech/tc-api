/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";

/**
 * Sample result from specification for Software Member Statistics
 */
var sampleStatistics;

/**
 * Sample result from specification for Studio Member Statistics
 */
var sampleStudioStatistics;

/**
 * Sample result from specification for Marathon Member Statistics
 */
var sampleMarathonStatistics;

/**
 * Sample result from specification for Algorithm Member Statistics
 */
var sampleAlgorithmStatistics;


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


/**
* The API for getting marathon statistics
*/
exports.getMarathonStatistics = {
    name: "getMarathonStatistics",
    description: "getMarathonStatistics",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getMarathonStatistics#run", 'debug');
        connection.response = sampleMarathonStatistics;
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


sampleMarathonStatistics = {
    "handle": "iRabbit",
    "rating": 1659,
    "percentile": "50%",
    "rank": 9999,
    "country Rank": 9999,
    "school Rank": 9999,
    "volatility": 280,
    "maximum Rating": 1693,
    "minimum Rating": 1035,
    "default Language": "C++",
    "competitions": 29,
    "most Recent Event Name": "SRM 441",
    "most Recent Event Date": "05.27.09",
    "bestRank": 21,
    "wins": 0,
    "topFiveFinishes": 0,
    "topTenFinishes": 0,
    "avgRank": 107.08,
    "avgNumSubmissions": 4.62,
    "archievements": [
        "Five Rated Algorithm Competition",
        "Twenty-Five Rated Algorithm Competition"
    ]
};