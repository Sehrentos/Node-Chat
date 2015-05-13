/*
* NodeJS - chat
* @source: http://stackoverflow.com/questions/18990494/how-to-install-node-js-npm-socket-io-and-use-them
* @source: http://krasimirtsonev.com/blog/article/Real-time-chat-with-NodeJS-Socketio-and-ExpressJS
* @http://socket.io/docs/server-api/
*
* Windows cmd 
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

// Socket open
io.sockets.on('connection', function (socket) {
	console.log(socket.id+' connect');

	// Set user name
	var user = addUser();

	// Welcome new user to the server
	socket.emit('welcome', { name: user.name, message: 'Welcome to the server.' }); //You are in default channel.(todo)

	// Send message to every connected client
	socket.on('sendMessage', function (data) {
		console.log(data);
		io.sockets.emit('message', { date: (new Date()), name: user.name, message: data.message });
	});

	// setName
	socket.on('setName', function (data) {
		console.log(data);
		editUserName(socket, user, data);
	});

	// whisper
	socket.on('whisper', function (data) {
		// todo...
		console.log(data);
	});

	// setChannel
	socket.on('setChannel', function (data) {
		// todo...
		console.log(data);
	});

	// Client disconnect from server
	socket.on('disconnect', function (data) {
		console.log(socket.id+' disconnect');
		removeUser(user);
	});

});