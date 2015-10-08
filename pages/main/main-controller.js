var CONSTANTS = require('../../common/constants.js'),
	BrowserWindow = require('browser-window'),
	settingsCtrl = require('../settings/settings-controller.js'),
	dialog = require('dialog'),
	Menu = require('menu'),
	File = require('../../common/file.js'),
	path = require('path'),
	app = require('app'),
	fs = require('fs');

var IS_IMG_REGEX = new RegExp('.*\.(' + CONSTANTS.DEFAULTS.FILE_TYPES.join('|') + ')$', 'i');

function fileComperator(f1, f2) {
	if (f1.lastModified < f2.lastModified) {return -1;}
	if (f1.lastModified > f2.lastModified) {return 1;}
	return 0;
}

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
		files = files.map(function cbFilterFile(file) {
			var stat = fs.lstatSync(path.join(folder, file));
			if (!stat || !stat.isFile()) { return null; }
			if (IS_IMG_REGEX.test(file)) { return new File(file, stat.size || stat.blocks, stat.mtime); }

			// This file extension should be ignored, save the extension in the hash
			var m = file.match(/.*\.(.*)$/);
			if (m) { filteredExts[m[1]] = true; }
			return null;
		}).filter(function(i){ return i;}).sort(fileComperator);

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
