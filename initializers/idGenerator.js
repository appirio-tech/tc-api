/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.2
 * @author TCSASSEMBLER, Sky_, kurtrips
 * changes in 1.1:
 * - generated id by using sql SEQUENCE
 * changes in 1.2:
 * - added method to generate id from a time_oltp sequence
 */

"use strict";
var async = require('async');


/**
 * Expose the "idGenerator" utility.
 *
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Function} next The callback function to be called when everyting is done
 */
exports.idGenerator = function (api, next) {
    api.idGenerator = {
        /**
         * Get the next value of an id sequence from common_oltp (the default location for all sequences in the TC database)
         * The result will be passed to the "next" callback. It is a number representing the next id value.
         *
         * @param {String} idName - the name of the id sequence
         * @param {Object} dbConnectionMap - The database connection map
         * @param {Function} next - The callback function
         */
        getNextID : function (idName, dbConnectionMap, next) {
            api.log("Generate next id for sequence:" + idName, "debug");
            api.dataAccess.executeQuery("get_next_sequence", {seq_name : idName}, dbConnectionMap, function (err, result) {
                if (err) {
                    api.log(err.message + "\n" + err.stack, "error");
                    next(err);
                    return;
                }
                next(null, result[0].next_id);
            });
        },

        /**
         * Get the next value of an id sequence from the given DB.
         * The result will be passed to the "next" callback. It is a number representing the next id value.
         *
         * @param {String} idName - the name of the id sequence
         * @param {String} dbName - the name of the database where sequence resides
         * @param {Object} dbConnectionMap - The database connection map
         * @param {Function} next - The callback function
         * @since 1.2
         */
        getNextIDFromDb : function (idName, dbName, dbConnectionMap, next) {
            api.log("Generate next id for sequence: " + idName + " in database: " + dbName, "debug");
            api.dataAccess.executeQuery("get_next_sequence_" + dbName, {seq_name : idName}, dbConnectionMap, function (err, result) {
                if (err) {
                    api.log(err.message + "\n" + err.stack, "error");
                    next(err);
                    return;
                }
                next(null, result[0].next_id);
            });
        }
    };
    next();
};
