var newrelic = false;

var fixTransactionName = function(connection, actionTemplate, next) {
  if(newrelic && connection.type === 'web'){
    newrelic.setControllerName(actionTemplate.name);
  }
  next(connection, true);
};

var reportException = function(type, err, extraMessages, severity){
  if(newrelic) newrelic.noticeError(err);
};

exports.nrmid = function(api, next){
  try {
    newrelic = require('newrelic');
  } catch (error) { 
    api.log('Newrelic could not be initialized: ' + error, 'warning');
    newrelic = false;
  }

  if(newrelic) {
    api.actions.preProcessors.push(fixTransactionName);
    api.exceptionHandlers.reporters.push(reportException);
  }
  next();
};