import CONSTANTS from '../../common/constants.js';
import {ipcMain, dialog, BrowserWindow} from 'electron';
import {EventEmitter} from 'events';
import path from 'path';

class SettingsController extends EventEmitter {
	constructor() {
		super();
		this.window = null;

		// Register to IPC events (to communicate with renderer process)
		ipcMain.on(CONSTANTS.IPC.OPEN_DIR_DIALOG, this.onOpenDialogRequest.bind(this));
	}

	/**
	 * Shows the settings window
	 * @returns {SettingsController}
	 */
	show() {
		this.window = new BrowserWindow({
			width: 420,
			height: 580,
			resizable: true,
			title: 'Settings',
			icon: path.resolve(__dirname, '../../assets/logo_32.png')
		});

		// Hide the default menu
		this.window.setMenu(null);
		this.window.loadURL('file://' + __dirname + '/settings.html');
		this.window.on('closed', this.onClosed.bind(this));
		return this;
	}

	/**
	 * Bring the settings window to the front
	 */
	focus() {
		if (this.window) {
			this.window.focus();
		}
	}

	/**
	 * Handles the window close event
	 */
	onClosed() {
		this.window = null;
		this.emit('closed');
	}

	/**
	 * Handles an open dialog request from the view
	 */
	onOpenDialogRequest() {
		// Show dialog to select directories only
		var dir = dialog.showOpenDialog(this.window, {
			title: 'Select download directory',
			properties: ['openDirectory']
		});

		if (dir && dir.length > 0) {
			// Update the view with the new selected directory
			this.window.webContents.send(CONSTANTS.IPC.DOWNLOAD_DIR_CHANGED, dir[0]);
		}
	}
}

export default new SettingsController();
