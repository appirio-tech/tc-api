/*
 * Copyright (c) 2014 TopCoder, Inc. All rights reserved.
 */
"use strict";

/**
 * This file defines ForbiddenError
 *
 * @author TCSASSEMBLER
 * @version 1.0
 */

/**
 * Constructor of ForbiddenError
 * @param {Object} message the error message
 * @param {Object} cause the error cause
 */
var ForbiddenError = function (message, cause) {
    //captureStackTrace
    Error.call(this);
    Error.captureStackTrace(this);
    this.message = message || "ForbiddenError Error";
    this.cause = cause;
};

//use Error as prototype
require('util').inherits(ForbiddenError, Error);
ForbiddenError.prototype.name = 'ForbiddenError Error';

module.exports = ForbiddenError;
