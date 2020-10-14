/**
 * 
 */
'use strict';

var AuthKeyInterface = class {
	constructor(module) {
		this.module = module;
		this.global = module.global;
	}
	
	// api
	

	// sync

	
	// async
	session_status(session, callback) {
		console.log('AuthKeyInterface.session_status called');
		var global = this.global;
		
		var authkeyserveraccess = this.module.getAuthKeyServerAccessInstance(session);
		
		return new Promise((resolve, reject) => {
			authkeyserveraccess.auth_session_status(function(err, res) {

				if (!err) {
					var sessionstatus = res;
					
					resolve(sessionstatus);
				}
				else {
					reject('could not obtain session status');
				}
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
	
	read_cryptokeys(session, callback) {
		console.log('AuthKeyInterface.read_cryptokeys called');
		var global = this.global;

		var authkeyserveraccess = this.module.getAuthKeyServerAccessInstance(session);
		
		
		var commonmodule = global.getModuleObject('common');

		
		var cryptokeyarray = [];
		
		return new Promise((resolve, reject) => {
			authkeyserveraccess.key_session_keys( function(err, res) {
			
				if (res && res['keys']) {
					var keys = res['keys'];
					
					for (var i = 0; i < keys.length; i++) {
						var key = keys[i];
						
						var keyuuid = key['key_uuid'];
						var privatekey = key['private_key'];
						var publickey = key['public_key'];
						var address = key['address'];
						var rsapublickey = key['rsa_public_key'];
						var description = key['description'];
						
						var origin = key['origin'];
						
						if (privatekey) {
							
							var cryptokey = commonmodule.createBlankCryptoKeyObject(session);
							
							cryptokey.setKeyUUID(keyuuid);
							cryptokey.setDescription(description);
							
							cryptokey.setOrigin(origin);
							
							cryptokey.setPrivateKey(privatekey);
							
							cryptokeyarray.push(cryptokey);
						}
						else {
							throw "Could not retrieve private key for a crypto key!";
						}
					
					}
					
				}
				
				// we add cryptokeys to the session
				// and to the user if session is not anonymous
				if (cryptokeyarray.length > 0) {
					var user = session.getSessionUserObject();
					
					for (var i = 0; i < cryptokeyarray.length; i++ ) {
						session.addCryptoKeyObject(cryptokeyarray[i]);
						
						if (user) {
							user.addCryptoKeyObject(cryptokeyarray[i]);
						}
					}
	
					
				}
				
				resolve(res);
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
	
	load_user_in_session(session, callback) {
		console.log('AuthKeyInterface.load_user_in_session called');
		var global = this.global;

		var authkeyserveraccess = this.module.getAuthKeyServerAccessInstance(session);
		
		
		var commonmodule = global.getModuleObject('common');
		var user = commonmodule.createBlankUserObject(session);
		
		return new Promise((resolve, reject) => {
			authkeyserveraccess.auth_session_user( function(err, res) {
				var authenticated = (res && (res['status'] == '1') ? true : false);
				
				console.log("authentication is " + authenticated);
				
				if (authenticated){
					user.setUserName(res['username']);
					user.setUserEmail((res['useremail'] ? res['useremail'] : null));
					user.setUserUUID((res['useruuid'] ? res['useruuid'] : null));
					
					session.impersonateUser(user);
				}
				
				return resolve(authenticated);
			});
		})
		.then((authenticated) => {
			if (authenticated) {
				
				// load crypto keys
				return this.read_cryptokeys(session);
			}
			else {
				return Promise.reject('could not load user');
			}
			
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


	authenticate(session, username, password, callback) {
		console.log('AuthKeyInterface.authenticate called');
		var global = this.global;
		var promises = [];
		
		var authkeyserveraccess = this.module.getAuthKeyServerAccessInstance(session);
		
		var versionpromise = authkeyserveraccess.auth_version(function(err, version) {
			console.log("version is " + version);
			
			// could check if version is compatible
			
			return version;
		});
		
		promises.push(versionpromise);
		
		
		var commonmodule = global.getModuleObject('common');
		var user = commonmodule.createBlankUserObject(session);
		
		var authenticationpromise = authkeyserveraccess.auth_session_authenticate(username, password, function(err, res) {
			var authenticated = (res && (res['status'] == '1') ? true : false);
			
			console.log("authentication is " + authenticated);
			
			if (authenticated) {
				user.setUserName(res['username']);
				user.setUserEmail((res['useremail'] ? res['useremail'] : null));
				user.setUserUUID((res['useruuid'] ? res['useruuid'] : null));
				
				session.impersonateUser(user);
			}
			
			
			return authenticated;
		})
		.then((authenticated) => {
			if (authenticated) {
				
				// load crypto keys
				return this.read_cryptokeys(session);
			}
			else {
				return Promise.reject('could not authenticate user');
			}
			
		});
		
		promises.push(authenticationpromise);
		
		return Promise.all(promises).then(function(res) {
			
			if (callback)
				callback(null, res[1]);
			
			return res[1];
		})
		.catch( (err) => {
			if (callback)
				callback(err, false);
			
			return false;
		});
	}
	
	logout(session, callback) {
		console.log('AuthKeyInterface.logout called');
		var global = this.global;
		
		var authkeyserveraccess = this.module.getAuthKeyServerAccessInstance(session);
		
		var useruuid = (session.getSessionUserObject() ? session.getSessionUserObject().getUserUUID() : null);
		
		return new Promise((resolve, reject) => {
			authkeyserveraccess.auth_session_logout(useruuid, function(err, res) {
				var loggedout = (res['status'] == '1' ? true : false);
				
				console.log("log out result is " + loggedout);
				
				resolve(loggedout);
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
}

if ( typeof GlobalClass !== 'undefined' && GlobalClass )
GlobalClass.registerModuleClass('authkey', 'AuthKeyInterface', AuthKeyInterface);
else if (typeof window !== 'undefined') {
	let _GlobalClass = ( window && window.simplestore && window.simplestore.Global ? window.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('authkey', 'AuthKeyInterface', AuthKeyInterface);
}
else if (typeof global !== 'undefined') {
	// we are in node js
	let _GlobalClass = ( global && global.simplestore && global.simplestore.Global ? global.simplestore.Global : null);
	
	_GlobalClass.registerModuleClass('authkey', 'AuthKeyInterface', AuthKeyInterface);
}