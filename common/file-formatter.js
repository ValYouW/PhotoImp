import dateformat from './dateformat.js';

// <editor-fold desc="// Formatter {...}">

class Formatter {
	constructor(pattern, desc) {
		this.pattern = pattern;
		this.formatRegex = new RegExp(this.pattern, 'g');
		this.desc = desc;
	}

	/**
	 * Format a pattern string with values from a file
	 * @param {string} input - The input string to format
	 * @param {File} file - The file to take the formatting values from (like date/size etc)
	 * @returns {string}
	 * @abstract
	 */
	format(input, file) {}
}

// </editor-fold> // Formatter

// <editor-fold desc="// DateFormatter {...}">

/**
 * Formats a string using the file's last modified date
 * @constructor
 * @inherits {Formatter}
 */
class DateFormatter extends Formatter {
	constructor(pattern, desc, options) {
		super(pattern, desc);

		// Save the options and make sure it has a valid format string
		this.options = options;
		if (!this.options || typeof this.options.format !== 'string' || !this.options.format) { this.options = null; }
	}

	format(input, file) {
		// Make sure we have a formatting options
		if (!this.options) { return input; }
		return input.replace(this.formatRegex, dateformat(file.lastModified, this.options.format));
	}
}

// </editor-fold> // DateFormatter

// <editor-fold desc="// NameFormatter {...}">

/**
 * Formats a string using the file name
 * @constructor
 * @inherits {Formatter}
 */
class NameFormatter extends Formatter {
	constructor(pattern, desc) {
		super(pattern, desc);
	}

	format(input, file) {
		return input.replace(this.formatRegex, file.name);
	}
}

// </editor-fold> // NameFormatter

var FileFormatter = {};

var allPatternsRegex;

/**
 * Formats a pattern string using the properties of the file
 * @param {string} input - An input pattern string to format
 * @param {File} file - A file object to use as the format values
 * @returns {string}
 */
FileFormatter.format = function(input, file) {
	// Get a list of all the different supported patterns
	var patterns = input.match(allPatternsRegex) || [];

	// Loop thru the patterns and use the appropriate formatter (if pattern not supported ignore it)
	for (var i = 0; i < patterns.length; ++i) {
		var formatter = FileFormatter.Formatters[patterns[i]];
		if (!formatter) {continue;}
		input = formatter.format(input, file) || input;
	}

	return input;
};

// Create a list of all supported patterns and for each pattern create its formatter
FileFormatter.Formatters = {
	'{o}': new NameFormatter('{o}', 'Original file name'),
	'{dt}': new DateFormatter('{dt}', 'date YYMMDD', {format: 'yymmdd'}),
	'{yy}': new DateFormatter('{yy}', '2-digit year', {format: 'yy'}),
	'{yyyy}': new DateFormatter('{yyyy}', '4-digit year', {format: 'yyyy'}),
	'{m}': new DateFormatter('{m}', 'Month as digits; no leading zero for single-digit months', {format: 'm'}),
	'{mm}': new DateFormatter('{mm}', 'Month as digits; leading zero for single-digit months', {format: 'mm'}),
	'{mmm}': new DateFormatter('{mmm}', 'Month as a three-letter abbreviation', {format: 'mmm'}),
	'{mmmm}': new DateFormatter('{mmmm}', 'Month as its full name', {format: 'mmmm'}),
	'{d}': new DateFormatter('{d}', 'Day of the month as digits; no leading zero for single-digit days', {format: 'd'}),
	'{dd}': new DateFormatter('{dd}', 'Day of the month as digits; leading zero for single-digit days', {format: 'dd'}),
	'{ddd}': new DateFormatter('{ddd}', 'Day of the week as a three-letter abbreviation', {format: 'ddd'}),
	'{dddd}': new DateFormatter('{dddd}', 'Day of the week as its full name', {format: 'dddd'}),
	'{h}': new DateFormatter('{h}', 'Hours; no leading zero for single-digit hours (12-hour clock)', {format: 'h'}),
	'{hh}': new DateFormatter('{hh}', 'Hours; leading zero for single-digit hours (12-hour clock)', {format: 'hh'}),
	'{H}': new DateFormatter('{H}', 'Hours; no leading zero for single-digit hours (24-hour clock)', {format: 'H'}),
	'{HH}': new DateFormatter('{HH}', 'Hours; leading zero for single-digit hours (24-hour clock)', {format: 'HH'}),
	'{M}': new DateFormatter('{M}', 'Minutes; no leading zero for single-digit hours (12-hour clock)', {format: 'M'}),
	'{MM}': new DateFormatter('{MM}', 'Minutes; leading zero for single-digit hours (12-hour clock)', {format: 'MM'}),
	'{s}': new DateFormatter('{s}', 'Seconds; no leading zero for single-digit hours (24-hour clock)', {format: 's'}),
	'{ss}': new DateFormatter('{ss}', 'Seconds; leading zero for single-digit hours (24-hour clock)', {format: 'ss'}),
	'{tt}': new DateFormatter('{tt}', 'Lowercase, two-character time marker string: am/pm', {format: 'tt'}),
	'{TT}': new DateFormatter('{TT}', 'Uppercase, two-character time marker string: AM/PM', {format: 'TT'})
};

// Loop thru all the patterns and build a global regex like: ({x}|{y}|{z})
var patterns = Object.keys(FileFormatter.Formatters).join('|');
allPatternsRegex = new RegExp('(' + patterns + ')', 'g');

export default FileFormatter;
