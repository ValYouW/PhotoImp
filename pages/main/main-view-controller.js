/* globals document */
var CONSTANTS = require('../../common/constants.js'),
	ipc = require('ipc'),
	angular = require('angular');

var ngApp = angular.module('mainWinApp', []);
ngApp.controller('mainWinCtrl', function() {
	this.name = 'yuval';
});

ipc.on(CONSTANTS.IPC.LOAD_FILE_LIST, function onLoadFilesRequest(files) {
	document.getElementById('txtFiles').innerHTML = files.join();
});
