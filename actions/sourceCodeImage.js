/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * The api to convert the source code to image.
 *
 * @version 1.0
 * @author TCASSEMBLER
 */
/*jslint node: true, nomen: true, plusplus: true, unparam: true */
"use strict";
var async = require('async');
var _ = require('underscore');
var IllegalArgumentError = require('../errors/IllegalArgumentError');
var highlight = require('highlight.js');
var wkhtmltoimage = require('wkhtmltoimage');
var BadRequestError = require('../errors/BadRequestError');
var exec = require('child_process').exec;

// The style name array.
var STYLE_NAMES = ['arta', 'ascetic', 'atelier-dune.dark', 'atelier-dune.light', 'atelier-forest.dark', 'atelier-forest.light',
    'atelier-heath.dark', 'atelier-heath.light', 'atelier-lakeside.dark', 'atelier-lakeside.light', 'atelier-seaside.dark',
    'atelier-seaside.light', 'brown_paper', 'codepen-embed', 'color-brewer', 'dark', 'default', 'docco',
    'far', 'foundation', 'github', 'googlecode', 'hybrid', 'idea', 'ir_black', 'kimbie.dark', 'kimbie.light', 'magula',
    'mono-blue', 'monokai', 'monokai_sublime', 'obsidian', 'paraiso.dark', 'paraiso.light', 'pojoaque', 'railscasts',
    'rainbow', 'school_book', 'solarized_dark', 'solarized_light', 'sunburst', 'tomorrow-night-blue',
    'tomorrow-night-bright', 'tomorrow-night-eighties', 'tomorrow-night', 'tomorrow', 'vs', 'xcode', 'zenburn'];

/**
 * Convert the source code to image.
 *
 * @param api - the api instance
 * @param connection - the request connection instance
 * @param next - the callback method.
 */
var convertSourceCodeToImage = function (api, connection, next) {
    var helper = api.helper,
        highlightResult = '',
        emptyStr = '',
        code = connection.params.code + emptyStr,
        style = connection.params.style,
        language = connection.params.lang;

    async.waterfall([
        function (cb) {
            if (_.isNull(language) || _.isEmpty(language) || !highlight.getLanguage(language + emptyStr)) {
                cb(new IllegalArgumentError("The language name is invalid."));
                return;
            }

            if (!_.isUndefined(style) && !_.isNull(style) && !_.isEmpty(style) && !_.contains(STYLE_NAMES, style + emptyStr)) {
                cb(new IllegalArgumentError("The style name is invalid."));
                return;
            }

            exec(api.config.tcConfig.generateSourceCodeImage.wkhtmltoimageCommandPath + ' -H', function(error, stdout, stderr) {
                if (stderr !== null && stderr !== '') {
                    cb(new IllegalArgumentError('The wkhtmltoimageCommandPath in configuration is invalid. The return error is ' + stderr));
                    return;
                }
                cb();
            });
        }, function (cb) {
            var styleLink = api.config.tcConfig.generateSourceCodeImage.styleLink;
            if (!_.isUndefined(style) && !_.isNull(language) && !_.isEmpty(language)) {
                styleLink = styleLink.replace('%OVERRIDE_STYLE_NAME%', style);
            } else {
                styleLink = styleLink.replace('%OVERRIDE_STYLE_NAME%', 'default');
            }
            highlight.configure({ 'useBR': true });
            highlightResult = highlight.highlight(language, code, true).value;
            highlightResult = '<html><head><link rel="stylesheet" href="' + styleLink + '"></head><body><pre>' + highlightResult;
            highlightResult = highlightResult + '</pre></body></html>';
            cb();
        }, function (cb) {
            var response = connection.rawConnection.res,
                tempFileName = new Date().getTime() + (Math.floor(Math.random() * 1000) + '.jpg');

            response.writeHead(200, {
                'Content-Type': 'image/jpeg',
                'Content-Disposition': 'inline; filename=' + tempFileName
            });

            wkhtmltoimage.setCommand(api.config.tcConfig.generateSourceCodeImage.wkhtmltoimageCommandPath);
            wkhtmltoimage.generate(highlightResult, api.config.tcConfig.generateSourceCodeImage.wkhtmlToImageOptions, function (code, signal) {
                if (code !== null && code === 0) {
                    // all success
                    cb();
                } else {
                    cb(new BadRequestError("Failed to generate the image, the return code is " + code));
                }

            }).pipe(response);
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
            next(connection, true);
        } else {
            next(connection, false); //false = response has been set
        }
    });
};

/**
 * The API for converted source code to image.
 */
exports.convertSourceCodeToImage = {
    name: "convertSourceCodeToImage",
    description: "Convert source code to image",
    inputs: {
        required: ['code', 'lang'],
        optional: ['style']
    },
    blockedConnectionTypes: [],
    cacheEnabled: false,
    outputExample: {},
    version: 'v2',
    run: function (api, connection, next) {
        api.log("Execute convertSourceCodeToImage#run", 'debug');
        convertSourceCodeToImage(api, connection, next);
    }
};