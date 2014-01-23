/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author TCSASSEMBLER, Sky_
 * changes in 1.1:
 * - generated id by using sql SEQUENCE
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
         * Get the next value of an id sequence.
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
        }
    };
    next();
};
