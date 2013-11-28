var express = require("express");
var app = express();
app.use(express.logger());
var number = 1;
        var bindings = require("nodejs-db-informix");
app.get('/test', function(request, response) {
    var sql = request.query.sql;
    var nr = number++;
    if (!sql)
        response.send('Use parameter `sql` to test!');
    else {
    	/**
		 * Initialize the database settings for the Contest API
		 */
		var settings = {
				"user" : process.env.TC_DB_USER,
				"host" : process.env.TC_DB_HOST,
				"port" : parseInt(process.env.TC_DB_PORT, 10),
				"password" : process.env.TC_DB_PASSWORD,
            	"database": "common_dw"
			};

        var c = new bindings.Informix(settings);

        c.connect({async:true}, function(err) {
            if (err) {
            	c.disconnect();
                throw new Error('Could not connect to DB:' + err);
            }
            //console.log('Connected to db with ');
            //console.log("isConnected() == " + c.isConnected());

            var rs;

            rs = this
                .query(
                    sql
                    , []
                    , function () {
                        console.log('CALLBACK ' + nr + ':');
						console.log(arguments);
                        response.send('' + nr);
                    }
                    , {
                        start: function(q) {
                            console.log('START ' + nr + ':');
                            //console.log(q);
                        }
                        , finish: function(f) {
                            console.log('Finish ' + nr + ':');
                            //console.log(f);
                            c.disconnect();
                        }
                        , async: true
                        , cast: true
                    }
                )
                .execute();
        });
    }
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
    console.log("Listening on " + port);
});
