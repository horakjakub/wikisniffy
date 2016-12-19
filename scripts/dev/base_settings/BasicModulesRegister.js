ModuleManager.define('$document', [], function(){ return document; });
ModuleManager.define('$window', [], function(){ return window; });
ModuleManager.define('$q', ['$window'], function($window){ return $window.Q; });
ModuleManager.define('$MediaWikiJS', ['$window'], function($window){ return $window.MediaWikiJS; });