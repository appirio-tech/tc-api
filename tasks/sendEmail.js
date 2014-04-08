/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.1
 * Author: TCSASSEMBLER, ecnu_haozi, TCSASSEMBLER
 * changes in 1.1
 * - Remove the required fields check to make this email-sending logic more general and flexible.
 * changes in 1.2
 * - The From address can now be passed in params and if not present falls back to the configureation value 
 */
"use strict";

/**
 * Dependency 
 */
var nodemailer = require('nodemailer'),
    path = require('path'),
    templatesDir = path.join(__dirname, '../' + process.env.TC_EMAIL_TEMPLATE_DIR),
    emailTemplates = require('email-templates'),
    _ = require("underscore");

/// environment variables
var tc_email_account = process.env.TC_EMAIL_ACCOUNT,
    tc_email_password = process.env.TC_EMAIL_PASSWORD,
    tc_email_from = process.env.TC_EMAIL_FROM,
    tc_email_secured = process.env.TC_EMAIL_SECURED,
    tc_email_host = process.env.TC_EMAIL_HOST,
    tc_email_host_port = process.env.TC_EMAIL_HOST_PORT;
if (!_.isBoolean(tc_email_secured)) {
    tc_email_secured = !_.isString(tc_email_secured) || tc_email_secured.toLowerCase() !== "false";
}

/**
 * Task - used to send a verification email 
 */
var sendEmail = {
    name: 'sendEmail',
    description: 'I will send Email',
    scope: 'any',
    frequency: 0,
    queue: 'default',
    /**
     * Main function of addLdapEntry tasks
     *
     * @param {Object} api - object used to access infrastructure
     * @param {Object} params require fields such as subject, template, toAddress, senderName, url, userHandle
     * @param {Function} next - callback function
     */
    run: function (api, params, next) {
        api.log('Enter sendEmail task#run', 'info');
        var index, transport, message, err;

        // build email from templates
        emailTemplates(templatesDir, function (err, template) {
            if (err) { // fail to read templates directory
                api.log("task sendEmail: failed to get templates directory " + templatesDir + " : " + err + " " + (err.stack || ''), "error");
                return;
            }

            // build email from given template
            template(params.template, params, function (err, html, text) {
                if (err) { // unable to locate the assigned template
                    api.log('task sendEmail: failed to get template: ' + err + " " + (err.stack || ''), 'error');
                    return;
                }

                // create transport for email
                var smtpConfig = {
                    host: tc_email_host,
                    port: tc_email_host_port,
                    secureConnection: tc_email_secured,
                    requiresAuth: false
                };
                if (_.isString(tc_email_account) && tc_email_account.length > 0) {
                    smtpConfig.requiresAuth = true;
                    smtpConfig.auth = {
                        user: tc_email_account,
                        pass: tc_email_password
                    };
                }
                transport = nodemailer.createTransport("SMTP", smtpConfig);

                // build email message
                message = {
                    from: params.fromAddress || tc_email_from,
                    to: params.toAddress,
                    subject: params.subject,
                    html: html,
                    text: text
                };

                // send email
                transport.sendMail(message, function (err) {
                    if (err) { // unable to send email
                        api.log('task sendEmail: cannot send email ' + err + " " + (err.stack || ''), 'error');
                        return;
                    }
                    api.log('task sendEmail: email sent', 'info');
                    // close transport in the end.
                    transport.close();
                });
            });
        });
        api.log('Leave sendEmail task', 'info');
        return next(null, true);
    }
};

/////////////////////////////////////////////////////////////////////
// exports
exports.task = sendEmail;

