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

/*
* Messages data object
* @Messages.max - Max messages to start removing the first
* @Messages.get()
* @Messages.set( object ) - ignore max setting
* @Messages.add( object )
* @Messages.remove( object, all(true) ) 
*/
var Messages = function() {
	this.max = 10; //zero count aswell
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
* Define encodeHTML function
* @myVar.encodeHTML()
*/
if (!String.prototype.encodeHTML) {
	String.prototype.encodeHTML = function() {
		return this.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	};
}

/*
* Define contains function
socket.contains(client.id, function(found) {
	if (found)
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
	chatData.users.push(user);

	return user;
}

// Remove user
function removeUser(user) {
	for (var i=0; i<chatData.users.length; i++) {
		if (user.name === chatData.users[i].name) {
			chatData.users.splice(i, 1);

			return user;
		}
	}
}

// Send updated user data
function updateUser(socket, user) {
	user.timestamp = new Date().getTime();
	socket.emit('update-user', user);
}

// Updates user data to every one in same channel
// @channelAddUser(user.channel, { id: user.id, name: user.name, message: '' })
function channelAddUser(socket, channel, data) {
	socket.join(channel);
	io.sockets.in(channel).emit('channel-user-add', data);
}

// Send remove user data to every connected client in channel
// @channelRemoveUser(user.channel, { id: user.id, name: user.name, message: '' })
function channelRemoveUser(socket, channel, data) {
	socket.leave(channel);
	io.sockets.in(channel).emit('channel-user-remove', data);
}

// Send updated user data to every connected client in channel
// @channelUpdateUser(user.channel, { id: user.id, name: user.name, message: '' })
function channelUpdateUser(socket, channel, data) {
	io.sockets.in(channel).emit('channel-user-update', data);
}

// Channel user switch channel updateUsers
function channelSwitch(socket, user, from_channel, to_channel) {
	if (from_channel !== undefined) {
		channelRemoveUser(socket, from_channel, { id: user.id, name: user.name, message: 'Leaved channel' });
		channelAddUser(socket, to_channel, { id: user.id, name: user.name, message: 'Joined channel' });
	} else {
		channelUpdateUser(socket, user.channel, { id: user.id, name: user.name, message: 'Update' });
	}
}

// Get user list of the channel
// @channelListUsers(user.channel)
function channelListUsers(socket, channel) {
	var arr = { users:[] };

	for (var i=0; i<chatData.users.length; i++) {
		if (channel === chatData.users[i].channel) {
			arr.users.push( { id: chatData.users[i].id, name: chatData.users[i].name, channel: chatData.users[i].channel } );
		}
	}

	socket.emit('channel-user-list', arr);
}

// Cooldown
function cooldown(user, time) {
	var cd = time ? time : 1000;
	var date = new Date();
	var timestamp = date.getTime();

	if (timestamp > (user.timestamp + cd)) {
		user.timestamp = timestamp;
		return timestamp;
	}

	return false;
}

// Save global data
// @users array object { id, name, channel, whisper, joined, timestamp }
var chatData = {
	users: []
};
// Messages object
// Store all messages so you can log them
// TODO: extend memory for each channels
var messagesData =  new Messages();
messagesData.max = 25; //Increase max messages

// Event listener's on socket open
io.sockets.on('connection', function(socket) {

	// Set new user data
	var user = addUser(socket.id);

	// Console log new connection.
	//var client = socket.handshake.address;
	//var client = socket.request.connection;
	console.log('Connection '+ socket.id +' '+ user.name +' '+ socket.request.connection.remoteAddress);
	//console.log( socket.adapter.rooms ); //{ R5czp2k6xwFBEKK8AAAA: { R5czp2k6xwFBEKK8AAAA: true } }

	// Join default channel/room
	socket.join(user.channel);

	// Welcome new user to the server.
	// @event: header-topic
	socket.emit('header-topic', {
		message: 'You are in '+ user.channel +' channel.'
	});

	// Send updated user settings
	// @event: update-user
	updateUser(socket, user);

	// Add new user to the channel
	// @event: channel-user-add
	channelAddUser(socket, user.channel, {
		id: user.id,
		name: user.name,
		message: 'Joined channel'
	});

	// Send list of users in this channel to the current user
	// @event: channel-user-list
	channelListUsers(socket, user.channel);

	// Message event
	// @event: message
	socket.on('message', function (data) {
		if (cooldown(user, 800)) {
			//console.log(data);
			var _date = new Date();

			// Message delay 1000ms length 1000 characters
			if (data.message.length <= 1000) {
				// Send to client
				io.to(user.channel).emit('message', {
					date: _date,
					name: user.name,
					message: data.message.encodeHTML()
				});
				// Save message data
				//chatData.messages.push({
				messagesData.add({
					channel: user.channel,
					date: _date,
					name: user.name,
					message: data.message.encodeHTML()
				});
			}
		}
	});

	// whisper to
	// @event: whisper
	socket.on('whisper', function (data) {
		if (cooldown(user, 800)) {
			//console.log(data);
			var _date = new Date(),
				_from = data.from.encodeHTML(),
				_to = data.to.encodeHTML(),
				_msg = data.message.encodeHTML();

			// Message length 1000 characters
			if (_msg.length <= 1000) {
				for (var i=0; i<chatData.users.length; i++) {
					if (chatData.users[i].name.length && (chatData.users[i].name === _to || chatData.users[i].name === _from) ) {
						if (user.whisper !== _to) {
							user.whisper = _to;
							updateUser(socket, user);
						}
						//console.log(chatData.users[i].id);
						io.to(chatData.users[i].id).emit('whisper', {
							date: _date,
							to: _to,
							from: _from,
							message: _msg
						});
					}
				}
			}
		}
	});

	// Name change
	// @event: setName
	socket.on('setName', function (data) {
		if (cooldown(user, 1000)) {
			//console.log(data);
			//updateName(socket, user, data);
			var exist = false,
				data_name = data.name.encodeHTML() || 0;

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
					if (data_name === chatData.users[i].name) {
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
						if (user.name === chatData.users[i].name) {
							user.name = data_name;
							chatData.users[i].name = data_name;

							updateUser(socket, user);

							channelUpdateUser(socket, user.channel, {
								id: user.id,
								name: user.name,
								message: 'Update'
							});

							socket.emit('notice', {
								message: 'Your name is now <strong>'+ user.name +'</strong>'
							});

							break; //Stop loop
						}
					}
				}
			}
		}
	});

	// Channel switch
	// @event: setChannel
	socket.on('setChannel', function (data) {
		if (cooldown(user, 1000)) {
			//console.log(data);
			var from_channel = user.channel.encodeHTML() || 0,
				to_channel = data.channel.encodeHTML() || 0;

			//updateChannel(socket, user, data);
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
					if (user.name === chatData.users[i].name) {
						user.channel = to_channel;
						chatData.users[i].channel = to_channel;
						updateUser(socket, user);

						channelSwitch(socket, user, from_channel, to_channel);

						socket.emit('notice', { message: 'You moved to <strong>'+ user.channel +'</strong> channel' });
						socket.emit('header-topic', { message: 'You are in '+ user.channel +' channel.' });

						// Get list of users in channel
						channelListUsers(socket, user.channel);

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
			if (cooldown(user, 3000)) {
				//getMessages(socket, user);
				var arr = { messages:[] };
				var messages = messagesData.get();

				for (var i=0; i<messages.length; i++) {
					if (messages[i].channel === user.channel) {
						arr.messages.push({
							channel: messages[i].channel,
							date: messages[i].date,
							name: messages[i].name,
							message: messages[i].message
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
		//console.log('disconnect '+ socket.id);

		// Remove user from global users array
		removeUser(user);

		// Update to other clients
		channelRemoveUser(socket, user.channel, {
			id: user.id,
			name: user.name,
			message: 'User disconnect'
		});

		delete user;
	});

}); //End io sockets