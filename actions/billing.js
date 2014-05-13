/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author kurtrips
 */
"use strict";
/*jslint unparam: true */

var _ = require("underscore");
var async = require("async");
var moment = require('moment');
var S = require('string');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var ForbiddenError = require('../errors/ForbiddenError');

/**
 * The date format for input date parameter startDate and enDate.
 * Dates like 2014-01-29 and 2014-1-29 are valid
 */
var DATE_FORMAT = 'YYYY-M-D';

/*
 * This variable holds a new billing to be created.
 */
var newBilling = {
    companyId: 1,
    active: 1,
    poBoxNumber: 'null',
    paymentTermId: 1,
    salestax: 0,
    isManualPrizeSetting: 1
};

/*
 * This variable holds a dummy contact to be created for the new billing account.
 */
var dummyContact = {
    firstName: "fname",
    lastName: "lname",
    phone: "8675309",
    email: "tc@topcoder.com"
};

/*
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

/*
 * Exports the function which will be used to create a new billing account
 * It expects customerNumber and billingAccountName as required parameters
 * It returns the generated projectId (called billingAccountId) in the response
 */
exports.action = {
    name: "createBilling",
    description: "create new billing account",
    inputs: {
        required: ["customerNumber", "billingAccountName"],
        optional: ["startDate", "endDate", "billingAccountId"]
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

                if (startDate && endDate) {
                    error = helper.validateDate(startDate, 'startDate', DATE_FORMAT)
                        || helper.validateDate(endDate, 'endDate', DATE_FORMAT);
                    if (error) {
                        cb(error);
                        return;
                    }
                } else {
                    startDate = moment().format(DATE_FORMAT);
                    endDate = moment().add('y', 3).format(DATE_FORMAT);
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
                    if (data.billing.length > 0) {
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
                var parallels = {
                    addressId: function (cb) {
                        api.idGenerator.getNextIDFromDb("ADDRESS_SEQ", "time_oltp", dbConnectionMap, cb);
                    },
                    contactId: function (cb) {
                        api.idGenerator.getNextIDFromDb("CONTACT_SEQ", "time_oltp", dbConnectionMap, cb);
                    }
                };
                if (!projectId) {
                    parallels.projectId = function (cb) {
                        api.idGenerator.getNextIDFromDb("PROJECT_SEQ", "time_oltp", dbConnectionMap, cb);
                    };
                }
                async.parallel(parallels, cb);
            }, function (generatedIds, cb) {
                _.extend(newBilling, {
                    projectId: projectId || generatedIds.projectId,
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

                //Now save the new billing, contact, address records
                //These are inserted all in parallel, as there are no dependencies between these records.
                var parallels = [function (cb) {
                    api.dataAccess.executeQuery(projectId ? "update_billing" : "insert_billing", newBilling, dbConnectionMap, cb);
                }];
                if (!projectId) {
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
