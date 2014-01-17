/*
 * Copyright (c) 2013 TopCoder, Inc. All rights reserved.
 */
"use strict";

/**
 * This file defines BadRequestError
 *
 * @author Ghost_141
 * @version 1.0
 */

/**
 * Constructor of BadRequestError
 * @param {Object} message the error message
 * @param {Object} cause the error cause
 */
var BadRequestError = function (message, cause) {
    //captureStackTrace
    Error.call(this);
    Error.captureStackTrace(this);
    this.message = message || "BadRequest Error";
    this.cause = cause;
};

//use Error as prototype
require('util').inherits(BadRequestError, Error);
BadRequestError.prototype.name = 'BadRequest Error';

module.exports = BadRequestError;
