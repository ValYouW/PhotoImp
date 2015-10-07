var CONSTANTS = require('../../common/constants.js'),
	BrowserWindow = require('browser-window'),
	settingsCtrl = require('../settings/settings-controller.js'),
	dialog = require('dialog'),
	Menu = require('menu'),
	path = require('path'),
	app = require('app'),
	fs = require('fs');

var IS_IMG_REGEX = new RegExp('.*\.(' + CONSTANTS.DEFAULTS.FILE_TYPES.join('|') + ')$', 'i');

function MainController() {
	this.window = null;
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
					click: this.onOpenClick.bind(this)
				},
				{
					label: 'Settings...',
					click: this.onSettingsClick.bind(this)
				},
				{
					type: 'separator'
				},
				{
					label: 'Quit',
					click: this.onQuitClick.bind(this)
				}
			]
		}
	]);

	this.window.setMenu(menu);
	this.window.loadUrl('file://' + __dirname + '/main.html');
};

MainController.prototype.loadImages = function(folder) {
	fs.readdir(folder, function cbReadDir(err, files) {
		if (err) {
			dialog.showErrorBox('Ooops', 'Error while trying to read files');
			return;
		}

		var filteredExts = {};
		files = files.filter(function cbFilterFile(file) {
			var stat = fs.lstatSync(path.join(folder, file));
			if (!stat || !stat.isFile()) { return false; }
			if (IS_IMG_REGEX.test(file)) { return true; }

			// This file extension should be ignored, save the extension in the hash
			var m = file.match(/.*\.(.*)$/);
			if (m) { filteredExts[m[1]] = true; }
			return false;
		});

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

		this.window.webContents.send(CONSTANTS.IPC.LOAD_FILE_LIST, files);
	}.bind(this));
};

MainController.prototype.onOpenClick = function() {
	var dir = dialog.showOpenDialog(this.window, {
		title: 'Select source directory',
		properties: ['openDirectory']
	});

	if (dir && dir.length > 0) {
		this.loadImages(dir[0]);
	}
};

MainController.prototype.onSettingsClick = function() {
	if (this.settingsWin) {
		this.settingsWin.focus();
		return;
	}

	this.settingsWin = settingsCtrl.show();
	this.settingsWin.on('closed', function() {
		this.settingsWin = null;
	}.bind(this));
};
MainController.prototype.onQuitClick = function() {
	app.quit();
};

var instance = new MainController();
module.exports = instance;
