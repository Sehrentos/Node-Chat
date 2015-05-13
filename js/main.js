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
	socket = io.connect('ws://localhost:9000');

	socket.on('welcome', function (data) {
		console.log(data);
		chat.mes("Welcome <strong>" + data.name + "</strong> !");
		chat.setName();
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
			$("#user_menu").empty();
			$.each(data, function( key, value ) {
				if (localStorage.name === value.name) {
					string = $("<li><a>"+ value.name +"</a></li>").dropdown({
						menu: [{
							"name": "Change name",
							"link": "chat.setName()"
						},{
							"name": "Change channel",
							"link": "chat.setChannel()"
						}]
					});
				} else {
					string = $("<li><a>"+ value.name +"</a></li>").dropdown({
						menu: [{
							"name": "Whisper",
							"link": "chat.setWhisper('"+value.name+"')"
						}]
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
	var inputMes = $(id).find("#input_message");
	if (inputMes.val().trim().length === 0) {
		//this.setFocus().notice("Message is empty.",5000);
	}
	else if (inputMes.val().trim().length > 1000) {
		//this.notice("Message is too long! max. 1000",5000);
		$.fn.nNotice({
			message: "Message is too long! 1000 letters max.",
			enableBackground: true,
			onSubmit: function () {
				//Do nothing...
			}
		});
	}
	else {
		socket.emit('sendMessage', { message: inputMes.val() });
		inputMes.val('');
		chat.scrollDown().setFocus();
	}
	return this;
};

/*
* Set user nick name
*/
chat.setName = function() {
	$.fn.nPrompt({
		title: "Set Name",
		message: "Please enter your <b>name</b> at the field below.",
		value: (localStorage.name ? localStorage.name : ""),
		enableBackground: false,
		onSubmit: function(str) {
			if (str !== null) {
				localStorage.name = str;
				socket.emit('setName', { name: str });
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
	if (target === undefined) {
		$.fn.nPrompt({
			title: "Send whisper",
			message: "Please enter a target <b>name</b>.",
			onSubmit: function(str) {
				// Don't send to your self
				if (str !== localStorage.name) {
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
	else if (target.length && target !== localStorage.name) {
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
	return this;
};

/*
* Send whisper to target
*/
chat.sendWhisper = function(target,msg) {
	if (target.length && msg.length) {
		socket.emit('whisper', {
			name: target,
			parent: localStorage.name,
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
chat.buildMenu = function(string) {
	return $("#user_menu").html(string); //menu("destroy").html(string).menu();
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
		chat.setSubmit("#sendform");
	});

	// Define textarea keydown.
	$("#sendform textarea").keydown(function(e) {
		if (e.keyCode == 13 && !e.shiftKey) {
			e.preventDefault();
			chat.setSubmit("#sendform");
		}
	});

	// Define sound on/off button.
	$("#disablesound").click(function() {
		chat.soundOn = chat.soundOn ? false : true;
		$(this).find("span").html("Sound is "+(chat.soundOn ? "on" : "off"));
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

	// Define tooltips.
	//$( document ).tooltip();

	// Define buttons.
	//$(".button").button();

	// Define menu.
	//$( "#users" ).draggable();
	//$("#user_menu").menu();

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