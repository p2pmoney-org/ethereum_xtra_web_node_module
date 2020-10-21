'use strict';

console.log('node-load.js');

class CheckModulesLoad {
	constructor(rootscriptloader, signalstring) {
		this.rootscriptloader = rootscriptloader;
		this.array = [];

		this.signalsent = false;
		this.signalstring = signalstring;
	}

	wait(modulename) {
		this.array.push({name: modulename, loaded: false});
	}

	check(modulename) {
		var arr = this.array;

		if (modulename) {
			for (var i = 0; i < arr.length; i++) {
				var entry = arr[i];
	
				if (entry.name == modulename) {
					entry.loaded = true;
					break;
				}
			}
		}

		for (var i = 0; i < arr.length; i++) {
			var entry = arr[i];

			if (entry.loaded !== true)
				return;
		}

		if (this.signalsent)
		return;
		
		// mark loads have finished
		var rootscriptloader = this.rootscriptloader;
		
		rootscriptloader.signalEvent(this.signalstring);
		this.signalsent = true;
	}
}


class NodeLoad {
	constructor(node_module) {
		this.name = 'nodeload';
		
		this.node_module = node_module;
	}
	
	init(callback) {
		console.log('NodeLoad.init called');
		
		try {
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
	
			// multiple module load signalling
			var checkmodulesload = new CheckModulesLoad(rootscriptloader, 'on_xtra_web_module_ready');
			
			// xtraconfig
			ScriptLoader.reclaimScriptLoaderName('xtraconfig'); // already used by ethereum_core
			ScriptLoader.reclaimScriptLoaderName('xtramoduleloader'); // already used by ethereum_core
			ScriptLoader.reclaimScriptLoaderName('xtraconfigmoduleloader'); // already used by ethereum_core
			
			var xtrawebscriptloader = xtra_webmodulescriptloader.getChildLoader('xtrawebconfig');

			
			// xtraconfig module
			ScriptLoader.reclaimScriptLoaderName('xtraconfigmoduleloader'); // in case another node module used this name
			xtrawebscriptloader.getChildLoader('xtraconfigmoduleloader'); // create loader with correct root dir

			xtrawebscriptloader.push_script('./js/src/xtra/xtra-config.js', function () {
				console.log('xtraconfig module loaded');
			});

			// pushing interfaces (should be better in xtraconfig LoadModule, but trying to avoid
			// potential regressions on ethereum_dapp pure web implementation)
			xtrawebscriptloader.push_script('./js/src/xtra/interface/xtra-ethereum-node-access.js');
			xtrawebscriptloader.push_script('./js/src/xtra/interface/xtra-server-access.js');
			xtrawebscriptloader.push_script('./js/src/xtra/interface/xtra-storage-access.js');


			// xtraconfig module ready (sent by xtraconfig module at the end of registerHooks)
			checkmodulesload.wait('xtraconfig');
			rootscriptloader.registerEventListener('on_xtraconfig_module_ready', function(eventname) {
				checkmodulesload.check('xtraconfig');
			});
	
			
			// auhtkey module
			ScriptLoader.reclaimScriptLoaderName('authkeyloader'); // in case another node module used this name
			xtrawebscriptloader.getChildLoader('authkeyloader'); // create loader with correct root dir

			xtrawebscriptloader.push_script('./includes/modules/authkey/module.js', function () {
				console.log('authkey module loaded');
			});

			// authkey module ready (sent by authkey module at the end of registerHooks)
			checkmodulesload.wait('authkey');
			rootscriptloader.registerEventListener('on_authkey_module_ready', function(eventname) {
				checkmodulesload.check('authkey');
			});
			
			// start loading xtra_webmoduleloader
			xtra_webmodulescriptloader.load_scripts(function () {
				var _nodeobject = GlobalClass.getGlobalObject();
				
				// loading xtra pushed in xtrawebscriptloader
				xtrawebscriptloader.load_scripts(function() {
					checkmodulesload.check();
				});
			});
			
			// end of modules load
			rootscriptloader.registerEventListener('on_xtra_web_module_ready', function(eventname) {
				if (callback)
					callback(null, self);
			});
		}
		catch(e) {
			console.log('exception in NodeLoad.init: ' + e);
			console.log(e.stack);
		}

		
	}
		
}


module.exports = NodeLoad;




