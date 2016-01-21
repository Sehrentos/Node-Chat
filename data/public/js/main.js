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
	messageMaxLength: 3000,
	connectionCount: 0,
	connectionCountMax: 5
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
		if (chat.debugMode && data) console.log('io.connect', data);
		chat.mes("Connected.");
		chat.setNick();
	});

	// Error
	chat.socket.on('error', function (data) {
		if (chat.debugMode) console.log('io.error', data);
		chat.mes(data);
	});

	// Connect error
	chat.socket.on('connect_error', function (data) {
		if (chat.debugMode) console.log('io.connect_error', data);
		if (data.type === "TransportError") {
			chat.mes("(" + chat.connectionCount + ") Unable to connect server.");
			// Clear user menu
			chat.menuClear();
			
			if (chat.connectionCount >= chat.connectionCountMax) {
				chat.quit();
			}
			chat.connectionCount++;
		}
	});

	// Timeout
	chat.socket.on('connect_timeout', function (data) {
		if (chat.debugMode) console.log('io.connect_timeout', data);
		chat.mes("(" + chat.connectionCount + ") Connection timeout.");
		// Clear user menu
		chat.menuClear();
		
		if (chat.connectionCount >= chat.connectionCountMax) {
			chat.quit();
		}
		chat.connectionCount++;
	});

	// Disconnect
	chat.socket.on('disconnect', function (data) {
		if (chat.debugMode) console.log('io.disconnect', data); // transport close = server closed connection.
		chat.mes("Disconnected.");
		// Clear user menu
		chat.menuClear();

		if (chat.connectionCount >= chat.connectionCountMax) {
			chat.quit();
		}
		chat.connectionCount++;
	});

	// Welcome
	chat.socket.on('set-topic', function (data) {
		if (chat.debugMode) console.log('io.set-topic', data);
		chat.mes("Set topic: " + data.message);
		document.querySelector("#topic").textContent = data.message;
		//document.querySelector("#topic").text(data.message);
	});

	// Notice
	chat.socket.on('notice', function (data) {
		if (chat.debugMode) console.log('io.notice', data);
		chat.mes(data.message);
	});

	// Update user data
	chat.socket.on('update-user', function (data) {
		if (chat.debugMode) console.log('io.update-user', data);
		chat.user = data;
	});

	// New updater: add user
	chat.socket.on('channel-user-add', function (data) {
		if (chat.debugMode) console.log('io.channel-user-add', data);
		chat.mes(data.name + " - " + data.message);
		chat.menuAddUser(data.id, data.name, data.channel);
	});

	// New updater: add user
	chat.socket.on('channel-user-list', function (data) {
		if (chat.debugMode) console.log('io.channel-user-list', data);
		chat.updateUsers(data);
	});

	//New updater: remove user
	chat.socket.on('channel-user-remove', function (data) {
		if (chat.debugMode) console.log('io.channel-user-remove', data);
		chat.mes(data.name + " - " + data.message);
		chat.menuRemoveUser(data.id); //userid
	});

	// New updater: user update
	chat.socket.on('channel-user-update', function (data) {
		if (chat.debugMode) console.log('io.channel-user-update', data);
		chat.mes(data.name + " - " + data.message);
		chat.menuUpdateUser(data.id, data.name, data.channel);
	});

	// Whisper
	chat.socket.on('whisper', function (data) {
		if (chat.debugMode) console.log('io.whisper', data);

		chat.addMessage(data);
		
		chat.scrollDown();
		
		// Play audio
		if (data.to !== chat.user.name) {
			chat.playAudio();
		}
	});

	// message / chat
	chat.socket.on('message', function(data) {
		if (chat.debugMode) console.log('io.message', data);

		chat.addMessage(data);
		
		chat.scrollDown();
		
		// Play audio
		if (data.name !== chat.user.name) {
			chat.playAudio();
		}
	});

	// Get all messages from channel
	chat.socket.on('get-messages', function (data) {
		if (chat.debugMode) console.log('io.get-messages', data);

		chat.mes("Start of messages:");

		each(data.messages, function(data) {
			chat.addMessage(data);
		});
		
		chat.mes("End of messages.");
	});

	return this;
};

/*
 * addMessage(data)
 * build & append a new message
 */
chat.addMessage = function(data) {
	var d = new Date(data.date),
		hours = d.getHours(),
		minutes = d.getMinutes(),
		seconds = d.getSeconds(),
		name = data.name || "",
		_to = data.to || "",
		_from = data.from || "",
		message = data.message || ""; //decodeURIComponent(data.message);
	
	var target = document.querySelector("#messages");
	var items = document.createElement("LI");
	if (_to.length > 0 && _from.length > 0) {
		items.className = "w3-pink";
	}
	
	// Date
	var item = document.createElement("SPAN");
	item.className = "date";
	item.textContent = "["+ chat.twoDigits(hours) + ":" + chat.twoDigits(minutes) + ":" + chat.twoDigits(seconds) +"]";
	if (_to.length > 0 && _from.length > 0) {
		if (_from === _to || _from === chat.user.name) {
			item.textContent += " Whisper to";
		}
	}
	items.appendChild(item);
	
	// Nickname
	var item = document.createElement("A");
	item.className = "nickname";
	item.href = "javascript:void(0)";
	if (_to.length > 0 && _from.length > 0) {
		if (_from === _to || _from === chat.user.name) {
			item.setAttribute("onclick", "chat.setWhisper('" + _to + "')");
			item.textContent = "<"+ _to +">";
		} else {
			item.setAttribute("onclick", "chat.setWhisper('" + _from + "')");
			item.textContent = "<"+ _from +">";
		}
	} else {
		item.setAttribute("onclick", "chat.setWhisper('" + name + "')");
		item.textContent = "<"+ name +">";
	}
	items.appendChild(item);

	// Message / JS code colors
	var code = false;
	if (message.search("#code") !== -1) {
		var msg = message.replace("#code\n", "").replace("#code ", "").replace("#code", "");
		var item = document.createElement("DIV");
		item.className = "message w3-white w3-code w3-small jsHigh notranslate";
		item.textContent = msg;
		items.appendChild(item);
		code = true;
	} else {
		var item = document.createElement("SPAN");
		item.className = "message";
		if (_to.length > 0 && _from.length > 0) {
			if (_from === _to || _from === chat.user.name) {
				item.textContent = message;
			}
			else {
				item.textContent = "whispers: " + message;
			}
		} else {
			item.textContent = message;
		}
		items.appendChild(item);
	}
	
	// Append
	target.appendChild(items);

	// JS code colors
	if (code) {
		jscodecolors();
	}
	
	return this;
};

/*
* Socket submit data
* @require: elementId
*/
chat.submitMessage = function(message) {
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
						chat.mes("Commands:\n /h, /help, /commands - Display help.\n /log, /messages - Display logged channel messages.\n /c, /channel &lt;name&gt; - Change channel.\n /n, /name, /nick &lt;name&gt; - Change name.\n #code &lt;Your code&gt; - Send code samples.");
					break;

					// Log/Get messages
					case "/log":
					case "/messages":
							chat.socket.emit('get-messages', { message: true });
					break;

					// Command depth: 2
					default:
						//var regex = /^(\/.*)\s(.*)$/g;
						var regex = /^(\/.*)\s(.*)/im;
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
	if (chat.debugMode) console.log('fn.menuAddUser', arguments);
	
	// New user object
	var elem = document.createElement("A");
	elem.className = 'user w3-dropdown-hover';
	//elem.id = id;
	elem.setAttribute("data-id", id);
	
	var user = '<span>' + name + '</span>';
		user += '<span class="w3-dropdown-content w3-border">';
		if (chat.user.name === name) {
			user += '<a href="javascript:void(0)" onclick="chat.setWhisper()">New whisper</a>';
			user += '<a href="javascript:void(0)" onclick="chat.setNick()">Change name</a>';
			user += '<a href="javascript:void(0)" onclick="chat.setChannel()">Change channel</a>';
		} else {
			user += '<a href="javascript:void(0)" onclick="chat.setWhisper(\'' + name + '\')">Whisper</a>';
		}
		user += '</span>';

	elem.innerHTML = user;
	//elem.html(user);
	
	// Display new menu
	document.querySelectorAll(".users-list").each(function(target) {
		target.appendChild(elem);
	})
	
	return this;
};

/*
* Remove user from menu
* @require userId
*/
chat.menuRemoveUser = function(id) {
	// User menu array
	if (chat.debugMode) console.log('fn.menuRemoveUser', arguments);
	var menuArray = document.querySelectorAll(".user");

	each(menuArray, function(target, key) {
		if (target.getAttribute("data-id") === id) {
			if (target) {
				target.remove();
			}
		}
	});

	return this;
};

/*
* Clear menu
* Remove all users from menu
*/
chat.menuClear = function() {
	if (chat.debugMode) console.log('fn.menuClear');
	document.querySelector(".users-list").innerHTML = '';

	return this;
};

/*
* Update user list & menu
* @require user: id, name, channel
*/
chat.menuUpdateUser = function(id, name, channel) {
	if (chat.debugMode) console.log('fn.menuUpdateUser', arguments);
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
	if (chat.debugMode) console.log('fn.updateUsers', data);
	// Start from fresh(remove old)
	chat.menuClear();

	// Add all users in array
	each(data.users, function(data) {
		var id = data.id,
			name = data.name,
			channel = data.channel,
			active = 0;

		// Add new user
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
		title: "Welcome to chat",
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
chat.setNick = function(nameStr) {
	if (nameStr === undefined) {
		nprompt({
			title: "Set name",
			message: "Please enter your <b>name</b> at the field below.",
			input: [{
				"type": "text",
				"name": "name",
				"placeholder": "Your name",
				"value": (localStorage.name ? localStorage.name : chat.user.name),
				"required": "true"
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
			title: "Set channel",
			message: "Please enter <b>channel</b> name at the field below.",
			input: [{
				"type": "text",
				"name": "channel",
				"placeholder": "Channel name",
				"value": "general",
				"required": "true"
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
				"value": (chat.user.whisper ? chat.user.whisper: ""),
				"required": "true"
			},{
				"type": "text",
				"name": "message",
				"placeholder": "Message",
				"value": "",
				"required": "true"
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
			document.querySelector("#chatwhisper").value = nickname;
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
					"value": "",
					"required": "true"
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
			document.querySelector("#chatwhisper").value = nickname;
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
* @require: message
*/
chat.mes = function(message) {
	var target = document.querySelector("#messages");
	var elem = document.createElement("LI");
	elem.innerHTML = "<span class=\"message\">" + message.linkify() + "</span>";
	target.appendChild(elem);
	
	chat.scrollDown();

	return this;
};

/*
* Focus on chat input
* @require: element id
*/
chat.setFocus = function(id) {
	document.querySelector(id || "#chatmessage").focus();

	return this;
};

/*
* Scroll down the chat window
*/
chat.scrollDown = function() {
	//var elem1 = document.querySelector("#content");
	var elem2 = document.querySelector("#messages");

	//elem1.scrollTop = elem1.scrollHeight;
	elem2.scrollTop = elem2.scrollHeight;

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
	if (chat.debugMode) console.log("fn.quit - Socket closed");
	chat.socket.close();
	//chat.socket = null;

	chat.mes("(" + chat.connectionCount + "/" + chat.connectionCountMax + ") Socket stop polling.");

	// Ask to reconnect
	nconfirm({
		title: "Exit socket",
		message: "Do you want to <b>reconnect</b> to the server?",
		background: false,
		onSubmit: function(str) {
			chat.reconnect();
		}
	});

	return this;
}

/*
* Reconnect socket
* @require: none
*/
chat.reconnect = function() {
	if (chat.debugMode) console.log("fn.reconnect - Socket reconnect");
	chat.connectionCount = 1;
	chat.mes("Reconnecting...");
	chat.socket.connect();

	return this;
}
