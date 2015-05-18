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
var io = require('socket.io')(9000);
//io.listen(9000);

// debug console.log
var debug = function(str) {
	console.log(str); //Uncomment this to see logs
	return this;
};

/*
* Define encodeHTML function
* @myVar.encodeHTML()
*/
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

/*
* Define contains function
* socket.contains(client.id, function(found) {
* 	if (found) {
* 		socket.emit
* 	}
* });
*/
if (!Array.prototype.contains) {
	Array.prototype.contains = function(k, callback) {
		var self = this;
		return (function check(i) {
			if (i >= self.length) {
				return callback(false);
			}
			if (self[i] === k) {
				return callback(true);
			}
			return process.nextTick(check.bind(null, i+1));
		}(0));
	};
}

var users = [];

var addUser = function(socketId) {
	var time = new Date().getTime();
	var user = {
		id: socketId,
		name: "Anon"+ time,
		channel: 'general',
		whisper: '',
		joined: time,
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

var updateUser = function(socket, user) {
	user.timestamp = new Date().getTime();
	socket.emit('update', user);
};

var updateName = function(socket, user, data) {
	var exist = false;
	for (var i=0; i<users.length; i++) {
		if (data.name === users[i].name) {
			exist = true;
			socket.emit('notice', {
				message: 'This name already exists! <strong>'+ user.name +'</strong>'
			});
		}
	}
	for (var i=0; i<users.length; i++) {
		if (exist === false && user.name === users[i].name) {
			user.name = data.name;
			users[i].name = data.name;
			socket.emit('notice', {
				message: 'Your name is now <strong>'+ user.name +'</strong>'
			});
		}
	}
	if (user.name === data.name) {
		updateUsers(user);
	}
};

var updateChannel = function(socket, user, data) {
	var from_channel = user.channel,
		to_channel = data.channel;

	for (var i=0; i<users.length; i++) {
		if (from_channel === to_channel) {
			return socket.emit('notice', { message: 'You are in <strong>'+ user.channel +'</strong> channel' });
		}
		else if (user.name === users[i].name) {
			socket.leave(user.channel);
			users[i].channel = data.channel;
			user.channel = data.channel;
			socket.join(data.channel);
			socket.emit('notice', { message: 'You moved to <strong>'+ user.channel +'</strong> channel' });
		}
	}
	updateUsers(user, from_channel, to_channel);
};

var whisperTo = function(user, data) {
	for (var i=0; i<users.length; i++) {
		if (users[i].name.length && (users[i].name === data.to || users[i].name === data.from)) {
			user.whisper = data.to;
			io.to(users[i].id).emit('wisper', {
				date: (new Date()),
				to: data.to,
				from: data.from,
				message: data.message
			});
		}
	}
};

// emit channel users array[name,name,...]
var updateUsers = function(user, from_channel, to_channel) {
	var arr_enter = [];
	var arr_leave = [];
	debug( users[0] );

	if (from_channel !== undefined) {
		for (var i=0; i<users.length; i++) {
			if (to_channel === users[i].channel) {
				arr_enter.push({ name: users[i].name });
			} else if (from_channel === users[i].channel) {
				arr_leave.push({ name: users[i].name });
			}
		}
		for (var i=0; i<users.length; i++) {
			if (to_channel === users[i].channel) {
				io.to(users[i].id).emit("users", arr_enter);
			}
			if (from_channel === users[i].channel) {
				io.to(users[i].id).emit("users", arr_leave);
			}
		}
	} else {
		for (var i=0; i<users.length; i++) {
			if (user.channel === users[i].channel) {
				arr_enter.push({ name: users[i].name });
			}
		}
		for (var i=0; i<users.length; i++) {
			if (user.channel === users[i].channel) {
				io.to(users[i].id).emit("users", arr_enter);
			}
		}
	}
};

// Socket open
io.sockets.on('connection', function (socket) {

	// Set new user details
	var user = addUser(socket.id);

	//user.timestamp = new Date().getTime();

	//socket.name = user;
	debug(socket.id +' connected: '+ user.name);

	// Welcome new user to the server
	socket.emit('welcome', {
		message: 'Welcome to the server. You are in '+ user.channel +' channel.'
	});

	// Join default channel
	socket.join(user.channel);

	// Update user settings
	updateUser(socket, user);

	// Send message to every connected client
	socket.on('message', function (data) {
		debug(data);
		var _date = new Date(),
		    _timestamp = _date.getTime();

		//Message delay 1000ms length 1000 characters
		if (_timestamp > (user.timestamp + 1000) && data.message.length <= 1000) {
			//debug("timestamp: "+ timestamp +" < "+ _timestamp);
			user.timestamp = _timestamp;
			io.to(user.channel).emit('chat', {
				date: _date,
				name: user.name,
				message: data.message.encodeHTML()
			});
		}
	});

	// name change
	socket.on('setName', function (data) {
		debug(data);
		updateName(socket, user, data);
		updateUser(socket, user);
	});

	// whisper to
	socket.on('setWhisper', function (data) {
		debug(data);
		whisperTo(user, data);
		updateUser(socket, user);
	});

	// channel switch
	socket.on('setChannel', function (data) {
		debug(data);
		//Edit user details
		updateChannel(socket, user, data);
		updateUser(socket, user);
	});

	// Client disconnect from server
	socket.on('disconnect', function (data) {
		debug(socket.id+' disconnect');
		removeUser(user);
	});

}); //End io sockets