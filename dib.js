/**
 * @author jacob
 */
//http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&q=hello%20world&langpair=en|it&callback=dictor
//http://www.google.com/uds/samples/language/detect.html
//http://www.google.com/uds/samples/language/branding.html
//http://code.google.com/intl/sv-SE/apis/ajaxlanguage/documentation/#Examples

//TODO: fix structure
//TODO: make it exitable
//TODO: make possible to choose language
//TODO: make it fill in lang of page as from lang
//TODO: objectify?


//window.onload = init;
var translation = init();

function init(){
	var before = (new Date()).getTime() / 1000;
	var body = document.getElementsByTagName('body')[0];
	if (body.className.match(/dictorized/)) { return false; } // already dictorized?
	
	// append css
	var head = document.getElementsByTagName('head')[0]; // Change to link href
	var dictorCSS = document.createElement('style');
	dictorCSS.type = "text/css";
	dictorCSS.textContent = '.dictorTransc {position: absolute; display: none;} .dictorLink.visible, .dictorTransc.visible {display: block;} .dictorLink.hover { color: #f00;} .dictorLink {position:absolute; display:none;} .dictor {cursor:pointer;margin:0;padding:0;} .dictorActive {text-shadow: 0px 0px 2px #22aaff, 0px 0px 4px #22aaff; 0px 0px 8px #22aaff;}';
	head.appendChild(dictorCSS);
	
	// helper method
	Array.prototype.map = function(fn){
	    var arr = this, i = 0;
	    this.forEach(function(n){
			arr[i] = fn.call(arr, n, i);
			i++;
	    })
	    return arr;
	}
				
	// magically wraps all words in dictor spans
	var oldBody = body.innerHTML;
	addClass(body, "dictorized");
	body.innerHTML = body.innerHTML.split(/[<>]/).map(function(n, i){
		if (i % 2) { return "<" + n + ">"; }
		else { return n.replace(/([^\s]+)/gi, '<span class="dictor">$1</span>'); }
	}).join("");
	
	var middle = (new Date()).getTime() / 1000;
	
	// get all spans into variable and bind touchevents
	var spans = Array.prototype.slice.call(document.getElementsByClassName('dictor')).map(function(n){
		//n.ontouchstart = touchdown; //TODO: addEventListener instead
		n.addEventListener('touchstart', touchdown, false);
		return n;
	});
	
	// kill links - not a pretty solution, but seems impossible to catch all link taps :S
	var as = Array.prototype.slice.call(document.getElementsByTagName('a')).map(function(n){
		n.setAttribute('rel', n.getAttribute('href'));
		n.setAttribute('href', '#');	
	})
	
	// create link
	var link = createDictorElem({elemType: 'a', className: 'dictorLink'});
	
	var corners = [
		{className: 'tapHelp', scroll: {v: 't', h: 'l'}, anim: 1},
		{className: 'tapExit', scroll: {v: 't', h: 'r'}, anim: 1},
		{className: 'tapSwitch', scroll: {v: 'b', h: 'r'}, anim: 1, 
			events: {
				touchstart: function(e){
					e.preventDefault();
					if(hasClass(this, 'multi')){
						console.log("mf");
						removeClass(this, 'multi');
						multi = false;
					} else {
						addClass(this, 'multi');
						multi = true;
						console.log("mt");
					}
				}
			}
		},
		{className: 'tapLang', scroll: {v: 'b', h: 'l'}, anim: 1}	
	].map(createDictorElem);
	
	function createDictorElem(opts){
		var elem = document.createElement(opts.elemType || 'div');
		elem.className = opts.className || '';
		if(opts.append !== false && opts.append !== 0){
			opts.append = opts.append || body;
			opts.append.appendChild(elem);
		}
		if(opts.scroll){
			document.addEventListener("scroll", function(){
				scrollFix(elem, opts.scroll.v, opts.scroll.h); 
			}, false);
			scrollFix(elem, opts.scroll.v, opts.scroll.h); // Prime-time
		}
		if(opts.anim){
			addClass(elem, 'animTopLeft');
		}
		if(opts.events){
			for(var event in opts.events){
				elem.addEventListener(event, opts.events[event], false);
			}
		}
		return elem;
	}
	
	// create translation container
	var transc = createDictorElem({className: 'dictorTransc'});
	
	// init semi-global variables
	var from, to, translated = false, over = false, threshold = 500, multi = false, width, rs, rr;
	
	function touchdown(e){
		if(!from){ // this could be a lot prettier
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
		
		var s=document.createElement('script');
		s.id = 'JSONP';
		s.type='text/javascript';
		s.src='http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&langpair=en|sv&callback=translation&q=' + escape(tString);
		head.appendChild(s);
		
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
	}
	
	function scrollFix(elem, v, h){
		var width = height = ( window.innerHeight * ( 40 / 373 ) );	
		var fromTop = 0, fromLeft = 0;
		if(v == 'b') { fromTop = window.innerHeight - height  + 1}
		if(h == 'r') { fromLeft = window.innerWidth - width + 1 }
		var height = ( window.innerHeight * ( 40 / 373 ) );	
		elem.style.top = (window.pageYOffset + fromTop) + 'px';
		elem.style.left = ( window.pageXOffset + fromLeft) + 'px';
		elem.style.width = width + 'px'; 
		elem.style.height = height + 'px';
		elem.style.fontSize = (height * 0.33) + 'px';
	}
	
	var after = (new Date()).getTime() / 1000;
	console.log("Middle took " + (middle - before).toFixed(4) + " seconds");
	console.log("Dictorizing took " + (after - before).toFixed(4) + " seconds");
	
	function translation(t){
		transc.textContent = t.responseData.translatedText;
		/*transc.style.width = width + 'px';*/
		transc.style.left = (rs - 8) + 'px';
		addClass(transc, 'visible');
		transc.style.top = (rr.ys - transc.offsetHeight - 8) + 'px';
		
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
	
	return translation;
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