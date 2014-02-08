/*
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 */
'use strict';

/**
 * This file defines UnAuthorizedError
 *
 * @author TCSASSEMBLER
 * @version 1.0
 */

/**
 * Constructor of UnAuthorizedError
 * @param {Object} message the error message
 * @param {Object} cause the error cause
 */
var UnAuthorizedError = function (message, cause) {
    //captureStackTrace
    Error.call(this);
    Error.captureStackTrace(this);
    this.message = message || "UnAuthorized Error";
    this.cause = cause;
};

//use Error as prototype
require('util').inherits(UnAuthorizedError, Error);
UnAuthorizedError.prototype.name = 'UnAuthorized Error';

module.exports = UnAuthorizedError;
