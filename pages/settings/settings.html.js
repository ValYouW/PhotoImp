var CONSTANTS = require('../../common/constants.js'),
	Model = require('../../common/model.js'),
	config = require('../../common/config.js'),
	fileFormatter = require('../../common/file-formatter.js'),
	ngUtils = require('../ng-utils.js'),
	ipc = require('ipc'),
	angular = require('angular');

var settingsApp = angular.module('settingsWinApp', []);

/**
 * The view controller (on the renderer process)
 * @constructor
 */
function SettingsWinCtrl(scope, window) {
	this.scope = scope;
	this.window = window;
	this.settings = {
		downloadDir: config.get(config.Keys.DownloadDirPattern),
		downloadFile: config.get(config.Keys.DownloadFilePattern)
	};
	this.formatters = fileFormatter.Formatters;
	this.sampleFile = new Model.File('DSC_1234.jpg', 1000, new Date());

	// Register to events from the main process
	ipc.on(CONSTANTS.IPC.DOWNLOAD_DIR_CHANGED, this.onDownDirUpdate.bind(this));
}

/**
 * Handles the click on the choose directory button
 */
SettingsWinCtrl.prototype.chooseDir = function() {
	ipc.send(CONSTANTS.IPC.OPEN_DIR_DIALOG);
};

/**
 * Fires when the download directory has changed
 * @param {string} newDir - The new download directory path
 */
SettingsWinCtrl.prototype.onDownDirUpdate = function(newDir) {
	if (!newDir) {return;}

	this.settings.downloadDir = newDir;

	// We are in IPC cb, need to digest
	ngUtils.safeApply(this.scope);
};

/**
 * Handles the save button
 */
SettingsWinCtrl.prototype.save = function() {
	config.set(config.Keys.DownloadDirPattern, this.settings.downloadDir);
	config.set(config.Keys.DownloadFilePattern, this.settings.downloadFile);
	config.save();
	this.close();
};

/**
 * Handles the close button
 */
SettingsWinCtrl.prototype.close = function() {
	this.window.close();
};

SettingsWinCtrl.$inject = ['$scope', '$window'];
settingsApp.controller('settingsWinCtrl', SettingsWinCtrl);
