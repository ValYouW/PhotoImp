var config = {
	fileTypes: ['jpg', 'jpeg', 'tif', 'tiff', 'gif', 'png', 'bmp',
		'IIQ', '3FR', 'DCR', 'K25', 'KDC', 'CR2', 'ERF', 'MEF', 'MOS', 'NEF', 'ORF', 'PEF', 'RW2', 'ARW', 'SRF', 'SR2',
		'mov', 'mp4', 'm4v', 'avi'],
	downloadPath: require('path').join(require('os-homedir')(), 'pictures')
};

var Config = {};
module.exports = Config;

Config.Keys = {
	FileTypes: 'fileTypes',
	DownloadPath: 'downloadPath'
};

Config.get = function(key) {
	if (typeof key !== 'string' || !key) {
		return null;
	}

	return config[key];
};