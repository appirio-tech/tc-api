/*jslint nomen: true*/
/*global __dirname, require, console*/
/*jslint nomen: false*/

/*
 * Copyright (C) 2012 - 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: TCSASSEMBLER, vangavroche
 */

"use strict";

// Load express
var Express = require('express');

var passport = require('passport');
var TopcoderStrategy = require('passport-topcoder').Strategy;
var passportTopcoderStrategyName = 'topcoder';

var config = require('./config');
// Create express instance
var app = new Express();

app.configure('development', function () {
    app.use(Express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(Express.bodyParser());
});

/*jslint nomen: true*/
app.use(Express["static"](__dirname + '/static'));
/*jslint nomen: false*/

// config session
app.use(Express.bodyParser());
app.use(Express.methodOverride());
app.use(Express.cookieParser());
app.use(Express.session({secret: "asecret"}));

app.use(passport.initialize());
app.use(passport.session());
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');


app.use(app.router);

// the status option, or res.statusCode = 404
// are equivalent, however with the option we
// get the "status" local available as well
app.use(function (req, res, next) {
    res.status(404);
    res.render('404', { url: req.url });
});



//current not search database to serialize and deserialize User
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    return done(null, user);
});

passport.use(passportTopcoderStrategyName, new TopcoderStrategy({
    clientID : config.clientID,
    clientSecret : config.clientSecret,
    callbackURL: config.callbackURL
}, function (accessToken, refreshToken, params, profile, done) {
    var tokenDTO = {
        accessToken: accessToken,
        expirationTime : params.expires_in,
        scope : params.scope.split(" ")
    };
    return done(null, tokenDTO);
}));

/** sets passport strategy **/
app.get("/topcoderoauth", function (req, res, next) {
    passport.authenticate(passportTopcoderStrategyName, {scope: config.scope})(req, res, next);
});

// Handles the response from oauth server.
app.get("/topcoderoauth/callback", function (req, res, next) {
    passport.authenticate(passportTopcoderStrategyName, function (err, token) {
        if (req.query.error) {
            res.render("auth-failure", token);
        } else {
            res.render("auth-success", token);
        }
    })(req, res, next);
});

app.get("/client", function (req, res, next) {
    res.render('client', req.session.accessToken);
});

app.post("/callAPI", function (req, res, next){
    var http, options, httpReq; 
    http = require('http');
    options = {
        host : req.body.apiHost,
        port : req.body.apiPort || 8080,
        path : req.body.apiPath,
        method : req.body.apiMethod || 'GET',
        headers : {
            Authorization : 'Bearer ' + req.body.accessToken
        } 
    };
    httpReq = http.request(options, function (httpRes){
        httpRes.setEncoding('utf8');
        httpRes.on('data', function (chunk) {
            res.send(chunk);
        });        
    });
    httpReq.on('error', function (error){
        res.send('Error occurred when calling the API: ' + error);
    });
    
    httpReq.end();
});



// error-handling middleware, take the same form
// as regular middleware, however they require an
// arity of 4, aka the signature (err, req, res, next).
// when connect has an error, it will invoke ONLY error-handling
// middleware.
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        status: err.status || 500,
        error: err
    });
});

 


// Listen on 3000
var port = process.env.PORT || 3000;
app.listen(port);

console.log('Listening on port ' + port + ' and Ctrl+C to exit...');
