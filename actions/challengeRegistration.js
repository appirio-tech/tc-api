/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * The APIs to register a challenge (studio category or software category) for the current logged-in user.
 *
 * @version 1.4
 * @author ecnu_haozi, xjtufreeman, bugbuka
 *
 * changes in 1.1:
 * Combine Challenge Registration API(BUGR-11058)
 *
 * changes in 1.2:
 * Integrate the forums operation(Module Assembly - Integrating Forums Wrapper with Challenge Registration API)
 *
 * changes in 1.3:
 * move common function getForumWrapper, aduitResourceAddition to challengeHelper.js
 *
 * changes in 1.4:
 * send email notification for design(studio) challenges registration
 *
 * changes in 1.5:
 * check if there is a jwt (logged in user).
 */
"use strict";

var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var ForumWrapper = require("forum-connector").ForumWrapper;
var NotFoundError = require('../errors/NotFoundError');
var ForbiddenError = require('../errors/ForbiddenError');

/**
 * The forum wrapper instance
 */
var forumWrapper = null;

//constants
var DESIGN_PROJECT_TYPE = 1,
    DEVELOPMENT_PROJECT_TYPE = 2,
    PROJECT_USER_AUDIT_CREATE_TYPE = 1,
    SUBMITTER_RESOURCE_ROLE_ID = 1,
    COMPONENT_TESTING_PROJECT_TYPE = 5,
    APPEALS_COMPLETE_EARLY_PROPERTY_ID = 13,
    NO_VALUE = 'NO',
    TIMELINE_NOTIFICATION_ID = 1,// See java field ORNotification.TIMELINE_NOTIFICATION_ID.
    TC_FORUMS_URL_PREFIX = require('../config').config.general.tcForumsServer + '?module=Category&categoryID=',
    STUDIO_FORUMS_URL_PREFIX = require('../config').config.general.studioForumsServer + '?module=ThreadList&forumID=';

var CHALLENGE_TYPE = {
    DEVELOP: 'develop',
    DESIGN: 'design'
};

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
                userInfo.rating = 0;
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
        userId: userId,
        createUser: '"' + userId + '"',
        modifyUser: '"' + userId + '"'
    },
        dbConnectionMap,
        function (err) {
            if (err) {
                next(err);
            } else {
                next(null, resourceId);
            }
        });
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
 * @param {Number} propertyId The property id.
 * @param {String} propertyValue The property value.
 * @param {Number} userId The user id.
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
            persistResource(api, resourceId, userId, challengeId, dbConnectionMap, callback);
        },
        function (resourceId, callback) {
            async.parallel([
                function (cb) {
                    api.challengeHelper.aduitResourceAddition(api, userId, challengeId, SUBMITTER_RESOURCE_ROLE_ID, PROJECT_USER_AUDIT_CREATE_TYPE, dbConnectionMap, cb);
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
                                cbk(new NotFoundError("user's handle not found"));
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
                    persistResourceInfo(api, resourceId, 6, moment().format('MM.DD.YYYY hh:mm A'), userId, dbConnectionMap, cb);
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
 * @param {Object} componentInfo The component info object generated from method <code>registerComponentInquiry</code>.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} activeForumCategoryId The active forum category id.
 * @param {Object} challengeType The challenge type, design or develop.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var sendNotificationEmail = function (api, componentInfo, userId, activeForumCategoryId, challengeType, challengeId, dbConnectionMap, next) {
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
            var user, projectName, documentationDetails, submitURL, forumURL, umlToolInfo;

            user = result[0];
            projectName = componentInfo.project_name + api.helper.getPhaseName(componentInfo.phase_id) + ' Contest';
            documentationDetails = '';
            submitURL = process.env.TC_SOFTWARE_SERVER_NAME + '/review';

            if (componentInfo.phase_id === 112) {
                documentationDetails = '(see the Design Phase Documents thread)';
            } else if (componentInfo.phase_id === 113) {
                documentationDetails = '(See "Development Phase Documents" thread)';
            }

            if (componentInfo.phase_id === 112 || componentInfo.phase_id === 113) {
                umlToolInfo = "You can read more about our UML tool and download it at\n" +
                    "http://www.topcoder.com/tc?module=Static&d1=dev&d2=umltool&d3=description\n\n";
            }

            if (challengeType === CHALLENGE_TYPE.DEVELOP) {
                forumURL = TC_FORUMS_URL_PREFIX + activeForumCategoryId;
                submitURL = process.env.TC_SOFTWARE_SERVER_NAME + '/review/actions/ViewProjectDetails?pid=' + challengeId;
            } else if (challengeType === CHALLENGE_TYPE.DESIGN) {
                forumURL = STUDIO_FORUMS_URL_PREFIX + activeForumCategoryId;
                submitURL = process.env.TC_STUDIO_SERVER_NAME + '/?module=ViewContestDetails&ct=' + challengeId;
            }


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
            cb();
        }
    ], next);
};

/*
 * Get the active forum category id of the specified challenge.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Object} componentInfo The component info object generated from method <code>registerComponentInquiry</code>.
 * @param {Number} challengeId The challenge id.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var getActiveForumCategoryId = function (api, componentInfo, challengeId, dbConnectionMap, next) {
    async.waterfall([
        function (cb) {
            if (componentInfo.component_id === null) {
                api.log('Could not find component for challenge ' + challengeId, 'error');
                next(new Error('Could not find component for challenge ' + challengeId));
                return;
            }
            api.dataAccess.executeQuery("get_active_forum_category", {componentId: componentInfo.component_id}, dbConnectionMap, cb);
        },
        function (result, cb) {
            if (result.length === 0) {
                api.log('Could not find forum for challenge ' + challengeId, 'debug');
                cb(null, null);
                return;
            }

            cb(null, result[0].jive_category_id);
        }
    ], next);
};

/*
 * Grant user forum access
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The challenge id.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var grantForumAccess = function (api, userId, activeForumCategoryId, next) {

    if (api.config.general.grantForumAccess !== true) {
        next();
        return;
    }

    if (activeForumCategoryId === null) {
        api.log('Could not find forum category ' + activeForumCategoryId, 'error');
        next(new Error('Could not find forum category ' + activeForumCategoryId));
        return;
    }

    api.log('start to grant user ' + userId + ' forum category ' +  activeForumCategoryId + ' access.');
    async.waterfall([
        function (cb) {
            api.challengeHelper.getForumWrapper(api, cb);
        }, function (forumWrapper, cb) {
            forumWrapper.assignRole(userId, "Software_Users_" + activeForumCategoryId, function (err) {
                if (err) {
                    api.log('Failed to grant user ' + userId + ' forum category ' +  activeForumCategoryId + ' access:' + err + " " + (err.stack || ''), 'error');
                    cb(new Error('Failed to grant user ' + userId + ' forum category ' +  activeForumCategoryId + ' access'));
                }
                cb();
            });
        }
    ], function (err) {
        if (err) {
            next(err);
            return;
        }
        next();
    });
};

/**
 * Register a challenge for the current logged-in user.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Number} userId The current logged-in user's id.
 * @param {Number} challengeId The id of the challenge to register.
 * @param {Object} challengeType The challenge type, design or develop.
 * @param {Object} dbConnectionMap The database connection map for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var registerChallenge = function (api, userId, challengeId, challengeType, dbConnectionMap, next) {

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

            if (challengeType === CHALLENGE_TYPE.DEVELOP) {
                projectTrack(api, userId, challengeId, componentInfo, dbConnectionMap, function (err) {
                    cb(err);
                });
            } else {
                cb();
            }
        },

        function (cb) {
            timelineNotification(api, userId, challengeId, dbConnectionMap, function (err) {
                cb(err);
            });
        },

        function (cb) {
            getActiveForumCategoryId(api, componentInfo, challengeId, dbConnectionMap, cb);
        },

        function (activeForumCategoryId, cb) {
            async.waterfall([
                function (cbx) {

                    if (challengeType === CHALLENGE_TYPE.DEVELOP) {
                        // Grant forum access
                        grantForumAccess(api, userId, activeForumCategoryId, cbx);
                    } else {
                        cbx();
                    }
                },
                function (cbx) {
                    // Send notification mail
                    sendNotificationEmail(api, componentInfo, userId, activeForumCategoryId, challengeType, challengeId, dbConnectionMap, cbx);
                }
            ], cb);
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
            persistResource(api, resourceId, userId, challengeId, dbConnectionMap, callback);
        },
        function (resourceId, callback) {
            async.parallel([
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
                                cbk(new NotFoundError("user's handle not found"));
                                return;
                            }
                            var handle = result[0].handle;
                            persistResourceInfo(api, resourceId, 2, handle, userId, dbConnectionMap, cbk);
                        }
                    ], cb);
                },
                function (cb) {
                    //Registration time
                    persistResourceInfo(api, resourceId, 6, moment().format("MM.DD.YYYY hh:mm A"), userId, dbConnectionMap, cb);
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
            } else {
                cb(null);
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
            registerChallenge(
                api,
                userId,
                challengeId,
                CHALLENGE_TYPE.DESIGN,
                dbConnectionMap,
                cb
            );
        },
        function (cb) {
            timelineNotification(api, userId, challengeId, dbConnectionMap, cb);
        }
    ], next);
};


/**
 * The action to register a software challenge for the current logged-in user.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Object} connection The connection for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var registerSoftwareChallengeAction = function (api, connection, next) {
    if (connection.dbConnectionMap) {
        api.log("Execute registerSoftwareChallengeAction#run", 'debug');

        var challengeId = Number(connection.params.challengeId),
            sqlParams = {
                challengeId: challengeId,
                user_id: connection.caller.userId
            },
            execQuery = function (name) {
                return function (cbx) {
                    api.dataAccess.executeQuery(name, sqlParams, connection.dbConnectionMap, cbx);
                };
            };
        async.waterfall([
            function (cb) {
                async.parallel({
                    isCopilotPosting: execQuery('check_challenge_is_copilot_posting'),
                    isCopilot: execQuery('check_is_copilot')
                }, cb);
            }, function (res, cb) {
                if (res.isCopilotPosting.length > 0 && res.isCopilotPosting[0].challenge_is_copilot) {
                    if (res.isCopilot.length === 0 || !res.isCopilot[0].user_is_copilot) {
                        cb(new ForbiddenError('You should be a copilot before register a copilot posting.'));
                    }
                }
                cb(null);
            }, function (cb) {
                api.challengeHelper.getChallengeTerms(
                    connection,
                    challengeId,
                    "Submitter", //optional value. Here we don't need to provide such value.
                    true,
                    connection.dbConnectionMap,
                    cb
                );
            },
            function (terms, cb) {
                if (allTermsAgreed(terms)) {
                    registerChallenge(
                        api,
                        connection.caller.userId,
                        challengeId,
                        CHALLENGE_TYPE.DEVELOP,
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
};

/**
 * The action to register a design challenge(studio) for the current logged-in user.
 *
 * @param {Object} api The api object that is used to access the infrastructure.
 * @param {Object} connection The connection for the current request.
 * @param {Function<err, data>} next The callback to be called after this function is done.
 */
var registerStudioChallengeAction = function (api, connection, next) {
    if (connection.dbConnectionMap) {
        api.log("Execute registerStudioChallengeAction#run", 'debug');

        var challengeId = Number(connection.params.challengeId);
        async.waterfall([

            function (cb) {
                api.challengeHelper.getChallengeTerms(
                    connection,
                    challengeId,
                    "Submitter",
                    true,
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
};


/**
 * The API to register a challenge for the current logged-in user.
 */
exports.registerChallenge = {
    name: "registerChallenge",
    description: "registerChallenge",
    inputs: {
        required: ["challengeId"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    cacheEnabled : false,
    transaction: 'write',
    databases: ["tcs_catalog", "common_oltp"],
    run: function (api, connection, next) {

        var challengeId = Number(connection.params.challengeId);
        console.log("challengeId: " +  challengeId);
        async.waterfall([
            function (cb) {
                //Simple validations of the incoming parameters
                var error = api.helper.checkPositiveInteger(challengeId, 'challengeId') ||
                    api.helper.checkMaxInt(challengeId, 'challengeId') ||
                    api.helper.checkMember(connection, 'You don\'t have the authority to do this. Please login.');
                if (error) {
                    console.log("error: " +  error);
                    cb(error);
                } else {
                    console.log("error11: " +  error);
                    api.dataAccess.executeQuery('check_challenge_exists', {challengeId: challengeId}, connection.dbConnectionMap, cb);
                }
            }, function (result, cb) {
                if (result.length > 0) {
                    if (result[0].is_studio) {
                        registerStudioChallengeAction(api, connection, next);
                    } else {
                        registerSoftwareChallengeAction(api, connection, next);
                    }
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                api.helper.handleError(api, connection, err);
                next(connection, true);
            } else {
                next(connection, false); //false = response has been set
            }
        });
    }
};
