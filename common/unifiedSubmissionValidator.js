/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author isv
 */
"use strict";

var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('underscore');
var AdmZip = require('adm-zip');
var config = require("../config").config;

var IllegalArgumentError = require('../errors/IllegalArgumentError');

var ZIP_ARCHIVE_TYPE_ID = 14;
var JAR_ARCHIVE_TYPE_ID = 16;
var UNKNOWN_ENTRY_SIZE = -1;

/**
 * Constructs the path to file with design submission of specified user for specified challenge.
 * 
 * @param {Number} challengeId - ID for the challenge.
 * @param {Number} userId - user ID.
 * @param {String} userHandle - user handle.
 * @returns {String} a path to design submission file.
 */
function createDesignSubmissionPath(challengeId, userId, userHandle) {
    var p = config.designSubmissionsBasePath;
    p += path.sep;
    p += challengeId;
    p += path.sep;
    p += userHandle.toLowerCase();
    p += '_';
    p += userId;
    p += path.sep;

    return p;
}

/**
 * Finds the file type matching the specified file name.
 *
 * @param {String} fileName - a file name.
 * @param {Array} fileTypes - an array of file types.
 * @param api - ActionHero api object.
 * @returns a file type matching the specified filename.
 */
function findFileType(fileName, fileTypes, api) {
    var lastIndexOfDot = fileName.lastIndexOf('.'),
        extension,
        fileType;
    if (lastIndexOfDot > 0) {
        extension = fileName.substr(lastIndexOfDot + 1).toLowerCase();
        fileType = _.find(fileTypes, function (fileType) {
            api.log("Comparing " + extension + " to " + fileType.extension + " = "
                + (extension === fileType.extension.toLowerCase()), 'debug');

            return fileType.extension.toLowerCase() === extension;
        });
    }
    if (!_.isDefined(fileType)) {
        fileType = null;
    }
    return fileType;
}

var ZipFileAnalyzer = function (api, dbConnectionMap) {
    var nativeSubmissionProvided = false,
        previewImageProvided = false,
        previewFileProvided = false,
        previewImageContent,
        previewFileContent,
        previewImagePath,
        previewFilePath,
        previewImageFileType,
        empty = true;

    return {
        /**
         * Checks if the preview image is available from analyzed bundled file or not.
         * 
         * @returns {boolean} <code>true</code> if preview image file is available from analyzed bundled file;
         * <code>false</code> otherwise.
         */
        isPreviewImageAvailable: function () {
            return previewImageProvided;
        },

        /**
         * Checks if the native submission is available from analyzed bundled file or not.
         * 
         * @returns {boolean} <code>true</code> if native submission is available from analyzed bundled file;
         * <code>false</code> otherwise.
         */
        isNativeSubmissionAvailable: function () {
            return nativeSubmissionProvided;
        },

        /**
         * Checks if the preview file is available from analyzed bundled file or not.
         * 
         * @returns {boolean} <code>true</code> if preview file is available from analyzed bundled file; 
         * <code>false</code> otherwise.
         */
        isPreviewFileAvailable: function () {
            return previewFileProvided;
        },

        /**
         * Gets the content of the preview image if available from the analyzed file.
         * 
         * @returns {Buffer} providing the uncompressed content of the preview image.
         * @throws {Error} if preview image is not available in submission.
         */
        getPreviewImageContent: function () {
            if (!previewImageProvided) {
                throw new Error('There is no preview image available from the submission');
            }
            return previewImageContent;
        },

        /**
         * Gets the content of the preview file if available from the analyzed file.
         *
         * @returns {Buffer} providing the uncompressed content of the preview file.
         * @throws {Error} if preview file is not available in submission.
         */
        getPreviewFileContent: function () {
            if (!previewFileProvided) {
                throw new Error('There is no preview file available from the submission');
            }
            return previewFileContent;
        },

        /**
         * Gets the path to the preview image if available from the analyzed file.
         *
         * @returns {String} providing the path to preview image.
         * @throws {Error} if preview image is not available in submission.
         */
        getPreviewImagePath: function () {
            if (!previewImageProvided) {
                throw new Error("There is no preview image available from the submission");
            }
            return previewImagePath;
        },

        /**
         * Gets the path to the preview file if available from the analyzed file.
         *
         * @returns {String} providing the path to preview file.
         * @throws {Error} if preview file is not available in submission.
         */
        getPreviewFilePath: function () {
            if (!previewFileProvided) {
                throw new Error("There is no preview file available from the submission");
            }
            return previewFilePath;
        },

        /**
         * Gets the file type for preview image if available from the analyzed file.
         * 
         * @returns {Object} representing the file type for preview image in the bundled submission.
         * @throws {Error} if preview image is not available in submission.
         */
        getPreviewImageFileType: function () {
            if (!previewImageProvided) {
                throw new Error("There is no preview image available from the submission");
            }
            return previewImageFileType;
        },

        /**
         * Gets the flag indicating whether analyzed file was empty or not.
         *  
         * @returns {boolean} providing the flag indicating whether analyzed file was empty or not.
         */
        isEmpty: function () {
            return empty;
        },

        /**
         * Analyzes the provided bundled file and extracts all necessary details.
         * 
         * @param {String} pathToZipFile - a path to unified submission ZIP file. 
         * @param {boolean} retrieveFiles - <code>true</code> if the analyzer must retrieve and uncompress the content
         * of desired files; <code>false</code> otherwise. 
         * @param {Function<err, ZipFileAnalyzer>} callback - a callback to be called once analyzing is done.
         */
        analyze: function (pathToZipFile, retrieveFiles, callback) {
            var zip,
                zipEntries,
                entryName,
                entrySize,
                _this = this,
                logMessage,
                fileType;

            api.log("analyze called", 'debug');

            try {
                zip = new AdmZip(pathToZipFile);
                zipEntries = zip.getEntries();
            } catch (e) {
                callback(new Error(e));
                return;
            }

            async.waterfall([
                function (cb) {
                    api.helper.getFileTypes(api, dbConnectionMap, cb);
                }, function (fileTypes, cb) {
                    zipEntries.forEach(function (zipEntry) {
                        if (!(nativeSubmissionProvided && previewImageProvided && previewFileProvided)) {
                            empty = false;
                            entryName = zipEntry.entryName.toLowerCase();
                            entrySize = zipEntry.header.size;

                            // Log details on analyzed entry
                            logMessage = '';
                            logMessage += entryName;
                            logMessage += ' ';
                            if (zipEntry.isDirectory) {
                                logMessage += "it's a directory ";
                            } else {
                                logMessage += "has a size of ";
                                logMessage += entrySize;
                            }
                            api.log(logMessage, 'debug');

                            if (!zipEntry.isDirectory) {
                                if (!nativeSubmissionProvided && entryName.startsWith(config.designSubmission.sourcePrefix)) {
                                    if (entrySize > 0) {
                                        nativeSubmissionProvided = true;
                                    } else if (entrySize === UNKNOWN_ENTRY_SIZE) {
                                        // In case the size of entry is not known then attempt to decompress the 
                                        // entry - if there is at least 1 compressed byte available then this 
                                        // indicates that the compressed file is not empty
                                        if (zipEntry.getCompressedData().length > 0) {
                                            nativeSubmissionProvided = true;
                                        }
                                    }
                                } else if (entryName.startsWith(config.designSubmission.submissionPrefix)) {
                                    fileType = findFileType(entryName, fileTypes, api);
                                    if (fileType !== null) {
                                        if (!previewImageProvided && fileType.image_file) {
                                            previewImageProvided = true;
                                            previewImagePath = zipEntry.entryName;
                                            previewImageFileType = fileType;
                                            if (retrieveFiles) {
                                                previewImageContent = zipEntry.getData();
                                            }
                                        } else if (!previewFileProvided && fileType.bundled_file) {
                                            previewFileProvided = true;
                                            previewFilePath = zipEntry.entryName;
                                            if (retrieveFiles) {
                                                previewFileContent = zipEntry.getData();
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                    cb();
                }
            ], function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, _this);
                }
            });
        },

        /**
         * Gets the details for the files bundled within the specified content of the bundled file.
         * 
         * @param {Buffer} content - a buffer with content of ZIP file.
         */
        getFiles: function (content) {
            var zip = new AdmZip(content),
                zipEntries = zip.getEntries(),
                files = {};

            zipEntries.forEach(function (zipEntry) {
                if (!zipEntry.isDirectory) {
                    files[zipEntry.entryName] = zipEntry.getData();
                }
            });

            return files;
        }
    };
};

exports.getUnifiedSubmissionValidator = function (api, dbConnectionMap) {

    var validator = {};

    /**
     * Gets the name of the file from the specified full path to the file.
     *
     * @param {String} fullPath - a full path to the file.
     * @returns {String} providing just the name of the file referenced by the specified path.
     */
    validator.getFileName = function (fullPath) {
        var pos = fullPath.lastIndexOf(path.sep);
        return fullPath.substring(pos + 1);
    };

    /**
     * Determines the file type of the file matching the specified name. Passes the file type to specified callback.
     *
     * @param {String} fileName - a name of the file.
     * @param {Function<err, fileType>} callback - a callback to be called.
     */
    validator.getFileType = function (fileName, callback) {
        async.waterfall([
            function (cb) {
                api.helper.getFileTypes(api, dbConnectionMap, cb);
            }, function (fileTypes, cb) {
                var fileType = findFileType(fileName, fileTypes, api);
                cb(null, fileType);
            }
        ], callback);
    };

    /**
     * Calculates the name for the file with the alternate representation of specified type for specified submission.
     *
     * @param {Number} challengeId - ID for the challenge the submission belongs to.
     * @param {String} userId - a user ID for submission author.
     * @param {String} userHandle - a user handle for submission author.
     * @param {Number} submissionId - submission ID.
     * @param {String} originalFileName - the original name for the file.
     * @param {String} type - a string specifying the type of file to be created ("tiny", "small", "medium" or "full").
     * @returns {String} a string providing the path to file with content of specified type for specified submission.
     */
    validator.calcAlternateFileName = function (challengeId, userId, userHandle, submissionId, originalFileName, type) {
        var s = '',
            ext = originalFileName.substring(originalFileName.lastIndexOf('.'));

        s += createDesignSubmissionPath(challengeId, userId, userHandle);
        s += submissionId;
        s += '_';
        s += type;
        s += ext;

        return s;
    };

    /**
     * Gets the parser for the bundled file corresponding to specified file path.
     *
     * @param {String} filePath - a path to a file.
     * @param {Function <err, ZipFileAnalyzer>} callback - a callback to be called.
     */
    validator.getBundledFileParser = function (filePath, callback) {
        async.waterfall([
            function (cb) {
                validator.getFileType(filePath, cb);
            }, function (fileType, cb) {
                if (_.isDefined(fileType)) {
                    var fileTypeId = fileType.file_type_id;
                    if (fileType.bundled_file) {
                        if (fileTypeId === ZIP_ARCHIVE_TYPE_ID) {
                            cb(null, new ZipFileAnalyzer(api, dbConnectionMap));
                        } else if (fileTypeId === JAR_ARCHIVE_TYPE_ID) {
                            cb(null, new ZipFileAnalyzer(api, dbConnectionMap));
                        } else {
                            cb(new IllegalArgumentError('There is no parser file type [' + fileTypeId + ']'));
                        }
                    } else {
                        cb(new IllegalArgumentError('The file type [' + fileTypeId + '] is not an archive file'));
                    }
                } else {
                    cb(new IllegalArgumentError('Unsupported file type'));
                }
            }
        ], callback);
    };

    /**
     * Validates the specified unified submission file containing the submission submitted by the user to server.

     * @param {String} unifiedSubmissionFilePath - a path to unified submission file to be validated.
     * @param {Function<err, result>} callback - a callback to be notified on validation results.
     */
    validator.validate = function (unifiedSubmissionFilePath, callback) {
        var fileSizeInBytes,
            nativeSubmissionProvided,
            previewImageProvided,
            previewFileProvided;

        async.waterfall([
            function (cb) {
                fs.exists(unifiedSubmissionFilePath, function (exists) {
                    if (exists) {
                        fs.stat(unifiedSubmissionFilePath, cb);
                    } else {
                        cb(new IllegalArgumentError('Invalid filename'));
                    }
                });
            }, function (stats, cb) {
                fileSizeInBytes = stats.size;
                if (fileSizeInBytes === 0) {
                    cb(new IllegalArgumentError('Submission file is empty'));
                } else {
                    cb();
                }
            }, function (cb) {
                validator.getBundledFileParser(unifiedSubmissionFilePath, cb);
            }, function (fileParser, cb) {
                fileParser.analyze(unifiedSubmissionFilePath, true, cb);
            }, function (fileParser, cb) {
                nativeSubmissionProvided = fileParser.isNativeSubmissionAvailable();
                previewImageProvided = fileParser.isPreviewImageAvailable();
                previewFileProvided = fileParser.isPreviewFileAvailable();

                if (!nativeSubmissionProvided) {
                    cb(null, {valid: false, message: 'No native sources provided in the submission'});
                } else if (!previewImageProvided) {
                    cb(null, {valid: false, message: 'No preview image provided in the submission'});
                } else if (!previewFileProvided) {
                    cb(null, {valid: false, message: 'No preview file provided in the submission'});
                } else {
                    cb(null, {valid: true, message: 'Success'});
                }
            }
        ], callback);
    };

    return validator;
};

/**
 * Creates the file path for storing the Design the submission files.
 *
 * @param {Number} challengeId - ID for the challenge the submission belongs to.
 * @param {String} userId - a user ID for submission author.
 * @param {String} userHandle - a user handle for submission author.
 * @return {boolean} true if string supplied matches the rules and false
 *         otherwise
 */
exports.createDesignSubmissionPath = createDesignSubmissionPath;
