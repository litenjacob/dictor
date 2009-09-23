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
	dictorCSS.textContent = '.dictor { cursor: pointer; } .dictorActive { background-color: #abc; } .dictorTranslation { font-size: 1.4em; background-color: #fff; -webkit-border-radius: 5px; padding: 4px; }';
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
	body.className = (body.className == "" ? "" : " ") + "dictorized";
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
		n.onclick = translate;
		return n;
	});
	
	var from, to;
	
	function translate(){
		if (this.parentNode.nodeName == 'A') {
			console.log('pressed a link!', findPos(this));
			link(this);
		}
		var tString = this.textContent.match(/[\w\'–\-]+/)[0];
		console.log(tString, spans.indexOf(this));
		
		if(!from){
			from = this;
		} else {
			to = this;
			tString = spans.slice(spans.indexOf(from), spans.indexOf(to) + 1).map(function(n){ return n.textContent }).join(" ");
			console.log(tString);
		}
		return false;
	}
	
	function link(){
		console.log("linking!");
	}
	
	var after = (new Date()).getTime() / 1000;
	console.log("Middle took " + (middle - before).toFixed(4) + " seconds");
	console.log("Dictorizing took " + (after - before).toFixed(4) + " seconds");
	
}
 
function findPos(obj){
    var curleft = curtop = 0;
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        }
        while (obj = obj.offsetParent);
    }
    
    return {
        x: curleft,
        y: curtop
    };
    
}