var CONSTANTS = require('../../common/constants.js'),
	BrowserWindow = require('browser-window'),
	Emitter = require('events').EventEmitter,
	dialog = require('dialog'),
	util = require('util'),
	ipc = require('ipc');

/**
 * The window controller (on the main process)
 * @constructor
 */
function SettingsController() {
	Emitter.call(this);
	this.window = null;

	// Register to IPC events (to communicate with renderer process)
	ipc.on(CONSTANTS.IPC.OPEN_DIR_DIALOG, this.onOpenDialogRequest.bind(this));
}
util.inherits(SettingsController, Emitter);

/**
 * Shows the settings window
 * @returns {SettingsController}
 */
SettingsController.prototype.show = function () {
	this.window = new BrowserWindow({
		width: 420,
		height: 580,
		resizable: true,
		title: 'Settings'
	});

	// Hide the default menu
	this.window.setMenu(null);
	this.window.loadUrl('file://' + __dirname + '/settings.html');
	this.window.on('closed', this.onClosed.bind(this));
	return this;
};

/**
 * Bring the settings window to the front
 */
SettingsController.prototype.focus = function() {
	if (this.window) {
		this.window.focus();
	}
};

/**
 * Handles the window close event
 */
SettingsController.prototype.onClosed = function() {
	this.window = null;
	this.emit('closed');
};

/**
 * Handles an open dialog request from the view
 */
SettingsController.prototype.onOpenDialogRequest = function() {
	// Show dialog to select directories only
	var dir = dialog.showOpenDialog(this.window, {
		title: 'Select download directory',
		properties: ['openDirectory']
	});

	if (dir && dir.length > 0) {
		// Update the view with the new selected directory
		this.window.webContents.send(CONSTANTS.IPC.DOWNLOAD_DIR_CHANGED, dir[0]);
	}
};

var instance = new SettingsController();
module.exports = instance;
