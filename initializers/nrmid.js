try {
    var newrelic = require("newrelic");
} catch (ignore) { }

var fixTransactionName = function(connection, actionTemplate, next) {
  if(newrelic && connection.type === 'web'){
    newrelic.setControllerName(actionTemplate.name);
  }
  next(connection, true);
}

var reportException = function(type, err, extraMessages, severity){
  if(newrelic) newrelic.noticeError(err);
}

exports.nrmid = function(api, next){
  if(newrelic) {
    api.actions.preProcessors.push(fixTransactionName);
    api.exceptionHandlers.reporters.push(reportException);
  }
  next();
};