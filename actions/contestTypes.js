/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author vangavroche, mekanizumu, Sky_
 * @changes from 1.0
 * merged with Member Registration API
 * changes in 1.1:
 * - add stub for contest types for studio and algorithms
 */
"use strict";

/**
 * This is the function that actually get the contest types.
 * 
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var getContestTypes = function (api, connection, dbConnectionMap, next) {
    api.dataAccess.executeQuery("get_contest_types", {}, dbConnectionMap, function (err, result) {
        api.log("Execute result returned", "debug");
        if (err) {
            api.log("Error occured: " + err + " " + (err.stack || ''), "error");
            connection.error = err;
            next(connection, true);
        } else {
            api.log("Forward result", "debug");
            connection.response = result;
            next(connection, true);
        }

    });
};

/**
 * The API for getting contest types
 */
exports.contestTypes = {
    name : "contestTypes",
    description : "contestTypes",
    inputs : {
        required : [],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    transaction : 'read', // this action is read-only
    databases : ['tcs_catalog'],
    run : function (api, connection, next) {
        if (this.dbConnectionMap) {
            api.log("Execute contestTypes#run", 'debug');
            getContestTypes(api, connection, this.dbConnectionMap, next);
        } else {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};

/**
 * The API for getting contest types, while this is guarded by OAuth
 */
exports.contestTypesSecured = {
    name : 'contestTypesSecured',
    description : 'contestTypesSecured',
    inputs : {
        required : [],
        optional : []
    },
    permissionScope : 'CONTEST_REST',
    outputExample : {},
    version : 'v2',
    transaction : 'read', // this action is read-only
    databases : ['tcs_catalog'],
    run : function (api, connection, next) {
        if (this.dbConnectionMap) {
            api.log("Execute contestTypesSecured#run", 'debug');
            getContestTypes(api, connection, this.dbConnectionMap, next);
        } else {
            api.log("dbConnectionMap is null", "debug");
            connection.rawConnection.responseHttpCode = 500;
            connection.response = {message: "No connection object."};
            next(connection, true);
        }
    }
};


/**
 * Sample result from specification for Studio Contest Types
 */
var sampleStudioContestTypes;

/**
 * Sample result from specification for Algorithms Contest Types
 */
var sampleAlgorithmsContestTypes;

/**
 * The API for getting studio contest types
 */
exports.studioContestTypes = {
    name : "studioContestTypes",
    description : "studioContestTypes",
    inputs : {
        required : [],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute studioContestTypes#run", 'debug');
        connection.response = sampleStudioContestTypes;
        next(connection, true);
    }
};

/**
 * The API for getting studio contest types
 */
exports.algorithmsContestTypes = {
    name : "algorithmsContestTypes",
    description : "algorithmsContestTypes",
    inputs : {
        required : [],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute algorithmsContestTypes#run", 'debug');
        connection.response = sampleAlgorithmsContestTypes;
        next(connection, true);
    }
};


sampleStudioContestTypes = [
    {
        "contestCategoryId": 1,
        "contestTypeId": 1,
        "name": "Logo Design",
        "description": "Logo competitions on Studio range from conceptualizing the primary identifying mark of a" +
            " company to creating a product logo or service mark."
    },
    {
        "contestCategoryId": 1,
        "contestTypeId": 2,
        "name": "Print Design",
        "description": "Print competitions can range from a poster for a company event, to a tri-fold brochure" +
            " promoting services."
    },
    {
        "contestCategoryId": 1,
        "contestTypeId": 3,
        "name": "Presentation Design",
        "description": "Presentation design contests organize marketing or sales material into a professional design."
    },
    {
        "contestCategoryId": 2,
        "contestTypeId": 1,
        "name": "Web and Application Design",
        "description": "Web and App design contests are called storyboards."
    },
    {
        "contestCategoryId": 2,
        "contestTypeId": 2,
        "name": "Banners/ Small Element Design",
        "description": "This category covers traditional web banners, along with promos that can be used both on" +
            " web sites and email newsletters."
    },
    {
        "contestCategoryId": 2,
        "contestTypeId": 3,
        "name": "Icons",
        "description": "Icons are designed for web sites, print publications, applications, mobile apps, and" +
            " anywhere else where icons may be used."
    },
    {
        "contestCategoryId": 3,
        "contestTypeId": 1,
        "name": "Wireframe",
        "description": "Wireframe Competitions are designed to take the requirement documents inputs from the" +
            " Specification Contest (or directly from the client) and create a roadmap of the working application."
    },
    {
        "contestCategoryId": 3,
        "contestTypeId": 2,
        "name": "Idea Generation",
        "description": "This unique type of contest asks competitors to conceptualize an idea and present it" +
            " in written format, often with drawings or other diagrams to help explain the idea."
    },
    {
        "contestCategoryId": 4,
        "contestTypeId": 1,
        "name": "UI Prototype",
        "description": "UI Prototype Competitions are designed to take the graphics (UI storyboards) and" +
            " information architecture (IA wireframes) of a web site or application and create a demonstration" +
            " of the working application."
    },
    {
        "contestCategoryId": 4,
        "contestTypeId": 2,
        "name": "RIA Build",
        "description": "Rich Internet Application (RIA) Build Competitions provide the build of small applications" +
            " used both on the Internet and on the desktop."
    }
];

sampleAlgorithmsContestTypes = [
    {
        "ContestCategoryId": 1,
        "ContestTypeId": 1,
        "Name": "Single Round Match (SRM)",
        "Description": "The Algorithm competitions are timed contests where all contestants compete online " +
            "and are given the same problems to solve under the same time constraints."
    },
    {
        "ContestCategoryId": 1,
        "ContestTypeId": 2,
        "Name": "Marathon Match",
        "Description": "TopCoder holds several types of Marathon Match events, typically at least once per month."
    }
];
