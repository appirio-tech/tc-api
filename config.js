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
    clientID: "a6d12f56",
    clientSecret: "b4f8b6080da88e76f902ad8bd9fc9c56",
    callbackURL: "http://192.241.132.180:8080/topcoderoauth/callback",
    apiHost: "107.21.158.122",
    scope: ["FORUMS_REST", "CONTEST_REST"]
};

module.exports = config;
