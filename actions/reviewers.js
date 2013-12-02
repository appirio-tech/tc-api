/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";

/**
 * Sample result from specification for Contest Reviewers Collection
 */
var sampleReviewers;

/**
* The API for getting contest reviewers collection
*/
exports.action = {
    name: "getContestReviewers",
    description: "getContestReviewers",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getContestReviewers#run", 'debug');
        connection.response = sampleReviewers;
        next(connection, true);
    }
};


sampleReviewers = {
    "total": 4,
    "data": [
        {
            "id": "23040226",
            "handle": "AE-86",
            "rating": "1212",
            "photo": "1.gif"
        },
        {
            "id": "23040228",
            "handle": "AE-88",
            "rating": "1920",
            "photo": "2.gif"
        },
        {
            "id": "23040258",
            "handle": "AE-90",
            "rating": "1386",
            "photo": "3.gif"
        },
        {
            "id": "13040058",
            "handle": "XYZ",
            "rating": "1776",
            "photo": "4.gif"
        }
    ]
};