/**
 * @author P2PMoney.org
 * @name @p2pmoney-org/ethereum_xtra_web
 * @homepage http://www.p2pmoney.org/
 * @license MIT
 */
'use strict';


console.log('@p2pmoney-org/ethereum_xtra_web node module');

if ( typeof window !== 'undefined' && window  && (typeof window.simplestore === 'undefined')) {
	// react-native
	console.log('creating window.simplestore in @p2pmoney-org/ethereum_xtra_web index.js');

	window.simplestore = {};
	
	window.simplestore.nocreation = true;
	
} else if ((typeof global !== 'undefined') && (typeof global.simplestore === 'undefined')) {
	// nodejs
	console.log('creating global.simplestore in @p2pmoney-org/ethereum_xtra_web index.js');
	global.simplestore = {};
}

const Ethereum_xtra_web = require('./ethereum_xtra_web.js');


module.exports = Ethereum_xtra_web