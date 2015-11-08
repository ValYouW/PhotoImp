var CONSTANTS = require('../../common/constants.js'),
	Model = require('../../common/model.js'),
	config = require('../../common/config.js'),
	path = require('path'),
	fileFormatter = require('../../common/file-formatter.js'),
	ngUtils = require('../ng-utils.js'),
	ipc = require('ipc'),
	angular = require('angular');

var settingsApp = angular.module('settingsWinApp', ['vTabs']);

function SettingsWinCtrl(scope) {
	this.scope = scope;
	this.settings = {
		downloadDir: config.get(config.Keys.DownloadDirPattern),
		downloadFile: config.get(config.Keys.DownloadFilePattern)
	};
	this.tabs = {
		active: 0
	};
	this.formatters = fileFormatter.Formatters;
	this.sampleFile = new Model.File('DSC_1234.jpg', 1000, new Date());
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

SettingsWinCtrl.prototype.save = function() {
	alert('fsdfd');
};

SettingsWinCtrl.$inject = ['$scope'];
settingsApp.controller('settingsWinCtrl', SettingsWinCtrl);

settingsApp.filter('dstpath', function() {
	return function(file, dirPattern, filePattern) {
		if (!(file instanceof Model.File)) {return '';}
		dirPattern = dirPattern || '';
		filePattern = filePattern || '';
		var dst = path.join(dirPattern, filePattern);
		return fileFormatter.format(dst, file);
	};
});
