var CONSTANTS = require('../../common/constants.js'),
	Model = require('../../common/model.js'),
	util = require('util'),
	ipc = require('ipc'),
	angular = require('angular'),
	ngUtils = require('../ng-utils.js');

var mainApp = angular.module('mainWinApp', ['ui.grid', 'ui.grid.selection', 'ui.grid.resizeColumns']);

function MainWinCtrl(scope, uiGridConstants) {
	/** @type {Model.File[]} */
	this.files = [];
	this.fileDates = [];
	this.scope = scope;

	this.datesGridOps = {};
	this.filesGridOpts = {};
	angular.extend(this.datesGridOps, CONSTANTS.DEFAULTS.SEL_GRID_OPTS);
	angular.extend(this.filesGridOpts, CONSTANTS.DEFAULTS.SEL_GRID_OPTS);

	// The dates grid columns
	this.datesGridOps.columnDefs = [
		{ name: 'date', type: 'date', cellFilter: 'localeDateTime:true', enableColumnResizing: false }
	];

	// The files grid columns
	this.filesGridOpts.columnDefs = [
		{ name: 'name' },
		{ name: 'size', type: 'number', cellFilter: 'bytes2KB' },
		{ name: 'mdate', displayName: 'Date', type: 'date', cellFilter: 'localeDateTime'},
		{ name: 'dstPath', displayName: 'Download Path' }
	];

	this.registerToIPC();
}
MainWinCtrl.$inject = ['$scope', 'uiGridConstants'];
mainApp.controller('mainWinCtrl', MainWinCtrl);

MainWinCtrl.prototype.registerToIPC = function() {
	ipc.on(CONSTANTS.IPC.LOAD_FILE_LIST, this.onLoadFilesRequest.bind(this));
};

/**
 * A list of files to load
 * @param {File[]} files
 */
MainWinCtrl.prototype.onLoadFilesRequest = function(files) {
	this.files = Model.File.deserializeArray(files) || [];
	var distinctDates = {}; // Helper for creating a distinct list of dates
	for (var i = 0; i < this.files.length; ++i) {
		var f = this.files[i];

		var fileDate = f.lastModified.toLocaleDateString();
		distinctDates[fileDate] = f.lastModified;
	}

	// Convert the dates dictionary into array of objects (for the grid).
	this.fileDates = Object.keys(distinctDates).map(function(date) {return {date: distinctDates[date]};});
	this.datesGridOps.data = this.fileDates;

	this.filesGridOpts.data = this.files;

	// We are in IPC cb, need to digest
	ngUtils.safeApply(this.scope);
};

MainWinCtrl.prototype.download = function() {
	ipc.send(CONSTANTS.IPC.DOWNLOAD, this.files);
};

mainApp.filter('localeDateTime', function() {
	return function(input, dateOnly) {
		if (!input || !util.isDate(input)) {
			return '';
		} else {
			return dateOnly ? input.toLocaleDateString() : input.toLocaleString();
		}
	};
});

mainApp.filter('bytes2KB', function() {
	return function(input) {
		var size = Number(input);
		if (isNaN(size)) {
			return '';
		} else {
			return parseInt(size / 1024) + 'KB';
		}
	};
});
