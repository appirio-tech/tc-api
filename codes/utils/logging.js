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
 * Logging module used to log all the events in the system.
 */
var winston = require('winston');

/**
 * This will add separate logger for ContestsCategoriesController and save it under logs/ContestsCategoriesController.log
 */
winston.loggers.add('ContestsCategoriesController', {
    console: {
        level: 'info',
        colorize: 'true',
        label: 'ContestsCategoriesController'
    },
    file: {
        filename: 'logs/ContestsCategoriesController.log'
    }
});

/**
 * This will add separate logger for ContestsHTTPController and save it under logs/ContestsHTTPController.log
 */
winston.loggers.add('ContestsHTTPController', {
    console: {
        level: 'info',
        colorize: 'true',
        label: 'ContestsHTTPController'
    },
    file: {
        filename: 'logs/ContestsHTTPController.log'
    }
});

/**
 * This will add separate logger for databse operations and save it under logs/DB-access.log.log
 */
winston.loggers.add('DB', {
    console: {
        level: 'info',
        colorize: 'true',
        label: 'ContestsHTTPController'
    },
    file: {
        filename: 'logs/DB-access.log'
    }
});

module.exports = winston;