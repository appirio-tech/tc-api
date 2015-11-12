"use strict";

var fs = require('fs');
var cluster = require('cluster');

exports.default = {
    logger: function () {
        var logger = { transports: [] };

        // console logger
        if (cluster.isMaster) {
            logger.transports.push(function (api, winston) {
                return new (winston.transports.Console)({
                    colorize: true,
                    level: 'info',
                    timestamp: api.utils.sqlDateTime,
                    json: false
                });
            });
        }

        // file logger
        try {
            fs.mkdirSync('./log');
        } catch (e) {
            if (e.code !== 'EEXIST') {
                console.log(e);
                process.exit();
            }
        }
        logger.transports.push(function (api, winston) {
            return new (winston.transports.File)({
                filename: api.config.general.paths.log[0] + '/actionhero-worker.log',
                level: 'info',
                colorize: true,
                timestamp: api.utils.sqlDateTime,
                json: false
            });
        });

        return logger;
    }
};

exports.test = {
    logger: function () {
        return {
            transports: null
        };
    }
};

