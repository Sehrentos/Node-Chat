/*
* scripts.js - default javascripts
*
* Define user data object and chat object
*/
var chat = {
	user: {}
};

/*
* WebSocket init
* @require: none
*
* @urlSource: @http://socket.io/docs/client-api/
*/
chat.init = function() {
  var self = this;

  // Open socket
  self.socket = io.connect('http://localhost:9000');

  self.socket.on('connect_error', function (data) {
    //console.log(data);
    if (data.type === "TransportError") {
      self.mes("Unable to connect server.");
      self.socket.close();
    }
  });

  self.socket.on('disconnect', function (data) {
    console.log(data);
    self.mes("Disconnected from server.");
    // Ask user to reconnect
    $.fn.nConfirm({
      title: "Disconnected!",
      message: "Do you wan't to <b>reconnect</b> to the server?",
      enableBackground: false,
      onSubmit: function(str) {
        self.socket.connect();
      }
    });
  });

  self.socket.on('connect_timeout', function (data) {
    console.log(data);
    self.mes("Connection timeout.");
  });

  // Update user data
  self.socket.on('update', function (data) {
    console.log(data);
    //chat.user = {data};
	chat.user = data;
  });

  self.socket.on('welcome', function (data) {
    console.log(data);
    //self.mes(data.message);
    self.notice(data.message);
  });

  self.socket.on('notice', function (data) {
    console.log(data);
    //self.mes(data.message);
	self.notice(data.message);
  });

  self.socket.on('wisper', function (data) {
    console.log(data);
    var d = new Date(data.date);
        hours = d.getHours(),
      minutes = d.getMinutes(),
      seconds = d.getSeconds();

    var msg = "["+ chat.twoDigits(hours) + ":" + chat.twoDigits(minutes) + ":" + chat.twoDigits(seconds) +"] ";
    if (data.from === data.to || data.from === chat.user.name) {
      msg += "Whisper to <a href=\"javascript:void(0)\" class=\"nickname\" onclick=\"chat.setWhisper('"+ data.to +"')\">&lt;"+ data.to +"&gt;</a> ";
    } else {
      msg += "<a href=\"javascript:void(0)\" class=\"nickname\" onclick=\"chat.setWhisper('"+ data.from +"')\">&lt;"+ data.from +"&gt;</a> Whispers: ";
    }
    msg += data.message;
    self.mes(msg,true);
    // Play audio
    if (data.to !== chat.user.name) {
      self.playAudio();
    }
    // Scroll down the chat and set focus to input.
    self.setFocus();
  });

  self.socket.on('chat', function(data) {
    console.log(data);
    var d = new Date(data.date);
        hours = d.getHours(),
      minutes = d.getMinutes(),
      seconds = d.getSeconds();

    var msg = "["+ chat.twoDigits(hours) + ":" + chat.twoDigits(minutes) + ":" + chat.twoDigits(seconds) +"] ";
      msg += "<a href=\"javascript:void(0)\" class=\"nickname\" onclick=\"chat.setWhisper('"+ data.name +"')\">&lt;"+ data.name +"&gt;</a> ";
      msg += data.message;
    self.mes(msg);
    // Play audio
    if (data.name !== chat.name) {
      self.playAudio();
    }
  });

  self.socket.on('users', function(data) {
    console.log(data);
    // Update userlist menu
    if (data !== undefined) {
      $("#users").find('ul').empty();
      $.each(data, function( key, value ) {
				var active = 0, newUser = '<li class="user">&rsaquo; '+ value.name +'</li>';

        if (chat.user.name === value.name || localStorage.name === value.name) {
          string = $(newUser).click(function(e) {
            active++;
            if (active === 1) {
              menu = '<li class="menu" onclick="chat.setWhisper()">&lsaquo; Whisper</li>';
              menu += '<li class="menu" onclick="chat.setName()">&lsaquo; Change name</li>';
              menu += '<li class="menu" onclick="chat.setChannel()">&lsaquo; Change channel</li>';
              $(this).append('<ul>'+ menu +'</ul>');
            }
          }).mouseleave(function() {
            $(this).find('ul').remove();
            active = 0;
          });
        } else {
          string = $(newUser).click(function(e) {
            active++;
            if (active === 1) {
              menu = '<li class="menu" onclick="chat.setWhisper(\''+ value.name +'\')">&lsaquo; Whisper</li>';
              $(this).append('<ul>'+ menu +'</ul>');
            }
          }).mouseleave(function() {
            $(this).find('ul').remove();
            active = 0;
          });
        }
				// Display
        $("#users").find('ul').append(string);
      });
    }
  });

  return this;
};

/*
* Socket submit data
* @require: elementId
*/
chat.setSubmit = function( elementId ) {
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

  if (messageStr !== undefined && messageStr.length > 1000) {
    $.fn.nNotice({
      message: "Message is too long! 1000 letters max.",
      enableBackground: true
    });
  } else {
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
                self.sendWhisper(str,message);
              }
            });
          }
        }
      });
    }
    // Dont send to your self
    else if (nickname.length && nickname !== chat.user.name) {
      if (messageStr === undefined) {
        $.fn.nPrompt({
          title: "Send whisper",
          message: "Please enter your <b>message</b> at the field below.",
          onSubmit: function(message) {
            self.sendWhisper(nickname,message);
          }
        });
      }
      else if (nickname.length && messageStr.length) {
        self.sendWhisper(nickname,messageStr);
      }
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
    self.socket.emit('setWhisper', {
      to: nickname,
      from: chat.user.name,
      message: messageStr
    });
    $("#sendform").find("#whisper").val(nickname);
  }
  return this;
};

/*
* Check if post is command
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
* Set notice message
* @require string
*/
chat.notice = function(string) {
	$("#header").find("#welcome").html(string);
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
    console.log("Socket close");
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
    console.log("Socket init");
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

  // Bind onclick event
  /*
  menuHolder.click(function() {
    var timestamp = new Date().getTime();
    console.log(timestamp + ": Clicked main menu.");
  });
  */

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