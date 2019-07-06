require('@babel/register');

var os = require('os'),
	{app} = require('electron'),
	config = require('./common/config.js');

if (process.env.NODE_ENV === 'dev') {
	require('electron-debug')();
}

// Hide the dock icon
if (os.platform() === 'darwin') {
	app.dock.hide();
}

app.on('ready', function cbAppReady() {
	config.init(app);

	// Require and load the mainCtrl only after config was init
	var mainCtrl = require('./pages/main/main-controller.js');
	mainCtrl.default.show();
});
