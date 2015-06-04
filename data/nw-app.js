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

	// Start listen keypush events?
	exports.onKeyPush = function(callback) {
		window.addEventListener('keydown', function(e) {
			if (callback && typeof(callback) === "function") {
				return callback(e);
			}
		});
	};

    // Start your own chat server
    // @localhost:9000
    exports.server_online = false;
    exports.server_start = function(callback) {
        //var gui = require('nw.gui') || global.window.nwDispatcher.requireNwGui();
        require('../server.js');

        console.log('Server started.');
		exports.server_online = true;

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