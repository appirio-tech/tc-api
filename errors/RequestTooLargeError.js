/*
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 */
"use strict";

/**
 * This file defines RequestTooLargeError
 *
 * @author kurtrips
 * @version 1.0
 */

/**
 * Constructor of RequestTooLargeError
 * @param {Object} message the error message
 * @param {Object} cause the error cause
 */
var RequestTooLargeError = function (message, cause) {
    //captureStackTrace
    Error.call(this);
    Error.captureStackTrace(this);
    this.message = message || "Request Too Large Error";
    this.cause = cause;
};

//use Error as prototype
require('util').inherits(RequestTooLargeError, Error);
RequestTooLargeError.prototype.name = 'Request Too Large Error';

module.exports = RequestTooLargeError;