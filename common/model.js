var util = require('util');

var Model = {};
module.exports = Model;

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
	this.lastModified = util.isDate(mdate) ? mdate : new Date(0);
	this.srcPath = '';
	this.dstPath = '';
}

/**
 * Serializes an array of files
 * @param {File[]} files - An array of files to serialize
 * @returns {string}
 */
File.serializeArray = function(files) {
	if (!util.isArray(files)) {
		throw new Error('files must be an array');
	}

	return JSON.stringify(files);
};

/**
 * Deserialize files array
 * @param {string} files - A serialized array of files
 * @returns {File[]}
 */
File.deserializeArray = function(files) {
	/** @type {File[]} */
	var decodedFiles;
	try {
		decodedFiles = JSON.parse(files);
	} catch(ex) {
		throw ex;
	}

	if (!util.isArray(decodedFiles)) {
		return null;
	}

	// Convert the lastModified string to date
	decodedFiles.forEach(function(f) {
		f.lastModified = new Date(f.lastModified);
		// If it is not a date create some date
		if (isNaN(f.lastModified.getDate())) {
			f.lastModified = new Date(0);
		}
	});

	return decodedFiles;
};

Model.File = File;
