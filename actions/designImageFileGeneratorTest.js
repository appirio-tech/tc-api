/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author isv
 */
"use strict";

var difg = require("../common/designImageFileGenerator");
var async = require('async');

/**
 * The api method for testing the designImageFileGenerator.js#generateFiles method.
 */
exports.generateFiles = {
    name: 'generateFiles',
    description: 'generateFiles',
    inputs: {
        required: ['submissionFile'],
        optional: []
    },
    cacheEnabled: false,
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["tcs_catalog", "informixoltp"],
    run: function (api, connection, next) {
        api.log("Execute generateFiles#run", 'debug');

        var challenge = {challengeId: 8007001, challengeCategoryId: 17},
            submitter = {userId: 8007022, handle: 'marcg8007022'},
            submission = {submissionId: 8007001, images: []},
            submissionFile = connection.params.submissionFile,
            designImageFileGenerator = difg.getDesignImageFileGenerator(challenge, submitter, submission,
                submissionFile, api, connection.dbConnectionMap);

        async.waterfall([
            function (cb) {
                designImageFileGenerator.generateFiles(cb);
            }
        ], function (err) {
            if (err) {
                api.helper.handleError(api, connection, err);
            } else {
                connection.response = {success: 'ok'};
            }
            next(connection, true);
        });
    }
};
