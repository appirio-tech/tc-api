/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";


/**
 * Sample result from specification for Algorithm SRM Challenges
 */
var sampleSRMChallenges;

/**
 * Sample result from specification for Algorithm SRM Challenge Detail
 */
var sampleSRMChallenge;


/**
* The API for searching SRM challenges
*/
exports.searchSRMChallenges = {
    name: "searchSRMChallenges",
    description: "searchSRMChallenges",
    inputs: {
        required: [],
        optional: ["listType", "filter", "value", "pageIndex", "pageSize", "sortColumn", "sortOrder"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute searchSRMChallenges#run", 'debug');
        connection.response = sampleSRMChallenges;
        next(connection, true);
    }
};


/**
* The API for getting SRM challenge
*/
exports.getSRMChallenge = {
    name: "getSRMChallenge",
    description: "getSRMChallenge",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getSRMChallenge#run", 'debug');
        connection.response = sampleSRMChallenge;
        next(connection, true);
    }
};


sampleSRMChallenges = {
    "pageSize": 2,
    "pageNumber": 1,
    "totalPages": 9,
    "totalCount": 450,
    "items": [
        {
            "roundId": 15761,
            "name": "SRM 595",
            "startDate": "08.22.2013 13:30 EDT",
            "totalCompetitors": 911,
            "divICompetitors": 410,
            "divIICompetitors": 501,
            "divITotalSolutionsSubmitted": 486,
            "divIAverageSolutionsSubmitted": 1.19,
            "divIITotalSolutionsSubmitted": 486,
            "divIIAverageSolutionsSubmitted": 1.19,
            "divITotalSolutionsChallenged": 486,
            "divIAverageSolutionsChallenged": 1.19,
            "divIITotalSolutionsChallenged": 486,
            "divIIAverageSolutionsChallenged": 1.19
        },
        {
            "roundId": 15684,
            "name": "SRM 594",
            "startDate": "08.22.2013 13:30 EDT",
            "totalCompetitors": 911,
            "divICompetitors": 410,
            "divIICompetitors": 501,
            "divITotalSolutionsSubmitted": 486,
            "divIAverageSolutionsSubmitted": 1.19,
            "divIITotalSolutionsSubmitted": 486,
            "divIIAverageSolutionsSubmitted": 1.19,
            "divITotalSolutionsChallenged": 486,
            "divIAverageSolutionsChallenged": 1.19,
            "divIITotalSolutionsChallenged": 486,
            "divIIAverageSolutionsChallenged": 1.19
        }]
};

sampleSRMChallenge = {
    "roundId": 15707,
    "name": "SRM 595",
    "leaders": {
        "divisionI": [
            {
                "handle": "Petr",
                "score": 1531.29,
                "placed": 1,
                "room": 1
            },
            {
                "handle": "ir5",
                "score": 1530.29,
                "placed": 2,
                "room": 2
            }
        ],
        "divisionII": [
            {
                "handle": "xyz111",
                "score": 1531.29,
                "placed": 1,
                "room": 1
            },
            {
                "handle": "jason_yu",
                "score": 1530.29,
                "placed": 2,
                "room": 2
            }
        ]
    },
    "problems": {
        "divisionI": [
            {
                "level": 1,
                "problemName": "easy",
                "submissions": 378,
                "correct%": 82.01,
                "averagePoints": 206.36
            },
            {
                "level": 2,
                "problemName": "easy",
                "submissions": 378,
                "correct%": 82.01,
                "averagePoints": 206.36
            },
            {
                "level": 3,
                "problemName": "easy",
                "submissions": 378,
                "correct%": 82.01,
                "averagePoints": 206.36
            }
        ],
        "divisionII": [
            {
                "level": 1,
                "problemName": "easy",
                "submissions": 378,
                "correct%": 82.01,
                "averagePoints": 206.36
            },
            {
                "level": 2,
                "problemName": "easy",
                "submissions": 378,
                "correct%": 82.01,
                "averagePoints": 206.36
            },
            {
                "level": 3,
                "problemName": "easy",
                "submissions": 378,
                "correct%": 82.01,
                "averagePoints": 206.36
            }
        ]
    }
};