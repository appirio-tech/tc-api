/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author Sky_, kurtrips
 * Changes:
 * version 1.1 - Added functionality to download dev submission
 */
"use strict";
/*jslint unparam: true */

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
 * Generic message to prevent download in a phase
 */
var NO_DOWNLOAD_IN_PHASE = "You are not allowed to download the submission in this phase.";

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
                filePath = path.join(api.config.general.downloadsRootDirectory, document.url);
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


/**
 * Gets the submission file for the given upload id, and writes it to the response for downloading by client.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function<connection, render>} next The callback to be called after this function is done
 * @since 1.1
 */
var downloadDevSubmission = function (api, connection, dbConnectionMap, next) {

    var helper = api.helper,
        sqlParams = {},
        filePath,
        loggedIn = connection.caller.accessLevel !== "anon",
        submissionId = Number(connection.params.submissionId),
        uploadId,
        noRights = true,
        basicInfo,
        myResourceRoles,
        myResourceIds,
        projectSubmissions;

    async.waterfall([
        function (cb) {

            //Simple validations of the incoming parameters
            var error = helper.checkPositiveInteger(submissionId, 'submissionId') ||
                helper.checkMaxInt(submissionId, 'submissionId');
            if (error) {
                cb(error);
                return;
            }

            sqlParams.submissionId = submissionId;
            sqlParams.userId = (loggedIn ? connection.caller.userId : 0);

            api.dataAccess.executeQuery("download_submission_validations_and_info", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            basicInfo = rows;

            if (basicInfo.length === 0) {
                cb(new NotFoundError('No such upload exists.'));
                return;
            }

            //Check if thurgood request. User need not be logged-in for this but instead thurgood credentials will be present
            if (!_.isUndefined(basicInfo[0].thurgood_language) && !_.isUndefined(basicInfo[0].thurgood_platform) && !loggedIn &&
                    connection.params.username === api.config.thurgoodDownloadUsername &&
                    connection.params.password === api.config.thurgoodDownloadPassword) {
                noRights = false;
            }

            //Now check if the user is logged-in
            if (noRights && !loggedIn) {
                cb(new UnauthorizedError("Authentication details missing or incorrect."));
                return;
            }

            if (!basicInfo[0].is_develop_challenge) {
                cb(new BadRequestError('Non-Develop challenge submissions are not supported by this API.'));
                return;
            }

            if (_.contains([27, 37], basicInfo[0].project_category_id)) {
                cb(new BadRequestError('Marathon Match and Spec Review submissions are not supported by this API.'));
                return;
            }

            //Admins can download all submissions
            if (connection.caller.accessLevel === "admin") {
                noRights = false;
            }

            uploadId = basicInfo[0].upload_id;
            sqlParams.uploadId = uploadId;
            api.dataAccess.executeQuery("download_submission_my_resources", sqlParams, dbConnectionMap, cb);
        }, function (rows, cb) {
            myResourceRoles = _.pluck(rows, 'resource_role_name');
            myResourceIds = _.pluck(rows, 'resource_id');

            var viewAllSubmissionRoles,
                viewScreeningSubmissionsRoles,
                viewScreeningCheckpointSubmissionRoles,
                viewReviewSubmissionRoles,
                viewCheckpointSubmissionRoles,
                viewReviewCheckpointSubmissionRoles,
                isCheckpoint;

            isCheckpoint = (basicInfo[0].submission_type_id === 3);

            //If the current user can view all submissions, then allow download
            viewAllSubmissionRoles = ["Global Manager", "Manager", "Cockpit Project User", "Approver", "Copilot", "Client Manager", "Observer"];
            //Old submissions can be downloaded only by these roles
            if (noRights && basicInfo[0].is_upload_deleted && _.intersection(myResourceRoles, viewAllSubmissionRoles).length === 0) {
                cb(new NotFoundError('This submission has been deleted.'));
                return;
            }
            if (noRights && _.intersection(myResourceRoles, viewAllSubmissionRoles).length > 0) {
                noRights = false;
            }
            //For checkpoint submissions, post mortem reviewer can also view all submissions
            if (noRights && isCheckpoint && _.contains(myResourceRoles, "Post-Mortem Reviewer")) {
                noRights = false;
            }

            //If the submission belongs to current user who is also a submitter, then allow download
            if (noRights && _.contains(myResourceRoles, "Submitter") && _.contains(myResourceIds, basicInfo[0].owner_resource_id)) {
                noRights = false;
            }

            //If screening phase is started or done and the user has one of screener roles, then allow download
            viewScreeningSubmissionsRoles = ["Screener", "Primary Screener"];
            viewScreeningCheckpointSubmissionRoles = ["Checkpoint Screener"];
            if (noRights && !isCheckpoint && _.intersection(myResourceRoles, viewScreeningSubmissionsRoles).length > 0) {
                if (!basicInfo[0].is_at_or_after_screening) {
                    cb(new ForbiddenError(NO_DOWNLOAD_IN_PHASE), true);
                    return;
                }
                noRights = false;
            }
            if (noRights && isCheckpoint && _.intersection(myResourceRoles, viewScreeningCheckpointSubmissionRoles).length > 0) {
                //If there is a checkpoint screening phase AND we have not reached it yet, then do not allow access
                if (!_.isUndefined(basicInfo[0].is_at_or_after_checkpoint_screening) && !basicInfo[0].is_at_or_after_checkpoint_screening) {
                    cb(new ForbiddenError(NO_DOWNLOAD_IN_PHASE), true);
                    return;
                }
                noRights = false;
            }

            //If review phase is started or done and the user has one of reviewer roles, then allow download
            viewReviewSubmissionRoles = ["Observer", "Reviewer", "Accuracy Reviewer", "Failure Reviewer", "Stress Reviewer", "Copilot", "Client Manager"];
            viewCheckpointSubmissionRoles = ["Checkpoint Reviewer", "Global Manager", "Manager", "Cockpit Project User", "Iterative Reviewer"];
            viewReviewCheckpointSubmissionRoles = viewReviewSubmissionRoles.concat(viewCheckpointSubmissionRoles);
            if (noRights && _.intersection(myResourceRoles, viewReviewSubmissionRoles).length > 0) {
                if (!(basicInfo[0].is_at_review || basicInfo[0].is_after_review)) {
                    if (!isCheckpoint) {
                        cb(new ForbiddenError(NO_DOWNLOAD_IN_PHASE), true);
                        return;
                    }
                    //Regular reviewers can view checkpoint submissions only in or after review
                    if (isCheckpoint && _.intersection(myResourceRoles, viewCheckpointSubmissionRoles).length === 0) {
                        cb(new ForbiddenError(NO_DOWNLOAD_IN_PHASE), true);
                        return;
                    }
                }
                noRights = false;
            }
            if (noRights && isCheckpoint && _.intersection(myResourceRoles, viewReviewCheckpointSubmissionRoles).length > 0) {
                //If there is a checkpoint review phase AND we have not reached it yet, then do not allow access
                if (!_.isUndefined(basicInfo[0].is_at_checkpoint_review) && !basicInfo[0].is_at_checkpoint_review && !basicInfo[0].is_after_checkpoint_review) {
                    cb(new ForbiddenError(NO_DOWNLOAD_IN_PHASE), true);
                    return;
                }
                noRights = false;
            }

            //If we still don't have right to download, get more project submissions to perform some checks
            //These are needed only if:
            //1. Submitter trying to download another submitter's submission OR
            //2. Iterative Reviewer trying to download submission and we need to check project submissions
            if (noRights && (_.contains(myResourceRoles, 'Submitter') || _.contains(myResourceRoles, "Iterative Reviewer"))) {
                api.dataAccess.executeQuery("download_submission_project_submissions", sqlParams, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }

        }, function (rows, cb) {
            projectSubmissions = rows;

            if (!_.isNull(rows) && _.contains(myResourceRoles, 'Submitter')) {
                //Amongst all submissions get the one by current user and which failed screening
                var failedScreening = _.find(rows, function (item) {
                    if (item.submission_status_id === 2 && item.resource_role_id === 1 && _.contains(myResourceIds, item.resource_id)) {
                        return item;
                    }
                });
                if (!_.isUndefined(failedScreening)) {
                    cb(new ForbiddenError("You are not allowed to download the submission because you did not pass screening."), true);
                    return;
                }

                //Submitters can download other's submissions, only after appeal response phase (or review phase if no appeal response phase)
                if (!(basicInfo[0].is_after_appeals_response || basicInfo[0].is_after_review)) {
                    cb(new ForbiddenError("You are not allowed to download another submitter's submission in this phase."), true);
                    return;
                }

                noRights = false;
            }

            //Iterative Reviewer trying to download submission:
            if (noRights && _.contains(myResourceRoles, "Iterative Reviewer")) {
                api.dataAccess.executeQuery("download_submission_reviews_by_user", sqlParams, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (rows, cb) {

            //Iterative Reviewer trying to download submissions can do so only if:
            //1. He has already done the review for the given submission OR
            //2. The submission is the next one in the queue
            if (!_.isNull(rows)) {
                //The project submissions are sorted by date, so the first one we find is the next in queue
                var nextSubmission = _.findWhere(projectSubmissions, {submission_status_id: 1});
                if (!_.isUndefined(nextSubmission) && nextSubmission.upload_id === uploadId) {
                    noRights = false;
                }

                if (noRights && !_.isUndefined(_.findWhere(rows, {upload_id: uploadId}))) {
                    noRights = false;
                }
            }

            //Finally...We are done checking rights!
            if (noRights) {
                cb(new ForbiddenError("You are not allowed to download this submission."), true);
                return;
            }

            //log successful attempt to download
            sqlParams.ipAddress = connection.remoteIP;
            sqlParams.successful = 't';
            api.dataAccess.executeQuery("insert_project_download_audit", sqlParams, dbConnectionMap, cb);
        }, function (notUsed, cb) {
            //Now we write the document to response
            filePath = path.join(api.config.general.uploadsRootDirectory, basicInfo[0].upload_parameter);
            fs.stat(filePath, cb);
        }, function (stats, cb) {
            var mime = Mime.lookup(filePath),
                response = connection.rawConnection.res,
                fileName = path.basename(filePath),
                stream;
            response.writeHead(200, {
                'Content-Type': mime,
                'Content-Length': stats.size,
                'Content-Disposition': 'attachment; filename=' + fileName
            });
            stream = fs.createReadStream(filePath);
            stream.on("end", cb);
            stream.on("error", cb);
            stream.pipe(response);
        }
    ], function (err, fail) {
        if (err) {
            if (fail) {
                //log failed attempt to download
                sqlParams.ipAddress = connection.remoteIP;
                sqlParams.successful = 'f';
                api.dataAccess.executeQuery("insert_project_download_audit", sqlParams, dbConnectionMap, function (errr) {
                    //the logging can itself fail
                    helper.handleError(api, connection, errr || err);
                    next(connection, true);
                });
            } else {
                helper.handleError(api, connection, err);
                next(connection, true);
            }
        } else {
            next(connection, false);
        }
    });
};

/**
 * The API for downloading dev submissions
 * @since 1.1
 */
exports.action = {
    name: "downloadDevSubmission",
    description: "downloadDevSubmission",
    inputs: {
        required: ["submissionId"],
        optional: ["username", "password"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    cacheEnabled: false,
    databases: ["tcs_catalog"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute downloadDevSubmission#run", 'debug');
            downloadDevSubmission(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

