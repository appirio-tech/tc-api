/*
 * Copyright (C) 2012 - 2013 TopCoder Inc., All Rights Reserved.
 *
 * PoC Assembly - TopCoder NodeJS Contests REST API - Part 2
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */

/*global ContestsHTTPController:true, require, module*/

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

};

module.exports = ContestsHTTPController;