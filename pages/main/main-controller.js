var CONSTANTS = require('../../common/constants.js'),
	config = require('../../common/config.js'),
	BrowserWindow = require('browser-window'),
	settingsCtrl = require('../settings/settings-controller.js'),
	fileUtils = require('../../common/file-utils.js'),
	dialog = require('dialog'),
	Menu = require('menu'),
	Model = require('../../common/model.js'),
	app = require('app'),
	ipc = require('ipc');

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
		title: 'PhotoImp'
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

/**
 * Load the images from the folder into the UI
 * @param {string} folder - The source folder
 */
MainController.prototype.loadImages = function(folder) {
	fileUtils.getFiles(folder, IS_IMG_REGEX, downloadPath, function cbGetFiles(err, data) {
		if (err) {
			dialog.showErrorBox('Ooops', 'Error while trying to read files');
			return;
		}

		// If there are some extensions we ignored show a message to the user
		if (data.ignored.length > 0) {
			dialog.showMessageBox(this.window, {
				type: 'info',
				buttons: ['OK'],
				title: 'Folder contains non-supported files',
				message: 'The folder: ' + folder + ' contains files that are not supported',
				detail: 'to include these files add their extension under Settings -> Supported File Types\n\n' +
				'Ignored file types: ' + data.ignored.join(', ')
			});
		}

		var files = Model.File.serializeArray(data.files);
		this.window.webContents.send(CONSTANTS.IPC.LOAD_FILE_LIST, files);
	}.bind(this));
};

/**
 * Handles a request from the view to download files
 * @param {object} sender - The sender object from the view
 * @param {string} params - A serialized files list
 */
MainController.prototype.onDownloadRequest = function(sender, params) {
	var files = Model.File.deserializeArray(params);

	var self = this;
	function cbCopyError(err) {
		var response = dialog.showMessageBox(self.window, {
			type: 'error',
			buttons: ['Resume', 'Abort'],
			title: 'Error copying file',
			message: err
		});

		// Return whether we should resume or not
		return response !== 1;
	}

	function cbCopyProgress(data) {
		self.window.webContents.send(CONSTANTS.IPC.COPY_PROGRESS, data);
	}

	function cbDoneCopy() {
		console.log('Done!!!');
	}

	fileUtils.copyFiles(files, cbCopyError, cbCopyProgress, cbDoneCopy);
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
