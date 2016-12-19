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