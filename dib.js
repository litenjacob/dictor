/**
 * @author jacob
 */
//http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&q=hello%20world&langpair=en|it&callback=dictor
//http://www.google.com/uds/samples/language/detect.html
//http://www.google.com/uds/samples/language/branding.html
//http://code.google.com/intl/sv-SE/apis/ajaxlanguage/documentation/#Examples

//TODO: fix structure
//TODO: objectify?
//TODO: branding!
//TODO: set bubble offset to rowheight
//TODO: fix panel sizes
//TODO: fix text size
//TODO: make containers pickable for dictorizing


var dictor = init();

function init(){
	var dictorContext = this;
	
	var dictorEvents = {
		touchstart:  'ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown'
	}
	
	var before = (new Date()).getTime() / 1000;
	var body = document.getElementsByTagName('body')[0];
	if (body.className.match(/dictorized/)) { return false; } // already dictorized?
	
	var head = document.getElementsByTagName('head')[0];
	
	// link in css
	var css = document.createElement('link');
	css.setAttribute('rel', 'stylesheet');
	css.type = "text/css";
	css.setAttribute('href', 'http://79.99.1.153/dictor/dictor.css');
	head.appendChild(css);
	
	// helper method
	Array.prototype.map = function(fn){
	    var arr = this, i = 0;
	    this.forEach(function(n){
			arr[i] = fn.call(arr, n, i);
			i++;
	    })
	    return arr;
	}
	
	// init semi-global variables
	var spans, from, to, translated = false, over = false, threshold = 500, multi = false, width, rs, rr, toLangCode = (dictor != undefined ? dictor.lang : null) || 'en', timer, panelsIsVisible = true, fixes = false;	
			
	var oldBody = body.innerHTML; // this is used when exiting dictor. not pretty, but works for now
	
	// create link
	var link = createDictorElem({elemType: 'a', className: 'dictorLink'});
	var dictorContainer = createDictorElem({elemType: 'div', className: 'dictorContainer', anim: 1, scroll: {v: 'b', h: 'r', width: 300, height: 45}});

	// create translation container
	var transc = createDictorElem({className: 'dictorTransc'});
	
	// magically wraps all words in dictor spans
	function dictorize(arr){
		addClass(body, "dictorized");
		arr.forEach(function(baseNode){
			baseNode.innerHTML = baseNode.innerHTML.split(/[<>]/).map(function(n, i){
				if (i % 2) {
					return "<" + n + ">";
				}
				else {
					return n.replace(/([^\s]+)/gi, '<span class="dictor">$1</span>');
				}
			}).join("");
		})
		
		// get all spans into variable and bind touchevents - this doesn't seem to be slower than binding using ontouchstart or even adding the ontouchstart on tag creation :) 
		spans = Array.prototype.slice.call(document.getElementsByClassName('dictor')).map(function(n){
			n.addEventListener(dictorEvents['touchstart'], touchdown, false);
			return n;
		});
	}
	
	var middle = (new Date()).getTime() / 1000;
	
	// kill links - not a pretty solution, but seems impossible to catch all link taps otherwise :S
	var as = Array.prototype.slice.call(document.getElementsByTagName('a')).map(function(n){
		n.setAttribute('rel', n.getAttribute('href'));
		n.setAttribute('href', '#');	
	})
	
	var tappables = [
		{className: 'tapPick tappables', content: {text: 'dictorize'}, append: dictorContainer, 
			events: {
				touchstart: function(e){
					console.log('pickem');
				}
			}
		},
		{className: 'tapExit tappables', content: {text: 'x'}, append: dictorContainer,
			events: {
				touchstart: function(e){
					body.innerHTML = oldBody;
				}
			}
		},
		{className: 'tapSwitch tappables', append: dictorContainer,
			events: {
				touchstart: function(e){
					e.preventDefault();
					if(hasClass(this, 'multi')){
						removeClass(this, 'multi');
						multi = false;
					} else {
						addClass(this, 'multi');
						multi = true;
					}
				}
			}
		},
		{className: 'tapLang tappables', append: dictorContainer}	
	].map(createDictorElem);
	
	// language picker
	var langs = '<select id="langSelect"><option value="ar">العربية</option><option value="bg">български</option><option value="ca">català</option><option value="cs">česky</option><option value="da">Dansk</option><option value="de">Deutsch</option><option value="el">Ελληνικά</option><option value="en">English</option><option value="es">Español</option><option value="fi">suomi</option><option value="fr">Français</option><option value="hi">हिन्दी</option><option value="hr">hrvatski</option><option value="id">Indonesia</option><option value="it">Italiano</option><option value="iw">עברית</option><option value="ja">日本語</option><option value="ko">한국어</option><option value="lt">Lietuvių</option><option value="lv">latviešu</option><option value="nl">Nederlands</option><option value="no">norsk</option><option value="pl">Polski</option><option value="pt">Português</option><option value="ro">Română</option><option value="ru">Русский</option><option value="sk">slovenčina</option><option value="sl">slovenščina</option><option value="sr">српски</option><option value="sv">svenska</option><option value="tl">Filipino</option><option value="uk">українська</option><option value="vi">Tiếng Việt</option><option id="opsvzh-CN" value="zh-CN">中文 (简体)</option><option id="opsvzh-TW" value="zh-TW">中文 (繁體)</option></select>';
	tappables[3].innerHTML = '<div id="toLangContainer" class="langPicker"><span id="toLang" class="langShow">sv</span>' + langs + '</div>';
	var langSelect = document.getElementById('langSelect');
	var toLangLabel = document.getElementById('toLang');
	langSelect.addEventListener('change', function(){
		toLangLabel.textContent = toLangCode = this.value;
	}, false);
	
	// find my lang - not pretty - use something else. xPath?
	for(var i = 0; i < langSelect.options.length; i++){
		if(langSelect.options[i].value == toLangCode){
			langSelect.options[i].selected = true;
			toLangLabel.textContent = toLangCode;
		}
	}
	
	// Support for picking certain containers
	var isPicking = false;
	var pickMenuUL = createDictorElem({elemType: 'ul', className: 'pickMenu', append: tappables[0]});
	var pickMenuAll = createDictorElem({elemType: 'li', className: 'pickable pickAll', append: pickMenuUL, content: {'text' : 'all'},
		events: {
			touchstart: function(){ dictorize([body]); }
		}
	});
	var pickMenuPick = createDictorElem({elemType: 'li', className: 'pickable pickPick', append: pickMenuUL, content: {'text' : 'pick'}, 
		events: {
			touchstart: picking
		}
	});
	var pickMenuNone = createDictorElem({elemType: 'li', className: 'pickable pickNone', append: pickMenuUL, content: {'text' : 'none'}});
	
	// What containers to make pickable?
	var containerTags = ['DIV', 'P', 'H1', 'H2', 'H3'];
	function picking(e){
		e.stopPropagation();
		if (!isPicking) {
			isPicking = true;
			addClass(body, 'dictorPicking');
			containerTags.forEach(function(item){
				Array.prototype.slice.call(document.getElementsByTagName(item)).forEach(function(obj){
					if (!hasClass(obj, 'dictorContainer')) { // fix all
						addClass(obj, 'dictorPickable');
						obj.addEventListener(dictorEvents['touchstart'], function(e){
							e.stopPropagation();
							if (isPicking) { // only if we're picking - should probably remove eventlistener instead
								if (hasClass(obj, 'dictorPicked')) {
									removeClass(obj, 'dictorPicked');
								}
								else {
									addClass(obj, 'dictorPicked');
								}
							}
						}, false);
					}
				});
			})
		} else {
			isPicking = false;
			Array.prototype.slice.call(document.getElementsByClassName('dictorPicked')).forEach(function(obj){
				Array.prototype.slice.call(obj.childNodes).forEach(function(childObj){
					recursiveRemoveClass(childObj);
				});
			})
			dictorize(Array.prototype.slice.call(document.getElementsByClassName('dictorPicked')));
		}
		return false;
	}
	
	function recursiveRemoveClass(obj){
		if (obj.childNodes.length) {
			Array.prototype.slice.call(obj.childNodes).forEach(function(childObj){
				if (childObj.nodeType != 3 && childObj.childNodes.length) {
					recursiveRemoveClass(childObj);
				}
				if (containerTags.indexOf(obj.nodeName) != -1) {
					removeClass(obj, 'dictorPicked');
				}
			})
		}
	}
	
	function createDictorElem(opts){
		var elem = document.createElement(opts.elemType || 'div');
		elem.className = opts.className || '';
		if(opts.append !== false && opts.append !== 0){
			opts.append = opts.append || body;
			opts.append.appendChild(elem);
		}
		if(opts.scroll){
			document.addEventListener("scroll", function(){
				scrollFix(elem, opts.scroll); 
			}, false);
			scrollFix(elem, opts.scroll); // Prime-time
			
		}
		if(opts.anim){
			//addClass(elem, 'animTopLeft');
		}
		if(opts.events){
			for(var event in opts.events){
				elem.addEventListener(dictorEvents[event] || event, opts.events[event], false);
			}
		}
		if(opts.content){
			if(opts.content.text){
				elem.textContent = opts.content.text;
			} else if(opts.content.html){
				elem.innerHTML = opts.content.html;
			}
		}
		return elem;
	}
	
	function touchdown(e){  // this could probably be a lot prettier
		if(!from){ 
			from = this;
			from.stamp = new Date().getTime();
		} else { 
			if(this == from && (new Date().getTime() - from.stamp) < threshold){ // did we touch from again in time?
				if (!multi) {
					e.preventDefault();
					removeTrans();
					translate();
					return false;
				} else {
					e.preventDefault();
					removeTrans();
					addClass(from, 'flash');
					from.isActive = true;
					return false;
				}
			} else{
				if(!multi){
					from = this;
					from.stamp = new Date().getTime();
				} else {
					if (this == from) {
						removeClass(from, 'flash');
						from = false;
					}
					else {
						if (from.isActive) {
							if (!to) {
								to = this;
								to.stamp = new Date().getTime();
							}
							else {
								if (this == to && (new Date().getTime() - to.stamp) < threshold) {
									e.preventDefault();
									removeTrans();
									translate();
									return false;
								} else {
									to = this;
									to.stamp = new Date().getTime();
								}
							}
						} else {
							from = this;
							from.stamp = new Date().getTime();
						}
					}
				}
			}
		}
		
		// if we're touching a link, show linkhelper to make it 'clickable'
		if (this.parentNode.nodeName == 'A') {
			var p = findPos(this);
			var a = this.parentNode;
			link.textContent = "Goto: " + a.textContent;
			link.setAttribute('href', a.getAttribute('rel'));
			link.style.left = (p.xs - 4) + 'px';
			link.style.top = (p.ys - this.offsetHeight - 4) + 'px';
			addClass(link, 'visible');
			link.isVisible = true;
			link.location = findPos(link); //TODO: necessary?
			return false;
		}
		
		if(link.isVisible){  //TODO: should this be here?
			link.isVisible = false;
			removeClass(link, 'visible');
		}
	}
	
	// touchmove hides panels
	document.addEventListener('touchmove', function(){
		if (panelsIsVisible) {
			addClass(body, 'dictorHide');
			panelsIsVisible = false;
		}
	}, false)
	
	document.addEventListener("scroll", function(){
		removeClass(body, 'dictorHide');
		panelsIsVisible = true;
	}, false)
	
	function removeTrans(){
		if (translated) {
			removeClass(transc, 'visible');
			translated.map(function(n){
				removeClass(n, 'dictorActive');
				return false;
			});
			translated = false;
		}
	}
	
	function translate(e){
		removeClass(from, 'flash');
		
		to = to || from;
		// what indexes did we tap?
		var fromClick = spans.indexOf(from);
		var toClick = spans.indexOf(to);

		// slice em and dice em!
		translated = spans.slice(Math.min(fromClick, toClick), Math.max(fromClick, toClick) + 1);
		
		// get the string for translation
		tString = translated.slice(0).map(function(n){ addClass(n, "dictorActive"); return n.textContent }).join(" ");
		
		jsonpCall('http://ajax.googleapisBAJS.com/ajax/services/language/translate?v=1.0&langpair=|' + toLangCode + '&context=translation&callback=dictor.jsonpExec&q=' + escape(tString));
		
		var i = 0, oldY;
		do {
			oldY = findPos(translated[i]).ys;
			i++;
		} while(translated[i] && findPos(translated[i]).ys == oldY);
		
		rr = findPos(translated[0])
		rs = rr.xs;
		var re = findPos(translated[--i]).xe;
		
		width = re - rs;
		from = to = false;
		
		// show loader
		console.log('b', transc, transc.innerHTML, transc.parentNode);
		transc.innerHTML = '<img src="http://79.99.1.153/dictor/pics/ajax-loader.gif" alt="loader"/>';
		addClass(transc, 'visible');
		timer = setTimeout(function(){
			transc.textContent = 'error';
		}, 12000);
		transc.style.left = (rs - 8) + 'px';
		transc.style.top = (rr.ys - transc.offsetHeight - 8) + 'px';
		console.log(transc, transc.innerHTML);
	}
	
	function scrollFix(elem, o){
		var width = o.width * (window.innerWidth / 320);
		var height = o.height * (window.innerHeight / 380);	
		var fromTop = 0, fromLeft = 0;
		if(o.v == 'b') { fromTop = window.innerHeight - height }
		if(o.h == 'r') { fromLeft = window.innerWidth - width }

		elem.style.top = (window.pageYOffset + fromTop) + 'px';
		elem.style.left = ( window.pageXOffset + fromLeft) + 'px';
		elem.style.width = width + 'px'; 
		elem.style.height = height + 'px';
		elem.style.fontSize = (height * 0.33) + 'px';
	}
	
	function translation(response, status, error){
		if (status == 200) {
			console.log(response.translatedText);
			clearTimeout(timer);
			transc.textContent = response.translatedText;
			/*transc.style.width = width + 'px';*/
			
		}
	}
	
	function jsonpCall(src){
		var s=document.createElement('script');
		s.id = 'JSONP';
		s.type='text/javascript';
		s.src= src;
		head.appendChild(s);
	}
	
	function jsonpExec(){
		var args = Array.prototype.slice.call(arguments);
		var func = args.shift();
		dictor[func].apply(dictorContext, args);
		
		// Remove any old script tags.  // Courtsey of Neil Fraser
		var script;
		while (script = document.getElementById('JSONP')) {
			script.parentNode.removeChild(script);
		    // Browsers won't garbage collect this object.
		    // So castrate it to avoid a major memory leak.
		    for (var prop in script) {
		    	delete script[prop];
		    }
		}
	}
	
	function addClass(elem, newClass){
		elem.className = (elem.className == "" ? "" : elem.className + " ") + newClass;
	}

	function removeClass(elem, oldClass){
		elem.className = elem.className.replace(new RegExp("(\\s|^)" + oldClass + "(\\s|$)"), '');
	}  
	
	function hasClass(elem, testClass){
		return elem.className.match(new RegExp("(\\s|^)" + testClass + "(\\s|$)"))
	}
	 
	// Heavily based on code courtsey of Peter-Paul Koch 
	function findPos(obj){
		var origObj = obj;
	    var curleft = curtop = 0;
	    if (obj.offsetParent) {
	        do {
	            curleft += obj.offsetLeft;
	            curtop += obj.offsetTop;
	        }
	        while (obj = obj.offsetParent);
	    }
	
	    return {
	        xs: curleft,
	        ys: curtop,
			xe: curleft + origObj.offsetWidth,
			ye: curtop + origObj.offsetHeight
	    };
	    
	}
	
	var after = (new Date()).getTime() / 1000;
	console.log("Middle took " + (middle - before).toFixed(4) + " seconds");
	console.log("Dictorizing took " + (after - before).toFixed(4) + " seconds");
	
	return { // must return all funcs to be remotely executed
		translation: translation,
		jsonpExec: jsonpExec,
		spans: spans
	};
}
 
