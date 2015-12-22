var CONSTANTS = require('../../common/constants.js'),
	Model = require('../../common/model.js'),
	util = require('util'),
	ipc = require('ipc'),
	angular = require('angular'),
	ngUtils = require('../ng-utils.js');

var mainApp = angular.module('mainWinApp', ['ui.grid', 'ui.grid.selection', 'ui.grid.resizeColumns']);

function MainWinCtrl(scope) {
	var self = this;
	/** @type {Model.File[]} */
	this.files = [];
	this.fileDates = [];
	this.copyProgress = {inprogress: false, file: '', percentage: 0};
	this.scope = scope;

	this.datesGridOps = {};
	this.filesGridOpts = {};
	angular.extend(this.datesGridOps, CONSTANTS.DEFAULTS.SEL_GRID_OPTS);
	angular.extend(this.filesGridOpts, CONSTANTS.DEFAULTS.SEL_GRID_OPTS);

	// The dates grid columns
	this.datesGridOps.columnDefs = [
		{ name: 'lastModified', type: 'date', cellFilter: 'localeDateTime:true', enableColumnResizing: false }
	];
	this.datesGridOps.enableSelectionBatchEvent = false;

	// rowSelectionChangedBatch
	this.datesGridOps.onRegisterApi = function(gridApi) {
		self.datesGridApi = gridApi;

		gridApi.selection.on.rowSelectionChanged(self.scope, function cbSelChanged(row) {
			if (!row.entity || !row.entity.date) { return; }
			var date = row.entity.date;
			for (var i = 0; i < self.files.length; ++i) {
				if (self.files[i].date !== date) { continue; }
				if (row.isSelected) {
					self.filesGridApi.selection.selectRow(self.files[i]);
				} else {
					self.filesGridApi.selection.unSelectRow(self.files[i]);
				}
			}
		});
	};

	// The files grid columns
	this.filesGridOpts.columnDefs = [
		{ name: 'name' },
		{ name: 'size', type: 'number', cellFilter: 'bytes2KB' },
		{ name: 'lastModified', displayName: 'Date', type: 'date', cellFilter: 'localeDateTime'},
		{ name: 'dstPath', displayName: 'Download Path' }
	];

	this.filesGridOpts.onRegisterApi = function(gridApi) {
		self.filesGridApi = gridApi;
	};

	this.progressbarOptions = {
		onRegisterApi: function(api) {self.progressbar = api;}
	};

	this.registerToIPC();
}
MainWinCtrl.$inject = ['$scope'];
mainApp.controller('mainWinCtrl', MainWinCtrl);

MainWinCtrl.prototype.registerToIPC = function() {
	ipc.on(CONSTANTS.IPC.LOAD_FILE_LIST, this.onLoadFilesRequest.bind(this));
	ipc.on(CONSTANTS.IPC.COPY_PROGRESS, this.onCopyProgress.bind(this));
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

		// Add a "date" property to the file, will be used when we would like to select all files of
		// a specific date
		f.date = f.lastModified.toLocaleDateString();

		if (!distinctDates[f.date]) {
			// Add a date also to this object (for the datesGrid), will be used to select all files of this date
			distinctDates[f.date] = {lastModified: f.lastModified, date: f.date};
		}
	}

	// Convert the dates dictionary into array of objects (for the grid).
	this.fileDates = Object.keys(distinctDates).map(function(date) {return distinctDates[date];});
	this.datesGridOps.data = this.fileDates;

	this.filesGridOpts.data = this.files;

	// We are in IPC cb, need to digest
	ngUtils.safeApply(this.scope);
};

MainWinCtrl.prototype.onCopyProgress = function(data) {
	var pct = data.percentage*100;
	this.copyProgress.inprogress = pct < 100;
	this.copyProgress.file = data.file;
	this.copyProgress.percentage = data.percentage;

	if (pct < 100) {
		this.progressbar.set(pct);
	} else {
		this.progressbar.complete();
	}

	// We are in IPC cb, need to digest
	ngUtils.safeApply(this.scope);
};

MainWinCtrl.prototype.download = function() {
	// Get all the selected files, if no file is selected then we download all.
	var selected = this.filesGridApi.selection.getSelectedRows();
	if (selected.length < 1) {
		selected = this.files;
	}

	ipc.send(CONSTANTS.IPC.DOWNLOAD, Model.File.serializeArray(selected));
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

mainApp.directive('simpleProgress', ['$document', function($document) {
	return {
		// Replace the directive
		replace: true,
		// Only use as a element
		restrict: 'E',
		scope: {
			options: '='
		},
		link: function (scope) {
			var body = $document.find('body');
			var elem = angular.element('<div class="progress hidden"></div>');
			body.prepend(elem);

			var visible = false;
			if (typeof scope.options === 'object' && typeof scope.options.onRegisterApi === 'function') {
				scope.options.onRegisterApi({
					set: function(pct) {
						var n = parseInt(pct);
						if (isNaN(n)) {return;}

						if (n === 0) {return;}
						if (!visible) {
							elem.toggleClass('visible hidden');
							visible = true;
						}

						elem.css('width', pct + '%');
					},
					complete: function() {
						elem.css('width', '100%');
						elem.toggleClass('visible hidden');
						visible = false;
					}
				});
			}
		}
	};
}]);