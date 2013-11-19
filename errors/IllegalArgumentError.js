/*
 * Copyright (c) 2013 TopCoder, Inc. All rights reserved.
 */
"use strict";

/**
 * This file defines IllegalArgumentError
 *
 * @author Sky_
 * @version 1.0
 */

/**
 * Constructor of IllegalArgumentError
 * @param {Object} message the error message
 * @param {Object} cause the error cause
 */
var IllegalArgumentError = function (message, cause) {
    //captureStackTrace
    Error.call(this);
    Error.captureStackTrace(this);
    this.message = message || "IllegalArgument Error";
    this.cause = cause;
};

//use Error as prototype
require('util').inherits(IllegalArgumentError, Error);
IllegalArgumentError.prototype.name = 'IllegalArgument Error';

module.exports = IllegalArgumentError;
