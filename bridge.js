/*
 * Copyright (C) 2016 TopCoder Inc., All Rights Reserved.
 * 
 * This is the simple service that provides a "bridge" between a
 * client and the database server. It accepts SQL queries and executes them.
 * 
 * Added just to solve a deployment problem. Can (and probably should) be removed 
 * when this problem will be fixed
 * 
 * @author TCSCODER
 * @version 1.0
 */
"use strict";

var http = require("http"),
    async = require("async"),
    Jdbc = require("informix-wrapper"),
    tcConfig = require(__dirname + "/config/tc-config.js").tcConfig;

var connections = {};

var server = http.createServer(function (req, res) {

    if (req.method !== "POST" || req.url !== "/bridge") {
        res.writeHead(404, "Not found");
        res.end();
        return;
    }

    var header = { "Content-Type": "application/json" },
        body = [];

    req.on("data", function (chunk) {
        body.push(chunk);
    }).on("end", function () {
        body = Buffer.concat(body).toString();

        var query;
        try {
            query = JSON.parse(body);
            query.sql = new Buffer(query.sql, "base64").toString();
        } catch (x) {
            res.writeHead(400, "Bad request", header);
            res.end(JSON.stringify(x.toString()));
            return;
        }

        if (!query.db) {
            res.writeHead(400, "Bad request", header);
            res.end("'db' parameter is required");
            return;
        }
        if (!query.sql) {
            res.writeHead(400, "Bad request", header);
            res.end("'sql' parameter is required");
            return;
        }

        try {
            async.waterfall([
                function (next) {
                    var jdbc, prefix, settings;

                    if (connections[query.db] && connections[query.db].isConnected()) {
                        next(null, connections[query.db]);
                    } else {
                        jdbc = connections[query.db];

                        if (!jdbc) {
                            prefix = tcConfig.databaseMapping[query.db];
                            if (!prefix) {
                                res.writeHead(400, "Bad request", header);
                                res.end(query.db + "- unknown database");
                                return;
                            }
                            settings = {
                                user: process.env[prefix + "_USER"],
                                host: process.env[prefix + "_HOST"],
                                port: parseInt(process.env[prefix + "_PORT"], 10),
                                password: process.env[prefix + "_PASSWORD"],
                                database: query.db,
                                server: process.env[prefix + "_NAME"],
                                minpool: parseInt(process.env.MINPOOL, 10) || 1,
                                maxpool: parseInt(process.env.MAXPOOL, 10) || 60,
                                maxsize: parseInt(process.env.MAXSIZE, 10) || 0,
                                idleTimeout: parseInt(process.env.IDLETIMEOUT, 10) || 3600,
                                timeout: parseInt(process.env.TIMEOUT, 10) || 30000
                            };
                            jdbc = connections[query.db] = new Jdbc(settings, console.log).initialize();
                        }
                        jdbc.connect(function (err) {
                            next(err, jdbc);
                        });
                    }
                },
                function (connection, next) {
                    connection.query(query.sql, next).execute();
                }
            ], function (err, rows) {
                res.writeHead(200, header);
                if (err) {
                    res.end(JSON.stringify({exception: err.toString()}));
                } else {
                    res.end(JSON.stringify({results: rows}));
                }
            });
        } catch (x) {
            res.writeHead(200, header);
            res.end(JSON.stringify({exception: x.toString()}));
        }
    });

});

server.listen(8082);
