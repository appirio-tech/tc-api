/*
 * Copyright (C) 2012 - 2013 TopCoder Inc., All Rights Reserved.
 *
 * PoC Assembly - TopCoder NodeJS Contests REST API - Part 2
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */

/*global ContestsCategoriesController:true, require, module*/

/**
 * <p>
 * Creates a new instance of ContestsCategoriesController class.
 * </p>
 *
 * @constructor
 * @class ContestsCategoriesController
 *
 * Thread Safety: Thread safety is not a concern since JavaScript doesn't support multi-threading.
 *
 * @author TCSASSEMBLER
 * @version 1.0
 */
ContestsCategoriesController = function () {
    "use strict";

    /**
     * The winston logger object.
     * The DB object.
     */
    var winston = require('../utils/logging'),
        logger = winston.loggers.get('ContestsCategoriesController'),
        DB = require('../utils/db');

    /**
     * Gets all of the contest categories.
     * @param {Object} req the request object.
     * @param {Object} res the response object.
     * @param {Function} next the next handler.
     */
    this.getContestCategories = function (req, res, next) {
        logger.log("info", "Running getContestCategories");

        var spparams = [];

        DB.runStoredProcedure("getall_cat()", spparams, res, function (arg0, arg1) {
            logger.log("info", arguments);
            if (arg0 !== null) {
                res.send({});
            } else if (arg1 !== null) {
                res.send(arg1);
            } else {
                logger.log("error", "An error occurred during the operation.");
                res.send({
                    error: 'An error occurred during the operation.'
                });
            }
        }, next);
        logger.log("info", "Finished running getContestCategories");
    };

    /**
     * Gets contest category based on passed parameter.
     * @param {Object} req the request object.
     * @param {Object} res the response object.
     * @param {Function} next the next handler.
     */
    this.getContestCategoryById = function (req, res, next) {
        logger.log("info", "Running getContestCategoryById + id = " + req.params.id);

        if (parseInt(req.params.id, 10).toString() !== req.params.id) {
            res.send({
                error: 'the id parameter is not an valid integer.'
            });
            return;
        }

        var spparams = [parseInt(req.params.id, 10)];

        DB.runStoredProcedure("get_cat(?)", spparams, res, function (arg0, arg1) {
            logger.log("info", arguments);

            if (arg0 !== null) {
                res.send({});
            } else if (arg1 !== null) {
                res.send(arg1);
            } else {
                res.send({
                    error: 'an error occurred during the operation.'
                });
            }
        }, next);
        logger.log("info", "Finished running getContestCategoryById");
    };

    /**
     * Performs insert operation on contest category table in the DB based on passed ID.
     * @param {Object} req the request object.
     * @param {Object} res the response object.
     * @param {Function} next the next handler.
     */
    this.createContestCategory = function (req, res, next) {
        logger.log("info", "Running createContestCategory");

        if (parseInt(req.param('ins_project_category_id'), 10).toString() !== req.param('ins_project_category_id')) {
            res.send({
                error: 'the ins_project_category_id parameter is not an valid integer.'
            });
            return;
        }

        var spparams = [
                parseInt(req.param('ins_project_category_id'), 10), parseInt(req.param('ins_project_type_id'), 10), req.param('ins_name'), req.param('ins_description'), req.param('ins_create_user'), req.param('ins_create_date'), req.param('ins_modify_user'), req.param('ins_modify_date'), parseInt(req.param('ins_display'), 10), parseInt(req.param('ins_display_order'), 10), parseInt(req.param('ins_project_catalog_id'), 10), req.param('ins_version')];

        DB.runStoredProcedure("ins_cat(?,?,?,?,?,?,?,?,?,?,?,?)", spparams, res, function (arg0, arg1) {
            logger.log("info", arguments);

            if (arg0 !== null) {
                res.send('If did not exist - created new category. Go back, try to select it.');
            } else if (arg1 !== null) {
                res.send(arg1);
            } else {
                res.send({
                    error: 'an error occurred during the operation.'
                });
            }
        }, next);
        logger.log("info", "Finished running createContestCategory");
    };

    /**
     * Performs update operation on contest category table in the DB based on passed ID.
     * @param {Object} req the request object.
     * @param {Object} res the response object.
     * @param {Function} next the next handler.
     */
    this.updateContestCategory = function (req, res, next) {

        logger.log("info", "Running updateContestCategory");

        if (parseInt(req.param('upd_project_category_id'), 10).toString() !== req.param('upd_project_category_id')) {
            res.send({
                error: 'the id parameter is not an valid integer.'
            });
            return;
        }

        var spparams = [
            parseInt(req.param('upd_project_category_id'), 10), parseInt(req.param('upd_project_type_id'), 10), req.param('upd_name'), req.param('upd_description'), req.param('upd_create_user'), req.param('upd_create_date'), req.param('upd_modify_user'), req.param('upd_modify_date'), parseInt(req.param('upd_display'), 10), parseInt(req.param('upd_display_order'), 10), parseInt(req.param('upd_project_catalog_id'), 10), req.param('upd_version')];

        DB.runStoredProcedure("upd_cat(?,?,?,?,?,?,?,?,?,?,?,?)", spparams, res, function (arg0, arg1) {
            logger.log("info", arguments);

            if (arg0 !== null) {
                res.send("If existed and no constricts - updated category. Go back, try to select it.");
            } else if (arg1 !== null) {
                res.send(arg1);
            } else {
                res.send({
                    error: 'an error occurred during the operation.'
                });
            }
        }, next);
        logger.log("info", "Finished running updateContestCategory");
    };

    /**
     * Performs delete operation on contest category table in the DB based on passed ID.
     * @param {Object} req the request object.
     * @param {Object} res the response object.
     * @param {Function} next the next handler.
     */
    this.deleteContestCategory = function (req, res, next) {
        logger.log("info", "Running deleteContestCategory");

        if (parseInt(req.params.id, 10).toString() !== req.params.id) {
            res.send({
                error: 'the id parameter is not an valid integer.'
            });
            return;
        }
        var spparams = [parseInt(req.params.id, 10)];

        DB.runStoredProcedure("del_cat(?)", spparams, res, function (arg0, arg1) {
            logger.log("info", arguments);

            if (arg0 !== null) {
                res.send("If existed and no constricts - deleted category. Go back, try to select it.");
            } else if (arg1 !== null) {
                res.send(arg1);
            } else {
                res.send({
                    error: 'an error occurred during the operation.'
                });
            }
        }, next);
        logger.log("info", "Finished running deleteContestCategory");
    };

};

module.exports = ContestsCategoriesController;