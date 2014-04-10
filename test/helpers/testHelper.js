﻿/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.5
 * @author Sky_, muzehyun, Ghost_141, OlinaRuan, TCSASSEMBLER
 * changes in 1.1:
 * - add getTrimmedData method
 * changes in 1.2:
 * - add generateAuthHeader method.
 * changes in 1.3:
 * - add getAdminJwt and getMemberJwt
 * changes in 1.4
 * - add updateTextColumn method.
 * Changes in 1.5:
 * - add PASSWORD_HASH_KEY
 */
"use strict";
/*jslint node: true, stupid: true, unparam: true */


var async = require('async');
var fs = require('fs');
var _ = require('underscore');
var assert = require('chai').assert;
var crypto = require("crypto");
var jwt = require('jsonwebtoken');
var ldap = require('ldapjs');

/**
 * The test helper
 */
var helper = {};

/**
 * Heroku config
 */
var configs = require('../../config');
var java = require('java');
var Jdbc = require('informix-wrapper');

/**
 * Default jdbc connection pool configuration. Used when environment variables are not set.
 */
var DEFAULT_MINPOOL = 1;
var DEFAULT_MAXPOOL = 60;
var DEFAULT_MAXSIZE = 0;
var DEFAULT_IDLETIMEOUT = 3600; // 3600s
var DEFAULT_TIMEOUT = 30000; // 30s

/**
 * client id and secret.
 */
var CLIENT_ID = configs.config.general.oauthClientId;
var SECRET = configs.config.general.oauthClientSecret;

/**
 * The configuration for ldap server
 */
helper.ldap_host = process.env.TC_LDAP_HOST;
helper.ldap_host_port = process.env.TC_LDAP_PORT;
helper.ldap_password = process.env.TC_LDAP_PASSWORD;
helper.ldap_host_bind_dn = process.env.TC_BIND_DN;
helper.topcoder_member_base_dn = process.env.TC_LDAP_MEMBER_BASE_DN;

/**
 * The password hash key.
 * @since 1.5
 */
helper.PASSWORD_HASH_KEY = configs.config.general.passwordHashKey || "default";

/**
 * create connection for given database
 * @param {String} databaseName - the database name
 * @return {Object} the created connection
 */
function createConnection(databaseName) {
    var dbServerPrefix = configs.config.databaseMapping[databaseName], user,
        password, hostname, server, port, settings;

    if (!dbServerPrefix) {
        throw new Error("database server prefix not found for database: " + databaseName);
    }

    user =  process.env[dbServerPrefix + "_USER"];
    password = process.env[dbServerPrefix + "_PASSWORD"];
    hostname = process.env[dbServerPrefix + "_HOST"];
    server = process.env[dbServerPrefix + "_NAME"];
    port = process.env[dbServerPrefix + "_PORT"];

    // Initialize the database settings
    settings = {
        "user" : user,
        "host" : hostname,
        "port" : parseInt(port, 10),
        "password" : password,
        "database" : databaseName,
        "server" : server,
        "minpool" : parseInt(process.env.MINPOOL, 10) || DEFAULT_MINPOOL,
        "maxpool" : parseInt(process.env.MAXPOOL, 10) || DEFAULT_MAXPOOL,
        "maxsize" : parseInt(process.env.MAXSIZE, 10) || DEFAULT_MAXSIZE,
        "idleTimeout" : parseInt(process.env.IDLETIMEOUT, 10) || DEFAULT_IDLETIMEOUT,
        "timeout" : parseInt(process.env.TIMEOUT, 10) || DEFAULT_TIMEOUT
    };

    return new Jdbc(settings, null).initialize();
}


/**
 * Run multiple sql queries in given database
 * @param {Array<String>} queries - the array of sql queries
 * @param {String} databaseName - the database name
 * @param {Function<err>} callback - the callback function
 */
helper.runSqlQueries = function (queries, databaseName, callback) {
    var connection = createConnection(databaseName);
    connection.connect(function (error) {
        if (error) {
            callback(error);
            return;
        }
        async.forEachSeries(queries, function (query, cb) {
            // connection.query(query, [], cb, {
            //     async: true,
            //     cast: true
            // }).execute();


            connection.query(query, cb, {
                start: function (q) {
                    return;
                },
                finish: function (f) {
                    return;
                }
            }).execute();
        }, function (err) {
            connection.disconnect();
            callback(err);
        });
    });
};

/**
 * Run single sql query in given database
 * @param {String} query - the query to execute
 * @param {String} databaseName - the database name
 * @param {Function<err>} callback - the callback function
 */
helper.runSqlQuery = function (query, databaseName, callback) {
    helper.runSqlQueries([query], databaseName, callback);
};

/**
 * Run select sql query in given database
 * @param {String} query - the query to execute
 * @param {String} databaseName - the database name
 * @param {Function<err, result>} callback - the callback function
 */
helper.runSqlSelectQuery = function (query, databaseName, callback) {
    var connection = createConnection(databaseName);

    connection.connect(function (err, result) {
        if (err) {
            connection.disconnect();
            callback(err, result);
        } else {
            connection.query("select " + query, function (err, result) {
                if (err) {
                    connection.disconnect();
                }

                callback(err, result);
            },
                {
                    start: function (q) {
                        return;
                    },
                    finish: function (f) {
                        return;
                    }
                }).execute();
        }
    });
};

/**
 * Run to update text column of a table in given database
 * @param {String} query - the query to execute
 * @param {String} databaseName - the database name
 * @param {String} params - parameters
 * @param {Function<err, result>} callback - the callback function
 */
helper.updateTextColumn = function (query, databaseName, params, callback) {
    var connection = createConnection(databaseName);

    connection.connect(function (err, result) {
        if (err) {
            connection.disconnect();
            callback(err, result);
        } else {
            connection.query(query, function (err, result) {
                if (err) {
                    connection.disconnect();
                }
                callback(err, result);
            }, {
                start: function (q) {
                    return;
                },
                finish: function (f) {
                    return;
                }
            }).execute(params);
        }
    });
};

/**
 * Run select sql query in given database from file
 * @param {String} path - the sql file path
 * @param {String} databaseName - the database name
 * @param {Function<err, result>} callback - the callback function
 */
helper.runSqlSelectQueryFromFile = function (path, databaseName, callback) {
    try {
        var sql = fs.readFileSync(path).toString();
        helper.runSqlSelectQuery(sql, databaseName, callback);
    } catch (e) {
        callback(e);
    }
};

/**
 * Run multiple sql files in given database
 * @param {Array<String>} files - the array that contains paths to sql files
 * @param {String} databaseName - the database name
 * @param {Function<err>} callback - the callback function
 */
helper.runSqlFiles = function (files, databaseName, callback) {
    async.mapSeries(files, function (path, cb) {
        try {
            var sql = fs.readFileSync(path).toString();
            cb(null, sql);
        } catch (e) {
            cb(e);
        }
    }, function (err, queries) {
        if (err) {
            callback(err);
        } else {
            helper.runSqlQueries(queries, databaseName, callback);
        }
    });
};


/**
 * Run single sql file in given database
 * @param {String} file - the sql file path to execute
 * @param {String} databaseName - the database name
 * @param {Function<err>} callback - the callback function
 */
helper.runSqlFile = function (file, databaseName, callback) {
    helper.runSqlFiles([file], databaseName, callback);
};

/**
 * Run single sql file in given database
 * @param {String} path - the json path. Must be relative to test directory
 * @param {String} isSelect - true if query is select
 * @param {Function<err, data>} callback - the callback function. Data is returned only if isSelect = true
 */
helper.runSqlFromJSON = function (path, isSelect, callback) {
    if (_.isFunction(isSelect)) {
        callback = isSelect;
        isSelect = false;
    }
    var pack = require('../' + path), files = [], dir = "", split;
    if (_.isArray(pack.sqlfile)) {
        if (isSelect) {
            callback(new Error('select must be single file'));
            return;
        }
        files = pack.sqlfile;
    } else {
        files.push(pack.sqlfile);
    }
    split = path.split('/');
    split.pop();
    dir = "./test/" + split.join('/') + '/';
    files = _.map(files, function (f) {
        return dir + f;
    });
    if (isSelect) {
        helper.runSqlSelectQueryFromFile(files[0], pack.db, callback);
    } else {
        helper.runSqlFiles(files, pack.db, callback);
    }
};

/**
 * Generate absolute paths for file that exists in parts.
 * Paths will have format:
 * - <fileName>.part1.<extension>
 * - <fileName>.part2.<extension>
 * - <fileName>.part3.<extension>
 * @param {String} fileName - the file name
 * @param {String} extension - the file extension. Optional
 * @param {Number} count - the count of parts
 * @return {Array<String>} the generated paths
 */
helper.generatePartPaths = function (fileName, extension, count) {
    var ret = [], i, path;
    extension = extension || "";
    for (i = 1; i <= count; i = i + 1) {
        path = fileName + ".part" + i;
        if (extension.length) {
            path = path + "." + extension;
        }
        ret.push(path);
    }
    return ret;
};

/**
 * Assert response from api to given file.
 * Fields serverInformation and requesterInformation are not compared.
 * @param {Error} err - the error from response
 * @param {Object} res - the response object
 * @param {String} filename - the filename to match. Path must be relative to /test/ directory.
 * @param {Function} done - the callback
 */
helper.assertResponse = function (err, res, filename, done) {
    var expected = require("../" + filename), body;
    assert.ifError(err);
    body = res.body;
    assert.isObject(body, "response body should be object");
    delete body.serverInformation;
    delete body.requesterInformation;
    assert.deepEqual(body, expected, "invalid response");
    done();
};

/**
 * Encrypt the password using the specified key. After being
 * encrypted with a Blowfish key, the encrypted byte array is
 * then encoded with a base 64 encoding, resulting in the String
 * that is returned.
 *
 * @param password The password to encrypt.
 *
 * @param key The base 64 encoded Blowfish key.
 *
 * @return the encrypted and encoded password
 */
helper.encodePassword = function (password, key) {
    var cipher = crypto.createCipheriv("bf-ecb", new Buffer(key, "base64"), ''), result;
    result = cipher.update(password, "utf8", "base64");
    result += cipher.final("base64");
    return result;
};

/**
 * Decrypt the password using the specified key. Takes a password
 * that has been ecrypted and encoded, uses base 64 decoding and
 * Blowfish decryption to return the original string.
 *
 * @param password base64 encoded string.
 *
 * @param key The base 64 encoded Blowfish key.
 *
 * @return the decypted password
 */
helper.decodePassword = function (password, key) {
    var decipher = crypto.createDecipheriv("bf-ecb", new Buffer(key, "base64"), ''), result;
    result = decipher.update(password, "base64", "utf8");
    result += decipher.final("utf8");
    return result;
};

/**
 * Convert text to JSON object and removes serverInformation and requesterInformation
 * @param {String} text - returned text data
 * @return {Object} trimmed object
 */
helper.getTrimmedData = function (text) {
    var ret = JSON.parse(text);
    delete ret.serverInformation;
    delete ret.requesterInformation;
    return ret;
};

/**
 * Generate an auth header
 * @param {Object} data the data to generate
 * @return {String} the generated string
 */
helper.generateAuthHeader = function (data) {
    return "Bearer " + jwt.sign(data || {}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
};

/**
 * Get jwt token for admin
 * @return {String} the header
 */
helper.getAdminJwt = function () {
    return jwt.sign({sub: "ad|132456"}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
};

/**
 * Get jwt token for member
 * @param {String} [userId] the user id to generate
 * @return {String} the jwt token
 */
helper.getMemberJwt = function (userId) {
    return jwt.sign({sub: "ad|" + (userId || "132458")}, SECRET, {expiresInMinutes: 1000, audience: CLIENT_ID});
};

/**
 * Function used to create a client
 * @since 1.5
 */
helper.createClient = function () {
    return ldap.createClient({
        url: 'ldaps://' + helper.ldap_host + ':' + helper.ldap_host_port,
        tlsOptions: {
            rejectUnauthorized: false
        }
    });
};

/**
 * Function used to bind a ldap server
 *
 * @param {Object} client - an object of current client of ldap server
 * @param {Function} callback - a async callback function with prototype like callback(err, results)
 * @since 1.5
 */
helper.bindClient = function (client, callback) {
    client.bind(helper.ldap_host_bind_dn, helper.ldap_password, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null);
        }
    });
};

module.exports = helper;
