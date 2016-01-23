var angular = require('angular'),
	path = require('path'),
	Model = require('../../common/model.js'),
	fileFormatter = require('../../common/file-formatter.js');

var settingsApp = angular.module('settingsWinApp');

/**
 * Filter to format a file pattern
 */
settingsApp.filter('dstpath', function() {
	return function(file, dirPattern, filePattern) {
		if (!(file instanceof Model.File)) {return '';}
		dirPattern = dirPattern || '';
		filePattern = filePattern || '';
		var dst = path.join(dirPattern, filePattern);
		return fileFormatter.format(dst, file);
	};
});
