var angular = require('angular'),
	util = require('util');

var mainApp = angular.module('mainWinApp');

/**
 * Filter to format dates
 */
mainApp.filter('localeDateTime', function() {
	return function(input, dateOnly) {
		if (!input || !util.isDate(input)) {
			return '';
		} else {
			return dateOnly ? input.toLocaleDateString() : input.toLocaleString();
		}
	};
});

/**
 * Filter to format file size from bytes to KB
 */
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

