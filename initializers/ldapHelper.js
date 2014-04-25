/*jslint nomen: true */
/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.2
 * Author: TCSASSEMBLER, muzehyun, Ghost_141
 * changes in 1.1
 * - add retrieveMemberProfileLDAPEntry
 * - fix bugs (returing too early without any result)
 * Changes in 1.2:
 * - updateMemberPasswordLDAPEntry for update member password.
 */
"use strict";

/**
 * Dependency 
 */
var ldap = require('ldapjs'), async = require('async'), Ber = require('asn1').Ber;

/// environment variables
var ldap_host = process.env.TC_LDAP_HOST,
    ldap_host_port = process.env.TC_LDAP_PORT,
    ldap_password = process.env.TC_LDAP_PASSWORD,
    ldap_host_bind_dn = process.env.TC_BIND_DN,
    topcoder_member_base_dn = process.env.TC_LDAP_MEMBER_BASE_DN,
    topcoder_member_active = 'A',
    topcoder_member_unactive = 'U';

/** The OID of the modify password extended operation */
var LDAP_EXOP_X_MODIFY_PASSWD = '1.3.6.1.4.1.4203.1.11.1';
/** The BER tag for the modify password dn entry */
var LDAP_TAG_EXOP_X_MODIFY_PASSWD_ID = 0x80;
/** The BER tag for the modify password new password entry */
var LDAP_TAG_EXOP_X_MODIFY_PASSWD_OLD = 0x81;
/** The BER tag for the modify password new password entry */
var LDAP_TAG_EXOP_X_MODIFY_PASSWD_NEW = 0x82;

/**
 * This function is used to translate the error of LDAP
 * into a form of normal object
 * 
 * @param {Object} err - the error object returned by ldapjs
 * @return {Object} normal object of error
 */
var translateLdapError = function (err) {
    if (err) {
        return {
            dn: err.dn,
            code: err.code,
            name: err.name,
            message: err.message
        };
    }
    return {};
};

/**
 * This function is used to check the existence of 
 * given parameters and ensure it not be empty
 * 
 * @param {Object} params - a object of parameters
 * @param {String} name - the name of the to-be-checked parameter
 * @return {Boolean} true if params contains the given parameter
 *                      and it is not empty; false otherwise.
 */
var checkParameter = function (params, name) {
    return params.hasOwnProperty(name) && (params[name].toString().trim().length >= 1);
};

/**
 * Function used to create a client
 */
var createClient = function () {
    return ldap.createClient({
        url: 'ldaps://' + ldap_host + ':' + ldap_host_port,
        tlsOptions: {
            rejectUnauthorized: false
        }
    });
};

/**
 * Function used to bind a ldap server
 * 
 * @param {Object} api - object used to access infrastructure
 * @param {Object} client - an object of current client of ldap server
 * @param {Function} callback - a async callback function with prototype like callback(err, results)
 */
var bindClient = function (api, client, callback) {
    client.bind(ldap_host_bind_dn, ldap_password, function (err) {
        if (err) {
            api.log('binding failed');
            callback('cannot bind to ldap server', translateLdapError(err));
        } else {
            api.log('Successfully bind to ldap server', 'info');
            callback(null, 'bind to ldap server');
        }
    });
};

/**
 * Function used to add an entry in ldap server
 * 
 * @param {Object} api - object used to access infrastructure
 * @param {Object} client - an object of current client of ldap server
 * @param {Object} params - the parameters
 * @param {Function} callback - a async callback function with prototype like callback(err, results)
 */
var addClient = function (api, client, params, callback) {
    var dn = 'uid=' + params.userId + ', ' + topcoder_member_base_dn,
        entry = {
            uid: params.userId,
            handle: params.handle,
            objectClass: ['tc-member', 'top'],
            status: topcoder_member_unactive,
            userPassword: params.password
        };
    client.add(dn, entry, function (err) {
        if (err) {
            client.unbind();
            callback('cannot add to ldap server', translateLdapError(err));
        } else {
            api.log('Successfully add to ldap server', 'info');
            callback(null, 'add to ldap server');
        }
    });
};

/**
 * Function used to delete an entry from ldap server
 * 
 * @param {Object} api - object used to access infrastructure
 * @param {Object} client - an object of current client of ldap server
 * @param {Object} userId - the user id
 * @param {Function} callback - a async callback function with prototype like callback(err, results)
 */
var removeClient = function (api, client, userId, callback) {
    var dn = 'uid=' + userId + ', ' + topcoder_member_base_dn;
    client.del(dn, function (err) {
        if (err) {
            client.unbind();
            callback('cannot delete from ldap server', translateLdapError(err));
        } else {
            api.log('Successfully deleted from ldap server', 'info');
            callback(null, 'delete from ldap server');
        }
    });
};

/**
 * Function used to update the password in order to create a hashed version of it
 * 
 * @param {Object} api - object used to access infrastructure
 * @param {Object} client - an object of current client of ldap server
 * @param {Object} params - the parameters
 * @param {Function} callback - a async callback function with prototype like callback(err, results)
 */
var passwordModify = function (api, client, params, callback) {
    var dn = 'uid=' + params.userId + ', ' + topcoder_member_base_dn,
        op = params.oldPassword || params.password,
        np = params.newPassword || params.password,
        writer = new Ber.Writer();
    writer.startSequence();
    writer.writeString(dn, LDAP_TAG_EXOP_X_MODIFY_PASSWD_ID);
    writer.writeString(op, LDAP_TAG_EXOP_X_MODIFY_PASSWD_OLD);
    writer.writeString(np, LDAP_TAG_EXOP_X_MODIFY_PASSWD_NEW);
    writer.endSequence();

    client.exop(LDAP_EXOP_X_MODIFY_PASSWD, writer.buffer, function (err, result) {
        if (err) {
            client.unbind();
            callback('cannot modify password for user', translateLdapError(err));
        } else {
            api.log('Successfully modified password', 'info');
            callback(null, 'modified password');
        }
    });
};

/**
 * Function used to modify an entry in ldap server
 * 
 * @param {Object} api - object used to access infrastructure
 * @param {Object} client - an object of current client of ldap server
 * @param {Object} params - the parameters
 * @param {Function} callback - a async callback function with prototype like callback(err, results)
 */
var modifyClient = function (api, client, params, callback) {
    var dn = 'uid=' + params.userId + ', ' + topcoder_member_base_dn,
        change = new ldap.Change({
            operation: 'replace',
            modification: {
                status: [topcoder_member_active]
            }
        });
    client.modify(dn, change, function (err) {
        if (err) {
            client.unbind();
            callback('cannot modify to ldap server', translateLdapError(err));
        } else {
            api.log('Successfully modify to ldap server', 'info');
            callback(null, 'modify to ldap server');
        }
    });
};

/**
 * Function used to retrieve an entry in ldap server
 * 
 * @param {Object} api - object used to access infrastructure
 * @param {Object} client - an object of current client of ldap server
 * @param {Object} params - the parameters
 * @param {Function} callback - a async callback function with prototype like callback(err, results)
 */
var retrieveClient = function (api, client, params, callback) {
    var dn = 'uid=' + params.userId + ', ' + topcoder_member_base_dn;
    client.search(dn, {}, function (err, res) {
        if (err) {
            client.unbind();
            callback('cannot get client from ldap server', translateLdapError(err));
        }

        res.on('searchEntry', function (entry) {
            api.log('Successfully retrieve from ldap server', 'info');
            var result = {
                userId: entry.object.uid,
                handle: entry.object.handle,
                status: entry.object.status
            };
            callback(null, result);
        });

        res.on('searchReference', function (referral) {
            console.log('referral: ' + referral.uris.join());
        });

        res.on('error', function (err) {
            console.error('error: ' + err.message);
        });

        res.on('end', function (result) {
            console.log('status: ' + result.status);
        });
    });
};

/**
 * Expose the "ldapHelper" utility.
 *
 * @param {Object} api The api object that is used to access the infrastructure
 * @param {Function} next The callback function to be called when everything is done
 */
exports.ldapHelper = function (api, next) {
    api.ldapHelper = {
         /**
         * Main function of addMemberProfileLDAPEntry
         *
         * @param {Object} params require fields: userId, handle, password
         * @param {Function} next - callback function
         */
        addMemberProfileLDAPEntry: function (params, next) {
            api.log('Enter addMemberProfileLDAPEntry', 'debug');

            var client, error, index, requiredParams = ['userId', 'handle', 'password'];

            for (index = 0; index < requiredParams.length; index += 1) {
                error = api.helper.checkDefined(params[requiredParams[index]], requiredParams[index]);
                if (error) {
                    api.log("addMemberProfileLDAPEntry: error occurred: " + error + " " + (error.stack || ''), "error");
                    return next(error, null);
                }
            }
            try {
                async.series([
                    function (callback) {
                        client  = createClient();
                        callback(null, 'create client');
                    },
                    function (callback) {
                        bindClient(api, client, callback);
                    },
                    function (callback) {
                        addClient(api, client, params, callback);
                    },
                    function (callback) {
                        passwordModify(api, client, params, callback);
                    }
                ], function (err, result) {
                    if (err) {
                        error = result.pop();
                        api.log('addMemberProfileLDAPEntry: error occurred: ' + err + " " + (err.stack || ''), "error");
                    } else {
                        client.unbind();
                    }
                    api.log('Leave addMemberProfileLDAPEntry', 'debug');
                    next(null, true);
                });
            } catch (err) {
                console.log('CAUGHT: ' + err);
                return next(error, null);
            }
        },

        /**
         * Main function of removeMemberProfileLDAPEntry
         *
         * @param {Object} userId - the user id
         * @param {Function} next - callback function
         */
        removeMemberProfileLDAPEntry: function (userId, next) {
            api.log('Enter removeMemberProfileLDAPEntry', 'debug');
            var client;

            try {
                async.series([
                    function (callback) {
                        client  = createClient();
                        callback(null, 'create client');
                    },
                    function (callback) {
                        bindClient(api, client, callback);
                    },
                    function (callback) {
                        removeClient(api, client, userId, callback);
                    }
                ], function (err) {

                    if (err) {
                        api.log('removeMemberProfileLDAPEntry: error occurred: ' + err + " " + (err.stack || ''), "error");
                    } else {
                        client.unbind();
                    }
                    api.log('Leave removeMemberProfileLDAPEntry', 'debug');
                    next(err, true);
                });
            } catch (err) {
                console.log('CAUGHT: ' + err);
                return next(err, null);
            }
        },

        /**
         * Main function of activateMemberProfileLDAPEntry
         *
         * @param {Object} params require fields: userId
         * @param {Function} next - callback function
         */
        activateMemberProfileLDAPEntry: function (params, next) {
            api.log('Enter activateMemberProfileLDAPEntry', 'debug');

            var client, error;

            // pararms validation

            error = api.helper.checkDefined(params.userId, 'userId');
            if (error) {
                api.log("activateMemberProfileLDAPEntry: error occurred: " + error + " " + (error.stack || ''), "error");
                return next(error, true);
            }
            async.series([
                function (callback) {
                    client = createClient();
                    callback(null, 'create client');
                },
                function (callback) {
                    bindClient(api, client, callback);
                },
                function (callback) {
                    modifyClient(api, client, params, callback);
                }
            ], function (err, result) {
                if (err) {
                    error = result.pop();
                    api.log('activateMemberProfileLDAPEntry ' + err + ' ', 'error', error);
                } else {
                    client.unbind();
                }
                api.log('Leave activateMemberProfileLDAPEntry', 'debug');
                next(err, true);
            });
        },

        /**
         * Main function of retrieveMemberProfileLDAPEntry
         *
         * @param {Object} params require fields: userId
         * @param {Function} next - callback function
         */
        retrieveMemberProfileLDAPEntry: function (params, next) {
            api.log('Enter retrieveMemberProfileLDAPEntry', 'debug');

            var client, error;

            // pararms validation
            error = api.helper.checkDefined(params.userId, 'userId');
            if (error) {
                api.log("retrieveMemberProfileLDAPEntry: error occurred: " + error + " " + (error.stack || ''), "error");
                return next(error, true);
            }

            async.series([
                function (callback) {
                    client = createClient();

                    callback(null, 'create client');
                },
                function (callback) {
                    bindClient(api, client, callback);
                },
                function (callback) {
                    retrieveClient(api, client, params, callback);
                }
            ], function (err, result) {
                var entry;
                if (result.length >= 2) {
                    entry = result[2];
                }
                if (err) {
                    error = result.pop();
                    api.log('retrieveMemberProfileLDAPEntry ' + err + ' ', 'error', error);
                } else {
                    client.unbind();
                }
                api.log('Leave retrieveMemberProfileLDAPEntry', 'debug');
                next(err, entry);
            });
        },

        /**
         * Main function of updateMemberPasswordLDAPEntry
         *
         * @param {Object} params require fields: userId, handle, newPassword, oldPassword
         * @param {Function} next - callback function
         * @since 1.1
         */
        updateMemberPasswordLDAPEntry: function (params, next) {
            api.log('Enter updateMemberPasswordLDAPEntry', 'debug');

            var client, error, index, requiredParams = ['userId', 'handle', 'newPassword', 'oldPassword'];

            for (index = 0; index < requiredParams.length; index += 1) {
                error = api.helper.checkDefined(params[requiredParams[index]], requiredParams[index]);
                if (error) {
                    api.log('updateMemberPasswordLDAPEntry: error occurred: ' + error + " " + (error.stack || ''), "error");
                    next(error, null);
                    return;
                }
            }
            try {
                async.series([
                    function (callback) {
                        client  = createClient();
                        callback(null, 'create client');
                    },
                    function (callback) {
                        bindClient(api, client, callback);
                    },
                    function (callback) {
                        passwordModify(api, client, params, callback);
                    }
                ], function (err, result) {
                    if (err) {
                        error = result.pop();
                        api.log('updateMemberPasswordLDAPEntry: error occurred: ' + err + " " + (err.stack || ''), "error");
                        next(error, null);
                    } else {
                        client.unbind();
                        api.log('Leave updateMemberPasswordLDAPEntry', 'debug');
                        next();
                    }
                });
            } catch (err) {
                console.log('CAUGHT: ' + err);
                next(error, null);
            }
        }
    };
    next();
};
