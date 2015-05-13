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
 * jQuery plugin: prompt, confirm, alert/notice window.
 * @nPrompt( options )
 * @nConfirm( options )
 * @nAlert( options )
 * @nNotice( options )
 */
(function ($) {
    jQuery.fn.nPrompt = function (options) {

        // Remove old nPrompt element if exists
        if ($("#nprompt_background").length) {
            $("#nprompt_background").remove();
        }

        // Create new nPrompt element
        var promptBody = $(
            '<div id="nprompt_background">' +
            '<div id="nprompt_main">' +
            '<div id="nprompt_inner">' +
            '<div id="nprompt_message">' +
            '<p id="title"></p>' +
            '<p id="message"><p>' +
            '</div>' +
            '<div id="nprompt_inputs">' +
            '<input type="text" id="nprompt_value" placeholder="Write here..." value="" />' +
            '<input type="button" id="submit_ok" value="Ok" />' +
            '<input type="button" id="submit_cancel" value="Cancel" />' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</div>');

        // Append promptBody to the body
        $("body").append(promptBody);

        // Default settings & functions
        var defaults = {
            type: false,
            title: "",
            message: "",
            value: "",
            enableBackground: false,
            promptId: promptBody,
            promptMainId: promptBody.find("#nprompt_main"),
            promptMsgId: promptBody.find("#nprompt_message"),
            promptValueId: promptBody.find("#nprompt_value"),
            promptSubmitId: promptBody.find("#submit_ok"),
            promptCancelId: promptBody.find("#submit_cancel"),
            //Functions
            onSubmit: function () {},
            onCancel: function () {},
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
                this.promptFocus(this.type ? this.promptSubmitId : false);
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
            settings.promptMsgId.find("#title").html(settings.title);
        } else {
            settings.promptMsgId.find("#title").remove();
        }
        settings.promptMsgId.find("#message").html(settings.message);
        if (!settings.type) {
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
        if (!settings.type || settings.type === "confirm") {
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

    // New confirm event
    jQuery.fn.nConfirm = function (options) {
        var defaults = {
            "type": "confirm"
        },
        settings = $.extend({}, defaults, options);
        return $.fn.nPrompt(settings);
    };

    // New alert event
    jQuery.fn.nAlert = function (options) {
        var defaults = {
            "type": "alert"
        },
        settings = $.extend({}, defaults, options);
        return $.fn.nPrompt(settings);
    };

    // New notice event
    jQuery.fn.nNotice = function (options) {
        var defaults = {
            "type": "notice"
        },
        settings = $.extend({}, defaults, options);
        return $.fn.nPrompt(settings);
    };

})(jQuery);
/*
 * jQuery plugin: dropdown menu
 *
 * @jQuery(<target>).dropdown(options);
 * @JSON { menu: [{...}, {...}] }
 *
 * @styles
 * borderWidth: parents border-width
 * borderColor: parents border-color
 * borderStyle: parents border-style
 * borderRadius: parents border-radius
 * borderBottomWidth: childs bottom-border-width (default: auto - uses parents styles)
 * borderBottomColor: childs bottom-border-color (default: auto - uses parents styles)
 * borderBottomStyle: childs bottom-border-style (default: auto - uses parents styles)
 * padding: parents first child padding
 * textAlign: childs text-align
 * fontFamily: childs font-family
 * fontWeight: childs font-weight
 * fontSize: childs font-size
 * color: childs color
 * colorHover: childs color at mouseover event
 * backgroundColor: parents backgroud-color (default: auto - detects backgroud-color)
 * backgroundColorHover: childs backgroud-color at mouseover event
 */
(function ($) {
    $.fn.dropdown = function (options) {
        // Create element if not exists
        if (!$(".dropdown").length) {
            var dropBody = $('<div class="dropdown" style="display:none"><div></div></div>');
            $("body").append(dropBody);
        }

        // Extend our default options with those provided
        var settings = $.extend({}, $.fn.dropdown.defaults, options);
        settings.dropClass = $(".dropdown");

        return this.each(function () {

            $(this).mouseenter(function () {
                settings.dropClass.css("display", "none").find("div").empty();

                var dropMenu = "",
                    dropObject = $(this),
                    dropPosition = dropObject.offset();

                // Add menu content
                if (typeof settings.menu === "object") {
                    $.each(settings.menu, function (key, value) {
                        dropMenu += '<div onclick="'+ value.link +'">'+ value.name +'</div>';
                    });
                }
                settings.dropClass.find("div").append(dropMenu);

                // Position & Styles.
                settings.dropClass.css({
                    'display': 'block',
                    'position': 'absolute',
                    'top': dropPosition.top + dropObject.outerHeight() + 'px',
                    'left': dropPosition.left + 'px',
                    'min-width': dropObject.outerWidth() + 'px',
                    'border-width': settings.borderWidth,
                    'border-color': settings.borderColor,
                    'border-style': settings.borderStyle,
                    'border-radius': settings.borderRadius,
                    'background-color': (settings.backgroundColor === "auto" ? dropObject.css('background-color') : settings.backgroundColor),
                    'z-index': '+1'
                })
                .find("div").css({
                    'padding': settings.padding
                })
                 .find("div").css({
                    'color': settings.color,
                    'cursor': 'pointer',
                    'text-align': settings.textAlign,
                    'font-family': settings.fontFamily,
                    'font-weight': settings.fontWeight,
                    'font-size': settings.fontSize,
                    'border-bottom-width': (settings.borderBottomWidth === "auto" ? settings.borderWidth : settings.borderBottomWidth),
                    'border-bottom-color': (settings.borderBottomColor === "auto" ? settings.borderColor : settings.borderBottomColor),
                    'border-bottom-style': (settings.borderBottomStyle === "auto" ? settings.borderStyle : settings.borderBottomStyle)
                })
                .mouseenter(function () {
                    $(this).css({
                        'color': settings.colorHover,
                        'background-color': settings.backgroundColorHover
                    });
                })
                .mouseleave(function () {
                    $(this).css({
                        'color': settings.color,
                        'background-color': 'transparent'
                    });
                })
                .last().css({
                    'border-bottom': 'none'
                });
            });

            // Dropdown mouse leave event
            settings.dropClass.mouseleave(function () {
                settings.dropClass.css("display", "none").find("div").empty();
            });

        });

    };

    //Defaults.
    $.fn.dropdown.defaults = {
        menu: null,
        dropTimer: null,
        dropClass: null,
        borderWidth: "1px",
        borderColor: "#cccccc",
        borderStyle: "solid",
        borderRadius: "4px",
        borderBottomWidth: "auto", //default: auto
        borderBottomColor: "auto", //default: auto
        borderBottomStyle: "auto", //default: auto
        padding: "4px",
        textAlign: "left",
        fontFamily: "inherit",
        fontWeight: "inherit",
        fontSize: "inherit",
        color: "#000000",
        colorHover: "#ffffff",
        backgroundColor: "auto", //default: auto
        backgroundColorHover: "#6c6c6c"
    };
})(jQuery);