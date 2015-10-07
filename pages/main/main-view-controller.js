/* globals document */
var CONSTANTS = require('../../common/constants.js'),
	ipc = require('ipc');

ipc.on(CONSTANTS.IPC.LOAD_FILE_LIST, function onLoadFilesRequest(files) {
	document.getElementById('txtFiles').innerHTML = files.join();
});
