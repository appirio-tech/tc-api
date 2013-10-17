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
 * This will add separate logger for ContestsHTTPController and save it under logs/ContestsHTTPController.log
 */
winston.loggers.add('ContestsHTTPController', {
    console: {
        level: 'info',
        colorize: 'true',
        label: 'ContestsHTTPController'
    }
});


module.exports = winston;