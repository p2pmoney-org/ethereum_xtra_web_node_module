'use strict';

var Module = class {
	
	constructor() {
		this.name = 'authkey';
		
		this.global = null; // put by global on registration
		this.isready = false;
		this.isloading = false;
		
		this.activated = true;
		
		this.authkeyinterface = null;
		//this.authkey_server_access_instance = null;
		
		this.controllers = null;
	}
	
	activation(choice) {
		if (choice === false) {
			this.activated = false;
		}
		else if (this.activated === false) {
			this.activated = true;
		}
	}
	
	isActivated() {
		return this.activated;
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
		var global = this.global;

		// authkey module script loader
		var modulescriptloader;
		
		// look if authkeyloader already created (e.g. for loading in node.js)
		modulescriptloader = global.findScriptLoader('authkeyloader');

		// if not, create on as child as parent script loader passed in argument
		if (!modulescriptloader)
		modulescriptloader = global.getScriptLoader('authkeyloader', parentscriptloader);
		
		
		var xtraroot = './includes';
		
		var interfaceroot = xtraroot + '/interface';

		modulescriptloader.push_script( interfaceroot + '/authkey-server-access.js');
		
		//var moduleroot = './includes/modules/authkey';
		var moduleroot = xtraroot + '/modules/authkey';

		modulescriptloader.push_script( moduleroot + '/authkey-interface.js');

		//modulescriptloader.push_script( moduleroot + '/control/controllers.js');

		modulescriptloader.push_script( moduleroot + '/model/user.js');
		
		modulescriptloader.load_scripts( () => { this.init(); if (callback) callback(null, this); });
		
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
		
		global.registerHook('getVersionInfo_hook', this.name, this.getVersionInfo_hook);
		global.modifyHookPriority('getVersionInfo_hook', this.name, -5);
		
		// initialization
		global.registerHook('preFinalizeGlobalScopeInit_hook', this.name, this.preFinalizeGlobalScopeInit_hook);
		global.registerHook('postFinalizeGlobalScopeInit_hook', this.name, this.postFinalizeGlobalScopeInit_hook);
		
		
		// authkey actions
		global.registerHook('isSessionAnonymous_hook', this.name, this.isSessionAnonymous_hook);

		global.registerHook('getSessionCryptoKeyObjects_hook', this.name, this.getSessionCryptoKeyObjects_hook);
		global.registerHook('getAccountObjects_hook', this.name, this.getAccountObjects_hook);
		
		
		// popup login box
		global.registerHook('handleShowLoginBox_hook', this.name, this.handleShowLoginBox_hook);
		
		// angular login page
		global.registerHook('alterLoginForm_hook', this.name, this.alterLoginForm_hook);
		global.registerHook('handleLoginSubmit_hook', this.name, this.handleLoginSubmit_hook);

		global.registerHook('alterLogoutForm_hook', this.name, this.alterLogoutForm_hook);
		global.registerHook('handleLogoutSubmit_hook', this.name, this.handleLogoutSubmit_hook);

		// vaults
		global.registerHook('handleOpenVaultSubmit_hook', this.name, this.handleOpenVaultSubmit_hook);
		global.registerHook('handleCreateVaultSubmit_hook', this.name, this.handleCreateVaultSubmit_hook);
		
		// signal module is ready
		var rootscriptloader = global.getRootScriptLoader();
		rootscriptloader.signalEvent('on_authkey_module_ready');
	}
	
	postRegisterModule() {
		console.log('postRegisterModule called for ' + this.name);
		if (!this.isloading) {
			var global = this.global;
			var self = this;
			var rootscriptloader = global.getRootScriptLoader();
			
			this.loadModule(rootscriptloader, () => {
				if (this.registerHooks)
				this.registerHooks();
			});
		}
	}
	
	
	//
	// hooks
	//
	getVersionInfo_hook(result, params) {
		console.log('getVersionInfo_hook called for ' + this.name);
		
		var global = this.global;
		var _globalscope = global.getExecutionGlobalScope();
		var Constants = _globalscope.simplestore.Constants;
		var authkey_versioninfo = Constants.get('authkey_version');
		
		var versioninfos = params[0];
		
		var versioninfo = {};
		
		versioninfo.label = global.t('authkey');
		versioninfo.value = (authkey_versioninfo && authkey_versioninfo.value ? authkey_versioninfo.value : global.t('unknown'));
		
		versioninfos.push(versioninfo);

		
		result.push({module: this.name, handled: true});
		
		return true;
	}
	
	preFinalizeGlobalScopeInit_hook(result, params) {
		console.log('preFinalizeGlobalScopeInit_hook called for ' + this.name);
		
		var global = this.global;
		var _globalscope = global.getExecutionGlobalScope();

		this.AuthKeyServerAccess = _globalscope.simplestore.AuthKeyServerAccess;

		result.push({module: this.name, handled: true});
		
		return true;
	}
	
	postFinalizeGlobalScopeInit_hook(result, params) {
		console.log('postFinalizeGlobalScopeInit_hook called for ' + this.name);
		
		var global = this.global;
		var _globalscope = global.getExecutionGlobalScope();

		result.push({module: this.name, handled: true});
		
		return true;
	}

	
	_getAppObject() {
		var global = this.global;
		if (global.getAppObject)
			return global.getAppObject();
	}
	
	_canHandleSession(session) {
		var authkeyserveraccess = this.getAuthKeyServerAccessInstance(session);
		
		return authkeyserveraccess._isReady();
	}

	isSessionAnonymous_hook(result, params) {
		console.log('isSessionAnonymous_hook called for ' + this.name);
		
		if (this.isready === false)
			return false;
		
		if (this.activated === false)
			return false;

		var global = this.global;
		var app = this._getAppObject();
		
		var session = params[0];
		
		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false)
			return false;
		
		// check rest urls are ok
		if (!this._canHandleSession(session))
			return false;
		
		if (!session[this.name]) session[this.name] = {};
		var sessioncontext = session[this.name];
		
		var now = Date.now();
		
		if (sessioncontext.authenticatedupdate && ((now - sessioncontext.authenticatedupdate) < 5000)) {
			// update only every 5s
			result.push({module: this.name, handled: true});
			
			return true;
		}
		
		sessioncontext.authenticatedupdate = now;

		var authkeyinterface = this.getAuthKeyInterface();
		var currentanonymousflag = (session.user == null);
		
		console.log('checking session status on server for ' + session.getSessionUUID());
		console.log('currentanonymousflag is ' + currentanonymousflag);
		
		authkeyinterface.session_status(session, (err, sessionstatus) => {
			if (sessionstatus) {
				if (sessionstatus['isauthenticated'] == false) {
					console.log('session ' + session.getSessionUUID() + ' is not authenticated on the server');
					
					if (currentanonymousflag === false) {
						console.log('disconnecting user');
						
						session.disconnectUser();
						
						alert(global.t('your session has expired'));
		
						// go to login page
						var mvcmodule = global.getModuleObject('mvc');
						
						var mvccontroller = (mvcmodule ? mvcmodule.getControllersObject() : null);
						
						if (mvccontroller && mvccontroller.gotoLoginPage)
							mvccontroller.gotoLoginPage();
						else 
							console.log('WARNING: mvc controller has no gotoLoginPage method');
					}
				}
				else {
					console.log('session ' + session.getSessionUUID() + ' is authenticated on the server');

					if (currentanonymousflag === true) {
						// session bootstrapped from external call
						console.log('connecting user');

						authkeyinterface.load_user_in_session(session, (err, sessionstatus) => {
							if (!err) {
								console.log('user loaded from server');
								
								// go to home page
								var mvcmodule = global.getModuleObject('mvc');
								
								var mvccontroller = (mvcmodule ? mvcmodule.getControllersObject() : null);
								
								if (mvccontroller && mvccontroller.gotoLoginPage)
									mvccontroller.refreshPage();
								else 
									console.log('WARNING: mvc controller has no refreshPage method');
							}
							else {
								console.log('error while loading user from server: ' + err);
							}
						})
						.then((res) => {
							var authenticated = (res['status'] == '1' ? true : false);
							
							console.log("authentication is " + authenticated);
							
							if (authenticated) {
								
								// authenticated (and crypto-keys have been loaded)
								// we get list of accounts (that could be encrypted)
								return this._initializeAccounts(session, (err, res) => {	
									
									if (app) app.refreshDisplay();
								});
								
							}
							else {
								alert("Could not authenticate you with these credentials!");
							}
							
						})
						.catch( (err) => {
							alert(err);
						});
					}
					
				}
				
			}

		});

		result.push({module: this.name, handled: true});
		
		return true;
	}
	
	getSessionCryptoKeyObjects_hook(result, params) {
		console.log('getSessionCryptoKeyObjects_hook called for ' + this.name);
		
		if (this.isready === false)
			return false;
		
		if (this.activated === false)
			return false;

		var global = this.global;
		var self = this;
		
		var authkeyinterface = this.getAuthKeyInterface();

		var session = params[0];
		
		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false)
			return false;
		
		var nextget = result.get;
		result.get = (err, keyarray) => {

			authkeyinterface.read_cryptokeys(session, (err, mykeyarray) => {
				var newkeyarray = (mykeyarray && (mykeyarray.length > 0) ? keyarray.concat(mykeyarray) : keyarray);
				
				if (!err) {
					if (nextget)
						nextget(null, newkeyarray);
				}
				else {
					if (nextget)
						nextget(err, null);
				}
			});
			
			
		}; // chaining of get function

		result.push({module: this.name, handled: true});
		
		return true;
	}
	
	getAccountObjects_hook(result, params) {
		console.log('getAccountObjects_hook called for ' + this.name);

		if (this.activated === false)
			return false;

		var global = this.global;
		var self = this;
		
		var session = params[0];
		
		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false)
			return false;
		
		var localstorageaccess = session.getLocalStorageAccessInstance();

		var nextget = result.get;
		result.get = (err, keyarray) => {

			localstorageaccess.account_session_keys((err, res) => {
				var mykeyarray;
				
				if (res && res['keys']) {
					var keys = res['keys'];
					
					mykeyarray = session.readSessionAccountFromKeys(keys);
				}
				
				var newkeyarray = (mykeyarray && (mykeyarray.length > 0) ? keyarray.concat(mykeyarray) : keyarray);
				
				if (!err) {
					if (nextget)
						nextget(null, newkeyarray);
				}
				else {
					if (nextget)
						nextget(err, null);
				}
			})
			.catch( (err) => {
				console.log('error in getAccountObjects_hook: ' + err);
			});;
			
			
		}; // chaining of get function
		
		result.push({module: this.name, handled: true});
		
		return true;
	}
	
	// popup login
	handleShowLoginBox_hook(result, params) {
		console.log('handleShowLoginBox_hook called for ' + this.name);
		
		if (this.activated === false)
			return false;

		this.displayIdentificationBox();
		
		result.push({module: 'xtraconfig', handled: true});
		
		return true;
	}
	
	displayIdentificationBox() {

		var username = prompt("Enter username", "");
		var password = prompt("Enter password", "");

		this._authenticate(username, password);
	}
	
	_initializeAccounts(session, callback) {
		var global = this.global;
		
		// read first accounts from client storage
		var clientstorageaccess = session.getClientStorageAccessInstance();
		
		// we should fix clientstorageaccess.account_session_keys reject before
		// cleaning the structure at this level
		// and skipping the use of a promise to wrap-up calls for rejecting errors
		return new Promise((resolve, reject) => {
			return clientstorageaccess.account_session_keys( (errc, resc) => {
				
				if (resc && resc['keys']) {
					var keys = resc['keys'];
					
					session.readSessionAccountFromKeys(keys);
				}
				
				var localstorageaccess = session.getLocalStorageAccessInstance();
				
				localstorageaccess.account_session_keys( (errl, resl) => {
					
					if (resl && resl['keys']) {
						var keys = resl['keys'];
						
						session.readSessionAccountFromKeys(keys);
					}
					
					if (errc || errl) {
						reject('errors: ' + (errc ? errc : ' none ') + ' & ' + (errl ? errl : ' none '));
					}
					else {
						resolve(session);
					}
				})
				.catch(err => {
					reject(err);
				});

			})
			.catch(err => {
				reject(err);
			});
		})
		.then((res) => {
			if (callback)
				callback(null, res);
			
			return res;
		})
		.catch(err => {
			if (callback)
				callback(err, null);
					
			throw new Error(err);
		});
	}
	
	_authenticate(session, username, password, callback) {
		var global = this.global;
		
		var SessionClass = (typeof Session !== 'undefined' ? Session : global.getModuleObject('common').Session);
		if (session instanceof SessionClass !== true)
			throw 'must pass a session object as first parameter!';
		
		if (this.activated === false) {
			if (callback)
				callback(global.t('authkey module is not activated'), null);
			return Promise.reject('authkey module is not activated');
		}

		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false) {
			if (callback)
				callback(global.t('authkey module is de-activated at session level'), null);
			return Promise.reject('authkey module is de-activated at session level');
		}
		
		if (!this._canHandleSession(session)) {
			if (callback)
				callback(global.t('authkey module can not handle this session'), null);
			return Promise.reject('authkey module can not handle this session');
		}
		
		var global = session.getGlobalObject();
		
		var app = this._getAppObject();
		
		var commonmodule = global.getModuleObject('common');

		if (username != null) {
			var authkeymodule = global.getModuleObject('authkey');
			var authkeyinterface = authkeymodule.getAuthKeyInterface();
			
			return authkeyinterface.authenticate(session, username, password)
			.then((res) => {
				var authenticated = (res['status'] == '1' ? true : false);
				
				console.log("authentication is " + authenticated);
				
				if (authenticated) {
					
					// authenticated (and crypto-keys have been loaded)
					// we get list of accounts (that could be encrypted)
					return this._initializeAccounts(session, (err, res) => {	
				
						if (app) app.refreshDisplay();
						
						return true;
					});
					
				}
				else {
					return Promise.reject('could not authenticate user');
				}
				
			})
			.then((res) => {
				if (callback)
					callback(null, res);
				
				return res;
			})
			.catch( (err) => {
				alert("Could not authenticate you with these credentials!");
				
				if (callback)
					callback(err, false);
				
				return false;
			});
			
			
		}
		else {
			if (callback)
				callback(global.t('user name is null'), null);
			return Promise.reject('user name is null');
		}
		
	}
	
	_logout(session) {
		var global = this.global;
		
		var SessionClass = (typeof Session !== 'undefined' ? Session : global.getModuleObject('common').Session);
		if (session instanceof SessionClass !== true)
			throw 'must pass a session object as first parameter!';
		
		var global = session.getGlobalObject();
		
		if (this.activated === false)
			return false;

		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false)
			return false;
		
		var app = this._getAppObject();
		
		var commonmodule = global.getModuleObject('common');

		if (!session.isAnonymous()) {
			var authkeymodule = global.getModuleObject('authkey');
			var authkeyinterface = authkeymodule.getAuthKeyInterface();
			
			authkeyinterface.logout(session)
			.then((res) => {
				var loggedout = (res['status'] == '1' ? true : false);
				
				if (loggedout) {
					
					if (app) app.refreshDisplay();
					
				}
				else {
					alert("Could not log out on authentication server!");
				}
				
			})
			.catch( (err) => {
				alert(err);
			});
			
			
		}	
		
	}
	
	// angular login page
	alterLoginForm_hook(result, params) {
		console.log('alterLoginForm_hook called for ' + this.name);
		
		if (this.activated === false)
			return false;

		var global = this.global;

		var $scope = params[0];
		var logoutform = params[1];
		var session = params[2];

		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false)
			return false;
		
		// remove private key input
		var privkeyspan = document.getElementById('privkey-span');
		
		if ( privkeyspan ) {
			privkeyspan.parentNode.removeChild(privkeyspan);
		}
		
		// add our inputs
		var formdiv = document.createElement("div");
		logoutform.insertBefore(formdiv, logoutform.firstChild);

		var span;
		var label;
		var textbox;

		// name text box
		span = document.createElement("span");
		formdiv.appendChild(span);

		label = document.createElement("Label");
		label.innerHTML = global.t("User name:");
		label.setAttribute('for',"username");
		
		span.appendChild(label);
		
		textbox = document.createElement("input"); //input element, text
		textbox.setAttribute('type',"text");
		textbox.setAttribute('name',"username");
		textbox.classList.add('form-textbox');
		textbox.classList.add('form-username-input');
		
		span.appendChild(textbox);
		
		// password
		span = document.createElement("span");
		formdiv.appendChild(span);

		label = document.createElement("Label");
		label.innerHTML = global.t("Password:");
		label.setAttribute('for',"password");
		
		span.appendChild(label);
		
		textbox = document.createElement("input"); //input element, text
		textbox.setAttribute('type',"password");
		textbox.setAttribute('name',"password");
		textbox.classList.add('form-textbox');
		textbox.classList.add('form-password-input');
		
		span.appendChild(textbox);
		
		result.push({module: 'xtraconfig', handled: true});
		
		return true;
	}
	
	handleLoginSubmit_hook(result, params) {
		console.log('handleLoginSubmit_hook called for ' + this.name);

		if (this.activated === false)
			return false;

		var $scope = params[0];
		var session = params[1];
		
		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false)
			return false;
		
		var username = this.getFormValue("username");
		var password = this.getFormValue("password");
		
		this._authenticate(session, username, password);

		result.push({module: this.name, handled: true});
		
		return true;
	}
	
	alterLogoutForm_hook(result, params) {
		console.log('alterLogoutForm_hook called for ' + this.name);
		
		if (this.activated === false)
			return false;

		var $scope = params[0];
		var logoutform = params[1];
		var session = params[2];
		
		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false)
			return false;
		
	}
	
	handleLogoutSubmit_hook(result, params) {
		console.log('handleLogoutSubmit_hook called for ' + this.name);
		
		if (this.activated === false)
			return false;

		var $scope = params[0];
		var session = params[1];
		
		this._logout(session);
		
		result.push({module: this.name, handled: true});
		
		return true;
	}
	
	// vaults
	_openVault(session, vaultname, passphrase, vaulttype, callback) {
		var global = this.global;
		
		if (this.activated === false) {
			if (callback)
				callback(global.t('authkey module is not activated'), null);
			return;
		}


		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false) {
			if (callback)
				callback(global.t('authkey is de-activated at session level'), null);
			return;
		}

		var app = this._getAppObject();
		var commonmodule = global.getModuleObject('common');
		
		commonmodule.openVault(session, vaultname, passphrase, vaulttype, (err, res) => {
			var vault = res;
			
			if (vault) {
				var cryptokey = vault.getCryptoKeyObject();
				
				// add crypto key to session
				session.addCryptoKeyObject(cryptokey);

				// read accounts from client storage
				var clientstorageaccess = session.getClientStorageAccessInstance();
				
				clientstorageaccess.account_session_keys( (err, res) => {
					
					if (res && res['keys']) {
						var keys = res['keys'];
						
						session.readSessionAccountFromKeys(keys);
					}
			
					if (app) app.refreshDisplay();
					
					if (callback)
						callback(null, vault);
				});
				
			}
			else {
				var error = global.t('Could not open vault') + ' ' + vaultname;
				
				if (callback)
					callback(error, null);
			}
			
		});
		
	}
	

	handleOpenVaultSubmit_hook(result, params) {
		console.log('handleOpenVaultSubmit_hook called for ' + this.name);
		
		if (this.activated === false)
			return false;

		var global = this.global;
		var app = this._getAppObject();

		var $scope = params[0];
		var session = params[1];
		
		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false)
			return false;
		
		var vaultname = this.getFormValue("vaultname");
		var vaulttype = $scope.vaulttype.text;
		var password = this.getFormValue("password");
		
		if (!session.isAnonymous()) {
			// open vault
			this._openVault(session, vaultname, password, vaulttype, (err, res) => {
				if (err)
					alert(err);
				
				app.refreshDisplay();
				
				var mvcmodule = global.getModuleObject('mvc');
				
				var mvccontroller = (mvcmodule ? mvcmodule.getControllersObject() : null);
				
				if (mvccontroller && mvccontroller.gotoHome) {
					mvccontroller.gotoHome();
				}
			});
		}
		else {
			var error = 'You must first log in to open a vault'
			alert(global.t(error));
		}
		
		
		result.push({module: this.name, handled: true});
		
		return true;
	}

	_createVault(session, vaultname, passphrase, vaulttype, callback) {
		var global = this.global;
		
		if (this.activated === false) {
			if (callback)
				callback(global.t('authkey module is not activated'), null);
			return;
		}


		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false) {
			if (callback)
				callback(global.t('authkey is de-activated at session level'), null);
			return;
		}
		
		var app = this._getAppObject();
		var commonmodule = global.getModuleObject('common');
		
		commonmodule.createVault(session, vaultname, passphrase, vaulttype, (err, res) => {
			if (!err) {
				// open vault 
				this._openVault(session, vaultname, passphrase, vaulttype, (err, res) => {
					var vault = res;
					
					if (vault) {
						if (app) app.refreshDisplay();
						
						if (callback)
							callback(null, vault);
					}
					else {
					}
				});
			}
			else {
				var error = global.t('Could not create vault') + ' ' + vaultname;
				
				if (callback)
					callback(error, null);
			}
		});
		
	}
	
	handleCreateVaultSubmit_hook(result, params) {
		console.log('handleCreateVaultSubmit_hook called for ' + this.name);
		
		if (this.activated === false)
			return false;

		// we overload handleCreateVaultSubmit_hook to prevent session.impersonateUser(user)
		// in Controllers._openVault
		
		var global = this.global;
		var app = this._getAppObject();

		var $scope = params[0];
		var session = params[1];
		
		// look if session deactivates authkey
		if (session.activate_authkey_server_access === false)
			return false;
		
		var vaultname = this.getFormValue("vaultname");
		var vaulttype = $scope.vaulttype.text;
		var password = this.getFormValue("password");
		var passwordconfirm = this.getFormValue("passwordconfirm");
		
		if (!session.isAnonymous()) {
			if (password == passwordconfirm) {
				// create vault
				this._createVault(session, vaultname, password, vaulttype, (err, res) => {
					if (err)
						alert(err);
					
					app.refreshDisplay();
					
					var mvcmodule = global.getModuleObject('mvc');
					
					var mvccontroller = (mvcmodule ? mvcmodule.getControllersObject() : null);
					
					if (mvccontroller && mvccontroller.gotoHome) {
						mvccontroller.gotoHome();
					}
				});
			}
			else {
				var error = global.t('passwords do not match');
				alert(error);
			}

		}
		else {
			var error = 'You must first log in to create a vault'
			alert(global.t(error));
		}
		
		
		result.push({module: this.name, handled: true});
		
		return true;
	}


	// utils
	getFormValue(formelementname) {
		var value = document.getElementsByName(formelementname)[0].value;
		
		return value;
	}
	

	
	//
	// API
	//
	getAuthKeyInterface() {
		var global = this.global;
		
		if (this.authkeyinterface)
			return this.authkeyinterface;
		
		var result = []; 
		var inputparams = [];
		
		inputparams.push(this);
		
		var ret = global.invokeHooks('getAuthKeyInterface_hook', result, inputparams);
		
		if (ret && result[0]) {
			this.authkeyinterface = result[0];
		}
		else {
			this.authkeyinterface = new this.AuthKeyInterface(this);
		}
		
		return this.authkeyinterface;
	}
	
	
	getAuthKeyServerAccessInstance(session) {
		if (session.authkey_server_access_instance)
			return session.authkey_server_access_instance;
		
		console.log('instantiating AuthKeyServerAccess');
		
		var global = this.global;

		var result = []; 
		var inputparams = [];
		
		inputparams.push(this);
		inputparams.push(session);
		
		if (!this.AuthKeyServerAccess) {
			var _globalscope = global.getExecutionGlobalScope();
			this.AuthKeyServerAccess = _globalscope.simplestore.AuthKeyServerAccess;;
		}
		
		result[0] = new this.AuthKeyServerAccess(session);
		
		// call hook to let modify or replace instance
		var ret = global.invokeHooks('getAuthKeyServerAccessInstance_hook', result, inputparams);
		
		if (ret && result[0]) {
			session.authkey_server_access_instance = result[0];
		}
		else {
			//this.authkey_server_access_instance = new this.AuthKeyServerAccess(session);
			// because load sequence of module and interface is not predictable
			var _globalscope = global.getExecutionGlobalScope();
			var AuthKeyServerAccessClass = (typeof AuthKeyServerAccess !== 'undefined' ? AuthKeyServerAccess : _globalscope.simplestore.AuthKeyServerAccess);

			session.authkey_server_access_instance = new AuthKeyServerAccessClass(session);
		}

		
		return session.authkey_server_access_instance;
		
	}
	

	//
	// control
	//
	
	getControllersObject() {
		if (this.controllers)
			return this.controllers;
		
		this.controllers = new this.Controllers(this);
		
		return this.controllers;
	}

	//
	// model
	//
	
	
}


if ( typeof GlobalClass !== 'undefined' && GlobalClass ) {
	GlobalClass.getGlobalObject().registerModuleObject(new Module());

	// dependencies
	GlobalClass.getGlobalObject().registerModuleDepency('authkey', 'common');
}
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new Module());

	// dependencies
	_GlobalClass.getGlobalObject().registerModuleDepency('authkey', 'common');
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.getGlobalObject().registerModuleObject(new Module());

	// dependencies
	_GlobalClass.getGlobalObject().registerModuleDepency('authkey', 'common');
}
