/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var request = require('request');

var NotFoundError = require('../errors/NotFoundError');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var UnauthorizedError = require('../errors/UnauthorizedError');

/**
 * Creates the options object used for making an HTTP request.
 * Sets the HTTP method, url, body and the Docusign Authorization header
 * @param <Object> api The infrastructure api object from which we read the configuration
 * @param <String> url The url to set for the HTTP request
 * @param <String> method The verb to set for the HTTP request
 * @param <String> body The body to set for the HTTP request in case method is POST. It must be a String not an Object.
 * @return options the options object for the HTTP request
 */
function initializeRequest(api, url, method, body) {
    var options = {
        "method": method,
        "uri": url,
        "body": body,
        "headers": {}
    }, dsAuthHeader = JSON.stringify({ // DocuSign authorization header
        "Username": api.config.docusign.username,
        "Password": api.config.docusign.password,
        "IntegratorKey": api.config.docusign.integratorKey
    });
    options.headers["X-DocuSign-Authentication"] = dsAuthHeader;

    return options;
}

/**
 * The method that exposes the Get Docusign Recipient View URL API.
 */
exports.action = {
    name: 'generateDocusignViewURL',
    description: 'generateDocusignViewURL',
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["informixoltp", "common_oltp"],
    inputs: {
        required: ["templateId"],
        optional: ["tabs"]
    },
    run: function (api, connection, next) {
        var baseURL,
            helper = api.helper,
            sqlParams = {},
            dbConnectionMap = connection.dbConnectionMap,
            templateId = connection.params.templateId,
            tabs = _.isUndefined(connection.params.tabs) ? [] : connection.params.tabs,
            options,
            user,
            recipientViewUrl,
            envelopeId;

        if (!connection.dbConnectionMap) {
            api.helper.handleNoConnection(api, connection, next);
            return;
        }

        api.log("Executing getDocusignViewURL#run", 'debug');
        async.waterfall([
            function (cb) {
                var x, spl, u;

                //Check if the templateId is valid
                if (!templateId.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)) {
                    cb(new IllegalArgumentError("templateId is not a valid uuid."));
                    return;
                }

                //Check if the user is logged-in
                if (connection.caller.accessLevel === 'anon') {
                    cb(new UnauthorizedError("Authentication details missing or incorrect."));
                    return;
                }

                //actionhero will use a string if only 1 tabs is found, and will use an array if more than are found
                if (_.isString(tabs)) {
                    tabs = [tabs];
                }

                //validation of the tabs parameter
                for (x = 0; x < tabs.length; x = x + 1) {
                    spl = tabs[x].split('||');
                    if (spl.length !== 2) {
                        cb(new IllegalArgumentError("tabs parameter is not in correct format. " +
                             "Key values must be a separated by a || (double pipe)."));
                        return;
                    }
                    tabs[x] = spl;
                }


                //Perform login to docusign
                options = initializeRequest(api, api.config.docusign.serverURL + "login_information", 'GET', '');
                request(options, function (err, res, body) {
                    var resp = JSON.parse(body);
                    if (err || (res.statusCode !== 200 && res.statusCode !== 201)) {
                        //In case of system integration failure, we log the error (if we have one)...
                        //but we only show generic message to end user
                        if (resp && resp.message) {
                            api.log(resp.message, 'error');
                        }
                        cb({message: "Login to DocuSign server failed."});
                        return;
                    }
                    baseURL = resp.loginAccounts[0].baseUrl;
                    cb();
                });
            }, function (cb) {
                sqlParams.userId = connection.caller.userId;
                sqlParams.templateId = templateId;
                async.parallel({
                    user: function (cbx) {
                        //Get user details
                        api.dataAccess.executeQuery('get_user', sqlParams, dbConnectionMap, cbx);
                    },
                    docuEnvelope: function (cbx) {
                        //Get envelope details
                        api.dataAccess.executeQuery('get_docusign_envelope', sqlParams, dbConnectionMap, cbx);
                    }
                }, cb);
            }, function (data, cb) {
                user = data.user[0];
                if (data.docuEnvelope.length === 0) {
                    var url, reqParams, textTabs = [], x;

                    //Set the default tab values if provided
                    for (x = 0; x < tabs.length; x = x + 1) {
                        textTabs.push({
                            tabLabel: tabs[x][0],
                            value: tabs[x][1]
                        });
                    }

                    //Prepare the POST parameters
                    reqParams = {
                        templateId: templateId,
                        status: 'sent',
                        enableWetSign: false,
                        templateRoles: [{
                            name: user.first_name + " " + user.last_name,
                            email: user.email,
                            roleName: api.config.docusign.roleName,
                            clientUserId: api.config.docusign.clientUserId,
                            tabs: {
                                textTabs: textTabs
                            }
                        }]
                    };

                    //Request Signature via template
                    url  = baseURL + "/envelopes";
                    options = initializeRequest(api, url, 'POST', JSON.stringify(reqParams));
                    request(options, function (err, res, body) {
                        var resp = JSON.parse(body);
                        if (err || (res.statusCode !== 200 && res.statusCode !== 201)) {
                            //This is client's fault that they sent in a wrong template id
                            if (resp && resp.errorCode && resp.errorCode === 'TEMPLATE_ID_INVALID') {
                                cb(new NotFoundError("Template with given id was not found."));
                                return;
                            }
                            //In case of some other error, we log error but we only show generic message to end user
                            if (resp && resp.message) {
                                api.log(resp.message, 'error');
                            }
                            cb({message: "Requesting Signature via template failed."});
                            return;
                        }

                        //persist the new envelope to database
                        sqlParams.envelopeId = resp.envelopeId;
                        sqlParams.complete = 0;
                        api.dataAccess.executeQuery(
                            'insert_docusign_envelope', sqlParams, dbConnectionMap, function (err) {
                                if (err) {
                                    cb(err);
                                    return;
                                }
                                cb(null, resp.envelopeId);
                            });
                    });
                } else {
                    //The envelope already exists
                    cb(null, data.docuEnvelope[0].docusign_envelope_id);
                }
            }, function (evpId, cb) {
                envelopeId = evpId;
                var url, returnURL, reqParams;

                //Create the return url
                returnURL = _.template(api.config.docusign.returnURL)({envelopeId: envelopeId});

                //Request recipient view
                url = baseURL + "/envelopes/" + envelopeId + "/views/recipient";
                reqParams = {
                    clientUserId: api.config.docusign.clientUserId,
                    email: user.email,
                    returnUrl: returnURL,
                    userName: user.first_name + " " + user.last_name,
                    authenticationMethod: 'none'
                };
                options = initializeRequest(api, url, 'POST', JSON.stringify(reqParams));
                request(options, function (err, res, body) {
                    var resp = JSON.parse(body);
                    if (err || (res.statusCode !== 200 && res.statusCode !== 201)) {
                        //In case of system integration failure, we log error, but we only show generic message to user
                        if (resp && resp.message) {
                            api.log(resp.message, 'error');
                        }
                        cb({message: "Requesting recipient view failed."});
                        return;
                    }
                    recipientViewUrl = resp.url;
                    cb();
                });
            }
        ], function (err) {
            if (err) {
                helper.handleError(api, connection, err);
            } else {
                connection.response = {
                    recipientViewUrl: recipientViewUrl,
                    envelopeId: envelopeId
                };
            }
            next(connection, true);
        });
    }
};
