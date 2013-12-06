/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */
"use strict";

/**
 * Dependency 
 */
var nodemailer = require('nodemailer'),
    path = require('path'),
    templatesDir = path.join(__dirname, '../' + process.env.TC_EMAIL_TEMPLATE_DIR),
    emailTemplates = require('email-templates');

/// environment variables
var tc_email_account = process.env.TC_EMAIL_ACCOUNT,
    tc_email_password = process.env.TC_EMAIL_PASSWORD,
    tc_email_secured = process.env.TC_EMAIL_SECURED,
    tc_email_host = process.env.TC_EMAIL_HOST,
    tc_email_host_port = process.env.TC_EMAIL_HOST_PORT;
if (typeof (tc_email_secured) != 'boolean') {
    tc_email_secured = typeof (tc_email_secured) != 'string' || tc_email_secured.toLowerCase() != "false";
}

/**
 * This function is used to check the existence of 
 * given parameters and ensure it not be empty
 * 
 * @param {Object} params - a object of parameters
 * @param {String} name - the name of the to-be-checked parameter
 * @param {Boolean} true if params contains the given parameter 
 *                      and it is not empty; false otherwise. 
 */
var checkParameter = function (params, name) {
    return params.hasOwnProperty(name) && (params[name].toString().trim().length >= 1);
};


/**
 * Task - used to send a verification email 
 */
var sendActivationEmail = {
    name: 'sendActivationEmail',
    description: 'I will send activation Email',
    scope: 'any',
    frequency: 0,
    /**
     * Main function of addLdapEntry tasks
     *
     * @param {Object} api - object used to access infrastructure
     * @param {Object} params require fields: subject, activationCode, 
     *                          template, toAddress, fromAddress,
     *                          senderName, url
     * @param {Function} next - callback function
     */
    run: function (api, params, next) {
        api.log('Enter sendActivationEmail task#run', 'info');
        var index, transport, locals, message, requiredParams = ['subject', 'activationCode',
            'template', 'toAddress', 'fromAddress', 'senderName', 'url'], err;

        for (index = 0; index < requiredParams.length; index += 1) {
            err = api.helper.checkDefined(params[requiredParams[index]], requiredParams[index]);
            
            if (err) {
                api.log("task sendActivationEmail: error occured: " + err + " " + (err.stack || ''), "error");
                return next(null, true);
            }
        }

        // build email from templates
        emailTemplates(templatesDir, function (err, template) {
            if (err) { // fail to read templates directory
                api.log("task sendActivationEmail: failed to get templates directory " + templatesDir + " : " + err + " " + (err.stack || ''), "error");
                return;
            }

            // local variables in email
            locals = {
                activationCode: params.activationCode,
                url: params.url
            };

            // build email from given template
            template(params.template, locals, function (err, html, text) {
                if (err) { // unable to locate the assigned template
                    api.log('task sendActivationEmail: failed to get template: ' + err + " " + (err.stack || ''), 'error');
                    return;
                }

                // create transport for activation email
                var smtpConfig = {
                    host: tc_email_host,
                    port: tc_email_host_port,
                    secureConnection: tc_email_secured,
                    requiresAuth: false
                };
                if (typeof(tc_email_account) == 'string' && tc_email_account.length > 0) {
                    smtpConfig.requiresAuth = true;
                    smtpConfig.auth = {
                        user: tc_email_account,
                        pass: tc_email_password
                    };
                }
                transport = nodemailer.createTransport("SMTP", smtpConfig);

                // build email message
                message = {
                    from: params.fromAddress,
                    to: params.toAddress,
                    subject: params.subject,
                    html: html,
                    text: text
                };

                // send email
                transport.sendMail(message, function (err) {
                    if (err) { // unable to send email
                        api.log('task sendActivationEmail: cannot send email ' + err + " " + (err.stack || ''), 'error');
                        return;
                    }
                    api.log('task sendActivationEmail: activation email sent', 'info');
                    // close transport in the end.
                    transport.close();
                });
            });
        });
        api.log('Leave sendActivationEmail task', 'info');
        return next(null, true);
    }
};

/////////////////////////////////////////////////////////////////////
// exports
exports.task = sendActivationEmail;

