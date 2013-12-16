/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */

"use strict";

/**
 * The block size of the id_sequences sequences. It must match the existing value in the tc database.
 */
var idBlockSize = 10;

/**
 * Expose the "idGenerator" utility.
 *
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Function} next The callback function to be called when everyting is done
 */
exports.idGenerator = function (api, next) {
    api.idGenerator = {
        /**
         * Get the next value of an id sequence.
         * The result will be passed to the "next" callback. It is a number representing the next id value.
         *
         * @param {String} idName - the name of the id sequence
         * @param {Object} dbConnectionMap - The database connection map
         * @param {Function} next - The callback function
         */
        getNextID : function (idName, dbConnectionMap, next) {
            api.dataAccess.executeQuery("get_highest_id", {name : idName}, dbConnectionMap, function (err, result) {
                api.log("Execute result returned", "debug");
                if (err) {
                    api.log("Error occured: " + err + " " + (err.stack || ''), "error");
                } else {
                    api.log("Forward result", "debug");
                }

                var highest = result[0].highest;
                api.log("Current highest id for " + idName + " : " + highest, "debug");

                highest += idBlockSize;

                api.dataAccess.executeQuery("update_highest_id", {nextBlockStart : highest, name : idName}, dbConnectionMap, function (err, result) {
                    api.log("Execute result returned", "debug");
                    if (err) {
                        api.log("Error occured: " + err + " " + (err.stack || ''), "error");
                    } else {
                        api.log("Forward result", "debug");
                    }

                    api.log("Updated result: " + result, "debug");
                    next(err, highest);
                });
            });
        }
    };
    next();
};
