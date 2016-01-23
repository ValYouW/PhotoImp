var CONSTANTS = require('../../common/constants.js'),
	config = require('../../common/config.js'),
	BrowserWindow = require('browser-window'),
	settingsCtrl = require('../settings/settings-controller.js'),
	fileUtils = require('../../common/file-utils.js'),
	dialog = require('dialog'),
	Menu = require('menu'),
	Model = require('../../common/model.js'),
	path = require('path'),
	app = require('app'),
	ipc = require('ipc');

var fileTypes = config.get(config.Keys.FileTypes) || []; // Supported extensions
var IS_IMG_REGEX = new RegExp('.*\.(' + fileTypes.join('|') + ')$', 'i'); // Regex to check if file ext is supported

/**
 * The window controller (on the main process)
 * @constructor
 */
function MainController() {
	this.window = null;
	this.selectedFolder = '';
	this.abortFn = null;

	// Register to IPC events (to communicate with renderer process)
	ipc.on(CONSTANTS.IPC.DOWNLOAD, this.onDownloadRequest.bind(this));
	ipc.on(CONSTANTS.IPC.ABORT, this.onAbortRequest.bind(this));
}

/**
 * Shows the main window
 */
MainController.prototype.show = function () {
	this.settingsWin = null;
	this.window = new BrowserWindow({
		width: 800,
		height: 600,
		resizable: true,
		title: 'PhotoImp',
		icon: path.resolve(__dirname, '../../assets/logo_32.png')
	});

	// Create the menu
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
	if (!folder) { return; }
	var downloadPathPattern = path.join(config.get(config.Keys.DownloadDirPattern), config.get(config.Keys.DownloadFilePattern));
	fileUtils.getFiles(folder, IS_IMG_REGEX, downloadPathPattern, function cbGetFiles(err, data) {
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

		// Serialize the file list and send it to the view (on renderer process)
		this.selectedFolder = folder;
		var files = Model.File.serializeArray(data.files);
		this.window.webContents.send(CONSTANTS.IPC.LOAD_FILE_LIST, files);
	}.bind(this));
};

/**
 * Handles a request from the view to download files
 * @param {object} sender - The sender object from the view
 * @param {string} args - A serialized files list
 */
MainController.prototype.onDownloadRequest = function(sender, args) {
	var files = Model.File.deserializeArray(args);
	var self = this;

	/**
	 * Handles a copy error event
	 */
	function cbCopyError(err) {
		var response = dialog.showMessageBox(self.window, {
			type: 'error',
			buttons: ['Resume', 'Abort'],
			title: 'Error copying file',
			message: err.message
		});

		// Return whether we should resume or not
		return response !== 1;
	}

	/**
	 * Handles a copy progress event
	 */
	function cbCopyProgress(data) {
		// Send the progress data to the view
		self.window.webContents.send(CONSTANTS.IPC.COPY_PROGRESS, data);
	}

	/**
	 * Handles a copy done event
	 */
	function cbDoneCopy(aborted) {
		// In case we abort send a 100% completion to the view (this will close the progress-bar)
		if (aborted) {
			self.window.webContents.send(CONSTANTS.IPC.COPY_PROGRESS, 1);
		}
	}

	// Start the copy process and save the abort function
	this.abortFn = fileUtils.copyFiles(files, cbCopyError, cbCopyProgress, cbDoneCopy);
};

/**
 * Handles a download abort request from the view
 */
MainController.prototype.onAbortRequest = function() {
	if (this.abortFn) {
		this.abortFn();
	}
};

/**
 * Handles a File->Open menu event
 */
MainController.prototype.onMnuOpenClick = function() {
	// Show dialog to select directories only
	var dir = dialog.showOpenDialog(this.window, {
		title: 'Select source directory',
		properties: ['openDirectory']
	});

	if (dir && dir.length > 0) {
		this.loadImages(dir[0]);
	}
};

/**
 * Handles a File->Settings menu event
 */
MainController.prototype.onMnuSettingsClick = function() {
	// If the settings window already open just bring it to the front
	if (this.settingsWin) {
		this.settingsWin.focus();
		return;
	}

	// Open the settings window and reload all images (with the new settings) when it is closed
	this.settingsWin = settingsCtrl.show();
	this.settingsWin.on('closed', function() {
		this.settingsWin = null;
		this.loadImages(this.selectedFolder);
	}.bind(this));
};

/**
 * Handles the Quit menu item
 */
MainController.prototype.onMnuQuitClick = function() {
	app.quit();
};

var instance = new MainController();
module.exports = instance;
