/*
 * Copyright (C) 2012 - 2013 TopCoder Inc., All Rights Reserved.
 *
 * PoC Assembly - TopCoder NodeJS Contests REST API - Part 2
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */

/*global ContestsHTTPController:true, require, module*/

var fs = require('fs');
var bindings = require("nodejs-db-informix");
var settings = JSON.parse(fs.readFileSync('./db_conf.json', 'utf8'));

/**
 * <p>
 * Creates a new instance of ContestsHTTPController class.
 * </p>
 *
 * @constructor
 * @class ContestsHTTPController
 *
 * Thread Safety: Thread safety is not a concern since JavaScript doesn't support multi-threading.
 *
 * @author TCSASSEMBLER
 * @version 1.0
 */
ContestsHTTPController = function () { 
    "use strict";

    /**
     * The winston logger object.
     * The DB object.
     */
    var winston = require('../utils/logging'),
        logger = winston.loggers.get('ContestsHTTPController'),
        DB = require('../utils/db');

    /**
     * Gets the contest data of the passed contest.
     * @param {Object} req the request object.
     * @param {Object} res the response object.
     * @param {Function} next the next handler.
     */
    this.getContestById = function (req, res, next) {
        logger.log("info", "Running getContestById");
        if (parseInt(req.params.id, 10).toString() !== req.params.id) {
            res.send({
                error: 'the id parameter is not an valid integer.'
            });
            return;
        }

        var spparams = [req.params.id];

        DB.runStoredProcedure("get_contest_data(?)", spparams, res, function (arg0, arg1) {
            logger.log("info", arguments);
            var a = arg0,
                b = arg1;
            if (a !== null) {
                res.send({});
            } else if (b !== null) {
                res.send(b);
            } else {
                res.send({
                    error: 'an error occurred during the operation.'
                });
            }
        }, next);
        logger.log("info", "Finished running getContestById");
    };



    /**
     * <p>
     * A private API to run the sql statement.
     * </p>
     *
     * @param {String} sql the sql statement.
     * @param {Object} res the response object.
     * @param {Function} callback the callback function.
     * @param {Function} next the next handler.
     */
    function runSql(sql, res, callback, next) {
        console.log("SQL: " + sql);

        // Create connection
        var connection = new bindings.Informix(settings);

        connection.on('error', function(error) {
            this.disconnect();
            next(error);
        }).connect(function(error) {
            if (error) {
                this.disconnect();
                next(error);
                return;
            }

            // Remove the 'select' keyword
            sql = sql.trim();
            if (sql.substring(0, 6).toLowerCase() === 'select') {
                sql = sql.substring(6);
            }

            // Run the query
            var rs = this.query(
                    "",
                    [],
                    callback,
                    {
                        async: false,
                        cast: true
                    })
                .select(sql)
                .execute();

            this.disconnect();
        });

        // Make sure the connection gone
        connection = null;
    }

    /**
     * <p>
     * This method will return the TopCoder Contest Types.
     * </p>
     *
     * @param {Object} req the request object.
     * @param {Object} res the response object.
     * @param {Function} next the next handler.
     */
    this.getContestTypes = function(req, res, next) {
        runSql('select project_category_id, project_type_id, name, description from project_category_lu', res, function () {
          console.log(arguments);

            if (arguments[0] !== null) {
                res.send({});
            } else if (arguments[1] !== null) {
              res.send(arguments[1]);
            } else {
                res.send({error: 'an error occurred during the operation.'});
            }
        }, next);
    };







};

module.exports = ContestsHTTPController;
