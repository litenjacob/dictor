var translation;
var actualFirstNode;
console.log('loaded!')
function languageLoader(){
    google.load("language", "1", {
        callback: languageLoaded
    });
}

function languageLoaded(){

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

//window.onload = function(){
    var head = document.getElementsByTagName('head')[0];
    var body = document.getElementsByTagName('body')[0];
    var dictorCSS = document.createElement('style');
    dictorCSS.type = "text/css";
    dictorCSS.textContent = 
		'.dictorActive { background-color: #abc; } .dictorTranslation { font-size: 1.4em; background-color: #fff; -webkit-border-radius: 5px; padding: 4px; }';
    head.appendChild(dictorCSS);
    
    
    translation = document.createElement('div');
    translation.style.position = 'absolute';
    translation.style.display = 'none';
	translation.className = 'dictorTranslation';
    body.appendChild(translation);
    
    var find = ['p', 'h1', 'h2', 'h3'];
    var elems = [];
    var words = [];
    var wordNodes = [];
    var siblingNodes;
    var lastNode = false;
    var activateMouseover = false;
    var firstNode = false;
    var firstIndex;
    var fromIndex;
    var toIndex;
    
    for (var tag in find) {
        var nodes = document.getElementsByTagName(find[tag]);
        for (var i = 0; i < nodes.length; i++) {
            elems.push(nodes.item(i));
        }
    }
    for (var elem in elems) {
        elems[elem].innerHTML = elems[elem].innerHTML.replace(/([^\s]+)/gi, '<span class="dictor">$1</span>');
    }
    var spans = document.getElementsByTagName('span');

    for (var i = 0; i < spans.length; i++) {
        var span = spans.item(i);
        if (span.className.indexOf('dictor') != -1) {
            span.ontouchstart = function(){
				console.log('mmmm');
                if (!firstNode) {
                    activateMouseover = true;
                    firstNode = this;
                    firstNode.className = "dictorActive";
                    //console.log('firstNode: ' + firstNode.textContent)
                    wordNodes = [firstNode];
                    siblingNodes = [];
                    tmp = firstNode.parentNode.getElementsByTagName('span');
                    for (var t = 0; t < tmp.length; t++) {
                        siblingNodes.push(tmp.item(t));
                    }
                    firstIndex = siblingNodes.indexOf(firstNode);
                }
                else {
                    var node = this;
                    if (node.parentNode == firstNode.parentNode) {
                        var nodeIndex = siblingNodes.indexOf(node);
                        
                        fromIndex = Math.min(firstIndex, nodeIndex);
                        toIndex = Math.max(firstIndex, nodeIndex);
                        
                        for (var o = 0; o < siblingNodes.length; o++) {
                            siblingNodes[o].className = "dictor";
                        }
                        for (var i = fromIndex; i <= toIndex; i++) {
                            siblingNodes[i].className = "dictorActive";
                        }
                        
                        var translate = [];
                        for (var i = fromIndex; i <= toIndex; i++) {
                            translate.push(siblingNodes[i].textContent);
                        }
                        //console.log(translate);
                        var translateString = translate.join(" ");
                        console.log('tString: ' + translateString);
                        actualFirstNode = firstNode;
                        google.language.translate(translateString, "en", "sv", showTranslation);
                        
                        firstNode = false;
                        
                    }
                    
                    
                }
                //firstNode.style.color = '#ff0000';
            }
            
        }
    }
    
    /*document.ontouchmove = function(e){
     
     //console.log('touchMove', e.touches[0].target.textContent);
     for(var i = 0; i < e.touches.length; i++){
     console.log(i + ' ' + e.touches.item(i).textContent);
     }
     e.preventDefault();
     if (firstNode) {
     getNodes(this);
     }
     }*/
    document.ontouchend = function(e){
     /*console.log(e.touches[0].textContent);
     var translate = [];
     for (var i = fromIndex; i <= toIndex; i++) {
     translate.push(siblingNodes[i].textContent);
     }
     //console.log(translate);
     var translateString = translate.join(" ");
     //console.log('tString: ' + translateString);
     actualFirstNode = firstNode;
     //google.language.translate(translateString, "en", "sv", showTranslation);
     
     firstNode = false;*/
     }    
//}



function showTranslation(result){
    if (!result.error) {
        console.log(result.translation.textContent);
        translation.textContent = result.translation;
        var pos = findPos(actualFirstNode);
        translation.style.left = pos.x + 'px';
        translation.style.top = pos.y - 30 + 'px';
        translation.style.display = 'block';
    }
}
