/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * The APIs to register a challenge (studio category or software category) for the current logged-in user.
 *
 * @version 1.0
 * @author ecnu_haozi
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var NotFoundError = require('../errors/NotFoundError');
var ForbiddenError = require('../errors/ForbiddenError');

//constants
var DESIGN_PROJECT_TYPE = 1,
    DEVELOPMENT_PROJECT_TYPE = 2,
    PROJECT_USER_AUDIT_CREATE_TYPE = 1,
    SUBMITTER_RESOURCE_ROLE_ID = 1,
    COMPONENT_TESTING_PROJECT_TYPE = 5,
    APPEALS_COMPLETE_EARLY_PROPERTY_ID = 13,
    NO_VALUE = 'NO',
    TIMELINE_NOTIFICATION_ID = 1;// See java field ORNotification.TIMELINE_NOTIFICATION_ID. 

/**
 * Check if the user agreed all terms of use.
 * @param {Array} terms The array of terms of use.
 * @return true if the user agreed all terms of use, false otherwise. 
 */
var allTermsAgreed = function (terms) {
    return _.every(terms, function (term) {
        return term.agreed;
    });
};

/**
 * Persist data into table 'tcs_catalog.component_inquiry'.
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The id of the challenge to register.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var registerComponentInquiry = function (api, userId, challengeId, dbConnectionMap, next) {
    var componentInfo, userInfo;

    // insert into table component_inquiry
    async.waterfall([

        function (cb) {
            api.dataAccess.executeQuery("get_component_info", {challengeId: challengeId }, dbConnectionMap, cb);
        },
        function (result, cb) {
            if (result.length === 0) {
                cb(new NotFoundError("Component not found"));
                return;
            }
            componentInfo = result[0];

            api.dataAccess.executeQuery("get_user_rating",
                {
                    phaseId: componentInfo.phase_id,
                    userId: userId
                },
                dbConnectionMap,
                cb);
        },
        function (result, cb) {
            if (result.length === 0) {
                userInfo['rating'] = 0;
            } else {
                userInfo = result[0];
            }
            api.idGenerator.getNextID("COMPONENT_INQUIRY_SEQ", dbConnectionMap, function (err, componentInquiryId) {
                cb(err, componentInquiryId);
            });
        },
        function (componentInquiryId, cb) {
            api.dataAccess.executeQuery("insert_registration_record",
                {
                    componentInquiryId: componentInquiryId,
                    componentId: componentInfo.component_id,
                    userId: userId,
                    comment: '"' + componentInfo.comments + '"',
                    agreedToTerms: 1, //the user agreed all terms.
                    rating: userInfo.rating,
                    phase: (componentInfo.project_category_id === DESIGN_PROJECT_TYPE ||
                                componentInfo.project_category_id === DEVELOPMENT_PROJECT_TYPE ?
                                componentInfo.phase_id : null),
                    tcUserId: userId,
                    version: componentInfo.version,
                    projectId: challengeId
                },
                dbConnectionMap,
                cb);
        }
    ], function (err) {
        //return the componentInfo and userInfo for future reference
        next(err, _.extend(componentInfo, userInfo));
    });
};


/**
 * Persist data into table 'tcs_catalog.resource'.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} resourceId The resource id.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The id of the challenge to register.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var persistResource = function (api, resourceId, userId, challengeId, dbConnectionMap, next) {
    api.dataAccess.executeQuery("insert_resource", {
        resourceId: resourceId,
        projectId: challengeId,
        createUser: '"' + userId + '"',
        modifyUser: '"' + userId + '"'
    },
        dbConnectionMap,
        next);
};

/**
 * Audit the challenge registration on table 'tcs_catalog.project_user_audit'.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} resourceId The resource id.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The id of the challenge to register.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var aduitResourceAddition = function (api, userId, challengeId, dbConnectionMap, next) {
    api.dataAccess.executeQuery("audit_challenge_registration", {
        projectId: challengeId,
        resourceUserId: userId,
        resourceRoleId: SUBMITTER_RESOURCE_ROLE_ID,
        auditActionTypeId: PROJECT_USER_AUDIT_CREATE_TYPE,
        actionUserId: userId
    },
        dbConnectionMap,
        next);
};

/**
 * Check if the rating suit for software category contests. 
 * The code logic is duplicated from server-side java code.
 *
 * @param {Number} phaseId the phase id.
 * @param {Number} projectCategoryId the category id.
 * @return true if the rating is suitable for development (software) category challenge, otherwise false.
 */
var isRatingSuitableDevelopment = function (phaseId, projectCategoryId) {
    //The rating is suitable for software, e.g. not for studio.
    var suitable = false;
    if (projectCategoryId === COMPONENT_TESTING_PROJECT_TYPE) {
        if (phaseId === 113) {
            suitable = true;
        }
    } else if (projectCategoryId + 111 === phaseId) {
        suitable = true;
    }
    return suitable;
};


/**
 * Persit table 'tcs_catalog.project_result'.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} rating The user's rating for specific challenge type.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The id of the challenge to register.
 * @param {Number} phaseId The id which indicate the challenge's type.
 * @param {Number} projectCategoryId The id which indicate the challenge's type. 
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var prepareProjectResult = function (api, rating, userId, challengeId, phaseId, projectCategoryId, dbConnectionMap, next) {

    if (!isRatingSuitableDevelopment(phaseId, projectCategoryId)) {
        rating = null;
    }

    api.dataAccess.executeQuery("insert_challenge_result", {
        projectId: challengeId,
        userId: userId,
        ratingInd: 0,
        validSubmissionInd: 0,
        oldRating: rating
    },
        dbConnectionMap,
        next);
};

/**
 * Persist data into table 'tcs_catalog.resource_info'.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} resourceId The resource id.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The id of the challenge to register.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done..
 */
var persistResourceInfo = function (api, resourceId, propertyId, propertyValue, userId, dbConnectionMap, next) {

    api.dataAccess.executeQuery("insert_resource_info", {
        resourceId: resourceId,
        resourceInfoTypeId: propertyId,
        value: '"' + propertyValue + '"',
        createUser: '"' + userId + '"',
        modifyUser: '"' + userId + '"'
    },
        dbConnectionMap,
        next);
};

/**
 * Persist the user's challenge-related information as Resources into table 'tcs_catalog.resource' and 'tcs_catalog.resource_info',
 * audit the registration on table 'tcs_catalog.project_user_audit', and initial a record on table 'tcs_catalog.project_result'.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The id of the challenge to register.
 * @param {Object} componentInfo The component info object generated from method <code>registerComponentInquiry</code>.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var projectTrack = function (api, userId, challengeId, componentInfo, dbConnectionMap, next) {
    async.waterfall([
        function (callback) {
            api.idGenerator.getNextID("RESOURCE_ID_SEQ", dbConnectionMap, function (err, resourceId) {
                callback(err, resourceId);
            });
        },
        function (resourceId, callback) {
            async.parallel([

                function (cb) {
                    persistResource(api, resourceId, userId, challengeId, dbConnectionMap, cb);
                },
                function (cb) {
                    aduitResourceAddition(api, userId, challengeId, dbConnectionMap, cb);
                },
                function (cb) {
                    prepareProjectResult(
                        api,
                        componentInfo.rating,
                        userId,
                        challengeId,
                        componentInfo.phase_id,
                        componentInfo.project_category_id,
                        dbConnectionMap,
                        cb
                    );
                },
                function (cb) {
                    //External Reference ID
                    persistResourceInfo(api, resourceId, 1, userId, userId, dbConnectionMap, cb);
                },
                function (cb) {
                    //handle
                    async.waterfall([
                        function (cbk) {
                            api.dataAccess.executeQuery("get_user_handle", {
                                user_id: userId
                            }, dbConnectionMap, cbk);
                        },
                        function (result, cbk) {
                            if (result.length === 0) {
                                cbk(new NotFoundError("user's hanlde not found"));
                                return;
                            }
                            var handle = result[0].handle;
                            persistResourceInfo(api, resourceId, 2, handle, userId, dbConnectionMap, cbk);
                        }
                    ], cb);
                },
                function (cb) {
                    //Rating
                    var rating = componentInfo.rating;
                    if (!isRatingSuitableDevelopment(componentInfo.phase_id, componentInfo.project_category_id)) {
                        rating = 0; //the rating can not apply in this challenge.
                    }
                    if (rating > 0) {
                        persistResourceInfo(api, resourceId, 4, componentInfo.rating, userId, dbConnectionMap, cb);
                    } else {
                        cb();
                    }
                },
                function (cb) {
                    //Reliability
                    async.waterfall([

                        function (cbk) {
                            api.dataAccess.executeQuery("get_user_reliability", {
                                challengeId: challengeId,
                                userId: userId
                            },
                                dbConnectionMap,
                                cbk);
                        },
                        function (result, cbk) {
                            var reliability;
                            if (result.length === 0) {
                                reliability = 0;
                            } else {
                                reliability = result[0].rating;    
                            }
                            if (!_.isNull(reliability) && !_.isUndefined(reliability)) {
                                persistResourceInfo(api, resourceId, 5, reliability, userId, dbConnectionMap, cbk);
                            } else {
                                cbk();
                            }
                        }
                    ], cb);
                },
                function (cb) {
                    //Registration time
                    persistResourceInfo(api, resourceId, 6, moment().format(), userId, dbConnectionMap, cb);
                },
                function (cb) {
                    //Appeals completed early flag.
                    persistResourceInfo(api, resourceId, APPEALS_COMPLETE_EARLY_PROPERTY_ID, NO_VALUE, userId, dbConnectionMap, cb);
                }
            ], callback);
        }
    ], next);
};

/*
 * Send email to notify the user registration succeeded.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} userId The current logged-in user's id.
 * @param {Object} componentInfo The component info object generated from method <code>registerComponentInquiry</code>.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var sendNotificationEmail = function (api, componentInfo, userId, dbConnectionMap, next) {
    async.waterfall([
        function (cb) {
            api.dataAccess.executeQuery("get_user_email_and_handle", {
                userId: userId
            }, dbConnectionMap, cb);
        },
        function (result, cb) {
            if (result.length === 0) {
                cb(new NotFoundError("user's email and handle not found"));
                return;
            }
            var user, projectName, documentationDetails, submitURL, activeForumCategoryId, forumURL, umlToolInfo;

            user = result[0];
            projectName = componentInfo.project_name + api.helper.getPhaseName(componentInfo.phase_id) + ' Contest';
            documentationDetails = '';
            submitURL = process.env.TC_SOFTWARE_SERVER_NAME + '/review';

            if (componentInfo.phase_id === 112) {
                documentationDetails = '(see the Design Phase Documents thread)';
            } else if (componentInfo.phase_id === 113) {
                documentationDetails = '(See "Development Phase Documents" thread)';
            }

            if(componentInfo.phase_id === 112 || componentInfo.phase_id === 113){
                umlToolInfo = "You can read more about our UML tool and download it at\n" +
                        "http://www.topcoder.com/tc?module=Static&d1=dev&d2=umltool&d3=description\n\n";
            }

            //NOTE : forumURL is out of scope, here use a mock value instead. See http://apps.topcoder.com/forums/?module=Thread&threadID=811696&start=0
            activeForumCategoryId = 210123;
            forumURL = 'http://' + process.env.TC_FORUMS_SERVER_NAME + '/?module=Category&categoryID=' + activeForumCategoryId;

            api.tasks.enqueue("sendEmail", {
                subject : projectName,
                userName : user.handle,
                projectName : projectName,
                forumURL : forumURL,
                documentationDetails : documentationDetails,
                umlToolInfo : umlToolInfo,
                deadlineDate : componentInfo.initial_submission_date,
                submitURL : submitURL,
                template : 'registration_notification_email',
                toAddress : user.email,
                senderName : "TC API"
            }, 'default');
            cb(null, null);
        }
    ], next);
};

/**
 * Register a development (software) challenge for the current logged-in user.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The id of the challenge to register.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var registerSoftwareChallenge = function (api, userId, challengeId, dbConnectionMap, next) {

    var componentInfo;

    async.waterfall([
        function (cb) {
            registerComponentInquiry(api, userId, challengeId, dbConnectionMap, cb);
        },
        function (result, cb) {
            if (_.isUndefined(result)) {
                cb(new NotFoundError("component info not found"));
                return;
            }
            componentInfo = result;
            projectTrack(api, userId, challengeId, componentInfo, dbConnectionMap, function (err) {
                cb(err);
            });
        },
        function (cb) {
            //Send notification mail
            sendNotificationEmail(api, componentInfo, userId, dbConnectionMap, cb);
        }
    ], next);
};

/**
 * Persist the user's challenge-related information for future reference. Store them in
 * table <code>tcs_catalog.resource</code> and <code>tcs_catalog.resouce_info</code>.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The id of the challenge to register.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var persistStudioChallengeResouce = function (api, userId, challengeId, dbConnectionMap, next) {
    async.waterfall([
        function (callback) {
            api.idGenerator.getNextID("RESOURCE_ID_SEQ", dbConnectionMap, function (err, resourceId) {
                callback(err, resourceId);
            });
        },
        function (resourceId, callback) {
            async.parallel([

                function (cb) {
                    persistResource(api, resourceId, userId, challengeId, dbConnectionMap, cb);
                },
                function (cb) {
                    //External Reference ID
                    persistResourceInfo(api, resourceId, 1, userId, userId, dbConnectionMap, cb);
                },
                function (cb) {
                    //handle
                    async.waterfall([
                        function (cbk) {
                            api.dataAccess.executeQuery("get_user_handle", {
                                user_id: userId
                            }, dbConnectionMap, cbk);
                        },
                        function (result, cbk) {
                            if (result.length === 0) {
                                cbk(new NotFoundError("user's hanlde not found"));
                                return;
                            }
                            var handle = result[0].handle;
                            persistResourceInfo(api, resourceId, 2, handle, userId, dbConnectionMap, cbk);
                        }
                    ], cb);
                },
                function (cb) {
                    //Registration time
                    persistResourceInfo(api, resourceId, 6, moment().format("MM.dd.yyyy hh:mm aa"), userId, dbConnectionMap, cb);
                },
                function (cb) {
                    //payments.
                    persistResourceInfo(api, resourceId, 8, "N/A", userId, dbConnectionMap, cb);
                }
            ], callback);
        }
    ], next);
};
/**
 * Set the timeline notification if it's disable before.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The id of the challenge to register.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var timelineNotification = function (api, userId, challengeId, dbConnectionMap, next) {
    async.waterfall([
        function (cb) {
            api.dataAccess.executeQuery("get_challenge_notification_count", {
                challengeId: challengeId,
                userId: userId,
                notificationTypeId : TIMELINE_NOTIFICATION_ID
            },
                dbConnectionMap,
                cb);
        },
        function (result, cb) {
            if (result.length === 0 || !_.has(result[0], 'total_count')) {
                cb(new NotFoundError("Notification not found."));
            }
            if (result[0].total_count === 0) {
                api.dataAccess.executeQuery("insert_challenge_notification", {
                    challengeId: challengeId,
                    userId: userId,
                    notificationTypeId : 1, // See java field ORNotification.TIMELINE_NOTIFICATION_ID. 
                    createUser : '"' + userId + '"',
                    modifyUser : '"' + userId + '"'
                },
                    dbConnectionMap,
                    cb);
            }
        }
    ], next);
};
/**
 * Register a design challenge (studio) for the current logged-in user.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The id of the challenge to register.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var registerStudioChallenge = function (api, userId, challengeId, dbConnectionMap, next) {
    async.waterfall([
        function (cb) {
            persistStudioChallengeResouce(api, userId, challengeId, dbConnectionMap, function (err) {
                cb(err);
            });
        },
        function (cb) {
            timelineNotification(api, userId, challengeId, dbConnectionMap, cb);
        }
    ], next);
};

/**
 * The API to register a development (software) challenge for the current logged-in user.
 */
exports.registerSoftwareChallenge = {
    name: "registerSoftwareChallenge",
    description: "registerSoftwareChallenge",
    inputs: {
        required: ["challengeId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["tcs_catalog", "common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute registerSoftwareChallenge#run", 'debug');

            var challengeId = Number(connection.params.challengeId);
            async.waterfall([

                function (cb) {
                    api.challengeHelper.getChallengeTerms(
                        connection,
                        challengeId,
                        SUBMITTER_RESOURCE_ROLE_ID, //optional value. Here we don't need to provide such value.
                        connection.dbConnectionMap,
                        cb
                    );
                },
                function (terms, cb) {
                    if (allTermsAgreed(terms)) {
                        registerSoftwareChallenge(
                            api,
                            connection.caller.userId,
                            challengeId,
                            connection.dbConnectionMap,
                            cb
                        );
                        api.log("register the software challenge succeeded.", 'debug');
                    } else {
                        cb(new ForbiddenError('You should agree with all terms of use.'));
                    }
                }
            ], function (err) {
                if (err) {
                    api.helper.handleError(api, connection, err);
                } else {
                    connection.response = {message : "ok"};
                }
                next(connection, true);
            });
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API to register a design challenge (studio) for the current logged-in user.
 */
exports.registerStudioChallenge = {
    name: "registerStudioChallenge",
    description: "registerStudioChallenge",
    inputs: {
        required: ["challengeId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["tcs_catalog", "common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute registerStudioChallenge#run", 'debug');

            var challengeId = Number(connection.params.challengeId);
            async.waterfall([

                function (cb) {
                    api.challengeHelper.getChallengeTerms(
                        connection,
                        challengeId,
                        SUBMITTER_RESOURCE_ROLE_ID, 
                        connection.dbConnectionMap,
                        cb
                    );
                },
                function (terms, cb) {
                    if (allTermsAgreed(terms)) {
                        registerStudioChallenge(
                            api,
                            connection.caller.userId,
                            challengeId,
                            connection.dbConnectionMap,
                            cb
                        );
                        api.log("register the studio challenge succeeded.", 'debug');
                    } else {
                        cb(new ForbiddenError('You should agree with all terms of use.'));
                    }
                }
            ], function (err) {
                if (err) {
                    api.helper.handleError(api, connection, err);
                } else {
                    connection.response = {message : "ok"};
                }
                next(connection, true);
            });
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};