/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";

/**
 * Sample result from specification for Review Opportunities
 */
var sampleReviewOpportunities;

/**
 * Sample result from specification for Review Opportunity Detail
 */
var sampleReviewOpportunity;

/**
 * Sample result from specification for Review Opportunities for studio
 */
var sampleStudioReviewOpportunities;

/**
 * Sample result from specification for Review Opportunity Detail for studio
 */
var sampleStudioReviewOpportunity;

/**
 * Sample result from specification for Review Opportunities for algorithms
 */
var sampleAlgorithmsReviewOpportunities;

/**
 * Sample result from specification for Review Opportunity Detail for algorithms
 */
var sampleAlgorithmsReviewOpportunity;


/**
* The API for searching review opportunities
*/
exports.searchReviewOpportunities = {
    name: "searchReviewOpportunities",
    description: "searchReviewOpportunities",
    inputs: {
        required: [],
        optional: ["filter", "value", "pageIndex", "pageSize", "sortColumn", "sortOrder"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute searchReviewOpportunities#run", 'debug');
        connection.response = sampleReviewOpportunities;
        next(connection, true);
    }
};

/**
* The API for getting review opportunity information
*/
exports.getReviewOpportunity = {
    name: "getReviewOpportunity",
    description: "getReviewOpportunity",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getReviewOpportunity#run", 'debug');
        connection.response = sampleReviewOpportunity;
        next(connection, true);
    }
};

/**
* The API for getting review opportunities for studio
*/
exports.getStudioReviewOpportunities = {
    name: "getStudioReviewOpportunities",
    description: "getStudioReviewOpportunities",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getStudioReviewOpportunities#run", 'debug');
        connection.response = sampleStudioReviewOpportunities;
        next(connection, true);
    }
};

/**
* The API for getting review opportunity information for studio
*/
exports.getStudioReviewOpportunity = {
    name: "getStudioReviewOpportunity",
    description: "getStudioReviewOpportunity",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getStudioReviewOpportunity#run", 'debug');
        connection.response = sampleStudioReviewOpportunity;
        next(connection, true);
    }
};

/**
* The API for getting review opportunities for algorithms
*/
exports.getAlgorithmsReviewOpportunities = {
    name: "getAlgorithmsReviewOpportunities",
    description: "getAlgorithmsReviewOpportunities",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getAlgorithmsReviewOpportunities#run", 'debug');
        connection.response = sampleAlgorithmsReviewOpportunities;
        next(connection, true);
    }
};

/**
* The API for getting review opportunity information for algorithms
*/
exports.getAlgorithmsReviewOpportunity = {
    name: "getAlgorithmsReviewOpportunity",
    description: "getAlgorithmsReviewOpportunity",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute getAlgorithmsReviewOpportunity#run", 'debug');
        connection.response = sampleAlgorithmsReviewOpportunity;
        next(connection, true);
    }
};

sampleReviewOpportunities = {
    "total": 21,
    "pageIndex": 1,
    "pageSize": 10,
    "data": [
        {
            "primaryReviewerPayment": 0,
            "secondaryReviewerPayment": 0,
            "submissionsNumber": 1,
            "opensOn": "10.25.2013 21:09 EDT",
            "reviewStart": "10.29.2013 21:13 EDT",
            "reviewEnd": "10.31.2013 21:13 EDT",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Copilot Posting",
            "reviewType": "Contest Review",
            "contestName": "DOE Open-WARP Software Copilot Opportunity"
        },
        {
            "primaryReviewerPayment": 442,
            "secondaryReviewerPayment": 336,
            "submissionsNumber": 3,
            "opensOn": "10.31.2013 22:22 EDT",
            "reviewStart": "11.07.2013 01:52 EST",
            "reviewEnd": "11.09.2013 01:52 EST",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Assembly Competition",
            "reviewType": "Contest Review",
            "contestName": "Module Assembly - Topcoder NodeJS Contest Retrieval API"
        },
        {
            "primaryReviewerPayment": 205,
            "secondaryReviewerPayment": 143,
            "submissionsNumber": 1,
            "opensOn": "11.01.2013 23:25 EDT",
            "reviewStart": "11.08.2013 10:30 EST",
            "reviewEnd": "11.10.2013 10:30 EST",
            "numberOfReviewPositionsAvailable": 2,
            "type": "UI Prototype Competition",
            "reviewType": "Contest Review",
            "contestName": "NEW TC-CS Community TopCoder API Hooking Up part 2- Wordpress Plugin Development"
        },
        {
            "primaryReviewerPayment": 430,
            "secondaryReviewerPayment": 330,
            "submissionsNumber": 4,
            "opensOn": "11.02.2013 07:00 EDT",
            "reviewStart": "11.07.2013 18:05 EST",
            "reviewEnd": "11.09.2013 18:05 EST",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Assembly Competition",
            "reviewType": "Contest Review",
            "contestName": "Module Assembly - TopCoder NodeJS Software Tops REST API"
        },
        {
            "primaryReviewerPayment": 0,
            "secondaryReviewerPayment": 0,
            "submissionsNumber": 2,
            "opensOn": "11.03.2013 20:33 EST",
            "reviewStart": "11.05.2013 20:38 EST",
            "reviewEnd": "11.07.2013 20:38 EST",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Bug Hunt",
            "reviewType": "Contest Review",
            "contestName": "Hercules Player Personal Content DVR Bug Hunt"
        },
        {
            "primaryReviewerPayment": 490,
            "secondaryReviewerPayment": 360,
            "submissionsNumber": 0,
            "opensOn": "11.03.2013 23:20 EST",
            "reviewStart": "11.10.2013 11:25 EST",
            "reviewEnd": "11.12.2013 11:25 EST",
            "numberOfReviewPositionsAvailable": 2,
            "type": "Assembly Competition",
            "reviewType": "Contest Review",
            "contestName": "Hercules Tech App SAHIC Prototype Conversion Module Assembly"
        },
        {
            "primaryReviewerPayment": 0,
            "secondaryReviewerPayment": 0,
            "submissionsNumber": 3,
            "opensOn": "11.04.2013 03:00 EST",
            "reviewStart": "11.07.2013 03:05 EST",
            "reviewEnd": "11.09.2013 03:05 EST",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Bug Hunt",
            "reviewType": "Contest Review",
            "contestName": "Styx Physical Access Control iPad Application iOS7 Bug Hunt 2"
        },
        {
            "primaryReviewerPayment": 0,
            "secondaryReviewerPayment": 0,
            "submissionsNumber": 3,
            "opensOn": "11.04.2013 03:00 EST",
            "reviewStart": "11.07.2013 03:05 EST",
            "reviewEnd": "11.09.2013 03:05 EST",
            "numberOfReviewPositionsAvailable": 1,
            "type": "Bug Hunt",
            "reviewType": "Contest Review",
            "contestName": "Styx Physical Access Control iPhone Application iOS7 Bug Hunt 2"
        },
        {
            "primaryReviewerPayment": 202,
            "secondaryReviewerPayment": 144,
            "submissionsNumber": 0,
            "opensOn": "11.04.2013 09:15 EST",
            "reviewStart": "11.09.2013 21:20 EST",
            "reviewEnd": "11.11.2013 21:20 EST",
            "numberOfReviewPositionsAvailable": 3,
            "type": "Assembly Competition",
            "reviewType": "Contest Review",
            "contestName": "Module Assembly - ActionHero Tasks for Adding LDAP Entry and Sending Verification Emails"
        },
        {
            "primaryReviewerPayment": 298,
            "secondaryReviewerPayment": 216,
            "submissionsNumber": 0,
            "opensOn": "11.04.2013 09:29 EST",
            "reviewStart": "11.09.2013 21:34 EST",
            "reviewEnd": "11.11.2013 21:34 EST",
            "numberOfReviewPositionsAvailable": 3,
            "type": "Assembly Competition",
            "reviewType": "Contest Review",
            "contestName": "Module Assembly - TopCoder NodeJS Member Registration REST API"
        }
    ]
};

sampleReviewOpportunity = {
    "name": "PDS - Import and Persistence Update - Assembly Contest",
    "Phases": [
        {
            "name": "Submission",
            "start": "10.25.2013 23:02 EDT",
            "end": "10.29.2013 23:02 EDT",
            "duration": "143 hours"
        },
        {
            "name": "Screening",
            "start": "10.29.2013 23:02 EDT",
            "end": "10.30.2013 23:02 EDT",
            "duration": "24 hours"
        }
    ],
    "Positions": [
        {
            "role": "Primary Reviewer",
            "positions": 1,
            "payment": 500
        },
        {
            "role": "Secondary Reviewer",
            "positions": 2,
            "payment": 400
        }
    ],
    "Applications": [
        {
            "handle": "iRabbit",
            "role": "Primary Reviewer",
            "status": "Pending",
            "applicationDate": "10.25.2013 23:02 EDT"
        },
        {
            "handle": "iRabbit",
            "role": "Secondary Reviewer",
            "status": "Pending",
            "applicationDate": "10.25.2013 23:02 EDT"
        }
    ]
};


sampleStudioReviewOpportunities = {
    "data": [
        {
            "contestName": "Cornell - Responsive Storyboard Economics Department Site Redesign Contest",
            "round1ScheduledStartDate": "11.01.2013 11:01 EDT",
            "round2ScheduledStartDate": "11.01.2013 11:01 EDT",
            "reviewerPayment": 442,
            "reviewer": "leben",
            "type": "screening"
        },
        {
            "contestName": "Cornell - Responsive Storyboard",
            "round1ScheduledStartDate": "11.01.2013 11:01 EDT",
            "round2ScheduledStartDate": "11.01.2013 11:01 EDT",
            "reviewerPayment": 442,
            "reviewer": "leben",
            "type": "screening"
        }
    ]
};


sampleStudioReviewOpportunity = {
    "name": "PDS - Import and Persistence Update - Assembly Contest",
    "Phases": [
        {
            "name": "Submission",
            "start": "10.25.2013 23:02 EDT",
            "end": "10.29.2013 23:02 EDT",
            "duration": "143 hours"
        },
        {
            "name": "Screening",
            "start": "10.29.2013 23:02 EDT",
            "end": "10.30.2013 23:02 EDT",
            "duration": "24 hours"
        }
    ],
    "Positions": [
        {
            "role": "Screener",
            "positions": 1,
            "payment": 500
        }
    ]
};

sampleAlgorithmsReviewOpportunities = {
    "total": 2,
    "pageIndex": 1,
    "pageSize": 10,
    "data": [
        {
            "id": 10059,
            "reviewerPayment": 100,
            "submissionsNumber": 2,
            "opensOn": "10.11.2013 13:00 EDT",
            "reviewStart": "10.14.2013 13:06 EDT",
            "reviewEnd": "10.16.2013 13:06 EDT",
            "numberOfReviewPositionsAvailable": 3,
            "type": "Screening",
            "reviewType": "Contest Review",
            "contestName": "Algorithms contest 1"
        },
        {
            "id": 10160,
            "reviewerPayment": 100,
            "submissionsNumber": 0,
            "opensOn": "10.11.2013 13:00 EDT",
            "reviewStart": "10.14.2013 13:06 EDT",
            "reviewEnd": "10.16.2013 13:06 EDT",
            "numberOfReviewPositionsAvailable": 2,
            "type": "Screening",
            "reviewType": "Contest Review",
            "contestName": "Algorithms contest 2"
        }]
};

sampleAlgorithmsReviewOpportunity = {
    "contestId": 3005067,
    "contestName": 'Algorithm 1',
    "timeline": [
        {
            "phase": "Submission",
            "start": "11.01.2013",
            "end": "11.05.2013",
            "duration": "95"
        },
        {
            "phase": "Screening",
            "start": "11.05.2013",
            "end": "11.06.2013",
            "duration": "24"
        },
        {
            "phase": "Review",
            "start": "11.06.2013",
            "end": "11.08.2013",
            "duration": "48"
        }
    ],
    "openPositions": [
        {
            "role": "Secondary Reviewer",
            "positions": "2",
            "payment": "$216.22 *"
        }
    ],
    "reviewApplications": [
        {
            "handle": "heffan",
            "role": "Secondary Reviewer",
            "status": "Pending",
            "applicationDate": "11.01.2013 02:31 EDT"
        }
    ]
};