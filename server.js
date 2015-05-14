/*
* NodeJS - chat
* @source: http://stackoverflow.com/questions/18990494/how-to-install-node-js-npm-socket-io-and-use-them
* @source: http://krasimirtsonev.com/blog/article/Real-time-chat-with-NodeJS-Socketio-and-ExpressJS
* @http://socket.io/docs/server-api/
*
* Install socket.io module: 
* cd <my_directory>
* npm install socket.io
*/
// Create http server
/*
var app = require('http').createServer(handler),
    io = require('socket.io').listen(app), //socket.io
    fs = require('fs'); //FileSystem
app.listen(9000);
function handler (req, res) {
	fs.readFile(__dirname + '/index.html',
	function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		res.writeHead(200);
		res.end(data);
	});
}
*/
// socket.io standalone
var io = require('socket.io')();
io.listen(9000);

var users = [];

var addUser = function() {
	var time = new Date().getTime();
    var user = {
        name: "Anon"+ time //name: "Anon". users.length
    }
    users.push(user);
    updateUsers();
    return user;
}

var removeUser = function(user) {
    for(var i=0; i<users.length; i++) {
        if(user.name === users[i].name) {
            users.splice(i, 1);
            updateUsers();
            return user;
        }
    }
}

var editUserName = function(socket, user, data) {
	var exist = false;
	for(var i=0; i<users.length; i++) {
		if(data.name === users[i].name) {
			exist = true;
			socket.emit('notice', { message: 'This name already exists! <strong>'+ user.name +'</strong>' });
		}
	}
	for(var i=0; i<users.length; i++) {
		if(exist === false && user.name === users[i].name) {
			user.name = data.name;
			users[i].name = data.name;
			socket.emit('notice', { message: 'Your name is now <strong>'+ user.name +'</strong>' });
		}
	}
	if(user.name === data.name) {
		updateUsers();
	}
};

var updateUsers = function() {
    //io.sockets.emit("users", { users: str });
	io.sockets.emit("users", users);
}

// String encode function: myVariable.encodeHTML()
if (!String.prototype.encodeHTML) {
	String.prototype.encodeHTML = function () {
		return this.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	};
}

var debug = function(str) {
	console.log(str);
	return this;
};

// Socket open
io.sockets.on('connection', function (socket) {
	debug(socket.id+' connect');

	// Set user name
	var user = addUser(), timestamp = (new Date().getTime());

	// Welcome new user to the server
	socket.emit('welcome', { name: user.name, message: 'Welcome to the server.' }); //You are in default channel.(todo)

	// Send message to every connected client
	socket.on('sendMessage', function (data) {
		debug(data);
		var d = new Date(), ts = d.getTime();

		//Delay message from user 1000ms
		if(ts > (timestamp + 1000) && data.message.length <= 1000) {
			debug("timestamp: "+ timestamp +" < "+ ts);
			timestamp = ts;

			string = data.message.replace('script','blocked').replace('/script','/blocked').encodeHTML();

			io.sockets.emit('message', { date: d, name: user.name, message: string });
		}
	});

	// setName
	socket.on('setName', function (data) {
		debug(data);
		editUserName(socket, user, data);
	});

	// whisper
	socket.on('whisper', function (data) {
		// todo...
		debug(data);
	});

	// setChannel
	socket.on('setChannel', function (data) {
		// todo...
		debug(data);
	});

	// Client disconnect from server
	socket.on('disconnect', function (data) {
		debug(socket.id+' disconnect');
		removeUser(user);
	});

});