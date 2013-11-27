/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */

"use strict";

/*
 * Constants for checking a string only contains certain alphabets
 */
var ALPHABET_ALPHA_UPPER_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

var ALPHABET_ALPHA_LOWER_EN = "abcdefghijklmnopqrstuvwxyz";

var ALPHABET_ALPHA_EN = ALPHABET_ALPHA_LOWER_EN + ALPHABET_ALPHA_UPPER_EN;

var ALPHABET_DIGITS_EN = "0123456789";

/**
 * Checks if string has all its characters in alphabet given.
 *
 * @param {String} string String to be tested
 * @param {String} alphabet Alphabet to match
 * @return {boolean} true if string supplied matches the rules and false
 *         otherwise
 */
exports.containsOnly = function (string, alphabet) {
    var i, ch, foundAt;
    for (i = 0; i < string.length; i += 1) {
        ch = string.charAt(i);
        foundAt = alphabet.indexOf(ch);
        if (foundAt < 0) {
            return false;
        }
    }

    return true;
};

exports.ALPHABET_ALPHA_UPPER_EN = ALPHABET_ALPHA_UPPER_EN;
exports.ALPHABET_ALPHA_LOWER_EN = ALPHABET_ALPHA_LOWER_EN;
exports.ALPHABET_ALPHA_EN = ALPHABET_ALPHA_EN;
exports.ALPHABET_DIGITS_EN = ALPHABET_DIGITS_EN;