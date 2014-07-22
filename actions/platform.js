/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author kurtrips, KeSyren, Ghost_141, TCSASSEMBLER
 * Changes in 1.1:
 * - Implement the billing account permission api.
 */

/*jslint unparam: true */
"use strict";
require('datejs');
var async = require('async');
var _ = require('underscore');
var S = require('string');
var moment = require('moment');
var UnauthorizedError = require('../errors/UnauthorizedError');
var NotFoundError = require('../errors/NotFoundError');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var BadRequestError = require('../errors/BadRequestError');
var ForbiddenError = require('../errors/ForbiddenError');

/**
 * The date format for input date parameter startDate and enDate.
 * Dates like 2014-01-29 and 2014-1-29 are valid
 */
var DATE_FORMAT = 'YYYY-M-D';

/**
 * Max and min date value for date parameter.
 */
var MIN_DATE = '2009-1-1';
var MAX_DATE = '2099-1-1';

/**
 * Valid track value.
 * @since 1.3
 */
var VALID_TRACK = ['develop', 'design', 'data'];


/**
 * This variable holds a new billing to be created.
 */
var newBilling = {
    companyId: 1,
    poBoxNumber: 'null',
    paymentTermId: 1,
    salestax: 0,
    isManualPrizeSetting: 1
};

/**
 * This variable holds a dummy contact to be created for the new billing account.
 */
var dummyContact = {
    firstName: "fname",
    lastName: "lname",
    phone: "8675309",
    email: "tc@topcoder.com"
};

/**
 * This variable holds a dummy address to be created for the new billing account.
 */
var dummyAddress = {
    line1: "line1",
    line2: "line2",
    city: "city",
    countryNameId: 840,
    stateNameId: 7,
    zipCode: "06033"
};


/**
 * This variable holds a new client to be created.
 */
var newClient = {
    companyId: 1,
    paymentTermId: 1,
    status: 1,
    salestax: 0,
    durationInYears: 3
};

/**
 * Create a new client.
 * @param api - the api object.
 * @param connection - the connection object.
 * @param cb - the callback function.
 */
var createClient = function (api, connection, cb) {
    var dbConnectionMap = connection.dbConnectionMap;
    async.waterfall([
        function (cbx) {
            //No more validations. Generate the ids for the client, contact, address
            async.parallel({
                clientId: function (callback) {
                    api.idGenerator.getNextIDFromDb("CLIENT_SEQ", "time_oltp", dbConnectionMap, callback);
                },
                addressId: function (callback) {
                    api.idGenerator.getNextIDFromDb("ADDRESS_SEQ", "time_oltp", dbConnectionMap, callback);
                },
                contactId: function (callback) {
                    api.idGenerator.getNextIDFromDb("CONTACT_SEQ", "time_oltp", dbConnectionMap, callback);
                }
            }, cbx);
        },
        function (generatedIds, cbx) {
            _.extend(newClient, {
                clientId: generatedIds.clientId,
                userId: connection.caller.userId
            });
            _.extend(dummyContact, {
                contactId: generatedIds.contactId,
                userId: connection.caller.userId
            });
            _.extend(dummyAddress, {
                addressId: generatedIds.addressId,
                userId: connection.caller.userId
            });

            //Now save the new client, contact, address records
            //These are inserted all in parallel, as there are no dependencies between these records.
            async.parallel([
                function (callback) {
                    api.dataAccess.executeQuery("insert_client", newClient, dbConnectionMap, callback);
                }, function (callback) {
                    api.dataAccess.executeQuery("insert_contact", dummyContact, dbConnectionMap, callback);
                }, function (callback) {
                    api.dataAccess.executeQuery("insert_address", dummyAddress, dbConnectionMap, callback);
                }
            ], cbx);
        },
        function (notUsed, cbx) {
            //Now save the address_relation and contact_relation records
            var dummyAddressRelation = {
                entityId: newClient.clientId,
                addressTypeId: 2,
                addressId: dummyAddress.addressId,
                userId: connection.caller.userId
            },  dummyContactRelation = {
                entityId: newClient.clientId,
                contactTypeId: 2,
                contactId: dummyContact.contactId,
                userId: connection.caller.userId
            };
            async.parallel([
                function (callback) {
                    api.dataAccess.executeQuery("insert_contact_relation", dummyContactRelation, dbConnectionMap, callback);
                },
                function (callback) {
                    api.dataAccess.executeQuery("insert_address_relation", dummyAddressRelation, dbConnectionMap, callback);
                }
            ], cbx);
        }

    ], function (err) {
        cb(err);
    });

};

/**
 * Update a client
 * @param api - the api object.
 * @param connection - the connection object.
 * @param cb - the callback function.
 */
var updateClient = function (api, connection, cb) {
    api.dataAccess.executeQuery('update_client',
        {
            clientName: connection.params.name,
            userId: connection.caller.userId,
            customerNumber: connection.params.customerNumber
        }, connection.dbConnectionMap, function (err) {
            cb(err);
        });
};

/**
 * Get Track Statistics API.
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @param {Function} next - the callback function.
 * @since 1.3
 */
var getTrackStatistics = function (api, connection, next) {
    var helper = api.helper,
        sqlParams,
        result,
        queryName,
        track = connection.params.track.toLowerCase(),
        startDate = MIN_DATE,
        endDate = MAX_DATE;
    async.waterfall([
        function (cb) {
            var error = helper.checkContains(VALID_TRACK, track, 'track');

            if (!_.isUndefined(connection.params.startDate)) {
                startDate = connection.params.startDate;
                error = error || helper.validateDate(startDate, 'startDate', DATE_FORMAT);
            }
            if (!_.isUndefined(connection.params.endDate)) {
                endDate = connection.params.endDate;
                error = error || helper.validateDate(endDate, 'endDate', DATE_FORMAT);
            }
            if (!_.isUndefined(connection.params.startDate) && !_.isUndefined(connection.params.endDate)) {
                error = error || helper.checkDates(startDate, endDate);
            }

            cb(error);
        },
        function (cb) {
            sqlParams = {
                start_date: startDate,
                end_date: endDate
            };
            if (track === helper.software.community) {
                sqlParams.challenge_type = helper.software.category;
                queryName = 'get_develop_design_track_statistics';
            } else if (track === helper.studio.community) {
                sqlParams.challenge_type = helper.studio.category;
                queryName = 'get_develop_design_track_statistics';
            } else {
                queryName = 'get_data_track_statistics';
            }

            if (track === 'data') {
                async.parallel({
                    data: function (cbx) {
                        api.dataAccess.executeQuery(queryName, sqlParams, connection.dbConnectionMap, cbx);
                    },
                    pastData: function (cbx) {
                        api.dataAccess.executeQuery('get_past_data_track_statistics', sqlParams, connection.dbConnectionMap, cbx);
                    }
                }, cb);
            } else {
                api.dataAccess.executeQuery(queryName, sqlParams, connection.dbConnectionMap, cb);
            }
        },
        function (results, cb) {
            if (track === 'data') {
                result = helper.transferDBResults2Response(results.data)[0];
                result.numberOfChallengesInGivenTime += _.reduce(results.pastData, function (memo, num) { return memo + num; }, 0);
            } else {
                result = helper.transferDBResults2Response(results)[0];
            }
            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = result;
        }
        next(connection, true);
    });
};


/**
 * This is the function that actually get TC Direct Facts.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {Object} connection The connection object for the current request
 * @param {Object} dbConnectionMap The database connection map for the current request
 * @param {Function} next The callback to be called after this function is done
 */
var getTcDirectFacts = function (api, connection, dbConnectionMap, next) {
    api.dataAccess.executeQuery("tc_direct_facts", {}, dbConnectionMap, function (err, result) {
        api.log("Execute result returned", "debug");
        if (err) {
            api.helper.handleError(api, connection, err);
            next(connection, true);
        } else {
            api.log("Forward result", "debug");
            var data = result[0];
            connection.response = {
                activeContestsCount: data.active_contests_count,
                activeMembersCount: data.active_members_count,
                memberCount: data.member_count,
                activeProjectsCount: data.active_projects_count,
                completedProjectCount: data.completed_projects_count,
                prizePurse: data.prize_purse
            };
            next(connection, true);
        }

    });
};

/**
 * Handle the billing account permission api here.
 * @param {Object} api - the api object.
 * @param {Object} connection - the connection object.
 * @param {Function} next - the callback function.
 * @since 1.1
 */
function billingAccountsPermission(api, connection, next) {
    var helper = api.helper,
        billingAccountId = Number(connection.params.billingAccountId),
        caller = connection.caller,
        users,
        usersLowerCase,
        userHandles,
        dbConnectionMap = connection.dbConnectionMap,
        notExistHandle = [],
        userAccountIds = [],
        existHandle = [],
        newToUserAccount = [],
        result;

    // Get the users from request
    // filter the empty string since they make no sense.
    users = _.chain(connection.params.users.split(","))
        .map(function (item) { return item.trim(); })
        .uniq()
        .filter(function (item) { return item.length > 0; })
        .value();

    // Wrap the user handle with double quotation and transfer it to lowercase.
    userHandles = users.map(function (handle) { return '"' + handle.toLowerCase() + '"'; });
    usersLowerCase = users.map(function (handle) { return handle.toLowerCase(); });

    async.waterfall([
        function (cb) {
            var error = helper.checkIdParameter(billingAccountId, "billingAccountId") ||
                helper.checkAdmin(connection, "You need to login for this api.",
                    "You don't have enough authority to access this api.");

            if (users.length === 0) {
                error = error || new IllegalArgumentError("The users are all invalid.");
            }

            cb(error);
        },
        function (cb) {
            // Check billing account exist.
            api.dataAccess.executeQuery("check_billing_account_exist", { billingAccountId: billingAccountId },
                dbConnectionMap, cb);
        },
        function (res, cb) {
            if (res[0].count === 0) {
                // The billing account is not existed.
                cb(new BadRequestError("The billingAccountId does not exist in Topcoder system."));
            } else {
                cb();
            }
        },
        function (cb) {
            // Check user exists.
            api.dataAccess.executeQuery("get_user_handles", { users: userHandles }, dbConnectionMap, cb);
        }, function (res, cb) {
            existHandle = _.pluck(res, "handle_lower");
            notExistHandle = _.difference(usersLowerCase, existHandle);
            if (notExistHandle.length === usersLowerCase.length) {
                // All user are not existed in system. Return an error message for this circumstance.
                cb(new BadRequestError("All these users are not in topcoder system."));
                return;
            }

            var us = existHandle.map(function (handle) { return '"' + handle.toLowerCase() + '"'; });

            api.dataAccess.executeQuery("get_user_accounts", { users: us }, dbConnectionMap, cb);
        }, function (res, cb) {
            userAccountIds = _.pluck(res, "user_account_id");
            newToUserAccount = _.difference(existHandle, _.pluck(res, "handle"));

            // insert user into user_account table
            // insert dummy address contact also.
            async.each(newToUserAccount, function (handle, cbx) {
                var userAccountId, contact, address;
                async.waterfall([
                    function (callback) {
                        async.parallel({
                            userAccountId: function (next) {
                                api.idGenerator.getNextIDFromDb("USER_ACCOUNT_SEQ", "time_oltp", dbConnectionMap, next);
                            },
                            addressId: function (next) {
                                api.idGenerator.getNextIDFromDb("ADDRESS_SEQ", "time_oltp", dbConnectionMap, next);
                            },
                            contactId: function (next) {
                                api.idGenerator.getNextIDFromDb("CONTACT_SEQ", "time_oltp", dbConnectionMap, next);
                            }
                        }, callback);
                    },
                    function (ids, callback) {
                        userAccountId = ids.userAccountId;
                        // Add user account id into array so we can delete old entry for this billing account and user account.
                        // Also we need this user account id to insert new entry for this billing account.
                        userAccountIds.push(userAccountId);
                        contact = _.extend(_.clone(dummyContact), {
                            contactId: ids.contactId,
                            userId: caller.userId
                        });
                        address = _.extend(_.clone(dummyAddress), {
                            addressId: ids.addressId,
                            userId: caller.userId
                        });

                        async.parallel([
                            function (next) {
                                api.dataAccess.executeQuery("insert_user_account",
                                    { handle: handle, userAccountId: userAccountId, userId: caller.userId }, dbConnectionMap, next);
                            }, function (next) {
                                api.dataAccess.executeQuery("insert_contact", contact, dbConnectionMap, next);
                            }, function (next) {
                                api.dataAccess.executeQuery("insert_address", address, dbConnectionMap, next);
                            }
                        ], callback);
                    },
                    function (notUsed, callback) {
                        var dummyAddressRelation = {
                            entityId: userAccountId,
                            addressTypeId: 4,
                            addressId: address.addressId,
                            userId: caller.userId
                        },  dummyContactRelation = {
                            entityId: userAccountId,
                            contactTypeId: 4,
                            contactId: contact.contactId,
                            userId: caller.userId
                        };
                        async.parallel([
                            function (next) {
                                api.dataAccess.executeQuery("insert_contact_relation", dummyContactRelation,
                                    dbConnectionMap, next);
                            },
                            function (next) {
                                api.dataAccess.executeQuery("insert_address_relation", dummyAddressRelation,
                                    dbConnectionMap, next);
                            }
                        ], callback);
                    }
                ], cbx);
            }, cb);
        },
        function (cb) {
            // Delete all entry for current billing account and user account.
            // If there is no entry for account and user it doesn't matter, the query will simply delete 0 rows in database.
            api.dataAccess.executeQuery("delete_billing_account_entry",
                { billingAccountId: billingAccountId }, dbConnectionMap, function (err) {
                    cb(err);
                });
        },
        function (cb) {
            // insert new entry into project_manager table for users.
            async.each(userAccountIds, function (userAccountId, cbx) {
                api.dataAccess.executeQuery("insert_project_manager",
                    {
                        userAccountId: userAccountId,
                        billingAccountId: billingAccountId,
                        userId: caller.userId
                    }, dbConnectionMap, function (err) {
                        cbx(err);
                    });
            }, cb);
        },
        function (cb) {
            result = {
                success: existHandle,
                failed: notExistHandle
            };
            cb();
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

/**
 * The API for getting TC Direct Facts
 */
exports.tcDirectFacts = {
    name : "tcDirectFacts",
    description : "tcDirectFacts",
    inputs : {
        required : [],
        optional : []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    transaction : 'read', // this action is read-only
    databases : ['tcs_catalog'],
    run : function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute tcDirectFacts#run", 'debug');
            getTcDirectFacts(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * Track statistics API.
 *
 * @since 1.3
 */
exports.getTrackStatistics = {
    name: 'getTrackStatistics',
    description: 'getTrackStatistics',
    inputs: {
        required: ['track'],
        optional: ['startDate', 'endDate']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    cacheLifetime: 1000 * 60 * 60 * 24,
    databases: ['tcs_catalog', 'informixoltp', 'topcoder_dw'],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getTrackStatistics#run", 'debug');
            getTrackStatistics(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};


/**
 * The API for getting active billing accounts
 */
exports.getActiveBillingAccounts = {
    name: "getActiveBillingAccounts",
    description: "getActiveBillingAccounts",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read',
    databases: ["time_oltp"],
    cacheEnabled: false,
    run: function (api, connection, next) {
        api.log("Execute getActiveBillingAccounts#run", 'debug');
        var dbConnectionMap = connection.dbConnectionMap,
            helper = api.helper,
            result = {};
        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }
        async.waterfall([
            function (cb) {
                cb(helper.checkAdmin(connection));
            }, function (cb) {
                api.dataAccess.executeQuery("get_active_billing_accounts", {}, dbConnectionMap, cb);
            }, function (results, cb) {
                result.activeBillingAccounts = _.map(results, function (item) {
                    return {
                        "clientName": item.client_name,
                        "clientCustomerNumber": item.client_customer_number,
                        "clientId": item.client_id,
                        "billingAccountId": item.billing_account_id,
                        "billingAccountName": item.billing_account_name,
                        "subscriptionNumber": item.subscription_number,
                        "projectStartDate": item.project_start_date,
                        "projectEndDate": item.project_end_date,
                        "poNumber": item.po_number
                    };
                });
                cb();
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
 * Exports the function which will be used to create a new billing account
 * It expects customerNumber and billingAccountName as required parameters
 * It returns the generated projectId (called billingAccountId) in the response
 */
exports.createBilling = {
    name: "createBilling",
    description: "create new billing account",
    inputs: {
        required: ["customerNumber", "billingAccountName"],
        optional: ["startDate", "endDate", "billingAccountId", "active"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'write',
    cacheEnabled : false,
    databases : ["time_oltp"],
    run: function (api, connection, next) {
        api.log("Execute createBilling#run", 'debug');
        var helper = api.helper,
            customerNumber = connection.params.customerNumber,
            billingAccountName = connection.params.billingAccountName,
            startDate = connection.params.startDate,
            endDate = connection.params.endDate,
            projectId = connection.params.billingAccountId,
            active = connection.params.active || 1,
            dbConnectionMap = connection.dbConnectionMap,
            existingClientId,
            error;

        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }

        async.waterfall([
            function (cb) {
                //NOTE: actionhero automatically takes care of null and empty checks.
                //However it does not check for empty strings with only whitespace and control characters. So we check it ourselves.
                //But we only check those variables which will be used for inserting into DB (so customerNumber is not checked)

                //Check billingAccountName is not empty
                if (new S(billingAccountName).isEmpty()) {
                    cb(new IllegalArgumentError("billingAccountName cannot be empty."));
                    return;
                }

                //Check billingAccountName is not too long
                if (billingAccountName.length > 64) {
                    cb(new IllegalArgumentError("billingAccountName is too long."));
                    return;
                }

                // use 'current' if the startDate is not given
                if (!startDate) {
                    startDate = moment().format(DATE_FORMAT);
                }

                // user 'current+3 years' if the endDate is not given
                if (!endDate) {
                    endDate = moment().add('y', 3).format(DATE_FORMAT);
                }

                error = helper.validateDate(startDate, 'startDate', DATE_FORMAT)
                    || helper.validateDate(endDate, 'endDate', DATE_FORMAT)
                    || helper.checkContains(["0", "1"], active, 'active');
                if (error) {
                    cb(error);
                    return;
                }

                //Check if the user is logged-in
                if (connection.caller.accessLevel === "anon") {
                    cb(new UnauthorizedError("Authentication details missing or incorrect."));
                    return;
                }

                //Check that the user should be admin
                if (connection.caller.accessLevel !== "admin") {
                    cb(new ForbiddenError("Only admin members are allowed to create a new billing."));
                    return;
                }

                //Check for uniqueness of billingAccountName and existence of client with customer number
                _.extend(newBilling, {
                    billingAccountName: billingAccountName,
                    customerNumber: customerNumber,
                    startDate: startDate,
                    active: active,
                    endDate: endDate
                });
                async.parallel({
                    billing: function (cb) {
                        api.dataAccess.executeQuery("new_billing_validations", newBilling, dbConnectionMap, cb);
                    },
                    client: function (cb) {
                        api.dataAccess.executeQuery("existing_client_info", newBilling, dbConnectionMap, cb);
                    }
                }, function (err, data) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    if (!projectId && data.billing.length > 0) {
                        cb(new IllegalArgumentError("Billing with this name already exists."));
                        return;
                    }
                    if (data.client.length === 0) {
                        cb(new IllegalArgumentError("Client with this customer number must already exist but was not found."));
                        return;
                    }
                    existingClientId = data.client[0].client_id;
                    cb();
                });
            }, function (cb) {
                //No more validations. Generate the ids for the project, contact, address
                var parallels = {};
                if (!projectId) {
                    parallels.projectId = function (cb) {
                        api.idGenerator.getNextIDFromDb("PROJECT_SEQ", "time_oltp", dbConnectionMap, cb);
                    };
                    parallels.addressId = function (cb) {
                        api.idGenerator.getNextIDFromDb("ADDRESS_SEQ", "time_oltp", dbConnectionMap, cb);
                    };
                    parallels.contactId = function (cb) {
                        api.idGenerator.getNextIDFromDb("CONTACT_SEQ", "time_oltp", dbConnectionMap, cb);
                    };
                }
                async.parallel(parallels, cb);
            }, function (generatedIds, cb) {
                _.extend(newBilling, {
                    projectId: projectId || generatedIds.projectId,
                    userId: connection.caller.userId
                });

                //Now save the new billing, contact, address records
                //These are inserted all in parallel, as there are no dependencies between these records.
                var parallels = [function (cb) {
                    api.dataAccess.executeQuery(projectId ? "update_billing" : "insert_billing", newBilling, dbConnectionMap, cb);
                }];
                if (!projectId) {
                    _.extend(dummyContact, {
                        contactId: generatedIds.contactId,
                        userId: connection.caller.userId
                    });
                    _.extend(dummyAddress, {
                        addressId: generatedIds.addressId,
                        userId: connection.caller.userId
                    });
                    parallels.push(function (cb) {
                        api.dataAccess.executeQuery("insert_contact", dummyContact, dbConnectionMap, cb);
                    });
                    parallels.push(function (cb) {
                        api.dataAccess.executeQuery("insert_address", dummyAddress, dbConnectionMap, cb);
                    });
                }
                async.parallel(parallels, cb);
            }, function (notUsed, cb) {
                if (!projectId) {
                    //Now save the client_project, address_relation and contact_relation records (again in parallel)
                    var dummyAddressRelation = {
                        entityId: newBilling.projectId,
                        addressTypeId: 1,
                        addressId: dummyAddress.addressId,
                        userId: connection.caller.userId
                    }, dummyContactRelation = {
                        entityId: newBilling.projectId,
                        contactTypeId: 1,
                        contactId: dummyContact.contactId,
                        userId: connection.caller.userId
                    };
                    async.parallel([
                        function (cb) {
                            newBilling.clientId = existingClientId;
                            api.dataAccess.executeQuery("insert_client_project", newBilling, dbConnectionMap, cb);
                        },
                        function (cb) {
                            api.dataAccess.executeQuery("insert_contact_relation", dummyContactRelation, dbConnectionMap, cb);
                        },
                        function (cb) {
                            api.dataAccess.executeQuery("insert_address_relation", dummyAddressRelation, dbConnectionMap, cb);
                        }
                    ], cb);
                } else {
                    cb();
                }
            }
        ], function (err) {
            if (err) {
                helper.handleError(api, connection, err);
            } else {
                connection.response = {billingAccountId: newBilling.projectId};
            }
            next(connection, true);
        });
    }
};

/**
 * Exports the function which will be used to create a new customer
 * It expects name and customerNumber as required parameters
 * It returns the generated clientId in the response
 */
exports.createCustomer = {
    name: "createCustomer",
    description: "create new customer",
    inputs: {
        required: ["name", "customerNumber"],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'write',
    databases : ["time_oltp"],
    cacheEnabled : false,
    run: function (api, connection, next) {
        api.log("Execute createCustomer#run", 'debug');
        var helper = api.helper,
            customerName = connection.params.name,
            customerNumber = connection.params.customerNumber,
            dbConnectionMap = connection.dbConnectionMap;

        if (!dbConnectionMap) {
            helper.handleNoConnection(api, connection, next);
            return;
        }

        async.waterfall([
            function (cb) {
                //NOTE: actionhero automatically takes care of null and empty checks.
                //However it does not check for empty strings with only whitespace and control characters.
                //So we need to check that

                //Check name is not empty
                if (new S(customerName).isEmpty()) {
                    cb(new IllegalArgumentError("name cannot be empty."));
                    return;
                }

                //Check customer number is not empty
                if (new S(customerNumber).isEmpty()) {
                    cb(new IllegalArgumentError("customerNumber cannot be empty."));
                    return;
                }

                //Check name is not too long
                if (customerName.length > 64) {
                    cb(new IllegalArgumentError("Customer Name is too long."));
                    return;
                }

                //Check number is not too long
                if (customerNumber.length > 100) {
                    cb(new IllegalArgumentError("Customer Number is too long."));
                    return;
                }

                //Check if the user is logged-in
                if (connection.caller.accessLevel === "anon") {
                    cb(new UnauthorizedError("Authentication details missing or incorrect."));
                    return;
                }

                //Check that the user should be admin
                if (connection.caller.accessLevel !== "admin") {
                    cb(new ForbiddenError("Only admin members are allowed to create a new customer."));
                    return;
                }

                //Check for uniqueness of name and customer number
                _.extend(newClient, {
                    clientName: customerName,
                    customerNumber: customerNumber
                });
                api.dataAccess.executeQuery("new_client_validations", newClient, dbConnectionMap, cb);
            }, function (rows, cb) {
                if (rows.length > 0) {
                    if (rows.length === 1) {
                        if (rows[0].customer_number_exists) {
                            updateClient(api, connection, cb);
                        } else {
                            cb(new IllegalArgumentError("Client with this name already exists."));
                        }
                    } else {
                        cb(new IllegalArgumentError("Client with this name already linked with another customer number."));
                    }
                } else {
                    createClient(api, connection, cb);
                }
            }
        ], function (err) {
            if (err) {
                helper.handleError(api, connection, err);
            } else {
                connection.response = {clientId: newClient.clientId};
            }
            next(connection, true);
        });
    }
};

/**
 * The billing account permission api.
 * @since 1.1
 */
exports.billingAccountsPermission = {
    name: 'billingAccountsPermission',
    description: 'attach existing Billing Accounts with Users',
    inputs: {
        required: ["billingAccountId", "users"],
        optional: []
    },
    cacheEnabled : false,
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["time_oltp", "common_oltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute billingAccountsPermission#run", 'debug');
            billingAccountsPermission(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
