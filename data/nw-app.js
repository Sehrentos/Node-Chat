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

    // Start your own chat server @ localhost:9000
    exports.server = {};
    exports.server.online = false;
    exports.server.start = function(callback) {
        //var gui = require('nw.gui') || global.window.nwDispatcher.requireNwGui();
        require('./server.js');

        console.log('Server started.');
		exports.server.online = true;

        // callback function
        if (callback && typeof(callback) === "function") {
            callback();
        }

        return this;
    };

    // File system: read
    // Example: exports.file.read('package.json',function(e){console.log(e);});
    exports.readFile = function(fileName, callback) {
        fs = require('fs');
        fileText = fs.readFileSync(fileName).toString(); // 'foo.txt'

        // callback function
        if (callback && typeof(callback) === "function") {
            callback(fileText);
        }

        return fileText;
    };

    // read dir: fs.readdirSync('.')

    // File system: write
    exports.writeFile = function(fileName, fileText, callback) {
        fs = require('fs');
        fs.writeFileSync(fileName, fileText); // 'bar.txt'

        // callback function
        if (callback && typeof(callback) === "function") {
            callback();
        }

        return this;
    };

})();

// Self-called functions: Will be executed on start
/*
(function(){
    // Menu
    var gui = require('nw.gui');
    var win = gui.Window.get();

    var rootMenu = new gui.Menu({
        type: 'menubar'});
    var myMenu = new gui.Menu();

    myMenu.append(new gui.MenuItem({
        type: 'normal',
        label: 'Debug',
        click: function (){
            win.showDevTools();
        } }));

    rootMenu.append(new gui.MenuItem({
        label: 'NW-Reveal',
        submenu: myMenu
    }));

    rootMenu.append(new gui.MenuItem({
        label: 'NW-Reveal',
        submenu: myMenu
    }));

    // Tray icon
    var tray = new gui.Tray({
        icon: 'icon.png'
      });
    var menu = new gui.Menu();
    menu.append(new gui.MenuItem({
        type: 'checkbox',
        label: 'Always-on-top',
        click: function () {...}
      }));
    tray.menu = menu;

    // Page load times
    exports.pageload();

    // Other options
    var gui = require('nw.gui');
    var win = gui.Window.get();

    win.hide();
    win.show();
    win.maximize();
    win.minimize();

    window.open();
    window.moveBy(10,30);
    window.resizeTo(800,600);

})(0);
*/