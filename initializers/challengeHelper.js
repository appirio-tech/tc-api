/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.5
 * @author ecnu_haozi, bugbuka, Ghost_141, muzehyun, GFalcon
 * Refactor common code out from challenge.js.
 *
 * changes in 1.1:
 * add common function getForumWrapper, aduitResourceAddition
 * Changes in 1.2:
 * - Add new parameter in getChallengeTerms.
 * Changes in 1.3:
 * - Avoid undefined if rows[0].copilot_type is null.
 * Changes in 1.4:
 * - Add template id to challenge terms of use.
 * Changes in 1.5:
 * - Add the checkUserChallengeEligibility function
 * - Removee the obsolete eligibility check in getChallengeTerms
 */
"use strict";

require('datejs');
var async = require('async');
var _ = require('underscore');
var BadRequestError = require('../errors/BadRequestError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var NotFoundError = require('../errors/NotFoundError');
var ForbiddenError = require('../errors/ForbiddenError');
var ForumWrapper = require("forum-connector").ForumWrapper;

/**
 * This copilot posting project type id
 */
var COPILOT_POSTING_PROJECT_TYPE = 29;

/**
 * The forum wrapper instance
 */
var forumWrapper = null;

/**
 * Expose the "idGenerator" utility.
 *
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Function} next The callback function to be called when everyting is done
 */
exports.challengeHelper = function (api, next) {
    api.challengeHelper = {

        /**
         * Get forum wrapper. It is initialized only once.
         * @param {Object} api The api object that is used to access the infrastructure.
         * @param {Function<err, forumWrapper>} callback the callback function
         * @since 1.1
         */
        getForumWrapper : function (api, callback) {
            if (forumWrapper) {
                callback(null, forumWrapper);
            } else {
                try {
                    forumWrapper = new ForumWrapper(api.config.tcConfig.devForumJNDI);
                    callback(null, forumWrapper);
                } catch (ex) {
                    api.log('Failed to connect to forum: ' + ex + " " + (ex.stack || ''), 'error');
                    callback(new Error('Failed to connect to forum'));
                }
            }
        },

        /**
         * Audit the challenge registration on table 'tcs_catalog.project_user_audit'.
         *
         * @param {Object} api The api object that is used to access the infrastructure.
         * @param {Number} userId The current logged-in user's id.
         * @param {Number} challengeId The id of the challenge to register.
         * @param {Number} submitterResourceRoleId The id of the submitter resource role.
         * @param {Number} auditActionTypeId The id of the audit action type.
         * @param {Object} dbConnectionMap The database connection map for the current request.
         * @param {Function<err, data>} next The callback to be called after this function is done.
         * @since 1.1
         */
        aduitResourceAddition : function (api, userId, challengeId, submitterResourceRoleId, auditActionTypeId, dbConnectionMap, next) {
            api.dataAccess.executeQuery("audit_challenge_registration", {
                projectId: challengeId,
                resourceUserId: userId,
                resourceRoleId: submitterResourceRoleId,
                auditActionTypeId: auditActionTypeId,
                actionUserId: userId
            },
                dbConnectionMap,
                next);
        },

        /**
         * Gets the challenge terms for the current user given the challenge id and an optional role.
         * 
         * @param {Object} connection The connection object for the current request
         * @param {Number} challengeId The challenge id.
         * @param {String} role The user's role name, this is optional.
         * @param {Boolean} requireRegOpen - the flag that indicate need the challenge has open registration phase or not.
         * @param {Object} dbConnectionMap The database connection map for the current request
         * @param {Function<err, terms_array>} next The callback to be called after this function is done
         */
        getChallengeTerms : function (connection, challengeId, role, requireRegOpen, dbConnectionMap, next) {

            //Check if the user is logged-in
            if (_.isUndefined(connection.caller) || _.isNull(connection.caller) ||
                    _.isEmpty(connection.caller) || !_.contains(_.keys(connection.caller), 'userId')) {
                next(new UnauthorizedError("Authentication details missing or incorrect."));
                return;
            }

            var helper = api.helper,
                sqlParams = {},
                result = {},
                userId = connection.caller.userId;

            async.waterfall([
                function (cb) {

                    //Simple validations of the incoming parameters
                    var error = helper.checkPositiveInteger(challengeId, 'challengeId') ||
                        helper.checkMaxInt(challengeId, 'challengeId');

                    if (error) {
                        cb(error);
                        return;
                    }

                    //Check if the user passes validations for joining the challenge
                    sqlParams.userId = userId;
                    sqlParams.challengeId = challengeId;

                    api.dataAccess.executeQuery("challenge_registration_validations", sqlParams, dbConnectionMap, cb);
                }, function (rows, cb) {
                    if (rows.length === 0) {
                        cb(new NotFoundError('No such challenge exists.'));
                        return;
                    }

                    // Update check to use flag.
                    if (requireRegOpen && !rows[0].reg_open) {
                        cb(new ForbiddenError('Registration Phase of this challenge is not open.'));
                        return;
                    }

                    if (rows[0].user_registered) {
                        cb(new ForbiddenError('You are already registered for this challenge.'));
                        return;
                    }

                    if (rows[0].user_suspended) {
                        cb(new ForbiddenError('You cannot participate in this challenge due to suspension.'));
                        return;
                    }

                    if (rows[0].user_country_banned) {
                        cb(new ForbiddenError('You are not eligible to participate in this challenge because of your country of residence. Please see our terms of service for more information.'));
                        return;
                    }

                    // Do not allow a member to register for challenge if country is not set
                    if (rows[0].comp_country_is_null) {
                        cb(new ForbiddenError('You are not eligible to participate in this challenge because you have not specified your country of residence. Please go to your Settings and enter a country. Please see our terms of service for more information.'));
                        return;
                    }

                    if (rows[0].project_category_id === COPILOT_POSTING_PROJECT_TYPE) {
                        if (!rows[0].user_is_copilot && rows[0].copilot_type && rows[0].copilot_type.indexOf("Marathon Match") < 0) {
                            cb(new ForbiddenError('You cannot participate in this challenge because you are not an active member of the copilot pool.'));
                            return;
                        }
                    }

                    // We are here. So all validations have passed.
                    // Next we get all roles
                    api.dataAccess.executeQuery("all_resource_roles", {}, dbConnectionMap, cb);
                }, function (rows, cb) {
                    // Prepare a comma separated string of resource role names that must match
                    var commaSepRoleIds = "",
                        compiled = _.template("<%= resource_role_id %>,"),
                        ctr = 0,
                        resourceRoleFound;
                    if (_.isUndefined(role)) {
                        rows.forEach(function (row) {
                            commaSepRoleIds += compiled({resource_role_id: row.resource_role_id});
                            ctr += 1;
                            if (ctr === rows.length) {
                                commaSepRoleIds = commaSepRoleIds.slice(0, -1);
                            }
                        });
                    } else {
                        resourceRoleFound = _.find(rows, function (row) {
                            return (row.name === role);
                        });
                        if (_.isUndefined(resourceRoleFound)) {
                            //The role passed in is not recognized
                            cb(new BadRequestError("The role: " + role + " was not found."));
                            return;
                        }
                        commaSepRoleIds = resourceRoleFound.resource_role_id;
                    }

                    // Get the terms
                    sqlParams.resourceRoleIds = commaSepRoleIds;
                    api.dataAccess.executeQuery("challenge_terms_of_use", sqlParams, dbConnectionMap, cb);
                }, function (rows, cb) {
                    //We could just have down result.data = rows; but we need to change keys to camel case as per requirements
                    result.terms = [];
                    _.each(rows, function (row) {
                        result.terms.push({
                            termsOfUseId: row.terms_of_use_id,
                            title: row.title,
                            url: row.url,
                            agreeabilityType: row.agreeability_type,
                            agreed: row.agreed,
                            templateId: row.docusign_template_id
                        });
                    });
                    cb();
                }
            ], function (err) {
                if (err) {
                    next(err);
                    return;
                }
                next(null, result.terms);
            });
        },
        getChallengeTermsNoAuth : function (connection, challengeId, role, requireRegOpen, dbConnectionMap, next) {

            var helper = api.helper,
                sqlParams = {},
                result = {},
                userId = connection.caller.userId;

            async.waterfall([
                function (cb) {

                    //Simple validations of the incoming parameters
                    var error = helper.checkPositiveInteger(challengeId, 'challengeId') ||
                        helper.checkMaxInt(challengeId, 'challengeId');

                    if (error) {
                        cb(error);
                        return;
                    }

                    sqlParams.challengeId = challengeId;

                    // We are here. So all validations have passed.
                    // Next we get all roles
                    api.dataAccess.executeQuery("all_resource_roles", {}, dbConnectionMap, cb);
                }, function (rows, cb) {
                    // Prepare a comma separated string of resource role names that must match
                    var commaSepRoleIds = "",
                        compiled = _.template("<%= resource_role_id %>,"),
                        ctr = 0,
                        resourceRoleFound;
                    if (_.isUndefined(role)) {
                        rows.forEach(function (row) {
                            commaSepRoleIds += compiled({resource_role_id: row.resource_role_id});
                            ctr += 1;
                            if (ctr === rows.length) {
                                commaSepRoleIds = commaSepRoleIds.slice(0, -1);
                            }
                        });
                    } else {
                        resourceRoleFound = _.find(rows, function (row) {
                            return (row.name === role);
                        });
                        if (_.isUndefined(resourceRoleFound)) {
                            //The role passed in is not recognized
                            cb(new BadRequestError("The role: " + role + " was not found."));
                            return;
                        }
                        commaSepRoleIds = resourceRoleFound.resource_role_id;
                    }

                    // Get the terms
                    sqlParams.resourceRoleIds = commaSepRoleIds;
                    api.dataAccess.executeQuery("challenge_terms_of_use_noauth", sqlParams, dbConnectionMap, cb);
                }, function (rows, cb) {
                    //We could just have down result.data = rows; but we need to change keys to camel case as per requirements
                    result.terms = [];
                    _.each(rows, function (row) {

                        result.terms.push({
                            termsOfUseId: row.terms_of_use_id,
                            title: row.title,
                            url: row.url,
                            agreeabilityType: row.agreeability_type,
                            agreed: row.agreed,
                            templateId: row.docusign_template_id
                        });
                    });

                    var ids = {};
                    result.terms = result.terms.filter(function(row) {
                      if (ids[row.termsOfUseId]) {
                        return false;
                      } else {
                        ids[row.termsOfUseId] = true;
                        return true;
                      }
                    });

                    cb();
                }
            ], function (err) {
                if (err) {
                    next(err);
                    return;
                }
                next(null, result.terms);
            });
        },
        /**
         * Check if the user currently logged in has the right to access the specified challenge
         *
         * @param {Object} connection The connection object for the current request
         * @param {Number} challengeId The challenge id.
         * @param {Function<err>} next The callback that will receive an error
         *      if the user is not eligible
         *
         * @since 1.5
         */
        checkUserChallengeEligibility: function (connection, challengeId, next) {
            // Admins can access any challenge
            if (connection.caller.accessLevel === 'admin') {
                next();
                return;
            }
            // Query the accessibility information
            var userId = (connection.caller.userId || 0);
            api.dataAccess.executeQuery('get_challenge_accessibility_and_groups', {
                challengeId: challengeId,
                user_id: userId
            }, connection.dbConnectionMap, function (err, res) {
                if (err) {
                    next(err);
                    return;
                }
                // If there's no corresponding record in group_contest_eligibility
                // then the challenge is available to all users
                if (res.length === 0
                        || _.isNull(res[0].challenge_group_ind)
                        || _.isUndefined(res[0].challenge_group_ind)) {
                    next();
                    return;
                }
                var error = false;
                // Look at the groups
                async.some(res, function (record, cbx) {
                    // Old challenges: check by looking up in common_oltp:user_group_xref
                    if (record.challenge_group_ind === 0) {
                        cbx(!(_.isNull(record.user_group_xref_found) || _.isUndefined(record.user_group_xref_found)));
                    } else {
                        // New challenges: query the V3 API
                        api.v3client.isUserInGroup(connection, userId, record.group_id, function (err, result) {
                            if (err) {
                                error = err;
                                cbx(true);
                            } else {
                                cbx(result);
                            }
                        });
                    }
                }, function (eligible) {
                    if (error) {
                        next(error);
                    } else if (eligible) {
                        next();
                    } else if (connection.caller.accessLevel === "anon") {
                        next(new UnauthorizedError());
                    } else {
                        next(new ForbiddenError());
                    }
                });
            });
        }
    };

    next();
};
