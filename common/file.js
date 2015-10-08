var util = require('util');

function File(name, size, mdate) {
	this.name = name || '';
	this.size = size || 0;
	this.lastModified = util.isDate(mdate) ? mdate.getTime() : 0;
}

module.exports = File;