/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author hesibo
 */
"use strict";

var async = require('async');
var _ = require('underscore');

var IllegalArgumentError = require("../errors/IllegalArgumentError");

/**
 * Represents a predefined list of valid sort column.
 */
var ALLOWABLE_SORT_COLUMN = ["description", "type", "createDate", "releaseDate", "paidDate", "status", "amount"];

/**
 * Represents a predefined map of valid sort column mapping to database column name.
 */
var SORT_COLUMN = {
    description : "description",
    type : "type",
    createdate : "date_create",
    releasedate : "release_date",
    paiddate : "paid_date",
    status : "status",
    amount : "amount"
};

/**
 * The date format for output date field.
 */
var OUTPUT_DATE_FORMAT = "MM/DD/YYYY";

/**
 * Checks whether given array is empty.
 *
 * @param obj - the object
 * @param objName - the object name
 * @return {Error} if invalid or null if valid.
 */
function checkEmptyArray(obj, objName) {
    if (obj.length === 0) {
        return new IllegalArgumentError("The " + objName + " parameter is incorrect.");
    }
    return null;
}

/**
 * Checks whether given string is empty when it is defined.
 *
 * @param obj - the string
 * @param objName - the string name
 * @return {Error} if invalid or null if valid.
 */
function checkString(obj, objName) {
    if (_.isDefined(obj) && obj.trim().length === 0) {
        return new IllegalArgumentError("The " + objName + " parameter should be no-empty string.");
    }
    return null;
}

/**
 * This function search payments and get payment summary.
 *
 * @param {Object} api - The api object that is used to access the global infrastructure
 * @param {Object} connection - The connection object for the current request
 * @param {Function<connection, render>} next - The callback to be called after this function is done
 */
var searchPayments = function (api, connection, next) {
    var error, i,
        helper = api.helper,
        pageIndex = Number(connection.params.pageIndex || 1),
        pageSize = Number(connection.params.pageSize || 10),
        status = connection.params.status,
        type = connection.params.type,
        sortColumn = (connection.params.sortColumn || "createDate").toLowerCase(),
        sortOrder = (connection.params.sortOrder || "asc").toLowerCase(),
        sqlParams = {},
        result = {},
        execQuery = function (name) {
            return function (cbx) {
                api.dataAccess.executeQuery(name, sqlParams, connection.dbConnectionMap, cbx);
            };
        };
    async.waterfall([
        function (cb) {
            sqlParams.paymentStatusIds = [];
            var id;
            for (id in helper.PAYMENT_STATUS) {
                if (helper.PAYMENT_STATUS.hasOwnProperty(id) && (_.isUndefined(status) || helper.PAYMENT_STATUS[id].toLowerCase() === status.toLowerCase())) {
                    sqlParams.paymentStatusIds.push(id);
                }
            }

            error = helper.checkPositiveInteger(pageIndex, "pageIndex")
                || helper.checkMaxInt(pageIndex, "pageIndex")
                || helper.checkPositiveInteger(pageSize, "pageSize")
                || helper.checkMaxInt(pageSize, "pageSize")
                || helper.checkMember(connection)
                || helper.checkContains(["asc", "desc"], sortOrder.toLowerCase(), "sortOrder")
                || helper.checkSortColumn(ALLOWABLE_SORT_COLUMN, sortColumn)
                || checkString(type, "type")
                || checkEmptyArray(sqlParams.paymentStatusIds, "status");
            if (error) {
                cb(error);
                return;
            }

            sqlParams.userId = connection.caller.userId;
            sqlParams.type = type;
            sqlParams.firstRowIndex =  (pageIndex - 1) * pageSize;
            sqlParams.pageSize = pageSize;
            sqlParams.sortColumn = SORT_COLUMN[sortColumn];
            sqlParams.sortOrder = sortOrder;

            async.parallel({
                count: _.isUndefined(type) ? execQuery("get_payment_count") : execQuery("get_payment_count_with_type"),
                payments: _.isUndefined(type) ? execQuery("get_payments") : execQuery("get_payments_with_type"),
                summary: execQuery("get_payment_summary")
            }, cb);
        },
        function (results, cb) {
            result.total = results.count[0].total;
            result.pageIndex = pageIndex;
            result.pageSize = pageSize;
            result.payments = _.map(results.payments, function (payment) {
                return {
                    description : payment.description.trim(),
                    type : payment.type,
                    createDate : helper.formatInformixDate(payment.date_create, OUTPUT_DATE_FORMAT),
                    releaseDate : helper.formatInformixDate(payment.release_date, OUTPUT_DATE_FORMAT),
                    paidDate : helper.formatInformixDate(payment.paid_date, OUTPUT_DATE_FORMAT) || "",
                    status : payment.status,
                    amount : payment.amount
                };
            });
            if (results.summary.length === 0) {
                result.summary = {
                    paid : 0
                };
            } else {
                result.summary = {};
            }
            results.summary.forEach(function (element) {
                var list = element.status.split(" ");
                for (i = 0; i < list.length; i = i + 1) {
                    list[i] = (i === 0 ? list[i].substr(0, 1).toLowerCase() : list[i].substr(0, 1).toUpperCase()) + list[i].substr(1);
                }
                result.summary[list.join("")] = element.sum;
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
};

/**
 * get payment list API.
 */
exports.getPaymentList = {
    "name": "getPaymentList",
    "description": "get payment list api",
    inputs: {
        required: [],
        optional: ["status", "type", "pageIndex", "pageSize", "sortColumn", "sortOrder"]
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction : 'read', // this action is read-only
    cacheEnabled : false,
    databases : ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute searchPayments#run", 'debug');
            searchPayments(api, connection, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
