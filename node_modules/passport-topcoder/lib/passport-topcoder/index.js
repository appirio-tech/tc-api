/*jslint nomen: true*/
/*global require, exports, module*/
/*jslint nomen: false*/
"use strict";
/**
 * Module dependencies.
 */
var Strategy = require('./strategy');


/**
 * Framework version.
 */
require('pkginfo')(module, 'version');

/**
 * Expose constructors.
 */
exports.Strategy = Strategy;