/*jslint nomen: true*/
/*global module*/
/*jslint nomen: false*/

/*
 * Copyright (C) 2012 - 2013 TopCoder Inc., All Rights Reserved.
 *
 * @since Proof Of Concept - TopCoder REST API NodeJS with OAuth Integration v1.0
 * Contains configuration items used for oauth
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */

var config = {
    clientID: "fbd0b481",
    clientSecret: "2da15d080cccdbc2f717543d1897fdb2",
    callbackURL: "http://localhost:8080/topcoderoauth/callback",
    apiHost: "api.cloud.topcoder.com",
    scope: ["FORUMS_REST", "CONTEST_REST", "NODE_REST"]
};

module.exports = config;