/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.41
 * @author vangavroche, Sky_, muzehyun, kurtrips, Ghost_141, ecnu_haozi, hesibo, LazyChild, bugbuka, isv, flytoj2ee, panoptimum
 * Changes in 1.1:
 * - add routes for search challenges
 * Changes in 1.2:
 * - add route for top
 * Changes in 1.3:
 * - add routes for all stub methods
 * - add routes for cache test
 * Changes in 1.4:
 * - reorder route for studio contest details
 * Changes in 1.5:
 * - add routes for software rating history and distribution
 * - reorder route for studio challenge details
 * Changes in 1.6:
 * - add route oauth, oauth test
 * Changes in 1.7:
 * - added routes for challenge results
 * Changes in 1.8:
 * - add route for bugs
 * Changes in 1.9:
 * - add route for client challenge costs
 * Changes in 1.10:
 * - added routes for terms api
 * Changes in 1.11:
 * - add invoice history api.
 * - added route for dev download submission api
 * Changes in 1.12:
 * - added route for dev upload submission api
 * - added route for create customer
 * Changes in 1.13:
 * - added route for create billing api
 * - added register challenge for a given user api.
 * Changes in 1.14:
 * - added route for active billing accounts
 * - added routes for terms api
 * Changes in 1.15:
 * - added routes for getting studio and software checkpoints
 * Changes in 1.16:
 * - added routes for validate handle
 * - added route for downloading design submissions
 * changes in 1.17:
 * - Combine Challenge Registration API(BUGR-11058)
 * changes in 1.18:
 * - added routes for data platforms and technologies
 * Changes in 1.19:
 * - added route for agree term of use api.
 * Changes in 1.20:
 * - update get review opportunity api name to getSoftwareReviewOpportunity.
 * - Update path to use challengeId which is more clear.
 * changes in 1.21:
 * - added route for recent winning design submissions api
 * changes in 1.22
 * - added route for member search api
 * changes in 1.23
 * - added route for check email availability api
 * changes in 1.24
 * - added stub api for reset token and reset password
 * changes in 1.25
 * - add route for register marathon match challenge api.
 * - added api for docusign callback
 * changes in 1.26:
 * - added route for handling design submission
 * changes in 1.27
 * - separate basic user profile api into my profile api and public profile api
 * changes in 1.28
 * - added route for Dosusign get recipient view url
 * changes in 1.29
 * - added route for activate user api
 * changes in 1.30
 * - added route for getting marathon match challenge register info api
 * Changes in 1.31:
 * - add route for challenge rss output api.
 * changes in 1.32:
 * - added route for Challenge Unregistration API
 * Changes in 1.33:
 * - add route for apply develop review opportunities api.
 * changes in 1.34:
 * - added route for client active challenge costs
 * changes in 1.35:
 * - added route for auth0 callback api
 * Changes in 1.36
 * - add route for get payment list api.
 * Changes in 1.37:
 * - add route for track statistics API.
 * Changes in 1.38:
 * - add route for upload member photo API.
 * Changes in 1.39:
 * - add routes for payment preference api.
 * Changes in 1.40:
 * - Add routes for new split challenges API.
 * Changes in 1.41:
 * - add route for challenge analyze api.
 */

/* ---------------------
routes.js

For web clients (http and https) you can define an optional RESTful mapping to help route requests to actions.
If the client doesn't specify and action in a param, and the base route isn't a named action,
the action will attempt to be discerned from this routes.js file.

- routes remain optional
- actions defiend in params directly `action=theAction` or hitting the named URL for an action `/api/theAction`
    will always override RESTful routing
- you can mix explicitly defined params with route-defined params. If there is an overlap, the route-defined params win
  - IE: /api/user/123?userId=456 => `connection.userId = 123`
  - this is a change from previous versions
- routes defined with the "all" method will be duplicated to "get", "put", "post", and "delete"
- use ":variable" to defined "variable"
- undefined ":variable" will match
  - IE: "/api/user/" WILL match "/api/user/:userId"
- routes are matched as defined here top-down
- you can optionally define a regex match along with your route variable
  - IE: { path:"/game/:id(^[a-z]{0,10}$)", action: "gamehandler" }
  - be sure to double-escape when needed: { path: "/login/:userID(^\\d{3}$)", action: "login" }

example:

{
  get: [
    { path: "/users", action: "usersList" }, // (GET) /api/users
    { path: "/search/:term/limit/:limit/offset/:offset", action: "search" }, // (GET) /api/search/car/limit/10/offset/1
  ],

  post: [
    { path: "/login/:userID(^\\d{3}$)", action: "login" } // (POST) /api/login/123
  ],

  all: [
    { path: "/user/:userID", action: "user" } // (*) / /api/user/123
  ]
}

---------------------- */

/**
 * Methods that are used only in test cases.
 */
var testMethods = {
    get: [
        {path: "/test/cache/oauth", action: "cacheTestOAuth"},
        {path: "/test/cache/error", action: "cacheTestError"},
        {path: "/test/cache/hits", action: "cacheTestGetHits"},
        {path: "/test/cache/reset", action: "cacheTestResetHits"},
        {path: "/test/cache/disabled", action: "cacheDisabled"},
        {path: "/test/cache", action: "cacheTest"},
        {path: "/test/oauth", action: "oauthTest"}
    ]
};



////////////
// ROUTES //
////////////

exports.routes = {
    get: [
        { path: "/:apiVersion/logs", action: "getLogTail" },
        { path: "/:apiVersion/challenges/registrants/:challengeId", action: "getRegistrants" },
        { path: "/:apiVersion/challenges/submissions/:challengeId", action: "getSubmissions" },
        { path: "/:apiVersion/challenges/phases/:challengeId", action: "getPhases" },
        { path: "/:apiVersion/challenges/rss", action: "getChallengesRSS" },
        { path: "/:apiVersion/challenges/active", action: "getActiveChallenges" },
        { path: "/:apiVersion/challenges/open", action: "getOpenChallenges" },
        { path: "/:apiVersion/challenges/upcoming", action: "getUpcomingChallenges" },
        { path: "/:apiVersion/challenges/past", action: "getPastChallenges" },
        { path: "/:apiVersion/challenges/:challengeId", action: "getChallenge" },
        { path: "/:apiVersion/challenges", action: "searchSoftwareAndStudioChallenges" },

        { path: "/:apiVersion/develop/challenges/checkpoint/:challengeId", action: "getSoftwareCheckpoint" },
        { path: "/:apiVersion/design/challenges/checkpoint/:challengeId", action: "getStudioCheckpoint" },

        { path: "/:apiVersion/develop/challengetypes", action: "softwareTypes" },
        { path: "/:apiVersion/develop/challenges/result/:challengeId", action: "getSoftwareChallengeResults" },
        { path: "/:apiVersion/develop/challenges/:challengeId", action: "getSoftwareChallenge" },
        { path: "/:apiVersion/develop/statistics/tops/:contestType", action: "getTops" },
        { path: "/:apiVersion/develop/statistics/:handle/:challengeType", action: "getSoftwareRatingHistoryAndDistribution" },
        { path: "/:apiVersion/develop/challenges", action: "searchSoftwareChallenges" },
        { path: "/:apiVersion/develop/reviewOpportunities/:challengeId", action: "getSoftwareReviewOpportunity" },
        { path: "/:apiVersion/develop/reviewOpportunities", action: "searchReviewOpportunities" },
        { path: "/:apiVersion/develop/download/:submissionId", action: "downloadDevSubmission" },

        { path: "/:apiVersion/design/challengetypes", action: "studioTypes" },
        { path: "/:apiVersion/design/challenges/result/:challengeId", action: "getStudioChallengeResults" },
        { path: "/:apiVersion/design/reviewOpportunities/:id", action: "getStudioReviewOpportunity" },
        { path: "/:apiVersion/design/challenges/:challengeId", action: "getStudioChallenge" },
        { path: "/:apiVersion/design/challenges", action: "searchStudioChallenges" },
        { path: "/:apiVersion/design/reviewOpportunities", action: "getStudioReviewOpportunities" },
        { path: "/:apiVersion/design/download/:submissionId", action: "downloadDesignSubmission" },

        { path: "/:apiVersion/users/resetToken", action: "generateResetToken" },

        { path: "/:apiVersion/users/validateEmail", action: "emailValidation" },
        { path: "/:apiVersion/users/validate/:handle", action: "validateHandle" },
        { path: "/:apiVersion/users/validateSocial", action: "validateSocial" },

        { path: "/:apiVersion/users/activate", action: "activateUser" },
        { path: "/:apiVersion/users/search", action: "searchUsers" },
        { path: "/:apiVersion/users/:handle/statistics/develop", action: "getSoftwareStatistics" },
        { path: "/:apiVersion/users/:handle/statistics/design/recentWins", action: "getRecentWinningDesignSubmissions" },
        { path: "/:apiVersion/users/:handle/statistics/design", action: "getStudioStatistics" },
        { path: "/:apiVersion/users/:handle/statistics/data/marathon", action: "getMarathonStatistics" },
        { path: "/:apiVersion/users/:handle/statistics/data/srm", action: "getAlgorithmStatistics" },
        { path: "/:apiVersion/users/:handle", action: "getBasicUserProfile" },
        { path: "/:apiVersion/user/profile", action: "getMyProfile" },

        { path: "/:apiVersion/copilots/:handle/statistics/develop", action: "getCopilotStatistics" },

        { path: "/:apiVersion/data/srm/challenges/:id", action: "getSRMChallenge" },
        { path: "/:apiVersion/data/srm/challenges", action: "searchSRMChallenges" },
        { path: "/:apiVersion/data/marathon/challenges/:roundId/regInfo", action: "getMarathonChallengeRegInfo" },
        { path: "/:apiVersion/data/marathon/challenges/:id", action: "getMarathonChallenge" },
        { path: "/:apiVersion/data/marathon/challenges", action: "searchMarathonChallenges" },
        { path: "/:apiVersion/data/marathon/statistics/tops", action: "getMarathonTops" },
        { path: "/:apiVersion/data/srm/statistics/tops", action: "getSRMTops" },
        { path: "/:apiVersion/data/countries", action: "countries" },
        { path: "/:apiVersion/data/platforms", action: "getPlatforms" },
        { path: "/:apiVersion/data/technologies", action: "getTechnologies" },

        { path: "/:apiVersion/terms/:challengeId(\\d+)", action: "getChallengeTerms"},
        { path: "/:apiVersion/terms/detail/:termsOfUseId", action: "getTermsOfUse"},

        //example secure route using oauth. for future reference.
        { path: "/:apiVersion/secure/challengetypes", action: "softwareTypesSecured" },

        { path: "/:apiVersion/platform/statistics/:track", action: "getTrackStatistics" },
        { path: "/:apiVersion/platform/statistics", action: "tcDirectFacts" },
        { path: "/:apiVersion/platform/activeBillingAccounts", action: "getActiveBillingAccounts" },

        { path: "/:apiVersion/download/document/:docId", action: "downloadDocument" },

        { path: "/:apiVersion/reports/analyze", action: "getChallengeAnalyze" },
        { path: "/:apiVersion/reports/client/costs", action: "getClientChallengeCosts" },
        { path: "/:apiVersion/reports/client/activeChallenges", action: "getClientActiveChallengeCosts" },
        { path: "/:apiVersion/reports/costs/:startDate/:endDate", action: "getChallengeCosts" },

        { path: "/:apiVersion/bugs/:jiraProjectId/:status", action: "bugs" },
        { path: "/:apiVersion/bugs/:jiraProjectId", action: "bugs" },
        { path: "/:apiVersion/bugs", action: "bugs" },

        { path: "/:apiVersion/validation/sso", action: "ssoValidation" },


        { path: "/:apiVersion/payments/preference", action: "getPaymentPreference" },
        { path: "/:apiVersion/payments", action: "getPaymentList" },

        //Stubs APIs
        { path: "/:apiVersion/data/reviewOpportunities/:id", action: "getAlgorithmsReviewOpportunity" },
        { path: "/:apiVersion/data/reviewOpportunities", action: "getAlgorithmsReviewOpportunities" },
        { path: "/:apiVersion/software/reviewers/:contestType", action: "getChallengeReviewers" },
        { path: "/:apiVersion/design/statistics/tops/:challengeType", action: "getStudioTops" },
        { path: "/:apiVersion/data/challengetypes", action: "algorithmsChallengeTypes" },

        { path: "/:apiVersion/auth0/callback", action: "auth0Callback" }
    ].concat(testMethods.get),
    post: [
        // Stub API

        { path: "/:apiVersion/users/resetPassword/:handle", action: "resetPassword" },
        { path: "/:apiVersion/develop/reviewOpportunities/:challengeId/apply", action: "applyDevelopReviewOpportunity" },
        { path: "/:apiVersion/terms/docusignCallback", action: "docusignCallback" },
        { path: "/:apiVersion/terms/:termsOfUseId/agree", action: "agreeTermsOfUse" },
        { path: "/:apiVersion/users/photo", action: "uploadMemberPhoto" },
        { path: "/:apiVersion/users", action: "memberRegister" },
        { path: "/:apiVersion/develop/challenges/:challengeId/submit", action: "submitForDevelopChallenge" },
        { path: "/:apiVersion/design/challenges/:challengeId/submit", action: "submitForDesignChallenge" },
        { path: "/:apiVersion/challenges/:challengeId/register", action: "registerChallenge" },
        { path: "/:apiVersion/challenges/:challengeId/unregister", action: "unregisterChallenge" },
        { path: "/:apiVersion/auth", action: "generateJwt" },
        { path: "/:apiVersion/reauth", action: "refreshJwt" },
        { path: "/:apiVersion/platform/billing", action: "createBilling" },
        { path: "/:apiVersion/platform/customer", action: "createCustomer" },
        { path: "/:apiVersion/data/marathon/challenges/:roundId/register", action: "registerMarathonChallenge" },
        { path: "/:apiVersion/terms/docusign/viewURL", action: "generateDocusignViewURL"},
        { path: "/:apiVersion/payments/preference", action: "setPaymentPreference" }
    ]
};
