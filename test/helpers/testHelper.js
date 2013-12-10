/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";
/*jslint node: true, stupid: true, unparam: true */


var async = require('async');
var fs = require('fs');
var util = require('util');
var _ = require('underscore');

/**
 * The test helper
 */
var helper = {};

/**
 * The Informix bindings
 */
var bindings = require("nodejs-db-informix");

/**
 * Heroku config
 */
var config = require('../../config');

/**
 * create connection for given database
 * @param {String} databaseName - the database name
 * @return {Object} the created connection
 */
function createConnection(databaseName) {
    var dbServerPrefix = config.configData.databaseMapping[databaseName], user, password, hostname, error;
    if (!dbServerPrefix) {
        throw new Error("database server prefix not found for database: " + databaseName);
    }

    user = process.env[dbServerPrefix + "_USER"];
    password = process.env[dbServerPrefix + "_PASSWORD"];
    hostname = process.env[dbServerPrefix + "_NAME"];
    if (!user) {
        error = "variable: '" + dbServerPrefix + "_USER" + "' is null";
    }
    if (!password) {
        error = "variable: '" + dbServerPrefix + "_PASSWORD" + "' is null";
    }
    if (!hostname) {
        error = "variable: '" + dbServerPrefix + "_NAME" + "' is null";
    }
    if (error) {
        throw new Error(error + ". Did you run '. deploy/development.sh'?");
    }
    return new bindings.Informix({
        "user": user,
        "password": password,
        "database": databaseName,
        "hostname": hostname
    });
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
        async.forEach(queries, function (query, cb) {
            connection.query(query, [], cb, {
                async: true,
                cast: true
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
    async.waterfall([
        function (cb) {
            connection.connect(cb);
        }, function (res, cb) {
            connection.query('', [], cb, {
                async: true,
                cast: true
            }).select(query).execute();
        }
    ], function (err, result) {
        connection.disconnect();
        callback(err, result);
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

module.exports = helper;