import utils from '../common/utils.js';

class File {
	/**
	 * Represents a file
	 * @param {string} name - The file name
	 * @param {number} size - The file size
	 * @param {Date} mdate - The file last modified date
	 * @constructor
	 */
	constructor(name, size, mdate) {
		this.name = name || '';
		this.size = size || 0;
		this.lastModified = utils.isDate(mdate) ? mdate : new Date(0);
		this.srcPath = '';
		this.dstPath = '';
	}

	/**
	 * Serializes an array of files
	 * @param {File[]} files - An array of files to serialize
	 * @returns {string}
	 */
	static serializeArray(files) {
		if (!utils.isArray(files)) {
			throw new Error('files must be an array');
		}

		return JSON.stringify(files);
	}

	/**
	 * Deserialize files array
	 * @param {string} files - A serialized array of files
	 * @returns {File[]}
	 */
	static deserializeArray(files) {
		/** @type {File[]} */
		var decodedFiles;
		try {
			decodedFiles = JSON.parse(files);
		} catch(ex) {
			throw ex;
		}

		if (!utils.isArray(decodedFiles)) {
			return null;
		}

		// Convert the lastModified string to date
		decodedFiles.forEach(f => {
			f.lastModified = new Date(f.lastModified);
			// If it is not a date create some date
			if (isNaN(f.lastModified.getDate())) {
				f.lastModified = new Date(0);
			}
		});

		return decodedFiles;
	}
}

export {File};
