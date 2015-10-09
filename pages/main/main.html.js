var CONSTANTS = require('../../common/constants.js'),
	util = require('util'),
	ipc = require('ipc'),
	angular = require('angular'),
	ngUtils = require('../ng-utils.js');

var ngApp = angular.module('mainWinApp', ['ui.grid', 'ui.grid.selection']);

function MainWinCtrl(scope, uiGridConstants) {
	this.fileDates = [];
	this.files = [];
	this.scope = scope;

	this.datesGridOps = {};
	this.filesGridOpts = {};
	angular.extend(this.datesGridOps, CONSTANTS.DEFAULTS.SEL_GRID_OPTS);
	angular.extend(this.filesGridOpts, CONSTANTS.DEFAULTS.SEL_GRID_OPTS);

	// The dates grid columns
	this.datesGridOps.columnDefs = [
		{ name: 'date', type: 'date', cellFilter: 'localeDateTime:true' }
	];

	// The files grid columns
	this.filesGridOpts.columnDefs = [
		{ name: 'name' },
		{ name: 'size', type: 'number' },
		{ name: 'mdate', displayName: 'Date', type: 'date', cellFilter: 'localeDateTime'},
		{ name: 'dstPath', displayName: 'Download Path' }
	];

	this.registerToIPC();
}
MainWinCtrl.$inject = ['$scope', 'uiGridConstants'];
ngApp.controller('mainWinCtrl', MainWinCtrl);

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
	var distinctDates = {}; // Helper for creating a distinct list of dates
	for (var i = 0; i < files.length; ++i) {
		var f = files[i];

		// Convert lastModified to date
		f.lastModified = new Date(f.lastModified || 0);

		var fileDate = f.lastModified.toLocaleDateString();
		distinctDates[fileDate] = f.lastModified;
		this.files.push(new FileModel(fileDate, f.name, f.size, f.lastModified));
	}

	// Convert the dates dictionary into array of objects (for the grid).
	this.fileDates = Object.keys(distinctDates).map(function(date) {return {date: distinctDates[date]};});
	this.datesGridOps.data = this.fileDates;

	this.filesGridOpts.data = this.files;

	// We are in IPC cb, need to digest
	ngUtils.safeApply(this.scope);
};

ngApp.filter('localeDateTime', function() {
	return function(input, dateOnly) {
		if (!input || !util.isDate(input)) {
			return '';
		} else {
			return dateOnly ? input.toLocaleDateString() : input.toLocaleString();
		}
	};
});

function FileModel(group, name, size, mdate) {
	this.dateGroup = group || '';
	this.name = name || '';
	this.size = size || 0;
	this.mdate = util.isDate(mdate) ? mdate : new Date(0);
	this.dstPath = '';
}
