var async = require("async");
var bindings = require("nodejs-db-informix");
var assert = require("assert");

var log = function(msg){
    console.log(new Date() + " " + msg);
};


function executeQuery(server, db, sql, done){

    var settings = {
	"user" : "informix",
	"password" : "1nf0rm1x",
	"database" : db,
	"hostname" : server
    };
    

    log('Query about to initiate');
    var connection = new bindings.Informix(settings);
    
    connection.on('error', function (err) {
	this.disconnect();
	console.log(err);
	//
    }).connect(function (err) {
	log('Connected');
	if (err) {
	    this.disconnect();
	    done(err);
	} else {
            // Run the query
	    var count = 1;
	    var execute = function(next){
		var done = function(err, result, meta){
		    assert.equal(null, err, "There shouldn't be err");
		    assert.ok(result.length > 1, "There should be some value selected");
		    assert.ok(meta.length > 1, "The column meta should be in the result");
		    next(err, result);
		};

		connection.query('', [], done, {
		    start : function (q) {
			log('Start to execute ' + q, 'debug');
		    },
		    finish : function (f) {
		    },
		    async : true,
		    cast : true
		}).select(sql).execute();
		log('Query initiated ' + count++);		
	    };
	    
	    async.parallel([
		execute, execute, execute
	    ], function(err, result){
		connection.disconnect();
		done(err, result);
	    });
	    


	}
	//this.disconnect();
    });
    log('Connection Attempted to make');
}


describe("Informix Library", function(){
    this.timeout(0);  // No timeout restriction
    describe("Multiple Async Queries", function(){
	it("should return proper result regardless of the order", function(done){
	    async.parallel([
		function(callback) {
		    executeQuery('informixoltp_tcp', 'corporate_oltp', '* from command_group_lu', function(err, result){
			callback(err, result);
		    });
		},
		function(callback) {
		    executeQuery('informixoltp_tcp', 'common_oltp', '* from address_type_lu', function(err, result){
			callback(err, result);
		    });
		}
	    ], function(err, results){
		// The err should be null or undefined.
		assert.ok(err === null || err === undefined, "There should be no ERROR.");
		done();
	    });
	});
    });
});



