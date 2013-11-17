/*
 * Copyright (c) 2013 TopCoder, Inc. All rights reserved.
 */
"use strict";

/**
 * This file defines NotFoundError
 *
 * @author Sky_
 * @version 1.0
 */

/**
 * Constructor of NotFoundError
 * @param {Object} message the error message
 * @param {Object} cause the error cause
 */
var NotFoundError = function (message, cause) {
    //captureStackTrace
    Error.call(this);
    Error.captureStackTrace(this);
    this.message = message || "NotFoundError Error";
    this.cause = cause;
};

//use Error as prototype
require('util').inherits(NotFoundError, Error);
NotFoundError.prototype.name = 'NotFoundError Error';

module.exports = NotFoundError;
