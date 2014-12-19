/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.4
 * @author muzehyun, Ghost_141
 * Changes in 1.1:
 * - Implement user activation email api.
 * Changes in 1.2:
 * - Implement get user identity api.
 * Changes in 1.3:
 * - Implement get user marathon match api.
 * Changes in 1.4:
 * - Implement get user algorithm challenges api.
 */
'use strict';
var async = require('async');
var _ = require('underscore');
var BadRequestError = require('../errors/BadRequestError');
var ForbiddenError = require('../errors/ForbiddenError');
var NotFoundError = require('../errors/NotFoundError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var IllegalArgumentError = require('../errors/IllegalArgumentError');

/**
 * The activation email subject.
 * @since 1.1
 */
var activationEmailSubject = "Topcoder User Registration Activation";

/**
 * The activation email sender name.
 * @since 1.1
 */
var activationEmailSenderName = "Topcoder API";

/**
 * The valid sort column for get user marathon matches api.
 * @since 1.3
 */
var VALID_SORT_COLUMN_MARATHON_MATCH = ['id', 'type', 'codingDuration', 'placement', 'numContestants',
    'numSubmitters'];

/**
 * The valid sort column values for get user algo challenges api.
 * @since 1.4
 */
var VALID_SORT_COLUMN_ALGO_CHALLENGES = ['id', 'type', 'codingDuration', 'placement', 'numContestants',
    'numSubmitters'];

/**
 * It validates activation code and retrieves user id from activation code
 * @param {String} activationCode - activation code string
 * @param {Object} helper - helper object
 * @return {String} returns coder id 
 */
function getCoderId(activationCode, helper) {
    var coderId = helper.getCoderIdFromActivationCode(activationCode),
        generatedActivationCode = helper.generateActivationCode(coderId);
    if (activationCode === generatedActivationCode) {
        return coderId;
    }
    return 0;
}

/**
 * Get cache key for user resend times in cache.
 * @param {String} handle - The handle of user.
 * @returns {string} The cache key.
 * @since 1.1
 */
function getCacheKeyForResendTimes(handle) {
    return 'user-activation-' + handle;
}

/**
 * The API for activate user
 */
exports.activateUser = {
    name: 'activateUser',
    description: 'activateUser',
    inputs: {
        required: ['code'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ['common_oltp'],
    cacheEnabled: false,
    run: function (api, connection, next) {
        api.log('Execute activateUser#run', 'debug');
        var helper = api.helper,
            code = connection.params.code,
            dbConnectionMap = connection.dbConnectionMap,
            welcomeEmail = api.config.tcConfig.welcomeEmail,
            result,
            params = {},
            handle,
            email,
            userId;
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                try {
                    userId = getCoderId(code, helper);
                } catch (err) {
                    cb(err);
                }
                // check code has valid hash
                if (userId === 0) {
                    cb(new IllegalArgumentError('Invalid activation code'));
                    return;
                }
                params.code = code;
                params.user_id = userId;
                // get activation code, user status and email status
                api.dataAccess.executeQuery('get_user_status', params, dbConnectionMap, cb);
            }, function (results, cb) {
                // no result
                if (results.length === 0) {
                    cb(new BadRequestError('Invalid activation code'));
                    return;
                }
                var activationCodeInDB = results[0].activation_code,
                    userStatus = results[0].user_status,
                    emailStatusId = results[0].email_status_id;
                handle = results[0].handle;
                email = results[0].email;
                if (code !== activationCodeInDB) {
                    cb(new BadRequestError('Invalid activation code'));
                    return;
                }
                if ('U' !== userStatus) {
                    cb(new BadRequestError('User has been activated'));
                    return;
                }
                if (1 === emailStatusId) {
                    cb(new BadRequestError('Email has been activated'));
                    return;
                }
                // udpate user and email
                async.parallel([
                    function (cbx) {
                        api.dataAccess.executeQuery("activate_user", params, dbConnectionMap, cbx);
                    }, function (cbx) {
                        api.dataAccess.executeQuery("activate_email", params, dbConnectionMap, cbx);
                    }
                ], cb);
            }, function (results, cb) {
                api.log('activate query result: ' + results, 'debug');
                // update LDAP
                api.ldapHelper.activateMemberProfileLDAPEntry({ userId : userId }, cb);
            }, function (results, cb) {
                api.log('ldap result: ' + results, 'debug');
                var emailParams = {
                    handle: handle,
                    toAddress: email,
                    template: welcomeEmail.template,
                    subject: welcomeEmail.subject,
                    fromAddress : welcomeEmail.fromAddress,
                    senderName : welcomeEmail.senderName
                };
                // send email
                api.tasks.enqueue("sendEmail", emailParams, 'default');

                result = { success: true };
                // Remove cache from resend times from server.
                api.cache.destroy(getCacheKeyForResendTimes(handle), function () {
                    cb();
                });
            }
        ], function (err) {
            if (err) {
                helper.handleError(api, connection, err);
            } else {
                connection.response = result;
            }
            next(connection, true);
        });
    }
};

/**
 * Handle user activation email here.
 * @param {Object} api - The api object.
 * @param {Object} connection - The database connection object map.
 * @param {Function} next - The callback function.
 * @since 1.1
 */
function userActivationEmail(api, connection, next) {
    var helper = api.helper, caller = connection.caller, currentResendTimes, activationCode,
        dbConnectionMap = connection.dbConnectionMap,
        cacheKey = 'user-activation-' + caller.handle;

    async.waterfall([
        function (cb) {
            cb(helper.checkMember(connection, 'You must login for this endpoint.'));
        },
        function (cb) {
            api.dataAccess.executeQuery('check_user_activated', { handle: caller.handle }, dbConnectionMap, cb);
        },
        function (rs, cb) {
            if (rs[0].status === 'A') {
                cb(new BadRequestError("You're already activated."));
                return;
            }
            helper.getCachedValue(cacheKey, cb);
        },
        function (resendTimes, cb) {
            if (_.isUndefined(resendTimes)) {
                // We need to send the activation email and store the resend times.
                currentResendTimes = 0;
            } else {
                if (resendTimes >= api.config.tcConfig.userActivationResendLimit) {
                    cb(new BadRequestError('Sorry, you already reached the limit of resend times. Please contact for support.'));
                    return;
                }
                currentResendTimes = resendTimes;
            }
            api.dataAccess.executeQuery('get_user_email_and_handle', { userId: caller.userId }, dbConnectionMap, cb);
        },
        function (rs, cb) {
            activationCode = helper.generateActivationCode(caller.userId);
            api.tasks.enqueue("sendEmail",
                {
                    subject : activationEmailSubject,
                    activationCode : activationCode,
                    template : 'activation_email',
                    toAddress : rs[0].address,
                    fromAddress : process.env.TC_EMAIL_ACCOUNT,
                    senderName : activationEmailSenderName,
                    url : process.env.TC_ACTIVATION_SERVER_NAME + '/reg2/activate.action?code=' + activationCode,
                    userHandle : rs[0].handle
                }, 'default');
            api.cache.save(cacheKey, currentResendTimes + 1, api.config.tcConfig.userActivationCacheLifeTime,
                function (err) {
                    cb(err);
                });
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {
                success: true
            };
        }
        next(connection, true);
    });
}

/**
 * The API for activate user email.
 * @since 1.1
 */
exports.userActivationEmail = {
    name: 'userActivationEmail',
    description: 'Trigger sending user activation email.',
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['common_oltp'],
    cacheEnabled: false,
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('Execute userActivationEmail#run', 'debug');
            userActivationEmail(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * Get user identity information api.
 * @param {Object} api - The api object.
 * @param {Object} connection - The database connection map object.
 * @param {Function} next - The callback function.
 * @since 1.2
 */
function getUserIdentity(api, connection, next) {
    var helper = api.helper, caller = connection.caller, dbConnectionMap = connection.dbConnectionMap, response;
    async.waterfall([
        function (cb) {
            cb(helper.checkMember(connection, 'You need login for this endpoint.'));
        },
        function (cb) {
            api.dataAccess.executeQuery('get_user_email_and_handle', { userId: caller.userId }, dbConnectionMap, cb);
        },
        function (rs, cb) {
            response = {
                uid: caller.userId,
                handle: rs[0].handle,
                email: rs[0].address
            };
            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = response;
        }
        next(connection, true);
    });

}

/**
 * The API for activate user
 * @since 1.2
 */
exports.getUserIdentity = {
    name: 'getUserIdentity',
    description: 'Get user identity information',
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['common_oltp'],
    cacheEnabled: false,
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('getUserIdentity#run', 'debug');
            getUserIdentity(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * Get user identity information api.
 * @param {Object} api - The api object.
 * @param {Object} connection - The database connection map object.
 * @param {Function} next - The callback function.
 * @since 1.2
 */
function getUserIdentityByAuth0Id(api, connection, next) {
    var helper = api.helper,
        auth0id = connection.params.id,
        userid = 0,
        dbConnectionMap = connection.dbConnectionMap,
        notfound = new NotFoundError('Feelin lucky, punk?'),
        response;

    async.waterfall([
        function (cb) {
            try {
                var splits = auth0id.split('|');
                if (splits[0] === 'ad') {
                    cb(null, [{ user_id: Number(splits[1]) }]);
                } else {
                    api.helper.getProviderId(splits[0], function (err, provider) {
                        if (err) {
                            cb(notfound);
                        } else {
                            api.dataAccess.executeQuery("get_user_by_social_login",
                                {
                                    social_user_id: splits[1],
                                    provider_id: provider
                                },
                                dbConnectionMap, cb);
                        }
                    });
                }
            } catch (exc) {
                cb(notfound);
            }
        },
        function (result, cb) {
            if (!result[0]) {
                cb(notfound);
            } else {
                userid = result[0].user_id;
                api.dataAccess.executeQuery('get_user_email_and_handle',
                    { userId: userid },
                    dbConnectionMap, cb);
            }
        },
        function (rs, cb) {
            if (!rs[0]) {
                cb(notfound);
            } else {
                response = {
                    uid: userid,
                    handle: rs[0].handle
                };
                cb();
            }
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = response;
        }
        next(connection, true);
    });

}

/**
 * The API for activate user
 * @since 1.2
 */
exports.getUserIdentityByAuth0Id = {
    name: 'getUserIdentityByAuth0Id',
    description: 'Get user identity information',
    inputs: {
        required: ['id'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['common_oltp'],
    cacheEnabled: false,
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('getUserIdentityByAuth0Id#run', 'debug');
            getUserIdentityByAuth0Id(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * Handle the get marathon matches that user participated to.
 * @param {Object} api - The api object.
 * @param {Object} connection - The connection object.
 * @param {Function} next - The callback function.
 * @since 1.3
 */
function getUserMarathonMatches(api, connection, next) {
    var helper = api.helper, dbConnectionMap = connection.dbConnectionMap, response, sqlParams, sortOrder, sortColumn,
        exeQuery = function (name) {
            return function (cbx) {
                api.dataAccess.executeQuery(name, sqlParams, dbConnectionMap, cbx);
            };
        },
        handle = connection.params.handle,
        pageIndex = Number(connection.params.pageIndex || 1),
        pageSize = Number(connection.params.pageSize || 10);

    sortOrder = (connection.params.sortOrder || "asc").toLowerCase();
    sortColumn = connection.params.sortColumn || "id";

    // If the sortOrder is set and sortColumn is missing.
    if (connection.params.sortOrder && !connection.params.sortColumn) {
        helper.handleError(api, connection, new BadRequestError('The sortColumn is missing.'));
        next(connection, true);
        return;
    }

    if (pageIndex === -1) {
        pageSize = helper.MAX_INT;
        pageIndex = 1;
    }

    //reverse the sorting direction value because for placement 1 is the best so the descending order should be like 1, 2, 3.
    if (sortColumn.toLowerCase() === 'placement') {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    async.waterfall([
        function (cb) {
            var error = helper.checkPageIndex(pageIndex, "pageIndex")
                || helper.checkStringParameter(handle, "handle", 30)
                || helper.checkPositiveInteger(pageSize, "pageSize")
                || helper.checkMaxInt(pageSize, "pageSize")
                || helper.checkContains(['asc', 'desc'], sortOrder, "sortOrder")
                || helper.checkSortColumn(VALID_SORT_COLUMN_MARATHON_MATCH, sortColumn.toLowerCase());
            cb(error);
        },
        function (cb) {
            helper.checkUserExistAndActivate(handle, api, dbConnectionMap, cb);
        },
        function (cb) {
            sqlParams = {
                first_row_index: (pageIndex - 1) * pageSize,
                page_size: pageSize,
                sort_order: sortOrder,
                sort_column: helper.getSortColumnDBName(sortColumn),
                handle: handle.toLowerCase()
            };
            async.parallel({
                data: exeQuery('get_user_marathon_matches'),
                count: exeQuery('get_user_marathon_matches_count')
            }, cb);
        },
        function (queryResult, cb) {
            var total = queryResult.count[0].total_count;
            response = {
                pageIndex: pageIndex,
                pageSize: pageSize,
                total: total,
                data: queryResult.data.map(function (row) {
                    return {
                        id: row.id,
                        type: row.type,
                        prize: row.paid > 0,
                        codingDuration: row.coding_duration,
                        placement: row.placement,
                        numContestants: row.num_contestants,
                        numSubmitters: row.num_submitters,
                        platforms: [],
                        technologies: row.technologies.length === 0
                            ? [] : row.technologies.split(',').map(function (s) { return s.trim(); })
                    };
                })
            };
            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = response;
        }
        next(connection, true);
    });
}

/**
 * The api for get user marathon matches.
 * @since 1.3
 */
exports.getUserMarathonMatches = {
    name: 'getUserMarathonMatches',
    description: 'Get marathon match related info that member has participated to',
    inputs: {
        required: ['handle'],
        optional: ["sortOrder", "pageIndex", "pageSize", "sortColumn"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['topcoder_dw'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('getUserMarathonMatches#run', 'debug');
            getUserMarathonMatches(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * Handle the get algorithm challenges that user participated to.
 * @param {Object} api - The api object.
 * @param {Object} connection - The connection object.
 * @param {Function} next - The callback function.
 * @since 1.4
 */
function getUserAlgorithmChallenges(api, connection, next) {
    var helper = api.helper, dbConnectionMap = connection.dbConnectionMap, response, sqlParams, sortOrder, sortColumn,
        exeQuery = function (name) {
            return function (cbx) {
                api.dataAccess.executeQuery(name, sqlParams, dbConnectionMap, cbx);
            };
        },
        handle = connection.params.handle,
        pageIndex = Number(connection.params.pageIndex || 1),
        pageSize = Number(connection.params.pageSize || 10);

    // If the sortOrder is set and sortColumn is missing.
    if (connection.params.sortOrder && !connection.params.sortColumn) {
        helper.handleError(api, connection, new BadRequestError('The sortColumn is missing.'));
        next(connection, true);
        return;
    }

    sortOrder = (connection.params.sortOrder || "asc").toLowerCase();
    sortColumn = connection.params.sortColumn || "id";

    if (pageIndex === -1) {
        pageSize = helper.MAX_INT;
        pageIndex = 1;
    }

    if (sortColumn.toLowerCase() === 'placement') {
        //reverse the sortOrder value because for placement 1 is the best so the descending order should be like 1, 2, 3.
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }

    async.waterfall([
        function (cb) {
            var error = helper.checkPageIndex(pageIndex, "pageIndex")
                || helper.checkStringParameter(handle, "handle", 30)
                || helper.checkPositiveInteger(pageSize, "pageSize")
                || helper.checkMaxInt(pageSize, "pageSize")
                || helper.checkContains(['asc', 'desc'], sortOrder, "sortOrder")
                || helper.checkSortColumn(VALID_SORT_COLUMN_ALGO_CHALLENGES, sortColumn.toLowerCase());
            cb(error);
        },
        function (cb) {
            helper.checkUserExists(handle, api, dbConnectionMap, cb);
        },
        function (err, cb) {
            if (err) {
                cb(err);
                return;
            }
            helper.checkUserActivated(handle, api, dbConnectionMap, cb);
        },
        function (err, cb) {
            if (err) {
                cb(err);
                return;
            }
            sqlParams = {
                first_row_index: (pageIndex - 1) * pageSize,
                page_size: pageSize,
                sort_order: sortOrder,
                sort_column: helper.getSortColumnDBName(sortColumn.toLowerCase()),
                handle: handle.toLowerCase()
            };
            async.parallel({
                data: exeQuery('get_user_algo_challenges'),
                count: exeQuery('get_user_algo_challenges_count')
            }, cb);
        },
        function (queryResult, cb) {
            var total = queryResult.count[0].total_count;
            response = {
                pageIndex: pageIndex,
                pageSize: pageIndex === -1 ? total : pageSize,
                total: total,
                data: queryResult.data.map(function (row) {
                    return {
                        id: row.id,
                        type: row.type,
                        prize: row.paid > 0,
                        codingDuration: row.coding_duration,
                        placement: row.placement,
                        numContestants: row.num_contestants,
                        numSubmitters: row.num_submitters,
                        platforms: [],
                        technologies: row.technologies.split(',').map(function (s) { return s.trim(); })
                    };
                })
            };
            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = response;
        }
        next(connection, true);
    });
}

/**
 * The API for get user algorithm challenges.
 * @since 1.4
 */
exports.getUserAlgorithmChallenges = {
    name: 'getUserAlgorithmChallenges',
    description: 'Get user algorithm challenges related information',
    inputs: {
        required: ['handle'],
        optional: ["sortOrder", "pageIndex", "pageSize", "sortColumn"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ['topcoder_dw', 'common_oltp'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log('getUserAlgorithmChallenges#run', 'debug');
            getUserAlgorithmChallenges(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
