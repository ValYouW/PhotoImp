var FileFormatter = {};
module.exports = FileFormatter;

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

FileFormatter.Formatters = {
	Date: new Formatter('{d}', 'date YYMMDD', formatDate),
	Year2: new Formatter('{y}', '2-digit year', formatYear, {digits: 2}),
	Year4: new Formatter('{Y}', '4-digit year', formatYear, {digits: 2}),
	Month: new Formatter('{m}', 'month {01-12}', formatMonth, {type: 0}),
	MonthName: new Formatter('{B}', 'full month name', formatMonth, {type: 1}),
	FullMonthName: new Formatter('{B}', 'full month name', formatMonth, {type: 2}),
	Day: new Formatter('{D}', 'day of month', formatDay, {type: 0}),
	DayName: new Formatter('{a}', 'weekday name', formatDay, {type: 1}),
	FullDayName: new Formatter('{A}', 'full weekday name', formatDay, {type: 2})
};

FileFormatter.format = function(input, file) {
	var formatter;
	for (var f in FileFormatter.Formatters) {
		formatter = FileFormatter.Formatters[f];
		if (input.indexOf(formatter.pattern) < 0) { continue; }
		input = formatter.format(input, file);
	}

	return input;
};

function formatDate(input, file) {
	var year = file.lastModified.getFullYear().toString().slice(-2);
	var month = file.lastModified.getMonth() + 1;
	month = month > 9 ? month : '0' + month.toString();
	var day = file.lastModified.getDate().toString();

	input = input.replace(this.formatRegex, year + month + day);
	return input;
}

function formatYear(input, file) {}

function formatMonth(input, file) {}

function formatDay(input, file) {}

