/*
* main.js - default javascripts
*
* Define chat object:
*/
var chat = {
	user: {},
	method: 'http', // https, http, ws
	address: window.location.host || 'localhost',
	port: 3000,
	channel: '/',
	soundOn: false,
	debugMode: true,
	messageMaxLength: 3000
};

/*
* Socket.IO init
* @require: url - optional
*
* @urlSource: @http://socket.io/docs/client-api/
*/
chat.init = function(url) {
	// Open socket
	chat.socket = io(url); //url || chat.method +'://'+ chat.address +':'+ chat.port + chat.channel

	// Successful connection
	chat.socket.on('connect', function (data) {
		if (chat.debugMode && data) console.log(data);
		chat.mes("Connected.");
		chat.setNick();
	});

	// Error
	chat.socket.on('error', function (data) {
		if (chat.debugMode) console.log(data);
		chat.mes(data);
	});

	// Connect error
	chat.socket.on('connect_error', function (data) {
		if (chat.debugMode) console.log(data);
		if (data.type === "TransportError") {
			chat.mes("Unable to connect server.");
			// Clear user menu
			chat.menuClear();
			//chat.socket.close();
		}
	});

	// Timeout
	chat.socket.on('connect_timeout', function (data) {
		if (chat.debugMode) console.log(data);
		chat.mes("Connection timeout.");
		// Clear user menu
		chat.menuClear();
	});

	// Disconnect
	chat.socket.on('disconnect', function (data) {
		if (chat.debugMode) console.log(data);
		chat.mes("Disconnected.");
		// Clear user menu
		chat.menuClear();
		// Ask to reconnect
		/* nconfirm({
			title: "Disconnected!",
			message: "Do you want to <b>reconnect</b> to the server?",
			background: false,
			onSubmit: function(str) {
				chat.socket.connect();
			}
		}); */
	});

	// Welcome
	chat.socket.on('set-topic', function (data) {
		if (chat.debugMode) {
			console.log('set-topic:');
			console.log(data);
		}
		chat.mes("Set topic: " + data.message);
		$("#header").find("#topic").text(data.message);
	});

	// Notice
	chat.socket.on('notice', function (data) {
		if (chat.debugMode) {
			console.log('Notice:');
			console.log(data);
		}
		chat.mes(data.message);
	});

	// Update user data
	chat.socket.on('update-user', function (data) {
		if (chat.debugMode) {
			console.log('Update-user:');
			console.log(data);
		}
		chat.user = data;
	});

	// New updater: add user
	chat.socket.on('channel-user-add', function (data) {
		if (chat.debugMode) {
			console.log('Channel-user-add:');
			console.log(data);
		}
		chat.mes(data.name + " - " + data.message);
		chat.menuAddUser(data.id, data.name, data.channel);
	});

	// New updater: add user
	chat.socket.on('channel-user-list', function (data) {
		if (chat.debugMode) {
			console.log('Channel-user-list:');
			console.log(data);
		}
		//chat.menuAddUser(data.id, data.name, data.channel);
		chat.updateUsers(data);
	});

	//New updater: remove user
	chat.socket.on('channel-user-remove', function (data) {
		if (chat.debugMode) {
			console.log('Channel-user-remove:');
			console.log(data);
		}
		//chat.mes(data.name + " has left the channel.");
		chat.mes(data.name + " - " + data.message);
		chat.menuRemoveUser(data.id); //userid
	});

	// New updater: user update
	chat.socket.on('channel-user-update', function (data) {
		if (chat.debugMode) {
			console.log('Channel-user-update:');
			console.log(data);
		}
		chat.mes(data.name + " - " + data.message);
		chat.menuUpdateUser(data.id, data.name, data.channel);
	});

	// Whisper
	chat.socket.on('whisper', function (data) {
		if (chat.debugMode) {
			console.log('Whisper:');
			console.log(data);
		}
		var d = new Date(data.date),
			hours = d.getHours(),
			minutes = d.getMinutes(),
			seconds = d.getSeconds(),
			_to = data.to.toString(),
			_from = data.from.toString(),
			message = data.message.toString();

		var msg = "["+ chat.twoDigits(hours) + ":" + chat.twoDigits(minutes) + ":" + chat.twoDigits(seconds) +"] ";
		if (_from === _to || _from === chat.user.name) {
			msg += "Whisper to <a href=\"javascript:void(0)\" class=\"nickname\" onclick=\"chat.setWhisper('"+ _to +"')\">&lt;"+ _to +"&gt;</a> ";
		} else {
			msg += "<a href=\"javascript:void(0)\" class=\"nickname\" onclick=\"chat.setWhisper('"+ _from +"')\">&lt;"+ _from +"&gt;</a> Whispers: ";
		}
		msg += message;
		
		chat.mes(msg,true);
		// Play audio
		if (_to !== chat.user.name) {
			chat.playAudio();
		}
		// Scroll down the chat and set focus to input.
		chat.setFocus();
	});

	// message / chat
	chat.socket.on('message', function(data) {
		if (chat.debugMode) {
			console.log('Chat:');
			console.log(data);
		}
		var d = new Date(data.date),
			hours = d.getHours(),
			minutes = d.getMinutes(),
			seconds = d.getSeconds(),
			name = data.name.toString(),
			message = data.message.toString();

		var msg = "["+ chat.twoDigits(hours) + ":" + chat.twoDigits(minutes) + ":" + chat.twoDigits(seconds) +"] ";
			msg += "<a href=\"javascript:void(0)\" class=\"nickname\" onclick=\"chat.setWhisper('"+ name +"')\">&lt;"+ name +"&gt;</a> ";
			msg += message;

		chat.mes(msg);
		// Play audio
		if (name !== chat.user.name) {
			chat.playAudio();
		}
	});

	// Get all messages from channel
	chat.socket.on('get-messages', function (data) {
		if (chat.debugMode) {
			console.log('Get-messages:');
			console.log(data);
		}

		chat.mes("Start of messages.");

		$.each(data.messages, function() {
			var d = new Date( this.date ),
				hours = d.getHours(),
				minutes = d.getMinutes(),
				seconds = d.getSeconds(),
				name = this.name.toString(),
				message = this.message.toString();

			var msg = "["+ chat.twoDigits(hours) + ":" + chat.twoDigits(minutes) + ":" + chat.twoDigits(seconds) +"] ";
			msg += "<a href=\"javascript:void(0)\" class=\"nickname\" onclick=\"chat.setWhisper('"+ name +"')\">&lt;"+ name +"&gt;</a> ";
			msg += message;
			
			chat.mes(msg);
		});

		chat.mes("End of messages.");

		
	});

	return this;
};

/*
* Socket submit data
* @require: elementId
*/
chat.setSubmit = function(message) {
	var messageStr = message;

	if (messageStr.length) {
		if (messageStr.trim().length > chat.messageMaxLength) {
			nalert({
				message: "Message is too long! "+ chat.messageMaxLength +" chars max.",
				background: true
			});
		}
		else {
			// Check user commands
			var isCommand = false;

			// Check commands 1
			var regex = /^(\/.*)$/g;
			var command = regex.exec(messageStr);
			if (command) {
				isCommand = true;
				switch (command[1]) {
					// Show help
					case "/h":
					case "/help":
					case "/commands":
						chat.mes("Commands:\n /h, /help, /commands - Display help.\n /log, /messages - Display logged channel messages.\n /c, /channel &lt;name&gt; - Change channel.\n /n, /name, /nick &lt;name&gt; - Change name.");
					break;

					// Log/Get messages
					case "/log":
					case "/messages":
						//var channel = command[2] === undefined ? null : command[2].trim();
						chat.socket.emit('get-messages', { message: true });
					break;

					// Command depth: 2
					default:
						var regex = /^(\/.*)\s(.*)$/g;
						var command = regex.exec(messageStr);
						if (command) {
							switch (command[1]) {
								// Channel change
								case "/c":
								case "/channel":
									var channel = command[2] === undefined ? null : command[2].trim();
									if (channel) {
										chat.setChannel( channel.toString() );
									}
								break;

								// Name change
								case "/n":
								case "/name":
								case "/nick":
									var name = command[2] === undefined ? null : command[2].trim();
									if (name) {
										chat.setNick( name.toString() );
									}
								break;
							}
						} else {
							chat.mes('Unknown command or missing options.');
						}
					break;
				}
			}
			// Message was not a command. Send normal data
			if (!isCommand) {
				chat.socket.emit('message', { message: messageStr.toString() });
			}
		}
	}

	chat.setFocus();

	return this;
};

/*
* menuAddUser - build user menu
* @require user: id, name, channel
*/
chat.menuAddUser = function(id, name, channel) {
	// New user object
	var $user = $('<a/>', {
		//'href': 'javascript:void(0)',
		'class': 'user w3-dropdown-hover',
		'id': id
		//'title': name
	});

	var user = name.toString();
	
	user += '<span class="w3-dropdown-content w3-border">';

	if (chat.user.name === name) {
		user += '<a href="javascript:void(0)" onclick="chat.setWhisper()">New whisper</a> \
			<a href="javascript:void(0)" onclick="chat.setNick()">Change name</a> \
			<a href="javascript:void(0)" onclick="chat.setChannel()">Change channel</a>';
	} else {
		user += '<a href="javascript:void(0)" onclick="chat.setWhisper(\'' + name + '\')">Whisper</a>';
	}

	user += '</span>';
	
	$user.html(user);

	// Display new menu
	$user.appendTo(".users-list");
	
	return this;
};

/*
* Remove user from menu
* @require userId
*/
chat.menuRemoveUser = function(id) {
	// User menu array
	var $menuArray = $(".users-list").find("#" + id);

	// If array has any value, remove it
	if ($menuArray.length) {
		if (chat.debugMode) console.log('Menu remove user');
		$menuArray.remove();
	}

	return this;
};

/*
* Clear menu
* Remove all users from menu
*/
chat.menuClear = function() {
	$(".users-list").empty();

	return this;
};

/*
* Update user list & menu
* @require user: id, name, channel
*/
chat.menuUpdateUser = function(id, name, channel) {
	if (chat.debugMode) console.log('Menu update user');
	// Remove old
	chat.menuRemoveUser(id);

	// Build new user menu
	chat.menuAddUser(id, name, channel);

	return this;
};

/*
* Update users list & menu
* @require user object { id, name, channel }
*/
chat.updateUsers = function(data) {
	if (chat.debugMode) console.log('Menu update users');
	// Start from fresh(remove old)
	chat.menuClear();

	// Add all users in array
	$.each(data.users, function() {
		var id = this.id,
			name = this.name,
			channel = this.channel,
			active = 0;

		// Build new user menu
		chat.menuAddUser(id, name, channel);

	});

	return this;
};

/*
* UI open server connection
* @optional: callback
*/
chat.connect = function(callback) {
	nconfirm({
		title: "Welcome to Chat",
		message: "Do you wish to <b>connect</b> to the server?",
		background: true,
		onSubmit: function() {
			// Initialize
			chat.init();
			// callback fucntion
			if (callback && typeof(callback) === "function") {
				callback();
			}
		}
	});
	return this;
};

/*
* UI open set nickname window
* @require: nameStr -optional
*/
chat.setNick= function(nameStr) {
	if (nameStr === undefined) {
		nprompt({
			title: "Set Name",
			message: "Please enter your <b>name</b> at the field below.",
			input: [{
				"type": "text",
				"name": "name",
				"placeholder": "Your name",
				"value": (localStorage.name ? localStorage.name : chat.user.name)
			}],
			background: false,
			onSubmit: function(data) {
				if (data.name !== null) {
					chat.user.name = data.name;
					localStorage.name = data.name;
					chat.socket.emit('set-nick', { name: data.name });
					chat.setFocus();
				}
			}
		});
	}
	else {
		if (nameStr.length < 2) {
			nalert({
				message: "Name is too short! 2 min.",
				background: true
			});
		} else if (nameStr.length > 25) {
			nalert({
				message: "Name is too long! 25 max.",
				background: true
			});
		} else {
			chat.user.name = nameStr;
			localStorage.name = nameStr;
			chat.socket.emit('set-nick', { name: nameStr });
			chat.setFocus();
		}
	}

	return this;
};

/*
* UI open change channel window
* @require: channelName -optional
*/
chat.setChannel = function(channelName) {
	if (channelName === undefined) {
		nprompt({
			title: "Set Channel",
			message: "Please enter <b>channel</b> name at the field below.",
			input: [{
				"type": "text",
				"name": "channel",
				"placeholder": "Channel name",
				"value": "general"
			}],
			background: false,
			onSubmit: function(data) {
				if (data.channel !== null) {
					chat.socket.emit('set-channel', { channel: data.channel.toLowerCase() });
				}
			}
		});
	}
	else {
		if (channelName.length < 2) {
			nalert({
				message: "Channel name is too short! 2 min.",
				background: true
			});
		} else if (channelName.length > 50) {
			nalert({
				message: "Channel name is too long! 50 max.",
				background: true
			});
		} else {
			// Send.
			chat.socket.emit('set-channel', { channel: channelName.toLowerCase() });
		}
	}

	return this;
};

/*
* UI open whisper window
* @require: nickname, messageStr
*/
chat.setWhisper = function(nickname, messageStr) {
	if (nickname === undefined || nickname === chat.user.name) {
		nprompt({
			title: "Send whisper",
			message: "Please enter a whisper <b>name</b>.",
			input: [{
				"type": "text",
				"name": "whisper",
				"placeholder": "User name",
				"value": (chat.user.whisper ? chat.user.whisper: "")
			},{
				"type": "text",
				"name": "message",
				"placeholder": "Message",
				"value": ""
			}],
			onSubmit: function(data) {
				// Don't send to your self
				if (data.whisper !== chat.user.name) {
					chat.sendWhisper(data.whisper, data.message);
				}
			}
		});
	}
	// Dont send to your self
	else if (nickname.length && nickname !== chat.user.name) {
		if (nickname.length && messageStr === undefined) {
			$("#sendform").find("#whisper").val(nickname);
			chat.setFocus();
		}
		else if (messageStr === '') {
			nprompt({
				title: "Send whisper",
				message: "Please enter your <b>message</b> at the field below.",
				input: [{
					"type": "text",
					"name": "message",
					"placeholder": "Message",
					"value": ""
				}],
				onSubmit: function(data) {
					chat.sendWhisper(nickname, data.message);
				}
			});
		}
		else if (nickname.length && messageStr.length) {
			chat.sendWhisper(nickname, messageStr);
		}
	}

	return this;
};

/*
* Submit whisper data
* @require: nickname, messageStr
*/
chat.sendWhisper = function(nickname, messageStr) {
	if (nickname.length && messageStr.length) {
		if (messageStr.length > chat.messageMaxLength) {
			nalert({
				message: "Message is too long! "+ chat.messageMaxLength +" chars max.",
				background: true
			});
		}
		else {
			chat.socket.emit('whisper', {
				to: nickname,
				from: chat.user.name,
				message: messageStr
			});
			$("#sendform").find("#whisper").val(nickname);
			chat.setFocus();
		}
	}

	return this;
};

/*
* Check if post is command
* @https://regex101.com/
*/
chat.isCommand = function(str, reg) {
	// starts: /any-letter any-letter any-letter
	//var regex = /^(\/.*)\s(.*)\s(.*)$/g;
	var regex = reg || /^(\/.*)$/;

	return regex.exec(str);
};

/*
* Append message to the chat window
* @require: message, whisper(true/false)
*/
chat.mes = function(message, whisper) {
	var elem = document.querySelector("#messages");
	var newLi = document.createElement("LI");
	
	if (whisper !== undefined || whisper === true) {
		newLi.innerHTML = "<span class=\"whisper\">" + message + "</span>";
	} else {
		newLi.innerHTML = "<span class=\"message\">" + message + "</span>";
	}
	
	elem.appendChild(newLi);
	
	//makeLink(elem);
	$("#messages").linkify();
	
	chat.scrollDown();

	return this;
};

/*
* Focus on chat input
* @require: element id
*/
chat.setFocus = function(id) {
	document.querySelector(id || "#message").focus();

	return this;
};

/*
* Scroll down the chat window
* @require: element id, speed
*/
chat.scrollDown = function(id, speed) {
	var elem = document.querySelector(id || "#content");

	if (speed === undefined) {
		elem.scrollTop = elem.scrollHeight;
	} else {
		elem.animate({
			scrollTop: elem.scrollHeight
		}, speed);
	}

	return this;
};

/*
* Play sound
* @require: none
*/
chat.playAudio = function() {
	var audio = document.getElementsByTagName("audio")[0];
	if (audio !== undefined && chat.soundOn) {
		audio.play();
	}

	return this;
};

/*
* Sound settings
* @require: none
*/
chat.playSettings = function(active) {
	if (active === undefined) {
		chat.soundOn = chat.soundOn ? false : true;
	} else {
		chat.soundOn = active;
	}
	chat.mes("Sound is set: " + (chat.soundOn ? 'on' : 'off'));
	chat.playAudio();

	return this;
};

/*
* Sound volume
* @require: level
*/
chat.playVolume = function(level) {
	document.querySelector("#audio").volume = level;

	return this;
};

/*
* Helper function: return in two digits string
* @require: string
*/
chat.twoDigits = function(string) {
	return ("0" + string).slice(-2);
};

/*
* Quit/Close socket
* @require: none
*/
chat.quit = function() {
	if (socket != null) {
		if (chat.debugMode) console.log("Socket close");
		chat.socket.close();
		socket=null;
	}

	return this;
}

/*
* Reconnect socket
* @require: none
*/
chat.reconnect = function() {
	chat.quit();
	setTimeout(function(){
		if (chat.debugMode) console.log("Socket init");
		chat.init();
	},2000);

	return this;
}
