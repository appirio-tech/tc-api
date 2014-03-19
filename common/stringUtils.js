/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.1
 * Author: TCSASSEMBLER, Ghost_141
 * Changes in 1.1:
 * - add PUNCTUATION and PASSWORD_ALPHABET.
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
 * The valid characters for punctuation.
 * @since 1.1
 */
var PUNCTUATION = "-_.{}[]()";

/**
 * The valid characters for password.
 * @since 1.1
 */
var PASSWORD_ALPHABET = ALPHABET_ALPHA_EN + ALPHABET_DIGITS_EN + PUNCTUATION;

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
exports.PUNCTUATION = PUNCTUATION;
exports.PASSWORD_ALPHABET = PASSWORD_ALPHABET;
