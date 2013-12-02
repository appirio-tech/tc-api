/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";


/**
 * Sample result from specification for Marathon Challenges
 */
var sampleMarathonChallenges;

/**
 * Sample result from specification for Marathon Challenge Detail
 */
var sampleMarathonChallenge;

/**
* The API for searching Marathon challenges
*/
exports.searchMarathonChallenges = {
    name: "searchMarathonChallenges",
    description: "searchMarathonChallenges",
    inputs: {
        required: [],
        optional: ["listType", "filter", "value", "pageIndex", "pageSize", "sortColumn", "sortOrder"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute searchMarathonChallenges#run", 'debug');
        connection.response = sampleMarathonChallenges;
        next(connection, true);
    }
};

/**
* The API for getting Marathon challenge
*/
exports.getMarathonChallenge = {
    name: "getMarathonChallenge",
    description: "getMarathonChallenge",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getMarathonChallenge#run", 'debug');
        connection.response = sampleMarathonChallenge;
        next(connection, true);
    }
};

sampleMarathonChallenges = {
    "pageSize": 2,
    "pageNumber": 1,
    "totalPages": 9,
    "totalCount": 450,
    "items": [
        {
            "roundId": 15761,
            "fullName": "USAID and Humanity United",
            "shortName": "Tech Challenge for Atrocity Prevention",
            "startDate": "08.22.2013 13:30 EDT",
            "endDate": "08.22.2013 13:30 EDT",
            "winnerHandle": "nhzp339",
            "winnerScore": 376.79
        },
        {
            "roundId": 15684,
            "fullName": "Marathon Match 81",
            "shortName": "Marathon Match 81",
            "startDate": "06.05.2013 12:43 EDT",
            "endDate": "06.05.2013 12:43 EDT",
            "winnerHandle": "ACRush",
            "winnerScore": 999534.81
        }]
};

sampleMarathonChallenge = {
    "roundId": 15678,
    "fullName": "SensorFusion2",
    "shortName": "SensorFusion2",
    "noOfRegistrants": 295,
    "noOfSubmissions": 215,
    "noOfCompetitors": 32,
    "startDate": "05.22.2013 09:00 EDT",
    "endDate": "06.05.2013 09:00 EDT",
    "systemTestDate": "06.05.2013 09:00 EDT",
    "winnerHandle": "JacoCronje",
    "winnerScore": 403096.68,
    "currentProgress": {
        "groupType": "HOUR",
        "progressResources": [
            {
                "currentTopProvisionalScore": 0,
                "currentNoOfSubmissions": 0,
                "currentNoOfcompetitors": 0,
                "currentNoOfRegistrants": 4,
                "date": "05.22.2013 10:00 EDT",
                "topUserHandle": ""
            },
            {
                "currentTopProvisionalScore": 0,
                "currentNoOfSubmissions": 0,
                "currentNoOfcompetitors": 0,
                "currentNoOfRegistrants": 9,
                "date": "05.22.2013 11:00 EDT",
                "topUserHandle": ""
            }
        ]
    },
    "registrantsRatingSummary": [
        {
            "ratingType": "BLUE",
            "ratingColor": "Blue",
            "noOfMembers": 18
        },
        {
            "ratingType": "GRAY",
            "ratingColor": "Gray",
            "noOfMembers": 26
        }
    ]
};