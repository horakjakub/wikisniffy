ModuleManager.define('DOMService', ['$document'], function DOMService($document){
    // Module to simple DOM manipulations
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
