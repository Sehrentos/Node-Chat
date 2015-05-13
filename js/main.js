/*
* Main javascript.
* Define socket and chat object.
*/
var socket;
var chat = {};

/*
* WebSocket init
* @http://socket.io/docs/client-api/
*/
chat.init = function() {

	// Open WebSocket.
	//socket = new WebSocket("http://localhost:9000");
	socket = io.connect('ws://localhost:9000');

	socket.on('welcome', function (data) {
		console.log(data);
		chat.mes("Welcome <strong>" + data.name + "</strong> !");
	});

	socket.on('notice', function (data) {
		console.log(data);
		chat.mes(data.message);
	});

	socket.on('message', function(data) {
		console.log(data);
		var d = new Date(data.date);
		var msg = "["+ d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() +"] ";
			msg += "<a href=\"javascript:void(0)\" id=\"nick\" onclick=\"chat.setWhisper('"+ data.name +"')\">&lt;"+ data.name +"&gt;</a> ";
			msg += data.message;
		chat.mes(msg).linkify();
		// Play audio
		if (data.name !== localStorage.name) {
			chat.playAudio();
		}
		// Scroll down the chat and set focus to input.
		chat.scrollDown().setFocus();
	});

	socket.on('users', function(data) {
		console.log(data);
		// Update userlist menu
		if (data !== undefined) {
			var string = "";
			$.each(data, function( key, value ) {
				string += "<li><a>"+ value.name +"</a>";
				if (localStorage.name === value.name) {
					string += "<ul><li><a href=\"javascript:void(0)\" onclick=\"chat.setName()\">Change name</a></li>";
					string += "<li><a href=\"javascript:void(0)\" onclick=\"chat.setChannel()\">Change channel</a></li></ul>";
				} else {
					string += "<ul><li><a href=\"javascript:void(0)\" onclick=\"chat.setWhisper('"+ value.name +"')\">Whisper</a></li></ul>";
				}
				string += "</li>";
			});
			chat.buildmenu(string);
		}
	});
	return this;
};

/*
* WebSocket send
*/
chat.setSubmit = function( id ) {
	if (id === undefined) {
		id = '#sendform';
	}
	var inputMes = $( id ).find("#input_message");
	if (inputMes.val().trim().length === 0) {
		this.setFocus().notice("Message is empty.",5000);
	}
	else if (inputMes.val().trim().length > 1000) {
		this.notice("Message is too long! max. 1000",5000);
	}
	else {
		try {
			var message = {
				"command": "sendMessage",
				"message": inputMes.val()
			};
			var jsonMessage = JSON.stringify( message );
			inputMes.val('');
			//socket.send( jsonMessage );
			socket.emit('sendMessage', message);
			chat.scrollDown().setFocus();
		}
		catch(ex) {
			inputMes.val('');
			this.error("Message was unable to send!",5000);
		}
	}
	return this;
};

/*
* Set user nick name
*/
chat.setName = function() {
	$.fn.nprompt({
		text: "Hello, please write your <b>name</b> at the input below.",
		defaultText: (localStorage.name ? localStorage.name : ""),
		submit: function(str) {
			if (str !== null) {
				try {
					localStorage.name = str;
					var message = {
						"command": "setName",
						"name": str
					};
					var jsonMessage = JSON.stringify( message );
					//socket.send( jsonMessage );
					socket.emit('setName', message);
				}
				catch(err) {
					chat.error("Name was unable to send!",5000);
				}
			}
		}
	});
	return this;
};

/*
* Change channels.
*/
chat.setChannel = function(channel) {
	if (channel === undefined) {
		$.fn.nprompt({
			text: "Hello, please write <b>channel</b> name at the input below.",
			defaultText: "General",
			submit: function(channel) {
				if (channel !== null) {
					try {
						var message = {
							"channel": channel.toLowerCase(),
							"command": "setChannel"
						};
						var jsonMessage = JSON.stringify( message );
						//socket.send( jsonMessage );
						socket.emit('setChannel', message);
					} catch(err) {
						chat.error("Channel request was unable to send!",5000);
					}
				}
			}
		});
	}
	else {
		try {
			var message = {
				"channel": channel.toLowerCase(),
				"command": "setChannel"
			};
			var jsonMessage = JSON.stringify( message );
			//socket.send( jsonMessage );
			socket.emit('setChannel', message);
		} catch(err) {
			chat.error("Channel request was unable to send!",5000);
		}
	}
	return this;
};

/*
* Open Whisper to user.
*/
chat.setWhisper = function(target,msg) {
	if (target === undefined) {
		$.fn.nprompt({
			text: "Hello, please enter a target <b>name</b>.",
			submit: function(target) {
				// Dont send to your self
				if (target !== localStorage.name) {
					$.fn.nprompt({
						text: "Hello, please write your <b>message</b> at the input below.",
						submit: function(msg) {
							chat.sendWhisper(target,msg);
						}
					});
				}
			}
		});
	}
	// Dont send to your self
	else if (target.length && target !== localStorage.name) {
		if (msg === undefined) {
			$.fn.nprompt({
				text: "Hello, please write your <b>message</b> at the input below.",
				submit: function(msg) {
					chat.sendWhisper(target,msg);
				}
			});
		}
		else if (target.length && msg.length) {
			chat.sendWhisper(target,msg);
		}
	}
	return this;
};

/*
* Send whisper to target
*/
chat.sendWhisper = function(target,msg) {
	if (target.length && msg.length) {
		try {
			var message = {
				"name": target,
				"parent": localStorage.name,
				"message": msg,
				"command": "whisper"
			};
			var jsonMessage = JSON.stringify( message );
			//socket.send( jsonMessage );
			socket.emit('whisper', message);
		} catch(err) {
			chat.error("Whisper request was unable to send!",5000);
		}
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
	$("#messages").css("height",(docHeight-170)+'px');
	$("#users").css("height",(docHeight-170)+'px');
	return this;
};

/*
* Append to chat messages.
*/
chat.mes = function(string,whisper) {
	if(whisper !== undefined || whisper === true) {
		var msg = "<span id=\"whisper\">" + string + "</span>";
	} else {
		var msg = "<span>" + string + "</span>";
	}
	return $("#messages").append(msg);
};

/*
* Build users menu.
*/
chat.buildmenu = function(string) {
	return $("#user_menu").menu("destroy").html(string).menu();
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
* Notice function
*/
chat.notice = function(str,time) {
	if (str !== undefined) {
		$("#notice").html(str).parent().parent().parent().show();
	} else {
		$("#notice").html("Notice!").parent().parent().parent().show();
	}
	if (time !== undefined) {
		setTimeout(function(){
			$("#notice").empty().parent().parent().parent().hide();
		},time);
	}
	return this;
};

/*
* Error function
*/
chat.error = function(str,time) {
	if (str !== undefined) {
		$("#error").html(str).parent().parent().parent().show();
	} else {
		$("#error").html("Error has occurred!").parent().parent().parent().show();
	}
	if (time !== undefined) {
		setTimeout(function(){
			$("#error").empty().parent().parent().parent().hide();
		},time);
	}
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
$(function() {

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

	// Define submit.
	$( "#sendform" ).submit(function(e) {
		e.preventDefault();
		chat.setSubmit( "#sendform" );
	});

	// Define textarea keydown.
	$( "#sendform textarea" ).keydown(function(e) {
		if (e.keyCode == 13 && !e.shiftKey) {
			e.preventDefault();
			chat.setSubmit( "#sendform" );
		}
	});

	// Define sound on/off button.
	$( "#disablesound" ).click(function() {
		chat.soundOn = chat.soundOn ? false : true;
		$(this).find("span").html("Sound is "+(chat.soundOn ? "on" : "off"));
	}).button();

	// Define quit button.
	$( "#chat_quit" ).click(function() {
		chat.quit();
		chat.mes("Disconnected.");
	}).button();

	// Define reconnect button.
	$( "#chat_connect" ).click(function() {
		chat.mes("Reconnecting.");
		chat.reconnect();
	}).button();

	// Define tooltips.
	//$( document ).tooltip();

	// Define buttons.
	$( ".button" ).button();

	// Define menu.
	//$( "#users" ).draggable();
	$( "#user_menu" ).menu();

	// Define html links.
	$( "#messages" ).find("span").linkify();

	// Nick/Name button
	$( "#chat_nick" ).click(function(e) {
		e.preventDefault();
		chat.setName();
	}).button();

	// Channel button
	$( "#chat_channel" ).click(function(e) {
		e.preventDefault();
		chat.setChannel();
	}).button();

	// Volume slider.
	$( "#volume-slider" ).slider({
		value: 0.5,
		min: 0.0,
		max: 1.0,
		step: 0.1,
		slide: function( event, ui ) {
			chat.playVolume( ui.value );
			this.title = "Volume: "+ ui.value * 100 +"%";
			chat.playAudio();
		}
	});
	// Set default volume level.
	chat.playVolume( $("#volume-slider").slider("value") );

});