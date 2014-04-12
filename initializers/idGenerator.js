/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.2
 * @author TCSASSEMBLER, Sky_, kurtrips
 * changes in 1.1:
 * - generated id by using sql SEQUENCE
 * changes in 1.2:
 * - added method to generate id from a sequence in any DB
 */

"use strict";
var async = require('async');
var fs = require('fs');

/**
 * The dir that store all the query used by tc api.
 */
var dir = './queries';
/**
 * The get next sequence query.
 */
var GET_NEXT_SEQUENCE = null;
/**
 * Get the query content from the file.
 */
fs.readFile(dir + '/get_next_sequence', 'utf8', function (err, sql) {
    GET_NEXT_SEQUENCE = sql;
});

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
//            api.log("Generate next id for sequence: " + idName + " in database: " + dbName, "debug");
//            api.dataAccess.executeQuery("get_next_sequence_" + dbName, {seq_name : idName}, dbConnectionMap, function (err, result) {
//                if (err) {
//                    api.log(err.message + "\n" + err.stack, "error");
//                    next(err);
//                    return;
//                }
//                next(null, result[0].next_id);
//            });

            api.log("Generate next id for sequence:" + idName + " in database: " + dbName, "debug");
            var connection = dbConnectionMap[dbName],
                error = api.helper.checkObject(connection, 'connection');
            if (error) {
                next(error);
                return;
            }

            if (connection.isConnected()) {
                async.waterfall([
                    function (cb) {
                        api.dataAccess._parameterizeQuery(GET_NEXT_SEQUENCE, { seq_name: idName }, cb);
                    },
                    function (query, cb) {
                        connection.query(query, cb, {
                            start: function (q) {
                                api.log('Start to execute ' + q, 'debug');
                            },
                            finish: function (f) {
                                api.log('Finish executing ' + f, 'debug');
                            }
                        }).execute();
                    }
                ], function (err, result) {
                    if (err) {
                        api.log(err.message + "\n" + err.stack, "error");
                        next(err);
                        return;
                    }
                    next(null, result[0].next_id);
                });
            }

        }
    };
    next();
};
