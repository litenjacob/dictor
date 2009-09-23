/**
 * @author jacob
 */
//http://ajax.googleapis.com/ajax/services/language/translate?v=1.0&q=hello%20world&langpair=en|it&callback=dictor
//http://www.google.com/uds/samples/language/detect.html
//http://www.google.com/uds/samples/language/branding.html
//http://code.google.com/intl/sv-SE/apis/ajaxlanguage/documentation/#Examples

/*
 * 
 * 

Array.prototype.map = function(fn){
    var arr = this, i = 0;
    this.forEach(function(n){
	arr[i] = fn.call(arr, n, i);
	i++;
    })
    return arr;
}
			

var html = document.getElementsByTagName('body')[0].innerHTML.split(/[<>]/).map(function(n, i){ 
    if(i%2){
        return "<" + n + ">";
    } else {
        return n.replace(/([^\s]+)/gi, '<span class="dictor">$1</span>');
    }
})
console.log(html);

 * 
 * 
 */



window.onload = init;
init();

function init(){
	var head = document.getElementsByTagName('head')[0];
	var dictorCSS = document.createElement('style');
	dictorCSS.type = "text/css";
	dictorCSS.textContent = '.dictor { cursor: hand; } .dictorActive { background-color: #abc; } .dictorTranslation { font-size: 1.4em; background-color: #fff; -webkit-border-radius: 5px; padding: 4px; }';
	head.appendChild(dictorCSS);
	
	Array.prototype.map = function(fn){
	    var arr = this, i = 0;
	    this.forEach(function(n){
		arr[i] = fn.call(arr, n, i);
		i++;
	    })
	    return arr;
	}
				
	var body = document.getElementsByTagName('body')[0];
	body.innerHTML = body.innerHTML.split(/[<>]/).map(function(n, i){ 
	    if(i%2){
	        return "<" + n + ">";
	    } else {
	        return n.replace(/([^\s]+)/gi, '<span class="dictor">$1</span>');
	    }
	}).join("");

	
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