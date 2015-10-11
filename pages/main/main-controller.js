var CONSTANTS = require('../../common/constants.js'),
	config = require('../../common/config.js'),
	BrowserWindow = require('browser-window'),
	settingsCtrl = require('../settings/settings-controller.js'),
	dialog = require('dialog'),
	Menu = require('menu'),
	Model = require('../../common/model.js'),
	path = require('path'),
	app = require('app'),
	ipc = require('ipc'),
	fs = require('fs');

var fileTypes = config.get(config.Keys.FileTypes) || [];
var downloadPath = config.get(config.Keys.DownloadPath);
var IS_IMG_REGEX = new RegExp('.*\.(' + fileTypes.join('|') + ')$', 'i');

function MainController() {
	this.window = null;
	ipc.on(CONSTANTS.IPC.DOWNLOAD, this.onDownloadRequest.bind(this));
}

MainController.prototype.show = function () {
	this.settingsWin = null;
	this.window = new BrowserWindow({
		width: 800,
		height: 600,
		resizable: true,
		title: 'PhotoImp by ValYouW'
	});

	var menu = Menu.buildFromTemplate([
		{
			label: 'File',
			submenu: [
				{
					label: 'Open...',
					click: this.onMnuOpenClick.bind(this)
				},
				{
					label: 'Settings...',
					click: this.onMnuSettingsClick.bind(this)
				},
				{
					type: 'separator'
				},
				{
					label: 'Quit',
					click: this.onMnuQuitClick.bind(this)
				}
			]
		}
	]);

	this.window.setMenu(menu);
	this.window.loadUrl('file://' + __dirname + '/main.html');
};

MainController.prototype.loadImages = function(folder) {
	fs.readdir(folder, function cbReadDir(err, fileNames) {
		if (err) {
			dialog.showErrorBox('Ooops', 'Error while trying to read files');
			return;
		}

		var filteredExts = {}; // Will hold all file extensions that we didn't recognize as image
		var loadedFiles = [];
		for(var i = 0; i < fileNames.length; ++i) {
			var fileName = fileNames[i];
			var srcPath = path.join(folder, fileName);
			var stat = fs.lstatSync(srcPath);
			if (!stat || !stat.isFile()) {
				continue;
			}

			// Check if this is an image file, if so create the file model
			if (IS_IMG_REGEX.test(fileName)) {
				var fileModel =  new Model.File(fileName, stat.size || stat.blocks, stat.mtime);
				fileModel.srcPath = srcPath;
				fileModel.dstPath = this.getDstPath(fileModel);
				loadedFiles.push(fileModel);
				continue;
			}

			// This file extension should be ignored, save the extension in the hash
			var m = fileName.match(/.*\.(.*)$/);
			if (m) { filteredExts[m[1]] = true; }
		}

		// If there are some extensions we ignored show a message to the user
		var ignoredExts = Object.keys(filteredExts);
		if (ignoredExts.length > 0) {
			dialog.showMessageBox(this.window, {
				type: 'info',
				buttons: ['OK'],
				title: 'Folder contains non-supported files',
				message: 'The folder: ' + folder + ' contains files that are not supported',
				detail: 'to include these files add their extension under Settings -> Supported File Types\n\n' +
						'Ignored file types: ' + ignoredExts.join(', ')
			});
		}

		var data = Model.File.serializeArray(loadedFiles);
		this.window.webContents.send(CONSTANTS.IPC.LOAD_FILE_LIST, data);
	}.bind(this));
};

/**
 * Sets the download destination path for the file
 * @param {Model.File} file - The target file
 * @returns {string}
 * @private
 */
MainController.prototype.getDstPath = function(file) {
	// todo: calc the real download path based on patterns
	return path.join(downloadPath, file.name);
};

MainController.prototype.onDownloadRequest = function(files) {

};

MainController.prototype.onMnuOpenClick = function() {
	var dir = dialog.showOpenDialog(this.window, {
		title: 'Select source directory',
		properties: ['openDirectory']
	});

	if (dir && dir.length > 0) {
		this.loadImages(dir[0]);
	}
};

MainController.prototype.onMnuSettingsClick = function() {
	if (this.settingsWin) {
		this.settingsWin.focus();
		return;
	}

	this.settingsWin = settingsCtrl.show();
	this.settingsWin.on('closed', function() {
		this.settingsWin = null;
	}.bind(this));
};

MainController.prototype.onMnuQuitClick = function() {
	app.quit();
};

var instance = new MainController();
module.exports = instance;
