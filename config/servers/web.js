/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 */
 /**
 * Contains configurations required to handle http requests
 * 
 * Changes in version 1.1 (Module Assembly - Web Arena UI - Contest Management and Problem Assignment v1.0)
 * - Added Access-Control-Allow-Origin and Access-Control-Allow-Headers settings to configuration file
 *
 * @version 1.1
 * @author TCSASSEMBLER
 */
"use strict";

exports.default = {
    servers: {
        web: function (api) {
            return {
                enabled: true,
                // HTTP or HTTPS?
                secure: false,
                // Passed to https.createServer if secure=true. Should contain SSL certificates
                serverOptions: {},
                // Port or Socket Path
                port: process.env.PORT || 8080,
                // Which IP to listen on (use '0.0.0.0' for all; '::' for all on ipv4 and ipv6)
                // Set to `null` when listening to socket
                bindIP: '0.0.0.0',
                // Any additional headers you want actionhero to respond with
                httpHeaders : {
                    'X-Powered-By'                : api.config.general.serverName,
                    'Access-Control-Allow-Origin' : api.config.general.accessControlAllowOrigin,
                    'Access-Control-Allow-Headers': api.config.general.accessControlAllowHeaders

                },
                // Route that actions will be served from; secondary route against this route will be treated as actions,
                //  IE: /api/?action=test == /api/test/
                urlPathForActions : 'api',
                // Route that static files will be served from;
                //  path (relative to your project root) to serve static content from
                urlPathForFiles : 'public',
                // When visiting the root URL, should visitors see 'api' or 'file'?
                //  Visitors can always visit /api and /public as normal
                rootEndpointType : 'api',
                // The header which will be returned for all flat file served from /public; defined in seconds
                flatFileCacheDuration : 60,
                // Settings for determining the id of an http(s) request (browser-fingerprint)
                fingerprintOptions : {
                    cookieKey: 'sessionID',
                    toSetCookie: true,
                    onlyStaticElements: true,
                    settings: 'path=/;'
                },
                // Options to be applied to incoming file uploads.
                //  More options and details at https://github.com/felixge/node-formidable
                formOptions: {
                    uploadDir: '/tmp',
                    keepExtensions: false,
                    maxFieldsSize: 1024 * 1024 * 100
                },
                // Should we pad JSON responses with whitespace to make them more human-readable?
                // set to null to disable
                padding: 2,
                // Options to configure metadata in responses
                metadataOptions: {
                    serverInformation: true,
                    requesterInformation: true
                },
                // When true, returnErrorCodes will modify the response header for http(s) clients if connection.error is not null.
                //  You can also set connection.rawConnection.responseHttpCode to specify a code per request.
                returnErrorCodes: false
                ,
                // http(s).Server#timeout
                timeout: 4 * 60 * 1000
            };
        }
    }
};

exports.production = {
    servers: {
        web: function () {
            return {
                padding: null,
                metadataOptions: {
                    serverInformation: false,
                    requesterInformation: false
                }
            };
        }
    }
};

exports.test = {
    servers: {
        web: function () {
            return {
                secure: false,
                port: 18080,
                matchExtensionMime: true,
                metadataOptions: {
                    serverInformation: true,
                    requesterInformation: true
                }
            };
        }
    }
};
