// config MUST be used from the main process (as that is where it was initiated), so in case we are in the
// renderer process we will just remote require the config from the main process and export it
if (process.type === 'renderer') {
	module.exports = require('electron').remote.require('./common/config.js');
} else {
	var path = require('path'),
		fs = require('fs');

	var CONFIG_FILE = 'PhotoImp.json';
	var DEFAULT = {
		fileTypes: ['jpg', 'jpeg', 'tif', 'tiff', 'gif', 'png', 'bmp',
			'IIQ', '3FR', 'DCR', 'K25', 'KDC', 'CR2', 'ERF', 'MEF', 'MOS', 'NEF', 'ORF', 'PEF', 'RW2', 'ARW', 'SRF', 'SR2',
			'mov', 'mp4', 'm4v', 'avi'],
		downloadDirPattern: require('path').join(require('os-homedir')(), 'pictures', 'PhotoImp'),
		downloadFilePattern: '{o}'
	};

	var configFilePath = '';
	var currConfig = {};

	var Config = {};
	module.exports = Config;

	Config.Keys = {
		FileTypes: 'fileTypes',
		DownloadDirPattern: 'downloadDirPattern',
		DownloadFilePattern: 'downloadFilePattern'
	};

	/**
	 * Initialize the config
	 * NOTE!! This function has to be called from the main process only (which has access to "app" module)
	 * @param {object} app - The electron app module
	 */
	Config.init = function(app) {
		if (process.type === 'renderer') {
			throw new Error('init can not be called from a renderer process');
		}

		// We do everything in a try-catch, if we fail to load the config file we will just use default
		currConfig = DEFAULT;
		configFilePath = '';

		try {
			// Get the OS user data dir and verify it's there
			var userDataDir = app.getPath('userData');
			var stat = fs.statSync(userDataDir);
			if (!stat.isDirectory()) {
				return;
			}

			// config file is json so we can require it
			configFilePath = path.join(userDataDir, CONFIG_FILE);
			currConfig = require(configFilePath);

			// Extend the config with defaults (no deep copy)
			for (var key in DEFAULT) {
				currConfig[key] = currConfig[key] || DEFAULT[key];
			}
		} catch(ex) {
			// Couldn't load config file, use defaults
			currConfig = DEFAULT;
		}
	};

	/**
	 * Gets a config value by key
	 * @param {string} key - The config key to retrieve
	 * @returns {*}
	 */
	Config.get = function(key) {
		if (typeof key !== 'string' || !key) {
			return null;
		}

		return currConfig[key];
	};

	/**
	 * Sets a config value
	 * @param {string} key - The config key
	 * @param {*} value - The value
	 */
	Config.set = function(key, value) {
		if (typeof key !== 'string' || !key || typeof value === 'undefined') {
			return;
		}

		currConfig[key] = value;
	};

	/**
	 * Saves the current config to the disk
	 */
	Config.save = function() {
		// If we don't have a valid config file we can't save
		if (!configFilePath) {
			throw new Error('Config not initiated properly and can\'t be saved');
		}

		fs.writeFileSync(configFilePath, JSON.stringify(currConfig, null, '  '));
	};
}
