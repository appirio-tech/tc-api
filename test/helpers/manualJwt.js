/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author TCSASSEMBLER
 * changes in 1.1:
 * - add option to generate token for admin and user
 */
"use strict";

var jwt = require('jsonwebtoken');
var CLIENT_ID = require('../../config').config.general.oauthClientId;
var SECRET = require('../../config').config.general.oauthClientSecret;
var sub = process.argv[2], token;

if (!sub) {
    console.log('Please provide *sub* parameter.');
    console.log('Example usage: node test/helpers/manualJwt "facebook|1234567"');
    console.log('To generate admin jwt type: node test/helpers/manualJwt admin');
    console.log('To generate user jwt type: node test/helpers/manualJwt user');
    process.exit(0);
}

if (process.argv[2] === "admin") {
    sub = "ad|132456"; //heffan
} else if (process.argv[2] === "user") {
    sub = "ad|132458"; //user
}

token = jwt.sign({sub: sub}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});

console.log(token);