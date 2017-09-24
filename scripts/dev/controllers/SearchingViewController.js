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
	// functions created to make DOM manipulation after reciving data // JH
 
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
	// it waits for responds from reqest processes and based on those responds its making
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
				checkIsItLastCounter++;
				if(checkIsItLastCounter === this._searchResults.length){
					this._searchResults.forEach(runGetImageURLProcess)
				}
			}
		}


	};
 
	// ------------------------------------------------------------------//
	//                       LOGIC - request processes 					 //
	// ------------------------------------------------------------------//  
	// functions created to making requests for data and preparing answers to right use // JH

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