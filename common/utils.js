import path from 'path';

var injectedCSS = {};

var Utils = {};

Utils.isDate = function(d) {
	return Object.prototype.toString.call(d) === '[object Date]';
};

Utils.isArray = Array.isArray;

/**
 * Inject css into document
 * @param {object} document - HTML document object
 * @param {string} file - The css file path to inject relative to the project root
 */
Utils.injectCSS = function(document, file) {
	file = path.resolve(__dirname, '../', file);
	file = file.replace(/\\/g, '/');
	if (injectedCSS[file]) {return;}
	var style = document.createElement('style');
	style.innerText = `@import url(${file});\n`;
	document.head.appendChild(style);
	injectedCSS[file] = file;
};

export default Utils;
