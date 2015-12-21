chat-app
======================

A NW(Node-Webkit) chat application.
 - Will run on web host or as nw.js application.

Backend [node.js] (https://nodejs.org/), [socket.io] (http://socket.io/), express
Frontend [HTML5] (http://www.w3.org/TR/html5/), [jQuery] (https://jquery.com/)

### Install client side app (optional)
 - Install nw.js from (http://nwjs.io/)
 - Copy all files here to it's root.
 - Start nw.exe

### Run node chat server
 - Open console and cd to your work dir
 - Install socket.io node module by typing: [npm install socket.io] (http://socket.io/)
 - Install express node module by typing: npm install express
 - Edit socket address and port from client side [index.html] (https://github.com/Sehrentos/Node-Chat/blob/master/data/public/index.html) or [/data/public/js/main.js] (https://github.com/Sehrentos/Node-Chat/blob/master/data/public/js/main.js)
 - Edit socket address and port from server side [server.js] (https://github.com/Sehrentos/Node-Chat/blob/master/data/server.js)
 - Start chat server by typing: node data/server.js or use server-start.bat in windows.

### Make package (NW.JS)
 - Zip your data directory with package.json file so that package.json is it's root.
 - Rename your .zip to package.nw

### Make executable (NW.JS)
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