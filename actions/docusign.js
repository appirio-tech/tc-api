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
    templateId: config.docusign.assignmentTemplateId,
    handlers: [
        new TermsOfUseHandler(config.docusign.assignmentDocTermsOfUseId)
    ]
}, {
    name: 'Appirio Mutual NDA',
    templateId: config.docusign.mutualNDATemplateId,
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
exports.action = {
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
