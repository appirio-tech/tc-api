/*
 * Copyright (C) 2017 TopCoder Inc., All Rights Reserved.
 * 
 * This is the REST server that mocks some services from the V3 API
 * 
 * @author GFalcon
 * @version 1.0
 */
"use strict";

var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();

app.use(bodyParser.json());

/*
 * Log all incoming requests
 */
/*jslint unparam: true*/
app.use(function (req, res, next) {
    console.info('V3 Request: ' + JSON.stringify({
        path: req.path,
        method: req.method,
        headers: req.headers,
        body: req.body
    }, null, '    '));
    next();
});
/*jslint unparam: false*/

/*
 * Return a fake 'authorization token'
 */
/*jslint unparam: true*/
app.post('/v3/authorizations', function (req, res) {
    res.json({
        result: {
            content: {
                token: 'FAKE-TOKEN'
            }
        }
    });
});
/*jslint unparam: false*/

/*
 * Get group members. Makes each group consist of one user 
 * (the user from the sample database whose handle is 'user')
 * except one group (id 3330004) that doesn't have any users at all
 */
app.get('/v3/groups/:groupId/members', function (req, res) {
    /*jslint eqeq: true*/
    if (req.params.groupId != 3330004) {
        /*jslint eqeq: false*/
        res.json({
            result: {
                content: [{
                    memberId: 132458
                }]
            }
        });
    } else {
        res.json({
            result: {
                content: []
            }
        });
    }
});

/*
 * Get all groups the given user belongs to
 * This mock always returns a list consisting of one group
 * (3330003)
 */
/*jslint unparam: true*/
app.get('/v3/groups', function (req, res) {
    res.json({
        result: {
            content: [{
                id: 3330003
            }]
        }
    });
});
/*jslint unparam: false*/

app.listen(8084);
