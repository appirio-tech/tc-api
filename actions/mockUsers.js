/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */
"use strict";

/*
 * These are just examples of values retrieved from database that we use for mock functions below.
 * Please follow the correct API specification for actual tuple formats.
 */
var mockedUsers = [{name: "user1", email: "user1@topcoder.com"},{name: "user2", email: "user2@topcoder.com"}],
    mockedNewUser = {id: "3", name: "user3", email: "user3@topcoder.com"},
    mockedChangedUser = {id: "3", name: "newuser3", email: "user3@topcoder.com"};

/**
 * This is the function that gets users.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Function} next The callback to be called after this function is done
 */
function getUsers(api, connection, next) {
    api.log("Forward result", "debug");
    // put code here to get from database
    connection.response = mockedUsers;
    next(connection, true);
}

/**
 * This is the function that creates users.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Function} next The callback to be called after this function is done
 */
function createUser(api, connection, next){
    api.log("Forward result", "debug");
    //put code here to create new user
    connection.response = mockedNewUser;
    connection.rawConnection.responseHttpCode = 201;
    next(connection, true);
}

/**
 * This is the function that updates users.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Function} next The callback to be called after this function is done
 */
function updateUser(api, connection, next){
    //put code here to save update a given user based on id
    api.log("Forward result", "debug");
    connection.response = mockedChangedUser;
    next(connection, true);
}

/**
 * The API for getting users
 */
exports.getUsers = {
    name : "getUsers",
    description : "getUsers",
    inputs : {
        required : [],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute getUsers#run", 'debug');
        getUsers(api, connection, next);
    }
};

/**
 * The API for getting users, guarded by OAuth
 */
exports.getUsersSecured = {
    name : 'getUsersSecured',
    description : 'getUsersSecured',
    inputs : {
        required : [],
        optional : []
    },
    permissionScope : 'CONTEST_REST',
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute getUsersSecured#run", 'debug');
        getUsers(api, connection, next);
    }
};

/**
 * The API for creating user
 */
exports.createUser = {
    name : "createUser",
    description : "createUser",
    inputs : {
        required : [],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute createUsers#run", 'debug');
        createUser(api, connection, next);
    }
};

/**
 * The API for creating users, guarded by OAuth
 */
exports.createUserSecured = {
    name : "createUserSecured",
    description : "createUserSecured",
    inputs : {
        required : [],
        optional : []
    },
    permissionScope: 'CONTEST_REST',
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute createUsersSecured#run", 'debug');
        createUser(api, connection, next);
    }
};

/**
 * The API for updating user
 */
exports.updateUser = {
    name : "updateUser",
    description : "updateUser",
    inputs : {
        required : ["id"],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute updateUsers#run", 'debug');
        updateUser(api, connection, next);
    }
};

/**
 * The API for updating users, guarded by OAuth
 */
exports.updateUserSecured = {
    name : "updateUserSecured",
    description : "updateUserSecured",
    inputs : {
        required : ["id"],
        optional : []
    },
    permissionScope: 'CONTEST_REST',
    outputExample : {},
    version : 'v2',
    run : function (api, connection, next) {
        api.log("Execute updateUsersSecured#run", 'debug');
        updateUser(api, connection, next);
    }
};