var Tests = class {
	
	static run(describe, expect, assert) {
		
		var Ethereum_core = require('../../ethereum_core');
		var ethereum_core = Ethereum_core.getObject();

		var corecontrollers = ethereum_core.getControllersObject();

		var Ethereum_xtra_web = require('../../ethereum_core');
		var ethereum_xtra_web = Ethereum_xtra_web.getObject();

		var xtra_webcontrollers = ethereum_xtra_web.getControllersObject();

		var session = corecontrollers.getCurrentSessionObject();

		describe('Controller:', function() {
		    it('core controllers object not null', function() {
		    	assert(corecontrollers != null);
		    });
		    it('xtra_web controllers object not null', function() {
		    	assert(xtra_webcontrollers !== null);
		    });
		});
		

	}
}

module.exports = Tests;