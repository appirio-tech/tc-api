/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author isv
 */
"use strict";

var usv = require("../common/unifiedSubmissionValidator");
var async = require('async');

/**
 * The api method for testing the unifiedSubmissionValidator.js#getFileType method.
 */
exports.usvGetFileType = {
    name: 'usvGetFileType',
    description: 'usvGetFileType',
    inputs: {
        required: ['fileName'],
        optional: []
    },
    cacheEnabled: true,
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["tcs_catalog"],
    run: function (api, connection, next) {
        api.log("Execute getFileType#run", 'debug');
        var unifiedSubmissionValidator = usv.getUnifiedSubmissionValidator(api, connection.dbConnectionMap);

        async.waterfall([
            function (cb) {
                unifiedSubmissionValidator.getFileType(connection.params.fileName, cb);
            }
        ], function (err, fileType) {
            if (err) {
                api.helper.handleError(api, connection, err);
            } else {
                connection.response = {fileType: fileType};
            }
            next(connection, true);
        });
    }
};

/**
 * The api method for testing the unifiedSubmissionValidator.js#getBundledFileParser method.
 */
exports.usvGetBundledFileParser = {
    name: 'usvGetBundledFileParser',
    description: 'usvGetBundledFileParser',
    inputs: {
        required: ['filePath'],
        optional: []
    },
    cacheEnabled: true,
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["tcs_catalog"],
    run: function (api, connection, next) {
        api.log("Execute getBundledFileParser#run", 'debug');
        var unifiedSubmissionValidator = usv.getUnifiedSubmissionValidator(api, connection.dbConnectionMap);

        async.waterfall([
            function (cb) {
                unifiedSubmissionValidator.getBundledFileParser(connection.params.filePath, cb);
            }
        ], function (err, fileParser) {
            if (err) {
                api.helper.handleError(api, connection, err);
            } else {
                connection.response = {fileParser: fileParser};
            }
            next(connection, true);
        });
    }
};

/**
 * The api method for testing the unifiedSubmissionValidator.js#validate method.
 */
exports.usvValidate = {
    name: 'usvValidate',
    description: 'usvValidate',
    inputs: {
        required: ['filePath'],
        optional: []
    },
    cacheEnabled: true,
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["tcs_catalog"],
    run: function (api, connection, next) {
        api.log("Execute usvValidate#run", 'debug');
        var unifiedSubmissionValidator = usv.getUnifiedSubmissionValidator(api, connection.dbConnectionMap);

        async.waterfall([
            function (cb) {
                unifiedSubmissionValidator.validate(connection.params.filePath, cb);
            }
        ], function (err, result) {
            if (err) {
                api.helper.handleError(api, connection, err);
            } else {
                connection.response = {validationResult: result};
            }
            next(connection, true);
        });
    }
};

/**
 * The api method for testing the unifiedSubmissionValidator.js#ZipFileAnalyzer#getFiles method.
 */
exports.usvGetFiles = {
    name: 'usvGetFiles',
    description: 'usvGetFiles',
    inputs: {
        required: ['filePath'],
        optional: []
    },
    cacheEnabled: true,
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["tcs_catalog"],
    run: function (api, connection, next) {
        api.log("Execute usvGetFiles#run", 'debug');
        var unifiedSubmissionValidator = usv.getUnifiedSubmissionValidator(api, connection.dbConnectionMap),
            files;

        async.waterfall([
            function (cb) {
                unifiedSubmissionValidator.getBundledFileParser(connection.params.filePath, cb);
            }, function (fileParser, cb) {
                files = fileParser.getFiles(connection.params.filePath);
                cb(null, files);
            }
        ], function (err, files) {
            if (err) {
                api.helper.handleError(api, connection, err);
            } else {
                connection.response = {files: files};
            }
            next(connection, true);
        });
    }
};
