/*
* NodeJS & socket.io chat server
* @http://socket.io/docs/server-api/
*
* Install socket.io module:
* cd <my_directory>
* npm install socket.io
*
// Create http server with socket.io and filesystem
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

var addUser = function(sid) {
	var time = new Date().getTime();
	var user = {
		id: sid,
		name: "Anon"+ time,
		channel: 'general',
		timestamp: time
	}
	users.push(user);
	updateUsers(user);
	return user;
};

var removeUser = function(user) {
	for (var i=0; i<users.length; i++) {
		if (user.name === users[i].name) {
			users.splice(i, 1);
			updateUsers(user);
			return user;
		}
	}
};

var editUserName = function(socket, user, data) {
	var exist = false;
	for (var i=0; i<users.length; i++) {
		if (data.name === users[i].name) {
			exist = true;
			socket.emit('notice', { message: 'This name already exists! <strong>'+ user.name +'</strong>' });
		}
	}
	for (var i=0; i<users.length; i++) {
		if (exist === false && user.name === users[i].name) {
			user.name = data.name;
			users[i].name = data.name;
			socket.emit('notice', { message: 'Your name is now <strong>'+ user.name +'</strong>' });
		}
	}
	if (user.name === data.name) {
		updateUsers(user);
	}
};

var editUserChannel = function(socket, user, data) {
	for (var i=0; i<users.length; i++) {
		if (user.name === users[i].name) {
			socket.leave(user.channel);
			user.channel = data.channel;
			users[i].channel = data.channel;
			socket.join(data.channel);
			socket.emit('notice', { message: 'You moved into <strong>'+ user.channel +'</strong> channel' });
		}
	}
	updateUsers(user);
};

var wisperUser = function(socket, user, data) {
	for (var i=0; i<users.length; i++) {
		if (users[i].to === data.to || users[i].to === user.to) {
			io.to(users[i].id).emit('wisper', { date: (new Date()), to: data.to, from: data.from, message: data.message });
		}
	}
};

var updateUsers = function(user) {
	var arr = [];
	for (var i=0; i<users.length; i++) {
		if (user.channel === users[i].channel) {
			arr.push(users[i]);
		}
	}
	io.sockets.emit("users", arr);
};

// String encode function: myVariable.encodeHTML()
if (!String.prototype.encodeHTML) {
	String.prototype.encodeHTML = function() {
		return this.replace('script','blocked')
			.replace('/script','/blocked')
			.replace(/&/g, '&amp;')
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
	debug(socket.id+' connected');

	// Set user name
	var user = addUser(socket.id), timestamp = (new Date().getTime());
	socket.user = user;
	debug(socket.user.name);

	// Welcome new user to the server
	socket.emit('welcome', { message: 'Welcome to the server. You are in '+ user.channel +' channel.' }); //You are in default channel.(todo)

	// Join default channel
	socket.join(user.channel);

	// Send message to every connected client
	socket.on('sendMessage', function (data) {
		debug(data);
		var d = new Date(), ts = d.getTime();

		//Message re-posting delay 1000ms
		//Message max length 1000 characters
		if(ts > (timestamp + 1000) && data.message.length <= 1000) {
			//debug("timestamp: "+ timestamp +" < "+ ts);
			timestamp = ts;
			//io.sockets.emit('message', { date: d, name: user.name, message: data.message.encodeHTML() });
			io.to(user.channel).emit('message', { date: d, name: user.name, message: data.message.encodeHTML() });
			//io.broadcast.to(user.channel).emit('message', { date: d, name: user.name, message: data.message.encodeHTML() });
		}
	});

	// setName
	socket.on('setName', function (data) {
		debug(data);
		editUserName(socket, user, data);
	});

	// whisper
	socket.on('setWhisper', function (data) {
		debug(data);
		wisperUser(socket, user, data);
	});

	// setChannel
	socket.on('setChannel', function (data) {
		debug(data);
		//Edit user details
		editUserChannel(socket, user, data);
	});

	// Client disconnect from server
	socket.on('disconnect', function (data) {
		debug(socket.id+' disconnect');
		removeUser(user);
	});

});