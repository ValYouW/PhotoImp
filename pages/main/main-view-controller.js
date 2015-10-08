var CONSTANTS = require('../../common/constants.js'),
	util = require('util'),
	ipc = require('ipc'),
	angular = require('angular'),
	ngUtils = require('../ng-utils.js');

var ngApp = angular.module('mainWinApp', []);

function MainWinCtrl(scope) {
	this.fileDates = [];
	this.files = [];
	this.scope = scope;

	this.registerToIPC();
}

MainWinCtrl.prototype.registerToIPC = function() {
	ipc.on(CONSTANTS.IPC.LOAD_FILE_LIST, this.onLoadFilesRequest.bind(this));
};

/**
 * A list of files to load
 * @param {File[]} files
 */
MainWinCtrl.prototype.onLoadFilesRequest = function(files) {
	// group files by date and create the file models
	this.files = [];
	var fileDates = {};
	for (var i = 0; i < files.length; ++i) {
		var f = files[i];

		// Convert lastModified to date
		f.lastModified = new Date(f.lastModified || 0);

		var fileDate = f.lastModified.toLocaleDateString();
		fileDates[fileDate] = true;
		this.files.push(new FileModel(fileDate, f.name, f.size, f.lastModified));
	}

	this.fileDates = Object.keys(fileDates);

	// We are in IPC cb, need to digest
	ngUtils.safeApply(this.scope);
};

MainWinCtrl.$inject = ['$scope'];
ngApp.controller('mainWinCtrl', MainWinCtrl);

function FileModel(group, name, size, mdate) {
	this.dateGroup = group || '';
	this.name = name || '';
	this.size = size || 0;
	this.mdate = util.isDate(mdate) ? mdate.toLocaleString() : '';
}
