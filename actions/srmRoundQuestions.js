/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 */
 /** 
 * - Implement the srm round questions / answers / survey api.
 * Changes in version 1.1 (Module Assembly - Web Arena - Match Configurations):
 * - Updated getRoundQuestions to send roundId with response
 *
 * @version 1.1
 * @author TCSASSEMBLER
 */

/*jslint node: true, nomen: true, plusplus: true, stupid: true, unparam: true */
"use strict";
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var IllegalArgumentError = require('../errors/IllegalArgumentError');

var DATE_FORMAT = "YYYY-MM-DD HH:mm";


/**
 * Get Round Question Answers.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var getRoundQuestionAnswers = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        result = [],
        questionId = Number(connection.params.questionId);

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            cb(helper.checkIdParameter(questionId, "questionId"));
        }, function (cb) {
            api.dataAccess.executeQuery("get_round_question_answers", {questionId: questionId}, dbConnectionMap, cb);
        }, function (results, cb) {
            _.each(results, function (item) {
                var answer = {id: item.answer_id, text: item.answer_text, sortOrder: item.sort_order,
                    correct: (item.correct === 1) };

                result.push(answer);
            });

            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {answers: result};
        }
        next(connection, true);
    });
};

/**
 * Get Round Questions.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var getRoundQuestions = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        result = [],
        roundId = Number(connection.params.roundId);

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            cb(helper.checkIdParameter(roundId, "roundId"));
        }, function (cb) {
            api.dataAccess.executeQuery("get_round_questions", {roundId: roundId}, dbConnectionMap, cb);
        }, function (results, cb) {
            _.each(results, function (item) {
                var questionType = {id: item.question_type_id, description: item.question_type_desc},
                    questionStyle = {id: item.question_style_id, description: item.question_style_desc},
                    surveyStatus = {id: item.status_id, description: item.status_desc},
                    questionData = {id: item.question_id, keyword: item.keyword, status: surveyStatus,
                        style: questionStyle, text: item.question_text, type: questionType, isRequired: true};

                result.push(questionData);
            });

            cb();
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {questions: result, roundId: roundId};
        }
        next(connection, true);
    });
};

/**
 * Check the survey values.
 *
 * @param api the api instance.
 * @param dbConnectionMap the database connection map
 * @param name - the name parameter
 * @param statusId - the statusId parameter
 * @param surveyText - the surveyText parameter
 * @param startDate - the startDate parameter
 * @param length - the length parameter
 * @param callback the callback method
 */
function checkSurveyValues(api, dbConnectionMap, name, statusId, surveyText, startDate, length, callback) {
    var helper = api.helper, error = null;

    async.waterfall([
        function (cb) {
            error = helper.checkStringParameter(name, "name", 50);

            if (!error && _.isDefined(surveyText)) {
                error = helper.checkStringParameter(surveyText, "surveyText", 2048);
            }

            if (!error) {
                error = helper.validateDate(startDate, "startDate", DATE_FORMAT);
            }

            if (!error) {
                error = helper.checkInteger(length, "length") || helper.checkNonNegativeNumber(length, "length");
            }

            if (!error) {
                error = helper.checkInteger(statusId, "statusId") || helper.checkNonNegativeNumber(statusId, "statusId");
            }
            cb();
        }, function (cb) {
            if (!error) {
                api.dataAccess.executeQuery("get_status_id", {statusId: statusId}, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (!error) {
                if (results.length === 0) {
                    error = new IllegalArgumentError("The statusId does not exist in database.");
                }
            }
            cb(error);
        }
    ], function (err) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, error);
    });
}

/**
 * Check round id.
 *
 * @param api the api instance.
 * @param dbConnectionMap the database connection map
 * @param roundId - the roundId parameter
 * @param callback the callback method
 */
function checkRoundId(api, dbConnectionMap, roundId, callback) {
    var helper = api.helper, error = helper.checkIdParameter(roundId, "roundId");

    async.waterfall([
        function (cb) {
            if (!error) {
                api.dataAccess.executeQuery("get_round_id", {roundId: roundId}, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (!error) {
                if (results.length === 0) {
                    error = new IllegalArgumentError("The roundId does not exist in database.");
                }
            }
            cb(error);
        }
    ], function (err) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, error);
    });
}

/**
 * Create survey if it's not exist.
 *
 * @param api the api instance.
 * @param dbConnectionMap the database connection map
 * @param roundId - the roundId parameter
 * @param callback the callback method
 */
function createSurveyIfNotExists(api, dbConnectionMap, roundId, callback) {
    async.waterfall([
        function (cb) {
            api.dataAccess.executeQuery("get_survey_count", {roundId: roundId}, dbConnectionMap, cb);
        }, function (results, cb) {
            if (results.length === 0 || results[0].num === 0) {
                // insert one
                api.dataAccess.executeQuery("insert_survey", {roundId: roundId}, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }
    ], function (err) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, null);
    });
}

/**
 * Set Round Survey.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var setRoundSurvey = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        roundId = Number(connection.params.roundId),
        name = connection.params.name,
        statusId = Number(connection.params.statusId),
        surveyText = connection.params.surveyText,
        startDate = connection.params.startDate,
        length = connection.params.length;

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            checkRoundId(api, dbConnectionMap, roundId, cb);
        }, function (error, cb) {
            checkSurveyValues(api, dbConnectionMap, name, statusId, surveyText, startDate, length, cb);
        }, function (error, cb) {
            createSurveyIfNotExists(api, dbConnectionMap, roundId, cb);
        }, function (results, cb) {
            sqlParams.name = name;
            sqlParams.statusId = statusId;
            sqlParams.surveyText = _.isDefined(surveyText) ? surveyText : "";
            sqlParams.startDate = helper.formatDate(startDate, DATE_FORMAT) + ":00";
            sqlParams.endDate = helper.formatDate(moment(moment(startDate, DATE_FORMAT).valueOf() + length * 60000), DATE_FORMAT) + ":00";
            sqlParams.roundId = roundId;
            api.dataAccess.executeQuery("update_survey", sqlParams, dbConnectionMap, cb);
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {"success": true};
        }
        next(connection, true);
    });
};

/**
 * Check question id.
 *
 * @param api the api instance.
 * @param dbConnectionMap the database connection map
 * @param questionId - the questionId parameter
 * @param callback the callback method
 */
function checkQuestionId(api, dbConnectionMap, questionId, callback) {
    var helper = api.helper, error = helper.checkIdParameter(questionId, "questionId");

    async.waterfall([
        function (cb) {
            if (!error) {
                api.dataAccess.executeQuery("get_question_id", {questionId: questionId}, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (!error) {
                if (results.length === 0) {
                    error = new IllegalArgumentError("The questionId does not exist in database.");
                }
            }
            cb(error);
        }
    ], function (err) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, error);
    });
}

/**
 * Check answer parameters.
 *
 * @param api the api instance.
 * @param text - the text parameter
 * @param sortOrder - the sortOrder parameter
 * @param correct - the correct parameter
 * @param callback the callback method
 */
function checkAnswerValues(api, text, sortOrder, correct, callback) {
    var helper = api.helper, error = null;

    async.waterfall([
        function (cb) {
            error = helper.checkStringParameter(text, "text", 250);

            if (!error && _.isDefined(sortOrder)) {
                error = helper.checkPositiveInteger(sortOrder, "sortOrder");
            }

            if (!error && _.isDefined(correct)) {
                if (correct !== true && correct !== false && correct.toLowerCase() !== "true" && correct.toLowerCase() !== "false") {
                    error = new IllegalArgumentError("The correct should be boolean type.");
                }
            }

            cb(error);
        }
    ], function (err) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, error);
    });
}

/**
 * Add Round Question Answer.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var addRoundQuestionAnswer = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        questionId = Number(connection.params.questionId),
        text = connection.params.text,
        sortOrder = connection.params.sortOrder,
        correct = connection.params.correct;

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            checkQuestionId(api, dbConnectionMap, questionId, cb);
        }, function (error, cb) {
            checkAnswerValues(api, text, sortOrder, correct, cb);
        }, function (error, cb) {
            api.idGenerator.getNextIDFromDb("SURVEY_SEQ", "informixoltp", dbConnectionMap, function (err, answerId) {
                cb(err, answerId);
            });
        }, function (answerId, cb) {
            sqlParams.answerId = answerId;
            sqlParams.questionId = questionId;
            sqlParams.answerText = text;
            sqlParams.sortOrder = _.isDefined(sortOrder) ? sortOrder : null;
            var tmp = null;
            if (_.isDefined(correct)) {
                tmp = (correct === true || correct.toLowerCase() === "true") ? 1 : 0;
            }
            sqlParams.correct = tmp;
            api.dataAccess.executeQuery("insert_answer", sqlParams, dbConnectionMap, cb);
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {"success": true};
        }
        next(connection, true);
    });
};

/**
 * Check question parameters.
 *
 * @param api the api instance.
 * @param dbConnectionMap the database connection map
 * @param keyword - the keyword parameter
 * @param text - the text parameter
 * @param isRequired - the isRequired parameter
 * @param styleId - the styleId parameter
 * @param typeId - the typeId parameter
 * @param statusId - the statusId parameter
 * @param callback the callback method
 */
function checkQuestionValues(api, dbConnectionMap, keyword, text, isRequired, styleId, typeId, statusId, callback) {
    var helper = api.helper, error = null;

    async.waterfall([
        function (cb) {
            if (_.isDefined(keyword)) {
                error = helper.checkStringParameter(keyword, "keyword", 64);
            }

            if (!error) {
                error = helper.checkStringParameter(text, "text", 2048);
            }
            if (!error && _.isDefined(isRequired)) {
                if (isRequired !== true && isRequired !== false && isRequired.toLowerCase() !== "true" && isRequired.toLowerCase() !== "false") {
                    error = new IllegalArgumentError("The isRequired should be boolean type.");
                }
            }
            if (!error) {
                error = helper.checkInteger(styleId, "styleId")
                    || helper.checkNonNegativeNumber(styleId, "styleId");
            }
            if (!error) {
                error = helper.checkInteger(typeId, "typeId")
                    || helper.checkNonNegativeNumber(typeId, "typeId");
            }
            if (!error) {
                error = helper.checkInteger(statusId, "statusId")
                    || helper.checkNonNegativeNumber(statusId, "statusId");
            }
            cb();
        }, function (cb) {
            if (!error) {
                api.dataAccess.executeQuery("get_status_id", {statusId: statusId}, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (!error) {
                if (results.length === 0) {
                    error = new IllegalArgumentError("The statusId does not exist in database.");
                }
            }

            if (!error) {
                api.dataAccess.executeQuery("get_question_type_id", {typeId: typeId}, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (!error) {
                if (results.length === 0) {
                    error = new IllegalArgumentError("The typeId does not exist in database.");
                }
            }

            if (!error) {
                api.dataAccess.executeQuery("get_question_style_id", {styleId: styleId}, dbConnectionMap, cb);
            } else {
                cb(null, null);
            }
        }, function (results, cb) {
            if (!error) {
                if (results.length === 0) {
                    error = new IllegalArgumentError("The styleId does not exist in database.");
                }
            }

            cb(error);
        }
    ], function (err) {
        if (err) {
            callback(err);
            return;
        }

        callback(null, error);
    });
}

/**
 * Add Round Question.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var addRoundQuestion = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        roundId = Number(connection.params.roundId),
        keyword = connection.params.keyword,
        text = connection.params.text,
        isRequired = connection.params.isRequired,
        styleId = connection.params.styleId,
        typeId = connection.params.typeId,
        statusId = connection.params.statusId,
        questionId;

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            checkRoundId(api, dbConnectionMap, roundId, cb);
        }, function (error, cb) {
            checkQuestionValues(api, dbConnectionMap, keyword, text, isRequired, styleId, typeId, statusId, cb);
        }, function (error, cb) {
            createSurveyIfNotExists(api, dbConnectionMap, roundId, cb);
        }, function (results, cb) {
            api.idGenerator.getNextIDFromDb("SURVEY_SEQ", "informixoltp", dbConnectionMap, function (err, id) {
                cb(err, id);
            });
        }, function (id, cb) {
            questionId = id;
            sqlParams.questionId = questionId;
            sqlParams.text = text;
            sqlParams.keyword = _.isDefined(keyword) ? keyword : "";
            sqlParams.typeId = typeId;
            sqlParams.styleId = styleId;
            sqlParams.statusId = statusId;

            var tmp = null;
            if (_.isDefined(isRequired)) {
                tmp = (isRequired === true || isRequired.toLowerCase() === "true") ? 1 : 0;
            }

            sqlParams.isRequired = tmp;
            api.dataAccess.executeQuery("insert_question_query", sqlParams, dbConnectionMap, cb);
        }, function (results, cb) {
            sqlParams.roundId = roundId;
            sqlParams.questionId = questionId;
            api.dataAccess.executeQuery("insert_round_question", sqlParams, dbConnectionMap, cb);
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {"success": true, questionId: questionId};
        }
        next(connection, true);
    });
};


/**
 * Modify Round Question.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var modifyRoundQuestion = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
        sqlParams = {},
        questionId = Number(connection.params.questionId),
        keyword = connection.params.keyword,
        text = connection.params.text,
        styleId = connection.params.styleId,
        typeId = connection.params.typeId,
        isRequired = connection.params.isRequired,
        statusId = connection.params.statusId;

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            checkQuestionId(api, dbConnectionMap, questionId, cb);
        }, function (error, cb) {
            checkQuestionValues(api, dbConnectionMap, keyword, text, isRequired, styleId, typeId, statusId, cb);
        }, function (error, cb) {
            sqlParams.questionId = questionId;
            sqlParams.text = text;
            sqlParams.keyword = (_.isDefined(keyword) ? keyword : "");
            sqlParams.typeId = typeId;
            sqlParams.styleId = styleId;
            sqlParams.statusId = statusId;
            api.dataAccess.executeQuery("update_question_query", sqlParams, dbConnectionMap, cb);
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {"success": true};
        }
        next(connection, true);
    });
};

/**
 * Delete Round Question.
 *
 * @param api the api instance.
 * @param connection the connection instance
 * @param dbConnectionMap the database connection map
 * @param next the callback method
 */
var deleteRoundQuestion = function (api, connection, dbConnectionMap, next) {
    var helper = api.helper,
      sqlParams = {},
      questionId = Number(connection.params.questionId);

    async.waterfall([
        function (cb) {
            cb(helper.checkAdmin(connection, 'Authorized information needed.', 'Admin access only.'));
        }, function (cb) {
            checkQuestionId(api, dbConnectionMap, questionId, cb);
        }, function (error, cb) {
            sqlParams.question_id = questionId;
            api.dataAccess.executeQuery("delete_round_question", sqlParams, dbConnectionMap, cb);
        }
    ], function (err) {
        if (err) {
            helper.handleError(api, connection, err);
        } else {
            connection.response = {"success": true};
        }
        next(connection, true);
    });
};

/**
 * The API for get Round Questions API.
 */
exports.getRoundQuestions = {
    name: "getRoundQuestions",
    description: "Get Round Questions",
    inputs: {
        required: ['roundId'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getRoundQuestions#run", 'debug');
            getRoundQuestions(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for get Round Question Answers API.
 */
exports.getRoundQuestionAnswers = {
    name: "getRoundQuestionAnswers",
    description: "Get Round Question Answers",
    inputs: {
        required: ['questionId'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'read', // this action is read-only
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute getRoundQuestionAnswers#run", 'debug');
            getRoundQuestionAnswers(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for set Round Survey API.
 */
exports.setRoundSurvey = {
    name: "setRoundSurvey",
    description: "Set Round Survey",
    inputs: {
        required: ['roundId', 'name', 'statusId', 'startDate', 'length'],
        optional: ['surveyText']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute setRoundSurvey#run", 'debug');
            setRoundSurvey(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for add Round Question Answer API.
 */
exports.addRoundQuestionAnswer = {
    name: "addRoundQuestionAnswer",
    description: "Add Round Question Answer",
    inputs: {
        required: ['questionId', 'text'],
        optional: ['sortOrder', 'correct']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute addRoundQuestionAnswer#run", 'debug');
            addRoundQuestionAnswer(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for add Round Question API.
 */
exports.addRoundQuestion = {
    name: "addRoundQuestion",
    description: "Add Round Question",
    inputs: {
        required: ['roundId', 'text', 'styleId', 'typeId', 'statusId'],
        optional: ['keyword', 'isRequired']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute addRoundQuestion#run", 'debug');
            addRoundQuestion(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

/**
 * The API for Modify Round Question API.
 */
exports.modifyRoundQuestion = {
    name: "modifyRoundQuestion",
    description: "Modify Round Question",
    inputs: {
        required: ['questionId', 'text', 'styleId', 'typeId', 'statusId'],
        optional: ['keyword']
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute modifyRoundQuestion#run", 'debug');
            modifyRoundQuestion(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};

exports.deleteRoundQuestion = {
    name: "deleteRoundQuestion",
    description: "Delete Round Question",
    inputs: {
        required: ['questionId'],
        optional: []
    },
    blockedConnectionTypes: [],
    outputExample: {},
    version: 'v2',
    transaction: 'write',
    databases: ["informixoltp"],
    run: function (api, connection, next) {
        if (connection.dbConnectionMap) {
            api.log("Execute deleteRoundQuestion#run", 'debug');
            deleteRoundQuestion(api, connection, connection.dbConnectionMap, next);
        } else {
            api.helper.handleNoConnection(api, connection, next);
        }
    }
};
