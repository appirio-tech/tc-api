var bindings = require("nodejs-db-informix");
var assert = require('assert');

var util    = require('util');
var ErrorToTestCall = function (msg) {
    ErrorToTestCall.super_.apply(this, arguments);
};
util.inherits(ErrorToTestCall, Error);

var settings = {
    "user" : "informix",
    "password" : "1nf0rm1x",
    "database" : "tcs_catalog",
    "hostname" : "informixoltp_tcp"
};

var connection = new bindings.Informix(settings);

describe("Informix Library", function(){
    this.timeout(11000);

    describe("Connected twice", function(){
	it('should still yield the "ready" event and no "error" event', function(done){
	    var readyEmitted = false;
	    connection.connect();
	    connection.connect();
	    connection.on('ready', function(err, sth){
		readyEmitted = true; 
		connection.disconnect();
	    });

	    connection.on('error', function(err, sth){
		connection.disconnect();
		throw err;
	    });

	   
	    setTimeout(function(){
		assert(readyEmitted, "Ready event is not emitted");
		done();
	    }, 10000);

	});
    });
});
