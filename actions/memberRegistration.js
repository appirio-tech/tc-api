/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author mekanizumu, Sky_
 * changes in 1.1:
 * - disable cache for member register action
 */
"use strict";

/*jslint unparam: true */

/**
 * Module dependencies.
 */
var async = require("async");
var stringUtils = require("../common/stringUtils.js");
var bcrypt = require('bcrypt');
var bigdecimal = require("bigdecimal");
var bignum = require("bignum");

/**
 * The max surname length
 */
var MAX_SURNAME_LENGTH = 64;

/**
 * The max given name length
 */
var MAX_GIVEN_NAME_LENGTH = 64;

/**
 * The max social user name length
 */
var MAX_SOCIAL_USER_NAME_LENGTH = 100;

/**
 * The max email length
 */
var MAX_EMAIL_LENGTH = 100;

/**
 * The max handle length
 */
var MAX_HANDLE_LENGTH = 15;

/**
 * The min handle length
 */
var MIN_HANDLE_LENGTH = 2;

/**
 * The punctuations allowed in the handle
 */
var HANDLE_PUNCTUATION = "-_.{}[]";

/**
 * The alphabets the handle can contain
 */
var HANDLE_ALPHABET = stringUtils.ALPHABET_ALPHA_EN + stringUtils.ALPHABET_DIGITS_EN + HANDLE_PUNCTUATION;

/**
 * Constant for http response codes
 */
var apiCodes = {badRequest : 400, serverError : 500};

/**
 * The regular expression for email
 */
var emailPattern = new RegExp("\\b(^[_A-Za-z0-9-]+(\\.[_A-Za-z0-9-]+)*@([A-Za-z0-9-])+((\\.com)"
        + "|(\\.net)|(\\.org)|(\\.info)|(\\.edu)|(\\.mil)|(\\.gov)|(\\.biz)|(\\.ws)|(\\.us)|(\\.tv)|(\\.cc)"
        + "|(\\.aero)|(\\.arpa)|(\\.coop)|(\\.int)|(\\.jobs)|(\\.museum)|(\\.name)|(\\.pro)|(\\.travel)|(\\.nato)"
        + "|(\\..{2,3})|(\\.([A-Za-z0-9-])+\\..{2,3}))$)\\b");

/**
 * The patterns for checking invalid handle
 */
var INVALID_HANDLE_PATTERNS = ["(.*?)es", "(.*?)s", "_*(.*?)_*"];

/**
 * Anonymous group id.
 */
var ANONYMOUS_GROUP_ID = 2000118;

/**
 * Users group id.
 */
var USERS_GROUP_ID = 2;

/**
 * The activation email subject.
 */
var activationEmailSubject = "Topcoder User Registration Activation";

/**
 * The activation email sender name.
 */
var activationEmailSenderName = "Topcoder API";

/**
 * this is the random int generator class
 */
function codeRandom(coderId) {
    var cr = {};
    var multiplier = 0x5DEECE66D;
    var addend = 0xB;
    var mask = 281474976710655;
    cr.seed = bignum(coderId).xor(multiplier).and(mask);
    cr.nextInt = function() {
        var oldseed = cr.seed,
            nextseed;
            do {
                nextseed = oldseed.mul(multiplier).add(addend).and(mask);
            } while (oldseed.toNumber() === nextseed.toNumber());
            cr.seed = nextseed;
        return nextseed.shiftRight(16).toNumber();
    }

    return cr;
}

/**
 * get the code string by coderId
 * @param coderId  the coder id of long type.
 * @return the coder id generated hash string.
 */
function getCode(coderId) {
    var r = codeRandom(coderId);
    var nextBytes = function(bytes) {
        for (var i = 0, len = bytes.length; i < len;)
            for (var rnd = r.nextInt(), n = Math.min(len - i, 4); n-- > 0; rnd >>= 8) {
                var val = rnd & 0xff;
                if (val > 127) {
                    val = val - 256;
                }
                bytes[i++] = val;
            }
    };
    var randomBits = function(numBits) {
        if (numBits < 0)
            throw new Error("numBits must be non-negative");
        var numBytes = Math.floor((numBits + 7) / 8); // avoid overflow
        var randomBits = new Int8Array(numBytes);

        // Generate random bytes and mask out any excess bits
        if (numBytes > 0) {
            nextBytes(randomBits);
            var excessBits = 8 * numBytes - numBits;
            randomBits[0] &= (1 << (8 - excessBits)) - 1;
        }
        return randomBits;
    }
    var id = coderId + "";
    var baseHash = bignum(new bigdecimal.BigInteger("TopCoder", 36));
    var len = coderId.toString(2).length;
    var arr = randomBits(len);
    var bb = bignum.fromBuffer(new Buffer(arr));
    var hash = bb.add(baseHash).toString();
    while (hash.length < id.length) {
        hash = "0" + hash;
    }
    hash = hash.substring(hash.length - id.length);
    var result = new bigdecimal.BigInteger(id + hash);
    result = result.toString(36).toUpperCase();
    return result;
}

/**
 * Register a new user.
 * The result will be passed to the "next" callback.
 *
 * @param {Object} user - the user to register. It contains the same properties as connection.params of memberRegister action.
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Object} dbConnectionMap - The database connection map
 * @param {Function} next - The callback function
 */
var registerUser = function (user, api, dbConnectionMap, next) {
    var activationCode;
    // Get the next user id
    api.idGenerator.getNextID("USER_SEQ", dbConnectionMap, function (err, result) {
        if (err) {
            next(err);
        } else {
            user.id = result;
            // perform a series of insert
            async.series([
                function (callback) {
                    var status = user.socialProviderId !== null && user.socialProviderId !== undefined ? 'A' : 'U';
                    // use user id as activation code for now
                    activationCode = getCode(user.id);
                    api.dataAccess.executeQuery("insert_user", {userId : user.id, firstName : user.firstName, lastName : user.lastName, handle : user.handle, status : status, activationCode : activationCode, regSource : 'api'}, dbConnectionMap, function (err, result) {
                        callback(err, result);
                    });
                },
                function (callback) {
                    var url, task;
                    // if social data is present, insert social data
                    if (user.socialProviderId !== null && user.socialProviderId !== undefined) {
                        api.dataAccess.executeQuery("insert_social_account", {userId : user.id, socialLoginProviderId : user.socialProviderId, socialUserName : user.socialUserName, socialEmail : user.socialEmail, socialEmailVerified : user.socialEmailVerified}, dbConnectionMap, function (err, result) {
                            callback(err, result);
                        });
                    } else {
                        url = process.env.TC_ACTIVATION_SERVER_NAME + '/reg2/activate.action?code=' + activationCode;
                        api.log("Activation url: " + url, "debug");
                        task = new api.task({
                            name: "sendActivationEmail",
                            params: {subject : activationEmailSubject, activationCode : activationCode, template : 'activation_email', toAddress : user.email, fromAddress : process.env.TC_EMAIL_ACCOUNT, senderName : activationEmailSenderName, url : url}
                        });

                        task.run();

                        callback(null, null);
                    }
                },
                function (callback) {
                    api.dataAccess.executeQuery("insert_coder", {coderId : user.id, compCountryCode : user.country}, dbConnectionMap, function (err, result) {
                        callback(err, result);
                    });
                },
                function (callback) {
                    var task = new api.task({
                        name: "addMemberProfileLDAPEntry",
                        params: {userId : user.id, handle : user.handle, password : user.password}
                    });

                    task.run();

                    async.waterfall([
                        function (callback) {
                            // hash the password
                            bcrypt.genSalt(10, function (err, salt) {
                                callback(err, salt);
                            });
                        },
                        function (salt, callback) {
                            bcrypt.hash(user.password, salt, function (err, hash) {
                                callback(err, hash);
                            });
                        },
                        function (hash, callback) {
                            // insert with the hash password
                            api.dataAccess.executeQuery("insert_security_user", {loginId : user.id, userId : user.handle, password : hash, createUserId : null}, dbConnectionMap, function (err, result) {
                                callback(err, result);
                            });
                        }
                    ], function (err, result) {
                        callback(err, result);
                    });
                },
                function (callback) {
                    async.waterfall([
                        function (callback) {
                            // get the next email id
                            api.idGenerator.getNextID("EMAIL_SEQ", dbConnectionMap, function (err, emailId) {
                                callback(err, emailId);
                            });
                        },
                        function (emailId, callback) {
                            // insert email
                            api.dataAccess.executeQuery("insert_email", {userId : user.id, emailId : emailId, address : user.email}, dbConnectionMap, function (err, result) {
                                callback(err, result);
                            });
                        }
                    ], function (err, result) {
                        callback(err, result);
                    });
                },
                function (callback) {
                    async.waterfall([
                        function (callback) {
                            // get the next user group id
                            api.idGenerator.getNextID("USER_GROUP_SEQ", dbConnectionMap, function (err, userGroupId) {
                                callback(err, userGroupId);
                            });
                        },
                        function (userGroupId, callback) {
                            // insert user group relation for USERS_GROUP_ID
                            api.dataAccess.executeQuery("add_user_to_groups", {userGroupId : userGroupId, loginId : user.id, groupId : USERS_GROUP_ID}, dbConnectionMap, function (err, result) {
                                callback(err, result);
                            });
                        }
                    ], function (err, result) {
                        callback(err, result);
                    });
                },
                function (callback) {
                    async.waterfall([
                        function (callback) {
                            // get the next user group id
                            api.idGenerator.getNextID("USER_GROUP_SEQ", dbConnectionMap, function (err, userGroupId) {
                                callback(err, userGroupId);
                            });
                        },
                        function (userGroupId, callback) {
                            // insert user group relation for ANONYMOUS_GROUP_ID
                            api.dataAccess.executeQuery("add_user_to_groups", {userGroupId : userGroupId, loginId : user.id, groupId : ANONYMOUS_GROUP_ID}, dbConnectionMap, function (err, result) {
                                callback(err, result);
                            });
                        }
                    ], function (err, result) {
                        callback(err, result);
                    });
                }
            ],
                // This is called when all above operations are done or any error occurs
                function (err, result) {
                    api.log("The result of the last callback is " + result, "debug");

                    // passes along the user id
                    next(err, user.id);
                });
        }
    });
};

/**
 * Check if a handle exists.
 * The result will be passed to the "next" callback. It's true if the handle exists, false otherwise.
 *
 * @param {String} handle - handle to check
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Object} dbConnectionMap - The database connection map
 * @param {Function} next - The callback function
 */
var userHandleExist = function (handle, api, dbConnectionMap, next) {
    api.dataAccess.executeQuery("check_user_handle_exist", {handle : handle}, dbConnectionMap, function (err, result) {
        if (err) {
            next(err);
        } else {
            if (result[0] === null || result[0] === undefined) {
                next(null, false);
            } else {
                next(null, result[0].handleexist > 0);
            }
        }
    });
};

/**
 * Checks whether given handle exactly matches invalid handle in persistence.
 * The result will be passed to the "next" callback. It's true if the handle matches any invalid handle.
 *
 * @param {String} handle - the handle to check
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Object} dbConnectionMap - The database connection map
 * @param {Function} next - The callback function
 */
var isExactInvalidHandle = function (handle, api, dbConnectionMap, next) {
    api.dataAccess.executeQuery("check_invalid_handle", {invalidHandle : handle}, dbConnectionMap, function (err, result) {
        api.log("Execute result returned", "debug");
        if (err) {
            api.log("Error occured: " + err + " " + (err.stack || ''), "error");
            next(err);
        } else {
            if (result[0] === null || result[0] === undefined) {
                next(null, null);
            } else {
                next(null, result[0].count > 0);
            }
        }
    });
};

/**
 * Checks whether given email already exists.
 * The result will be passed to the "next" callback. It's true if the email already exists.
 *
 * @param {String} email - the email to check
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Object} dbConnectionMap - The database connection map
 * @param {Function} next - The callback function
 */
var isEmailAvailable = function (email, api, dbConnectionMap, next) {
    api.dataAccess.executeQuery("get_email_availability", {address : email}, dbConnectionMap, function (err, result) {
        api.log("Execute result returned", "debug");
        if (err) {
            api.log("Error occured: " + err + " " + (err.stack || ''), "error");
            next(err);
        } else {
            api.log("Forward email availability result", "debug");

            if (result[0] === null || result[0] === undefined) {
                next(null, true);
            } else {
                next(null, result[0].notavailable === 0);
            }
        }
    });
};

/**
 * Checks whether given country name is valid.
 * The result will be passed to the "next" callback. It's true if the country name is valid.
 *
 * @param {String} countryName - the country name to check
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Object} dbConnectionMap - The database connection map
 * @param {Function} next - The callback function
 */
var isCountryNameValid = function (countryName, api, dbConnectionMap, next) {
    api.dataAccess.executeQuery("check_country_name", {countryName : countryName}, dbConnectionMap, function (err, result) {
        api.log("Execute result returned", "debug");
        if (err) {
            api.log("Error occured: " + err + " " + (err.stack || ''), "error");
            next(err);
        } else {
            api.log("Forward email availability result", "debug");
            if (result[0] === null || result[0] === undefined) {
                next(null, false);
            } else {
                next(null, result[0].count > 0);
            }
        }
    });
};

/**
 * Checks whether given social provider id is valid.
 * The result will be passed to the "next" callback. It's true if the social provider id is valid.
 *
 * @param {String} socialProviderId - the social provider id to check
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Object} dbConnectionMap - The database connection map
 * @param {Function} next - The callback function
 */
var isSoicalProviderIdValid = function (socialProviderId, api, dbConnectionMap, next) {
    api.dataAccess.executeQuery("check_social_provider_id", {socialLoginProviderId : socialProviderId}, dbConnectionMap, function (err, result) {
        api.log("Execute result returned", "debug");
        if (err) {
            api.log("Error occured: " + err + " " + (err.stack || ''), "error");
            next(err);
        } else {
            if (result[0] === null || result[0] === undefined) {
                next(null, false);
            } else {
                next(null, result[0].count > 0);
            }
        }
    });
};

/**
 * Check if a string is null or empty.
 *
 * @param {String} s The string to check
 * @return {boolean} true if the string is null or empty
 */
var isNullOrEmptyString = function (s) {
    return s === null || s === undefined || s.trim().length === 0;
};

/**
 * Check the handle's validness removing leading and trailing numbers.
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {String} handle The handle to check
 * @param {Array} checkedHandles The handles that are already checked
 * @param {Object} dbConnectionMap The database connection object
 * @param {Function} next The callback to be called after this function is done, the result parameter will be true if the handle is invalid.
 */
var checkLeadingTrailingNumbers = function (api, handle, checkedHandles, dbConnectionMap, next) {
    var head = 0, tail = handle.length - 1, totalCombinations = 0, checked = 0, error = null, valid = true, i, j, extractedHandle, extractedHandles, isExactInvalidHandleCallback;
    // find heading and trailing digits count
    while (head < handle.length && stringUtils.containsOnly(handle.charAt(head), stringUtils.ALPHABET_DIGITS_EN)) {
        head += 1;
    }

    if (head >= handle.length) {
        head = handle.length - 1;
    }

    while (tail >= 0 && stringUtils.containsOnly(handle.charAt(tail), stringUtils.ALPHABET_DIGITS_EN)) {
        tail -= 1;
    }
    if (tail < 0) {
        tail = 0;
    }

    extractedHandles = [];

    // remove all possible heading and trailing digits
    for (i = 0; i <= head; i += 1) {
        for (j = handle.length; j > tail && j > i; j -= 1) {
            extractedHandle = handle.substring(i, j);
            if (extractedHandles.indexOf(extractedHandle) === -1 && checkedHandles.indexOf(extractedHandle) === -1) {
                totalCombinations += 1;
                extractedHandles.push(extractedHandle);
            }
        }
    }

    checkedHandles = checkedHandles.concat(extractedHandles);

    if (extractedHandles.length === 0) {
        next(null, false);
        return;
    }

    isExactInvalidHandleCallback = function (err, result) {
        if (err) {
            error = err;
        } else {
            checked += 1;
            if (result) {
                valid = false;
            }

            // all checks are complete
            if (checked === totalCombinations) {
                next(error, !valid);
            }
        }
    };

    // check all possible combinations
    for (i = 0; i < extractedHandles.length; i += 1) {
        if (!error && valid) {
            isExactInvalidHandle(extractedHandles[i], api, dbConnectionMap, isExactInvalidHandleCallback);
        }
    }
};

/**
 * Check if the handle is invalid
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {String} handle The handle to check
 * @param {Object} dbConnectionMap The database connection object
 * @param {Function} next The callback to be called after this function is done, the result parameter will be true if the handle is invalid.
 */
var checkInvalidHandle = function (api, handle, dbConnectionMap, next) {
    var checked = 0, error = null, valid = true, totalCheck = 0, i, j, res, isExactInvalidHandleCallback, checkedHandles;

    checkedHandles = [];

    async.waterfall([
        function (callback) {
            // check for exact match
            isExactInvalidHandle(handle, api, dbConnectionMap, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    checkedHandles.push(handle);
                    if (result) {
                        next(err, result);
                    } else {
                        callback();
                    }
                }
            });
        },
        function (callback) {
           // check for invalid handle removing leading and trailing numbers
            checkLeadingTrailingNumbers(api, handle, checkedHandles, dbConnectionMap, function (err, result) {
                if (err) {
                    next(err);
                } else {
                    if (result) {
                        next(err, true);
                    } else {
                        callback();
                    }
                }
            });
        },
        function () {
            var parts = [];
            // check against an array of invalid handle patterns
            for (i = 0; i < INVALID_HANDLE_PATTERNS.length; i += 1) {
                res = handle.match(INVALID_HANDLE_PATTERNS[i]);

                if (res !== null) {
                    for (j = 0; j < res.length; j += 1) {
                        if (parts.indexOf(res[j]) === -1 && checkedHandles.indexOf(res[j]) === -1) {
                            // calculate the total number of checks to perform
                            totalCheck += 1;
                            parts.push(res[j]);
                        }
                    }
                }
            }

            if (parts.length === 0) {
                next(null, false);
                return;
            }

            isExactInvalidHandleCallback = function (err, result) {
                if (err) {
                    error = err;
                } else {
                    checked += 1;
                    if (result) {
                        valid = false;
                    }

                    // all checks are done, can proceed to the next function
                    if (checked === totalCheck) {
                        next(error, !valid);
                    }
                }
            };

            // perform checking in async fashion
            for (i = 0; i < parts.length; i += 1) {
                if (!error && valid) {
                    isExactInvalidHandle(parts[i], api, dbConnectionMap, isExactInvalidHandleCallback);
                }
            }
        }
    ], function (err, result) {
        if (err) {
            next(err);
        }
    });
};

/**
 * Validate the handle
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {String} handle The handle to check
 * @param {Object} dbConnectionMap The database connection object
 * @param {Function} next The callback to be called after this function is done, the result parameter will be null if the handle is valid, or the message about the invalid handle.
 */
var validateHandle = function (api, handle, dbConnectionMap, next) {
    if (isNullOrEmptyString(handle)) {
        next(null, "Handle is required");
    } else {
        if (handle.length > MAX_HANDLE_LENGTH || handle.length < MIN_HANDLE_LENGTH) {
            next(null, "Length of handle in character should be between " + MIN_HANDLE_LENGTH
                    + " and " + MAX_HANDLE_LENGTH);
        } else {
            if (handle.indexOf(" ") !== -1) {
                next(null, "Handle may not contain a space");
                return;
            }

            if (!stringUtils.containsOnly(handle, HANDLE_ALPHABET)) {
                next(null, "The handle may contain only letters, numbers and " + HANDLE_PUNCTUATION);
                return;
            }

            if (stringUtils.containsOnly(handle, HANDLE_PUNCTUATION)) {
                next(null, "The handle may not contain only punctuation");
                return;
            }

            if (handle.toLowerCase().trim().indexOf("admin") === 0) {
                next(null, "Please choose another handle, not starting with admin");
                return;
            }

            async.waterfall([
                function (callback) {
                    // check if the handle contains any invalid handle in persistence
                    checkInvalidHandle(api, handle, dbConnectionMap, function (err, result) {
                        if (err) {
                            next(err, null);
                        } else {
                            if (result === true) {
                                next(null, "The handle you entered is not valid");
                            } else {
                                callback();
                            }
                        }
                    });
                },
                function (callback) {
                    // check if the handle already exists
                    userHandleExist(handle, api, dbConnectionMap, function (err, result) {
                        if (err) {
                            next(err);
                        } else {
                            if (result === true) {
                                next(err, "Handle " + handle + " has already been taken");
                            } else {
                                next(err, null);
                            }
                        }
                    });
                }
            ], function (err, result) {
                next(err);
            });
        }
    }
};

/**
 * Validate the first name
 *
 * @param {String} firstName The name to check
 * @return {String} the error message or null if the name is valid.
 */
var validateFirstName = function (firstName) {
    if (isNullOrEmptyString(firstName) || !stringUtils.containsOnly(firstName, HANDLE_ALPHABET)) {
        return "First name is required";
    }

    if (firstName.length > MAX_GIVEN_NAME_LENGTH) {
        return "Maximum length of first name is " + MAX_GIVEN_NAME_LENGTH;
    }

    return null;
};

/**
 * Validate the last name
 *
 * @param {String} lastName The name to check
 * @return {String} the error message or null if the name is valid.
 */
var validateLastName = function (lastName) {
    if (isNullOrEmptyString(lastName) || !stringUtils.containsOnly(lastName, HANDLE_ALPHABET)) {
        return "Last name is required";
    }

    if (lastName.length > MAX_SURNAME_LENGTH) {
        return "Maximum length of last name is " + MAX_SURNAME_LENGTH;
    }

    return null;
};

/**
 * Validate the email
 *
 * @param {Object} api The api object that is used to access the global infrastructure
 * @param {String} email The email to check
 * @param {Object} dbConnectionMap The database connection object
 * @param {Function} next The callback to be called after this function is done, the result parameter will be null if the email is valid, or the message about the invalid email.
 */
var validateEmail = function (api, email, dbConnectionMap, next) {
    if (isNullOrEmptyString(email)) {
        next(null, "Email is required");
        return;
    }

    if (email.length > MAX_EMAIL_LENGTH) {
        next(null, "Maxiumum lenght of email address is " + MAX_EMAIL_LENGTH);
        return;
    }

    var match = emailPattern.exec(email);
    if (!match) {
        next(null, "Email address is invalid");
        return;
    }

    // check if the email is taken
    isEmailAvailable(email, api, dbConnectionMap, function (err, result) {
        api.log("email availability check finished", "debug");
        if (err) {
            next(err);
        } else {
            if (result === false) {
                next(null, "The email - " + email + " is already registered, please use another one.");
            } else {
                next(null, null);
            }
        }
    });
};

/**
 * Validate the country
 *
 * @param {String} country The country to check
 * @return {String} the error message or null if the country is valid.
 */
var validateCountry = function (country) {
    if (isNullOrEmptyString(country)) {
        return "Please select a country";
    }

    return null;
};

/**
 * Validate the social provider id
 *
 * @param {String} socialProviderId The social provider id to check
 * @return {String} the error message or null if the social provider id is valid.
 */
var validateSocialProviderId = function (socialProviderId) {
    if (!stringUtils.containsOnly(socialProviderId, stringUtils.ALPHABET_DIGITS_EN)) {
        return "Social Provider ID must be integer";
    }

    return null;
};

/**
 * Validate the social user name
 *
 * @param {String} socialUserName The social user name to check
 * @return {String} the error message or null if the social user name is valid.
 */
var validateSocialUserName = function (socialUserName) {
    if (isNullOrEmptyString(socialUserName) || !stringUtils.containsOnly(socialUserName, HANDLE_ALPHABET)) {
        return "Social user name is required";
    }

    if (socialUserName.length > MAX_SOCIAL_USER_NAME_LENGTH) {
        return "Maximum length of social user name is " + MAX_SOCIAL_USER_NAME_LENGTH;
    }

    return null;
};

/**
 * Validate the social email
 *
 * @param {String} email The social email to check
 * @return {String} the error message or null if the social email is valid.
 */
var validateSocialEmail = function (email) {
    if (isNullOrEmptyString(email)) {
        return "Social Email is required";
    }

    if (email.length > MAX_EMAIL_LENGTH) {
        return "Maxiumum lenght of social email address is " + MAX_EMAIL_LENGTH;
    }

    var match = emailPattern.exec(email);
    if (!match) {
        return "Social Email address is invalid";
    }

    return null;
};

/**
 * Validate the social email verified flag
 *
 * @param {String} verified The social email verified flag to check
 * @return {String} the error message or null if the verified flag is valid.
 */
var validateSocialEmailVerified = function (verified) {
    if (isNullOrEmptyString(verified)) {
        return "Social Email Verified can't be null";
    }

    if (verified !== 't' && verified !== 'f') {
        return "Social Email Verified can only be t or f";
    }

    return null;
};

/**
 * The API for register a new member. It is transactional. The response contains a 'message' property if there's any error, or it contains the 'userId' property representing the id of the newly registered user.
 */
exports.memberRegister = {
    name: "memberRegister",
    description: "Register a new member",
    inputs: {
        required: ["firstName", "lastName", "handle", "country", "email", "password"],
        optional: ["socialProviderId", "socialUserName", "socialEmail", "socialEmailVerified"]
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    transaction : 'write',
    cacheEnabled : false,
    databases : ["common_oltp", "informixoltp"],
    run: function (api, connection, next) {
        var dbConnectionMap, messages, checkResult;
        if (this.dbConnectionMapMap !== null) {
            dbConnectionMap = this.dbConnectionMap;
            messages = [];

            // validate simple input parameters
            messages.push(validateFirstName(connection.params.firstName));
            messages.push(validateLastName(connection.params.lastName));

            if (connection.params.socialProviderId !== null && connection.params.socialProviderId !== undefined) {
                api.log("social provider id: " + connection.params.socialProviderId, "debug");
                messages.push(validateSocialUserName(connection.params.socialUserName));
                messages.push(validateSocialEmail(connection.params.socialEmail));
                messages.push(validateSocialEmailVerified(connection.params.socialEmailVerified));
            }

            // validate parameters that require database access
            async.series({
                validateEmail: function (callback) {
                    validateEmail(api, connection.params.email, dbConnectionMap, function (err, result) {
                        callback(err, result);
                    });
                },
                validateHandle: function (callback) {
                    validateHandle(api, connection.params.handle, dbConnectionMap, function (err, result) {
                        callback(err, result);
                    });
                },
                validateCountryName: function (callback) {
                    checkResult = validateCountry(connection.params.country);
                    if (checkResult !== null) {
                        callback(null, "Country name is not valid.");
                    } else {
                        isCountryNameValid(connection.params.country, api, dbConnectionMap, function (err, result) {
                            if (result !== true) {
                                callback(err, "Country name is not valid.");
                            } else {
                                callback(err, null);
                            }
                        });
                    }
                },
                validateSocialProviderId: function (callback) {
                    if (connection.params.socialProviderId !== null && connection.params.socialProviderId !== undefined) {
                        checkResult = validateSocialProviderId(connection.params.socialProviderId);
                        if (checkResult !== null) {
                            callback(null, "Social provider id is not valid.");
                        } else {
                            isSoicalProviderIdValid(connection.params.socialProviderId, api, dbConnectionMap, function (err, result) {
                                if (result !== true) {
                                    callback(err, "Social provider id is not valid.");
                                } else {
                                    callback(err, null);
                                }
                            });
                        }
                    } else {
                        callback(null, null);
                    }
                }
            },
                function (err, results) {
                    var i, filteredMessage;

                    if (err) {
                        api.log("Error occured: " + err + " " + (err.stack || ''), "error");
                        connection.rawConnection.responseHttpCode = apiCodes.serverError;
                        connection.error = err;
                        connection.response = {message : err};
                        next(connection, true);
                        return;
                    }

                    messages.push(results.validateEmail);
                    messages.push(results.validateHandle);
                    messages.push(results.validateCountryName);
                    messages.push(results.validateSocialProviderId);
                    filteredMessage = [];

                    for (i = 0; i < messages.length; i += 1) {
                        if (!isNullOrEmptyString(messages[i])) {
                            filteredMessage.push(messages[i]);
                        }
                    }

                    // sort by alphabet so the result is deterministic
                    filteredMessage.sort();

                    // any input is invalid
                    if (filteredMessage.length > 0) {
                        connection.rawConnection.responseHttpCode = apiCodes.badRequest;
                        connection.response = {message : filteredMessage};
                        next(connection, true);
                    } else {
                        // register the user into database
                        registerUser(connection.params, api, dbConnectionMap, function (err, result) {
                            if (err) {
                                api.log("Error occured in server: " + err + " " + (err.stack || ''), "error");
                                connection.rawConnection.responseHttpCode = apiCodes.serverError;
                                connection.error = err;
                                connection.response = {message : err};
                            } else {
                                api.log("Member registration succeeded.", "debug");
                                connection.response = {userId : result};
                            }

                            next(connection, true);
                        });
                    }
                });
        } else {
            api.log("dbConnectionMap is null", "error");
            connection.rawConnection.responseHttpCode = apiCodes.serverError;
            connection.response = {message: "No database connection object."};
            next(connection, true);
        }
    }
};

/**
 * The fake action to avoid a bug in actionHero. actionHero would assume the name of the action to be 'action' if there is only one action. So a dummy one is needed.
 */
exports.fake = {
    name: "fake",
    description: "Fake export to avoid a bug in actionHero",
    inputs: {
        required: [],
        optional: []
    },
    blockedConnectionTypes : [],
    outputExample : {},
    version : 'v2',
    run: function (api, connection, next) {
        if (api) {
            next(connection, true);
        }
    }
};
