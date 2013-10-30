/*jslint nomen: true*/
/*global require, exports, module, Buffer*/
/*jslint nomen: false*/
/**
 * Module dependencies.
 */
"use strict";
var util = require('util'),
    OAuthStrategy = require('passport-oauth').OAuth2Strategy,
    InternalOAuthError = require('passport-oauth').InternalOAuthError,
    Consts = require('./const.js');


/**
 * `Strategy` constructor.
 *
 * The Topcoder strategy authenticates by delegation to Topcoder using OAuth protocol.
 *
 * Applications must supply a `verify` callback which accepts a `accessToken`,
 * `refreshToken`, 'params' an object containing the response from oauth server and service-specific `profile`, and then calls the `done`
 * callback supplying a `accessTokenDTO`, which should be set to `null` if the
 * credentials are not valid.  If an exception occurred, `err` should be set.
 *
 * Options:
 *   - `clientID`     identifies client to Topcoder
 *   - `clientSecret`  secret used to establish ownership of the consumer key
 *   - `callbackURL`     URL to which Topcoder will redirect the user after obtaining authorization
 *
 * Examples:
 *
 *     passport.use(new TopcoderStrategy({
 *         clientID: '123-456-789',
 *         clientSecret: 'shhh-its-a-secret'
 *         callbackURL: 'http://api.topcoder.com/topcoderoauth/callback'
 *       },
 *       function(accessToken, refreshToken, params, profile, done) {
 *          var tokenDTO = {
              accessToken: accessToken,
              expirationTime : params.expires_in,
              scope : params.scope.split(" ")
          };
          return done(null, tokenDTO);
 *       }
 *     ));
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function Strategy(options, verify) {
    options = options || {};
    options.tokenURL = options.tokenURL || Consts.OAUTH_ENDPOINT+'/oauth/oauth/token';
    options.authorizationURL = options.authorizationURL || Consts.OAUTH_ENDPOINT+'/oauth/tc/authorize';

    // Sets custom headers required.
    options.customHeaders = options.customHeaders || {};
    var key = (options.clientID + ":" + options.clientSecret);
    options.customHeaders.Authorization = "Basic " + new Buffer(key).toString('base64');

    options.skipUserProfile = (options.skipUserProfile === false) ? false : true;

    OAuthStrategy.call(this, options, verify);
    this.name = 'Topcoder';
}

/**
 * Inherit from `OAuthStrategy`.
 */
util.inherits(Strategy, OAuthStrategy);


/**
 * Authenticate request by delegating to Topcoder using OAuth.
 *
 * @param {Object} req
 * @api private
 */
Strategy.prototype.authenticate = function (req, options) {
    // When a user denies authorization on Topcoder, they are presented with a link
    // to return to the application in the following format (where xxx is the
    // value of the request token):
    //
    //     http://api.topcoder.com/topcoderoauth/callback?denied=xxx
    //
    // Following the link back to the application is interpreted as an
    // authentication failure.
    if (req.query && req.query.denied) {
        return this.fail();
    }

    // Call the base class for standard OAuth authentication.
    OAuthStrategy.prototype.authenticate.call(this, req, options);
};


/**
 * Expose `Strategy`.
 */
module.exports = Strategy;