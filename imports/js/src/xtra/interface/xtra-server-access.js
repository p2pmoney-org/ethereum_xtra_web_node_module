'use strict';


class Xtra_ServerAccess {
	constructor(session) {
		this.session = session;
	}
	
	isReady(callback) {
		var promise = new Promise(function (resolve, reject) {
			
			if (callback)
				callback(null, true);
			
			resolve(true);
		});
		
		return promise
	}
	
	getRestConnection() {
		if (this.rest_connection)
			return this.rest_connection;
		
	    var rest_server_url = this.session.getXtraConfigValue('rest_server_url');
	    var rest_server_api_path = this.session.getXtraConfigValue('rest_server_api_path');

	    this.rest_connection = this.session.createRestConnection(rest_server_url, rest_server_api_path);
		
		return this.rest_connection;
	}
	
	rest_get(resource, callback) {
		var rest_connection = this.getRestConnection();
		
		return rest_connection.rest_get(resource, callback);
	}
	
	rest_post(resource, postdata, callback) {
		var rest_connection = this.getRestConnection();
		
		return rest_connection.rest_post(resource, postdata, callback);
	}

	rest_put(resource, postdata, callback) {
		var rest_connection = this.getRestConnection();
		
		return rest_connection.rest_put(resource, postdata, callback);
	}

	
	rest_delete(resource, callback) {
		var rest_connection = this.getRestConnection();
		
		return rest_connection.rest_delete(resource, callback);
	}
	//
	// rest API
	//
	
	server_version(callback) {
		console.log("Xtra_ServerAccess.server_version called");
		
		var self = this;
		var session = this.session;

		var promise = new Promise(function (resolve, reject) {
			
			try {
				var resource = "/version";
				
				self.rest_get(resource, function (err, res) {
					if (res) {
						var version = res['version'];
						
						if (callback)
							callback(null, version);
						
						return resolve(version);
					}
					else {
						if (callback)
							callback('error', null);
						
						reject('rest error calling ' + resource + ' : ' + err);
					}
					
				});
			}
			catch(e) {
				if (callback)
					callback('exception: ' + e, null);
				
				reject('rest exception: ' + e);
			}
		});
		
		return promise;
		
	}

}


if ( typeof window !== 'undefined' && window ) // if we are in browser and not node js (e.g. truffle)
window.simplestore.Xtra_ServerAccess = Xtra_ServerAccess;
else if (typeof global !== 'undefined')
global.simplestore.Xtra_ServerAccess = Xtra_ServerAccess; // we are in node js
