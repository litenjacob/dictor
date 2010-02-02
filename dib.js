/**
 * @author Jacob Waller
 */


//http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&q=hello%20world&langpair=en|it&callback=dictor
//http://www.google.com/uds/samples/language/detect.html
//http://www.google.com/uds/samples/language/branding.html
//TODO: z-indexes!
//TODO: text-input too
//TODO: fix font-sizes
//TODO: we never want to hijack links containing only numbers
//TODO: fix multipicker color and check integrity of node
//TODO: fix first node offset

var dictor = {
	dom: {}, // this is filled by init
	vars: {
		spans: null, 
		from: null, 
		to: null, 
		translated: false, 
		threshold: 500, 
		multi: false, 
		toLangCode: (window['dictorOpts'] != undefined ? dictorOpts.lang : null) || (window['navigator'] != undefined && navigator['language'] ? navigator.language.substring(0,2) : 'en'), 
		timer: null, 
		panelsIsVisible: true, 
		dragging: false,
		offset: null,
		iphone: navigator.userAgent.match(/iPhone|iPod/i),
		eventCache: []	
	},
	eventBridge: {
		touchstart:  'ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown',
		touchmove:  'ontouchmove' in document.documentElement ? 'touchmove' : 'mousemove',
		touchend:  'ontouchend' in document.documentElement ? 'touchend' : 'mouseup'
	},
	init: function(){
		// localize often used dictor properties
		var vars = dictor.vars;
		var dom = dictor.dom;
		var utils = dictor.utils;
		
		var before = (new Date()).getTime() / 1000;
		dom.body = document.getElementsByTagName('body')[0];
		if (dom.body.className.match(/dictorized/)) { // already dictorized?
			return false; 
		} else {
			dictor.utils.addClass(dictor.dom.body, "dictorized");
		} 
		
		utils.addClass(dom.body, vars.iphone ? 'dictor-iphone' : 'dictor-desktop');
		
		
		dom.head = document.getElementsByTagName('head')[0];
	
		// link in css
		dom.css = utils.createDictorElem({elemType: 'link', attrs: {type: 'text/css', rel: 'stylesheet', href: 'http://79.99.1.153/dictor/dictor.css?' + new Date().getTime() }, append: dom.head});
		
		// helper method - TODO: should only overwrite if not present
		Array.prototype.map = function(fn){
		    var arr = this, i = 0;
		    this.forEach(function(n){
				arr[i] = fn.call(arr, n, i);
				i++;
		    })
		    return arr;
		}
			
		vars.oldBody = dom.body.innerHTML; // this is used when exiting dictor. not pretty, but works for now
	
		// create translation container
		dom.transc = utils.createDictorElem({className: 'dictorTransc', events: {
				touchstart: function(e){ 
					vars.dragging = true;
					var pos =  utils.findPos(this);
					var e = e['changedTouches'] ? e.changedTouches[0] : e;
					var parentPos = dictor.utils.findPos(e.target.parentNode);
					vars.offset = { x: e.pageX - pos.xs + parentPos.xs, y: e.pageY - pos.ys + parentPos.ys };
				}
			}
		});
		
		// kill links - not a pretty solution, but seems impossible to catch all link taps otherwise :S
		var as = Array.prototype.slice.call(document.getElementsByTagName('a')).map(function(n){
			n.setAttribute('rel', n.getAttribute('href'));
			n.setAttribute('href', '#');
			n.setAttribute('onclick', 'dictor.touch.link(arguments[0], this);'); // ugly truth
		})
		
		// create link
		dom.link = utils.createDictorElem({elemType: 'a', className: 'dictorLink'});
		dom.dictorContainer = utils.createDictorElem({elemType: 'div', className: 'dictorContainer', scroll: {v: 'b', h: 'r', width: 300, height: 45}});
		
		dom.tappables = [
			{className: 'tapExit tappables', content: {text: 'close'}, append: dom.dictorContainer,
				events: {
					touchend: function(e){
						utils.removeElem(dictor.dom.css);
						utils.removeElem(dom.transc);
						utils.removeElem(dom.link);
						utils.removeElem(dom.dictorContainer);
						var as = Array.prototype.slice.call(document.getElementsByTagName('a')).map(function(n){
							n.setAttribute('href', n.getAttribute('rel'));
							n.setAttribute('onclick', ''); // ugly truth
						})
						for(var i = 0; i < dictor.vars.eventCache.length; i++){
							var ev = dictor.vars.eventCache[i];
							ev[0].removeEventListener(ev[1], ev[2], ev[3]);
						}
						utils.removeClass(dictor.dom.body, "dictorized");
						dictor.translation.removeTranslation();
						utils.removeElem(document.getElementById('dictor'));
					}
				}
			},
			{className: 'tapSwitch tappables', content: { text: 'word'}, append: dom.dictorContainer,
				events: {
					touchstart: function(e){
						e.preventDefault();
						e.stopPropagation();
						dictor.translation.changeMode();
					}
				}
			},
			{className: 'tapLang tappables', append: dom.dictorContainer, events: {
					touchstart: function(e){ e.stopPropagation(); } // preventer
				}}	
		].map(utils.createDictorElem);
		
		// branding
		utils.createDictorElem({elemType: 'span', className: 'dictorBranding', content: { html: "translations by: <img src='http://www.google.com/uds/css/small-logo.png' alt='google-logo'/>" }, append: dom.dictorContainer});
		
		// language picker
		var langs = '<select id="langSelect"><option value="ar">العربية</option><option value="bg">български</option><option value="ca">català</option><option value="cs">česky</option><option value="da">Dansk</option><option value="de">Deutsch</option><option value="el">Ελληνικά</option><option value="en">English</option><option value="es">Español</option><option value="fi">suomi</option><option value="fr">Français</option><option value="hi">हिन्दी</option><option value="hr">hrvatski</option><option value="id">Indonesia</option><option value="it">Italiano</option><option value="iw">עברית</option><option value="ja">日本語</option><option value="ko">한국어</option><option value="lt">Lietuvių</option><option value="lv">latviešu</option><option value="nl">Nederlands</option><option value="no">norsk</option><option value="pl">Polski</option><option value="pt">Português</option><option value="ro">Română</option><option value="ru">Русский</option><option value="sk">slovenčina</option><option value="sl">slovenščina</option><option value="sr">српски</option><option value="sv">svenska</option><option value="tl">Filipino</option><option value="uk">українська</option><option value="vi">Tiếng Việt</option><option id="opsvzh-CN" value="zh-CN">中文 (简体)</option><option id="opsvzh-TW" value="zh-TW">中文 (繁體)</option></select>';
		dom.tappables[2].innerHTML = '<div id="toLangContainer" class="langPicker"><span id="toLang" class="langShow">sv</span>' + langs + '</div>';
		var langSelect = document.getElementById('langSelect');
		var toLangLabel = document.getElementById('toLang');
		dictor.utils.addEventListener(langSelect, 'change', function(){
			toLangLabel.textContent = vars.toLangCode = this.value;
			dictor.utils.scrollFix(dom.dictorContainer, {v: 'b', h: 'r', width: 300, height: 45});
		}, false);
		
		// find my lang - not pretty - use something else. xPath?
		for(var i = 0; i < langSelect.options.length; i++){
			if(langSelect.options[i].value == vars.toLangCode){
				langSelect.options[i].selected = true;
				toLangLabel.textContent = vars.toLangCode;
			}
		}
		
		dictor.utils.addEventListener(document, dictor.eventBridge.touchmove, function(e){
			if(vars.dragging){			
				e.preventDefault();
				var e = e['changedTouches'] ? e.changedTouches[0] : e;
				dictor.dom.transc.style.top = (e.pageY - vars.offset.y) + 'px';
				dictor.dom.transc.style.left = (e.pageX - vars.offset.x) + 'px';
			}
		}, false)
		
		if(vars.iphone){
			// touchmove hides panels
			dictor.utils.addEventListener(document, dictor.eventBridge.touchmove, function(e){
				if (vars.panelsIsVisible && !vars.dragging) {
					utils.addClass(dom.body, 'dictorHide');
					vars.panelsIsVisible = false;
				}
			}, false)
			dictor.utils.addEventListener(document, "scroll", function(){
				utils.removeClass(dom.body, 'dictorHide');
				vars.panelsIsVisible = true;
			}, false)
		}
		
		dictor.utils.addEventListener(document, 'keydown', function(e){
			if(e.keyCode == 18){
				dictor.translation.changeMode();
			}
		}, false);

		dictor.utils.addEventListener(document, dictor.eventBridge.touchend, function(e){
			dictor.vars.dragging = false;
		}, false)
		
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
			if(vars.translated.length){ // did we get anything?
				dictor.translation.getTranslation(tString);
			}
		},
		showLoader: function(rs, rr){
			var transc = dictor.dom.transc;
			var container = dictor.vars.translated[0];
			container.style.position = 'relative';
			container.appendChild(transc);
			
			transc.innerHTML = '<img src="http://79.99.1.153/dictor/pics/ajax-loader.gif" alt="loader"/>';
			
			dictor.utils.addClass(transc, 'visible');
			dictor.vars.timer = setTimeout(function(){
				transc.textContent = 'error';
			}, 12000);
			transc.style.top = (-transc.offsetHeight - 8) + 'px';
			transc.style.left = 0;
			transc.style.minWidth = 0;
			//transc.style.left = (-transc.offsetWidth / 2) + 'px';
			//transc.style.left = (rs - 8) + 'px';
			//transc.style.top = (rr.ys - transc.offsetHeight - 8) + 'px';
		},
		getTranslation: function(tString){
			var utils = dictor.utils;
			var vars = dictor.vars;
			// Positioning row		
			var i = 0, wordPos;
			do {
				wordPos = utils.findPos(vars.translated[i]);
				i++;
			} while(vars.translated[i] && utils.findPos(vars.translated[i]).ys == wordPos.ys);
			
            vars.tWidth = wordPos.xe - utils.findPos(vars.translated[0]).xs;
			
			dictor.translation.showLoader();
			dictor.net.jsonpCall('http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&langpair=|' + dictor.vars.toLangCode + '&context=showTranslation&callback=dictor.net.jsonpExec&q=' + escape(tString));
		},
		showTranslation: function(response, status, error){
			if (status == 200) {
				clearTimeout(dictor.vars.timer);
				var transc = dictor.dom.transc;
				transc.textContent = response.translatedText;
                //transc.style.left = (-transc.offsetWidth / 2) + 'px';
				transc.style.minWidth = dictor.vars.tWidth + 'px';
				transc.style.top = (-transc.offsetHeight - 8) + 'px';
				//dictor.dom.transc.style.position = 'absolute';
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
		},
		changeMode: function(){
			dictor.vars.multi = !dictor.vars.multi;
			dictor.dom.tappables[1].innerHTML = dictor.vars.multi ? 'multi' : 'word';
		}
	},
	touch: {
		link: function(e, elem){
			// if we're touching a link, show linkhelper to make it 'clickable'
			e.preventDefault();
			var link = dictor.dom.link;
			var p = dictor.utils.findPos(elem);
			link.textContent = "Goto: " + elem.textContent;
			link.setAttribute('href', elem.getAttribute('rel'));
			link.style.left = (p.xs - 8) + 'px';
			link.style.top = (p.ye + 8) + 'px';
			dictor.utils.addClass(link, 'visible');
			link.isVisible = true;
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
		
			
			if(dictor.dom.link.isVisible){  //TODO: should this be here?
				dictor.dom.link.isVisible = false;
				utils.removeClass(dictor.dom.link, 'visible');
			}
		}
	},
	dictorize: function(arr){	// magically wraps all words in dictor spans
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
			dictor.utils.addEventListener(n, touchdownEvent, touchdownFunc, false);
			return n;
		});
	
	},
	utils: {
		addEventListener: function(node, event, func, type){
			node.addEventListener(event, func, type);
			dictor.vars.eventCache.push(arguments);
		},
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
				dictor.utils.addEventListener(document, "scroll", function(){
					dictor.utils.scrollFix(elem, opts.scroll); 
				}, false);
				dictor.utils.scrollFix(elem, opts.scroll); // Prime-time
			}
			if(opts.events){
				for(var event in opts.events){
					dictor.utils.addEventListener(elem, dictor.eventBridge[event] || event, opts.events[event], false);
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
		scrollFix: function(elem, o){
			if(dictor.vars.iphone){
				var width = o.width * (window.innerWidth / 320);
				var height = o.height * (window.innerHeight / 380);	
				var fromTop = 0, fromLeft = 0;
				if(o.v == 'b') { fromTop = window.innerHeight - height }
				if(o.h == 'r') { fromLeft = window.innerWidth - width }
				
				elem.style.top = (window.pageYOffset + fromTop - 1) + 'px';
				elem.style.left = ( window.pageXOffset + fromLeft - 1) + 'px';
				elem.style.width = width + 'px'; 
				elem.style.height = height + 'px';
				elem.style.fontSize = (height * 0.33) + 'px';
			}
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
		            curleft += obj.offsetLeft - obj.scrollLeft;
		            curtop += obj.offsetTop - obj.scrollTop;
		        }
		        while (obj = obj.offsetParent);
		    }
		    return {
		        xs: curleft,
		        ys: curtop,
				xe: curleft + origObj.offsetWidth,
				ye: curtop + origObj.offsetHeight
		    }; 
		},
		removeElem: function(elem){
			elem.parentNode.removeChild(elem);
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

// bootstrapper
(function(){

	// fix different behaviours
	var relativeWhat = (/safari|opera/i).test(navigator.userAgent) ? { x: 'pageX', y: 'pageY' } : { x: 'clientX', y: 'clientY' };
	
	var elem = null;
	var time = 0;
	var point = {};
	document.getElementsByTagName('body')[0].addEventListener('ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown', function(e){
		var eTarget = e.srcElement || e.originalTarget;
		if(eTarget.nodeType == 3){
			eTarget = eTarget.parentNode;
		}
		//if(eTarget.className.indexOf('dictor') != -1){ return false; } // <--- what about this?
		if(window['dictor'] != undefined && dictor.vars.translated.length){
			dictor.translation.removeTranslation();
		}
		
		var ep = e['touches'] ? e.touches[0] : e;
		if(eTarget == elem && new Date().getTime() - time < 500){
			function sendToDictor(elem, point, e){
				dictor.dictorize([elem]);
				
				var firstElem = document.elementFromPoint(point.x, point.y);
				var secondElem = document.elementFromPoint(ep[relativeWhat.x], ep[relativeWhat.y]);
				
				if(firstElem == secondElem){
					dictor.touch.dictorElemTouchdown(e, firstElem);
					dictor.touch.dictorElemTouchdown(e, secondElem);
				}
			}
			
			if(window['dictor'] != undefined){
				sendToDictor(elem, point, e);
			} else {
				var s=document.createElement('script');
				s.type='text/javascript';
				s.charset = 'utf-8';
				s.src='http://79.99.1.153/dictor/dib.js?' + (new Date()).getTime();
				s.id='dictor';
				document.getElementsByTagName("head")[0].appendChild(s);
				s.onreadystatechange = function(){
				    if (script.readyState == 'loaded' || script.readyState == 'complete') {
				        sendToDictor(elem, point, e);
				    }   
				}
				s.onload = function(){
					sendToDictor(elem, point, e);
				    return;   
				}
			}
		}
		elem = eTarget;
		time = new Date().getTime();
		point.x = ep[relativeWhat.x];
		point.y = ep[relativeWhat.y];
		return false;
	}, false)	
})();



 
