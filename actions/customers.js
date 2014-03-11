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
var S = require('string');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var UnauthorizedError = require('../errors/UnauthorizedError');
var ForbiddenError = require('../errors/ForbiddenError');

/*
 * This variable holds a new client to be created.
 */
var newClient = {
    companyId: 1,
    paymentTermId: 1,
    status: 1,
    salestax: 0,
    durationInYears: 3
};

/*
 * This variable holds a dummy contact to be created for the new client.
 */
var dummyContact = {
    firstName: "fname",
    lastName: "lname",
    phone: "8675309",
    email: "tc@topcoder.com"
};

/*
 * This variable holds a dummy address to be created for the new client.
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
 * Exports the function which will be used to create a new customer
 * It expects name and customerNumber as required parameters
 * It returns the generated clientId in the response
 */
exports.action = {
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
                    if (rows[0].name_exists && rows[0].customer_number_exists) {
                        cb(new IllegalArgumentError("Client with this name and customer number already exists."));
                        return;
                    }
                    if (rows[0].name_exists) {
                        cb(new IllegalArgumentError("Client with this name already exists."));
                        return;
                    }
                    if (rows[0].customer_number_exists) {
                        cb(new IllegalArgumentError("Client with this customer number already exists."));
                        return;
                    }
                }

                //No more validations. Generate the ids for the client, contact, address
                async.parallel({
                    clientId: function (cb) {
                        api.idGenerator.getNextIDFromDb("CLIENT_SEQ", "time_oltp", dbConnectionMap, cb);
                    },
                    addressId: function (cb) {
                        api.idGenerator.getNextIDFromDb("ADDRESS_SEQ", "time_oltp", dbConnectionMap, cb);
                    },
                    contactId: function (cb) {
                        api.idGenerator.getNextIDFromDb("CONTACT_SEQ", "time_oltp", dbConnectionMap, cb);
                    }
                }, cb);
            }, function (generatedIds, cb) {
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
                    function (cb) {
                        api.dataAccess.executeQuery("insert_client", newClient, dbConnectionMap, cb);
                    }, function (cb) {
                        api.dataAccess.executeQuery("insert_contact", dummyContact, dbConnectionMap, cb);
                    }, function (cb) {
                        api.dataAccess.executeQuery("insert_address", dummyAddress, dbConnectionMap, cb);
                    }
                ], cb);
            }, function (notUsed, cb) {
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
                    function (cb) {
                        api.dataAccess.executeQuery("insert_contact_relation", dummyContactRelation, dbConnectionMap, cb);
                    },
                    function (cb) {
                        api.dataAccess.executeQuery("insert_address_relation", dummyAddressRelation, dbConnectionMap, cb);
                    }
                ], cb);
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
