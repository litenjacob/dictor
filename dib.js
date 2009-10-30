/*
 * elementFromPoint is the shit
 * possible to only have mousedown (touchdown) listener on document and get originaltarget from it?
 * then see if doubleclick, and if so feed to dictorizer
 * also see if targetElem hasClass dictor
 * 
 * Check howto create FF plugin
 * Use rgba for background and border
 */

/**
 * @author jacob
 */
//http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&q=hello%20world&langpair=en|it&callback=dictor
//http://www.google.com/uds/samples/language/detect.html
//http://www.google.com/uds/samples/language/branding.html
//http://code.google.com/intl/sv-SE/apis/ajaxlanguage/documentation/#Examples

//TODO: branding!
//TODO: set bubble offset to rowheight
//TODO: fix panel sizes
//TODO: fix text size
//TODO: check body.innerHTML length and allow dictorizeAll only if machine fast enough


var dictor = {
	dom: {}, // this is filled by init
	vars: {
		spans: null, 
		from: null, 
		to: null, 
		translated: false, 
		threshold: 500, 
		multi: false, 
		width: null, 
		rs: null, 
		rr: null, 
		toLangCode: (window['dictorOpts'] != undefined ? dictorOpts.lang : null) || 'en', 
		timer: null, 
		panelsIsVisible: true, 
		fixes: false,
		containerTags: ['DIV', 'P', 'H1', 'H2', 'H3']	
	},
	eventBridge: {
		touchstart:  'ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown'
	},
	init: function(){
		// localize often used dictor properties
		var vars = dictor.vars;
		var dom = dictor.dom;
		var utils = dictor.utils;
		
		var before = (new Date()).getTime() / 1000;
		dom.body = document.getElementsByTagName('body')[0];
		if (dom.body.className.match(/dictorized/)) { return false; } // already dictorized?
		
		dom.head = document.getElementsByTagName('head')[0];
	
		// link in css
		utils.createDictorElem({elemType: 'link', attrs: {type: 'text/css', rel: 'stylesheet', href: 'http://79.99.1.153/dictor/dictor.css'}, append: dom.head});
		
		// helper method
		Array.prototype.map = function(fn){
		    var arr = this, i = 0;
		    this.forEach(function(n){
				arr[i] = fn.call(arr, n, i);
				i++;
		    })
		    return arr;
		}
			
		vars.oldBody = dom.body.innerHTML; // this is used when exiting dictor. not pretty, but works for now
	
		// create link
		dom.link = utils.createDictorElem({elemType: 'a', className: 'dictorLink'});
		dom.dictorContainer = utils.createDictorElem({elemType: 'div', className: 'dictorContainer', scroll: {v: 'b', h: 'r', width: 300, height: 45}});
	
		// create translation container
		dom.transc = utils.createDictorElem({className: 'dictorTransc'});
		
		// kill links - not a pretty solution, but seems impossible to catch all link taps otherwise :S
		var as = Array.prototype.slice.call(document.getElementsByTagName('a')).map(function(n){
			n.setAttribute('rel', n.getAttribute('href'));
			n.setAttribute('href', '#');
			n.addEventListener(dictor.eventBridge.touchdown, function(e){
				e.preventDefault(); // to prevent link jumping - works, but is it right?
			}, false);	
		})
		
		dom.tappables = [
			{className: 'tapPick tappables', content: {text: 'dictorize'}, append: dom.dictorContainer, 
				events: {
					touchstart: function(e){
						console.log('pickem');
					}
				}
			},
			{className: 'tapExit tappables', content: {text: 'x'}, append: dom.dictorContainer,
				events: {
					touchstart: function(e){
						dom.body.innerHTML = vars.oldBody;
					}
				}
			},
			{className: 'tapSwitch tappables', append: dom.dictorContainer,
				events: {
					touchstart: function(e){
						e.preventDefault();
						if(utils.hasClass(this, 'multi')){
							utils.removeClass(this, 'multi');
							vars.multi = false;
						} else {
							utils.addClass(this, 'multi');
							vars.multi = true;
						}
					}
				}
			},
			{className: 'tapLang tappables', append: dom.dictorContainer}	
		].map(utils.createDictorElem);
		
		// language picker
		var langs = '<select id="langSelect"><option value="ar">العربية</option><option value="bg">български</option><option value="ca">català</option><option value="cs">česky</option><option value="da">Dansk</option><option value="de">Deutsch</option><option value="el">Ελληνικά</option><option value="en">English</option><option value="es">Español</option><option value="fi">suomi</option><option value="fr">Français</option><option value="hi">हिन्दी</option><option value="hr">hrvatski</option><option value="id">Indonesia</option><option value="it">Italiano</option><option value="iw">עברית</option><option value="ja">日本語</option><option value="ko">한국어</option><option value="lt">Lietuvių</option><option value="lv">latviešu</option><option value="nl">Nederlands</option><option value="no">norsk</option><option value="pl">Polski</option><option value="pt">Português</option><option value="ro">Română</option><option value="ru">Русский</option><option value="sk">slovenčina</option><option value="sl">slovenščina</option><option value="sr">српски</option><option value="sv">svenska</option><option value="tl">Filipino</option><option value="uk">українська</option><option value="vi">Tiếng Việt</option><option id="opsvzh-CN" value="zh-CN">中文 (简体)</option><option id="opsvzh-TW" value="zh-TW">中文 (繁體)</option></select>';
		dom.tappables[3].innerHTML = '<div id="toLangContainer" class="langPicker"><span id="toLang" class="langShow">sv</span>' + langs + '</div>';
		var langSelect = document.getElementById('langSelect');
		var toLangLabel = document.getElementById('toLang');
		langSelect.addEventListener('change', function(){
			toLangLabel.textContent = toLangCode = this.value;
		}, false);
		
		// find my lang - not pretty - use something else. xPath?
		for(var i = 0; i < langSelect.options.length; i++){
			if(langSelect.options[i].value == vars.toLangCode){
				langSelect.options[i].selected = true;
				toLangLabel.textContent = vars.toLangCode;
			}
		}
		
		// Support for picking certain containers
		vars.isPicking = false;
		var pickMenuUL = utils.createDictorElem({elemType: 'ul', className: 'pickMenu', append: dom.tappables[0]});
		var pickMenuAll = utils.createDictorElem({elemType: 'li', className: 'pickable pickAll', append: pickMenuUL, content: {'text' : 'all'},
			events: {
				touchstart: function(){
					var elems = [];
					Array.prototype.slice.call(dom.body.childNodes).forEach(function(item, arr){ // get all non-dictory elements in body
						if(item.nodeType == 1 && item.className.indexOf('dictor') == -1){
							elems.push(item);
						}	
					}) 
					dictor.dictorize(elems); 
					//console.log(dom.body.childNodes); 
				}
			}
		});
		var pickMenuPick = utils.createDictorElem({elemType: 'li', className: 'pickable pickPick', append: pickMenuUL, content: {'text' : 'pick'}, 
			events: {
				touchstart: dictor.touch.picking
			}
		});
		var pickMenuNone = utils.createDictorElem({elemType: 'li', className: 'pickable pickNone', append: pickMenuUL, content: {'text' : 'none'}});
	
		// touchmove hides panels
		document.addEventListener('touchmove', function(){
			if (vars.panelsIsVisible) {
				utils.addClass(dom.body, 'dictorHide');
				vars.panelsIsVisible = false;
			}
		}, false)
		
		document.addEventListener("scroll", function(){
			utils.removeClass(dom.body, 'dictorHide');
			vars.panelsIsVisible = true;
		}, false)
		
		console.log('oldBodyLenght', vars.oldBody.length);
		
		var after = (new Date()).getTime() / 1000;
		//console.log("Middle took " + (middle - before).toFixed(4) + " seconds");
		console.log("Dictorizing took " + (after - before).toFixed(4) + " seconds");
	},
	translation: {
		getWords: function(e){
			var vars = dictor.vars;
			var dom = dictor.dom;
			var utils = dictor.utils;
			
			utils.removeClass(vars.from, 'flash');
			
			vars.to = vars.to || vars.from;
			// what indexes did we tap?
			var fromClick = dom.spans.indexOf(vars.from);
			var toClick = dom.spans.indexOf(vars.to);
	
			// slice em and dice em!
			vars.translated = dom.spans.slice(Math.min(fromClick, toClick), Math.max(fromClick, toClick) + 1);
			
			// get the string for translation
			tString = vars.translated.slice(0).map(function(n){ utils.addClass(n, "dictorActive"); return n.textContent }).join(" ");
			
			vars.from = vars.to = false;
			dictor.translation.getTranslation(tString);
		},
		showLoader: function(rs, rr){
			var transc = dictor.dom.transc;
			transc.innerHTML = '<img src="http://79.99.1.153/dictor/pics/ajax-loader.gif" alt="loader"/>';
			dictor.utils.addClass(transc, 'visible');
			dictor.vars.timer = setTimeout(function(){
				transc.textContent = 'error';
			}, 12000);
			transc.style.left = (rs - 8) + 'px';
			transc.style.top = (rr.ys - transc.offsetHeight - 8) + 'px';
		},
		getTranslation: function(tString){
			var utils = dictor.utils;
			var vars = dictor.vars;
			
			// Positioning row		
			var i = 0, oldY;
			do {
				oldY = utils.findPos(vars.translated[i]).ys;
				i++;
			} while(vars.translated[i] && utils.findPos(vars.translated[i]).ys == oldY);
			
			rr = utils.findPos(vars.translated[0])
			rs = rr.xs;
			var re = utils.findPos(vars.translated[--i]).xe;
			
			dictor.translation.showLoader(rs, rr);
			dictor.net.jsonpCall('http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&langpair=|' + dictor.vars.toLangCode + '&context=showTranslation&callback=dictor.net.jsonpExec&q=' + escape(tString));
		},
		showTranslation: function(response, status, error){
			if (status == 200) {
				console.log(response.translatedText);
				clearTimeout(dictor.vars.timer);
				dictor.dom.transc.textContent = response.translatedText;
			}
		},
		removeTranslation: function(){
			if (dictor.vars.translated) {
				dictor.utils.removeClass(dictor.dom.transc, 'visible');
				dictor.vars.translated.map(function(n){
					dictor.utils.removeClass(n, 'dictorActive');
					return false;
				});
				dictor.vars.translated = false;
			}
		}
	},
	touch: {
		picking: function(e){	// What containers to make pickable?
			var dom = dictor.dom;
			var vars = dictor.vars;
			var utils = dictor.utils;
			
			e.stopPropagation();
			if (!vars.isPicking) {
				vars.isPicking = true;
				utils.addClass(dom.body, 'dictorPicking');
				vars.containerTags.forEach(function(item){
					Array.prototype.slice.call(document.getElementsByTagName(item)).forEach(function(obj){
						if (!utils.hasClass(obj, 'dictorContainer')) { // fix all
							utils.addClass(obj, 'dictorPickable');
							obj.addEventListener(dictor.eventBridge.touchstart, function(e){
								e.stopPropagation();
								if (vars.isPicking) { // only if we're picking - should probably remove eventlistener instead
									if (utils.hasClass(obj, 'dictorPicked')) {
										utils.removeClass(obj, 'dictorPicked');
									}
									else {
										utils.addClass(obj, 'dictorPicked');
									}
								}
							}, false);
						}
					});
				})
			} else {
				vars.isPicking = false;
				Array.prototype.slice.call(document.getElementsByClassName('dictorPicked')).forEach(function(obj){
					Array.prototype.slice.call(obj.childNodes).forEach(function(childObj){
						utils.recursiveRemoveClass(childObj);
					});
				})
				
				var pickedElems = Array.prototype.slice.call(document.getElementsByClassName('dictorPicked'));
				pickedElems.forEach(function(item){
					utils.removeClass(item, 'dictorPicked');
				})
				
				Array.prototype.slice.call(document.getElementsByClassName('dictorPickable')).forEach(function(item){
					utils.removeClass(item, 'dictorPickable');
				})
				dictor.dictorize(pickedElems);
			}
			return false;
		},
		dictorElemTouchdown: function(e, elem){  // this could probably be a lot prettier
			e.stopPropagation();
			var elem = elem || this;
			var vars = dictor.vars;
			var utils = dictor.utils;
			
			if(!vars.from){ 
				vars.from = elem;
				vars.from.stamp = new Date().getTime();
			} else {
				if(elem == vars.from && (new Date().getTime() - vars.from.stamp) < vars.threshold){ // did we touch from again in time?
					if (!vars.multi) {
						e.preventDefault();
						dictor.translation.removeTranslation();
						dictor.translation.getWords();
						return false;
					} else {
						e.preventDefault();
						dictor.translation.removeTranslation();
						utils.addClass(vars.from, 'flash');
						vars.from.isActive = true;
						return false;
					}
				} else{
					if(!vars.multi){
						vars.from = elem;
						vars.from.stamp = new Date().getTime();
					} else {
						if (elem == vars.from) {
							utils.removeClass(vars.from, 'flash');
							vars.from = false;
						}
						else {
							if (vars.from.isActive) {
								if (!vars.to) {
									vars.to = elem;
									vars.to.stamp = new Date().getTime();
								}
								else {
									if (elem == vars.to && (new Date().getTime() - vars.to.stamp) < vars.threshold) {
										e.preventDefault();
										dictor.translation.removeTranslation();
										dictor.translation.getWords();
										return false;
									} else {
										vars.to = elem;
										vars.to.stamp = new Date().getTime();
									}
								}
							} else {
								vars.from = elem;
								vars.from.stamp = new Date().getTime();
							}
						}
					}
				}
			}
			
			var link = dictor.dom.link;
			// if we're touching a link, show linkhelper to make it 'clickable'
			if (elem.parentNode.nodeName == 'A') {	
				var p = utils.findPos(elem);
				var a = elem.parentNode;
				link.textContent = "Goto: " + a.textContent;
				link.setAttribute('href', a.getAttribute('rel'));
				link.style.left = (p.xs - 4) + 'px';
				link.style.top = (p.ys - elem.offsetHeight - 4) + 'px';
				utils.addClass(link, 'visible');
				link.isVisible = true;
				link.location = utils.findPos(link); //TODO: necessary?
				e.preventDefault();
				return false;
			}
			
			if(link.isVisible){  //TODO: should this be here?
				link.isVisible = false;
				utils.removeClass(link, 'visible');
			}
		}
	},
	dictorize: function(arr){	// magically wraps all words in dictor spans
		dictor.utils.addClass(dictor.dom.body, "dictorized");
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
		
		var touchdownEvent = dictor.eventBridge['touchstart'];
		var touchdownFunc = dictor.touch.dictorElemTouchdown;
		// get all spans into variable and bind touchevents - this doesn't seem to be slower than binding using ontouchstart or even adding the ontouchstart on tag creation :) 
		dictor.dom.spans = Array.prototype.slice.call(document.getElementsByClassName('dictor')).map(function(n){
			n.addEventListener(touchdownEvent, touchdownFunc, false);
			return n;
		});
	
	},
	utils: {
		createDictorElem: function(opts){
			var elem = document.createElement(opts.elemType || 'div');
			elem.className = opts.className || '';
			if(opts.attrs){
				for(var prop in opts.attrs){
					elem.setAttribute(prop, opts.attrs[prop]);
				}
			}
			if(opts.append !== false && opts.append !== 0){
				opts.append = opts.append || dictor.dom.body;
				opts.append.appendChild(elem);
			}
			if(opts.scroll){
				document.addEventListener("scroll", function(){
					dictor.utils.scrollFix(elem, opts.scroll); 
				}, false);
				dictor.utils.scrollFix(elem, opts.scroll); // Prime-time
			}
			if(opts.events){
				for(var event in opts.events){
					elem.addEventListener(dictor.eventBridge[event] || event, opts.events[event], false);
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
		},
		recursiveRemoveClass: function(obj){
			if (obj.childNodes.length) {
				Array.prototype.slice.call(obj.childNodes).forEach(function(childObj){
					if (childObj.nodeType != 3 && childObj.childNodes.length) {
						dictor.utils.recursiveRemoveClass(childObj);
					}
					if (dictor.vars.containerTags.indexOf(obj.nodeName) != -1) {
						dictor.utils.removeClass(obj, 'dictorPicked');
					}
				})
			}
		},
		scrollFix: function(elem, o){
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
		},
		addClass: function(elem, newClass){
			elem.className = (elem.className == "" ? "" : elem.className + " ") + newClass;
		},
		removeClass: function(elem, oldClass){
			elem.className = elem.className.replace(new RegExp("(\\s|^)" + oldClass + "(\\s|$)"), '');
		},  
		hasClass: function(elem, testClass){
			return elem.className.match(new RegExp("(\\s|^)" + testClass + "(\\s|$)"))
		},
		findPos: function(obj){	// Heavily based on code courtsey of Peter-Paul Koch 
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
	},
	net: {
		jsonpCall: function(src){
			var s=document.createElement('script');
			s.id = 'JSONP';
			s.type='text/javascript';
			s.src= src;
			dictor.dom.head.appendChild(s);
		},
	
		jsonpExec: function(){
			var args = Array.prototype.slice.call(arguments);
			var func = args.shift();
			dictor.translation[func].apply(dictor, args);
			
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
	}
}

dictor.init();

//console.log(dictor);
/*var ps = document.getElementsByTagName('p');
for(var i = 0; i < ps.length; i++){
	ps[i].addEventListener(dictor.eventBridge.touchstart, function(e){
		var elem = document.elementFromPoint(e.pageX, e.pageY);
		console.log(elem);
		dictor.dictorize([elem]);
		var newElem = document.elementFromPoint(e.pageX, e.pageY);
		console.log(newElem);
	}, false);
}*/








 
