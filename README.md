chat-app
======================

A NW(Node-Webkit) chat application.

Backend [node.js] (https://nodejs.org/), [socket.io] (http://socket.io/)
Frontend [HTML5] (http://www.w3.org/TR/html5/), [jQuery] (https://jquery.com/)

### Install client side app
 - Install nw.js from (http://nwjs.io/)
 - Copy all files here to it's root.
 - Start nw.exe

### Run node chat server
 - Open console and cd to your work dir
 - Install socket.io node module by typing: [npm install socket.io] (http://socket.io/)
 - Edit socket address and port from client side (https://github.com/Sehrentos/NodeJS-SocketIO-Chat/blob/master/data/index.html) or [/data/js/scripts.js] (https://github.com/Sehrentos/NodeJS-SocketIO-Chat/blob/master/data/js/scripts.js)
 - Edit socket address and port from server side [server.js] (https://github.com/Sehrentos/NodeJS-SocketIO-Chat/blob/master/server.js)
 - Start chat server by typing: node server.js

### Make package
 - Zip your data directory with package.json file so that package.json is it's root.
 - Rename your .zip to package.nw

### Make executable
 - Use package-make-exe.bat - this will create app.exe for you (windows).
 - Or use command line:
 (win) copy /b nw.exe+package.nw app.exe
 (win) copy /b nw.exe+package.nw > app.exe
 (mac) cp package.nw nw/Contents/Resources/
 (linux) cat nw package.nw > app

### Help
 - [How to package and distribute your apps] (https://github.com/nwjs/nw.js/wiki/How-to-package-and-distribute-your-apps)

### Sources
 - (https://github.com/nwjs/nw.js)
 - (http://oldgeeksguide.github.io/presentations/html5devconf2013/wtod.html#/)

Happy editing.