var newrelic = require("newrelic");

var fixTransactionName = function(connection, actionTemplate, next) {
  if(connection.type === 'web'){
    newrelic.setControllerName(actionTemplate.name);
  }
  next(connection, true);
}

var reportException = function(type, err, extraMessages, severity){
  newrelic.noticeError(err);
}

exports.nrmid = function(api, next){
  api.actions.preProcessors.push(fixTransactionName);
  api.exceptionHandlers.reporters.push(reportException);
  next();
};