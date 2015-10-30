var CONSTANTS = require('../../common/constants.js'),
	BrowserWindow = require('browser-window'),
	Emitter = require('events').EventEmitter,
	dialog = require('dialog'),
	util = require('util'),
	ipc = require('ipc');

function SettingsController() {
	Emitter.call(this);
	this.window = null;
	ipc.on(CONSTANTS.IPC.OPEN_DIR_DIALOG, this.onOpenDialogRequest.bind(this));
}
util.inherits(SettingsController, Emitter);

SettingsController.prototype.show = function () {
	this.window = new BrowserWindow({
		width: 400,
		height: 400,
		resizable: true,
		title: 'Settings'
	});

	this.window.setMenu(null);
	this.window.loadUrl('file://' + __dirname + '/settings.html');
	this.window.on('closed', this.onClosed.bind(this));
	return this;
};

SettingsController.prototype.focus = function() {
	if (this.window) {
		this.window.focus();
	}
};

SettingsController.prototype.onClosed = function() {
	this.window = null;
	this.emit('closed');
};

SettingsController.prototype.onOpenDialogRequest = function() {
	var dir = dialog.showOpenDialog(this.window, {
		title: 'Select download directory',
		properties: ['openDirectory']
	});

	if (dir && dir.length > 0) {
		this.window.webContents.send(CONSTANTS.IPC.DOWNLOAD_DIR_CHANGED, dir[0]);
	}
};

var instance = new SettingsController();
module.exports = instance;
