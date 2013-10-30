# passport-topcoder


This module lets you authenticate using Topcoder in your Node.js applications.
By plugging into Passport, Topcoder authentication can be easily and
unobtrusively integrated into any application or framework that supports
[Connect](http://www.senchalabs.org/connect/)-style middleware, including
[Express](http://expressjs.com/).

## Install

    $ npm install passport-topcoder

## Usage

#### Configure Strategy

The Topcoder authentication strategy authenticates users using a Topcoder account
and OAuth tokens.  The strategy requires a `verify` callback function, which receives the
access token and corresponding refresh token as arguments, along with a `profile` which
contains the authenticated user's Topcoder profile.   The `verify` callback must
call `done` providing a user to complete authentication.

In order to identify your application to TopCoder, specify the client id,
client secret, and callback URL within `options`.

    passport.use(new TopcoderStrategy({
            clientID: MY_CLIENT_ID,
            clientSecret: MY_CLIENT_SECRET,
            callbackURL: MY_CALLBACK_URL
        },
        function(accessToken, refreshToken, params, profile, done) {
            var tokenDTO = {
                accessToken: accessToken,
                expirationTime : params.expires_in,
                scope : params.scope.split(" ")
            };
        return done(null, tokenDTO);
        }
    ));

#### Authenticate Requests

Use `passport.authenticate()`, specifying the `'Topcoder'` strategy, to
authenticate requests.

For example, as route middleware in an [Express](http://expressjs.com/)
application:

    app.get('/auth/topcoder', passport.authenticate('Topcoder', {scope: ["FORUMS_REST", "CONTEST_REST"]}));
    
    app.get('/auth/topcoder/callback', function (req, res, next) {
      passport.authenticate('Topcoder', function (err, token) {
          if (req.query.error) {
              res.render("login", {error: req.query.error});
          } else {
              res.render("login", {token: token});
          }
      })(req, res, next);
  });

## Examples

For a complete, working example, refer to the [signin example](https://github.com/cloudspokes/passport-topcoder/tree/master/examples/).

## Tests

Coming...

## License

[The MIT License](http://opensource.org/licenses/MIT)


