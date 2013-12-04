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
tc_email_secured = typeof(tc_email_secured) != 'string' || tc_email_secured.toLowerCase() != "true";
    
/**
 * This function is used to check the existence of 
 * given paramters and ensure it not be empty
 * 
 * @param {Object} params - a object of paramters
 * @param {String} name - the name of the to-be-checked parameter
 * @param {Boolean} true if params contains the given paramter 
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
     * @param {Object} api - object used to access infrustrature
     * @param {Object} params require fields: subject, activationCode, 
     *                          template, toAddress, fromAddress,
     *                          senderName, url,
     *                          errorHandler(err) for error handle
     * @param {Function} next - callback function
     */
    run: function (api, params, next) {
        api.log('[task @ sendActivationEmail] Enter sendActivationEmail task', 'info');
        var index, transport, locals, message, requiredParams = ['subject', 'activationCode',
            'template', 'toAddress', 'fromAddress', 'senderName', 'url'];

        // validation parameter
        if ((!params.hasOwnProperty('errorHandler')) || (typeof params.errorHandler !== 'function')) {
            api.log('[task warning @ addLdapEntry] No error handler assigned', 'warning');
            params.errorHandler = function (err) { console.log(err); };
        }

        for (index = 0; index < requiredParams.length; index += 1) {
            if (!checkParameter(params, requiredParams[index])) {
                api.log('[ task err @ sendActivationEmail] parameter <' +
                    requiredParams[index] + '> missing', 'error');
                params.errorHandler({ message: 'required parameter <' + requiredParams[index] + '> missing' });
                return next(null, true);
            }
        }

        // build email from templates
        emailTemplates(templatesDir, function (err, template) {
            if (err) { // fail to read templates directory
                api.log('[ task err @ sendActivationEmail] failed to get templates directory',
                    'error', {err: JSON.stringify(err), dir: templatesDir});
                params.errorHandler(err);
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
                    api.log('[ task err @ sendActivationEmail] failed to get template',
                        'error', {err: JSON.stringify(err)});
                    params.errorHandler(err);
                    return;
                }

                // create transport for activation email
                transport = nodemailer.createTransport("SMTP", {
                    host: tc_email_host,
                    port: tc_email_host_port,
                    secureConnection: tc_email_secured,
                    requiresAuth: true,
                    auth: {
                        user: tc_email_account,
                        pass: tc_email_password
                    }
                });

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
                        api.log('[ task err @ sendActivationEmail] cannot send email', 'error', {
                            err: JSON.stringify(err)
                        });
                        params.errorHandler(err);
                        return;
                    }
                    api.log('[ task @ sendActivationEmail] activation email sent', 'info');
                    // close transport in the end.
                    transport.close();
                });
            });
        });
        api.log('[task @ sendActivationEmail] Leave sendActivationEmail task', 'info');
        return next(null, true);
    }
};

/////////////////////////////////////////////////////////////////////
// exports
exports.task = sendActivationEmail;

