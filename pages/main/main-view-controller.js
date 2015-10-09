var CONSTANTS = require('../../common/constants.js'),
	util = require('util'),
	ipc = require('ipc'),
	angular = require('angular'),
	ngUtils = require('../ng-utils.js');

var ngApp = angular.module('mainWinApp', ['ui.grid', 'ui.grid.selection']);

function MainWinCtrl(scope) {
	this.fileDates = [];
	this.files = [];
	this.scope = scope;

	this.datesGridOps = {};
	this.filesGridOpts = {};
	angular.extend(this.datesGridOps, CONSTANTS.DEFAULTS.SEL_GRID_OPTS);
	angular.extend(this.filesGridOpts, CONSTANTS.DEFAULTS.SEL_GRID_OPTS);

	// The dates grid columns
	this.datesGridOps.columnDefs = [
		{ name: 'date', type: 'numberStr' }
	];

	// The files grid columns
	this.filesGridOpts.columnDefs = [
		{ name: 'name' },
		{ name: 'size', type: 'number' },
		{ name: 'mdate', displayName: 'Date', type: 'numberStr' },
		{ name: 'dstPath', displayName: 'Download Path' }
	];

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
	var fileDates = {}; // Helper for creating a distinct list of dates
	for (var i = 0; i < files.length; ++i) {
		var f = files[i];

		// Convert lastModified to date
		f.lastModified = new Date(f.lastModified || 0);

		var fileDate = f.lastModified.toLocaleDateString();
		fileDates[fileDate] = true;
		this.files.push(new FileModel(fileDate, f.name, f.size, f.lastModified));
	}

	// Convert the dates dictionary into array of objects (for the grid).
	this.fileDates = Object.keys(fileDates).map(function(date) {return {date: date};});
	this.datesGridOps.data = this.fileDates;

	this.filesGridOpts.data = this.files;

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
	this.dstPath = '';
}
