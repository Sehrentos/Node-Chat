/*
* plugins.js - jQuery plugins
*/
(function($) {

	// Define a method that allows fetching a cached script
	$.fn.cachedScript = function( url, options ) {
		// Allow user to set any option except for dataType, cache, and url
		options = $.extend( options || {}, {
			dataType: "script",
			cache: true,
			url: url
		});
		// Use $.ajax() since it is more flexible than $.getScript
		// Return the jqXHR object so we can chain callbacks
		return $.ajax( options );
	};

	/*
	* Define linkify() plugin
	* @jQuery('div.textbody').linkify();
	*/
	var linkifyThis = function () {
		var childNodes = this.childNodes,
				i = childNodes.length,
				url1 = /(^|&lt;|\s)(www\..+?\..+?)(\s|&gt;|$)/g,
				url2 = /(^|&lt;|\s)(((https?|ftp):\/\/|mailto:).+?)(\s|&gt;|$)/g;
		while(i--) {
			var n = childNodes[i];
			if (n.nodeType == 3) {
				var html = n.nodeValue; //$.trim(n.nodeValue);
				if (html) {
					html = html.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(url1, '$1<a href="http://$2" target="_blank">$2</a>$3')
					.replace(url2, '$1<a href="$2" target="_blank">$2</a>$5');
					$(n).after(html).remove();
				}
			}
			else if (n.nodeType == 1	&&	!/^(a|button|textarea)$/i.test(n.tagName)) {
				linkifyThis.call(n);
			}
		}
	};
	$.fn.linkify = function () {
		return this.each(linkifyThis);
	};
	
	/*
	* New prompt, confirm, alert/notice windows plugin
	* @jQuery.fn.nPrompt( options )
	* @jQuery.fn.nConfirm( options )
	* @jQuery.fn.nAlert( options )
	* @jQuery.fn.nNotice( options )
	options = {
		title: string,					-optional
		message: string,				-optional
		value: string,					-optional(nPromt required)
		enableBackground: true/false,	-optional
		onSubmit: callback,				-optional
		onCancel: callback				-optional
	}
	*/
	$.fn.nPromptIt = function (options) {
		// Create new nPrompt body element
		var promptBody = $(
			'<div class="nprompt_background">' +
			'<div class="nprompt_main">' +
			'<div class="nprompt_inner">' +
			'<div class="nprompt_message">' +
			'<p class="title"></p>' +
			'<p class="message"><p>' +
			'</div>' +
			'<div class="nprompt_inputs">' +
			'<input type="text" class="nprompt_value" placeholder="Write here..." value="" />' +
			'<input type="button" class="submit_ok" value="Ok" />' +
			'<input type="button" class="submit_cancel" value="Cancel" />' +
			'</div>' +
			'</div>' +
			'</div>' +
			'</div>');

		// Append promptBody to the body
		$("body").append(promptBody);

		// Options, Defaults and Methods
		var defaults = {
			//Options
			type: false,
			title: "",
			message: "",
			value: "",
			enableBackground: false,
			onSubmit: function () {},
			onCancel: function () {},
			//Defaults
			promptId: promptBody,
			promptMainId: promptBody.find(".nprompt_main"),
			promptMsgId: promptBody.find(".nprompt_message"),
			promptValueId: promptBody.find(".nprompt_value"),
			promptSubmitId: promptBody.find(".submit_ok"),
			promptCancelId: promptBody.find(".submit_cancel"),
			//Functions
			promptFocus: function (e) {
				if (e === undefined || e === false) {
					this.promptValueId.focus().select();
				} else {
					e.focus();
				}
				return this;
			},
			promptHide: function () {
				this.promptId.css("display", "none");
				return this;
			},
			promptRemove: function () {
				this.promptId.remove();
				return this;
			},
			promptShow: function () {
				var center = ($(document).width() / 2 - this.promptMainId.width() / 2);
				if (this.enableBackground) {
					this.promptId.css({
						"display": "block",
						"background": "#b2b2b2",
						"opacity": "0.90"
					});
					this.promptMainId.css({
						"left": center + "px"
					});
				} else {
					this.promptId.css({
						"display": "block"
					});
					this.promptMainId.css({
						"left": center + "px"
					});
				}
				this.promptFocus(this.type === "prompt" ? this.promptValueId : this.promptSubmitId);
				return this;
			},
			promptUnbind: function () {
				this.promptSubmitId.unbind("click");
				if (!this.type) {
					this.promptCancelId.unbind("click");
					this.promptValueId.unbind("keydown");
				} else if (this.type === "confirm") {
					this.promptCancelId.unbind("click");
				}
				return this;
			},
			promptSubmit: function () {
				var promptOk = $.trim(this.promptValueId.val());
				this.promptValueId.val("");
				this.promptUnbind().onSubmit(promptOk);
				//this.promptHide();
				this.promptId.remove();
				return this;
			},
			promptCancel: function () {
				this.promptValueId.val("");
				this.promptUnbind().onCancel(null);
				//this.promptHide();
				this.promptId.remove();
				return this;
			},
			promptKeyDown: function (event) {
				if (event.keyCode == 13) {
					event.preventDefault();
					this.promptSubmit();
				} else if (event.keyCode == 27) {
					event.preventDefault();
					if (!this.type || this.type === "confirm") {
						this.promptCancel();
					} else {
						this.promptSubmit();
					}
				}
				return this;
			}
		};

		var settings = $.extend({}, defaults, options);

		// Add default values in to the nPrompt element
		if (settings.title.length > 0) {
			settings.promptMsgId.find(".title").html(settings.title);
		} else {
			settings.promptMsgId.find(".title").remove();
		}
		if (settings.message.length > 0) {
			settings.promptMsgId.find(".message").html(settings.message);
		} else {
			settings.promptMsgId.find(".message").remove();
		}
		if (!settings.type || settings.type === "prompt") {
			settings.promptValueId.val(settings.value);
		} else if (settings.type === "confirm") {
			settings.promptValueId.hide();
		} else {
			settings.promptValueId.hide();
			settings.promptCancelId.hide();
		}

		// Show nPrompt element
		settings.promptShow();

		// Bind event keydown
		if (!settings.type) {
			settings.promptValueId.bind("keydown", function (e) {
				settings.promptKeyDown(e);
			});
		} else {
			settings.promptMainId.bind("keydown", function (e) {
				settings.promptKeyDown(e);
			});
		}

		// Bind event click OK
		settings.promptSubmitId.bind("click", function () {
			settings.promptSubmit();
		});

		// Bind event click onCancel
		if (!settings.type || settings.type === "prompt" || settings.type === "confirm") {
			settings.promptCancelId.bind("click", function () {
				settings.promptCancel();
			});
		}

		// Resize event
		$(window).resize(function () {
			if (settings.promptMainId.length) {
				settings.promptMainId.css("left", ($(document).width() / 2 - settings.promptMainId.width() / 2) + "px");
			}
		});
		return this;
	};

	// Duplicate nPromptIt: New prompt event
	$.fn.nPrompt = function (options) {
		var defaults = {
				"type": "prompt"
		},
		settings = $.extend({}, defaults, options);
		return $.fn.nPromptIt(settings);
	};

	// Duplicate nPromptIt: New confirm event
	$.fn.nConfirm = function (options) {
		var defaults = {
				"type": "confirm"
		},
		settings = $.extend({}, defaults, options);
		return $.fn.nPromptIt(settings);
	};

	// Duplicate nPromptIt: New alert event
	$.fn.nAlert = function (options) {
		var defaults = {
				"type": "alert"
		},
		settings = $.extend({}, defaults, options);
		return $.fn.nPromptIt(settings);
	};

	// Duplicate nPromptIt: New notice event
	$.fn.nNotice = function (options) {
		var defaults = {
				"type": "notice"
		},
		settings = $.extend({}, defaults, options);
		return $.fn.nPromptIt(settings);
	};

	/*
	 * jQuery plugin: dropdown menu
	 *
	 * jQuery('.class #id').dropdown(options);
	 * JSON options = { menu: [{ name:'', link:'' }, { name:'', link:'' }] };
	 */
	$.fn.dropdown = function(event, options) {
		var defaults = {
			timer: null,
			timeout: 800,
			active: false,
			animation: false,
			speed: 200
		};
		// Extend objects
		var settings = $.extend({}, defaults, options);

		return this.each(function() {
			$(this).css({
				'cursor': 'pointer'
			});
			// Create new element
			var dropBody = $('<div class="custom-dropdown" style="display:none;"><ul></ul></div>');
			// Extend objects
			var opt = $.extend({}, settings, {
				dropMenuShow: function($this) {
					var self = this;

					clearTimeout(self.timer);

					// Check if animation is in progress
					if (self.animation) return;
					self.animation = true;

					// Append menu to the html body
					$('body').append(dropBody);

					var dropMenu = '',
							dropObject = $($this),
							dropPosition = dropObject.offset();

					// Add menu content
					if (typeof options === "object") {
						$.each(options.menu, function (key, value) {
                            dropMenu += '<li onclick="'+ value.link +'"><span>'+ value.name +'</span></li>';
						});
					}
					dropBody.find("ul").html(dropMenu);

					// Position & Styles.
					dropBody.css({
						'top': dropPosition.top + dropObject.outerHeight() + 'px',
						'left': dropPosition.left + 'px',
						'min-width': dropObject.outerWidth() + 'px'
					}).slideDown(self.speed, function(){
						self.animation = false;
						self.active = true;
					});
				},
				dropMenuHide: function() {
					//Start timer for hiding element
					opt.timer = setTimeout(function() {
						dropBody.slideUp(opt.speed, function(){
							opt.animation = false;
							opt.active = false;
							clearTimeout(opt.timer);
						});
					}, opt.timeout);
				}
			});

			switch (event) {
				case "mouseenter":
					$(this).mouseenter(function() {
						opt.dropMenuShow(this);
					})
					.mouseleave(function() {
						opt.dropMenuHide();
					});
				break;

				default: //click
					$(this).click(function() {
						opt.dropMenuShow(this);
					});
				break;
			}

			// Mouse leave menu event
			dropBody.mouseenter(function(){
				clearTimeout(opt.timer);
			})
			.mouseleave(function () {
				opt.dropMenuHide();
			});

			// Window resize
			$(window).resize(function() {
				if (opt.active) {
					clearTimeout(opt.timer);
					opt.animation = false;
					opt.active = false;
					dropBody.hide();
				}
			});

		});
	};

})(jQuery);