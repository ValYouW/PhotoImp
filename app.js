var os = require('os'),
    app = require('app'),
    mainCtrl = require('./pages/main/main-controller.js');

if (process.env.NODE_ENV === 'dev') {
    require('electron-debug')();
}

// Hide the dock icon
if(os.platform() === 'darwin') {
    app.dock.hide();
}

app.on('ready', function cbAppReady() {
    mainCtrl.show();
});
