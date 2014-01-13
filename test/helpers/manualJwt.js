/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCSASSEMBLER
 */
"use strict";

var jwt = require('jsonwebtoken');
var CLIENT_ID = require('../../config').configData.general.oauthClientId;
var SECRET = require('../../config').configData.general.oauthClientSecret;
var sub = process.argv[2], token;

if (!sub) {
    console.log('Please provide *sub* parameter.');
    console.log('Example usage: node test/helpers/manualJwt "facebook|1234567"');
    process.exit(0);
}

token = jwt.sign({sub: sub}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});

console.log(token);