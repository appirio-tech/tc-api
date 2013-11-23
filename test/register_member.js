/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * Version: 1.0
 * Author: TCSASSEMBLER
 */
"use strict";

/**
 * Module dependencies.
 */
var fs = require('fs');
var supertest = require('supertest');
var assert = require('chai').assert;
var bindings = require("nodejs-db-informix");
var async = require("async");
var bcrypt = require('bcrypt');

var API_ENDPOINT = 'http://localhost:8080';

var queries = {};

var loadQueries = function (next) {
    var dir = ('./test/test_files/test_queries');

    fs.readdir(dir, function (err, files) {
        if (err) {
            next(err);
        } else {
            // skip the directories
            var i, queryFiles = [], loadFile;
            for (i = 0; i < files.length; i += 1) {
                /*jslint stupid: true */
                if (!fs.lstatSync(dir + '/' + files[i]).isDirectory()) {
                    queryFiles.push(files[i]);
                } else {
                    console.log('Directory ' + files[i] + ' is not loaded as query', 'info');
                }
                /*jslint */
            }
            // function to get content of all query files:
            loadFile = function (filename, done) {
                fs.readFile(dir + "/" + filename, {
                    encoding : 'utf8'
                }, done);
            };
            async.map(queryFiles, loadFile, function (err, results) {
                if (err) {
                    console.log("Error occurred when loading the queries: " + err + " " + (err.stack || ''), "error");
                    next(err);
                } else {
                    for (i = 0; i < queryFiles.length; i += 1) {
                        console.log("Loading query " + queryFiles[i] + " : " + results[i], 'info');
                        queries[queryFiles[i]] = results[i];
                    }

                    next(null);
                }
            });
        }
    });
};

describe('prepareData', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow
   
    it('setup test data', function (done) {
        loadQueries(function(err, result) {
            var c = new bindings.Informix({"user":process.env.TC_DB_USER, "password":process.env.TC_DB_PASSWORD, "database":"tcs_catalog"});
            c.on('error', function(error) {
                console.log("Error: ");
                console.log(error);
            }).on('ready', function(server) {
                console.log("Connection ready to ");
                console.log(server);
            }).connect(function(err) {
                if (err) {
                    throw new Error('Could not connect to DB');
                }
                console.log('Connected to db with ');
                console.log("isConnected() == " + c.isConnected());

                var rs;

                // create table
                rs = this
                    .query(
                          queries["test_data_prepare"]
                        , []
                        , function () {
                            c.disconnect();
                            done(null);
                        }
                        , {
                            start: function(q) {
                                console.log('START:');
                                console.log(q);
                            }
                            , finish: function(f) {
                                console.log('Finish:');
                                console.log(f);
                            }
                            , async: false
                            , cast: true
                        }
                    )
                    .execute();
            });
        });
    });
});

describe('invalidInput1', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow
    
    it('should respond with expected structure and data', function (done) {
        var text = fs.readFileSync("test/test_files/exptected_member_register_invalid_1.txt", 'utf8');
        var expected = JSON.parse(text);

        supertest(API_ENDPOINT)
            .post('/v2/develop/users').set('Accept', 'application/json')
            .send({ firstName: ' ', lastName: ' ', handle: ' ', email: ' ', password: '123456', country: ' '})
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    var errMsg = JSON.parse(result.res.text).message;
                    assert.deepEqual(expected, JSON.parse(result.res.text).message, "Invalid error message");
                }
                done(err);
            });
    });

});

describe('invalidInput2', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow

    /// Check if the data are in expected struture and data
    it('should respond with expected structure and data', function (done) {
        var text = fs.readFileSync("test/test_files/exptected_member_register_invalid_2.txt", 'utf8');
        var expected = JSON.parse(text);
        
        supertest(API_ENDPOINT)
            .post('/v2/develop/users').set('Accept', 'application/json')
            .send({ firstName: 'foooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooo', lastName: 'DELETE * FROM USER', handle: '_(#@*$', email: 'foofoo4foobar.com', password: '123456', country: 'xxx', socialProviderId:1, socialUserName:"foo  DROP TABLE bar", socialEmail:"foobarfoobar.com", socialEmailVerified:'xxx'})
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    var errMsg = JSON.parse(result.res.text).message;
                    assert.deepEqual(expected, JSON.parse(result.res.text).message, "Invalid error message");
                }
                done(err);
            });
    });
});

describe('invalidInput3', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow

    /// Check if the data are in expected struture and data
    it('should respond with expected structure and data', function (done) {
        var text = fs.readFileSync("test/test_files/exptected_member_register_invalid_3.txt", 'utf8');
        var expected = JSON.parse(text);

        supertest(API_ENDPOINT)
            .post('/v2/develop/users').set('Accept', 'application/json')
            .send({ firstName: 'foo', lastName: 'bar', handle: '1invalidHandle1', email: 'testHandleFoobar@foobar.com', password: '123456', country: 'Angola', socialProviderId:999, socialUserName:"foobar", socialEmail:"foobar@foobar.com", socialEmailVerified:'t'})
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    var errMsg = JSON.parse(result.res.text).message;
                    assert.deepEqual(expected, JSON.parse(result.res.text).message, "Invalid error message");
                }
                done(err);
            });
    });
});

var validateDatabase = function(done) {
    var text = fs.readFileSync("test/test_files/exptected_member_register_validate_user.txt", 'utf8');
    var userExpected = JSON.parse(text);

    text = fs.readFileSync("test/test_files/exptected_member_register_validate_security_user.txt", 'utf8');
    var securityUserExpected = JSON.parse(text);

    text = fs.readFileSync("test/test_files/exptected_member_register_validate_user_group.txt", 'utf8');
    var userGroupExpected = JSON.parse(text);

    text = fs.readFileSync("test/test_files/exptected_member_register_validate_user_social.txt", 'utf8');
    var userSocialExpected = JSON.parse(text);

    var c = new bindings.Informix({"user":process.env.TC_DB_USER, "password":process.env.TC_DB_PASSWORD, "database":"tcs_catalog"});
    c.on('error', function(error) {
        console.log("Error: ");
        console.log(error);
    }).on('ready', function(server) {
        console.log("Connection ready to ");
        console.log(server);
    }).connect(function(err) {
        if (err) {
            throw new Error('Could not connect to DB');
        }
        console.log('Connected to db with ');
        console.log("isConnected() == " + c.isConnected());

        var rs;

        async.series([
            function(callback){
                rs = c
                    .query(
                          ''
                        , []
                        , function (err, result) {
                            callback(err, result);
                        }
                        , {
                            start: function(q) {
                                console.log('START:');
                                console.log(q);
                            }
                            , finish: function(f) {
                                console.log('Finish:');
                                console.log(f);
                            }
                            , async: false
                            , cast: true
                        }
                    )
                    .select(queries["test_validate_user"]).execute();
            },
            function(callback){
                rs = c
                    .query(
                          ''
                        , []
                        , function (err, result) {
                            callback(err, result);
                        }
                        , {
                            start: function(q) {
                                console.log('START:');
                                console.log(q);
                            }
                            , finish: function(f) {
                                console.log('Finish:');
                                console.log(f);
                            }
                            , async: false
                            , cast: true
                        }
                    )
                    .select(queries["test_validate_security_user"]).execute();
            },
            function(callback){
                rs = c
                    .query(
                          ''
                        , []
                        , function (err, result) {
                            callback(err, result);
                        }
                        , {
                            start: function(q) {
                                console.log('START:');
                                console.log(q);
                            }
                            , finish: function(f) {
                                console.log('Finish:');
                                console.log(f);
                            }
                            , async: false
                            , cast: true
                        }
                    )
                    .select(queries["test_validate_user_group"]).execute();
            },
            function(callback){
                rs = c
                    .query(
                          ''
                        , []
                        , function (err, result) {
                            callback(err, result);
                        }
                        , {
                            start: function(q) {
                                console.log('START:');
                                console.log(q);
                            }
                            , finish: function(f) {
                                console.log('Finish:');
                                console.log(f);
                            }
                            , async: false
                            , cast: true
                        }
                    )
                    .select(queries["test_validate_user_social"]).execute();
            }
        ],
        // optional callback
        function(err, results){
            c.disconnect();
            if (!err) {
                assert.deepEqual(userExpected, results[0], "Invalid returned message");
                assert.deepEqual(userGroupExpected, results[2], "Invalid returned message");
                assert.deepEqual(userSocialExpected, results[3], "Invalid returned message");

                assert.equal(securityUserExpected[0].login_id, results[1][0].login_id, "Invalid returned message");
                assert.equal(securityUserExpected[0].user_id, results[1][0].user_id, "Invalid returned message");
                
                console.log("password " + results[1][0].password);
                bcrypt.compare("123456", results[1][0].password, function(err, res) {
                    // res == true
                    assert(res == true, "Password is not correct");
                    done(err);
                });
            } else {
                done(err);
            }
        });
    });
}

describe('successInput', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow

    /// Check if the data are in expected struture and data
    it('should respond with expected structure and data', function (done) {
        var text = fs.readFileSync("test/test_files/exptected_member_register_success.txt", 'utf8');
        var expected = JSON.parse(text);

        supertest(API_ENDPOINT)
            .post('/v2/develop/users').set('Accept', 'application/json')
            .send({ firstName: 'foo', lastName: 'bar', handle: 'testHandleFoo', email: 'testHandleFoo@foobar.com', password: '123456', country: 'Angola', socialProviderId:1, socialUserName:"foobar", socialEmail:"foobar@foobar.com", socialEmailVerified:'t'})
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function (err, result) {
                if (!err) {
                    assert.equal(expected, JSON.parse(result.res.text).userId, "Invalid returned message");
                } 

                done(err);
            });
    });
});

describe('validateDatabase', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow

    /// Check if the data are in expected struture and data
    it('should respond with expected structure and data', function (done) {
        loadQueries(function(err, result) {
            validateDatabase(done);
        });
    });
});

describe('invalidExistingHandleAndEmail', function () {
    this.timeout(120000);     // The api with testing remote db could be quit slow

    /// Check if the data are in expected struture and data
    it('should respond with expected structure and data', function (done) {
        var text = fs.readFileSync("test/test_files/exptected_member_register_invalid_existing.txt", 'utf8');
        var expected = JSON.parse(text);
        
        supertest(API_ENDPOINT)
            .post('/v2/develop/users').set('Accept', 'application/json')
            .send({ firstName: 'foo', lastName: 'bar', handle: 'testHandleFoo', email: 'testHandleFoo@foobar.com', password: '123456', country: 'Angola', socialProviderId:1, socialUserName:"foobar", socialEmail:"foobar@foobar.com", socialEmailVerified:'t'})
            .expect('Content-Type', /json/)
            .expect(400)
            .end(function (err, result) {
                if (!err) {
                    var errMsg = JSON.parse(result.res.text).message;
                    assert.deepEqual(expected, JSON.parse(result.res.text).message, "Invalid error message");
                }
                done(err);
            });
    });
});