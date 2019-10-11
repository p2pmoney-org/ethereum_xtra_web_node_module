'use strict';

console.log('react-native-load.js');


class NodeLoad {
	constructor(node_module) {
		this.name = 'nodeload';
		
		this.node_module = node_module;
	}
	
	init(callback) {
		console.log('NodeLoad.init called');
		
		var self = this;
		var _globalscope = global; // nodejs global
		var _noderequire = require; // to avoid problems when react-native processes files
		
		// get ethereum_core
		var ethereum_core = this.node_module.ethereum_core;
		
		if (ethereum_core.initialized === false) {
			console.log('WARNING: ethereum_core should be initialized before initializing ethereum_xtra_web');
		}
		
		// get node module objects
		var Bootstrap = _globalscope.simplestore.Bootstrap;
		var ScriptLoader = _globalscope.simplestore.ScriptLoader;

		var bootstrapobject = Bootstrap.getBootstrapObject();
		var rootscriptloader = ScriptLoader.getRootScriptLoader();
		
		var GlobalClass = _globalscope.simplestore.Global;

		// loading dapps
		let modulescriptloader = ScriptLoader.findScriptLoader('moduleloader');
		
		let xtra_webmodulescriptloader = modulescriptloader.getChildLoader('xtra_webmoduleloader');
		
		// setting script root dir to this node module
		// instead of ethereum_core/imports
		var path = _noderequire('path');
		var script_root_dir = path.join(__dirname, '../imports');
		xtra_webmodulescriptloader.setScriptRootDir(script_root_dir);
		
		
		//modulescriptloader.setScriptRootDir(script_root_dir); // because xtra_web uses modulescriptloader instead of xtra_webmodulescriptloader

		// xtraconfig
		ScriptLoader.reclaimScriptLoaderName('xtraconfig'); // already used by ethereum_core
		ScriptLoader.reclaimScriptLoaderName('xtramoduleloader'); // already used by ethereum_core
		ScriptLoader.reclaimScriptLoaderName('xtraconfigmoduleloader'); // already used by ethereum_core
		var xtrawebscriptloader = modulescriptloader.getChildLoader('xtrawebconfig');
		
		xtrawebscriptloader.push_script('./js/src/xtra/xtra-config.js', function () {
			console.log('xtraconfig module loaded');
		});

		
		xtrawebscriptloader.push_script('./includes/modules/authkey/module.js', function () {
			console.log('authkey module loaded');
		});
		
		xtrawebscriptloader.load_scripts(function () {
			var _nodeobject = GlobalClass.getGlobalObject();
			
			_nodeobject.loadModule('dapps', xtra_webmodulescriptloader, function() {
				rootscriptloader.signalEvent('on_xtra_web_module_ready');
				
			});
		});
		
		// end of modules load
		rootscriptloader.registerEventListener('on_xtra_web_module_ready', function(eventname) {
			if (callback)
				callback(null, self);
		});

		
	}
		
}


module.exports = NodeLoad;




