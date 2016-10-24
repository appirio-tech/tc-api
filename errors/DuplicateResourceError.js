/*
 * Copyright (c) 2016 TopCoder, Inc. All rights reserved.
 */
"use strict";

/**
 * This file defines DuplicateResourceError
 *
 * @author TCSCODER
 * @version 1.0
 */

/**
 * Constructor of DuplicateResourceError
 * @param {Object} message the error message
 * @param {Object} cause the error cause
 */
var DuplicateResourceError = function (message, cause) {
    //captureStackTrace
    Error.call(this);
    Error.captureStackTrace(this);
    this.message = message || "DuplicateResource Error";
    this.cause = cause;
};

//use Error as prototype
require('util').inherits(DuplicateResourceError, Error);
DuplicateResourceError.prototype.name = 'DuplicateResource Error';

module.exports = DuplicateResourceError;
