var os = require('os'),
    app = require('app'),
    config = require('./common/config.js'),
    mainCtrl = require('./pages/main/main-controller.js');

if (process.env.NODE_ENV === 'dev') {
    require('electron-debug')();
}

// Hide the dock icon
if(os.platform() === 'darwin') {
    app.dock.hide();
}

app.on('ready', function cbAppReady() {
	config.init(app);
    mainCtrl.show();
});
