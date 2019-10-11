'use strict';

class AuthKeyServerAccess {
	constructor(session) {
		this.session = session;
		
		this.rest_auth_connection = null;
		this.rest_key_connection = null;
	}
	
	getRestAuthConnection() {
		if (this.rest_auth_connection)
			return this.rest_auth_connection;
		
	    var rest_server_url = this.session.getXtraConfigValue('authkey_server_url');
	    var rest_server_api_path = this.session.getXtraConfigValue('authkey_server_api_path');
	    
	    if (!rest_server_url) {
	    	// we look in Config
			var Config = window.simplestore.Config;

	    	if (Config && (Config.get)  && (Config.get('authkey_server_url')))
	    			rest_server_url = Config.get('authkey_server_url');
	    }

	    if (!rest_server_api_path) {
	    	// we look in Config
			var Config = window.simplestore.Config;

	    	if (Config && (Config.get)  && (Config.get('authkey_server_api_path')))
	    		rest_server_api_path = Config.get('authkey_server_api_path');
	    }

	    this.rest_auth_connection = this.session.createRestConnection(rest_server_url, rest_server_api_path);
		
		return this.rest_auth_connection;
	}
	
	setRestAuthConnection(restconnection) {
		if (!restconnection)
			return;
		
		this.rest_auth_connection = restconnection;
	}
	
	rest_auth_get(resource, callback) {
		var rest_connection = this.getRestAuthConnection();
		
		return rest_connection.rest_get(resource, callback);
	}
	
	rest_auth_post(resource, postdata, callback) {
		var rest_connection = this.getRestAuthConnection();
		
		return rest_connection.rest_post(resource, postdata, callback);
	}
	
	getRestKeyConnection() {
		if (this.rest_key_connection)
			return this.rest_key_connection;
		
	    var rest_server_url = this.session.getXtraConfigValue('authkey_server_url');
	    var rest_server_api_path = this.session.getXtraConfigValue('authkey_server_api_path');

	    if (!rest_server_url) {
	    	// we look in Config
			var Config = window.simplestore.Config;

	    	if (Config && (Config.get)  && (Config.get('authkey_server_url')))
	    			rest_server_url = Config.get('authkey_server_url');
	    }

	    if (!rest_server_api_path) {
	    	// we look in Config
			var Config = window.simplestore.Config;

	    	if (Config && (Config.get)  && (Config.get('authkey_server_api_path')))
	    		rest_server_api_path = Config.get('authkey_server_api_path');
	    }

	    this.rest_key_connection = this.session.createRestConnection(rest_server_url, rest_server_api_path);
		
		return this.rest_key_connection;
	}
	
	setRestKeyConnection(restconnection) {
		if (!restconnection)
			return;
		
		this.rest_key_connection = restconnection;
	}
	
	rest_key_get(resource, callback) {
		var rest_connection = this.getRestKeyConnection();
		
		return rest_connection.rest_get(resource, callback);
	}
	
	rest_key_post(resource, postdata, callback) {
		var rest_connection = this.getRestKeyConnection();
		
		return rest_connection.rest_post(resource, postdata, callback);
	}

	rest_key_put(resource, postdata, callback) {
		var rest_connection = this.getRestKeyConnection();
		
		return rest_connection.rest_put(resource, postdata, callback);
	}

	

	//
	// rest Auth API
	//
	auth_version(callback) {
		console.log("AuthKeyServerAccess.auth_version called");
		
		var self = this;
		var session = this.session;

		var promise = new Promise(function (resolve, reject) {
			
			try {
				var resource = "/version";
				
				self.rest_auth_get(resource, function (err, res) {
					if (res) {
						var version = res['version'];
						
						if (callback)
							callback(null, version);
						
						return resolve(version);
					}
					else {
						reject('rest error calling ' + resource);
					}
					
				});
			}
			catch(e) {
				reject('rest exception: ' + e);
			}
		});
		
		return promise;
		
	}
	
	auth_session_status(callback) {
		
		var self = this
		var session = this.session;
		var sessionuuid = session.getSessionUUID();
		
		console.log("AuthKeyServerAccess.auth_session_status called for " + sessionuuid);

		var promise = new Promise(function (resolve, reject) {
			
			try {
				var resource = "/session";
				
				var postdata = [];
				
				postdata = {sessionuuid: sessionuuid};
				
				self.rest_auth_post(resource, postdata, function (err, res) {
					if (res) {
						
						if (callback)
							callback(null, res);
						
						return resolve(res);
					}
					else {
						reject('rest error calling ' + resource);
					}
					
				});
			}
			catch(e) {
				reject('rest exception: ' + e);
			}
		});
		
		return promise;
		
	}
	
	
	auth_session_authenticate(username, password, callback) {
		console.log("AuthKeyServerAccess.auth_session_authenticate called");
		
		var self = this
		var session = this.session;

		var promise = new Promise(function (resolve, reject) {
			
			try {
				var resource = "/session/authenticate";
				
				var postdata = [];
				
				postdata = {username: username, password: password};
				
				self.rest_auth_post(resource, postdata, function (err, res) {
					if (res) {
						
						if (callback)
							callback(null, res);
						
						return resolve(res);
					}
					else {
						reject('rest error calling ' + resource);
					}
					
				});
			}
			catch(e) {
				reject('rest exception: ' + e);
			}
		});
		
		return promise;
		
	}
	
	auth_session_user(callback) {
		console.log("AuthKeyServerAccess.auth_session_user called");
		
		var self = this
		var session = this.session;
		var sessionuuid = session.getSessionUUID();

		var promise = new Promise(function (resolve, reject) {
			
			try {
				var resource = "/session/" + sessionuuid + "/user";
				
				self.rest_auth_get(resource, function (err, res) {
					if (res) {
						
						if (callback)
							callback(null, res);
						
						return resolve(res);
					}
					else {
						reject('rest error calling ' + resource);
					}
					
				});
			}
			catch(e) {
				reject('rest exception: ' + e);
			}
		});
		
		return promise;
		
	}
	
	
	auth_session_logout(useruuid, callback) {
		console.log("AuthKeyServerAccess.auth_session_logout called");
		
		var self = this
		var session = this.session;

		var promise = new Promise(function (resolve, reject) {
			
			try {
				var resource = "/session/logout";
				
				var postdata = [];
				
				postdata = {useruuid: useruuid};
				
				self.rest_auth_post(resource, postdata, function (err, res) {
					if (res) {
						
						if (callback)
							callback(null, res);
						
						return resolve(res);
					}
					else {
						reject('rest error calling ' + resource);
					}
					
				});
			}
			catch(e) {
				reject('rest exception: ' + e);
			}
		});
		
		return promise;
		
	}
	
	//
	// rest Key API
	//
	key_version(callback) {
		console.log("AuthKeyServerAccess.key_version called");
		
		var self = this
		var session = this.session;

		var promise = new Promise(function (resolve, reject) {
			
			try {
				var resource = "/version";
				
				self.rest_key_get(resource, function (err, res) {
					if (res) {
						var version = res['version'];
						
						if (callback)
							callback(null, version);
						
						return resolve(version);
					}
					else {
						reject('rest error calling ' + resource);
					}
					
				});
			}
			catch(e) {
				reject('rest exception: ' + e);
			}
		});
		
		return promise;
		
	}
	
	key_session_keys(callback) {
		console.log("AuthKeyServerAccess.key_session_keys called");
		
		var self = this
		var session = this.session;

		var promise = new Promise(function (resolve, reject) {
			
			try {
				var resource = "/key/session/keys";
				
				self.rest_auth_get(resource, function (err, res) {
					if (res) {
						
						if (callback)
							callback(null, res);
						
						return resolve(res);
					}
					else {
						reject('rest error calling ' + resource);
					}
					
				});
			}
			catch(e) {
				reject('rest exception: ' + e);
			}
		});
		
		return promise;
		
	}

	key_user_add(user, cryptokey, callback) {
		console.log("AuthKeyServerAccess.key_user_add called");
		
		var self = this
		var session = this.session;

		var promise = new Promise(function (resolve, reject) {
			
			try {
				var resource = "/key/user/add";
				
				var useruuid = user.getUserUUID();
				
				var privatekey = cryptokey.getPrivateKey();
				var publickey = cryptokey.getPublicKey();
				var address = cryptokey.getAddress();
				var rsapublickey = cryptokey.getRsaPublicKey();
				
				var description = cryptokey.getDescription();
				
				var postdata = [];
				
				postdata = {useruuid: useruuid, private_key: privatekey, public_key: publickey, address: address, rsa_public_key: rsapublickey, description: description};
				
				self.rest_key_put(resource, postdata, function (err, res) {
					if (res) {
						
						// set key uuid given by the server
						var keyuuid = res['key_uuid'];
						
						cryptokey.setKeyUUID(keyuuid);
						
						if (callback)
							callback(null, res);
						
						return resolve(res);
					}
					else {
						reject('rest error calling ' + resource);
					}
					
				});
			}
			catch(e) {
				reject('rest exception: ' + e);
			}
		});
		
		return promise;
		
	}
}

console.log("AuthKeyServerAccess is loaded");

//GlobalClass.registerModuleClass('authkey', 'AuthKeyServerAccess', AuthKeyServerAccess);
// because load sequence of module and interface is not predictable
if ( typeof window !== 'undefined' && window ) // if we are in browser or react-native and not node js (e.g. truffle)
	window.simplestore.AuthKeyServerAccess = AuthKeyServerAccess;
else if (typeof global !== 'undefined')
	global.simplestore.AuthKeyServerAccess = AuthKeyServerAccess; // we are in node js
