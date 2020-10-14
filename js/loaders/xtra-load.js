console.log('xtra-load.js');

var Bootstrap = window.simplestore.Bootstrap;
var ScriptLoader = window.simplestore.ScriptLoader;

var bootstrapobject = Bootstrap.getBootstrapObject();
var rootscriptloader = ScriptLoader.getRootScriptLoader();

var globalscriptloader = ScriptLoader.findScriptLoader('globalloader')

var xtrascriptloader = globalscriptloader.getChildLoader('@primusmoney/xtraconfig');

rootscriptloader.push_import(xtrascriptloader,'../../imports/js/src/xtra/xtra-config.js');
import '../../imports/js/src/xtra/xtra-config.js';

rootscriptloader.push_import(xtrascriptloader,'../../imports/js/src/xtra/interface/xtra-ethereum-node-access.js');
import '../../imports/js/src/xtra/interface/xtra-ethereum-node-access.js';

rootscriptloader.push_import(xtrascriptloader,'../../imports/js/src/xtra/interface/xtra-storage-access.js');
import '../../imports/js/src/xtra/interface/xtra-storage-access.js';


rootscriptloader.push_import(xtrascriptloader,'../../imports/includes/interface/authkey-server-access.js');
import '../../imports/includes/interface/authkey-server-access.js';

rootscriptloader.push_import(xtrascriptloader,'../../imports/includes/modules/authkey/module.js');
import '../../imports/includes/modules/authkey/module.js';

rootscriptloader.push_import(xtrascriptloader,'../../imports/includes/modules/authkey/authkey-interface.js');
import '../../imports/includes/modules/authkey/authkey-interface.js';

rootscriptloader.push_import(xtrascriptloader,'../../imports/includes/modules/authkey/model/user.js');
import '../../imports/includes/modules/authkey/model/user.js';




xtrascriptloader.load_scripts();
