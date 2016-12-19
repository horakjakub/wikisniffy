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
