'use strict';

var modulecontrollers;

var ModuleControllers = class {
	
	constructor() {
		this.module = null;
		
		this.ethereum_xtra_web = require('../../../ethereum_xtra_web').getObject();
		this.ethereum_core = this.ethereum_xtra_web.ethereum_core;
		
		this.global = this.ethereum_xtra_web.getGlobalObject();

		this.session = null;
	}
	
	

	
	// static
	static getObject() {
		if (modulecontrollers)
			return modulecontrollers;
		
		modulecontrollers = new ModuleControllers();
		
		return modulecontrollers;
	}
}

module.exports = ModuleControllers; 