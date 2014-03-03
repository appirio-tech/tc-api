/*
 * Copyright (C) 2013 - 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.13
 * @author vangavroche, Sky_, TCSASSEMBLER, muzehyun, kurtrips, Ghost_141, ecnu_haozi
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
 * Changes in 1.12:
 * - added route for dev upload submission api
 * Changes in 1.13
 * - added register challenge for a given user api.
 * Changes in 1.14:
 * - added route for active billing accounts
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
        { path: "/:apiVersion/challenges", action: "searchSoftwareAndStudioChallenges" },

        { path: "/:apiVersion/develop/challenges/:challengeId/register", action: "registerSoftwareChallenge" },
        { path: "/:apiVersion/develop/challengetypes", action: "softwareTypes" },
        { path: "/:apiVersion/develop/challenges/result/:challengeId", action: "getSoftwareChallengeResults" },
        { path: "/:apiVersion/develop/challenges/:contestId", action: "getSoftwareChallenge" },
        { path: "/:apiVersion/develop/statistics/tops/:contestType", action: "getTops" },
        { path: "/:apiVersion/develop/statistics/:handle/:challengeType", action: "getSoftwareRatingHistoryAndDistribution" },
        { path: "/:apiVersion/develop/challenges", action: "searchSoftwareChallenges" },
        { path: "/:apiVersion/develop/reviewOpportunities", action: "searchReviewOpportunities" },

        { path: "/:apiVersion/design/challenges/:challengeId/register", action: "registerStudioChallenge" },
        { path: "/:apiVersion/design/challengetypes", action: "studioTypes" },
        { path: "/:apiVersion/design/challenges/result/:challengeId", action: "getStudioChallengeResults" },
        { path: "/:apiVersion/design/reviewOpportunities/:id", action: "getStudioReviewOpportunity" },
        { path: "/:apiVersion/design/challenges/:contestId", action: "getStudioChallenge" },
        { path: "/:apiVersion/design/challenges", action: "searchStudioChallenges" },
        { path: "/:apiVersion/design/reviewOpportunities", action: "getStudioReviewOpportunities" },

        { path: "/:apiVersion/users/:handle/statistics/develop", action: "getSoftwareStatistics" },
        { path: "/:apiVersion/users/:handle/statistics/design", action: "getStudioStatistics" },
        { path: "/:apiVersion/users/:handle/statistics/data/marathon", action: "getMarathonStatistics" },
        { path: "/:apiVersion/users/:handle/statistics/data/srm", action: "getAlgorithmStatistics" },
        { path: "/:apiVersion/users/:handle", action: "getBasicUserProfile" },

        { path: "/:apiVersion/data/srm/challenges/:id", action: "getSRMChallenge" },
        { path: "/:apiVersion/data/srm/challenges", action: "searchSRMChallenges" },
        { path: "/:apiVersion/data/marathon/challenges/:id", action: "getMarathonChallenge" },
        { path: "/:apiVersion/data/marathon/challenges", action: "searchMarathonChallenges" },
        { path: "/:apiVersion/data/marathon/statistics/tops", action: "getMarathonTops" },
        { path: "/:apiVersion/data/srm/statistics/tops", action: "getSRMTops" },
        { path: "/:apiVersion/data/countries", action: "countries" },

        { path: "/:apiVersion/terms/:challengeId(\\d+)", action: "getChallengeTerms"},
        { path: "/:apiVersion/terms/detail/:termsOfUseId", action: "getTermsOfUse"},

        //example secure route using oauth. for future reference.
        { path: "/:apiVersion/secure/challengetypes", action: "softwareTypesSecured" },

        { path: "/:apiVersion/platform/statistics", action: "tcDirectFacts" },
        { path: "/:apiVersion/platform/activeBillingAccounts", action: "getActiveBillingAccounts" },

        { path: "/:apiVersion/download/document/:docId", action: "downloadDocument" },

        { path: "/:apiVersion/reports/client/costs", action: "getClientChallengeCosts" },
        { path: "/:apiVersion/reports/costs/:startDate/:endDate", action: "getChallengeCosts" },

        { path: "/:apiVersion/bugs/:jiraProjectId/:status", action: "bugs" },
        { path: "/:apiVersion/bugs/:jiraProjectId", action: "bugs" },
        { path: "/:apiVersion/bugs", action: "bugs" },

        //Stubs APIs
        { path: "/:apiVersion/software/reviewOpportunities/:id", action: "getReviewOpportunity" },
        { path: "/:apiVersion/data/reviewOpportunities/:id", action: "getAlgorithmsReviewOpportunity" },
        { path: "/:apiVersion/data/reviewOpportunities", action: "getAlgorithmsReviewOpportunities" },
        { path: "/:apiVersion/software/reviewers/:contestType", action: "getChallengeReviewers" },
        { path: "/:apiVersion/design/statistics/tops/:challengeType", action: "getStudioTops" },
        { path: "/:apiVersion/data/challengetypes", action: "algorithmsChallengeTypes" }
    ].concat(testMethods.get),
    post: [
        { path: "/:apiVersion/users", action: "memberRegister" },
        { path: "/:apiVersion/develop/challenges/:challengeId/submit", action: "submitForDevelopChallenge" },
        { path: "/:apiVersion/auth", action: "generateJwt" }
    ]
};
