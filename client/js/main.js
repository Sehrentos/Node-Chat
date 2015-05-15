/*
* Main javascript.
* Define socket and chat object.
*/
var socket;
var user = {};
var chat = {};

/*
* WebSocket init
* @http://socket.io/docs/client-api/
*/
chat.init = function() {

	// Open WebSocket.
	socket = io.connect('ws://localhost:9000');

	socket.on('connect_error', function (data) {
		//console.log(data);
		if (data.type === "TransportError") {
			chat.mes("Unable to connect server.").scrollDown();
			socket.close();
		}
	});

	socket.on('disconnect', function (data) {
		console.log(data);
		chat.mes("Disconnected from server.").scrollDown();
		// Ask user to reconnect
		$.fn.nConfirm({
			title: "Disconnected!",
			message: "Do you wan't to <b>reconnect</b> to the server?",
			enableBackground: false,
			onSubmit: function(str) {
				socket.connect();
			}
		});
	});

	socket.on('connect_timeout', function (data) {
		console.log(data);
		chat.mes("Connection timeout.").scrollDown();
	});

	// Update user data
	socket.on('update', function (data) {
		console.log(data);
		user = data;
	});

	socket.on('welcome', function (data) {
		console.log(data);
		chat.mes(data.message).scrollDown();
	});

	socket.on('notice', function (data) {
		console.log(data);
		chat.mes(data.message).scrollDown();
	});

	socket.on('wisper', function (data) {
		console.log(data);
		var d = new Date(data.date);
		    hours = d.getHours(),
			minutes = d.getMinutes(),
			seconds = d.getSeconds();

		var msg = "["+ ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2) +"] ";
		if (data.from === data.to || data.from === user.name) {
			msg += "Whisper to <a href=\"javascript:void(0)\" id=\"nick\" onclick=\"chat.setWhisper('"+ data.to +"')\">&lt;"+ data.to +"&gt;</a> ";
		} else {
			msg += "<a href=\"javascript:void(0)\" id=\"nick\" onclick=\"chat.setWhisper('"+ data.from +"')\">&lt;"+ data.from +"&gt;</a> Whispers: ";
		}
		msg += data.message;
		chat.mes(msg,true);
		// Play audio
		if (data.to !== user.name) {
			chat.playAudio();
		}
		// Scroll down the chat and set focus to input.
		chat.scrollDown().setFocus();
	});

	socket.on('chat', function(data) {
		console.log(data);
		var d = new Date(data.date);
		    hours = d.getHours(),
			minutes = d.getMinutes(),
			seconds = d.getSeconds();

		var msg = "["+ ("0" + hours).slice(-2) + ":" + ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2) +"] ";
			msg += "<a href=\"javascript:void(0)\" id=\"nick\" onclick=\"chat.setWhisper('"+ data.name +"')\">&lt;"+ data.name +"&gt;</a> ";
			msg += data.message;
		chat.mes(msg);
		// Play audio
		if (data.name !== user.name) {
			chat.playAudio();
		}
		// Scroll down the chat.
		chat.scrollDown();
	});

	socket.on('users', function(data) {
		console.log(data);
		// Update userlist menu
		if (data !== undefined) {
			$("#user_menu").empty();
			$.each(data, function( key, value ) {
				if (user.name === value.name || localStorage.name === value.name) {
					var active = 0;
					string = $('<li class="user"><a>'+ value.name +'</a></li>').click(function(e) {
						active++;
						if (active === 1) {
							menu = '<li class="menu" onclick="chat.setWhisper()">Whisper</li>';
							menu += '<li class="menu" onclick="chat.setName()">Change name</li>';
							menu += '<li class="menu" onclick="chat.setChannel()">Change channel</li>';
							$(this).append('<ul>'+ menu +'</ul>');
						}
					}).mouseleave(function() {
						$(this).find('ul').remove();
						active = 0;
					});
				} else {
					var active = 0;
					string = $('<li class="user"><a>'+ value.name +'</a></li>').click(function(e) {
						active++;
						if (active === 1) {
							menu = '<li class="menu" onclick="chat.setWhisper(\''+ value.name +'\')">Whisper</li>';
							$(this).append('<ul>'+ menu +'</ul>');
						}
					}).mouseleave(function() {
						$(this).find('ul').remove();
						active = 0;
					});
				}
				$("#user_menu").append(string);
			});
		}
	});

	return this;
};

/*
* WebSocket send
*/
chat.setSubmit = function( id ) {
	if (id.val().length) {
		if (id.val().trim().length > 1000) {
			$.fn.nNotice({
				message: "Message is too long! 1000 letters max.",
				enableBackground: true
			});
		}
		else {
			socket.emit('message', { message: id.val() });
			id.val('');
		}
	}
	chat.scrollDown().setFocus();
	return this;
};

/*
* Set user nick name
*/
chat.setName = function() {
	$.fn.nPrompt({
		title: "Set Name",
		message: "Please enter your <b>name</b> at the field below.",
		value: (localStorage.name ? localStorage.name : user.name),
		enableBackground: false,
		onSubmit: function(str) {
			if (str !== null) {
				user.name = str;
				localStorage.name = str;
				socket.emit('setName', { name: str });
				chat.setFocus();
			}
		}
	});
	return this;
};

/*
* Change channels.
*/
chat.setChannel = function(c) {
	if (c === undefined) {
		$.fn.nPrompt({
			title: "Set Channel",
			message: "Please enter <b>channel</b> name at the field below.",
			value: "General",
			enableBackground: false,
			onSubmit: function(str) {
				if (str !== null) {
					socket.emit('setChannel', { channel: str.toLowerCase() });
				}
			}
		});
	}
	else {
		socket.emit('setChannel', { channel: c.toLowerCase() });
	}
	return this;
};

/*
* Open Whisper to user.
*/
chat.setWhisper = function(target,msg) {
	if (target.length && msg.length) {
		if (msg.length > 1000) {
			$.fn.nNotice({
				message: "Message is too long! 1000 letters max.",
				enableBackground: true
			});
		} else {
			if (target === undefined || target === user.name) {
				$.fn.nPrompt({
					title: "Send whisper",
					message: "Please enter a target <b>name</b>.",
					value: user.whisper ? user.whisper: '',
					onSubmit: function(str) {
						// Don't send to your self
						if (str !== user.name) {
							$.fn.nPrompt({
								title: "Send whisper",
								message: "Please enter your <b>message</b> at the field below.",
								onSubmit: function(message) {
									chat.sendWhisper(str,message);
								}
							});
						}
					}
				});
			}
			// Dont send to your self
			else if (target.length && target !== user.name) {
				if (msg === undefined) {
					$.fn.nPrompt({
						title: "Send whisper",
						message: "Please enter your <b>message</b> at the field below.",
						onSubmit: function(message) {
							chat.sendWhisper(target,message);
						}
					});
				}
				else if (target.length && msg.length) {
					chat.sendWhisper(target,msg);
				}
			}
		}
	}
	return this;
};

/*
* Send whisper to target
*/
chat.sendWhisper = function(target,msg) {
	if (target.length && msg.length) {
		socket.emit('setWhisper', {
			to: target,
			from: user.name,
			message: msg
		});
	}
	return this;
};

/*
* Set height to the page.
* @css min-height 150px
*/
chat.setHeight = function(str) {
	if (str === undefined) {
		var docHeight = $(window).height();
	} else {
		var docHeight = str;
	}
	$("#messages").css("height",(docHeight-150)+'px');
	$("#users").css("height",(docHeight-150)+'px');
	return this;
};

/*
* Append to chat messages.
*/
chat.mes = function(string,whisper) {
	if(whisper !== undefined || whisper === true) {
		var msg = "<span class=\"whisper\">" + string + "</span>";
	} else {
		var msg = "<span>" + string + "</span>";
	}
	$("#messages").append(msg).linkify();
	return this;
};

/*
* Focus function.
* @setFocus( id );
*/
chat.setFocus = function(e) {
	if (e === undefined) {
		document.getElementById("input_message").focus();
	} else {
		document.getElementById(e).focus();
	}
	return this;
};

/*
* Scroll down the chat div.
*/
chat.scrollDown = function(id) {
	if (id === undefined) {
		var element = document.getElementById("messages");
	} else {
		var element = document.getElementById(id);
	}
	element.scrollTop = element.scrollHeight;
	return this;
};

/*
* Message sound
*/
chat.soundOn = false;
chat.playAudio = function() {
	var audio = document.getElementsByTagName("audio")[0];
	if (audio !== undefined && this.soundOn) {
		audio.play();
	}
	return this;
};

/*
* Sound volume
*/
chat.playVolume = function(volume) {
	var audio = document.getElementsByTagName("audio")[0];
	audio.volume = volume; //0.2

	return this;
};

/*
* Quit/Close WebSocket
*/
chat.quit = function() {
	if (socket != null) {
		console.log("Socket close.");
		socket.close();
		socket=null;
	}
	return this;
}

/*
* Reconnect WebSocket
*/
chat.reconnect = function() {
	chat.quit();
	setTimeout(function(){
		chat.init();
	},3000);
	return this;
}

/*
* Load chat and settings.
* @typeof chat === 'object'
*/
$(function(){

	// Height of the page.
	chat.setHeight().scrollDown();
	$( window ).resize(function() {
		chat.setHeight().scrollDown();
	});

	// Focus input/textarea.
	chat.setFocus();

	// Open WebSocket.
	if ("WebSocket" in window) {
		chat.init();
	} else {
		chat.error("WebSocket is not supported by your browser!");
	}

	// Define submit event.
	$("#sendform").submit(function(e) {
		e.preventDefault();
		var whisper = $(this).find("#input_whisper"),
		    message = $(this).find("#input_message");

		if (whisper.val().length) {
			chat.setWhisper( whisper.val(), message.val() );
			message.val('');
		} else {
			chat.setSubmit( message );
		}
	});

	// Define textarea keydown.
	$("#sendform textarea").keydown(function(e) {
		if (e.keyCode == 13 && !e.shiftKey) {
			e.preventDefault();
			var whisper = $(this).parent().find("#input_whisper"),
				message = $(this).parent().find("#input_message");

			if (whisper.val().length) {
				chat.setWhisper( whisper.val(), message.val() );
				message.val('');
			} else {
				chat.setSubmit( message );
			}
		}
	});

	// Define sound on/off button.
	$("#disablesound").click(function() {
		chat.soundOn = chat.soundOn ? false : true;
		$(this).html("Sound is "+(chat.soundOn ? "on" : "off"));
	});

	// Define quit button.
	$("#chat_quit").click(function() {
		chat.quit();
		chat.mes("Disconnected.");
	});

	// Define reconnect button.
	$("#chat_connect").click(function() {
		chat.mes("Reconnecting.");
		chat.reconnect();
	});

	// Define html links.
	$("#messages").find("span").linkify();

	// Nick/Name button
	$("#chat_nick").click(function(e) {
		e.preventDefault();
		chat.setName();
	});

	// Channel button
	$("#chat_channel").click(function(e) {
		e.preventDefault();
		chat.setChannel();
	});

	// Volume slider. 0.1 - 1.0
	$("#volume-slider").change(function(){
		chat.playVolume( this.value / 100);
		this.title = "Volume: "+ this.value +"%";
		chat.playAudio();
	});
	chat.playVolume( $("#volume-slider").val() / 100 );

});