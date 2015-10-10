var util = require('util');

/**
 * Represents a file
 * @param {string} name - The file name
 * @param {number} size - The file size
 * @param {Date} mdate - The file last modified date
 * @constructor
 */
function File(name, size, mdate) {
	this.name = name || '';
	this.size = size || 0;
	this.lastModified = util.isDate(mdate) ? mdate.getTime() : 0;
	this.srcPath = '';
	this.dstPath = '';
}

File.serializeArray = function(files) {
	if (!util.isArray(files)) {
		throw new Error('files must be an array');
	}

	return JSON.stringify(files);
};

File.deserializeArray = function(files) {
	try {
		files = JSON.parse(files);
	} catch(ex) {
		throw ex;
	}

	if (!util.isArray(files)) {
		return null;
	}

	// Convert the lastModified string to date
	files.forEach(function(f) {
		f.lastModified = new Date(f.lastModified);
		// If it is not a date create some date
		if (isNaN(f.lastModified.getDate())) {
			f.lastModified = new Date(0);
		}
	});

	return files;
};

module.exports.File = File;
