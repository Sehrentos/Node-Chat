/*
* NodeJS & socket.io chat server
* @http://socket.io/docs/server-api/
*
* Install socket.io module:
* cd <my_directory>
* npm install socket.io
*
* Create http server with socket.io and filesystem
*
var app = require('http').createServer(handler),
	io = require('socket.io').listen(app), //socket.io
	fs = require('fs'); //FileSystem
app.listen(9000);
function handler(req, res) {
	fs.readFile(__dirname + '/data/index.html',
	function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading /data/index.html');
		}
		res.writeHead(200);
		res.end(data);
	});
}
*/
// Start socket.io standalone server:
var io = require('socket.io')(9000);
//io.listen(9000);

// Save global users array
var users = [];

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
socket.contains(client.id, function(found) {
    if (found) {
        socket.emit
    }
});
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

// User data & settings
function addUser(socketId) {
	var time = new Date().getTime();
	var user = {
		id: socketId,
		name: "Anon" + time,
		channel: 'general',
		whisper: '',
		joined: time,
		timestamp: time
	}
	users.push(user);

	return user;
}

// Remove user
function removeUser(user) {
	for (var i=0; i<users.length; i++) {
		if (user.name === users[i].name) {
			users.splice(i, 1);

            channelRemoveUser(user.channel, {
				id: user.id,
				name: user.name,
				message: 'Disconnected'
			});

			return user;
		}
	}
}

// Send updated user data
function updateUser(socket, user) {
	user.timestamp = new Date().getTime();
	socket.emit('update-user', user);
}

// Update user name
function updateName(socket, user, data) {
	var exist = false,
	    data_name = data.name.encodeHTML();

	if (data_name.length <= 1) {
		return socket.emit('notice', {
			message: 'Name is too short (2-50)'
		});
	}
	if (data_name.length > 50) {
		return socket.emit('notice', {
			message: 'Name is too long (2-50)'
		});
	}

	// Check if name exists
	for (var i=0; i<users.length; i++) {
		if (data_name === users[i].name) {
			exist = true;
			socket.emit('notice', {
				message: 'This name already exists! <strong>'+ data_name +'</strong>'
			});
		}
	}
	// Update user and send data to other clients
	if (exist === false) {
		for (var i=0; i<users.length; i++) {
			if (user.name === users[i].name) {
				user.name = data_name;
				users[i].name = data_name;

				updateUser(socket, user);

				channelUpdateUser(user.channel, {
					id: user.id,
					name: user.name,
					message: 'Update'
				});

				socket.emit('notice', {
					message: 'Your name is now <strong>'+ user.name +'</strong>'
				});
			}
		}
	}
}

// Update user/users channel
function updateChannel(socket, user, data) {
	var from_channel = user.channel.encodeHTML(),
		to_channel = data.channel.encodeHTML();

	if (to_channel.length <= 1) {
		return socket.emit('notice', { message: 'Channel name is too short (2-50)' });
	}
	if (to_channel.length > 50) {
		return socket.emit('notice', { message: 'Channel name is too long (2-50)' });
	}
	if (from_channel === to_channel) {
		return socket.emit('notice', { message: 'You are in <strong>'+ from_channel +'</strong> channel' });
	}

	for (var i=0; i<users.length; i++) {
		if (user.name === users[i].name) {
			socket.leave(from_channel);
			users[i].channel = to_channel;
			user.channel = to_channel;
			socket.join(to_channel);
			socket.emit('notice', { message: 'You moved to <strong>'+ from_channel +'</strong> channel' });
			updateUser(socket, user);

			updateUsers(user, from_channel, to_channel);
		}
	}
}

// Updates user data to every one in same channel
// @channelAddUser(user.channel, { id: user.id, name: user.name, message: '' })
function channelAddUser(channel, data) {
    io.sockets.in(channel).emit('channel-user-add', data);
}

// Get user list of the channel
// @channelListUsers(user.channel)
function channelListUsers(socket, channel) {
    var arr = { users:[] };

    for (var i=0; i<users.length; i++) {
        if (channel === users[i].channel) {
            arr.users.push( { id: users[i].id, name: users[i].name, channel: users[i].channel } );
        }
    }

    socket.emit('channel-user-list', arr);
}

// Send remove user data to every connected client in channel
// @channelRemoveUser(user.channel, { id: user.id, name: user.name, message: '' })
function channelRemoveUser(channel, data) {
    io.sockets.in(channel).emit('channel-user-remove', data);
}

// Send updated user data to every connected client in channel
// @channelUpdateUser(user.channel, { id: user.id, name: user.name, message: '' })
function channelUpdateUser(channel, data) {
    io.sockets.in(channel).emit('channel-user-update', data);
}

// @whisperTo( socket, user, data)
function whisperTo(socket, user, data) {
	var _date = new Date(),
	    _timestamp = _date.getTime(),
	    _from = data.from.encodeHTML(),
	    _to = data.to.encodeHTML(),
	    _msg = data.message.encodeHTML();

	for (var i=0; i<users.length; i++) {
		if (users[i].name.length && (users[i].name === _to || users[i].name === _from) ) {
			if (user.whisper !== _to) {
				user.whisper = _to;
				updateUser(socket, user);
			}
			// Message delay 1000ms length 1000 characters
			if (_timestamp > (user.timestamp + 1000) && data.message.length <= 1000) {
				user.timestamp = _timestamp;

				io.to(users[i].id).emit('wisper', {
					date: _date,
					to: _to,
					from: _from,
					message: _msg
				});
			}
		}
	}
}

// Channel users array[name,name,...]
function updateUsers(user, from_channel, to_channel) {
	if (from_channel !== undefined) {
        channelRemoveUser(from_channel.encodeHTML(), { id: user.id, name: user.name, message: 'Leaved channel' });
		channelAddUser(to_channel.encodeHTML(), { id: user.id, name: user.name, message: 'Joined channel' });
	} else {
        channelUpdateUser(user.channel, { id: user.id, name: user.name, message: 'Update' });
	}
}

// Event listener socket open
io.sockets.on('connection', function (socket) {

	// Set new user data
	var user = addUser(socket.id);

    //var client = socket.handshake.address;
	var client = socket.request.connection;
	console.log('Connection '+ socket.id +' '+ user.name +' '+ client.remoteAddress);

	// Welcome new user to the server
	socket.emit('welcome', {
		message: 'Welcome to the server. You are in '+ user.channel +' channel.'
	});

	// Join default channel
	socket.join(user.channel);

	// Send updated user settings
	updateUser(socket, user);

    // Add new user to the channel
    channelAddUser(user.channel, {
		id: user.id,
		name: user.name,
		message: 'Joined channel'
	});

    // Send list of users in this channel to the current user
    channelListUsers(socket, user.channel);

	// Receive messages event
	socket.on('message', function (data) {
		//console.log(data);
		var _date = new Date();
		var _timestamp = _date.getTime();

		// Message delay 1000ms length 1000 characters
		if (_timestamp > (user.timestamp + 1000) && data.message.length <= 1000) {
			user.timestamp = _timestamp;
			io.to(user.channel).emit('message', {
				date: _date,
				name: user.name,
				message: data.message.encodeHTML()
			});
		}
	});

	// name change
	socket.on('setName', function (data) {
		//console.log(data);
		updateName(socket, user, data);
	});

	// whisper to
	socket.on('setWhisper', function (data) {
		//console.log(data);
		whisperTo(socket, user, data);
	});

	// channel switch
	socket.on('setChannel', function (data) {
		//console.log(data);
        if (data.channel && data.channel.length > 0) {
            updateChannel(socket, user, data);
			channelListUsers(socket, user.channel);
        }
	});

	// Client disconnect from server
	socket.on('disconnect', function (data) {
		//console.log('disconnect '+ socket.id);
		removeUser(user);
        delete user;
	});

}); //End io sockets