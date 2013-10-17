/*
 * Copyright (C) 2012 - 2013 TopCoder Inc., All Rights Reserved.
 *
 * PoC Assembly - TopCoder NodeJS Contests REST API - Part 2
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 * @since Proof Of Concept - TopCoder REST API NodeJS with OAuth Integration v1.0
 * Integrated OAuth.
 */

/*jslint nomen: true*/
/*global __dirname, require, console*/
/*jslint nomen: false*/

"use strict";

// Load express, ContestsHTTPController and ContestsCategoriesController
var Express = require('express');
var ContestsHTTPController = require('./controllers/contestsHTTPController');

var passport = require('passport');
var TopcoderStrategy = require('passport-topcoder').Strategy;
var passportTopcoderStrategyName = 'topcoder';

var config = require('./config');

// Create express and contestsHTTPController instances
var app = new Express();

app.configure('development', function () {
    app.use(Express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.use(Express.bodyParser());
});

// This is necessary for now because we can now call crud.html at: http://localhost:8080/crud.html
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

/**Authentication middleware.
 * Checks whether the request has proper oauth headers
 * @param req The express request object
 * @param res The express response object.
 * @param next The callback to be invoked.
 **/
var isAuthenticated = function (req, res, next) {
    var authHeader = req.header('Authorization'), http, requestOptions;
    if (!authHeader || authHeader.trim().length === 0) {
        res.status(403);
        res.send("Authentication Header is missing");
    } else {
	    authHeader = authHeader.split(" ")[1];
        http = require('http');
        requestOptions = {
            hostname: config.apiHost,
            path: '/oauth/oauth/validate',
            headers: {
                Authorization: req.header('Authorization')
            }
        };
        console.log("Options: " + JSON.stringify(requestOptions));
        http.request(requestOptions, function (httpResponse) {
            httpResponse.setEncoding('utf8');
            var responseXML = '';
            httpResponse.on("data", function (chunk) {
                responseXML += chunk;
            });

            httpResponse.on("end", function () {
                var parseString = require('xml2js').parseString, tokenScopes, i;
                parseString(responseXML, function (err, result) {
                    if (err) {
                        res.status(500);
                        res.send("OAuth server returned invalid xml: " + responseXML);
					} else if (!result) {
						res.status(500);
						res.send("OAuth server returned null. Check that your access token is correct and valid.");
                    } else {
                        console.dir(JSON.stringify(result));
                        if (result.accessTokenValidation && result.accessTokenValidation.tokenScopes) {
                            if (result.accessTokenValidation.tokenScopes.length) {
                                tokenScopes = result.accessTokenValidation.tokenScopes;
                                for (i = 0; i < tokenScopes.length; i++) {
                                    if (tokenScopes[i].permission.indexOf("CONTEST_REST") !== -1) {
                                        next();
                                        return;
                                    }
                                }
                                res.status(403);
                                res.send("Not authorized");
                            }
                        }
                    }
                });
            });
        }).end();
    }
};


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


var controller = new ContestsHTTPController();



//route to get contest types that DOES require oauth authentication
app.get('/v2/contesttypes', controller.getContestTypes);


// for all other routes, require authentication
app.all("*", isAuthenticated);

//route to get contest types that DOES require oauth authentication
app.get('/v2/secure/contesttypes', controller.getContestTypes);


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

 


// Listen on 8080
var port = process.env.PORT || 8080;
app.listen(port);

console.log('Listening on port ' + port + ' and Ctrl+C to exit...');
