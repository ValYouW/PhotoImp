var CONSTANTS = require('../../common/constants.js'),
	ngUtils = require('../ng-utils.js'),
	ipc = require('ipc'),
	angular = require('angular');

var settingsApp = angular.module('settingsWinApp', []);

function SettingsWinCtrl(scope) {
	this.scope = scope;
	this.settings = {
		downloadDir: '',
		downloadFile: '{o}'
	};

	this.registerToIPC();
}

SettingsWinCtrl.prototype.registerToIPC = function() {
	ipc.on(CONSTANTS.IPC.DOWNLOAD_DIR_CHANGED, this.onDownDirUpdate.bind(this));
};

SettingsWinCtrl.prototype.chooseDir = function() {
	ipc.send(CONSTANTS.IPC.OPEN_DIR_DIALOG);
};

SettingsWinCtrl.prototype.onDownDirUpdate = function(newDir) {
	if (!newDir) {return;}

	this.settings.downloadDir = newDir;

	// We are in IPC cb, need to digest
	ngUtils.safeApply(this.scope);
};

SettingsWinCtrl.$inject = ['$scope'];
settingsApp.controller('settingsWinCtrl', SettingsWinCtrl);
