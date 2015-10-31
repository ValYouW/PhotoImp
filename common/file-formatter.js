
//<editor-fold desc=Private functions {...}>

function formatDate(input, file) {
	var year = file.lastModified.getFullYear().toString().slice(-2);
	var month = file.lastModified.getMonth() + 1;
	month = month > 9 ? month : '0' + month.toString();
	var day = file.lastModified.getDate().toString();

	input = input.replace(this.formatRegex, year + month + day);
	return input;
}

function formatYear(input, file) {

}

function formatMonth(input, file) {}

function formatDay(input, file) {}

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
	'{d}': new Formatter('{d}', 'date YYMMDD', formatDate),
	'{y}': new Formatter('{y}', '2-digit year', formatYear, {digits: 2}),
	'{Y}': new Formatter('{Y}', '4-digit year', formatYear, {digits: 2}),
	'{m}': new Formatter('{m}', 'month {01-12}', formatMonth, {type: 0}),
	'{b}': new Formatter('{B}', 'month name', formatMonth, {type: 1}),
	'{B}': new Formatter('{B}', 'full month name', formatMonth, {type: 2}),
	'{D}': new Formatter('{D}', 'day of month', formatDay, {type: 0}),
	'{a}': new Formatter('{a}', 'weekday name', formatDay, {type: 1}),
	'{A}': new Formatter('{A}', 'full weekday name', formatDay, {type: 2})
};

// Loop thru all the formatters and build a global regex like: ({x}|{y}|{z})
var patterns = Object.keys(FileFormatter.Formatters).join('|');
allPatternsRegex = new RegExp('(' + patterns + ')', 'g');
