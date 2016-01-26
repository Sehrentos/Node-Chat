/*
 * plugins.js - Just my simple lib
 * Author Niko H.
 *
 * DOM is loaded event
 */
var ready = function(callback) {
	if (typeof(callback) === "function") {
		return document.addEventListener("DOMContentLoaded", callback, false);
	} throw "ready() callback is not is not function.";
};

/*
 * Element query selector
 */
var selector = function(s, callback) {
	var target;
	if (s.indexOf("#") !== -1) {
		target = document.querySelector(s);
		if (typeof(callback) === "function") {
			callback(target, 0);
		}
	} else {
		target = document.querySelectorAll(s);
		if (typeof(callback) === "function") {
			for (var p in target) {
				if (target.hasOwnProperty(p)) {
					callback(target[p], p);
				}
			}
		}
	}
	return target;
};

/*
 * Object.find(target, callback(target, index) ) - querySelector
 * Works for HTML, XUL, and plain XML
 */
if (!Object.prototype.find) {
	Object.prototype.find = function(s, callback) {
		var target;
		if (s.indexOf("#") !== -1) {
			target = this.querySelector(s);
			if (typeof(callback) === "function") {
				callback(target, 0);
			}
		} else {
			target = this.querySelectorAll(s);
			if (typeof(callback) === "function") {
				for (var p in target) {
					if (target.hasOwnProperty(p)) {
						callback(target[p], p);
					}
				}
			}
		}
		return target;
	}
}

/*
 * Object.text() - append a string function.
 * Object.text("String", append) - append (true/false) optional
 */
if (!Object.prototype.text) {
	Object.prototype.text = function(src, ap) {
		var self = this,
			source = src || "",
			append = ap || false;
		
		if (self.tabIndex === -1 || self.tabIndex === 0) {
			if (append === false) {
				self.innerHTML = '';
			}
			self.appendChild( document.createTextNode(source) );
		}
		else {
			Object.keys(self).forEach(function (key) {
				if (append === false) {
					self[key].innerHTML = '';
				}
				self[key].appendChild( document.createTextNode(source) );
			});
		}
		
		return this;
	}
}

/*
 * Object.html() - append a html function.
 * Object.html("String", append) - append (true/false) optional
 */
if (!Object.prototype.html) {
	Object.prototype.html = function(src, ap) {
		var self = this,
			source = src || "",
			append = ap || false;
		
		if (self.tabIndex === -1 || self.tabIndex === 0) {
			if (append === false) {
				self.innerHTML = source;
			} else {
				self.innerHTML += source;
			}
		}
		else {
			Object.keys(self).forEach(function (key) {
				if (append === false) {
					self[key].innerHTML = source;
				} else {
					self[key].innerHTML += source;
				}
			});
		}
		
		return this;
	}
}

/*
 * on() - Event binding function.
 * Object.on("click", Function, false)
 */
if (!Object.prototype.on) {
	Object.prototype.on = function(src, callback, extra) {
		return this.addEventListener(src, callback, extra || false);
	}
}

/*
 * each() - For each loop (Array/Object)
 * each(elem, function(value, index) { console.log(index + " -> " + value); });
 */
var each = function(src, callback) {
	if (typeof(callback) === "function") {
		var i;
		if (src.constructor === Object) {
			for (i in src) {
				if (src.hasOwnProperty(i)) {
					callback(src[i], i);
				}
			}
		} else {
			for (i = 0; i < src.length; i++) {
				callback(src[i], i);
			}
		}
	}
	return this;
};

/*
 * Object.each() - For each loop (Array/Object)
 * Object.each(function(value, index) { console.log(index + " -> " + value); });
 */
if (!Object.prototype.each) {
	Object.prototype.each = function(callback) {
		if (typeof(callback) === "function") {
			var i, src = this;
			if (src.constructor === Object) {
				for (i in src) {
					if (src.hasOwnProperty(i)) {
						callback(src[i], i);
					}
				}
			} else { /* Array, HTMLCollection... */
				for (i = 0; i < src.length; i++) {
					callback(src[i], i);
				}
			}
		}
		return this;
	};
}

/*
 * Storage - localStorage JSON
 * Methods to load, save, remove data from localStorage.
 */
var loadStorage = function (key) {
	var keyName = key || "storage_db";
	if (localStorage[keyName]) {
		return JSON.parse(localStorage[keyName]);
	}
	return {};
};

var saveStorage = function (val, key) {
	var keyName = key || "storage_db";
	localStorage[keyName] = JSON.stringify(val);
};

var removeStorage = function (key) {
	var keyName = key || "storage_db";
	localStorage.removeItem(keyName);
};

/*
 * Helper function: arrayObjectIndexOf
 * @Return index or -1 if not found
 * var index = arrayObjectIndexOf(arrayObject, searchThis, "fromThisPropName");
 */
var arrayObjectIndexOf = function(arrayObject, searchTerm, property) {
	for (var i = 0, len = arrayObject.length; i < len; i++) {
		if (arrayObject[i][property] === searchTerm) return i;
	}
	return -1;
};

/*
 * Object.extend() - Object merge/extend function
 * Browser support(tested): IE9+, Mozilla/5.0 Gecko Firefox/38, Chrome/47
 * 1. extend(obj1, obj2);
 * 2. obj3 = extend(obj1, obj2);
 */
if (!Object.extend) {
	Object.extend = function(destination, source) {
		for (var property in source) {
			if (source[property] && source[property].constructor && source[property].constructor === Object) {
				destination[property] = destination[property] || {};
				arguments.callee(destination[property], source[property]);
			} else {
				destination[property] = source[property];
			}
		}
		return destination;
	};
}

/*
 * extend() - Merge Arrays & Objects function
 * Browser support(tested): IE9+, Mozilla/5.0 Gecko Firefox/38, Chrome/47
 * 1. extend(obj1, obj2);
 * 2. obj3 = extend(obj1, obj2);
 */
var extend = function(target, src) {
	var array = Array.isArray(src);
	var dst = array && [] || {};
	if (array) {
		target = target || [];
		dst = dst.concat(target);
		src.forEach(function(e, i) {
			if (typeof dst[i] === 'undefined') {
				dst[i] = e;
			} else if (typeof e === 'object') {
				dst[i] = arguments.callee(target[i], e);
			} else {
				if (target.indexOf(e) === -1) {
					dst.push(e);
				}
			}
		});
	} else {
		if (target && typeof target === 'object') {
			Object.keys(target).forEach(function (key) {
				dst[key] = target[key];
			})
		}
		Object.keys(src).forEach(function (key) {
			if (typeof src[key] !== 'object' || !src[key]) {
				dst[key] = src[key];
			}
			else {
				if (!target[key]) {
					dst[key] = src[key];
				} else {
					dst[key] = arguments.callee(target[key], src[key]);
				}
			}
		});
	}
	return dst;
};

/*
 * Object.extend() - Array/Object deep merge function
 * Browser support(tested): IE9+, Mozilla/5.0 Gecko Firefox/38, Chrome/47
 * 1. obj1.extend(obj2);
 * 2. obj3 = obj1.extend(obj2);
 */
if (!Object.prototype.extend) {
	Object.prototype.extend = function(src) {
		var target = this;
		return extend(target, src);
	};
}

/*
 * serialize() - HTML form serialize function
 * @form - target id
 * @return object
 * Browser support(tested): IE/9+, Mozilla/5.0 Gecko Firefox/38, Chrome/47
 */
var serialize = function(form) {
	if (!form || form.nodeName !== "FORM") {
		return;
	}
	var i, j, o = {};
	for (i = 0; i < form.elements.length; i++) {
		if (form.elements[i].name === "") {
			continue
		}
		switch (form.elements[i].nodeName) {
			case "INPUT":
				switch (form.elements[i].type) {
					case "text":
					case "hidden":
					case "password":
					case "button":
					case "reset":
					case "submit":
					//HTML5
					case "number":
					case "color":
					case "range":
					case "date":
					case "month":
					case "week":
					case "time":
					case "datetime":
					case "datetime-local":
					case "email":
					case "search":
					case "tel":
					case "url":
						o[form.elements[i].name] = form.elements[i].value;
					break;
					case "checkbox":
					case "radio":
						if (form.elements[i].checked) {
							o[form.elements[i].name] = form.elements[i].value;
						}
					break;
					case "file":
					break;
				}
			break;
			case "TEXTAREA":
				o[form.elements[i].name] = form.elements[i].value;
			break;
			case "SELECT":
				switch (form.elements[i].type) {
					case "select-one":
						o[form.elements[i].name] = form.elements[i].value;
					break;
					case "select-multiple":
						for (j = 0; j < form.elements[i].options.length; j++) {
							if (form.elements[i].options[j].selected) {
								o[form.elements[i].name] = form.elements[i].options[j].value;
							}
						}
					break;
				}
			break;
			case "BUTTON":
				switch (form.elements[i].type) {
					case "reset":
					case "submit":
					case "button":
						o[form.elements[i].name] = form.elements[i].value;
					break;
				}
			break;
		}
	}
	return o;
};

/*
 * Ajax() - XMLHttpRequest function
 * url - file url to load
 * success - function fired when loaded
 * progress - function fired when loading
 * error - function fired when error occurs
 */
var Ajax = function(url, success, progress, error) {
	this.request = new XMLHttpRequest();
	
	this.request.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			if (success) success(this.response); //this.responseText
		}
	};
	
	this.request.onprogress = function(e) {
		if (e.lengthComputable) {
			var percentComplete = (e.loaded / e.total) * 100;
			if (progress) progress(percentComplete);
		}
	};
	
	this.request.onerror = function() {
		if (error) error("Network Error");
	};

	this.request.open("GET", url, true);
	this.request.send();
};

// get() - Short-hand for Ajax()
var get = function(url, success, progress, error) {
	return new Ajax(url, success, progress, error);
};

/*
 * Element.remove() - Element remove function.
 */
if (!('remove' in Element.prototype)) {
	Element.prototype.remove = function() {
		if (this.parentNode) {
			this.parentNode.removeChild(this);
		}
	};
}

/*
 * String.linkify() - Make link function
 */
if(!String.linkify) {
	String.prototype.linkify = function() {

		// http://, https://, ftp://
		var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

		// www. sans http:// or https://
		var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

		// Email addresses
		var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

		return this
			.replace(urlPattern, '<a href="$&" target="_blank">$&</a>')
			.replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>')
			.replace(emailAddressPattern, '<a href="mailto:$&" target="_blank">$&</a>');
	};
}

/*
 * Object.linkify() - Make link function
 */
if (!Object.linkify) {
	Object.prototype.linkify = function(type) {

		// http://, https://, ftp://
		var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;

		// www. sans http:// or https://
		var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

		// Email addresses
		var emailAddressPattern = /[\w.]+@[a-zA-Z_-]+?(?:\.[a-zA-Z]{2,6})+/gim;

		// innerHTML or textContent
		if (!type) {
			return this.innerHTML = this.textContent
				.replace(urlPattern, '<a href="$&" target="_blank">$&</a>')
				.replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>')
				.replace(emailAddressPattern, '<a href="mailto:$&" target="_blank">$&</a>');
		} else {
			return this.innerHTML = this.innerHTML
				.replace(urlPattern, '<a href="$&" target="_blank">$&</a>')
				.replace(pseudoUrlPattern, '$1<a href="http://$2" target="_blank">$2</a>')
				.replace(emailAddressPattern, '<a href="mailto:$&" target="_blank">$&</a>');
		}
	}
}

/*
 * String.encodeHTML function
 */
if (!String.prototype.encodeHTML) {
	String.prototype.encodeHTML = function() {
		return this.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;').toString();
	};
}

/*
 * Pure JS: Custom prompt, confirm, alert
 * @nprompt( options )
 * @nconfirm( options )
 * @nalert( options )
 * Browser support(tested): IE9+, Mozilla/5.0 Gecko Firefox/38, Chrome/47
	options = {
	title: string,					-optional
	message: string,				-optional
	input: array[object],			-optional(npromt required)
	background: true/false,			-optional
	onSubmit: callback,				-optional
	onCancel: callback				-optional
 }
 * input example:
 options.input = [{
	"type": "text",
	"name": "test1",
	"placeholder": "Test 1",
	"required": "true"
 }]
 */
var nprompt = function(options, pType) {
	// Default settings
	var defaults = {
		type: pType || "prompt",
		title: "",
		message: "",
		input: [{
			name: "a",
			value: "",
			placeholder: "Write here...",
			className: "nprompt_value w3-input w3-margin-bottom w3-border w3-white"
		}],
		inputSubmit: [{
			type: "submit",
			className: "submit_ok w3-input w3-border w3-light-grey",
			value: "Ok"
		},{
			type: "button",
			className: "submit_cancel w3-input w3-border w3-light-grey",
			value: "Cancel"
		}],
		background: false,
		promptBody: document.createElement("DIV"),
		onSubmit: function() {},
		onCancel: function() {}
	};

	// Custom function extend(destination, source)
	var settings = Object.extend(defaults, options);

	// Append promptBody element settings
	settings.promptBody.id = Math.random();
	settings.promptBody.className = "nprompt_holder";
	/*settings.promptBody.innerHTML = '<div class="nprompt_background"></div>' +
		'<div class="nprompt_main">' +
		'<div class="nprompt_inner">' +
		'<div class="nprompt_message">' +
		'<p class="title"></p>' +
		'<p class="message"><p>' +
		'</div>' +
		'<form class="nprompt_inputs"></form>' +
		'</div>' +
		'</div>';*/

		//W3.CSS - Modal style
		settings.promptBody.innerHTML = '<div class="nprompt_background w3-modal"> \
			<div class="nprompt_message w3-modal-content w3-card-8"> \
				<header class="w3-container w3-light-green"> \
					<h2 class="title"></h2> \
				</header> \
				<div class="nprompt_message w3-container w3-padding"> \
					<p class="message w3-margin"><p> \
				</div> \
				<footer class="w3-container w3-padding-bottom"> \
					<form class="nprompt_inputs w3-container"></form> \
				</footer> \
			</div> \
		</div>';

	settings.remove = function(t) {
		return t.parentNode.removeChild(t);
	};

	settings.promptSubmit = function(event) {
		event.preventDefault();
		var inputObject = serialize(settings.promptBody.querySelector(".nprompt_inputs"));
		settings.onSubmit(inputObject);
		settings.remove(settings.promptBody);
		return this;
	};

	settings.promptCancel = function(event) {
		settings.onCancel(null);
		settings.remove(settings.promptBody);
		settings.promptBody.querySelector(".nprompt_inputs").removeEventListener("submit", settings.promptSubmit, false);
		settings.promptBody.querySelector(".submit_cancel").removeEventListener("click", settings.promptCancel, false);
		return this;
	};

	// Add title
	if (settings.title.length > 0) {
		settings.promptBody.querySelector(".nprompt_message").querySelector(".title").innerHTML = settings.title;
	} else {
		settings.remove( settings.promptBody.querySelector(".nprompt_message").querySelector(".title") );
	}

	// Add message
	settings.promptBody.querySelector(".nprompt_message").querySelector(".message").innerHTML = settings.message;

	// Add Submit/Cancel buttons
	var i = 0;
	var array = settings.inputSubmit;
	while (array[i]) {
		var elem = document.createElement('INPUT');
		inputElem = Object.extend(elem, array[i]);
		settings.promptBody.querySelector(".nprompt_inputs").appendChild(inputElem);
		i++;
	}

	// Add inputs
	if (!settings.type || settings.type === "prompt") {
		var i = 0;
		var array = settings.input;
		while (array[i]) {
			var value = array[i];
			var type = array[i].type || "text";
			switch (type) {
				case "textarea":
					var elem = document.createElement('TEXTAREA');
					inputElem = Object.extend(elem, array[i]);
					inputElem.className = array[i].className || "nprompt_value w3-input w3-margin-bottom w3-border w3-white";
					// Insert before submit and cancel button
					settings.promptBody.querySelector(".nprompt_inputs").insertBefore(inputElem, settings.promptBody.querySelector(".nprompt_inputs").childNodes[settings.promptBody.querySelector(".nprompt_inputs").childNodes.length-2]);
				break;
				case "radio":
				case "checkbox":
					var elem = document.createElement('INPUT');
					inputElem = Object.extend(elem, array[i]);
					inputElem.id = array[i].id || Math.random();
					inputElem.className = array[i].className || "nprompt_value w3-input w3-margin-bottom w3-border w3-white";
					var newElement = document.createElement("P");
					
					var newItem = document.createElement("LABEL");
					newItem.htmlFor = inputElem.id;
					newItem.innerHTML = array[i].desc || "";
					
					newElement.appendChild(inputElem);
					newElement.appendChild(newItem);
					
					var newItem = document.createElement("BR");
					newElement.appendChild(newItem);
					// Insert before submit and cancel button
					settings.promptBody.querySelector(".nprompt_inputs").insertBefore(newElement, settings.promptBody.querySelector(".nprompt_inputs").childNodes[settings.promptBody.querySelector(".nprompt_inputs").childNodes.length-2]);
				break;
				default:
					var elem = document.createElement('INPUT');
					inputElem = Object.extend(elem, array[i]);
					inputElem.className = array[i].className || "nprompt_value w3-input w3-margin-bottom w3-border w3-white";
					// Insert before submit and cancel button
					settings.promptBody.querySelector(".nprompt_inputs").insertBefore(inputElem, settings.promptBody.querySelector(".nprompt_inputs").childNodes[settings.promptBody.querySelector(".nprompt_inputs").childNodes.length-2]);
				break;
			}
			i++;
		}
	}

	// Hide cancel button
	if (settings.type !== "prompt" && settings.type !== "confirm") {
		settings.promptBody.querySelector(".submit_cancel").style.display = "none";
	}

	// Bind event click submit
	settings.promptBody.querySelector(".nprompt_inputs").addEventListener("submit", settings.promptSubmit, false);

	// Bind event click cancel
	settings.promptBody.querySelector(".submit_cancel").addEventListener("click", settings.promptCancel, false);

	// Append to the body
	document.body.appendChild(settings.promptBody);

	// Enable/Disable background
	/* if (settings.background) {
		settings.promptBody.querySelector(".nprompt_background").className.replace(" disabled", "");
		settings.promptBody.querySelector(".nprompt_background").className += " enabled";
	} else {
		settings.promptBody.querySelector(".nprompt_background").className.replace(" enabled", "");
		settings.promptBody.querySelector(".nprompt_background").className += " disabled";
	} */

	// Display
	//settings.promptBody.querySelector(".nprompt_background").style.display = "block";
	settings.promptBody.childNodes[0].style.display = "block";

	// Focus
	if (settings.type === false || settings.type === "prompt") {
		settings.promptBody.querySelector(".nprompt_value").focus();
		settings.promptBody.querySelector(".nprompt_value").select();
	} else {
		settings.promptBody.querySelector(".submit_ok").focus();
	}

	return this;
};
// New confirm event
var nconfirm = function(options) {
	return nprompt(options, "confirm");
};
// New alert event
var nalert = function(options) {
	return nprompt(options, "alert");
};

/*
 * JS color codes
 */
var jscodecolors = function() {

	function lookAhead(x, ipos, n) {
		var i, c, ch, text;
		text = "";
		for (i = ipos; i < ipos + n; i++) {
			if (i < x.length) {
				c = x.charAt(i);
				ch = c.charCodeAt(0);	
				if (ch == 32 || ch == 10 || ch == 13 || ch == 9 ) {
					text += " ";				
				} else {
					text += c;
				}
			}
		}
		return text;
	}
	
	function lookWord(x, ipos) {
		var i, c, ch, text;
		text = "";
		for (i = ipos; i < x.length; i++) {
			c = x.charAt(i);
			ch = c.charCodeAt(0);	
			if (ch == 10 || ch == 13 || ch == 9 || ch == 32 || ch == 38 || ch == 40 || ch == 41 || ch == 42 || ch == 43 ||
			ch == 44 || ch == 58 || ch == 47 || ch == 58 || ch == 59 || ch == 60 || ch == 61 || ch == 91 || ch == 93) {
				return text;				
			} else {
				text += c;
			}
		}
		return text;
	}
	
	var x, y, z, i, j, k, c, ch, text, status, ele, comp, pos;
	var jsArr = ["var","boolean","break","case","catch","continue","debugger","default","do","else","finally","for","function","if","in","new","return","switch","throw","try","typeof","while","with"];
	
	if (!document.getElementsByClassName) {
		return;
	}
	
	y = document.getElementsByClassName("jsHigh");
	for (j = 0; j < y.length; j++) {
		z = y[j];
		ele = "";
		text = "";
		status = "";
		x = z.innerHTML;
		
		if (z.getAttribute("data-jscode") !== "done") {
			for (i = 0; i < x.length; i++) {
				c = x.charAt(i);
				ch = c.charCodeAt(0);
				if (ch == 32 || ch == 10 || ch == 13 || ch == 9 ) {
					text += c;
					continue;
				}
				if (lookAhead(x, i, 2) == "//") {
					text += "<span style='color:green'>";	
					pos = x.substr(i).indexOf("\n");
					if (pos == -1) {
						text += x.substr(i); 
						i = x.length;
					} else {
						text += x.substr(i,pos + 2);
						i += pos + 1;
					}	
					text += "</span>"
					continue;
				}
				if (lookAhead(x, i, 2) == "/*") {
					text += "<span style='color:green'>";	
					pos = x.substr(i).indexOf("*/");
					if (pos == -1) {
						text += x.substr(i); 
						i = x.length;
					} else {
						text += x.substr(i,pos + 2);
						i += pos + 1;
					}	
					text += "</span>"
					continue;
				}
				if (c == "&") {
					pos = x.substr(i).indexOf(";");
					if (pos == -1) {
						text += x.substr(i); 
						i = x.length;
					} else {
						text += x.substr(i,pos + 1);
						i += pos;
					}	
					continue;
				}
				if (c == "'" || c == '"') {
					text += "<span style='color:mediumblue'>";	
					pos = x.substr(i+1).indexOf(c);
					if (pos == -1) {
						text += x.substr(i); 
						i = x.length;
					} else {
						text += x.substr(i, pos + 2);
						i += pos + 1;
					}	
					text += "</span>"
					continue;
				}
				if (lookAhead(x, i, 4) == "<br>") {
					i += 3;
					text += "<br>";
					continue
				}
				ele = lookWord(x, i);
				if (ele) {
					if (ele =="true" || ele == "false" || ele == "null" || isNaN(ele) == false) {	
						text += "<span style='color:mediumblue'>" + x.substr(i,ele.length) + "</span>";
						i += ele.length - 1;
						status = "";
						continue;
					}
					for (k = 0; k < jsArr.length; k++) {
						if (ele == jsArr[k]) {
							text += "<span style='color:brown'>" + x.substr(i,ele.length) + "</span>";
							i += ele.length - 1;
							status = "SPW";
							break;
						}	
					}
					if (status == "SPW") {
						status = "";
						continue;	 
					} else {
						text += x.substr(i, ele.length);
						i += ele.length - 1;
						continue;
					}
				}
				text += c;
			}
			z.innerHTML = text;
			z.setAttribute("data-jscode", "done");
		}
	}

}; // End-jscodecolors
