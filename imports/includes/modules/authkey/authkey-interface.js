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
		
		return authkeyserveraccess.auth_session_status(function(err, res) {
			if (!err) {
				var sessionstatus = res;
				
				if (callback)
					callback(null, sessionstatus);
				
				return sessionstatus;
			}
			else {
				if (callback)
					callback('could not obtain session status', null);
			}
		});
	}
	
	read_cryptokeys(session, callback) {
		console.log('AuthKeyInterface.read_cryptokeys called');
		var global = this.global;

		var authkeyserveraccess = this.module.getAuthKeyServerAccessInstance(session);
		
		
		var commonmodule = global.getModuleObject('common');

		
		var cryptokeyarray = [];
		
		return authkeyserveraccess.key_session_keys( function(err, res) {
			
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
					
					if (privatekey) {
						
						var cryptokey = commonmodule.createBlankCryptoKeyObject(session);
						
						cryptokey.setKeyUUID(keyuuid);
						cryptokey.setDescription(description);
						
						cryptokey.setPrivateKey(privatekey);
						
						cryptokeyarray.push(cryptokey);
					}
					else {
						throw "Could not retrieve private key for a crypto key!";
					}
				
				}
				
			}
			
			if (callback)
				callback(null, cryptokeyarray);
		});	
		
	}
	
	load_user_in_session(session, callback) {
		console.log('AuthKeyInterface.load_user_in_session called');
		var global = this.global;

		var authkeyserveraccess = this.module.getAuthKeyServerAccessInstance(session);
		
		
		var commonmodule = global.getModuleObject('common');
		var user = commonmodule.createBlankUserObject(session);
		
		var loaduserpromise = authkeyserveraccess.auth_session_user( function(err, res) {
			var authenticated = (res && (res['status'] == '1') ? true : false);
			
			console.log("authentication is " + authenticated);
			
			if (authenticated){
				user.setUserName(res['username']);
				user.setUserEmail((res['useremail'] ? res['useremail'] : null));
				user.setUserUUID((res['useruuid'] ? res['useruuid'] : null));
				
				session.impersonateUser(user);
			}
			
			return authenticated;
		})
		.then(function(authenticated) {
			if (authenticated) {
				
				// load crypto keys
				return authkeyserveraccess.key_session_keys( function(err, res) {
					
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
							
							if (privatekey) {
								
								var cryptokey = commonmodule.createBlankCryptoKeyObject(session);
								
								cryptokey.setKeyUUID(keyuuid);
								cryptokey.setDescription(description);
								
								cryptokey.setPrivateKey(privatekey);
								
								session.addCryptoKeyObject(cryptokey);
							}
							else {
								throw "Could not retrieve private key for a crypto key!";
							}
						
						}
						
					}
					
					if (callback)
						callback(null, user);

			
				});
				
			}
			else {
				if (callback)
					callback('could not load user', null);
				
				return null;
			}
			
		});
		
		return loaduserpromise;
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
		.then(function(authenticated) {
			if (authenticated) {
				
				// load crypto keys
				return authkeyserveraccess.key_session_keys( function(err, res) {
					
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
							
							if (privatekey) {
								
								var cryptokey = commonmodule.createBlankCryptoKeyObject(session);
								
								cryptokey.setKeyUUID(keyuuid);
								cryptokey.setDescription(description);
								
								cryptokey.setPrivateKey(privatekey);
								
								session.addCryptoKeyObject(cryptokey);
							}
							else {
								throw "Could not retrieve private key for a crypto key!";
							}
						
						}
						
					}
				});
				
			}
			else {
				if (callback)
					callback('could not authenticate user', null);
				
				return null;
			}
			
		});
		
		promises.push(authenticationpromise);
		
		return Promise.all(promises).then(function(res) {
			
			if (callback)
				callback(null, res[1]);
			
			return res[1];
		});
	}
	
	logout(session, callback) {
		console.log('AuthKeyInterface.logout called');
		var global = this.global;
		
		var authkeyserveraccess = this.module.getAuthKeyServerAccessInstance(session);
		
		var useruuid = (session.getSessionUserObject() ? session.getSessionUserObject().getUserUUID() : null);
		
		return authkeyserveraccess.auth_session_logout(useruuid, function(err, res) {
			var loggedout = (res['status'] == '1' ? true : false);
			
			console.log("log out result is " + loggedout);
			
			if (callback)
				callback(null, loggedout);
			
			return loggedout;
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