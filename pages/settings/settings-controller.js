var BrowserWindow = require('browser-window'),
	Emitter = require('events').EventEmitter,
	util = require('util');

function SettingsController() {
	Emitter.call(this);
	this.window = null;
}
util.inherits(SettingsController, Emitter);

SettingsController.prototype.show = function () {
	this.window = new BrowserWindow({
		width: 400,
		height: 300,
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

var instance = new SettingsController();
module.exports = instance;
