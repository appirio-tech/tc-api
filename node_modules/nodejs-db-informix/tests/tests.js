/* tests 
 * 
 * This must be run using nodeunit
 * $ nodeunit /path/to/this/file.js
 */

/*
 * Connection configurations
 */
var settings = JSON.parse(require('fs').readFileSync('./tests/db_conf.json','utf8'));

/*
 * Create an Informix database nodejs object
 */
var bindings = require("../nodejs-db-informix");

/*
 * Create a new Informix database bindings. Setup event callbacks. Connect to
 * the database.
 * c - connection
 */
/*
var c = new bindings.Informix(settings);
c.on('error', function(error) {
    console.log("Error: ");
    console.log(error);
}).on('ready', function(server) {
    console.log("Connection ready to ");
    console.log(server);
}).connect(function(err) {
    if (err) {
        throw new Error('Could not connect to DB');
    }
    console.log('Connected to db with ');
    console.log(settings);
    console.log("isConnected() == " + c.isConnected());

    var rs;

    rs = this
        .query(
              ""
            , []
            , function () {
                console.log('CALLBACK:');
                console.log(arguments);
            }
            , {
                start: function(q) {
                    console.log('START:');
                    console.log(q);
                }
                , finish: function(f) {
                    console.log('Finish:');
                    console.log(f);
                }
                , async: false
                , cast: true
            }
        )
        .select("name,partnum,owner,created")
        .from("sysdatabases", false)
        .orderby("name")
        .execute();

    rs = this
        .query(
              ""
            , []
            , function () {
                console.log('CALLBACK:');
                console.log(arguments);
            }
            , {
                start: function(q) {
                    console.log('START:');
                    console.log(q);
                }
                , finish: function(f) {
                    console.log('Finish:');
                    console.log(f);
                }
                , async: false
                , cast: true
            }
        )
        .select(["procid", "procname", "owner", "mode", "retsize", "symsize", "datasize", "codesize", "numargs", "isproc"])
        .skip(15)
        .limit(15,10)
        .first(3)
        .from("sysprocedures", false)
        .where("owner='informix'")
        .orderby("procname")
        .execute();

	rs = this
		.query(
			"execute procedure pTestNodeJs(?, ?, ?, ?)"
            , ['2013-01-08 13:30:00', '2013-01-08 23:30:00', 'Y', 'Y']
            , function () {
                console.log('CALLBACK:');
                console.log(arguments);
            }
            , {
                start: function(q) {
                    console.log('START:');
                    console.log(q);
                }
                , finish: function(f) {
                    console.log('Finish:');
                    console.log(f);
                }
                , async: false
                , cast: true
            }
        )
		.execute();

});

*/


var tests = require("./tests_base.js").get(function(callback) {
    var c = new bindings.Informix(settings);
    c.on('error', function(error) {
        console.log("Error: ");
        console.log(error);
    }).on('ready', function(server) {
        console.log("Connection ready to ");
        console.log(server);
    }).connect(function(err) {
        if (err) {
            throw new Error('Could not connect to DB');
        }

        console.log('Connected to db with ');
        console.log(settings);
        console.log("isConnected() == " + c.isConnected());

        callback(this);
    });
});

// console.log (tests);

for(var test in tests) {
    console.log(test);
    exports[test] = tests[test];
}

