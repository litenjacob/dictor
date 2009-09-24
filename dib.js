/**
 * @author jacob
 */
//http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&q=hello%20world&langpair=en|it&callback=dictor
//http://www.google.com/uds/samples/language/detect.html
//http://www.google.com/uds/samples/language/branding.html
//http://code.google.com/intl/sv-SE/apis/ajaxlanguage/documentation/#Examples

window.onload = init;
init();

function init(){
	var before = (new Date()).getTime() / 1000;
	var body = document.getElementsByTagName('body')[0];
	if (body.className.match(/dictorized/)) { return false; }
	
	var head = document.getElementsByTagName('head')[0];
	var dictorCSS = document.createElement('style');
	dictorCSS.type = "text/css";
	dictorCSS.textContent = '.dictorLink.visible {display: block;} .dictorLink.hover { color: #f00;} .dictorLink {position:absolute; display:none;} .dictor {cursor:pointer;margin:0;padding:0;} .dictorActive {text-shadow: 0px 0px 2px #0a0;}';
	head.appendChild(dictorCSS);
	
	Array.prototype.map = function(fn){
	    var arr = this, i = 0;
	    this.forEach(function(n){
			arr[i] = fn.call(arr, n, i);
			i++;
	    })
	    return arr;
	}
				
	
	var oldBody = body.innerHTML;
	//body.className = (body.className == "" ? "" : " ") + "dictorized";
	addClass(body, "dictorized");
	body.innerHTML = body.innerHTML.split(/[<>]/).map(function(n, i){
		if (i % 2) {
			return "<" + n + ">";
		}
		else {
			return n.replace(/([^\s]+)/gi, '<span class="dictor">$1</span>');
		}
	}).join("");
	
	var middle = (new Date()).getTime() / 1000;
	var spans = Array.prototype.slice.call(document.getElementsByClassName('dictor')).map(function(n){
		n.onmousedown = touchdown;
		return n;
	});
	
	var link = document.createElement('div');
	link.className = 'dictorLink';
	body.appendChild(link);
	
	
	
	var from, to, translated = false, over = false;
	document.onmousemove = function(e){
		if(!link.isVisible){
			return false;
		}
		if(isOverElem(e, link.location)){
			if(!over){
				addClass(link, 'hover');
				over = true;
			}
			
		} else {
			if(over){
				removeClass(link, 'hover');
			}
			over = false;
		}
	}
	
	document.onmouseup = touchup;
	
	function isOverElem(e, location){
		return e.clientX > location.xs && e.clientX < location.xe && e.clientY > location.ys && e.clientY < location.ye;
	}
	
	function touchdown(e){
		if(translated){
			translated.map(function(n){ removeClass(n, 'dictorActive'); return false; });
			translated = false;
		}
		if(!from){
			from = this;
			from.location = findPos(from);
		} else {
			to = this;
		}
		
		if (this.parentNode.nodeName == 'A') {
			var p = findPos(this);
			var a = this.parentNode;
			link.textContent = "Goto: " + a.textContent;
			link.url = a.getAttribute('href');
			link.style.left = p.xs + 'px';
			link.style.top = (p.ys - this.scrollHeight) + 'px';
			addClass(link, 'visible');
			link.isVisible = true;
			link.location = findPos(link);

			return false;
		}
		
	}
	
	function touchup(e){		
		if(link.isVisible){
			if(isOverElem(e, link.location)){
				console.log('goto ' + link.url);
				return false;
			} 
		}

		if(isOverElem(e, from.location)){
			translate()
		} else {
			if(from && to){
				translate();
			} else {
				console.log('flash from!');
			}
		}
		
		if (link.isVisible) {
			link.isVisible = false;
			removeClass(link, 'visible');
		}
	}
	
	function translate(){
		console.log("translating");
		to = to || from;
		var fromClick = spans.indexOf(from);
		var toClick = spans.indexOf(to);
		//console.log(fromClick, toClick);
		translated = spans.slice(Math.min(fromClick, toClick), Math.max(fromClick, toClick) + 1);
		tString = translated.slice(0).map(function(n){ addClass(n, "dictorActive"); return n.textContent }).join(" ");
		console.log("tString", tString);
		from = to = false;
		//var tString = this.textContent.match(/[\w\'–\-]+/)[0]; //really necessary? skip this...
		//console.log(tString, spans.indexOf(this));
		
		/*if(!from){
			from = this;
		} else {
			to = this;
			
			console.log(tString);
		}
		
		addClass(this, "dictorActive");
		
		return false;*/
	}
	
	
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
		xe: curleft + origObj.scrollWidth,
		ye: curtop + origObj.scrollHeight
    };
    
}