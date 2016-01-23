var Model = require('./model.js'),
	fileFormatter = require('./file-formatter.js'),
	path = require('path'),
	fse = require('fs-extra'),
	fs = require('fs');

var FILE_EXT_REGEX = /.*\.(.*)$/;

/**
 * Copies a file
 * @param {File} file - The file details to copy
 * @param {function(Error)} cb - A response callback
 */
function copyFile(file, cb) {
	// Make sure source file exists
	if (!fs.existsSync(file.srcPath)) {
		cb(new Error('File src not found: ' + file.srcPath));
		return;
	}

	// Try to create the dst folder (using ensureDir and not ensureDirSync as the later doesn't work well)
	var dstFolder = path.dirname(file.dstPath);
	fse.ensureDir(dstFolder, function cbEnsureDir(err) {
		if (err) {
			cb(new Error('Error creating destination folder: `' + dstFolder + '`, Error: ' + err.message));
			return;
		}

		// Copy the file
		err = null;
		try {
			// Use copySync as async copy is extremely slow
			fse.copySync(file.srcPath, file.dstPath, {preserveTimestamps: true});
		} catch (ignore) {
			err = new Error('Error downloading file: ' + file.srcPath);
		}

		cb(err);
	});
}

var FileUtils = {};
module.exports = FileUtils;

/**
 * Get download file info from a folder
 * @param {string} folder - The folder from which to read files
 * @param {RegExp} supportedFilesRegex - A regular expression of supported file extensions
 * @param {string} downloadPattern - A download path pattern
 * @param {function(Error, {files: Model.File[], ignored: string[]}=)} cb - Response callback
 */
FileUtils.getFiles = function(folder, supportedFilesRegex, downloadPattern, cb) {
	fs.readdir(folder, function cbReadDir(err, fileNames) {
		if (err) {
			cb(err);
			return;
		}

		var filteredExts = {}; // Will hold all file extensions that we filtered out (unsupported extensions)
		var loadedFiles = [];
		for (var i = 0; i < fileNames.length; ++i) {
			// Get the file's full path and make sure it's a file
			var fileName = fileNames[i];
			var srcPath = path.join(folder, fileName);
			var stat = fs.lstatSync(srcPath);
			if (!stat || !stat.isFile()) {
				continue;
			}

			// Check the file extension against the filter, if it passes create the file
			if (supportedFilesRegex.test(fileName)) {
				var fileModel =  new Model.File(fileName, stat.size || stat.blocks, stat.mtime);
				fileModel.srcPath = srcPath;
				fileModel.dstPath = fileFormatter.format(downloadPattern, fileModel);
				loadedFiles.push(fileModel);
				continue;
			}

			// This file extension should be ignored, save the extension in the hash
			var m = fileName.match(FILE_EXT_REGEX);
			if (m) { filteredExts[m[1]] = true; }
		}

		cb(null, {files: loadedFiles, ignored: Object.keys(filteredExts)});
	});
};

/**
 * Copy a list of files synchronously but releasing the event-loop every 5 files (async copy is very slow)
 * @param {File[]} files - An array of files to copy
 * @param {function(Error)} cbError - A SYNC callback, must return a boolean indicating whether operation should resume
 * @param {function({file: string, percentage: number}):boolean} cbProgress - A progress report callback
 * @param {function} cbDone - Callback when done
 */
FileUtils.copyFiles = function(files, cbError, cbProgress, cbDone) {
	if (files.length < 1) {
		cbDone();
		return;
	}

	var i = 0;
	var abort = false;
	function copyNext(file) {
		// Before the copy we report a progress with the current index (just notify that we start to copy),
		// only after the copy we will advance the completion percentage
		cbProgress({file: file.srcPath, percentage: (i)/files.length});
		copyFile(files[i], function cbDoneCopy(err) {
			cbProgress({file: file.srcPath, percentage: (i+1)/files.length});
			if (err) {
				var resume = cbError(err);
				if (!resume) {
					cbDone();
					return;
				}
			}

			// Move to the next file if there are any
			if (!abort && ++i < files.length) {
				// Since we do copySync we need to free the event-loop every once in a while
				if (i % 5 === 0) {
					setTimeout(copyNext, 5, files[i]);
				} else {
					copyNext(files[i]);
				}

				return;
			}

			cbDone(abort);
		});
	}

	copyNext(files[i]);
	return function() {abort = true;};
};
