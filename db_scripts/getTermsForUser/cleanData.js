/*
 * Copyright (C) 2016 TopCoder Inc., All Rights Reserved.
 * 
 * 
 * This is the script to clean the test data created by insertData.js
 * 
 * @author TCSCODER
 * @version 1.0
 */
"use strict";

var path = require("path");
var helper = require("../../test/helpers/testHelper");
var SQL_DIR = path.dirname(path.dirname(__dirname)) + "/test/sqls/termsForUser/";
var async = require("async");

helper.runSqlFile(SQL_DIR + "common_oltp__clean", "common_oltp", function (err) {
    if (err) {
        throw err;
    }
    console.log("DONE");
    process.exit();
});

