/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";
/*jslint unparam: true */

var _ = require("underscore");
var async = require("async");
var S = require("string");
var config = require("../config").config;
var request = require('request');

var NotFoundError = require('../errors/NotFoundError');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var UnauthorizedError = require('../errors/UnauthorizedError');

/**
 * The TermsOfUse Handler
 * Note that just like the Java code, it can be reused for different templates and termsOfUseId
 * The contrcutor takes the termsOfUseId during initialization
 */
function TermsOfUseHandler(termsOfUseId) {
    this.termsOfUseId = termsOfUseId;
}
TermsOfUseHandler.prototype.termsOfUseId = 0;
/**
 * The function that actually handles the document
 * All future document handlers must also follow the same method signature as used here (akin to a Java interface)
 * @param userId The user for which to handle the document
 * @param tabs Arrays of objects which have tabLabel and tabValue parameters. 
 * This is actually not used here but is needed because the method signature needs to consistent for all document handlers
 * @param api The actionhero api object
 * @param dbConnectionMap The DB connection map
 * @param done The callback to call once done. It will be called with argument if there is error, otherwise will be called without argument.
 * The argument must have a message property. If the error is temporary, then it should also have a temporary property set to true.
 */
TermsOfUseHandler.prototype.handleDocument = function (userId, tabs, api, dbConnectionMap, done) {
    var sqlParams = {
        termsOfUseId: this.termsOfUseId,
        userId: userId
    };
    async.waterfall([
        function (cb) {
            api.dataAccess.executeQuery("get_terms_of_use", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length === 0) {
                done({
                    message: "No terms of use exists for id: " + sqlParams.termsOfUseId,
                });
                return;
            }
            api.dataAccess.executeQuery("check_user_terms_of_use_ban", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length !== 0) {
                api.log("User with id: " + userId + " is not allowed to accept terms of use with id: " + sqlParams.termsOfUseId, 'error');
                done();
                return;
            }
            api.dataAccess.executeQuery("check_user_terms_of_use_exist", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            if (rows.length !== 0) {
                api.log("User with id: " + userId + " has already accepted terms of use with id: " + sqlParams.termsOfUseId, 'warn');
                done();
                return;
            }
            api.dataAccess.executeQuery("insert_user_terms_of_use", sqlParams, dbConnectionMap, cb);
        }, function (notUsed, cb) {
            cb();
        }
    ], function (err) {
        if (err) {
            //If we have an error here, it is because of unexpected error (like DB connection died)
            //So this needs to be considered a temporary failure, so that Docusign Connect can call us again later
            done({
                message: "Unable to process terms of use. Try again later.",
                temporary: true
            });
        } else {
            done();
        }
    });
};


/**
 * Contains the template name, id and the handlers for the template
 * Note that there can be more than 1 handlers per template
 * Handlers that are not required for this contest are left empty
 */
var templates = [{
    name: 'W9',
    templateId: config.docusign.w9TemplateId,
    handlers: []
}, {
    name: 'W-8BEN',
    templateId: config.docusign.w8benTemplateId,
    handlers: []
}, {
    name: 'TopCoder Assignment v2.0',
    templateId: config.docusign.assignmentV2TemplateId,
    handlers: [
        new TermsOfUseHandler(config.docusign.assignmentDocTermsOfUseId)
    ]
}, {
    name: 'Appirio Mutual NDA',
    templateId: config.docusign.appirioMutualNDATemplateId,
    handlers: []
}, {
    name: 'Affidavit',
    templateId: config.docusign.affidavitTemplateId,
    handlers: []
}];

/**
 * Convenience function that writes the response and calls the actionhero next 
 * @param connection actionhero connection
 * @param statusCode the status code to write
 * @param next The actionhero next callback
 * @param message If exists then this message is set to body, otherwise body is simply 'success'
 */
function writeResponse(connection, statusCode, next, message) {
    connection.rawConnection.responseHttpCode = statusCode;
    connection.response = {
        message: message || 'success'
    };
    next(connection, true);
}

/** 
 * The error to throw if connect key is missing or invalid
 */
var CONNECT_KEY_MISSING = 'Connect Key is missing or invalid.';

/** 
 * The Docusign Callback Action which accepts JSON. 
 * Performs the logic common to all Docusign documents.
 */
exports.docusignCallback = {
    name: 'docusignCallback',
    description: 'docusignCallback',
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'write',
    cacheEnabled : false,
    databases : ["informixoltp", "common_oltp"],
    inputs: {
        required: ['envelopeStatus', 'envelopeId', 'tabs', 'connectKey'],
        optional: [],
    },
    run: function (api, connection, next) {
        api.log("Execute docusignCallback#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            envelopeStatus = connection.params.envelopeStatus,
            envelopeId = connection.params.envelopeId,
            connectKey = connection.params.connectKey,
            tabs = connection.params.tabs,
            sqlParams = {},
            envelopeInfo;

        async.waterfall([
            function (cb) {
                if (connectKey !== config.docusign.callbackConnectKey) {
                    api.log(CONNECT_KEY_MISSING, 'error');
                    writeResponse(connection, 404, next, CONNECT_KEY_MISSING);
                    return;
                }

                if (envelopeStatus !== 'Completed') {
                    api.log('Status is not completed.', 'info');
                    writeResponse(connection, 200, next);
                    return;
                }

                if (new S(envelopeId).isEmpty()) {
                    api.log('envelopeId is null or empty', 'error');
                    writeResponse(connection, 200, next);
                    return;
                }

                //Set completed = 1 for the envelope id
                sqlParams.envelopeId = envelopeId;
                api.dataAccess.executeQuery("complete_docusign_envelope", sqlParams, dbConnectionMap, cb);
            }, function (updatedCount, cb) {
                //updatedCount is the number of rows that were updated.
                if (updatedCount === 1) {
                    //Get the docusign data (we need the templateId) for the envelope
                    api.dataAccess.executeQuery("get_docusign_envelope_by_envelope_id", sqlParams, dbConnectionMap, cb);
                } else {
                    api.log('No enevelope with id: ' + envelopeId + ' was found.', 'error');
                    writeResponse(connection, 200, next);
                    return;
                }
            }, function (rows, cb) {
                envelopeInfo = rows[0];

                //Find the template for the envelope
                var template = _.findWhere(templates, {templateId: envelopeInfo.docusign_template_id});
                if (template === undefined) {
                    api.log('No Template was found for template id: ' + envelopeInfo.docusign_template_id, 'warn');
                    writeResponse(connection, 200, next);
                    return;
                }

                //Call the handlers for the template, one after the other
                async.eachSeries(template.handlers, function (handler, cbx) {
                    handler.handleDocument(envelopeInfo.user_id, tabs, api, dbConnectionMap, cbx);
                }, function (err) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    cb();
                });
            }
        ], function (err) {
            if (err) {
                //All errors need to be communicated to the support staff
                api.tasks.enqueue("sendEmail", {
                    subject : config.docusign.callbackFailedEmailSubject,
                    template : 'docusign_callback_failure_email',
                    toAddress : config.docusign.supportEmailAddress,
                    fromAddress : config.docusign.fromEmailAddress,
                    userId : envelopeInfo.user_id,
                    templateId: envelopeInfo.docusign_template_id,
                    envelopeId : envelopeInfo.docusign_envelope_id,
                    message : err.message
                }, 'default');

                //Only temporary errors are to return 500, otherwise 200
                if (err.temporary === true) {
                    writeResponse(connection, 500, next, err.message);
                } else {
                    writeResponse(connection, 200, next, err.message);
                }
            } else {
                writeResponse(connection, 200, next);
            }
        });
    }
};

/**
 * Creates the options object used for making an HTTP request.
 * Sets the HTTP method, url, body and the Docusign Authorization header
 * @param <Object> api The api object from which to read configuration
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
exports.generateDocusignViewURL = {
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
                var x, spl;

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
                options = initializeRequest(api, config.docusign.serverURL + "login_information", 'GET', '');
                request(options, function (err, res, body) {
                    var resp;
                    try {
                        resp = JSON.parse(body);
                    } catch (e) {
                        err = 'Invalid JSON received from server. Most likely the server url is incorrect.';
                    }
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
                        var resp;
                        try {
                            resp = JSON.parse(body);
                        } catch (e) {
                            err = 'Invalid JSON received from server. Most likely the server url is incorrect.';
                        }
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
                        api.dataAccess.executeQuery('insert_docusign_envelope', sqlParams, dbConnectionMap, function (err) {
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
                    var resp;
                    try {
                        resp = JSON.parse(body);
                    } catch (e) {
                        err = 'Invalid JSON received from server. Most likely the server url is incorrect.';
                    }
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
