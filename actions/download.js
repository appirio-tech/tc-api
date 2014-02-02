/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author Sky_
 */
"use strict";
var async = require('async');
var _ = require('underscore');
var fs = require('fs');
var Mime = require('mime');
var path = require('path');
var NotFoundError = require('../errors/NotFoundError');
var BadRequestError = require('../errors/BadRequestError');
var ForbiddenError = require('../errors/ForbiddenError');
var UnauthorizedError = require('../errors/UnauthorizedError');


/**
 * The API for downloading documents
 */
exports.action = {
    name: "downloadDocument",
    description: "downloadDocument",
    inputs: {
        required: ["docId", "challengeId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    cacheEnabled: false,
    databases: ["tcs_catalog"],
    run: function (api, connection, next) {
        api.log("Execute downloadDocument#run", 'debug');
        var helper = api.helper,
            docId = Number(connection.params.docId),
            challengeId = Number(connection.params.challengeId),
            dbConnectionMap = connection.dbConnectionMap,
            filePath;
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }

        async.waterfall([
            function (cb) {
                if (connection.caller.accessLevel === "anon") {
                    cb(new UnauthorizedError());
                    return;
                }
                var error = helper.checkPositiveInteger(docId, "docId") ||
                    helper.checkPositiveInteger(challengeId, "challengeId") ||
                    helper.checkMaxInt(docId, "docId") ||
                    helper.checkMaxInt(challengeId, "challengeId");
                cb(error);
            }, function (cb) {
                var params = {
                    docid: docId,
                    uid: connection.caller.userId
                };
                api.dataAccess.executeQuery("get_document", params, dbConnectionMap, cb);
            }, function (result, cb) {
                if (result.length === 0) {
                    cb(new NotFoundError("Document not found"));
                    return;
                }
                var document = result[0];
                if (document.project_id !== challengeId) {
                    cb(new BadRequestError("Document does not belong to project with given challengeId"));
                    return;
                }
                if (document.can_download !== 1 && connection.caller.accessLevel !== "admin") {
                    cb(new ForbiddenError("You don't have permission to access this document"));
                    return;
                }
                filePath = path.join(api.configData.general.downloadsRootDirectory, document.url);
                fs.stat(filePath, cb);
            }, function (stat, cb) {
                var mime = Mime.lookup(filePath),
                    response = connection.rawConnection.res,
                    fileName = path.basename(filePath),
                    stream;
                response.writeHead(200, {
                    'Content-Type': mime,
                    'Content-Length': stat.size,
                    'Content-Disposition': 'attachment; filename=' + fileName //there shouldn't be extra quotes
                });
                stream = fs.createReadStream(filePath);
                stream.on("end", cb);
                stream.on("error", cb);
                stream.pipe(response);
            }
        ], function (err) {
            if (err) {
                helper.handleError(api, connection, err);
                next(connection, true);
            } else {
                next(connection, false); //false = response has been set
            }
        });
    }
};