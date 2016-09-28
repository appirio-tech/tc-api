/*
 * Copyright (C) 2016 TopCoder Inc., All Rights Reserved.
 * 
 * 
 * This script insers some test data 
 * to test /terms/for/{userId}/{termsOfUseIds} service in Postman
 * 
 * @author TCSCODER
 * @version 1.0
 */
"use strict";

var path = require("path");
var helper = require("../../helpers/testHelper");
var SQL_DIR = path.dirname(path.dirname(__dirname)) + "/sqls/termsForUser/";
var async = require("async");

async.waterfall([
    function (cb) {
        helper.runSqlFile(SQL_DIR + "common_oltp__clean", "common_oltp", cb);
    },
    function (cb) {
        helper.runSqlFile(SQL_DIR + "common_oltp__insert_test_data", "common_oltp", cb);
    },
    function (cb) {
        async.each([ 1, 2, 3, 4, 5 ], function (n, cb) {
            helper.updateTextColumn("update terms_of_use set terms_text = ? where terms_of_use_id = ?",
                "common_oltp",
                [{
                    type: "text",
                    value: "This is the Node API Sample Term Of Use " + n + "."
                }, {
                    type: "int",
                    value: 40000000 + n
                }],
                cb);
        }, cb);
    }
], function (err) {
    if (err) {
        throw err;
    }
    console.log("DONE");
    process.exit();
});

