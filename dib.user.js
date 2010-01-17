// ==UserScript==
// @name           dictor
// @namespace      http://dictor.se
// @description    dictor click-and-translate
// @include        *
// ==/UserScript==

// bootstrapper
(function(){

	// fix different behaviours
	try {
		var relativeWhat = (/safari|opera/i).test(navigator.userAgent) ? {
			x: 'pageX',
			y: 'pageY'
		} : {
			x: 'clientX',
			y: 'clientY'
		};
		
		var elem = null;
		var time = 0;
		var point = {};
		document.getElementsByTagName('body')[0].addEventListener('ontouchstart' in document.documentElement ? 'touchstart' : 'mousedown', function(e){
			if(e.button != 0){ return; }
			
			try {
				var eTarget = e.srcElement || e.originalTarget;
				if (eTarget.nodeType == 3) {
					eTarget = eTarget.parentNode;
				}
			} catch(e){}
			if(!eTarget){ return; }
			if (eTarget.className.indexOf('dictor') == -1) { // <--- what about this?
				if (unsafeWindow['dictor'] != undefined && unsafeWindow.dictor.vars.translated.length) {
					unsafeWindow.dictor.translation.removeTranslation();
				}
			}
			var ep = e['touches'] ? e.touches[0] : e;
			if (eTarget == elem && new Date().getTime() - time < 500) {
				function sendToDictor(elem, point, e){
					unsafeWindow.dictor.dictorize([elem]);
					
					var firstElem = unsafeWindow.document.elementFromPoint(point.x, point.y);
					var secondElem = unsafeWindow.document.elementFromPoint(ep[relativeWhat.x], ep[relativeWhat.y]);
					
					if (firstElem == secondElem) {
						unsafeWindow.dictor.touch.dictorElemTouchdown(e, firstElem);
						unsafeWindow.dictor.touch.dictorElemTouchdown(e, secondElem);
					}
				}
				
				if (unsafeWindow['dictor'] != undefined) {
					sendToDictor(elem, point, e);
				}
				else {
					var s = document.createElement('script');
					s.type = 'text/javascript';
					s.charset = 'utf-8';
					s.src = 'http://79.99.1.153/dictor/dib.js?' + (new Date()).getTime();
					s.id = 'dictor';
					document.getElementsByTagName("head")[0].appendChild(s);
					
					s.addEventListener('readystatechange', function(){
						if (this.readyState == 'loaded' || this.readyState == 'complete') {
							sendToDictor(elem, point, e);
						}
					}, false);
					s.addEventListener('load', function(){
						sendToDictor(elem, point, e);
					}, false);
				}
			}
			elem = eTarget;
			time = new Date().getTime();
			point.x = ep[relativeWhat.x];
			point.y = ep[relativeWhat.y];
			//return false;
			//e.preventDefault();
			return;
		}, false)
	} catch(e){

	}	
})()