/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @author vangavroche, Ghost_141, kurtrips, Sky_, isv, bugbuka, flytoj2ee, onsky
 * @version 1.29
 * changes in 1.1:
 * - add defaultCacheLifetime parameter
 * changes in 1.2:
 * - add badgeProperties.
 * changes in 1.3:
 * - add oauthClientId and oauthClientSecret parameters
 * changes in 1.4:
 * - add oauthConnection and oauthDomain parameters
 * - added submissionLink and finalFixLink
 * changes in 1.5:
 * - add jiraWsdlUrl, jiraUsername and jiraPassword parameters
 * changes in 1.6:
 * - add corporate_oltp in database mapping.
 * changes in 1.7:
 * - add downloadsRootDirectory parameter
 * changes in 1.8:
 * - add time_oltp and corporate_oltp in databaseMapping.
 * - added uploadsRootDirectory, thurgoodDownloadUsername and thurgoodDownloadPassword parameters
 * changes in 1.9:
 * - add parameters for submission output directory, submission max size and thurgood endpoint parameters
 * changes in 1.10:
 * - add challengeCommunityLink and reviewAuctionDetailLink.
 * Changes in 1.11:
 * - add cachePrefix in config.general.
 * - added designSubmissionsBasePath for design submissions
 * changes in 1.12:
 * - add defaultUserCacheLifetime property.
 * changes in 1.13:
 * - add jive in database mapping.
 * - added the docusign object
 * - add grantForumAccess property.
 * Changes in 1.14:
 * - add redis.cacheFileTypesKey, redis.cacheDefaultLifetime, designSubmissionTmpPath, designSubmissionsBasePath
 * Changes in 1.15:
 * - added configuration for Docusign integration.
 * Changes in 1.16:
 * - add welcome email property.
 * Changes in 1.17:
 * - add maxRSSLength.
 * changes in 1.19:
 * - add defaultResetPasswordTokenCacheLifetime property.
 * - add resetPasswordTokenEmailSubject property.
 * changes in 1.20:
 * - add tcForumsServer property.
 * - add studioForumsServer property.
 * Changes in 1.21:
 * - add minPasswordLength and maxPasswordLength
 * - add resetTokenSuffix
 * Changes in 1.22:
 * - add auth0 configuration.
 * Changes in 1.23:
 * - Add member photo properties.
 * Changes in 1.24:
 * - Added 'watermark' configuration.
 * - Added designSubmission group of properties" from the UnifiedSubmissionValidator submission.
 * Changes in 1.25:
 * - Move configuration contents in tc-config.js
 * Changes in 1.26:
 * - Add studioReview object for get studio review opportunities api.
 * Changes in 1.27:
 * Add userActivationResendLimit and userActivationCacheLifeTime for user activation email api.
 * Changes in 1.28:
 * Add source code image generation configuration.
 * Changes in 1.29:
 * Add database timezone identifier configuration.
 */

"use strict";

var config = {
    defaultUserCacheLifetime: process.env.USER_CACHE_EXPIRY || 1000 * 60 * 60 * 24, //24 hours default
    userActivationResendLimit: 5,
    userActivationCacheLifeTime: 1000 * 60 * 60 * 23 * 30,
    pastChallengesCacheLifetime: 24 * 60 * 60 * 1000,
    resetTokenPrefix: 'tokens-',
    resetTokenSuffix: '-reset-token',
    minPasswordLength: 8,
    maxPasswordLength: 30,
    defaultResetPasswordTokenCacheLifetime: process.env.RESET_PASSWORD_TOKEN_CACHE_EXPIRY ? parseInt(process.env.RESET_PASSWORD_TOKEN_CACHE_EXPIRY, 10) : 1000 * 60 * 30, //30 min
    resetPasswordTokenEmailSubject: process.env.RESET_PASSWORD_TOKEN_EMAIL_SUBJECT || "TopCoder Account Password Reset",
    oauthClientId: process.env.OAUTH_CLIENT_ID || "CMaBuwSnY0Vu68PLrWatvvu3iIiGPh7t",
    //auth0 secret is encoded in base64!
    oauthClientSecret: new Buffer(process.env.OAUTH_CLIENT_SECRET || 'ZEEIRf_aLhvbYymAMTFefoEJ_8y7ELrUaboMTmE5fQoJXEo7sxxyg8IW6gtbyKuT', 'base64'),
    oauthConnection: process.env.OAUTH_CONNECTION || "vm-ldap-connection",
    oauthDomain: process.env.OAUTH_DOMAIN || "sma",
    jiraWsdlUrl: "https://apps.topcoder.com/bugs/rpc/soap/jirasoapservice-v2?wsdl",
    jiraUsername: process.env.JIRA_USERNAME,
    jiraPassword: process.env.JIRA_PASSWORD,
    developForumsUrlPrefix: (process.env.TC_FORUMS_SERVER_NAME || "http://forums.topcoder.com/") + '?module=Category&categoryID=',
    studioForumsUrlPrefix: (process.env.STUDIO_FORUMS_SERVER_NAME || "http://studio.topcoder.com/forums") + '?module=ThreadList&forumID=',
    designForumUrlPrefix: 'http://apps.topcoder.com/forums/?module=ThreadList&forumID=',
    grantForumAccess: process.env.GRANT_FORUM_ACCESS === "true" ? true : false, // false by default, used in challenge registration API
    devForumJNDI: process.env.DEV_FORUM_JNDI || "jnp://env.topcoder.com:1199",
    downloadsRootDirectory: process.env.DOWNLOADS_ROOT_DIRECTORY || __dirname + "/downloads",
    challengeCommunityLink: 'http://community.topcoder.com/tc?module=ProjectDetail&pj=',
    reviewAuctionDetailLink: 'http://community.topcoder.com/tc?module=ReviewAuctionDetails&aid=',
    databaseTimezoneIdentifier: '-0400',

    /**
     * The directory where uploaded files are stored.
     * It can be relative to the current directory or can be absolute
     */
    uploadsRootDirectory: process.env.UPLOADS_ROOT_DIRECTORY || "test/test_files/dev_download_submission",
    maxRSSLength: 1000,
    memberPhoto: {
        fileSizeLimit: process.env.PHOTO_SIZE_LIMIT || 1048576,
        validTypes: ['jpeg', 'png', 'bmp', 'jpg'],
        storeDir: process.env.PHOTO_STORE_DIR || 'test/tmp/memberPhoto/'
    },

    databaseMapping: {
        "common_oltp" : "TC_DB",
        "informixoltp" : "TC_DB",
        "tcs_catalog" : "TC_DB",
        "topcoder_dw" : "TC_DW",
        "tcs_dw" : "TC_DW",
        "time_oltp": "TC_DB",
        "corporate_oltp": "TC_DB",
        "jive": "TC_DB"
    },

    documentProvider: 'http://community.topcoder.com/tc?module=DownloadDocument&docid',

    defaultPassword: process.env.DEFAULT_PASSWORD  || "defaultpass",

    submissionLink: 'https://software.topcoder.com/review/actions/DownloadContestSubmission.do?method=downloadContestSubmission&uid=',
    finalFixLink: 'https://software.topcoder.com/review/actions/DownloadFinalFix.do?method=downloadFinalFix&uid=',
    designSubmissionLink: 'https://api.topcoder.com/v2/design/download/',
    // stores the parameters that need sent to the 'submission' request
    submissionDownloadLinkParams: '?submissionType=original',
    //stores the parameters that need to be included in the 'preview' request
    //29 means small
    previewDownloadLinkParams: "?submissionType=preview&submissionImageTypeId=29",

    //The name of the folder where to store the submission files.
    //Please make sure the directory already exists
    submissionDir: process.env.SUBMISSION_DIR || 'test/tmp/submissions',

    /**
     * The thurgood username and password used for downloading submissions
     */
    thurgoodDownloadUsername: process.env.THURGOOD_DOWNLOAD_USERNAME || "iamthurgood",
    thurgoodDownloadPassword: process.env.THURGOOD_DOWNLOAD_PASSWORD || "secret",

    //Max size of a submission. Currently set to 100M for now.
    submissionMaxSizeBytes: process.env.DEVELOP_SUBMISSION_MAX_SIZE || 104857600,

    //////Thurgood configurables///////
    thurgoodCodeUrl: 'https://software.topcoder.com/review/actions/DownloadContestSubmission.do?method=downloadContestSubmission%26uid=',

    //API URL for production
    //config.thurgoodApiUrl = 'https://thurgood-production.herokuapp.com/api/1/jobs',
    //API URL for testing
    thurgoodApiUrl: process.env.THURGOOD_API_URL || 'http://localhost:8090/',

    thurgoodTimeout: 5000,

    //API KEY for testing
    //Can be overwritten by an environment variable of name THURGOOD_API_KEY
    thurgoodApiKey: process.env.THURGOOD_API_KEY || 'mock_api_key',

    //The base directory for design submission files. This directory must exist.
    designSubmissionsBasePath: process.env.DESIGN_SUBMISSIONS_BASE_PATH || 'test/tmp/design_submissions/',
    //The temporary directory for creating unified zip file
    designSubmissionTmpPath: process.env.DESIGN_SUBMISSIONS_TMP_PATH || 'test/tmp/design_tmp_submissions/',

    cacheFileTypesKey: "file_types",
    defaultCacheLifetime : process.env.CACHE_EXPIRY || 1000 * 60 * 10, //10 min default

    technologiesCacheKey: "technologies",
    platformsCacheKey: 'platforms',

    //The configuration for the DocuSign integration
    docusign: {
        username: process.env.DOCUSIGN_USERNAME || '3c484022-cfd1-4be8-b199-951933a1e81b',
        password: process.env.DOCUSIGN_PASSWORD || 'dN1ofminimum',
        integratorKey: process.env.DOCUSIGN_INTEGRATOR_KEY || 'TOPC-a02ca014-0677-4e7f-946b-3a03f803c937',
        serverURL: process.env.DOCUSIGN_SERVER_URL || 'https://demo.docusign.net/restapi/v2/',
        roleName: process.env.DOCUSIGN_ROLENAME || 'Member',
        clientUserId: process.env.DOCUSIGN_CLIENT_USER_ID || 'Member',
        returnURL: process.env.DOCUSIGN_RETURN_URL || 'http://localhost:8080/v2/terms/docusign/returnSigning&envelopeId=<%= envelopeId %>',
        assignmentV2TemplateId: process.env.DOCUSIGN_ASSIGNMENT_V2_TEMPLATE_ID || 'E12C78DE-67B1-4150-BEC8-C44CE20A2F0B',
        w9TemplateId: process.env.DOCUSIGN_W9TEMPLATE_ID || '8E95BEB4-1C77-4CE2-97C7-5F64A3366370',
        w8benTemplateId: process.env.DOCUSIGN_W8BEN_TEMPLATE_ID || 'CD415871-17F5-4A1E-A007-FE416B030FFB',
        appirioMutualNDATemplateId: process.env.DOCUSIGN_NDA_TEMPLATE_ID || '19D958E1-E2EC-4828-B270-CA8F14CF7BF4',
        affidavitTemplateId: process.env.DOCUSIGN_AFFIDAVIT_TEMPLATE_ID || '9103DC77-D8F1-4D7B-BED1-6116604EE98C',
        assignmentDocTermsOfUseId: process.env.ASSIGNMENT_TERMS_OF_USE_ID || 20753,
        callbackFailedEmailSubject: process.env.DOCUSIGN_CALLBACK_FAILED_EMAIL_SUBJECT || 'Processing DocuSign document failed',
        callbackConnectKey: process.env.DOCUSIGN_CALLBACK_CONNECT_KEY || 'ABCDED-12435-EDFADSEC',
        supportEmailAddress: process.env.DOCUSIGN_CALLBACK_FAILED_SUPPORT_EMAIL_ADDRESS || 'arahant7@yahoo.com',
        fromEmailAddress: process.env.DOCUSIGN_CALLBACK_FAILED_FROM_EMAIL_ADDRESS || 'do-not-reply@topcoder.com'
    },

    welcomeEmail: {
        template: 'welcome_email',
        subject: 'Welcome to topcoder',
        fromAddress: process.env.TC_EMAIL_FROM,
        senderName: 'Topcoder API'
    },

    auth0: {
        serverName: process.env.AUTH0_SERVER_NAME || 'http://agile-crag-5056.herokuapp.com',
        clientSecret: process.env.AUTH0_CLIENT_SECRET || '80LhxpoArWfAbgiIekJnDOpRVQcIrjBZ8DGnjDLUFdswwkCOI8zaUhGUZ5dr_2fg',
        redirectUrl: process.env.AUTH0_REDIRECT_URL || '/v2/auth0/callback'
    },

    watermark: {
        filePath: process.env.WATERMARK_FILE_PATH || '/home/studio/web/resources/studio/studio_logo_watermark.png',
        fileType: process.env.WATERMARK_FILE_TYPE || 'PNG',
        baseImageTransparency: process.env.WATERMARK_BASE_IMAGE_TRANSPARENCY || '50',
        overlayImageTransparency: process.env.WATERMARK_OVERLAY_IMAGE_TRANSPARENCY || '100',
        overlayImageRed: process.env.WATERMARK_OVERLAY_IMAGE_RED || '0',
        overlayImageGreen: process.env.WATERMARK_OVERLAY_IMAGE_GREEN || '0',
        overlayImageBlue: process.env.WATERMARK_OVERLAY_IMAGE_BLUE || '0'
    },

    galleryIds: [16, 17, 18, 20, 21, 22, 23, 30, 32],

    designSubmission: {
        sourcePrefix: 'source/',
        submissionPrefix: 'submission/'
    },

    jvm: {
        minMemory: '128m',
        maxMemory: process.env.TC_API_MAX_MEMORY || '2048m'
    },

    studioReview: {
        specTerms: 'http://studio.topcoder.com/?module=SpecViewReviewTerms&ct=',
        reviewTerms: 'http://studio.topcoder.com/?module=ViewReviewTerms&ct='
    },

    generateSourceCodeImage: {
        wkhtmltoimageCommandPath: process.env.WKHTMLTOIMAGE_COMMAND_PATH || 'wkhtmltoimage',
        styleLink: process.env.HIGHLIGHT_STYLE_LINK || 'http://cdnjs.cloudflare.com/ajax/libs/highlight.js/8.3/styles/%OVERRIDE_STYLE_NAME%.min.css',
        wkhtmlToImageOptions: {
            Format: 'jpg',
            Quality: 94,
            width: process.env.WKHTMLTOIMAGE_IMAGE_WIDTH || 1024
        }
    }
};
module.exports.tcConfig = config;

exports.default = {
    tcConfig: function () {
        return config;
    }
};
