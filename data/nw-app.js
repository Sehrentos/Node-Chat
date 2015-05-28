/*
* Script.js - node app
*
* Export functions you can use on index.html
* @global - all stuff
* @process.mainModule.exports.myFunctionName()
*/
(function(){

	// Count page loadtimes
	exports.pageloads = 0;
	exports.pageload = function () {
		exports.pageloads = exports.pageloads + 1;
		console.log(exports.pageloads + ": pageloads.");
		//window.location - this would return current filename and line
	};

	// Start listen keypush events
	exports.onKeyPush = function(callback) {
		window.addEventListener('keydown', function(e) {
			if (callback && typeof(callback) === "function") {
				return callback(e);
			}
		});
	};

    // Start your own http server and send express.html as it's front page
    // @localhost:3000
    exports.server_online = false;

    exports.server_start = function(callback) {

        exports.server_online = true; //exports.server
        // Setup http server
        //var gui = require('nw.gui') || global.window.nwDispatcher.requireNwGui();
        var app = require('express')();
        var http = require('http').Server(app);
        var io = require('socket.io')(http);

        // Send html file
        app.get('/', function(req, res) {
            res.sendFile(__dirname + '/express.html');
            //res.send('<h1>Hello world</h1>');
        });

        // socket listen events
        io.on('connection', function(socket) {
            console.log('a user connected');
        });

        http.listen(3000, function() {
            console.log('listening on *:3000');
        });

        console.log('Server is now online');

        // callback function
        if (callback && typeof(callback) === "function") {
            return callback();
        }

    };

})();
// Self-called functions: Will be executed on start
/*
(function(){
    return exports.pageload();
})(0);
*/