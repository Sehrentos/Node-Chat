/*
 * NodeJS & socket.io chat server
 * @http://socket.io/docs/server-api/
 *
 * Install socket.io module:
 * cd <my_directory>
 * npm install socket.io
 *
 * Setup basic express server
 */
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
//var io = require('socket.io')(3000); // socket.io standalone
var port = process.env.PORT || 3000;
var debugMode = false;
var chatData = {
	users: []
};

server.listen(port, function() {
  if (debugMode) console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Route for everything else.
app.get('*', function(req, res) {
	res.send('Route not found.');
});

/*
 * Messages data array
 * @Messages.max - Max messages to start removing the first
 * @Messages.get()
 * @Messages.set( object ) - ignore max setting
 * @Messages.add( object )
 * @Messages.remove( object, all(true) ) 
 */
var Messages = function() {
	this.max = 25; //zero count aswell
	this.maxLength = 3000;
	this.data = [];
	this.remove = function(vals, all) {
		var arr = this.data, i, removedItems = [];
		if (!Array.isArray(vals)) vals = [vals];
		for (var j = 0; j < vals.length; j++) {
			if (all) {
				for(i = arr.length; i--;){
					if (arr[i] === vals[j]) removedItems.push(arr.splice(i, 1));
				}
			}
			else {
				i = arr.indexOf(vals[j]);
				if(i>-1) removedItems.push(arr.splice(i, 1));
			}
		}
		return removedItems;
	};
	this.add = function(obj) {
		var arr = this.data;
		if (arr.length >= this.max) {
			var removed = arr.splice(0, 1);
		}
		return arr.push(obj);
	};
	this.get = function() {
		return this.data;
	};
	this.set = function(arr) {
		if (typeof(arr) === "object") {
			this.data = arr;
		}
		return this.data;
	};
};

/*
 * String.encodeHTML function
 */
if (!String.prototype.encodeHTML) {
	String.prototype.encodeHTML = function() {
		return this.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;').toString();
	};
}

/*
 * User data & settings
 */
function addUser(socket) {
	var time = new Date().getTime();
	
	var user = {
		id: socket.id,
		nickname: "Anon" + time,
		channel: 'general',
		whisper: '',
		joined: time,
		timestamp: time
	}
	
	chatData.users.push(user);

	return user;
}

/*
 * Remove user
 */
function removeUser(socket) {
	for (var i=0; i<chatData.users.length; i++) {
		if (socket.user.nickname === chatData.users[i].nickname) {
			chatData.users.splice(i, 1);

			return socket.user.nickname;
		}
	}
}

/*
 * Send updated user data
 */
function updateUser(socket) {
	socket.user.timestamp = new Date().getTime();
	socket.emit('update-user', socket.user);
}

/*
 * Updates user data to every one in same channel
 * @channelAddUser(socket, { id, channel, nickname, message })
 */
function channelAddUser(socket, data) {
	socket.join(data.channel);
	io.sockets.in(data.channel).emit('channel-user-add', data);
}

/*
 * Send remove user data to every connected client in channel
 * @channelRemoveUser(socket, { id, channel, nickname, message })
 */
function channelRemoveUser(socket, data) {
	socket.leave(data.channel);
	io.sockets.in(data.channel).emit('channel-user-remove', data);
}

/*
 * Send updated user data to every connected client in channel
 * @channelUpdateUser(socket, { id, channel, nickname, message })
 */
function channelUpdateUser(socket, data) {
	io.sockets.in(data.channel).emit('channel-user-update', data);
}

/*
 * Channel user switch channel updateUsers
 */
function channelSwitch(socket, from_channel, to_channel) {
	if (from_channel !== undefined) {
		channelRemoveUser(socket, {
			id: socket.user.id,
			channel: from_channel,
			nickname: socket.user.nickname,
			message: 'Leaved channel'
		});
		channelAddUser(socket, {
			id: socket.user.id,
			channel: to_channel,
			nickname: socket.user.nickname,
			message: 'Joined channel'
		});
	} else {
		channelUpdateUser(socket, {
			id: socket.user.id,
			channel: socket.user.channel,
			nickname: socket.user.nickname,
			message: 'Switched channel'
		});
	}
}

/*
 * Get user list of the channel
 * @channelListUsers(socket.user.channel)
 */
function channelListUsers(socket, channel) {
	var arr = { users:[] };

	for (var i=0; i<chatData.users.length; i++) {
		if (channel === chatData.users[i].channel) {
			arr.users.push({
				id: chatData.users[i].id,
				nickname: chatData.users[i].nickname,
				channel: chatData.users[i].channel,
				message: "Channel list all users"
			});
		}
	}

	socket.emit('channel-user-list', arr);
}

/*
 * setName - Set user name
 */
function setName(socket, data) {
	var exist = false,
		data_name = data.nickname || "", /* encodeURIComponent() ? */
		data_lastName = socket.user.nickname || "";

	if (data_name.length <= 1) {
		socket.emit('notice', {
			message: 'Name is too short (2-50)'
		});
	}
	else if (data_name.length > 50) {
		socket.emit('notice', {
			message: 'Name is too long (2-50)'
		});
	}
	else {
		// Check if name exists
		for (var i=0; i<chatData.users.length; i++) {
			if (data_name === chatData.users[i].nickname) {
				exist = true;
				socket.emit('notice', {
					message: 'This name already exists <strong>'+ data_name +'</strong>'
				});

				break; //Stop loop
			}
		}
		// Update user and send data to other clients
		if (exist === false) {
			for (var i=0; i<chatData.users.length; i++) {
				if (socket.user.nickname === chatData.users[i].nickname) {
					socket.user.nickname = data_name;
					chatData.users[i].nickname = data_name;

					socket.emit('notice', {
						message: 'Your name is now <strong>'+ socket.user.nickname +'</strong>'
					});

					break; //Stop loop
				}
			}
		}
	}
	return data_lastName;
}

/*
 * Cooldown
 */
function cooldown(socket, time) {
	var cd = time ? time : 1000;
	var date = new Date();
	var timestamp = date.getTime();

	if (timestamp > (socket.user.timestamp + cd)) {
		socket.user.timestamp = timestamp;
		return timestamp;
	}

	return false;
}

/*
 * Messages object
 * - Store all messages
 * TODO: extend memory for each channels
 */
chatData.messages = new Messages();
//chatData.messages.max = 50; // max messages to store
//chatData.messages.maxLength = 3000; // max message length

/*
 * Event listener's on socket
 */
io.on('connection', function(socket) {

	// Set new user data
	socket.user = addUser(socket);
	
	// Change nickname from query
	if (typeof socket.handshake.query.nickname !== "undefined") {
		setName(socket, { nickname: socket.handshake.query.nickname });
	}
	
	/*var rooms = socket.adapter.rooms;
	for (var room in rooms) {
		if (rooms.hasOwnProperty(room)) {
			console.log("Room found:", room);
			if (room === socket.id) {
				console.log("Room select:", room); // Selected my own room!
			}
		}
	} */

	// Console log new connection.
	//var client = socket.handshake.address;
	//var client = socket.request.connection;
	if (debugMode) console.log('Connection '+ socket.id +' '+ socket.user.nickname +' '+ socket.request.connection.remoteAddress);
	//if (debugMode) console.log( socket.adapter.rooms ); //{ R5czp2k6xwFBEKK8AAAA: { R5czp2k6xwFBEKK8AAAA: true } }

	// Add new user to the channel
	// @event: channel-user-add
	channelAddUser(socket, {
		id: socket.user.id,
		channel: socket.user.channel,
		nickname: socket.user.nickname,
		message: 'Joined channel'
	});

	// Welcome new user to the server.
	// @event: set-topic
	socket.emit('set-topic', {
		message: socket.user.channel /* 'Welcome to general channel.' */
	});

	// Send updated user settings
	// @event: update-user
	updateUser(socket);

	// Send list of users in this channel to the current user
	// @event: channel-user-list
	channelListUsers(socket, socket.user.channel);
	
	if (debugMode) console.log( socket.adapter.rooms );
	
	// Message event
	// @event: message
	socket.on('message', function (data) {
		if (cooldown(socket, 800)) {
			if (debugMode) console.log(data);
			var _date = new Date();

			// Message max chars
			if (data.message.length <= chatData.messages.maxLength) {
				// Send to client
				io.to(socket.user.channel).emit('message', {
					date: _date,
					nickname: socket.user.nickname,
					message: data.message /* encodeURIComponent() ? */
				});
				// Save message data
				//chatData.messages.push({
				chatData.messages.add({
					channel: socket.user.channel,
					date: _date,
					nickname: socket.user.nickname,
					message: data.message /* encodeURIComponent() ? */
				});
			}
		}
	});

	// whisper to
	// @event: whisper
	socket.on('whisper', function (data) {
		if (cooldown(socket, 800)) {
			if (debugMode) console.log(data);
			var _date = new Date(),
				_from = data.from || "",
				_to = data.to || "",
				_msg = data.message || "";

			// Message max chars
			if (_msg.length <= chatData.messages.maxLength) {
				for (var i=0; i<chatData.users.length; i++) {
					if (chatData.users[i].nickname.length && (chatData.users[i].nickname === _to || chatData.users[i].nickname === _from) ) {
						if (socket.user.whisper !== _to) {
							socket.user.whisper = _to;
							updateUser(socket);
						}
						//if (debugMode) console.log(chatData.users[i].id);
						//socket.broadcast.to(chatData.users[i].id).emit('whisper', {
						io.to(chatData.users[i].id).emit('whisper', {
							date: _date,
							to: _to,
							from: _from,
							message: _msg /* encodeURIComponent() ? */
						});
						//break; //Stop loop
					}
				}
			}
		}
	});

	// Name change
	// @event: set-nick
	socket.on('set-nick', function (data) {
		if (cooldown(socket, 800)) {
			if (debugMode) console.log(data);

			// Set Name
			if (typeof data.nickname !== "undefined") {
				var lastName = setName(socket, { nickname: data.nickname });
				
				updateUser(socket);

				channelUpdateUser(socket, {
					id: socket.user.id,
					channel: socket.user.channel,
					nickname: socket.user.nickname,
					message: 'has changed name from ' + lastName
				});
			}
		}
	});

	// Channel switch
	// @event: set-channel
	socket.on('set-channel', function (data) {
		if (cooldown(socket, 800)) {
			if (debugMode) console.log(data);
			var from_channel = socket.user.channel || 0, 
				to_channel = data.channel || 0; /* encodeURIComponent() ? */

			if (to_channel.length <= 1) {
				socket.emit('notice', { message: 'Channel name is too short (2-50)' });
			}
			else if (to_channel.length > 50) {
				socket.emit('notice', { message: 'Channel name is too long (2-50)' });
			}
			else if (from_channel === to_channel) {
				socket.emit('notice', { message: 'You are in <strong>'+ from_channel +'</strong> channel' });
			}
			else {
				for (var i=0; i<chatData.users.length; i++) {
					if (socket.user.nickname === chatData.users[i].nickname) {
						socket.user.channel = to_channel;
						chatData.users[i].channel = to_channel;
						updateUser(socket);

						channelSwitch(socket, from_channel, to_channel);

						socket.emit('notice', { message: 'You moved to <strong>'+ socket.user.channel +'</strong> channel' });
						socket.emit('set-topic', { message: socket.user.channel }); /* 'You are in '+ socket.user.channel +' channel.' */

						// Get list of users in channel
						channelListUsers(socket, socket.user.channel);

						break; //Stop loop
					}
				}
			}
		}
	});

	// get messages posted in channel
	// @event: get-messages
	socket.on('get-messages', function (data) {
		if (data) {
			if (cooldown(socket, 1600)) {
				if (debugMode) console.log(data);

				var arr = { messages:[] };
				var messages = chatData.messages.get();

				for (var i=0; i<messages.length; i++) {
					if (messages[i].channel === socket.user.channel) {
						arr.messages.push({
							channel: messages[i].channel,
							date: messages[i].date,
							nickname: messages[i].nickname,
							message: messages[i].message /* encodeURIComponent() ? */
						});
					}
				}

				socket.emit('get-messages', arr);
			}
		}
	});

	// Client disconnect from server
	// @event: disconnect
	socket.on('disconnect', function (data) {
		if (debugMode) console.log('disconnect '+ socket.id);

		// Remove user from global users array
		removeUser(socket);

		// Update to other clients
		channelRemoveUser(socket, {
			id: socket.user.id,
			channel: socket.user.channel,
			nickname: socket.user.nickname,
			message: 'User disconnected'
		});

		//delete user;
	});

}); //End io sockets