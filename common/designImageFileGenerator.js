/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.1
 * @author isv
 */
"use strict";
/*jslint stupid: true */

var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('underscore');
var config = require('../config').config;
var java = require('java');
var usv = require("./unifiedSubmissionValidator");

var IllegalArgumentError = require('../errors/IllegalArgumentError');

// array listing the formats currently supported by Image Overlay component
var IMAGE_OVERLAY_SUPPORTED_TYPES = ['BMP', 'JPG', 'PNM', 'GIF', 'PNG', 'TIFF'];

// the maximum size (in pixels) for the tiny presentations of the preview images
var TINY_IMAGE_SIZE = 120;

// the maximum size (in pixels) for the small presentations of the preview images
var SMALL_IMAGE_SIZE = 300;

// the maximum size (in pixels) for the medium presentations of the preview images
var MEDIUM_IMAGE_SIZE = 555;

// image width/height to be used to indicate that dimension of original image is tobe used
var ORIGINAL_IMAGE_SIZE = -1;

// array referencing the image types corresponding to non-watermarked image galleries
var GALLERY_PLAIN_IMAGE_TYPE_IDS = [25, 26, 27, 28];

// array providing the sizes of the non-watermarked gallery images
var GALLERY_PLAIN_IMAGE_SIZES = [TINY_IMAGE_SIZE, SMALL_IMAGE_SIZE, MEDIUM_IMAGE_SIZE, ORIGINAL_IMAGE_SIZE];

// array referencing the image types corresponding to watermarked image galleries
var GALLERY_WATERMARKED_IMAGE_TYPE_IDS = [29, 30, 31];

// array providing the sizes of the watermarked gallery images
var GALLERY_WATERMARKED_IMAGE_SIZES = [SMALL_IMAGE_SIZE, MEDIUM_IMAGE_SIZE, ORIGINAL_IMAGE_SIZE];

// array providing the IDs for challenge categories which require image galleries to be provided by submissions
var GALLERY_IDS = config.galleryIds;

java.options.push('-Dcom.sun.media.jai.disableMediaLib=true');
java.options.push('-Xms' + config.jvm.minMemory);
java.options.push('-Xmx' + config.jvm.maxMemory);
java.options.push('-XX:PermSize=' + config.jvm.minMemory);
java.options.push('-XX:MaxPermSize=' + config.jvm.maxMemory);
java.options.push('-Djava.awt.headless=true');

// Class path configuration for Image Manipulation, Image Overlay, Image Re-Sizing components
java.classpath = java.classpath.concat([
    __dirname + '/../javalib/base_exception.jar',
    __dirname + '/../javalib/configuration_api.jar',
    __dirname + '/../javalib/image_manipulation.jar',
    __dirname + '/../javalib/image_overlay.jar',
    __dirname + '/../javalib/image_resizing.jar',
    __dirname + '/../javalib/jai_codec.jar',
    __dirname + '/../javalib/jai_core.jar',
    __dirname + '/../javalib/mlibwrapper_jai.jar'
]);

/**
 * Constructor for Design Image File Generator (which is used to be a replacement for 
 * com.topcoder.web.studio.util.FileGenerator class in Java application).
 * 
 * @param {Object} challenge - provides details for challenge. Expected to provide 'challengeId' and
 *        'challengeCategoryId' properties. 
 * @param {Object} submitter - provides details for submission author. Expected to provide 'userId' and 'handle'
 *        properties.
 * @param {Object} submission - provides details for submission. Expected to provide 'submissionId' provide and may
 *        provide 'images' array.
 * @param {File} submissionFile - provides details for submission file, including content.
 * @param {Object} api - ActionHero API object.
 * @param {Object} dbConnectionMap - DB connections mapping.
 */
exports.getDesignImageFileGenerator = function (challenge, submitter, submission, submissionFile, api, dbConnectionMap) {

    var imageOverlayManager = java.newInstanceSync('com.topcoder.imaging.overlay.ImageOverlayManager'),
        unifiedSubmissionValidator = usv.getUnifiedSubmissionValidator(api, dbConnectionMap),
        imageFileGenerator = {},
        cropOverlayImage = java.getStaticFieldValue('com.topcoder.imaging.overlay.OverlayType',
            'CROP_OVERLAY_IMAGE'),
        transSpec = java.newInstanceSync('com.topcoder.imaging.overlay.TransparencySpecification');

    transSpec.setColorTransparencySync(parseInt(config.watermark.overlayImageRed, 10),
        parseInt(config.watermark.overlayImageGreen, 10),
        parseInt(config.watermark.overlayImageBlue, 10), parseInt(config.watermark.overlayImageTransparency, 10));
    transSpec.setImageTransparencySync(parseInt(config.watermark.baseImageTransparency, 10));

    /**
     * Creates temporary file.
     * 
     * @param {Number} index - a number of group the temporary file belongs to.
     * @returns a temporty file.
     */
    function createTempFile(index) {
        var tmpDir = java.newInstanceSync('java.io.File', config.designSubmissionTmpPath),
            file = java.callStaticMethodSync('java.io.File', 'createTempFile', 'studio_' + index + '_', 'tmp', tmpDir);
        file.deleteOnExitSync();
        return file;
    }

    /**
     * Logs the specified message for debugging purposes.
     * 
     * @param {String} message - a message to be logged.
     */
    function log(message) {
        api.log('*** *** : ' + message, 'info');
    }

    /**
     * Writes the specified content to specified file on disk.
     *
     * @param {String} path - a name of the file.
     * @param {Buffer} content - the content of the file to be written.
     * @param {Function<err>} callback - a callback to be called once the file is written.
     */
    function writeFile(path, content, callback) {
        log('writeFile called with : path = ' + path + ", content = " + content.constructor.name);
        fs.writeFile(path, content, callback);
    }

    /**
     * Logs the specified error and passes it to specified callback.
     * 
     * @param {Object} e - an error raised.
     * @param {Function} callback - the callback to be notified on error.
     */
    function handleError(e, callback) {
        log("Unexpected error encountered: " + e);
        callback(new Error("Unexpected error encountered: " + e));
    }

    /**
     * Deletes the specified temporary file. If an error is encountered while deleting then it is logged but the main
     * process is not interrupted.
     * 
     * @param {File} file - a file to be deleted.
     */
    function deleteFile(file) {
        try {
            log("Deleting the temporary file [" + file.getPathSync() + "]...");
            var deleted = file.deleteSync();
            if (deleted) {
                log("The temporary file [" + file.getPathSync() + "] has been deleted successfully");
            } else {
                log("The temporary file [" + file.getPathSync() + "] has not been deleted");
            }
        } catch (e) {
            log("Failed to delete successfully the temporary file [" + file.getPathSync() + "] due to unexpected error: " + e);
        }
    }

    /**
     * Calculates the name for the file with the alternate representation of specified type for specified file.
     *
     * @param {String} originalFileName - the original name for the file.
     * @param {String} type - a string specifying the type of file to be created ("tiny", "small", "medium" or "full").
     * @return {String} a path to file with the alternate representation of specified type for specified file. 
     */
    function calcAlternateFileName(originalFileName, type) {
        log('calcAlternateFileName called with : originalFileName = ' + originalFileName + ", type = " + type);
        return unifiedSubmissionValidator.calcAlternateFileName(challenge.challengeId, submitter.userId,
            submitter.handle, submission.submissionId, originalFileName, type);
    }

    /**
     * Re-sizes the overlay image in accordance with width and height of specified target image keeping the original
     * aspect ratio for overlay image.
     *
     * @param {Object} targetImage - the original image (of type com.topcoder.util.image.manipulation.Image) to be
     *        watermarked.
     * @param {Function<err, Image>} callback - a callback to be called when overlay image resizing is finished.
     */
    function resizeOverlayImage(targetImage, callback) {
        log('resizeOverlayImage called with : targetImage = ' + targetImage.constructor.name);
        try {
            var overlayImageFormat = config.watermark.fileType,
                overlayImageFilePath = config.watermark.filePath,
                tempFile = createTempFile(1),
                fileToResize = createTempFile(2),
                targetImageWidth = targetImage.getWidthSync(),
                targetImageHeight = targetImage.getHeightSync();

            async.waterfall([
                function (cb) {
                    api.helper.copyFiles(api, overlayImageFilePath, fileToResize.getPathSync(), cb);
                }, function (cb) {
                    imageOverlayManager.loadImage(overlayImageFormat, overlayImageFilePath, cb);
                }, function (overlayImage, cb) {
                    try {
                        var widthAspect = overlayImage.getWidthSync() / targetImageWidth,
                            heightAspect = overlayImage.getHeightSync() / targetImageHeight,
                            resizer = java.newInstanceSync('com.topcoder.image.size.ImageResizer', fileToResize);
                        if (widthAspect > heightAspect) {
                            resizer.scaleToWidthSync(tempFile, targetImageWidth);
                        } else {
                            resizer.scaleToHeightSync(tempFile, targetImageHeight);
                        }
                        resizer = null;

                        // Force garbage collection to release the file locks put by JAI
                        java.callStaticMethodSync("java.lang.System", "gc");
                        java.callStaticMethodSync("java.lang.System", "gc");
                        java.callStaticMethodSync("java.lang.System", "gc");

                        overlayImage = imageOverlayManager.loadImageSync(overlayImageFormat, tempFile);
                        cb(null, overlayImage);
                    } catch (e) {
                        handleError(e, cb);
                    }
                }
            ], function (err, overlayImage) {
                deleteFile(tempFile);
                deleteFile(fileToResize);
                callback(err, overlayImage);
            });
        } catch (e) {
            handleError(e, callback);
        }
    }

    /**
     * Re-sizes the specified image to specified width and height (if necessary) keeping the original image aspect
     * ratio and passes it to specified callback.
     *
     * @param {Number} maxWidth - the maximum width (in pixels) of the created copy or -1 if original image width must
     *        be used.
     * @param {Number} maxHeight - the maximum height (in pixels) of the created copy or -1 if original image height
     *         must be used.
     * @param {String} imageFormat - the type of the image.
     * @param {Buffer} imageContent - a buffer providing the content of the image.
     * @param {Function<err, Image>} callback - a callback to be called with re-sizing is done.
     */
    function resizeIfNecessary(maxWidth, maxHeight, imageFormat, imageContent, callback) {
        log('resizeIfNecessary called with :  maxWidth = ' + maxWidth + ", maxHeight = " + maxHeight
            + ", imageFormat = " + imageFormat + ", imageContent = " + imageContent.constructor.name);
        try {
            var mustResizeWidth = false,
                mustResizeHeight = false,
                tempFile = createTempFile(3),
                fileToResize,
                resizer,
                resizedImage;

            async.waterfall([
                function (cb) {
                    writeFile(tempFile.getPathSync(), imageContent, cb);
                }, function (cb) {
                    try {
                        var image = imageOverlayManager.loadImageSync(imageFormat, tempFile.getPathSync());
                        cb(null, image);
                    } catch (e) {
                        handleError(e, cb);
                    } finally {
                        deleteFile(tempFile);
                    }
                }, function (image, cb) {
                    // Determine if there is a need to resize either by height or by width
                    if (maxWidth !== ORIGINAL_IMAGE_SIZE) {
                        mustResizeWidth = (image.getWidthSync() > maxWidth);
                    }
                    if (maxHeight !== ORIGINAL_IMAGE_SIZE) {
                        mustResizeHeight = (image.getHeightSync() > maxHeight);
                    }
                    log("mustResizeWidth=" + mustResizeWidth + ", mustResizeHeight=" + mustResizeHeight);

                    // Resize the image if necessary
                    if (mustResizeWidth || mustResizeHeight) {
                        fileToResize = createTempFile(4);

                        writeFile(fileToResize.getPathSync(), imageContent, function (err) {
                            if (err) {
                                deleteFile(fileToResize);
                                cb(err);
                            } else {
                                // Resize by width first if necessary
                                tempFile = createTempFile(5);
                                try {
                                    if (mustResizeWidth) {
                                        resizer = java.newInstanceSync('com.topcoder.image.size.ImageResizer', fileToResize);
                                        resizer.scaleToWidthSync(tempFile, maxWidth);
                                        resizer = null;

                                        // Force garbage collection to release the file locks put by JAI
                                        java.callStaticMethodSync("java.lang.System", "gc");
                                        java.callStaticMethodSync("java.lang.System", "gc");
                                        java.callStaticMethodSync("java.lang.System", "gc");

                                        // Check again if resizing by height is still necessary
                                        resizedImage = imageOverlayManager.loadImageSync(imageFormat, tempFile);
                                        if (maxHeight !== ORIGINAL_IMAGE_SIZE) {
                                            mustResizeHeight = (resizedImage.getHeightSync() > maxHeight);
                                        }
                                        if (mustResizeHeight) {
                                            api.helper.copyFiles(api, tempFile.getPathSync(), fileToResize.getPathSync(), function (err) {
                                                if (err) {
                                                    throw new Error(err);
                                                }
                                            });
                                        }
                                    }

                                    // Resize by height if necessary
                                    if (mustResizeHeight) {
                                        resizer = java.newInstanceSync('com.topcoder.image.size.ImageResizer', fileToResize);
                                        resizer.scaleToHeightSync(tempFile, maxHeight);
                                        resizer = null;

                                        // Force garbage collection to release the file locks put by JAI
                                        java.callStaticMethodSync("java.lang.System", "gc");
                                        java.callStaticMethodSync("java.lang.System", "gc");
                                        java.callStaticMethodSync("java.lang.System", "gc");

                                    }

                                    image = imageOverlayManager.loadImageSync(imageFormat, tempFile);
                                    deleteFile(tempFile);
                                    deleteFile(fileToResize);
                                    cb(null, image);
                                } catch (e) {
                                    handleError(e, cb);
                                } finally {
                                    deleteFile(tempFile);
                                    deleteFile(fileToResize);
                                }
                            }
                        });
                    } else {
                        cb(null, image);
                    }
                }
            ], callback);
        } catch (e) {
            handleError(e, callback);
        }
    }

    /**
     * Watermarks the specified image with pre-configured overlay image and writes generated image content to specified
     * temporary file. The watermarked image is passed to specified callback.
     * 
     * @param {Image} targetImage - a target image to be watermarked.
     * @param {File} tempFile - a temporary file to write the watermarked image to.
     * @param {String} path - a path to file for the target image.
     * @param {Function<err, waterMarkedImage>} callback - a callback to be called when watermarking is finished.
     */
    function watermarkImage(targetImage, tempFile, path, callback) {
        log('watermarkImage called with : targetImage = ' + targetImage.constructor.name + ", tempFile = " + tempFile
            + ", path = " + path);
        async.waterfall([
            function (cb) {
                resizeOverlayImage(targetImage, cb);
            }, function (overlayImage, cb) {
                try {
                    var widthOffset = parseInt(Math.max(0, (targetImage.getWidthSync() - overlayImage.getWidthSync()) / 2), 10),
                        heightOffset = parseInt(Math.max(0, (targetImage.getHeightSync() - overlayImage.getHeightSync()) / 2), 10),
                        overlaySpec,
                        watermarker;

                    overlaySpec = java.newInstanceSync('com.topcoder.imaging.overlay.OverlaySpecification', transSpec,
                        cropOverlayImage, widthOffset, heightOffset);

                    watermarker = java.newInstanceSync('com.topcoder.imaging.overlay.Watermarker', imageOverlayManager,
                        overlayImage, overlaySpec);
                    watermarker.watermarkImage(targetImage, cb);

                    overlaySpec = null;
                    watermarker = null;
                } catch (e) {
                    handleError(e, cb);
                }
            }, function (watermarkedImage, cb) {
                try {
                    imageOverlayManager.storeImageSync(watermarkedImage, config.watermark.fileType, tempFile);
                    var pos = path.lastIndexOf('.');
                    api.helper.copyFiles(api, tempFile.getPathSync(),
                        path.substring(0, pos + 1) + config.watermark.fileType.toLowerCase(),
                        function (err) {
                            if (err) {
                                cb(err);
                            } else {
                                cb(null, watermarkedImage);
                            }
                        });
                } catch (e) {
                    handleError(e, cb);
                }
            }
        ], callback);
    }

    /**
     * Generates the alternate representation of specified type for the specified image. Passes the generated image to
     * specified callback.
     *
     * @param {String} path - the name of the file.
     * @param {boolean} watermark - true< if create image copy must be watermarked; false otherwise.
     * @param {Number} maxSize - the maximum size (in pixels) of the created copy or -1 if original image size must be
     *        used.
     * @param {Buffer} imageContent - buffer providing the content of original image.
     * @param {Object} imageFileType - the file type for the image to be watermarked.
     * @param {Function<err, Image>} callback - the callback to be called on created image.
     */
    function createPresentation(path, watermark, maxSize, imageContent, imageFileType, callback) {
        log('createPresentation called with : path = ' + path + ", watermark = " + watermark + ", maxSize = " + maxSize
            + ", imageContent = " + imageContent.constructor.name + ", imageFileType = " + JSON.stringify(imageFileType));
        var imageFormat = null,
            extension = imageFileType.extension,
            imageFormatIndex = IMAGE_OVERLAY_SUPPORTED_TYPES.indexOf(extension.toUpperCase()),
            processedImageFile,
            tempFile;

        if (imageFormatIndex < 0) {
            callback(new IllegalArgumentError("The image file type [" + extension + "] is not supported by "
                + "Image Overlay component"));
            return;
        }

        imageFormat = IMAGE_OVERLAY_SUPPORTED_TYPES[imageFormatIndex];

        // A file which will hold the re-sized/watermarked image once the whole process succeeds
        processedImageFile = java.newInstanceSync('java.io.File', path);
        tempFile = createTempFile(6);

        async.waterfall([
            function (cb) {
                resizeIfNecessary(maxSize, maxSize, imageFormat, imageContent, cb);
            }, function (targetImage, cb) {
                if (watermark) {
                    watermarkImage(targetImage, tempFile, path, function (err, watermarkedImage) {
                        deleteFile(tempFile);
                        cb(err, watermarkedImage);
                    });
                } else {
                    try {
                        imageOverlayManager.storeImageSync(targetImage, imageFormat, processedImageFile);
                        cb(null, targetImage);
                        processedImageFile = null;
                        deleteFile(tempFile);
                    } catch (e) {
                        handleError(e, cb);
                    }
                }
            }
        ], callback);
    }

    /**
     * Generates the alternate presentations for the specified preview image.
     *
     * @param {Buffer} imageContent a <code>byte</code> array providing the content of the original image.
     * @param previewImageFileType a <code>StudioFileType</code> representing the type of the preview image.
     * @param previewImagePath a <code>String</code> providing the path to preview image within submission.
     * @param previewFileAvailable <code>true</code> if preview file is available in the submission; <code>false</code>
     *        otherwise.
     * @param {Function<err>} callback - a callback to be called with done.
     */
    function generatePreviewImagePresentations(imageContent, previewImageFileType, previewImagePath,
                                               previewFileAvailable, callback) {
        log("generatePreviewImagePresentations called with : imageContent = " + imageContent.constructor.name
            + ", previewImageFileType = " + previewImageFileType + ', previewImagePath = ' + previewImagePath
            + ", previewFileAvailable = " + previewFileAvailable);
        var imageName = calcAlternateFileName(previewImagePath, "image"),
            watermarkedImageName = calcAlternateFileName(previewImagePath, "imagew"),
            fullName;

        async.parallel([
            function (cb) {
                writeFile(imageName, imageContent, cb);
            }, function (cb) {
                createPresentation(watermarkedImageName, true, ORIGINAL_IMAGE_SIZE, imageContent, previewImageFileType,
                    cb);
            }, function (cb) {
                if (!previewFileAvailable) {
                    fullName = calcAlternateFileName(previewImagePath, "preview");
                    createPresentation(fullName, true, ORIGINAL_IMAGE_SIZE, imageContent, previewImageFileType, cb);
                } else {
                    cb();
                }
            }
        ], callback);
    }

    /**
     * Generates the images of specified type (tiny, small, etc) for specified image.
     * 
     * @param {String} originalImagePath - the path to original image file.
     * @param {Buffer} imageContent - the content of the original image.
     * @param {Object} imageFileType - the type of the original image.
     * @param {Array} imageTypeIds - array listing the IDs of type for the images to be generated.
     * @param {Array} imageTypeSizes - array listing the sizes of the images to be generated.
     * @param {Boolean} watermark - true if generated images must be watermarked; false otherwise.
     * @param {Number} fileIndex - the index of the original image in collection of images of same image type.
     * @param {Function<err,>} callback - the callback to be called once images are generated.
     */
    function generateImages(originalImagePath, imageContent, imageFileType, imageTypeIds, imageTypeSizes, watermark,
                            fileIndex, callback) {

        log("generateImages called with : originalImagePath = " + originalImagePath
            + ", imageContent = " + imageContent.constructor.name
            + ", imageFileType = " + imageFileType + ', imageTypeIds = ' + imageTypeIds
            + ", imageTypeSizes = " + imageTypeSizes + ", watermark = " + watermark + ", fileIndex = " + fileIndex);

        if (challenge.challengeCategoryId === 18) {
            log("Skipping image files generation for Wireframes challenge");
            callback();
        } else {
            var i = 0,
                imageSize,
                imageFileName,
                imagePath,
                pathId,
                imageId,
                sqlParams,
                generatedImagePresentation,
                justFileName;

            if (!_.isDefined(submission.images)) {
                submission.images = [];
            }

            async.eachSeries(imageTypeIds, function (imageTypeId, cb) {
                imageSize = imageTypeSizes[i];
                i = i + 1;
                imageFileName = calcAlternateFileName(originalImagePath, imageTypeId + '_' + fileIndex);
                async.waterfall([
                    function (cbx) { // Generate image of desired type
                        createPresentation(imageFileName, watermark, imageSize, imageContent, imageFileType, cbx);
                    }, function (presentation, cbx) { // Generate ID for path for new image
                        generatedImagePresentation = presentation;
                        api.idGenerator.getNextIDFromDb('PATH_SEQ', 'informixoltp', dbConnectionMap, cbx);
                    }, function (newPathId, cbx) { // Save new path for image to DB
                        pathId = newPathId;
                        imagePath = usv.createDesignSubmissionPath(challenge.challengeId, submitter.userId,
                            submitter.handle);
                        api.dataAccess.executeQuery('insert_path', {path_id: pathId, path: imagePath}, dbConnectionMap,
                            cbx);
                    }, function (insertCount, cbx) { // Generate ID for new image 
                        if (insertCount !== 1) {
                            cbx(new Error('Failed to insert record into path table'));
                        } else {
                            api.idGenerator.getNextIDFromDb('IMAGE_SEQ', 'informixoltp', dbConnectionMap, cbx);
                        }
                    }, function (newImageId, cbx) { // Save new image to DB
                        imageId = newImageId;
                        sqlParams = {};
                        sqlParams.image_id = newImageId;
                        sqlParams.image_type_id = imageTypeId;
                        sqlParams.path_id = pathId;
                        sqlParams.height = generatedImagePresentation.getHeightSync();
                        sqlParams.width = generatedImagePresentation.getWidthSync();
                        sqlParams.original_file_name = unifiedSubmissionValidator.getFileName(originalImagePath);

                        justFileName = unifiedSubmissionValidator.getFileName(imageFileName);
                        if (watermark) {
                            // If the image is watermarked then the extension must be changed to match the type of
                            // watermarked image
                            var pos = justFileName.lastIndexOf(".");
                            sqlParams.file_name
                                = justFileName.substring(0, pos + 1) + config.watermark.fileType.toLowerCase();
                        } else {
                            sqlParams.file_name = justFileName;
                        }

                        api.dataAccess.executeQuery('insert_design_image', sqlParams, dbConnectionMap, cbx);
                    }, function (insertCount, cbx) { // Link created image to submission 
                        if (insertCount !== 1) {
                            cbx(new Error('Failed to insert record into image table'));
                        } else {
                            submission.images.push({imageId: imageId, sortIndex: fileIndex});
                            cbx();
                        }
                    }
                ], cb);
            }, callback);
        }
    }

    /**
     * Analyzes the submitted file and creates the files with alternate representations of the submission.
     * 
     * @param {Function<err>} callback - a callback to be called when file generation is done.
     */
    imageFileGenerator.generateFiles = function (callback) {
        var start = new Date().getTime(),
            submissionUpdated = false,
            fileIndex = 1,
            fileName,
            fileContent,
            fileType,
            fullName,
            analyzer,
            previewFileAnalyzer,
            previewFileContent,
            files,
            filesArray,
            designSubmissionPath,
            sepPos,
            subDir;

        log('generateFiles called with : challenge = ' + JSON.stringify(challenge)
            + ", submitter = " + JSON.stringify(submitter) + ", submission = " + JSON.stringify(submission)
            + ", submissionFile = " + JSON.stringify(submissionFile));

        // This is a temporary check. Once the submitForDesignChallenge action is integrated with this file generator
        // this check may be removed as it will be responsibility of submitForDesignChallenge to create directory
        // for generated submission files
        designSubmissionPath = usv.createDesignSubmissionPath(challenge.challengeId,
            submitter.userId, submitter.handle);
        sepPos = designSubmissionPath.indexOf(path.sep);
        while (sepPos >= 0) {
            if (sepPos !== 0) {
                subDir = designSubmissionPath.substring(0, sepPos);
                if (!fs.existsSync(subDir)) {
                    log('Creating directory : ' + subDir);
                    fs.mkdirSync(subDir);
                }
            }
            sepPos = designSubmissionPath.indexOf(path.sep, sepPos + 1);
        }

        async.waterfall([
            function (cb) { // Get the bundled file analyzer for submission file
                fileName = submissionFile.name;
                log('fileName = ' + fileName);
                unifiedSubmissionValidator.getBundledFileParser(fileName, cb);
            }, function (bundledFileAnalyzer, cb) { // Analyze submission file and retrieve content of nested entries
                analyzer = bundledFileAnalyzer;
                analyzer.analyze(submissionFile.path, true, cb);
            }, function (bundledFileAnalyzer, cb) { // Generate presentation files for preview image (if provided)
                analyzer = bundledFileAnalyzer;
                log('analyzer.isPreviewImageAvailable() = ' + analyzer.isPreviewImageAvailable());
                if (analyzer.isPreviewImageAvailable()) {
                    fileName = unifiedSubmissionValidator.getFileName(analyzer.getPreviewImagePath());
                    fileContent = analyzer.getPreviewImageContent();
                    fileType = analyzer.getPreviewImageFileType();
                    log('fileName = ' + fileName + ", fileType = " + JSON.stringify(fileType));
                    async.waterfall([
                        function (cbx) {
                            generateImages(fileName, fileContent, fileType, GALLERY_PLAIN_IMAGE_TYPE_IDS,
                                GALLERY_PLAIN_IMAGE_SIZES, false, fileIndex, cbx);
                        }, function (cbx) {
                            generateImages(fileName, fileContent, fileType, GALLERY_WATERMARKED_IMAGE_TYPE_IDS,
                                GALLERY_WATERMARKED_IMAGE_SIZES, true, fileIndex, cbx);
                        }, function (cbx) {
                            generatePreviewImagePresentations(fileContent, fileType, fileName,
                                analyzer.isPreviewFileAvailable(), cbx);
                        }
                    ], function (err) {
                        log('PREVIEW IMAGE GENERATION FINISHED FOR ' + fileName + " WITH " + err);
                        if (err) {
                            cb(err);
                        } else {
                            fileIndex = fileIndex + 1;
                            submissionUpdated = true;
                            cb();
                        }
                    });
                } else {
                    cb();
                }
            }, function (cb) { // Generate presentation files for preview file (if provided)
                log('analyzer.isPreviewFileAvailable() = ' + analyzer.isPreviewFileAvailable());
                if (analyzer.isPreviewFileAvailable()) {
                    async.waterfall([
                        function (cbx) {
                            fullName = calcAlternateFileName(analyzer.getPreviewFilePath(), "preview");
                            previewFileContent = analyzer.getPreviewFileContent();
                            writeFile(fullName, previewFileContent, cbx);
                        }, function (cbx) {
                            if (GALLERY_IDS.indexOf(challenge.challengeCategoryId) >= 0) {
                                async.waterfall([
                                    function (cbb) {
                                        unifiedSubmissionValidator.getBundledFileParser(analyzer.getPreviewFilePath(), cbb);
                                    }, function (bundledFileAnalyzer, cbb) {
                                        var fileName1;

                                        previewFileAnalyzer = bundledFileAnalyzer;
                                        files = previewFileAnalyzer.getFiles(previewFileContent);
                                        filesArray = [];

                                        for (fileName1 in files) {
                                            if (files.hasOwnProperty(fileName1)) {
                                                fileContent = files[fileName1];
                                                filesArray.push({fileName: fileName1, fileContent: fileContent});
                                                delete files[fileName1];
                                            }
                                        }
                                        files = null;

                                        async.eachSeries(filesArray, function (file, cbc) {
                                            fileName = file.fileName;
                                            fileContent = file.fileContent;
                                            async.waterfall([
                                                function (cbd) {
                                                    unifiedSubmissionValidator.getFileType(fileName, cbd);
                                                }, function (fileType, cbd) {
                                                    if ((fileType !== null) && fileType.image_file) {
                                                        async.waterfall([
                                                            function (cbe) {
                                                                generateImages(fileName, fileContent, fileType,
                                                                    GALLERY_PLAIN_IMAGE_TYPE_IDS,
                                                                    GALLERY_PLAIN_IMAGE_SIZES, false, fileIndex, cbe);
                                                            }, function (cbe) {
                                                                generateImages(fileName, fileContent, fileType,
                                                                    GALLERY_WATERMARKED_IMAGE_TYPE_IDS,
                                                                    GALLERY_WATERMARKED_IMAGE_SIZES, true, fileIndex,
                                                                    cbe);
                                                            }, function (cbe) {
                                                                // Use the first image from the gallery as preview image
                                                                if (fileIndex === 1) {
                                                                    generatePreviewImagePresentations(fileContent,
                                                                        fileType, fileName,
                                                                        analyzer.isPreviewFileAvailable(), cbe);
                                                                } else {
                                                                    cbe();
                                                                }
                                                            }
                                                        ], function (err) {
                                                            if (err) {
                                                                cbd(err);
                                                            } else {
                                                                fileIndex = fileIndex + 1;
                                                                submissionUpdated = true;
                                                                cbd();
                                                            }
                                                        });
                                                    } else {
                                                        cbd();
                                                    }
                                                }
                                            ], cbc);
                                        }, cbb);
                                    }
                                ], cbx);
                            } else {
                                cbx();
                            }
                        }
                    ], cb);
                } else {
                    cb();
                }
            }, function (cb) {
                if (submissionUpdated) {
                    async.each(submission.images, function (submissionImage, cbx) {
                        api.dataAccess.executeQuery('insert_submission_image',
                            {submission_id: submission.submissionId, image_id: submissionImage.imageId,
                                sort_index: submissionImage.sortIndex},
                            dbConnectionMap, cbx);
                    }, cb);
                } else {
                    cb();
                }
            }
        ], function (err) {
            api.log("generating images for submission " + submission.submissionId + " took "
                + (new Date().getTime() - start) + " ms", "info");
            callback(err);
        });
    };

    return imageFileGenerator;
};