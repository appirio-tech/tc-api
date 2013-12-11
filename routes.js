/*
 * Copyright (C) 2013 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.3
 * @author vangavroche, Sky_, TCSASSEMBLER
 * Changes in 1.1:
 * - add routes for search contests
 * Changes in 1.2:
 * - add route for top
 * Changes in 1.3:
 * - add routes for all stub methods
 * - add routes for cache test
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
        {path: "/test/cache", action: "cacheTest"}
    ]
};



////////////
// ROUTES //
////////////

exports.routes = {
    get: [
        { path: "/:apiVersion/logs", action: "getLogTail" },

        { path: "/:apiVersion/develop/challengetypes", action: "contestTypes" },
        { path: "/:apiVersion/develop/challenges/:contestId", action: "getContest" },
        { path: "/:apiVersion/develop/statistics/tops/:contestType", action: "getTops" },
        { path: "/:apiVersion/develop/challenges", action: "searchSoftwareContests" },
        { path: "/:apiVersion/design/challengetypes", action: "studioTypes" },
        { path: "/:apiVersion/design/challenges", action: "searchStudioContests" },
        
        //example secure route using oauth. for future reference.
        { path: "/:apiVersion/secure/challengetypes", action: "contestTypesSecured" },
        
        { path: "/:apiVersion/platform/statistics", action: "tcDirectFacts" },

        //stubs
        { path: "/:apiVersion/software/reviewOpportunities/:id", action: "getReviewOpportunity" },
        { path: "/:apiVersion/develop/reviewOpportunities", action: "searchReviewOpportunities" },
        { path: "/:apiVersion/design/reviewOpportunities/:id", action: "getStudioReviewOpportunity" },
        { path: "/:apiVersion/design/reviewOpportunities", action: "getStudioReviewOpportunities" },
        { path: "/:apiVersion/data/reviewOpportunities/:id", action: "getAlgorithmsReviewOpportunity" },
        { path: "/:apiVersion/data/reviewOpportunities", action: "getAlgorithmsReviewOpportunities" },

        { path: "/:apiVersion/software/reviewers/:contestType", action: "getContestReviewers" },
        { path: "/:apiVersion/develop/statistics/:handle", action: "getSoftwareStatistics" },
        { path: "/:apiVersion/design/statistics/tops/:challengeType", action: "getStudioTops" },
        { path: "/:apiVersion/design/statistics/:handle", action: "getStudioStatistics" },
        { path: "/:apiVersion/design/challenges/:contestId", action: "getStudioContest" },
        { path: "/:apiVersion/design/challengetypes", action: "studioContestTypes" },
        { path: "/:apiVersion/data/challengetypes", action: "algorithmsContestTypes" },
        { path: "/:apiVersion/data/srm/challenges/:id", action: "getSRMChallenge" },
        { path: "/:apiVersion/data/srm/challenges", action: "searchSRMChallenges" },
        { path: "/:apiVersion/data/marathon/challenges/:id", action: "getMarathonChallenge" },
        { path: "/:apiVersion/data/marathon/challenges", action: "searchMarathonChallenges" },
        { path: "/:apiVersion/data/marathon/statistics/tops", action: "getMarathonTops" },
        { path: "/:apiVersion/data/marathon/statistics/:handle", action: "getMarathonStatistics" },
        { path: "/:apiVersion/data/srm/statistics/tops", action: "getSRMTops" },
        { path: "/:apiVersion/data/srm/statistics/:handle", action: "getAlgorithmStatistics" }
    ].concat(testMethods.get),
    post: [
        { path: "/:apiVersion/develop/users", action: "memberRegister" },
    ]
};
