// additional js variables for overload on standard dapp
/**
 * 
 */
'use strict';

class XtraConfigModule {
	constructor() {
		this.name = 'xtraconfig';
		
		this.global = null; // put by global on registration
		this.isready = false;
		this.isloading = false;
		
		this.ethereum_node_access_path = './js/src/xtra/interface/xtra-ethereum-node-access.js';
		this.storage_access_path = './js/src/xtra/interface/xtra-storage-access.js';
		
		this.registerAdditionalModules();
	}
	
	registerAdditionalModules() {
		console.log('registerAdditionalModules called for ' + this.name);
		
		var self = this;
		
		// load and register additional modules
		var _globalscope = (typeof window !== 'undefined' && window  ? window : (typeof global !== 'undefined' && global ? global : console.log('WARNING: could not find global scope!')));

		var ScriptLoader = _globalscope.simplestore.ScriptLoader;
		var Config = _globalscope.simplestore.Config;

		var modulescriptloader = ScriptLoader.findScriptLoader('moduleloader')
		var xtramodulescriptloader = modulescriptloader.getChildLoader('xtramoduleloader')
		
		//var moduleroot = './includes/modules/';
		var moduleroot = './js/src/xtra/modules/';
		
		
		// get list of xtra modules
		var modulearray = [];
		
		// get list of additional modules from Config
		if (Config && Config.get) {
			var xtramodulearray = Config.get('xtramoduleload');
			
			if (Array.isArray(xtramodulearray) === false) {
				if (xtramodulearray) {
					modulearray.push(xtramodulearray);
				}
			}
			else {
				modulearray.push(...xtramodulearray);
			}


			// actual load xtra modules
			
			for (var i = 0; i < modulearray.length; i++) {
				var moduleentry = modulearray[i];
				
				var __push_script = function (modulename) {
					xtramodulescriptloader.push_script( moduleentry['path'], function() {
						// load module if initialization has finished
						if (self.global && (self.global.isReady()))
						global.loadModule(modulename, dappsmodelsloader);
					 });
				};
				
				
				// we need a closure to stack the module's name
				__push_script(moduleentry['name']);
			}

			xtramodulescriptloader.load_scripts();
		}
		
	}
	
	init() {
		console.log('module init called for ' + this.name);
		
		this.isready = true;
	}
	
	// compulsory  module functions
	loadModule(parentscriptloader, callback) {
		console.log('loadModule called for module ' + this.name);
		
		if (this.isloading)
			return;
			
		this.isloading = true;

		var self = this;

		var modulescriptloader = parentscriptloader.getChildLoader('xtraconfigmoduleloader');

		modulescriptloader.load_scripts(function() { self.init(); if (callback) callback(null, self); });

		return modulescriptloader;	
	}
	
	isReady() {
		return this.isready;
	}

	hasLoadStarted() {
		return this.isloading;
	}

	// optional  module functions
	registerHooks() {
		console.log('module registerHooks called for ' + this.name);
		
		var global = this.global;
		
		// initialization
		global.registerHook('preFinalizeGlobalScopeInit_hook', this.name, this.preFinalizeGlobalScopeInit_hook);
		global.registerHook('postFinalizeGlobalScopeInit_hook', this.name, this.postFinalizeGlobalScopeInit_hook);
		
		// node access facade
		global.registerHook('getEthereumNodeAccessInstance_hook', this.name, this.getEthereumNodeAccessInstance_hook);

		// storage access facade
		global.registerHook('getStorageAccessInstance_hook', this.name, this.getStorageAccessInstance_hook);
	}
	
	//
	// hooks
	//
	preFinalizeGlobalScopeInit_hook(result, params) {
		console.log('preFinalizeGlobalScopeInit_hook called for ' + this.name);
		
		var global = this.global;
		var ScriptLoader = window.simplestore.ScriptLoader;

		// create script load promises now
		
		// ethereum node access
		var ethereum_node_access_path = this.ethereum_node_access_path;
		
		var nodeaccesspromise = ScriptLoader.createScriptLoadPromise(ethereum_node_access_path, function() {
			console.log('XtraEthereumNodeAccess loaded')
		})
		
		global.pushFinalInitializationPromise(nodeaccesspromise);

		// storage access
		var storage_access_path = this.storage_access_path;
		
		var storageaccesspromise = ScriptLoader.createScriptLoadPromise(storage_access_path, function() {
			console.log('XtraStorageAccess loaded')
		})
		
		global.pushFinalInitializationPromise(storageaccesspromise);
		
		
		
		result.push({module: this.name, handled: true});
		
		return true;
	}

	postFinalizeGlobalScopeInit_hook(result, params) {
		console.log('postFinalizeGlobalScopeInit_hook called for ' + this.name);
		
		var global = this.global;
		var commonmodule = global.getModuleObject('common');

		// overload EthereumNodeAccess class
		this.EthereumNodeAccess = window.simplestore.Xtra_EthereumNodeAccess;
		
		// overload StorageAccess class
		this.StorageAccess = window.simplestore.Xtra_StorageAccess;
		
		// reset ethereum instance if already instantiated
		var sessions = commonmodule.getSessionObjects();
		
		for (var i = 0; i < sessions.length; i++) {
			var session = sessions[i];
			session.ethereum_node_access_instance = null;
		}

		result.push({module: this.name, handled: true});
		
		return true;
	}
	
	
	_getAppObject() {
		var global = this.global;
		if (global.getAppObject)
			return global.getAppObject();
	}


	// node access facade
	getEthereumNodeAccessInstance_hook(result, params) {
		console.log('XtraConfigModule.getEthereumNodeAccessInstance_hook called');
		
		//var global = XtraConfig.getGlobalObject();
		//var xtraconfigmodule = global.getModuleObject('xtraconfig');
		
		var ethnodeaccessmodule = params[0];
		var session = params[1];
		
		result[0] = new this.EthereumNodeAccess(session); 
		
		return true;
	}
	
	// storage access facade
	getStorageAccessInstance_hook(result, params) {
		console.log('XtraConfigModule.getStorageAccessInstance_hook called');
		
		//var global = XtraConfig.getGlobalObject();
		//var xtraconfigmodule = global.getModuleObject('xtraconfig');
		
		var storageaccessmodule = params[0];
		var session = params[1];
		
		result[0] = new this.StorageAccess(session);
		
		return true;
	}
	
	
	

	
}


class XtraConfig {
	
	constructor() {
		console.log("XtraConfig constructor called");
		
		// overload of existing config variables
		this.allow_remote_access = 'enabled';
		
		// webapp rest access
		this.rest_server_url = ':rest_server_url';
		this.rest_server_api_path = ':rest_server_api_path';
		
		// authentication rest access
		this.authkey_server_url = ':authkey_server_url';
		this.authkey_server_api_path = ':authkey_server_api_path';
		
		// ethereum transactions parameters
		this.defaultgaslimit = ':defaultgaslimit';
		this.defaultgasprice = ':defaultgasprice';
		
		this.need_to_unlock_accounts = ':need_to_unlock_accounts';
		this.wallet_account_challenge = ':wallet_account_challenge';
		this.wallet_account = ':wallet_account';
		
		// execution environment (prod or dev)
		this.client_env = ':client_env';
		
		// additional free variables
		var jsonstring = ':client_xtra_config'; // json to add freely client settings (e.g. for plugins)
		
		this.client_xtra_config = (jsonstring.substring(1) == 'client_xtra_config' ? {} : JSON.parse(jsonstring));
		
		this.init();
	}
	
	init() {
		console.log("XtraConfig initializing");
		
		// replace if necessary values of Config
		this.overloadConfig();
		
		// hooks
		this.initHooks();
	}
	
	initHooks() {
		// OBSOLETE: should use module mechanism now
		console.log("XtraConfig initializing hooks");
	}
	
	overloadConfig() {
		console.log("XtraConfig.overloadConfig called");
		
		if ( typeof window !== 'undefined' && window && window.simplestore.Config) {
			
			// authentication rest access (if value not specified, take default rest server access)
			if (this.authkey_server_url.substring(1) == 'authkey_server_url')
				this.authkey_server_url = this.rest_server_url;

			if (this.authkey_server_api_path.substring(1) == 'authkey_server_api_path')
				this.authkey_server_api_path = this.rest_server_api_path;


			// ethereum transactions parameters
			var overload_gaslimit = (this.defaultgaslimit.substring(1) == 'defaultgaslimit' ? false : true);
			if (overload_gaslimit)
				window.simplestore.Config.defaultGasLimit =  parseInt(this.defaultgaslimit);
			
			var overload_gasprice = (this.defaultgasprice.substring(1) == 'defaultgasprice' ? false : true);
			if (overload_gasprice)
				window.simplestore.Config.defaultGasPrice = this.defaultgasprice;

		
			
			var overload_need_to_unlock_accounts = (this.need_to_unlock_accounts.substring(1) == 'need_to_unlock_accounts' ? false : true);
			if (overload_need_to_unlock_accounts)
				window.simplestore.Config.need_to_unlock_accounts = this.need_to_unlock_accounts;
		
			var overload_wallet_account_challenge = (this.wallet_account_challenge.substring(1) == 'wallet_account_challenge' ? false : true);
			if (overload_wallet_account_challenge)
				window.simplestore.Config.wallet_account_challenge = this.wallet_account_challenge;
		
			var overload_wallet_account = (this.wallet_account.substring(1) == 'wallet_account' ? false : true);
			if (overload_wallet_account)
				window.simplestore.Config.wallet_account = this.wallet_account;
		
		
		
		}
		
		// we reset the session object in case it has been created with prevous config values
		var global = XtraConfig.getGlobalObject();
		var commonmodule = global.getModuleObject('common');
		
		commonmodule.resetSessionObjects();
	}
	
	handleDisplayIdentificationBox() {
		console.log("XtraConfig.handleDisplayIdentificationBox called");
		
		var global = XtraConfig.getGlobalObject();
		var authkeymodule = global.getModuleObject('authkey');
		
		return authkeymodule.displayIdentificationBox();
	}
	
	static getGlobalObject() {
		var global;
		
		try {
			global = window.simplestore.Global.getGlobalObject();
		}
		catch(e) {
			console.log("exception in XtraConfig.getGlobalObject " + e);
		}
		
		return global;
	}
}


//export
if ( typeof window !== 'undefined' && window ) // if we are in browser and not node js (e.g. truffle)
window.simplestore.Config.XtraConfig = XtraConfig;
else if (typeof global !== 'undefined')
global.simplestore.XtraConfig = XtraConfig; // we are in node js

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
GlobalClass.getGlobalObject().registerModuleObject(new XtraConfigModule());
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new XtraConfigModule());
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new XtraConfigModule());
}

