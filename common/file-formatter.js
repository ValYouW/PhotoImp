var dateformat = require('./dateformat.js');

//<editor-fold desc=Private functions {...}>

function formatDate(input, file) {
	if (!this.options || typeof this.options.format !== 'string' || !this.options.format) {return input;}
	return input.replace(this.formatRegex, dateformat(file.lastModified, this.options.format));
}

function formatName(input, file) {
	return input.replace(this.formatRegex, file.name);
}

//</editor-fold>

function Formatter(pattern, desc, formatFn, options) {
	this.pattern = pattern;
	this.formatRegex = new RegExp(this.pattern, 'g');
	this.desc = desc;
	this.formatFn = formatFn;
	this.options = options;
}

/**
 * Format the input according to the formatter pattern
 * @param {string} input
 * @param {Model.File} file
 * @returns {string}
 */
Formatter.prototype.format = function(input, file) {
	if (!input || !file) {
		return input;
	}

	return this.formatFn.call(this, input, file);
};

var FileFormatter = {};
module.exports = FileFormatter;

var allPatternsRegex;

FileFormatter.format = function(input, file) {
	var patterns = input.match(allPatternsRegex) || [];
	for (var i = 0; i < patterns.length; ++i) {
		var formatter = FileFormatter.Formatters[patterns[i]];
		if (!formatter) {continue;}
		input = formatter.format(input, file) || input;
	}

	return input;
};

FileFormatter.Formatters = {
	'{o}': new Formatter('{o}', 'Original file name', formatName),
	'{dt}': new Formatter('{dt}', 'date YYMMDD', formatDate, {format: 'yymmdd'}),
	'{yy}': new Formatter('{yy}', '2-digit year', formatDate, {format: 'yy'}),
	'{yyyy}': new Formatter('{yyyy}', '4-digit year', formatDate, {format: 'yyyy'}),
	'{m}': new Formatter('{m}', 'Month as digits; no leading zero for single-digit months', formatDate, {format: 'm'}),
	'{mm}': new Formatter('{mm}', 'Month as digits; leading zero for single-digit months', formatDate, {format: 'mm'}),
	'{mmm}': new Formatter('{mmm}', 'Month as a three-letter abbreviation', formatDate, {format: 'mmm'}),
	'{mmmm}': new Formatter('{mmmm}', 'Month as its full name', formatDate, {format: 'mmmm'}),
	'{d}': new Formatter('{d}', 'Day of the month as digits; no leading zero for single-digit days', formatDate, {format: 'd'}),
	'{dd}': new Formatter('{dd}', 'Day of the month as digits; leading zero for single-digit days', formatDate, {format: 'dd'}),
	'{ddd}': new Formatter('{ddd}', 'Day of the week as a three-letter abbreviation', formatDate, {format: 'ddd'}),
	'{dddd}': new Formatter('{dddd}', 'Day of the week as its full name', formatDate, {format: 'dddd'}),
	'{h}': new Formatter('{h}', 'Hours; no leading zero for single-digit hours (12-hour clock)', formatDate, {format: 'h'}),
	'{hh}': new Formatter('{hh}', 'Hours; leading zero for single-digit hours (12-hour clock)', formatDate, {format: 'hh'}),
	'{H}': new Formatter('{H}', 'Hours; no leading zero for single-digit hours (24-hour clock)', formatDate, {format: 'H'}),
	'{HH}': new Formatter('{HH}', 'Hours; leading zero for single-digit hours (24-hour clock)', formatDate, {format: 'HH'}),
	'{M}': new Formatter('{M}', 'Minutes; no leading zero for single-digit hours (12-hour clock)', formatDate, {format: 'M'}),
	'{MM}': new Formatter('{MM}', 'Minutes; leading zero for single-digit hours (12-hour clock)', formatDate, {format: 'MM'}),
	'{s}': new Formatter('{s}', 'Seconds; no leading zero for single-digit hours (24-hour clock)', formatDate, {format: 's'}),
	'{ss}': new Formatter('{ss}', 'Seconds; leading zero for single-digit hours (24-hour clock)', formatDate, {format: 'ss'}),
	'{tt}': new Formatter('{tt}', 'Lowercase, two-character time marker string: am/pm', formatDate, {format: 'tt'}),
	'{TT}': new Formatter('{TT}', 'Uppercase, two-character time marker string: AM/PM', formatDate, {format: 'TT'})
};

// Loop thru all the formatters and build a global regex like: ({x}|{y}|{z})
var patterns = Object.keys(FileFormatter.Formatters).join('|');
allPatternsRegex = new RegExp('(' + patterns + ')', 'g');
