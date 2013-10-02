/*
 * Copyright (C) 2012 - 2013 TopCoder Inc., All Rights Reserved.
 *
 * PoC Assembly - TopCoder NodeJS Contests REST API - Part 2
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */

/*global require, module*/

/**
 * The winston logger object.
 */
var winston = require('../utils/logging');

/**
 * Used to invoke specific logger category for the database which will save logs to DB-access.log.
 */
var logger = winston.loggers.get('DB');

/**
 * The file system object.
 */
var fs = require('fs');

/**
 * The nodejs-db-informix object.
 */
var bindings = require("nodejs-db-informix");

/**
 * The database connection settings.
 */
var settings = JSON.parse(fs.readFileSync('./db_conf.json', 'utf8'));

module.exports = {

    /**
     * Method used to invoke all stored procedures on the DB.
     * @param  sprocedure Name of the procedure that is going to be executed
     * @param  spparams   Procedure parameters that are passed to the sprocedure procedure
     */
    runStoredProcedure: function (sprocedure, spparams, res, callback) {
        "use strict";
        logger.log("info", "Running Stored procedure");
        logger.log("info", "SP: " + sprocedure);

        var connection = new bindings.Informix(settings);
        connection.on('error', function (error) {
            logger.log("error", "Error: " + error);
        }).on('ready', function (server) {
            logger.log("info", "Connection ready to: " + JSON.stringify(server));
        }).connect(function (err) {
            if (err) {
                logger.log("error", "Could not connect to DB");
                throw new Error('Could not connect to DB');
            }
            logger.log("info", "Connected to db with: " + JSON.stringify(settings));
            logger.log("info", "isConnected() == " + connection.isConnected());
            var rs;
            rs = this.query("execute procedure " + sprocedure, spparams, callback, {
                start: function (q) {
                    logger.log("info", "START: " + JSON.stringify(q));
                },
                finish: function (f) {
                    logger.log("info", "FINISH: " + JSON.stringify(f));
                },
                async: false,
                cast: true
            }).execute();
            logger.log("info", "SQL query finished.");
            this.disconnect();
            logger.log("info", "Disconnected from db.");

        });
    }

};