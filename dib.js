/**
 * @author jacob
 */
//http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&q=hello%20world&langpair=en|it&callback=dictor
//http://www.google.com/uds/samples/language/detect.html
//http://www.google.com/uds/samples/language/branding.html
//http://code.google.com/intl/sv-SE/apis/ajaxlanguage/documentation/#Examples

//window.onload = init;
init();

function init(){
	var before = (new Date()).getTime() / 1000;
	var body = document.getElementsByTagName('body')[0];
	if (body.className.match(/dictorized/)) { return false; } // already dictorized?
	
	// append css
	var head = document.getElementsByTagName('head')[0];
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
		n.ontouchstart = touchdown;
		return n;
	});
	
	// create link container
	var link = document.createElement('div');
	link.className = 'dictorLink';
	body.appendChild(link);
	
	// create tapswitch container
	var tapSwitch = document.createElement('div');
	tapSwitch.className = 'tapSwitch';
	body.appendChild(tapSwitch);
	
		// create tapswitch container
	var tapExit = document.createElement('div');
	tapExit.className = 'tapExit';
	body.appendChild(tapExit);
	
	scrollFix(tapSwitch, 'vBottom', 'vRight');
	scrollFix(tapExit, 'vTop', 'vRight');
	addClass(tapSwitch, 'animTopLeft');
	addClass(tapExit, 'animTopLeft');
	
	// create translation container'// create link container
	var transc = document.createElement('div');
	transc.className = 'dictorTransc';
	body.appendChild(transc);
	
	// init semi-global variables
	var from, to, translated = false, over = false, threshold = 500, multi = false;
	
	// need to track *mouse* movements
	document.ontouchmove = function(e){ // should be addeventlistener
		if(!link.isVisible){ return true; }
		if(isOverElem(e, link.location)){
			if(!over){
				addClass(link, 'hover');
				over = true;
			}	
		} else {
			if(over){ removeClass(link, 'hover'); }
			over = false;
		}
	}
	
	// bind touchup. duh
	document.ontouchend = touchup;
	
	// are we over a certain prepared element?
	function isOverElem(e, location){
		return e.pageX > location.xs && e.pageX < location.xe && e.pageY > location.ys && e.pageY < location.ye;
	}
	
	function touchdown(e){
		
		if(translated){ // old translation? if so - clear its style
			removeClass(transc, 'visible');
			translated.map(function(n){ removeClass(n, 'dictorActive'); return false; });
			translated = false;
		}
		if(!from){ // have we already touched down once?
			from = this;
			from.stamp = new Date().getTime();
		} else { 
			if(this == from && (new Date().getTime() - from.stamp) < threshold){ // did we touch from again in time?
				if (!multi) {
					e.preventDefault();
					translate();
				} else {
					addClass(from, 'flash');
				}
			} else{
				if(!multi){
					from = this;
					from.stamp = new Date().getTime();
				}
			}
			
			/*else {
				if (multi) {
					if (!to) {
						to = this;
						to.stamp = new Date().getTime();
					}
					else {
						if (this == to && (new Date().getTime() - to.stamp) < threshold) {
							e.preventDefault();
							translate();
						}
					}
				}
			}*/
		}
		
		// if we're touching a link, show linkhelper to make it 'clickable'
		if (this.parentNode.nodeName == 'A') {
			var p = findPos(this);
			var a = this.parentNode;
			link.textContent = "Goto: " + a.textContent;
			link.url = a.getAttribute('href');
			link.style.left = p.xs + 'px';
			link.style.top = (p.ys - this.offsetHeight) + 'px';
			addClass(link, 'visible');
			link.isVisible = true;
			link.location = findPos(link);
			return false;
		}
		
	}
	
	function touchup(e){
		/*if(link.isVisible){
			if(isOverElem(e, link.location)){
				console.log('goto ' + link.url);
				return false;
			} 
		}
		
		if (from) {
			if (isOverElem(e, from.location)) {
				console.log("ha");
				translate();
			} else {
				if (from && to) {
					removeClass(from, 'flash');
					translate();
				}
				else {
					addClass(from, 'flash');
				}
			}
		}
		
		if (link.isVisible) {
			link.isVisible = false;
			removeClass(link, 'visible');
		}*/
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
		
		var i = 0, oldY;
		do {
			oldY = findPos(translated[i]).ys;
			i++;
		} while(translated[i] && findPos(translated[i]).ys == oldY);
		
		var rr = findPos(translated[0])
		var rs = rr.xs;
		var re = findPos(translated[--i]).xe;
		
		var width = re - rs;
		
		transc.textContent = tString;
		transc.style.width = width + 'px';
		transc.style.left = (rs - 8) + 'px';
		addClass(transc, 'visible');
		transc.style.top = (rr.ys - transc.offsetHeight - 8) + 'px';
		
		
		
		//var pos = rs + width / 2;
		
		//console.log("rr", rs, re);
		//console.log("tString", tString);
		
		// reset variables
		from = to = false;
	}
	
	function scrollFix(elem, v, h){
		var width = height = ( window.innerHeight * ( 40 / 373 ) );	
		var fromTop = 0, fromLeft = 0;
		if(v == 'vBottom') { fromTop = window.innerHeight - height  + 1}
		if(h == 'vRight') { fromLeft = window.innerWidth - width + 1 }
		var height = ( window.innerHeight * ( 40 / 373 ) );	
		elem.style.top = (window.pageYOffset + fromTop) + 'px';
		elem.style.left = ( window.pageXOffset + fromLeft) + 'px';
		elem.style.width = width + 'px'; 
		elem.style.height = height + 'px';
		elem.style.fontSize = (height * 0.33) + 'px';
	}
	
	document.addEventListener("scroll",  function(){ scrollFix(tapSwitch, 'vBottom', 'vRight'); scrollFix(tapExit, 'vTop', 'vRight'); }, false);
	
	var after = (new Date()).getTime() / 1000;
	console.log("Middle took " + (middle - before).toFixed(4) + " seconds");
	console.log("Dictorizing took " + (after - before).toFixed(4) + " seconds");
}
 
function addClass(elem, newClass){
	elem.className = (elem.className == "" ? "" : elem.className + " ") + newClass;
}

function removeClass(elem, oldClass){
	elem.className = elem.className.replace(new RegExp("(\\s|^)" + oldClass + "(\\s|$)"), '');
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