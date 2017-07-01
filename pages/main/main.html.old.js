var CONSTANTS = require('../../common/constants.js'),
	Model = require('../../common/model.js'),
	ipc = require('ipc'),
	angular = require('angular'),
	ngUtils = require('../ng-utils.js');

// ui-grid default options
var GRID_OPTS = {
	enableRowSelection: true,
	enableSelectAll: true,
	enableRowHeaderSelection: false,
	enableColumnResizing: true,
	rowHeight: 25,
	showGridFooter: false,
	modifierKeysToMultiSelect: true,
	enableColumnMenus: false
};

var mainApp = angular.module('mainWinApp', ['ui.grid', 'ui.grid.selection', 'ui.grid.resizeColumns']);

/**
 * The view controller (on the renderer process)
 * @constructor
 */
function MainWinCtrl(scope, uiGridConstants) {
	var self = this;
	this.downloading = false;
	/** @type {File[]} */
	this.files = [];
	this.fileDates = [];
	this.copyProgress = {inprogress: false, file: '', percentage: 0};
	this.scope = scope;

	// Create the 2 grid options
	this.datesGridOps = {}; // This grid holds dates only (the left grid on the page)
	this.filesGridOpts = {}; // This gird holds file info (the main grid on the page)
	angular.extend(this.datesGridOps, GRID_OPTS);
	angular.extend(this.filesGridOpts, GRID_OPTS);

	// The dates grid columns
	this.datesGridOps.columnDefs = [
		{ name: 'lastModified', type: 'date', cellFilter: 'localeDateTime:true', enableColumnResizing: false, sort: {priority: 1, direction: uiGridConstants.ASC} }
	];
	this.datesGridOps.enableSelectionBatchEvent = false; // Raise the change event for each row instead of single batch event

	// Register to grid events
	this.datesGridOps.onRegisterApi = function(gridApi) {
		gridApi.selection.on.rowSelectionChanged(self.scope, self.datesSelectionChanged.bind(self));
	};

	// The files grid columns
	this.filesGridOpts.columnDefs = [
		{ name: 'name' },
		{ name: 'size', type: 'number', cellFilter: 'bytes2KB' },
		{ name: 'lastModified', displayName: 'Date', type: 'date', cellFilter: 'localeDateTime', sort: {priority: 1, direction: uiGridConstants.ASC} },
		{ name: 'dstPath', displayName: 'Download Path' }
	];

	// Get the files grid api
	this.filesGridOpts.onRegisterApi = function(gridApi) {
		self.filesGridApi = gridApi;
	};

	// Get the progressbar api
	this.progressbarOptions = {
		onRegisterApi: function(api) {self.progressbar = api;}
	};

	// Register to IPC events (to communicate with the main process)
	ipc.on(CONSTANTS.IPC.LOAD_FILE_LIST, this.onLoadFilesRequest.bind(this));
	ipc.on(CONSTANTS.IPC.COPY_PROGRESS, this.onCopyProgress.bind(this));
}
MainWinCtrl.$inject = ['$scope', 'uiGridConstants'];
mainApp.controller('mainWinCtrl', MainWinCtrl);

/**
 * Handles a selection change on the dates grid
 * @param {object} row - The ui-grid row
 */
MainWinCtrl.prototype.datesSelectionChanged = function(row) {
	// Take the row date
	if (!row.entity || !row.entity.date) { return; }
	var date = row.entity.date;

	// Loop over all the loaded files (in the files grid) with the same date and select/deselect them accordingly
	for (var i = 0; i < this.files.length; ++i) {
		if (this.files[i].date !== date) { continue; }
		if (row.isSelected) {
			this.filesGridApi.selection.selectRow(this.files[i]);
		} else {
			this.filesGridApi.selection.unSelectRow(this.files[i]);
		}
	}
};

/**
 * Load a list of files
 * @param {string} files - A list of files to load (serialized File array)
 */
MainWinCtrl.prototype.onLoadFilesRequest = function(files) {
	this.files = Model.File.deserializeArray(files) || [];
	var distinctDates = {}; // Helper for creating a distinct list of dates
	for (var i = 0; i < this.files.length; ++i) {
		var f = this.files[i];

		// Add a "date" property to the file, will be used when we would like to select all files of a specific date
		f.date = f.lastModified.toLocaleDateString();

		if (!distinctDates[f.date]) {
			// Add a date also to this object (for the datesGrid), will be used to select all files of this date
			distinctDates[f.date] = {lastModified: f.lastModified, date: f.date};
		}
	}

	// Convert the dates dictionary into array of objects (for the grid).
	this.fileDates = Object.keys(distinctDates).map(function(date) {return distinctDates[date];});
	this.datesGridOps.data = this.fileDates;

	// Load the files into the grid
	this.filesGridOpts.data = this.files;

	// We are in IPC cb, need to digest
	ngUtils.safeApply(this.scope);
};

/**
 * Handles a copy progress event (updates the progress bar)
 * @param {{percentage: number, file: string}} data
 */
MainWinCtrl.prototype.onCopyProgress = function(data) {
	var pct = data.percentage*100;
	this.copyProgress.inprogress = pct < 100;
	this.copyProgress.file = data.file;
	this.copyProgress.percentage = data.percentage;

	if (pct < 100) {
		this.progressbar.set(pct);
	} else {
		this.progressbar.complete();
		this.downloading = false;
	}

	// We are in IPC cb, need to digest
	ngUtils.safeApply(this.scope);
};

/**
 * Starts or aborts the download process
 */
MainWinCtrl.prototype.downloadOrAbort = function() {
	// If we are downloading - abort
	if (this.downloading) {
		this.downloading = false;
		ipc.send(CONSTANTS.IPC.ABORT);
		return;
	}

	// Start to download

	// Get all the selected files, if no file is selected then we download all.
	var selected = this.filesGridApi.selection.getSelectedRows();
	if (selected.length < 1) {
		selected = this.files;
	}

	this.downloading = true;
	ipc.send(CONSTANTS.IPC.DOWNLOAD, Model.File.serializeArray(selected));
};
