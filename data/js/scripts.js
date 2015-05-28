/*
* scripts.js - default javascripts
*
* Define chat object:
*/
var chat = {
	user: {},
	method: 'http', // https, http, ws
	address: 'localhost',
	port: 9000,
	channel: '',
	debug_mode: false
};

/*
* Debug function: chat.debug()
* Enable / disable by changing chat.debug = true/false
* @require String
*/
chat.debug = function(str) {
	return !chat.debug_mode || console.log(str);
};

/*
* WebSocket init
* @require: url - optional
*
* @urlSource: @http://socket.io/docs/client-api/
*/
chat.init = function(url) {
	var self = this;
	var link = url || chat.method +'://'+ chat.address +':'+ chat.port + chat.channel;

	// Open socket
	self.socket = io.connect(link);

	// Error
	self.socket.on('error', function (data) {
		chat.debug(data);
	});

	// Error
	self.socket.on('connect_error', function (data) {
		chat.debug(data);
		if (data.type === "TransportError") {
			self.mes("Unable to connect server.");
			self.socket.close();
		}
	});

	// Time out
	self.socket.on('connect_timeout', function (data) {
		chat.debug(data);
		self.mes("Connection timeout.");
	});

	// Disconnect
	self.socket.on('disconnect', function (data) {
		chat.debug(data);
		self.mes("Disconnected from server.");
		// Ask to reconnect
		$.fn.nConfirm({
			title: "Disconnected!",
			message: "Do you wan't to <b>reconnect</b> to the server?",
			enableBackground: false,
			onSubmit: function(str) {
				self.socket.connect();
			}
		});
	});

	// Welcome
	self.socket.on('welcome', function (data) {
		chat.debug('Welcome:');
		chat.debug(data);
		//self.mes(data.message);
		$("#header").find("#welcome").html(data.message);
	});

	// Notice
	self.socket.on('notice', function (data) {
		chat.debug('Notice:');
		chat.debug(data);
		self.mes(data.message);
	});

	// Update user data
	self.socket.on('update-user', function (data) {
		chat.debug('Update-user:');
		chat.debug(data);
		self.user = data;
	});


	// New updater: add user
	self.socket.on('channel-user-add', function (data) {
		chat.debug('Channel-user-add:');
		chat.debug(data);
		self.menuAddUser(data.id, data.name, data.channel);
	});

	// New updater: add user
	self.socket.on('channel-user-list', function (data) { //FIXME
		chat.debug('Channel-user-list:');
		chat.debug(data);
		//self.menuAddUser(data.id, data.name, data.channel);
		self.updateUsers(data);
	});

	//New updater: remove user
	self.socket.on('channel-user-remove', function (data) {
		chat.debug('Channel-user-remove:');
		chat.debug(data);
		self.menuRemoveUser(data.id); //userid
	});

	// New updater: user update
	self.socket.on('channel-user-update', function (data) {
		chat.debug('Channel-user-update:');
		chat.debug(data);
		self.menuUpdateUser(data.id, data.name, data.channel);
	});


	// Whisper
	self.socket.on('whisper', function (data) {
		chat.debug('Whisper:');
		chat.debug(data);
		var d = new Date(data.date),
			hours = d.getHours(),
			minutes = d.getMinutes(),
			seconds = d.getSeconds();

		var msg = "["+ self.twoDigits(hours) + ":" + self.twoDigits(minutes) + ":" + self.twoDigits(seconds) +"] ";
		if (data.from === data.to || data.from === self.user.name) {
			msg += "Whisper to <a href=\"javascript:void(0)\" class=\"nickname\" onclick=\"chat.setWhisper('"+ data.to +"')\">&lt;"+ data.to +"&gt;</a> ";
		} else {
			msg += "<a href=\"javascript:void(0)\" class=\"nickname\" onclick=\"chat.setWhisper('"+ data.from +"')\">&lt;"+ data.from +"&gt;</a> Whispers: ";
		}
		msg += data.message;
		self.mes(msg,true);
		// Play audio
		if (data.to !== self.user.name) {
			self.playAudio();
		}
		// Scroll down the chat and set focus to input.
		self.setFocus();
	});

	// message / chat
	self.socket.on('message', function(data) {
		chat.debug('Chat:');
		chat.debug(data);
		var d = new Date(data.date),
			hours = d.getHours(),
			minutes = d.getMinutes(),
			seconds = d.getSeconds();

		var msg = "["+ self.twoDigits(hours) + ":" + self.twoDigits(minutes) + ":" + self.twoDigits(seconds) +"] ";
			msg += "<a href=\"javascript:void(0)\" class=\"nickname\" onclick=\"chat.setWhisper('"+ data.name +"')\">&lt;"+ data.name +"&gt;</a> ";
			msg += data.message;
		self.mes(msg);
		// Play audio
		if (data.name !== self.user.name) {
			self.playAudio();
		}
	});

	return this;
};

/*
* Socket submit data
* @require: elementId
*/
chat.setSubmit = function(elementId) {
	var self = this;

	if (elementId.val().length) {
		if (elementId.val().trim().length > 1000) {
			$.fn.nNotice({
				message: "Message is too long! 1000 letters max.",
				enableBackground: true
			});
		}
		else {
			self.socket.emit('message', { message: elementId.val() });
			elementId.val(null);
		}
	}

	self.setFocus();

	return this;
};

/*
* menuAddUser - build user menu
* @require user: id, name, channel
*/
chat.menuAddUser = function(id, name, channel) {
	var self = this,
		active = 0;

	// New menu object
	var $menu = $('<ul/>');

	// New user object
	var $user = $('<li/>', {
		class: 'user',
		id: id,
		title: name
	})
	.html('&rsaquo; '+ name);

	$user.click(function() {
		active++;
		if (active === 1) {
			if (self.user.name === name) { //localStorage.name === name
				var $menuSub = $('<ul/>');

				// Whisper
				$('<li/>', {
					class: 'menu'
				})
				.html('&lsaquo; New whisper')
				.click(function() {
					chat.setWhisper();
				})
				.appendTo($menuSub);

				// Change name
				$('<li/>', {
					class: 'menu'
				})
				.html('&lsaquo; Change name')
				.click(function() {
					self.setName();
				})
				.appendTo($menuSub);

				// Change channel
				$('<li/>', {
					class: 'menu'
				})
				.html('&lsaquo; Change channel')
				.click(function() {
					self.setChannel();
				})
				.appendTo($menuSub);

				// Append to user
				$($menuSub).appendTo($user);
			}
			else {
				var $menuSub = $('<ul/>');
				// Whisper menu
				$('<li/>', {
					class: 'menu'
				})
				.html('&lsaquo; Whisper')
				.click(function() {
					self.setWhisper( name );
				})
				.appendTo($menuSub);
				// Append to user
				$($menuSub).appendTo($user);
			}
		}
	}).mouseleave(function() {
		$(this).find('ul').remove();
		active = 0;
	});

	// Append user to menu
	$user.appendTo($menu);

	// Display new menu
	$menu.appendTo("#users");

	chat.debug('menuAddUser: '+ name);

	// Append to parent div
	return this;
};

/*
* Remove user from menu
* @require userId
*/
chat.menuRemoveUser = function(userId) {
	//var self = this;

	// User menu array
	var $menuArray = $("#users").find("ul").find("#" + userId);

	// If array has any value, remove it
	if ($menuArray.length) {
		// Found in array: Remove user element:
		$menuArray.parent().remove();
		chat.debug('User menu remove');
	}

	return this;
};

/*
* Update user list & menu
* @require user: id, name, channel
*/
// chat.updateUserMenu('CuYkSRtA7LtB4kzZAAAF','tester','bla bla bla');
chat.menuUpdateUser = function(id, name, channel) {
	chat.debug('Menu update user');
	var self = this;

	// Remove old
	self.menuRemoveUser(id);

	// Build new user menu
	self.menuAddUser(id, name, channel);

	return this;
};

/*
* Update users list & menu
* @require user object { id, name, channel }
*/
chat.updateUsers = function(data) {
	var self = this;

	// Start from fresh element. Remove old menu:
	$("#users").find("ul").remove();

	// Add all users in array
	$.each(data.users, function() {
		var id = this.id,
			name = this.name,
			channel = this.channel,
			active = 0;

		// Build new user menu
		self.menuAddUser(id, name, channel);

	});

	return this;
};

/*
* UI open server connection
* @optional: callback
*/
chat.connect = function(callback) {
	var self = this;

	$.fn.nConfirm({
		title: "Welcome to Chat",
		message: "Do you wish to <b>connect</b> to the server?",
		enableBackground: true,
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
* @require: none
*/
chat.setName = function() {
	var self = this;

	$.fn.nPrompt({
		title: "Set Name",
		message: "Please enter your <b>name</b> at the field below.",
		value: (localStorage.name ? localStorage.name : chat.user.name),
		enableBackground: false,
		onSubmit: function(str) {
			if (str !== null) {
				chat.user.name = str;
				localStorage.name = str;
				self.socket.emit('setName', { name: str });
				self.setFocus();
			}
		}
	});

	return this;
};

/*
* UI open change channel window
* @require: none
*/
chat.setChannel = function(c) {
	var self = this;

	if (c === undefined) {
		$.fn.nPrompt({
			title: "Set Channel",
			message: "Please enter <b>channel</b> name at the field below.",
			value: "General",
			enableBackground: false,
			onSubmit: function(str) {
				if (str !== null) {
					self.socket.emit('setChannel', { channel: str.toLowerCase() });
				}
			}
		});
	}
	else {
		self.socket.emit('setChannel', { channel: c.toLowerCase() });
	}

	return this;
};

/*
* UI open whisper window
* @require: nickname, messageStr
*/
chat.setWhisper = function(nickname, messageStr) {
	var self = this;

	if (nickname === undefined || nickname === chat.user.name) {
		$.fn.nPrompt({
			title: "Send whisper",
			message: "Please enter a whisper <b>name</b>.",
			value: chat.user.whisper ? chat.user.whisper: '',
			onSubmit: function(str) {
				// Don't send to your self
				if (str !== chat.user.name) {
					$.fn.nPrompt({
						title: "Send whisper",
						message: "Please enter your <b>message</b> at the field below.",
						onSubmit: function(message) {
							self.sendWhisper(str, message);
						}
					});
				}
			}
		});
	}
	// Dont send to your self
	else if (nickname.length && nickname !== chat.user.name) {
		if (nickname.length && messageStr === undefined) {
			$("#sendform").find("#whisper").val(nickname);
			self.setFocus();
		}
		else if (messageStr === '') {
			$.fn.nPrompt({
				title: "Send whisper",
				message: "Please enter your <b>message</b> at the field below.",
				onSubmit: function(message) {
					self.sendWhisper(nickname, message);
				}
			});
		}
		else if (nickname.length && messageStr.length) {
			self.sendWhisper(nickname, messageStr);
		}
	}

	return this;
};

/*
* Submit whisper data
* @require: nickname, messageStr
*/
chat.sendWhisper = function(nickname, messageStr) {
	var self = this;

	if (nickname.length && messageStr.length) {
		if (messageStr.length > 1000) {
			$.fn.nNotice({
				message: "Message is too long! 1000 letters max.",
				enableBackground: true
			});
		}
		else {
			self.socket.emit('whisper', {
				to: nickname,
				from: chat.user.name,
				message: messageStr
			});
			$("#sendform").find("#whisper").val(nickname);
			self.setFocus();
		}
	}

	return this;
};

/*
* Check if post is command
* @https://regex101.com/
*/
chat.isCommand = function(str) {
	// starts: /any-letter any-letter any-letter
	var regex = /^(\/.*)\s(.*)\s(.*)$/g;

	return regex.exec(str);
};

/*
* Append message to the chat window
* @require: message, whisper(true/false)
*/
chat.mes = function(message, whisper) {
	var self = this;

	if(whisper !== undefined || whisper === true) {
		var msg = "<li><span class=\"whisper\">" + message + "</span></li>";
	} else {
		var msg = "<li><span class=\"message\">" + message + "</span></li>";
	}
	$("#messages").append(msg).linkify();
	self.scrollDown();

	return this;
};

/*
* Focus on chat input
* @require: elementId
*/
chat.setFocus = function(elementId) {
	if (elementId === undefined) {
		$("#message").focus();
	} else {
		$(elementId).focus();
	}

	return this;
};

/*
* Scroll down the chat window
* @require: elementId, animationSpeed
*/
chat.scrollDown = function(elementId, animationSpeed) {
	if (elementId === undefined) {
		var element = $("#content");
	} else {
		var element = $(elementId);
	}
	//var element = document.getElementById(elementId);
	//element.scrollTop = element.scrollHeight;
	var scrollHeight = element[0].scrollHeight;
	if (animationSpeed === undefined) {
		element.scrollTop( scrollHeight );
	} else {
		element.animate({
			scrollTop: scrollHeight
		}, animationSpeed);
	}

	return this;
};

/*
* Play sound
* @require: none
*/
chat.soundOn = false;
chat.playAudio = function() {
	var self = this;

	var audio = document.getElementsByTagName("audio")[0];
	if (audio !== undefined && self.soundOn) {
		audio.play();
	}

	return this;
};

/*
* Sound settings
* @require: none
*/
chat.playSettings = function(active) {
	var self = this;

	if (active === undefined) {
		self.soundOn = self.soundOn ? false : true;
	} else {
		self.soundOn = active;
	}
	self.mes("Sound is set: " + (self.soundOn ? 'on' : 'off'));
	self.playAudio();

	return this;
};

/*
* Sound volume
* @require: level
*/
chat.playVolume = function(level) {
	$("audio").volume = level;

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
	var self = this;

	if (socket != null) {
		chat.debug("Socket close");
		self.socket.close();
		socket=null;
	}

	return this;
}

/*
* Reconnect socket
* @require: none
*/
chat.reconnect = function() {
	var self = this;

	self.quit();
	setTimeout(function(){
		chat.debug("Socket init");
		self.init();
	},2000);

	return this;
}

/*
* Make main menu
* @require: none
*/
chat.drawMenu = function() {
	// Create main menu
	var menuHolder = $('<div/>', {
		id: 'myMenu'
	}).css({
		position: 'fixed',
		top: '0.5%',
		left: '0.5%',
		width: '35px',
		height: '35px',
		background: '#ccc',
		opacity: '0.50',
		zIndex: '+1'
	});

	// Create canvas
	var mainMenu = $('<canvas/>', {
		width: '35px',
		height: '35px'
	}).appendTo(menuHolder);
	
		// Draw canvas
	mainMenu.each(function() {
		var self = this,
			x = self.width,
			y = self.height,
			ctx = self.getContext("2d");

		//Lets go...
		ctx.fillStyle = "#FF0000";
		ctx.lineCap = "round";
		//Background
		var my_gradient = ctx.createLinearGradient(0, 0, 0, y);
		my_gradient.addColorStop(0, "gray");
		my_gradient.addColorStop(1, "white");
		ctx.fillStyle = my_gradient;
		ctx.fillRect(0, 0, x, y);
		//Border
		ctx.lineWidth = 4 * y / 100;
		ctx.strokeRect(2 * y / 100, 2 * y / 100, x - 4 * y / 100, y - 4 * y / 100);
		//Lines
		ctx.lineWidth = 8 * y / 100;
		ctx.moveTo(10 * x / 100, 25 * y / 100);
		ctx.lineTo(90 * x / 100, 25 * y / 100);
		ctx.moveTo(10 * x / 100, 50 * y / 100);
		ctx.lineTo(90 * x / 100, 50 * y / 100);
		ctx.moveTo(10 * x / 100, 75 * y / 100);
		ctx.lineTo(90 * x / 100, 75 * y / 100);
		ctx.scale(0.8, 1.0);
		ctx.stroke();
	});

	menuHolder.mouseenter(function() {
		$(this).css({
			opacity: '1.0'
		});
	}).mouseleave(function() {
		$(this).css({
			opacity: '0.50'
		});
	});

	menuHolder.dropdown("click", {
		timeout: 1500,
		menu: [
			{ name:'Nickname', link:'chat.setName()' },
			{ name:'Channel', link:'chat.setChannel()' },
			{ name:'Sound on/off', link:'chat.playSettings()' }
		]
	});

	// Display
	menuHolder.appendTo('body');

	return this;
};