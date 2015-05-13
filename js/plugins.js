/*
* Define: Linkify plugin
* @jQuery('div.textbody').linkify();
*/
(function($){
	var url1 = /(^|&lt;|\s)(www\..+?\..+?)(\s|&gt;|$)/g,
	url2 = /(^|&lt;|\s)(((https?|ftp):\/\/|mailto:).+?)(\s|&gt;|$)/g,
	linkifyThis = function () {
		var childNodes = this.childNodes,
		    i = childNodes.length;
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
			else if (n.nodeType == 1  &&  !/^(a|button|textarea)$/i.test(n.tagName)) {
				linkifyThis.call(n);
			}
		}
	};
	$.fn.linkify = function () {
		return this.each(linkifyThis);
	};
})(jQuery);

/*
 * jQuery plugin: prompt, confirm, alert window.
 * @nprompt( options )
 * @nconfirm( options )
 * @nalert( options )
 */
(function ($) {

	jQuery.fn.nprompt = function (options) {

		// Remove old element if exists
		if ($("#nprompt").length) {
			$("#nprompt").remove();
		}

		// Create new element
		var promptBody = $('<div id="nprompt">' +
			'<div id="nprompt_inner">' +
			'<div id="nprompt_message"></div>' +
			'<div id="nprompt_inputs">' +
			'<input type="text" id="nprompt_value" placeholder="Write here..." value="" />' +
			'<input type="button" id="submit_ok" value="Ok" />' +
			'<input type="button" id="submit_cancel" value="Cancel" />' +
			'</div>' +
			'</div>' +
			'</div>');
		$("body").append(promptBody);

		// Default settings & functions
		var defaults = {
			type: false,
			text: "",
			defaultText: "",
			promptId: $("#nprompt"),
			promptTextId: $("#nprompt_message"),
			promptDefaultTextId: $("#nprompt_value"),
			promptYesId: $("#submit_ok"),
			promptNoId: $("#submit_cancel"),
			submit: function () {},
			cancel: function () {},
			promptFocus: function (e) {
				if (e === undefined) {
					settings.promptDefaultTextId.focus().select();
				} else {
					e.focus();
				}
				return this;
			},
			promptHide: function () {
				settings.promptId.css("display", "none");
				return this;
			},
			promptShow: function () {
				settings.promptId.css({
					"display": "block",
					"left": ($(document).width() / 2 - settings.promptId.width() / 2) + "px"
				});
				if (!settings.type) {
					settings.promptFocus();
				} else {
					settings.promptFocus(settings.promptYesId);
				}
				return this;
			},
			promptUnbind: function () {
				settings.promptYesId.unbind("click");
				if (!settings.type) {
					settings.promptNoId.unbind("click");
					settings.promptDefaultTextId.unbind("keydown");
				} else if (settings.type === "confirm") {
					settings.promptNoId.unbind("click");
				}
				return this;
			},
			promptSubmit: function () {
				var promptOk = $.trim(settings.promptDefaultTextId.val());
				settings.promptDefaultTextId.val("");
				settings.promptHide().promptUnbind();
				settings.submit(promptOk);
				settings.promptId.remove();
				return this;
			},
			promptCancel: function () {
				settings.promptDefaultTextId.val("");
				settings.promptHide().promptUnbind();
				settings.cancel(null);
				settings.promptId.remove();
				return this;
			},
			promptKeyDown: function (event) {
				if (event.keyCode == 13) {
					event.preventDefault();
					settings.promptSubmit();
				} else if (event.keyCode == 27) {
					event.preventDefault();
					if (!settings.type || settings.type === "confirm") {
						settings.promptCancel();
					} else {
						settings.promptSubmit();
					}
				}
				return this;
			}
		};

		var settings = $.extend({}, defaults, options);

		// We dont need to use target parent element on this plugin.
		//return this.each(function () {

		// Add default values
		settings.promptTextId.html(settings.text);
		if (!settings.type) {
			settings.promptDefaultTextId.val(settings.defaultText);
		} else if (settings.type === "confirm") {
			settings.promptDefaultTextId.css("display", "none");
		} else {
			settings.promptDefaultTextId.css("display", "none");
			settings.promptNoId.css("display", "none");
		}

		// Show window
		settings.promptShow();

		// Bind event keydown
		if (!settings.type) {
			settings.promptDefaultTextId.bind("keydown", function (e) {
				settings.promptKeyDown(e);
			});
		} else {
			settings.promptId.bind("keydown", function (e) {
				settings.promptKeyDown(e);
			});
		}

		// Bind event click OK
		settings.promptYesId.bind("click", function () {
			settings.promptSubmit();
		});

		// Bind event click CANCEL
		if (!settings.type || settings.type === "confirm") {
			settings.promptNoId.bind("click", function () {
				settings.promptCancel();
			});
		}

		// Resize event
		$(window).resize(function () {
			if (settings.promptId.length) {
				settings.promptId.css("left", ($(document).width() / 2 - settings.promptId.width() / 2) + "px");
			}
		});

		//});
		return this;

	};

	// New confirm event
	jQuery.fn.nconfirm = function (options) {
		var defaults = {
			"type": "confirm"
		},
		settings = $.extend({}, defaults, options);

		return $.fn.nprompt(settings);
	};

	// New alert event
	jQuery.fn.nalert = function (options) {
		var defaults = {
			"type": "alert"
		},
		settings = $.extend({}, defaults, options);

		return $.fn.nprompt(settings);
	};

})(jQuery);