'use strict';

var ModuleManager = (function Manager() {
    var modules = {};

    function define(name, deps, impl) {
        for (var i=0; i<deps.length; i++) {
            deps[i] = modules[deps[i]];
        }
        modules[name] = impl.apply( impl, deps );
    }

    function get(name) {
        return modules[name];
    }

    return {
        define: define,
        get: get
    };
})();
 
ModuleManager.define('$document', [], function(){ return document; });
ModuleManager.define('$window', [], function(){ return window; });
ModuleManager.define('$q', ['$window'], function($window){ return $window.Q; });
ModuleManager.define('$MediaWikiJS', ['$window'], function($window){ return $window.MediaWikiJS; });
ModuleManager.define('DOMService', ['$document'], function DOMService($document){
	var intface = {};

    intface.createDomEl = function createDomEl(elType, className, text, arrayOfAttributtes){
        var newElem = $document.createElement(elType);
        newElem.className = className;  
        
        if(text !== undefined && text !== null){
            var newTextNode = $document.createTextNode(text);
            newElem.appendChild(newTextNode);
        }

        if(typeof arrayOfAttributtes === 'object' && 'length' in arrayOfAttributtes){ 
            arrayOfAttributtes.forEach(function(attributtePair){ 
                newElem.setAttribute(attributtePair[0], attributtePair[1]);
            });
        }
        
        return newElem;
    };

    intface.addTextNode = function addTextNode(elem, text){
        var newTextNode = $document.createTextNode(text);

        if(elem !== undefined && elem !== null){
            elem.appendChild(newTextNode); 
        }
        
        return newTextNode;
    }; 

    intface.appendChildren = function appendChildren(element, arrayOfChildren){
        arrayOfChildren.forEach(function(child){
            element.appendChild(child);
        });
    };

    intface.addAttributes = function addAttributes(element, arrayOfAttributtes){ 
        arrayOfAttributtes.forEach(function(attributtePair){
            element.setAttribute(attributtePair[0], attributtePair[1]);
        });
    };

    return intface;
});

ModuleManager.define('WikiReqeuestsService', ['$q', '$MediaWikiJS'], function WikiReqeuestsService($q, $MediaWikiJS){
	var intface = {};

	// ------------------------------------------------------------------//
	//                             PROMISES requests     				 //
	// ------------------------------------------------------------------//   

	intface.sendAutocompleteRequestPromise = function sendAutocompleteRequestPromise(phrase){
		var def = $q.defer();

		$MediaWikiJS('https://en.wikipedia.org', { 
				action: 'query', 
				list: 'search', 
				srsearch: phrase, 
				srprop: 'title', 
				srlimit: 10 
			}, 
			function(data){
				def.resolve(data);
			});

		 return def.promise;
	};

	intface.sendSearchRequestPromise = function sendSearchRequestPromise(phrase){
		var def = $q.defer();

		$MediaWikiJS('https://en.wikipedia.org', { 
			action: 'query', 
			list: 'allpages', 
			apfrom: phrase, 
			aplimit: 10,
			apfilterredir: 'nonredirects'
			}, 
			function(data){
				def.resolve(data);
			});

		 return def.promise;
	}; 
	
	intface.sendResultsDetailPromise = function sendResultsDetailPromise(titles){
		var def = $q.defer();

		$MediaWikiJS('https://en.wikipedia.org', 
			{ 
				action: 'query', 
				titles: titles, 
				prop: 'info|images', 
				inprop: 'url', 
				imimages: ''
			}, 
			function(data){
				def.resolve(data);
			}); 

		 return def.promise;
	};	

	intface.sendExtractPromise = function sendExtractPromise(title){
		var def = $q.defer(); 

		$MediaWikiJS('https://en.wikipedia.org', { 
				action: 'query', 
				titles: title, 
				prop: 'extracts', 
				exintro: '', 
				explaintext:''
			},
			function(data){
				def.resolve(data);
			});

		 return def.promise;
	};


	intface.sendImageURLPromise = function sendImageURLPromise(imageTitles){
		var def = $q.defer(); 

		$MediaWikiJS('https://en.wikipedia.org', { 
				action: 'query', 
				titles: imageTitles, 
				prop: 'imageinfo', 
				iiprop: 'url' 
			}, 
			function(data){
				def.resolve(data);
			});

		 return def.promise;
	};


	return intface; 
});

ModuleManager.define('autocompleteDirective', [ '$document', 'DOMService'], function autocompleteDirectiveFunc($document, DOM){
 	// Directive to create DOM component with API to fullfill it with data
	// This is autoocomplete component which takes to callback function as a parameters (full descrtiption below)
	// API gives possibilit to create autocomplete options widget // JH 
	
	// ac - autocomplete

 	var acWrapper = DOM.createDomEl('div', 'jh-autocomplete__wrapper'), 
 		acInputSearch = DOM.createDomEl('input', 'jh-autocomplete__input', null, [['type', 'search']]), 
 		acListContainer = DOM.createDomEl('div', 'jh-autocomplete__list-container'),
 		acList = DOM.createDomEl('ul', 'jh-autocomplete__list'),
 		acListItem = DOM.createDomEl('li', 'jh-autocomplete__list-item');

 	acListContainer.appendChild(acList);

 	acWrapper.appendChild(acInputSearch);
 	acWrapper.appendChild(acListContainer);

 	// -------- // directive interface // ---------/// 

 	var intface = {};

 	intface.create = function createAutocomlete(autocompletePhraseSearchFunc, onEnterSearchFunc){
 		// function takes two callback functions as a parameters 
 		// - autocompletePhraseSearchFunc - function called when input value length will have more then two letters
 		// - onEnterSearchFunc - function called when user key will insert enter key // JH

 		var newAutocomplete = acWrapper.cloneNode(true),
 			searchInput = newAutocomplete.children[0], 
 			autocompleteOptionsList = newAutocomplete.children[1].children[0],   
 			autocopmleteSingleOption = acListItem.cloneNode(true);
 			newAutocomplete.value = '';

 		searchInput.addEventListener('keydown', checkKeydownEventKeyValue); 

 		// key event listener func

		function checkKeydownEventKeyValue(event){
			if(event.key.length === 1 || event.key === 'Backspace'){ 
				// if key is some letter or number (whitout special keys) // JH  
				var key = event.key, 
					searchedValue = null; 

				if(key === 'Backspace'){
					searchedValue = searchInput.value.slice(0, -1);

					if(searchedValue.length < 3){
						// hide autocomplete				
						searchInput.className = 'jh-autocomplete__input';
					}
				}
 				else { 
					searchedValue = searchInput.value + key;
				}
 			
 				newAutocomplete.value = searchedValue;

				if(searchedValue.length > 2){  
					// show autocomplete
					searchInput.className = searchInput.className + ' jh-autocomplete__input--autocomplete-visible';
					autocompletePhraseSearchFunc(searchedValue);
				}  
			} 		
			else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && searchInput.value.length > 2){
				// changeAutocompleteOption(event.key); // TODO :) // JH
			}
			else if (event.key === 'Enter' && searchInput.value.length !== 0){ 
				onEnterSearchFunc(searchInput.value);
			}
		} 	

 		// create autocomplete menu // JH

		newAutocomplete.createAutocompleteMenu = function createAutocompleteMenu(optionsArray){ 
			if(autocompleteOptionsList.children.length !== 0){
				for(var i = 0, arrLen = autocompleteOptionsList.children.length; i < arrLen; i++){ 
					autocompleteOptionsList.removeChild(autocompleteOptionsList.children[0]);
				}
			}

			optionsArray.forEach(function(optionText){ 
				var newAutocompleteOption = autocopmleteSingleOption.cloneNode(true); 
				DOM.addTextNode(newAutocompleteOption, optionText);
 				newAutocompleteOption.addEventListener('click', function(event){ 
 					var selectedOptionValue = this.innerText;
 					searchInput.className = 'jh-autocomplete__input';
 					searchInput.value = selectedOptionValue;
 					onEnterSearchFunc(selectedOptionValue);
 				});
 				
				autocompleteOptionsList.appendChild(newAutocompleteOption);
			}); 
		};

		return newAutocomplete;
 	}; 

 	return intface;  
});
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
 	}; 

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
 	} 

 	return intface;  
});
ModuleManager.define('SearchingViewController', [ '$document', '$window', 'WikiReqeuestsService', 'DOMService', 'articleDirective', 'autocompleteDirective'], function SearchingViewController($document, $window, WikiReqeuestsService, DOM, articleDirective, autocompleteDirective){
	
	// ------------------------------------------------------------------//
	//                  		bootstraping DOM   						 //
	// ------------------------------------------------------------------// 
	// DOM creation after app starts // JH 

	var mainNav = DOM.createDomEl('nav', 'nav--starting-site-state', null, [['id', 'navigationContainer']]), 
		mainResultsContainer =  DOM.createDomEl('main', 'main-container', null, [['id', 'mainResultsContainer']]), 
		searchButton = DOM.createDomEl('button', '', 'Sniff!', [['id', 'searchButton']]), 
		title = DOM.createDomEl('h3', '', 'WikiSniffy'),
		autocompleteInput = autocompleteDirective.create(runAutocompleteFillProcess, runSearchingProcess);

	$document.body.insertBefore(mainResultsContainer, $document.body.children[0]); // adding main containers before script tags // JH 
	$document.body.insertBefore(mainNav, $document.body.children[0]);

	DOM.appendChildren(mainNav, [title, autocompleteInput, searchButton]); 

	searchButton.addEventListener('click', checkSearchInputValue)

	function checkSearchInputValue(){ 
		runSearchingProcess(autocompleteInput.value);
	}

	// ------------------------------------------------------------------//
	//                    DOM manipulations control  					 //
	// ------------------------------------------------------------------// 
	// functions created to make DOM manipulation afrer reciving data // JH 
 
	function addArticleToMainContainer(articleData){ 
        var article =  articleDirective.create();
  
		article.setLinkURL(articleData.url);
		article.setArticleTitle(articleData.title);
		
		mainResultsContainer.appendChild(article);	
	}

	function addImgToSelectedArticle(articleIndex, imgURL){ 
		imgURL = imgURL || "./img/wiki.png"; 
		mainResultsContainer.children[articleIndex].setImageURL(imgURL);
	}

	function addTextToSelectedArticle(articleIndex, articleText){  
		mainResultsContainer.children[articleIndex].setDescriptionText(articleText);
	}

	function removeAllArticlesFromMainContainer(){ 
		if(mainResultsContainer.children.length !== 0){
			for(var i = 0, arrLen = mainResultsContainer.children.length; i < arrLen; i++){ 
				mainResultsContainer.removeChild(mainResultsContainer.children[0]);
			}
		}
	}

	var isThisFirstSearch = true;

	function changeAppStateFromStartingToSearching(){
		if(isThisFirstSearch){
			mainNav.className = ''; 	
			isThisFirstSearch = false;		
		}
	}

	// ------------------------------------------------------------------//
	//                         RESULT OBSERVER 							 //
	// ------------------------------------------------------------------//
	// it waits for responds from reqest processes and based on those responds it making 
	// DOM manipulations // JH 

	var reultsObserver = {
		_searchDetails: null, 
		_autocompleteOptions: null, 
		_lastRecivedImageURLdata: null, 
		_lastRecivedDescriptionData: null, 
		_articlesImageURLCollection: {}, 
		_articlesTextDataCollection: {},

		set autocompleteOptions(optionsArray){
			this._autocompleteOptions = optionsArray;
			autocompleteInput.createAutocompleteMenu(optionsArray) 
		},

		set searchDetails(searchDataCollection){
			this._searchResults = searchDataCollection;  
			searchDataCollection.forEach(addArticleToMainContainer);
			searchDataCollection.forEach(runGetArticleTextProcess); 
			changeAppStateFromStartingToSearching();
		}, 

		set imageURLdata(imageURLdata){
			this._lastRecivedImageURLdata = imageURLdata;
			this._articlesImageURLCollection[imageURLdata.index] = imageURLdata.url;
			addImgToSelectedArticle(imageURLdata.index, imageURLdata.url);
		},		

		set descriptionData(textData){
			this._lastRecivedDescriptionData = textData;
			this._articlesImageURLCollection[textData.index] = textData.text;
			addTextToSelectedArticle(textData.index, textData.text);

			// After receiving all articles descriptions, start proccess of getting images to articles // JH 
			var checkIsItLastCounter = 0;
			for(var textData in this._articlesImageURLCollection){
				checkIsItLastCounter++ 
				if(checkIsItLastCounter === 10){
					this._searchResults.forEach(runGetImageURLProcess)
				}
			}
		}


	};
 
	// ------------------------------------------------------------------//
	//                       LOGIC - request processes 					 //
	// ------------------------------------------------------------------//  
	// functions created to making reqests for data and preparing answers to right use // JH 

	var wrs = WikiReqeuestsService;

	function runAutocompleteFillProcess(searchedValue){   
		wrs.sendAutocompleteRequestPromise(searchedValue).then(function(data){
			reultsObserver.autocompleteOptions = returnPropertiesValuesArray(data.query.search, 'title'); 			
		}); 
	} 

	function runSearchingProcess(searchedPhrase){  
		removeAllArticlesFromMainContainer();

		wrs.sendSearchRequestPromise(searchedPhrase)
			.then(function(data){
				var searchResultsCollection = data.query.allpages;   

				wrs.sendResultsDetailPromise(returnPropertiesValuesArray(searchResultsCollection, 'title').join('|'))
				.then(function(data){ 

					var pagesCollection = data.query.pages, 
						resultsDataCollection = [], 
						counter = 0; 

					for(var page in pagesCollection){ 
						resultsDataCollection.push({ 
							title: pagesCollection[page].title, 
							url: pagesCollection[page].fullurl, 
						}); 

						if(pagesCollection[page].images && pagesCollection[page].images.length !== 0){
							resultsDataCollection[counter].imageTitle = pagesCollection[page].images[0].title;
						} 

						counter = counter + 1;
					}

					reultsObserver.searchDetails = resultsDataCollection;
				});
		});
	}

  	function runGetImageURLProcess(articleData, ind){ 
		if(articleData.imageTitle){		  		
			wrs.sendImageURLPromise(articleData.imageTitle)
	  		.then(function(data){
				var pagesCollection = data.query.pages; 
				for(var page in pagesCollection){   
					if(pagesCollection[page].imageinfo && pagesCollection[page].imageinfo.length !== 0){  
						reultsObserver.imageURLdata = { index: ind, url: pagesCollection[page].imageinfo[0].url || null };
					} 
					else {
						reultsObserver.imageURLdata = { index: ind, url: null };
					}
				} 
	  		});
  		} else {
  			reultsObserver.imageURLdata = { index: ind, url: null };
  		} 
  	}

  	function runGetArticleTextProcess(articleData, ind){ 
		if(articleData.title){		  		
			wrs.sendExtractPromise(articleData.title)
	  		.then(function(data){ 
				var pagesCollection = data.query.pages; 
				for(var page in pagesCollection){   
					reultsObserver.descriptionData = {index: ind, text:pagesCollection[page].extract };
				} 
	  		});
  		} 
  	}

  	// simple functional transform - return an array from object taking all properties with chosen property name // JH 

	function returnPropertiesValuesArray(arrayOfObjects, chosenProperty){
		var arr = [];

		for(var x = 0, arrayOfObjectsLength = arrayOfObjects.length; x < arrayOfObjectsLength; x++){ 
			arr.push(arrayOfObjects[x][chosenProperty]);
		}

		return arr;
	}

});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIk1vZHVsZU1hbmFnZXIuanMiLCJCYXNpY01vZHVsZXNSZWdpc3Rlci5qcyIsIkRPTVNlcnZpY2UuanMiLCJXaWtpUmVxZXVlc3RzU2VydmljZS5qcyIsImF1dG9jb21wbGV0ZURpcmVjdGl2ZS5qcyIsImFydGljbGVEaXJlY3RpdmUuanMiLCJTZWFyY2hpbmdWaWV3Q29udHJvbGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xyXG5cclxudmFyIE1vZHVsZU1hbmFnZXIgPSAoZnVuY3Rpb24gTWFuYWdlcigpIHtcclxuICAgIHZhciBtb2R1bGVzID0ge307XHJcblxyXG4gICAgZnVuY3Rpb24gZGVmaW5lKG5hbWUsIGRlcHMsIGltcGwpIHtcclxuICAgICAgICBmb3IgKHZhciBpPTA7IGk8ZGVwcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBkZXBzW2ldID0gbW9kdWxlc1tkZXBzW2ldXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbW9kdWxlc1tuYW1lXSA9IGltcGwuYXBwbHkoIGltcGwsIGRlcHMgKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXQobmFtZSkge1xyXG4gICAgICAgIHJldHVybiBtb2R1bGVzW25hbWVdO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZGVmaW5lOiBkZWZpbmUsXHJcbiAgICAgICAgZ2V0OiBnZXRcclxuICAgIH07XHJcbn0pKCk7XHJcbiAiLCJNb2R1bGVNYW5hZ2VyLmRlZmluZSgnJGRvY3VtZW50JywgW10sIGZ1bmN0aW9uKCl7IHJldHVybiBkb2N1bWVudDsgfSk7XHJcbk1vZHVsZU1hbmFnZXIuZGVmaW5lKCckd2luZG93JywgW10sIGZ1bmN0aW9uKCl7IHJldHVybiB3aW5kb3c7IH0pO1xyXG5Nb2R1bGVNYW5hZ2VyLmRlZmluZSgnJHEnLCBbJyR3aW5kb3cnXSwgZnVuY3Rpb24oJHdpbmRvdyl7IHJldHVybiAkd2luZG93LlE7IH0pO1xyXG5Nb2R1bGVNYW5hZ2VyLmRlZmluZSgnJE1lZGlhV2lraUpTJywgWyckd2luZG93J10sIGZ1bmN0aW9uKCR3aW5kb3cpeyByZXR1cm4gJHdpbmRvdy5NZWRpYVdpa2lKUzsgfSk7IiwiTW9kdWxlTWFuYWdlci5kZWZpbmUoJ0RPTVNlcnZpY2UnLCBbJyRkb2N1bWVudCddLCBmdW5jdGlvbiBET01TZXJ2aWNlKCRkb2N1bWVudCl7XHJcblx0dmFyIGludGZhY2UgPSB7fTtcclxuXHJcbiAgICBpbnRmYWNlLmNyZWF0ZURvbUVsID0gZnVuY3Rpb24gY3JlYXRlRG9tRWwoZWxUeXBlLCBjbGFzc05hbWUsIHRleHQsIGFycmF5T2ZBdHRyaWJ1dHRlcyl7XHJcbiAgICAgICAgdmFyIG5ld0VsZW0gPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChlbFR5cGUpO1xyXG4gICAgICAgIG5ld0VsZW0uY2xhc3NOYW1lID0gY2xhc3NOYW1lOyAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYodGV4dCAhPT0gdW5kZWZpbmVkICYmIHRleHQgIT09IG51bGwpe1xyXG4gICAgICAgICAgICB2YXIgbmV3VGV4dE5vZGUgPSAkZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCk7XHJcbiAgICAgICAgICAgIG5ld0VsZW0uYXBwZW5kQ2hpbGQobmV3VGV4dE5vZGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodHlwZW9mIGFycmF5T2ZBdHRyaWJ1dHRlcyA9PT0gJ29iamVjdCcgJiYgJ2xlbmd0aCcgaW4gYXJyYXlPZkF0dHJpYnV0dGVzKXsgXHJcbiAgICAgICAgICAgIGFycmF5T2ZBdHRyaWJ1dHRlcy5mb3JFYWNoKGZ1bmN0aW9uKGF0dHJpYnV0dGVQYWlyKXsgXHJcbiAgICAgICAgICAgICAgICBuZXdFbGVtLnNldEF0dHJpYnV0ZShhdHRyaWJ1dHRlUGFpclswXSwgYXR0cmlidXR0ZVBhaXJbMV0pO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG5ld0VsZW07XHJcbiAgICB9O1xyXG5cclxuICAgIGludGZhY2UuYWRkVGV4dE5vZGUgPSBmdW5jdGlvbiBhZGRUZXh0Tm9kZShlbGVtLCB0ZXh0KXtcclxuICAgICAgICB2YXIgbmV3VGV4dE5vZGUgPSAkZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCk7XHJcblxyXG4gICAgICAgIGlmKGVsZW0gIT09IHVuZGVmaW5lZCAmJiBlbGVtICE9PSBudWxsKXtcclxuICAgICAgICAgICAgZWxlbS5hcHBlbmRDaGlsZChuZXdUZXh0Tm9kZSk7IFxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbmV3VGV4dE5vZGU7XHJcbiAgICB9OyBcclxuXHJcbiAgICBpbnRmYWNlLmFwcGVuZENoaWxkcmVuID0gZnVuY3Rpb24gYXBwZW5kQ2hpbGRyZW4oZWxlbWVudCwgYXJyYXlPZkNoaWxkcmVuKXtcclxuICAgICAgICBhcnJheU9mQ2hpbGRyZW4uZm9yRWFjaChmdW5jdGlvbihjaGlsZCl7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcbiAgICBpbnRmYWNlLmFkZEF0dHJpYnV0ZXMgPSBmdW5jdGlvbiBhZGRBdHRyaWJ1dGVzKGVsZW1lbnQsIGFycmF5T2ZBdHRyaWJ1dHRlcyl7IFxyXG4gICAgICAgIGFycmF5T2ZBdHRyaWJ1dHRlcy5mb3JFYWNoKGZ1bmN0aW9uKGF0dHJpYnV0dGVQYWlyKXtcclxuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoYXR0cmlidXR0ZVBhaXJbMF0sIGF0dHJpYnV0dGVQYWlyWzFdKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIGludGZhY2U7XHJcbn0pO1xyXG4iLCJNb2R1bGVNYW5hZ2VyLmRlZmluZSgnV2lraVJlcWV1ZXN0c1NlcnZpY2UnLCBbJyRxJywgJyRNZWRpYVdpa2lKUyddLCBmdW5jdGlvbiBXaWtpUmVxZXVlc3RzU2VydmljZSgkcSwgJE1lZGlhV2lraUpTKXtcclxuXHR2YXIgaW50ZmFjZSA9IHt9O1xyXG5cclxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cdC8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBQUk9NSVNFUyByZXF1ZXN0cyAgICAgXHRcdFx0XHQgLy9cclxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vLyAgIFxyXG5cclxuXHRpbnRmYWNlLnNlbmRBdXRvY29tcGxldGVSZXF1ZXN0UHJvbWlzZSA9IGZ1bmN0aW9uIHNlbmRBdXRvY29tcGxldGVSZXF1ZXN0UHJvbWlzZShwaHJhc2Upe1xyXG5cdFx0dmFyIGRlZiA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JE1lZGlhV2lraUpTKCdodHRwczovL2VuLndpa2lwZWRpYS5vcmcnLCB7IFxyXG5cdFx0XHRcdGFjdGlvbjogJ3F1ZXJ5JywgXHJcblx0XHRcdFx0bGlzdDogJ3NlYXJjaCcsIFxyXG5cdFx0XHRcdHNyc2VhcmNoOiBwaHJhc2UsIFxyXG5cdFx0XHRcdHNycHJvcDogJ3RpdGxlJywgXHJcblx0XHRcdFx0c3JsaW1pdDogMTAgXHJcblx0XHRcdH0sIFxyXG5cdFx0XHRmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRkZWYucmVzb2x2ZShkYXRhKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0IHJldHVybiBkZWYucHJvbWlzZTtcclxuXHR9O1xyXG5cclxuXHRpbnRmYWNlLnNlbmRTZWFyY2hSZXF1ZXN0UHJvbWlzZSA9IGZ1bmN0aW9uIHNlbmRTZWFyY2hSZXF1ZXN0UHJvbWlzZShwaHJhc2Upe1xyXG5cdFx0dmFyIGRlZiA9ICRxLmRlZmVyKCk7XHJcblxyXG5cdFx0JE1lZGlhV2lraUpTKCdodHRwczovL2VuLndpa2lwZWRpYS5vcmcnLCB7IFxyXG5cdFx0XHRhY3Rpb246ICdxdWVyeScsIFxyXG5cdFx0XHRsaXN0OiAnYWxscGFnZXMnLCBcclxuXHRcdFx0YXBmcm9tOiBwaHJhc2UsIFxyXG5cdFx0XHRhcGxpbWl0OiAxMCxcclxuXHRcdFx0YXBmaWx0ZXJyZWRpcjogJ25vbnJlZGlyZWN0cydcclxuXHRcdFx0fSwgXHJcblx0XHRcdGZ1bmN0aW9uKGRhdGEpe1xyXG5cdFx0XHRcdGRlZi5yZXNvbHZlKGRhdGEpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHQgcmV0dXJuIGRlZi5wcm9taXNlO1xyXG5cdH07IFxyXG5cdFxyXG5cdGludGZhY2Uuc2VuZFJlc3VsdHNEZXRhaWxQcm9taXNlID0gZnVuY3Rpb24gc2VuZFJlc3VsdHNEZXRhaWxQcm9taXNlKHRpdGxlcyl7XHJcblx0XHR2YXIgZGVmID0gJHEuZGVmZXIoKTtcclxuXHJcblx0XHQkTWVkaWFXaWtpSlMoJ2h0dHBzOi8vZW4ud2lraXBlZGlhLm9yZycsIFxyXG5cdFx0XHR7IFxyXG5cdFx0XHRcdGFjdGlvbjogJ3F1ZXJ5JywgXHJcblx0XHRcdFx0dGl0bGVzOiB0aXRsZXMsIFxyXG5cdFx0XHRcdHByb3A6ICdpbmZvfGltYWdlcycsIFxyXG5cdFx0XHRcdGlucHJvcDogJ3VybCcsIFxyXG5cdFx0XHRcdGltaW1hZ2VzOiAnJ1xyXG5cdFx0XHR9LCBcclxuXHRcdFx0ZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0ZGVmLnJlc29sdmUoZGF0YSk7XHJcblx0XHRcdH0pOyBcclxuXHJcblx0XHQgcmV0dXJuIGRlZi5wcm9taXNlO1xyXG5cdH07XHRcclxuXHJcblx0aW50ZmFjZS5zZW5kRXh0cmFjdFByb21pc2UgPSBmdW5jdGlvbiBzZW5kRXh0cmFjdFByb21pc2UodGl0bGUpe1xyXG5cdFx0dmFyIGRlZiA9ICRxLmRlZmVyKCk7IFxyXG5cclxuXHRcdCRNZWRpYVdpa2lKUygnaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnJywgeyBcclxuXHRcdFx0XHRhY3Rpb246ICdxdWVyeScsIFxyXG5cdFx0XHRcdHRpdGxlczogdGl0bGUsIFxyXG5cdFx0XHRcdHByb3A6ICdleHRyYWN0cycsIFxyXG5cdFx0XHRcdGV4aW50cm86ICcnLCBcclxuXHRcdFx0XHRleHBsYWludGV4dDonJ1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRkZWYucmVzb2x2ZShkYXRhKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0IHJldHVybiBkZWYucHJvbWlzZTtcclxuXHR9O1xyXG5cclxuXHJcblx0aW50ZmFjZS5zZW5kSW1hZ2VVUkxQcm9taXNlID0gZnVuY3Rpb24gc2VuZEltYWdlVVJMUHJvbWlzZShpbWFnZVRpdGxlcyl7XHJcblx0XHR2YXIgZGVmID0gJHEuZGVmZXIoKTsgXHJcblxyXG5cdFx0JE1lZGlhV2lraUpTKCdodHRwczovL2VuLndpa2lwZWRpYS5vcmcnLCB7IFxyXG5cdFx0XHRcdGFjdGlvbjogJ3F1ZXJ5JywgXHJcblx0XHRcdFx0dGl0bGVzOiBpbWFnZVRpdGxlcywgXHJcblx0XHRcdFx0cHJvcDogJ2ltYWdlaW5mbycsIFxyXG5cdFx0XHRcdGlpcHJvcDogJ3VybCcgXHJcblx0XHRcdH0sIFxyXG5cdFx0XHRmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0XHRkZWYucmVzb2x2ZShkYXRhKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0IHJldHVybiBkZWYucHJvbWlzZTtcclxuXHR9O1xyXG5cclxuXHJcblx0cmV0dXJuIGludGZhY2U7IFxyXG59KTtcclxuIiwiTW9kdWxlTWFuYWdlci5kZWZpbmUoJ2F1dG9jb21wbGV0ZURpcmVjdGl2ZScsIFsgJyRkb2N1bWVudCcsICdET01TZXJ2aWNlJ10sIGZ1bmN0aW9uIGF1dG9jb21wbGV0ZURpcmVjdGl2ZUZ1bmMoJGRvY3VtZW50LCBET00pe1xyXG4gXHQvLyBEaXJlY3RpdmUgdG8gY3JlYXRlIERPTSBjb21wb25lbnQgd2l0aCBBUEkgdG8gZnVsbGZpbGwgaXQgd2l0aCBkYXRhXHJcblx0Ly8gVGhpcyBpcyBhdXRvb2NvbXBsZXRlIGNvbXBvbmVudCB3aGljaCB0YWtlcyB0byBjYWxsYmFjayBmdW5jdGlvbiBhcyBhIHBhcmFtZXRlcnMgKGZ1bGwgZGVzY3J0aXB0aW9uIGJlbG93KVxyXG5cdC8vIEFQSSBnaXZlcyBwb3NzaWJpbGl0IHRvIGNyZWF0ZSBhdXRvY29tcGxldGUgb3B0aW9ucyB3aWRnZXQgLy8gSkggXHJcblx0XHJcblx0Ly8gYWMgLSBhdXRvY29tcGxldGVcclxuXHJcbiBcdHZhciBhY1dyYXBwZXIgPSBET00uY3JlYXRlRG9tRWwoJ2RpdicsICdqaC1hdXRvY29tcGxldGVfX3dyYXBwZXInKSwgXHJcbiBcdFx0YWNJbnB1dFNlYXJjaCA9IERPTS5jcmVhdGVEb21FbCgnaW5wdXQnLCAnamgtYXV0b2NvbXBsZXRlX19pbnB1dCcsIG51bGwsIFtbJ3R5cGUnLCAnc2VhcmNoJ11dKSwgXHJcbiBcdFx0YWNMaXN0Q29udGFpbmVyID0gRE9NLmNyZWF0ZURvbUVsKCdkaXYnLCAnamgtYXV0b2NvbXBsZXRlX19saXN0LWNvbnRhaW5lcicpLFxyXG4gXHRcdGFjTGlzdCA9IERPTS5jcmVhdGVEb21FbCgndWwnLCAnamgtYXV0b2NvbXBsZXRlX19saXN0JyksXHJcbiBcdFx0YWNMaXN0SXRlbSA9IERPTS5jcmVhdGVEb21FbCgnbGknLCAnamgtYXV0b2NvbXBsZXRlX19saXN0LWl0ZW0nKTtcclxuXHJcbiBcdGFjTGlzdENvbnRhaW5lci5hcHBlbmRDaGlsZChhY0xpc3QpO1xyXG5cclxuIFx0YWNXcmFwcGVyLmFwcGVuZENoaWxkKGFjSW5wdXRTZWFyY2gpO1xyXG4gXHRhY1dyYXBwZXIuYXBwZW5kQ2hpbGQoYWNMaXN0Q29udGFpbmVyKTtcclxuXHJcbiBcdC8vIC0tLS0tLS0tIC8vIGRpcmVjdGl2ZSBpbnRlcmZhY2UgLy8gLS0tLS0tLS0tLy8vIFxyXG5cclxuIFx0dmFyIGludGZhY2UgPSB7fTtcclxuXHJcbiBcdGludGZhY2UuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlQXV0b2NvbWxldGUoYXV0b2NvbXBsZXRlUGhyYXNlU2VhcmNoRnVuYywgb25FbnRlclNlYXJjaEZ1bmMpe1xyXG4gXHRcdC8vIGZ1bmN0aW9uIHRha2VzIHR3byBjYWxsYmFjayBmdW5jdGlvbnMgYXMgYSBwYXJhbWV0ZXJzIFxyXG4gXHRcdC8vIC0gYXV0b2NvbXBsZXRlUGhyYXNlU2VhcmNoRnVuYyAtIGZ1bmN0aW9uIGNhbGxlZCB3aGVuIGlucHV0IHZhbHVlIGxlbmd0aCB3aWxsIGhhdmUgbW9yZSB0aGVuIHR3byBsZXR0ZXJzXHJcbiBcdFx0Ly8gLSBvbkVudGVyU2VhcmNoRnVuYyAtIGZ1bmN0aW9uIGNhbGxlZCB3aGVuIHVzZXIga2V5IHdpbGwgaW5zZXJ0IGVudGVyIGtleSAvLyBKSFxyXG5cclxuIFx0XHR2YXIgbmV3QXV0b2NvbXBsZXRlID0gYWNXcmFwcGVyLmNsb25lTm9kZSh0cnVlKSxcclxuIFx0XHRcdHNlYXJjaElucHV0ID0gbmV3QXV0b2NvbXBsZXRlLmNoaWxkcmVuWzBdLCBcclxuIFx0XHRcdGF1dG9jb21wbGV0ZU9wdGlvbnNMaXN0ID0gbmV3QXV0b2NvbXBsZXRlLmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdLCAgIFxyXG4gXHRcdFx0YXV0b2NvcG1sZXRlU2luZ2xlT3B0aW9uID0gYWNMaXN0SXRlbS5jbG9uZU5vZGUodHJ1ZSk7XHJcbiBcdFx0XHRuZXdBdXRvY29tcGxldGUudmFsdWUgPSAnJztcclxuXHJcbiBcdFx0c2VhcmNoSW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIGNoZWNrS2V5ZG93bkV2ZW50S2V5VmFsdWUpOyBcclxuXHJcbiBcdFx0Ly8ga2V5IGV2ZW50IGxpc3RlbmVyIGZ1bmNcclxuXHJcblx0XHRmdW5jdGlvbiBjaGVja0tleWRvd25FdmVudEtleVZhbHVlKGV2ZW50KXtcclxuXHRcdFx0aWYoZXZlbnQua2V5Lmxlbmd0aCA9PT0gMSB8fCBldmVudC5rZXkgPT09ICdCYWNrc3BhY2UnKXsgXHJcblx0XHRcdFx0Ly8gaWYga2V5IGlzIHNvbWUgbGV0dGVyIG9yIG51bWJlciAod2hpdG91dCBzcGVjaWFsIGtleXMpIC8vIEpIICBcclxuXHRcdFx0XHR2YXIga2V5ID0gZXZlbnQua2V5LCBcclxuXHRcdFx0XHRcdHNlYXJjaGVkVmFsdWUgPSBudWxsOyBcclxuXHJcblx0XHRcdFx0aWYoa2V5ID09PSAnQmFja3NwYWNlJyl7XHJcblx0XHRcdFx0XHRzZWFyY2hlZFZhbHVlID0gc2VhcmNoSW5wdXQudmFsdWUuc2xpY2UoMCwgLTEpO1xyXG5cclxuXHRcdFx0XHRcdGlmKHNlYXJjaGVkVmFsdWUubGVuZ3RoIDwgMyl7XHJcblx0XHRcdFx0XHRcdC8vIGhpZGUgYXV0b2NvbXBsZXRlXHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0c2VhcmNoSW5wdXQuY2xhc3NOYW1lID0gJ2poLWF1dG9jb21wbGV0ZV9faW5wdXQnO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuIFx0XHRcdFx0ZWxzZSB7IFxyXG5cdFx0XHRcdFx0c2VhcmNoZWRWYWx1ZSA9IHNlYXJjaElucHV0LnZhbHVlICsga2V5O1xyXG5cdFx0XHRcdH1cclxuIFx0XHRcdFxyXG4gXHRcdFx0XHRuZXdBdXRvY29tcGxldGUudmFsdWUgPSBzZWFyY2hlZFZhbHVlO1xyXG5cclxuXHRcdFx0XHRpZihzZWFyY2hlZFZhbHVlLmxlbmd0aCA+IDIpeyAgXHJcblx0XHRcdFx0XHQvLyBzaG93IGF1dG9jb21wbGV0ZVxyXG5cdFx0XHRcdFx0c2VhcmNoSW5wdXQuY2xhc3NOYW1lID0gc2VhcmNoSW5wdXQuY2xhc3NOYW1lICsgJyBqaC1hdXRvY29tcGxldGVfX2lucHV0LS1hdXRvY29tcGxldGUtdmlzaWJsZSc7XHJcblx0XHRcdFx0XHRhdXRvY29tcGxldGVQaHJhc2VTZWFyY2hGdW5jKHNlYXJjaGVkVmFsdWUpO1xyXG5cdFx0XHRcdH0gIFxyXG5cdFx0XHR9IFx0XHRcclxuXHRcdFx0ZWxzZSBpZiAoKGV2ZW50LmtleSA9PT0gJ0Fycm93RG93bicgfHwgZXZlbnQua2V5ID09PSAnQXJyb3dVcCcpICYmIHNlYXJjaElucHV0LnZhbHVlLmxlbmd0aCA+IDIpe1xyXG5cdFx0XHRcdC8vIGNoYW5nZUF1dG9jb21wbGV0ZU9wdGlvbihldmVudC5rZXkpOyAvLyBUT0RPIDopIC8vIEpIXHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoZXZlbnQua2V5ID09PSAnRW50ZXInICYmIHNlYXJjaElucHV0LnZhbHVlLmxlbmd0aCAhPT0gMCl7IFxyXG5cdFx0XHRcdG9uRW50ZXJTZWFyY2hGdW5jKHNlYXJjaElucHV0LnZhbHVlKTtcclxuXHRcdFx0fVxyXG5cdFx0fSBcdFxyXG5cclxuIFx0XHQvLyBjcmVhdGUgYXV0b2NvbXBsZXRlIG1lbnUgLy8gSkhcclxuXHJcblx0XHRuZXdBdXRvY29tcGxldGUuY3JlYXRlQXV0b2NvbXBsZXRlTWVudSA9IGZ1bmN0aW9uIGNyZWF0ZUF1dG9jb21wbGV0ZU1lbnUob3B0aW9uc0FycmF5KXsgXHJcblx0XHRcdGlmKGF1dG9jb21wbGV0ZU9wdGlvbnNMaXN0LmNoaWxkcmVuLmxlbmd0aCAhPT0gMCl7XHJcblx0XHRcdFx0Zm9yKHZhciBpID0gMCwgYXJyTGVuID0gYXV0b2NvbXBsZXRlT3B0aW9uc0xpc3QuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgYXJyTGVuOyBpKyspeyBcclxuXHRcdFx0XHRcdGF1dG9jb21wbGV0ZU9wdGlvbnNMaXN0LnJlbW92ZUNoaWxkKGF1dG9jb21wbGV0ZU9wdGlvbnNMaXN0LmNoaWxkcmVuWzBdKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdG9wdGlvbnNBcnJheS5mb3JFYWNoKGZ1bmN0aW9uKG9wdGlvblRleHQpeyBcclxuXHRcdFx0XHR2YXIgbmV3QXV0b2NvbXBsZXRlT3B0aW9uID0gYXV0b2NvcG1sZXRlU2luZ2xlT3B0aW9uLmNsb25lTm9kZSh0cnVlKTsgXHJcblx0XHRcdFx0RE9NLmFkZFRleHROb2RlKG5ld0F1dG9jb21wbGV0ZU9wdGlvbiwgb3B0aW9uVGV4dCk7XHJcbiBcdFx0XHRcdG5ld0F1dG9jb21wbGV0ZU9wdGlvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KXsgXHJcbiBcdFx0XHRcdFx0dmFyIHNlbGVjdGVkT3B0aW9uVmFsdWUgPSB0aGlzLmlubmVyVGV4dDtcclxuIFx0XHRcdFx0XHRzZWFyY2hJbnB1dC5jbGFzc05hbWUgPSAnamgtYXV0b2NvbXBsZXRlX19pbnB1dCc7XHJcbiBcdFx0XHRcdFx0c2VhcmNoSW5wdXQudmFsdWUgPSBzZWxlY3RlZE9wdGlvblZhbHVlO1xyXG4gXHRcdFx0XHRcdG9uRW50ZXJTZWFyY2hGdW5jKHNlbGVjdGVkT3B0aW9uVmFsdWUpO1xyXG4gXHRcdFx0XHR9KTtcclxuIFx0XHRcdFx0XHJcblx0XHRcdFx0YXV0b2NvbXBsZXRlT3B0aW9uc0xpc3QuYXBwZW5kQ2hpbGQobmV3QXV0b2NvbXBsZXRlT3B0aW9uKTtcclxuXHRcdFx0fSk7IFxyXG5cdFx0fTtcclxuXHJcblx0XHRyZXR1cm4gbmV3QXV0b2NvbXBsZXRlO1xyXG4gXHR9OyBcclxuXHJcbiBcdHJldHVybiBpbnRmYWNlOyAgXHJcbn0pOyIsIk1vZHVsZU1hbmFnZXIuZGVmaW5lKCdhcnRpY2xlRGlyZWN0aXZlJywgWyAnJGRvY3VtZW50JywgJ0RPTVNlcnZpY2UnXSwgZnVuY3Rpb24gYXJ0aWNsZURpcmVjdGl2ZUZ1bmMoJGRvY3VtZW50LCBET00pe1xyXG5cdC8vIERpcmVjdGl2ZSB0byBjcmVhdGUgRE9NIGNvbXBvbmVudCB3aXRoIEFQSSB0byBmdWxsZmlsbCBpdCB3aXRoIGRhdGFcclxuXHQvLyBUaGlzIG9uZSBtYWtlcyBzaW1wbGUgYXJ0aWNsZSBjb21wb25lbnQsIHdpdGggcG9zc2libGl0eSB0byBhZGQgVGl0bGUsIFVSTCwgaW1nIGxhdGVyIGJ5IERpcmVjdGl2ZSBBUEkgLy8gSkggXHJcblxyXG5cdHZhciBhcnRpY2xlID0gRE9NLmNyZWF0ZURvbUVsKCdhcnRpY2xlJywgJycpLFxyXG5cdCBcdGFzaWRlID0gRE9NLmNyZWF0ZURvbUVsKCdhc2lkZScsICcnKSxcclxuXHQgXHRoZWFkZXIgPSBET00uY3JlYXRlRG9tRWwoJ2hlYWRlcicsICcnKSxcclxuXHQgXHRjb250ZW50ID0gRE9NLmNyZWF0ZURvbUVsKCdjb250ZW50JywgJycpLFxyXG5cdCBcdHNlY3Rpb24gPSBET00uY3JlYXRlRG9tRWwoJ3NlY3Rpb24nLCAnJyksXHJcblx0IFx0YSA9IERPTS5jcmVhdGVEb21FbCgnYScsICcnKSxcclxuXHQgXHRpbWcgPSBET00uY3JlYXRlRG9tRWwoJ2ltZycsICcnKTtcclxuXHJcblx0YXNpZGUuYXBwZW5kQ2hpbGQoaW1nKTtcclxuXHRET00uYXBwZW5kQ2hpbGRyZW4oY29udGVudCwgW3NlY3Rpb24sIGFzaWRlXSk7XHJcblx0aGVhZGVyLmFwcGVuZENoaWxkKGEpO1xyXG5cdERPTS5hcHBlbmRDaGlsZHJlbihhcnRpY2xlLCBbaGVhZGVyLCBjb250ZW50XSk7XHJcblxyXG4gXHRmdW5jdGlvbiBzZXREZXNjcmlwdGlvblRleHQodGV4dCl7XHJcbiBcdFx0dmFyIHNlY3Rpb24gPSB0aGlzLmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdO1xyXG4gXHRcdERPTS5hZGRUZXh0Tm9kZShzZWN0aW9uLCB0ZXh0KTtcclxuIFx0fTsgXHJcblxyXG4gXHRmdW5jdGlvbiBzZXRJbWFnZVVSTChpbWdVUkwpe1xyXG4gXHRcdHZhciBpbWcgPSB0aGlzLmNoaWxkcmVuWzFdLmNoaWxkcmVuWzFdLmNoaWxkcmVuWzBdOyAgXHJcbiBcdFx0aW1nLnNyYyA9IGltZ1VSTDtcclxuIFx0fVxyXG5cclxuIFx0ZnVuY3Rpb24gc2V0TGlua1VSTChtYWluVXJsKXsgXHJcbiBcdFx0dmFyIGEgPSB0aGlzLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdOyBcclxuXHRcdGEuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBtYWluVXJsKTtcclxuIFx0fVxyXG5cclxuIFx0ZnVuY3Rpb24gc2V0QXJ0aWNsZVRpdGxlKHRpdGxlKXsgXHJcbiBcdFx0dmFyIGEgPSB0aGlzLmNoaWxkcmVuWzBdLmNoaWxkcmVuWzBdOyBcclxuIFx0XHRET00uYWRkVGV4dE5vZGUoYSwgdGl0bGUpO1xyXG4gXHR9IFxyXG5cclxuIFx0Ly8gLS0tLS0tLS0gLy8gZGlyZWN0aXZlIGludGVyZmFjZSAvLyAtLS0tLS0tLS0vLy8gXHJcblxyXG4gXHR2YXIgaW50ZmFjZSA9IHt9O1xyXG5cclxuIFx0aW50ZmFjZS5jcmVhdGUgPSBmdW5jdGlvbiBjbG9uZUFydGNpbGVOb2RlKCl7XHJcbiBcdFx0dmFyIG5ld0FydGljbGUgPSBhcnRpY2xlLmNsb25lTm9kZSh0cnVlKTtcclxuXHRcdFxyXG5cdFx0bmV3QXJ0aWNsZS5zZXREZXNjcmlwdGlvblRleHQgPSBzZXREZXNjcmlwdGlvblRleHQ7XHJcblx0XHRuZXdBcnRpY2xlLnNldEltYWdlVVJMID0gc2V0SW1hZ2VVUkw7XHJcblx0XHRuZXdBcnRpY2xlLnNldExpbmtVUkwgPSBzZXRMaW5rVVJMO1xyXG5cdFx0bmV3QXJ0aWNsZS5zZXRBcnRpY2xlVGl0bGUgPSBzZXRBcnRpY2xlVGl0bGU7XHJcblxyXG5cdFx0cmV0dXJuIG5ld0FydGljbGU7XHJcbiBcdH0gXHJcblxyXG4gXHRyZXR1cm4gaW50ZmFjZTsgIFxyXG59KTsiLCJNb2R1bGVNYW5hZ2VyLmRlZmluZSgnU2VhcmNoaW5nVmlld0NvbnRyb2xsZXInLCBbICckZG9jdW1lbnQnLCAnJHdpbmRvdycsICdXaWtpUmVxZXVlc3RzU2VydmljZScsICdET01TZXJ2aWNlJywgJ2FydGljbGVEaXJlY3RpdmUnLCAnYXV0b2NvbXBsZXRlRGlyZWN0aXZlJ10sIGZ1bmN0aW9uIFNlYXJjaGluZ1ZpZXdDb250cm9sbGVyKCRkb2N1bWVudCwgJHdpbmRvdywgV2lraVJlcWV1ZXN0c1NlcnZpY2UsIERPTSwgYXJ0aWNsZURpcmVjdGl2ZSwgYXV0b2NvbXBsZXRlRGlyZWN0aXZlKXtcclxuXHRcclxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cdC8vICAgICAgICAgICAgICAgICAgXHRcdGJvb3RzdHJhcGluZyBET00gICBcdFx0XHRcdFx0XHQgLy9cclxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vLyBcclxuXHQvLyBET00gY3JlYXRpb24gYWZ0ZXIgYXBwIHN0YXJ0cyAvLyBKSCBcclxuXHJcblx0dmFyIG1haW5OYXYgPSBET00uY3JlYXRlRG9tRWwoJ25hdicsICduYXYtLXN0YXJ0aW5nLXNpdGUtc3RhdGUnLCBudWxsLCBbWydpZCcsICduYXZpZ2F0aW9uQ29udGFpbmVyJ11dKSwgXHJcblx0XHRtYWluUmVzdWx0c0NvbnRhaW5lciA9ICBET00uY3JlYXRlRG9tRWwoJ21haW4nLCAnbWFpbi1jb250YWluZXInLCBudWxsLCBbWydpZCcsICdtYWluUmVzdWx0c0NvbnRhaW5lciddXSksIFxyXG5cdFx0c2VhcmNoQnV0dG9uID0gRE9NLmNyZWF0ZURvbUVsKCdidXR0b24nLCAnJywgJ1NuaWZmIScsIFtbJ2lkJywgJ3NlYXJjaEJ1dHRvbiddXSksIFxyXG5cdFx0dGl0bGUgPSBET00uY3JlYXRlRG9tRWwoJ2gzJywgJycsICdXaWtpU25pZmZ5JyksXHJcblx0XHRhdXRvY29tcGxldGVJbnB1dCA9IGF1dG9jb21wbGV0ZURpcmVjdGl2ZS5jcmVhdGUocnVuQXV0b2NvbXBsZXRlRmlsbFByb2Nlc3MsIHJ1blNlYXJjaGluZ1Byb2Nlc3MpO1xyXG5cclxuXHQkZG9jdW1lbnQuYm9keS5pbnNlcnRCZWZvcmUobWFpblJlc3VsdHNDb250YWluZXIsICRkb2N1bWVudC5ib2R5LmNoaWxkcmVuWzBdKTsgLy8gYWRkaW5nIG1haW4gY29udGFpbmVycyBiZWZvcmUgc2NyaXB0IHRhZ3MgLy8gSkggXHJcblx0JGRvY3VtZW50LmJvZHkuaW5zZXJ0QmVmb3JlKG1haW5OYXYsICRkb2N1bWVudC5ib2R5LmNoaWxkcmVuWzBdKTtcclxuXHJcblx0RE9NLmFwcGVuZENoaWxkcmVuKG1haW5OYXYsIFt0aXRsZSwgYXV0b2NvbXBsZXRlSW5wdXQsIHNlYXJjaEJ1dHRvbl0pOyBcclxuXHJcblx0c2VhcmNoQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgY2hlY2tTZWFyY2hJbnB1dFZhbHVlKVxyXG5cclxuXHRmdW5jdGlvbiBjaGVja1NlYXJjaElucHV0VmFsdWUoKXsgXHJcblx0XHRydW5TZWFyY2hpbmdQcm9jZXNzKGF1dG9jb21wbGV0ZUlucHV0LnZhbHVlKTtcclxuXHR9XHJcblxyXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblx0Ly8gICAgICAgICAgICAgICAgICAgIERPTSBtYW5pcHVsYXRpb25zIGNvbnRyb2wgIFx0XHRcdFx0XHQgLy9cclxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vLyBcclxuXHQvLyBmdW5jdGlvbnMgY3JlYXRlZCB0byBtYWtlIERPTSBtYW5pcHVsYXRpb24gYWZyZXIgcmVjaXZpbmcgZGF0YSAvLyBKSCBcclxuIFxyXG5cdGZ1bmN0aW9uIGFkZEFydGljbGVUb01haW5Db250YWluZXIoYXJ0aWNsZURhdGEpeyBcclxuICAgICAgICB2YXIgYXJ0aWNsZSA9ICBhcnRpY2xlRGlyZWN0aXZlLmNyZWF0ZSgpO1xyXG4gIFxyXG5cdFx0YXJ0aWNsZS5zZXRMaW5rVVJMKGFydGljbGVEYXRhLnVybCk7XHJcblx0XHRhcnRpY2xlLnNldEFydGljbGVUaXRsZShhcnRpY2xlRGF0YS50aXRsZSk7XHJcblx0XHRcclxuXHRcdG1haW5SZXN1bHRzQ29udGFpbmVyLmFwcGVuZENoaWxkKGFydGljbGUpO1x0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBhZGRJbWdUb1NlbGVjdGVkQXJ0aWNsZShhcnRpY2xlSW5kZXgsIGltZ1VSTCl7IFxyXG5cdFx0aW1nVVJMID0gaW1nVVJMIHx8IFwiLi9pbWcvd2lraS5wbmdcIjsgXHJcblx0XHRtYWluUmVzdWx0c0NvbnRhaW5lci5jaGlsZHJlblthcnRpY2xlSW5kZXhdLnNldEltYWdlVVJMKGltZ1VSTCk7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBhZGRUZXh0VG9TZWxlY3RlZEFydGljbGUoYXJ0aWNsZUluZGV4LCBhcnRpY2xlVGV4dCl7ICBcclxuXHRcdG1haW5SZXN1bHRzQ29udGFpbmVyLmNoaWxkcmVuW2FydGljbGVJbmRleF0uc2V0RGVzY3JpcHRpb25UZXh0KGFydGljbGVUZXh0KTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlbW92ZUFsbEFydGljbGVzRnJvbU1haW5Db250YWluZXIoKXsgXHJcblx0XHRpZihtYWluUmVzdWx0c0NvbnRhaW5lci5jaGlsZHJlbi5sZW5ndGggIT09IDApe1xyXG5cdFx0XHRmb3IodmFyIGkgPSAwLCBhcnJMZW4gPSBtYWluUmVzdWx0c0NvbnRhaW5lci5jaGlsZHJlbi5sZW5ndGg7IGkgPCBhcnJMZW47IGkrKyl7IFxyXG5cdFx0XHRcdG1haW5SZXN1bHRzQ29udGFpbmVyLnJlbW92ZUNoaWxkKG1haW5SZXN1bHRzQ29udGFpbmVyLmNoaWxkcmVuWzBdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0dmFyIGlzVGhpc0ZpcnN0U2VhcmNoID0gdHJ1ZTtcclxuXHJcblx0ZnVuY3Rpb24gY2hhbmdlQXBwU3RhdGVGcm9tU3RhcnRpbmdUb1NlYXJjaGluZygpe1xyXG5cdFx0aWYoaXNUaGlzRmlyc3RTZWFyY2gpe1xyXG5cdFx0XHRtYWluTmF2LmNsYXNzTmFtZSA9ICcnOyBcdFxyXG5cdFx0XHRpc1RoaXNGaXJzdFNlYXJjaCA9IGZhbHNlO1x0XHRcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblx0Ly8gICAgICAgICAgICAgICAgICAgICAgICAgUkVTVUxUIE9CU0VSVkVSIFx0XHRcdFx0XHRcdFx0IC8vXHJcblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHQvLyBpdCB3YWl0cyBmb3IgcmVzcG9uZHMgZnJvbSByZXFlc3QgcHJvY2Vzc2VzIGFuZCBiYXNlZCBvbiB0aG9zZSByZXNwb25kcyBpdCBtYWtpbmcgXHJcblx0Ly8gRE9NIG1hbmlwdWxhdGlvbnMgLy8gSkggXHJcblxyXG5cdHZhciByZXVsdHNPYnNlcnZlciA9IHtcclxuXHRcdF9zZWFyY2hEZXRhaWxzOiBudWxsLCBcclxuXHRcdF9hdXRvY29tcGxldGVPcHRpb25zOiBudWxsLCBcclxuXHRcdF9sYXN0UmVjaXZlZEltYWdlVVJMZGF0YTogbnVsbCwgXHJcblx0XHRfbGFzdFJlY2l2ZWREZXNjcmlwdGlvbkRhdGE6IG51bGwsIFxyXG5cdFx0X2FydGljbGVzSW1hZ2VVUkxDb2xsZWN0aW9uOiB7fSwgXHJcblx0XHRfYXJ0aWNsZXNUZXh0RGF0YUNvbGxlY3Rpb246IHt9LFxyXG5cclxuXHRcdHNldCBhdXRvY29tcGxldGVPcHRpb25zKG9wdGlvbnNBcnJheSl7XHJcblx0XHRcdHRoaXMuX2F1dG9jb21wbGV0ZU9wdGlvbnMgPSBvcHRpb25zQXJyYXk7XHJcblx0XHRcdGF1dG9jb21wbGV0ZUlucHV0LmNyZWF0ZUF1dG9jb21wbGV0ZU1lbnUob3B0aW9uc0FycmF5KSBcclxuXHRcdH0sXHJcblxyXG5cdFx0c2V0IHNlYXJjaERldGFpbHMoc2VhcmNoRGF0YUNvbGxlY3Rpb24pe1xyXG5cdFx0XHR0aGlzLl9zZWFyY2hSZXN1bHRzID0gc2VhcmNoRGF0YUNvbGxlY3Rpb247ICBcclxuXHRcdFx0c2VhcmNoRGF0YUNvbGxlY3Rpb24uZm9yRWFjaChhZGRBcnRpY2xlVG9NYWluQ29udGFpbmVyKTtcclxuXHRcdFx0c2VhcmNoRGF0YUNvbGxlY3Rpb24uZm9yRWFjaChydW5HZXRBcnRpY2xlVGV4dFByb2Nlc3MpOyBcclxuXHRcdFx0Y2hhbmdlQXBwU3RhdGVGcm9tU3RhcnRpbmdUb1NlYXJjaGluZygpO1xyXG5cdFx0fSwgXHJcblxyXG5cdFx0c2V0IGltYWdlVVJMZGF0YShpbWFnZVVSTGRhdGEpe1xyXG5cdFx0XHR0aGlzLl9sYXN0UmVjaXZlZEltYWdlVVJMZGF0YSA9IGltYWdlVVJMZGF0YTtcclxuXHRcdFx0dGhpcy5fYXJ0aWNsZXNJbWFnZVVSTENvbGxlY3Rpb25baW1hZ2VVUkxkYXRhLmluZGV4XSA9IGltYWdlVVJMZGF0YS51cmw7XHJcblx0XHRcdGFkZEltZ1RvU2VsZWN0ZWRBcnRpY2xlKGltYWdlVVJMZGF0YS5pbmRleCwgaW1hZ2VVUkxkYXRhLnVybCk7XHJcblx0XHR9LFx0XHRcclxuXHJcblx0XHRzZXQgZGVzY3JpcHRpb25EYXRhKHRleHREYXRhKXtcclxuXHRcdFx0dGhpcy5fbGFzdFJlY2l2ZWREZXNjcmlwdGlvbkRhdGEgPSB0ZXh0RGF0YTtcclxuXHRcdFx0dGhpcy5fYXJ0aWNsZXNJbWFnZVVSTENvbGxlY3Rpb25bdGV4dERhdGEuaW5kZXhdID0gdGV4dERhdGEudGV4dDtcclxuXHRcdFx0YWRkVGV4dFRvU2VsZWN0ZWRBcnRpY2xlKHRleHREYXRhLmluZGV4LCB0ZXh0RGF0YS50ZXh0KTtcclxuXHJcblx0XHRcdC8vIEFmdGVyIHJlY2VpdmluZyBhbGwgYXJ0aWNsZXMgZGVzY3JpcHRpb25zLCBzdGFydCBwcm9jY2VzcyBvZiBnZXR0aW5nIGltYWdlcyB0byBhcnRpY2xlcyAvLyBKSCBcclxuXHRcdFx0dmFyIGNoZWNrSXNJdExhc3RDb3VudGVyID0gMDtcclxuXHRcdFx0Zm9yKHZhciB0ZXh0RGF0YSBpbiB0aGlzLl9hcnRpY2xlc0ltYWdlVVJMQ29sbGVjdGlvbil7XHJcblx0XHRcdFx0Y2hlY2tJc0l0TGFzdENvdW50ZXIrKyBcclxuXHRcdFx0XHRpZihjaGVja0lzSXRMYXN0Q291bnRlciA9PT0gMTApe1xyXG5cdFx0XHRcdFx0dGhpcy5fc2VhcmNoUmVzdWx0cy5mb3JFYWNoKHJ1bkdldEltYWdlVVJMUHJvY2VzcylcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblxyXG5cdH07XHJcbiBcclxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cdC8vICAgICAgICAgICAgICAgICAgICAgICBMT0dJQyAtIHJlcXVlc3QgcHJvY2Vzc2VzIFx0XHRcdFx0XHQgLy9cclxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vLyAgXHJcblx0Ly8gZnVuY3Rpb25zIGNyZWF0ZWQgdG8gbWFraW5nIHJlcWVzdHMgZm9yIGRhdGEgYW5kIHByZXBhcmluZyBhbnN3ZXJzIHRvIHJpZ2h0IHVzZSAvLyBKSCBcclxuXHJcblx0dmFyIHdycyA9IFdpa2lSZXFldWVzdHNTZXJ2aWNlO1xyXG5cclxuXHRmdW5jdGlvbiBydW5BdXRvY29tcGxldGVGaWxsUHJvY2VzcyhzZWFyY2hlZFZhbHVlKXsgICBcclxuXHRcdHdycy5zZW5kQXV0b2NvbXBsZXRlUmVxdWVzdFByb21pc2Uoc2VhcmNoZWRWYWx1ZSkudGhlbihmdW5jdGlvbihkYXRhKXtcclxuXHRcdFx0cmV1bHRzT2JzZXJ2ZXIuYXV0b2NvbXBsZXRlT3B0aW9ucyA9IHJldHVyblByb3BlcnRpZXNWYWx1ZXNBcnJheShkYXRhLnF1ZXJ5LnNlYXJjaCwgJ3RpdGxlJyk7IFx0XHRcdFxyXG5cdFx0fSk7IFxyXG5cdH0gXHJcblxyXG5cdGZ1bmN0aW9uIHJ1blNlYXJjaGluZ1Byb2Nlc3Moc2VhcmNoZWRQaHJhc2UpeyAgXHJcblx0XHRyZW1vdmVBbGxBcnRpY2xlc0Zyb21NYWluQ29udGFpbmVyKCk7XHJcblxyXG5cdFx0d3JzLnNlbmRTZWFyY2hSZXF1ZXN0UHJvbWlzZShzZWFyY2hlZFBocmFzZSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0dmFyIHNlYXJjaFJlc3VsdHNDb2xsZWN0aW9uID0gZGF0YS5xdWVyeS5hbGxwYWdlczsgICBcclxuXHJcblx0XHRcdFx0d3JzLnNlbmRSZXN1bHRzRGV0YWlsUHJvbWlzZShyZXR1cm5Qcm9wZXJ0aWVzVmFsdWVzQXJyYXkoc2VhcmNoUmVzdWx0c0NvbGxlY3Rpb24sICd0aXRsZScpLmpvaW4oJ3wnKSlcclxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihkYXRhKXsgXHJcblxyXG5cdFx0XHRcdFx0dmFyIHBhZ2VzQ29sbGVjdGlvbiA9IGRhdGEucXVlcnkucGFnZXMsIFxyXG5cdFx0XHRcdFx0XHRyZXN1bHRzRGF0YUNvbGxlY3Rpb24gPSBbXSwgXHJcblx0XHRcdFx0XHRcdGNvdW50ZXIgPSAwOyBcclxuXHJcblx0XHRcdFx0XHRmb3IodmFyIHBhZ2UgaW4gcGFnZXNDb2xsZWN0aW9uKXsgXHJcblx0XHRcdFx0XHRcdHJlc3VsdHNEYXRhQ29sbGVjdGlvbi5wdXNoKHsgXHJcblx0XHRcdFx0XHRcdFx0dGl0bGU6IHBhZ2VzQ29sbGVjdGlvbltwYWdlXS50aXRsZSwgXHJcblx0XHRcdFx0XHRcdFx0dXJsOiBwYWdlc0NvbGxlY3Rpb25bcGFnZV0uZnVsbHVybCwgXHJcblx0XHRcdFx0XHRcdH0pOyBcclxuXHJcblx0XHRcdFx0XHRcdGlmKHBhZ2VzQ29sbGVjdGlvbltwYWdlXS5pbWFnZXMgJiYgcGFnZXNDb2xsZWN0aW9uW3BhZ2VdLmltYWdlcy5sZW5ndGggIT09IDApe1xyXG5cdFx0XHRcdFx0XHRcdHJlc3VsdHNEYXRhQ29sbGVjdGlvbltjb3VudGVyXS5pbWFnZVRpdGxlID0gcGFnZXNDb2xsZWN0aW9uW3BhZ2VdLmltYWdlc1swXS50aXRsZTtcclxuXHRcdFx0XHRcdFx0fSBcclxuXHJcblx0XHRcdFx0XHRcdGNvdW50ZXIgPSBjb3VudGVyICsgMTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRyZXVsdHNPYnNlcnZlci5zZWFyY2hEZXRhaWxzID0gcmVzdWx0c0RhdGFDb2xsZWN0aW9uO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuICBcdGZ1bmN0aW9uIHJ1bkdldEltYWdlVVJMUHJvY2VzcyhhcnRpY2xlRGF0YSwgaW5kKXsgXHJcblx0XHRpZihhcnRpY2xlRGF0YS5pbWFnZVRpdGxlKXtcdFx0ICBcdFx0XHJcblx0XHRcdHdycy5zZW5kSW1hZ2VVUkxQcm9taXNlKGFydGljbGVEYXRhLmltYWdlVGl0bGUpXHJcblx0ICBcdFx0LnRoZW4oZnVuY3Rpb24oZGF0YSl7XHJcblx0XHRcdFx0dmFyIHBhZ2VzQ29sbGVjdGlvbiA9IGRhdGEucXVlcnkucGFnZXM7IFxyXG5cdFx0XHRcdGZvcih2YXIgcGFnZSBpbiBwYWdlc0NvbGxlY3Rpb24peyAgIFxyXG5cdFx0XHRcdFx0aWYocGFnZXNDb2xsZWN0aW9uW3BhZ2VdLmltYWdlaW5mbyAmJiBwYWdlc0NvbGxlY3Rpb25bcGFnZV0uaW1hZ2VpbmZvLmxlbmd0aCAhPT0gMCl7ICBcclxuXHRcdFx0XHRcdFx0cmV1bHRzT2JzZXJ2ZXIuaW1hZ2VVUkxkYXRhID0geyBpbmRleDogaW5kLCB1cmw6IHBhZ2VzQ29sbGVjdGlvbltwYWdlXS5pbWFnZWluZm9bMF0udXJsIHx8IG51bGwgfTtcclxuXHRcdFx0XHRcdH0gXHJcblx0XHRcdFx0XHRlbHNlIHtcclxuXHRcdFx0XHRcdFx0cmV1bHRzT2JzZXJ2ZXIuaW1hZ2VVUkxkYXRhID0geyBpbmRleDogaW5kLCB1cmw6IG51bGwgfTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9IFxyXG5cdCAgXHRcdH0pO1xyXG4gIFx0XHR9IGVsc2Uge1xyXG4gIFx0XHRcdHJldWx0c09ic2VydmVyLmltYWdlVVJMZGF0YSA9IHsgaW5kZXg6IGluZCwgdXJsOiBudWxsIH07XHJcbiAgXHRcdH0gXHJcbiAgXHR9XHJcblxyXG4gIFx0ZnVuY3Rpb24gcnVuR2V0QXJ0aWNsZVRleHRQcm9jZXNzKGFydGljbGVEYXRhLCBpbmQpeyBcclxuXHRcdGlmKGFydGljbGVEYXRhLnRpdGxlKXtcdFx0ICBcdFx0XHJcblx0XHRcdHdycy5zZW5kRXh0cmFjdFByb21pc2UoYXJ0aWNsZURhdGEudGl0bGUpXHJcblx0ICBcdFx0LnRoZW4oZnVuY3Rpb24oZGF0YSl7IFxyXG5cdFx0XHRcdHZhciBwYWdlc0NvbGxlY3Rpb24gPSBkYXRhLnF1ZXJ5LnBhZ2VzOyBcclxuXHRcdFx0XHRmb3IodmFyIHBhZ2UgaW4gcGFnZXNDb2xsZWN0aW9uKXsgICBcclxuXHRcdFx0XHRcdHJldWx0c09ic2VydmVyLmRlc2NyaXB0aW9uRGF0YSA9IHtpbmRleDogaW5kLCB0ZXh0OnBhZ2VzQ29sbGVjdGlvbltwYWdlXS5leHRyYWN0IH07XHJcblx0XHRcdFx0fSBcclxuXHQgIFx0XHR9KTtcclxuICBcdFx0fSBcclxuICBcdH1cclxuXHJcbiAgXHQvLyBzaW1wbGUgZnVuY3Rpb25hbCB0cmFuc2Zvcm0gLSByZXR1cm4gYW4gYXJyYXkgZnJvbSBvYmplY3QgdGFraW5nIGFsbCBwcm9wZXJ0aWVzIHdpdGggY2hvc2VuIHByb3BlcnR5IG5hbWUgLy8gSkggXHJcblxyXG5cdGZ1bmN0aW9uIHJldHVyblByb3BlcnRpZXNWYWx1ZXNBcnJheShhcnJheU9mT2JqZWN0cywgY2hvc2VuUHJvcGVydHkpe1xyXG5cdFx0dmFyIGFyciA9IFtdO1xyXG5cclxuXHRcdGZvcih2YXIgeCA9IDAsIGFycmF5T2ZPYmplY3RzTGVuZ3RoID0gYXJyYXlPZk9iamVjdHMubGVuZ3RoOyB4IDwgYXJyYXlPZk9iamVjdHNMZW5ndGg7IHgrKyl7IFxyXG5cdFx0XHRhcnIucHVzaChhcnJheU9mT2JqZWN0c1t4XVtjaG9zZW5Qcm9wZXJ0eV0pO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBhcnI7XHJcblx0fVxyXG5cclxufSk7Il19
