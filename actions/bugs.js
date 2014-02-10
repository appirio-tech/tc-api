/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";

var _ = require('underscore');
var moment = require('moment-timezone');
var async = require('async');
var soap = require('soap');
var https = require('https');
var NotFoundError = require('../errors/NotFoundError');

//we must set this property, otherwise it's not possible to connect to jira service, due to some ssl issue
https.globalAgent.options.secureProtocol = 'SSLv3_method';

/**
 * Max retires for soap authentication
 */
var MAX_AUTH_RETRIES = 5;

/**
 * Default project id for issues search
 */
var DEFAULT_PROJECT = "BUGR";

/**
 * Default status for issues search
 */
var DEFAULT_STATUS = "OPEN";

/**
 * Allowed status for issues search
 */
var ALLOWED_STATUES = ["OPEN", "CLOSED", "ALL"];

/**
 * Regular expression for project name
 */
var VALID_NAME_REG = /^[a-z0-9_]+$/i;

/**
 * Max issues retrieved by issue search
 */
var MAX_ISSUE_LIMIT = 100;

/**
 * Field id for payment field
 */
var PAYMENT_FIELD_NAME = "customfield_10012";

/**
 * Field id for tco points field
 */
var TCO_POINTS_FIELD_NAME = "customfield_10080";

/**
 * The jira soap client instance
 */
var soapClient;

/**
 * The token used for authorization
 */
var authToken;

/**
 * The field used to count the number of authentication failure. The value will be reset to 0 after a
 * successful authentication.
 */
var retryAttemptCount = 0;

/**
 * Get soap client for jira service. Service is initialized only once.
 * @param {Object} api the actionhero api object
 * @param {Function<err, soapClient>} callback the callback function
 */
function getSoapClient(api, callback) {
    if (soapClient) {
        callback(null, soapClient);
    } else {
        soap.createClient(api.configData.general.jiraWsdlUrl, {}, function (err, client) {
            soapClient = client;
            callback(err, soapClient);
        });
    }
}

/**
 * Get authentication token used in jira service.
 * @param {Object} api the actionhero api object
 * @param {Function<err, token>} callback the callback function
 */
function getAuthToken(api, callback) {
    if (authToken) {
        callback(null, authToken);
        return;
    }
    async.waterfall([
        function (cb) {
            getSoapClient(api, cb);
        }, function (client, cb) {
            client.login({
                in0: api.configData.general.jiraUsername,
                in1: api.configData.general.jiraPassword
            }, cb);
        }
    ], function (err, result) {
        if (err) {
            callback(err);
            return;
        }
        authToken = result.loginReturn;
        callback(null, authToken);
    });
}

/**
 * Retrieve issues by jql query
 * @param {Object} api the actionhero api object
 * @param {String} query the jql query
 * @param {Function<err, issues>} callback the callback function
 */
function searchIssues(api, query, callback) {
    var soapClient;
    async.waterfall([
        function (cb) {
            getSoapClient(api, cb);
        }, function (client, cb) {
            soapClient = client;
            getAuthToken(api, cb);
        }, function (token, cb) {
            soapClient.getIssuesFromJqlSearch({in0: token, in1: query, in2: MAX_ISSUE_LIMIT}, cb);
        }
    ], function (err, result) {
        if (err) {
            if (err.message.indexOf("RemoteAuthenticationException") !== -1) {
                retryAttemptCount = retryAttemptCount + 1;
                if (retryAttemptCount < MAX_AUTH_RETRIES) {
                    authToken = null;
                    searchIssues(api, query, callback);
                } else {
                    callback(new Error("Failed to authenticate with Jira RPC Service"));
                }
                return;
            }
            callback(err);
            return;
        }
        retryAttemptCount = 0;
        if (!result || !result.getIssuesFromJqlSearchReturn) {
            callback(new Error('Invalid response from soap service. Field getIssuesFromJqlSearchReturn is missing'));
            return;
        }
        var searchReturn = result.getIssuesFromJqlSearchReturn;
        if (_.isArray(searchReturn.getIssuesFromJqlSearchReturn)) {
            callback(null, searchReturn.getIssuesFromJqlSearchReturn);
        } else {
            //If project contains only one issue then result is not returned as array
            callback(null, searchReturn);
        }
    });
}

/**
 * Map issue from saop format to api format
 * @param {Object} api the actionhero api object
 * @param {Object} data issue data from search query
 * @param {Function<err, issue>} callback the callback function
 */
function mapIssue(api, data, callback) {
    var issue, customFields;
    try {
        issue = {
            name: data.summary,
            jiraUrl: "https://apps.topcoder.com/bugs/browse/" + data.key,
            payment: 'N/A',
            tcoPoints: 'N/A',
            startDate: moment(data.created).tz("America/New_York").format()
        };
        customFields = data.customFieldValues;
        if (customFields) {
            //it can be single object or array
            if (_.isArray(customFields.customFieldValues)) {
                customFields = customFields.customFieldValues;
            } else {
                customFields = [customFields.customFieldValues];
            }
        }
        if (customFields) {
            customFields.forEach(function (field) {
                if (field.customfieldId  === PAYMENT_FIELD_NAME) {
                    issue.payment = Number(field.values.values) || 'N/A';
                }
                if (field.customfieldId  === TCO_POINTS_FIELD_NAME) {
                    issue.tcoPoints = Number(field.values.values) || 'N/A';
                }
            });
        }
    } catch (err) {
        api.log("Error occurred: " + err + " " + (err.stack || ''), "error");
        callback(new Error('Invalid issue format returned by jira soap service'));
        return;
    }
    callback(null, issue);
}

/**
 * Open Bugs API
 */
exports.action = {
    name: "bugs",
    description: "bugs",
    inputs: {
        required: [],
        optional: ["jiraProjectId", "status"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled: false,//for test only
    run: function (api, connection, next) {
        api.log("Execute bugs#run", 'debug');
        var project = (connection.params.jiraProjectId || DEFAULT_PROJECT).toUpperCase(),
            status = (connection.params.status || DEFAULT_STATUS).toUpperCase(),
            helper = api.helper;

        async.waterfall([
            function (cb) {
                var error = _.checkArgument(VALID_NAME_REG.test(project),
                    "Invalid jiraProjectId. It may contain only letters, digits or underscores.") ||
                    helper.checkContains(ALLOWED_STATUES, status, "status");
                cb(error);
            }, function (cb) {
                //wrap project name in quotes because it can be reserved word
                var query = 'project = "' + project + '" and type != 12';
                if (status !== "ALL") {
                    query = query + ' and status = "' + status + '"';
                }
                query = query + " ORDER BY created DESC";
                searchIssues(api, query, cb);
            }, function (results, cb) {
                var fn = mapIssue.bind(null, api);
                async.mapSeries(results, fn, cb);
            }
        ], function (err, result) {
            if (err) {
                var reg = /Query validation failed: The value '[a-z0-9_]+?' does not exist for the field 'project'/i;
                if (reg.test(err.message)) {
                    err = new NotFoundError('Project "' + project + '" not found');
                }
                helper.handleError(api, connection, err);
            } else {
                connection.response = result;
            }
            next(connection, true);
        });
    }
};