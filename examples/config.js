/*jslint nomen: true*/
/*global module*/
/*jslint nomen: false*/

/*
 * Copyright (C) 2012 - 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */

var config = {
    clientID: "0af315c5",
    clientSecret: "766a21fe4c8e6d2e332983471ace9902",
    callbackURL: "http://ubuntu1:3000/topcoderoauth/callback",   // replace with your host name
    apiHost: "api.topcoder.com",
    scope: ["FORUMS_REST", "CONTEST_REST"]
};

module.exports = config;
