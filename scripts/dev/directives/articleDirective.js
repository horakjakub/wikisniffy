ModuleManager.define('articleDirective', [ '$document', 'DOMService'], function articleDirectiveFunc($document, DOM){
	// Directive to create DOM component with API to fullfill it with data
	// This one makes simple article component, with possiblity to add Title, URL, img later by Directive API // JH 

	var article = DOM.createDomEl('article', ''),
	 	aside = DOM.createDomEl('aside', ''),
	 	header = DOM.createDomEl('header', ''),
	 	content = DOM.createDomEl('content', ''),
	 	section = DOM.createDomEl('section', ''),
	 	a = DOM.createDomEl('a', ''),
	 	img = DOM.createDomEl('img', '');

	aside.appendChild(img);
	DOM.appendChildren(content, [section, aside]);
	header.appendChild(a);
	DOM.appendChildren(article, [header, content]);

 	function setDescriptionText(text){
 		var section = this.children[1].children[0];
 		DOM.addTextNode(section, text);
 	}

 	function setImageURL(imgURL){
 		var img = this.children[1].children[1].children[0];  
 		img.src = imgURL;
 	}

 	function setLinkURL(mainUrl){ 
 		var a = this.children[0].children[0]; 
		a.setAttribute("href", mainUrl);
 	}

 	function setArticleTitle(title){ 
 		var a = this.children[0].children[0]; 
 		DOM.addTextNode(a, title);
 	} 

 	// -------- // directive interface // ---------/// 

 	var intface = {};

 	intface.create = function cloneArtcileNode(){
 		var newArticle = article.cloneNode(true);
		
		newArticle.setDescriptionText = setDescriptionText;
		newArticle.setImageURL = setImageURL;
		newArticle.setLinkURL = setLinkURL;
		newArticle.setArticleTitle = setArticleTitle;

		return newArticle;
 	};

 	return intface;  
});