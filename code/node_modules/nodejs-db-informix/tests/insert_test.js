/* tests */

/*
 * Connection configurations
 */
var settings = JSON.parse(require('fs').readFileSync('./tests/db_conf_test.json','utf8'));

/*
 * Create an Informix database nodejs object
 */
var bindings = require("../nodejs-db-informix");

/*
 * Create a new Informix database bindings. Setup event callbacks. Connect to
 * the database.
 * c - connection
 */
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

    // create table
    rs = this
        .query(
              "create table baz(a integer, b varchar(255))"
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
        .execute();

    // insert some rows
    rs = this.query(
            'insert into baz values(1, "one");'
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
        .insert('baz', ['a','b'],[3, 'three'], false)
        .execute();


    // query the rows back
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
        .select("a,b")
        .from("baz", false)
        .orderby("a")
        .execute();

    // insert some more rows
    for (var i = 0; i < 10; ++i) {
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
            .insert('baz', ['a','b'],[i, Math.random().toString()], false)
            .execute();
    }

    // query the rows back
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
        .select("a,b")
        .from("baz", false)
        .orderby("a")
        .execute();

    // update some rows
    rs = this
        .query(
              "update baz set b='blah' where a = 1"
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
        .update('baz', false)
        .set({"b":"blah blah A"}, false)
        .where("a=2")
        .execute();

    // query the rows back
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
        .select("a,b")
        .from("baz", false)
        .orderby("a")
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
        .select(["a", "b"])
        .skip(1)
        .limit(1,1)
        .first(2)
        .from("baz", false)
        .where("a=1")
        .orderby("a")
        .execute();

    /*
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
    */

    rs = this
        .query(
              "drop table baz;"
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
        .execute();

});


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

