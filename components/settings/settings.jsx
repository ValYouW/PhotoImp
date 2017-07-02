import React from 'react';
import CONSTANTS from '../../common/constants.js';
import path from 'path';
import utils from '../../common/utils.js';
import {File} from '../../common/model.js';
import config from '../../common/config.js';
import fileFormatter from '../../common/file-formatter.js';
import {ipcRenderer} from 'electron';
import update from 'immutability-helper';

utils.injectCSS(document, 'components/settings/settings.css');

class Settings extends React.Component {
	constructor(props) {
		super(props);

		var fileTypes = config.get(config.Keys.FileTypes);

		// Make sure fileTypes is array and make it string for display
		if (!Array.isArray(fileTypes)) {fileTypes = [];}
		fileTypes = fileTypes.join(', ');

		this.formatters = fileFormatter.Formatters;
		this.sampleFile = new File('DSC_1234.jpg', 1000, new Date());

		this.state = {
			downloadDir: config.get(config.Keys.DownloadDirPattern),
			downloadFile: config.get(config.Keys.DownloadFilePattern),
			fileTypes
		};

		// Register to events from the main process
		ipcRenderer.on(CONSTANTS.IPC.DOWNLOAD_DIR_CHANGED, (sender, newDir) => this.onDownDirUpdate(newDir));

		this.onChooseDir = this.onChooseDir.bind(this);
		this.onSave = this.onSave.bind(this);
		this.onClose = this.onClose.bind(this);
		this.onFieldChange = this.onFieldChange.bind(this);
	}

	onChooseDir() {
		ipcRenderer.send(CONSTANTS.IPC.OPEN_DIR_DIALOG);
	};

	onDownDirUpdate(newDir) {
		if (!newDir) {return;}
		this.setState(update(this.state, {downloadDir: {$set: newDir}}));
	}

	onSave() {
		// Convert the comma separated list into array (trim spaces and ignore empty strings)
		var fileExts = this.state.fileTypes.split(',').map(s => s.trim()).filter(String);

		// File extensions can't contain space, if we have such case it means that the user forgot to separate
		// extensions with commas, show an error message
		var badExts = fileExts.filter(s => (s.indexOf(' ') >= 0));
		if (badExts.length > 0) {
			alert('Extensions must be separated by comma, check: ' + badExts.join(' / '));
			return;
		}

		config.set(config.Keys.DownloadDirPattern, this.state.downloadDir);
		config.set(config.Keys.DownloadFilePattern, this.state.downloadFile);
		config.set(config.Keys.FileTypes, fileExts);
		config.save();
		this.onClose();
	}

	onClose() {
		window.close();
	}

	onFieldChange(event) {
		var target = event.target;
		var value = target.value;
		var name = target.name;
		this.setState(update(this.state, {[name]: {$set: value}}));
	}

	formatFile(file, dirPattern, filePattern) {
		if (!(file instanceof File)) {return '';}
		dirPattern = dirPattern || '';
		filePattern = filePattern || '';
		var dst = path.join(dirPattern, filePattern);
		return fileFormatter.format(dst, file);
	}

	renderFormatter() {
		return Object.keys(this.formatters).map(f => {
			return (
				<div key={f}>
					{this.formatters[f].pattern} - {this.formatters[f].desc}
				</div>
			);
		});
	}

	render() {
		return (
			<div className="settings">
				<label className="title">Supported File Types:</label>
				<div className="inputPair row">
					<input className="grayedTextbox" type="text" name="fileTypes" value={this.state.fileTypes} onChange={this.onFieldChange} />
				</div>
				<label className="title">Download directory:</label>
				<div className="inputPair row">
					<input type="text" name="downloadDir" value={this.state.downloadDir} onChange={this.onFieldChange} />
					<button onClick={this.onChooseDir}>...</button>
				</div>
				<div className="inputPair row">
					<label className="title">Filename:</label>
					<input type="text" name="downloadFile" value={this.state.downloadFile} onChange={this.onFieldChange} />
				</div>
				<div className="title">Supported tokens:</div>
				<div className="row">
					{this.renderFormatter()}
				</div>
				<div className="row">
					<div className="title">Example:</div>
					<span className="grayedTextbox">{this.formatFile(this.sampleFile, this.state.downloadDir, this.state.downloadFile)}</span>
				</div>
				<div className="toolbar">
					<button onClick={this.onSave}>Save</button>
					<button onClick={this.onClose}>Cancel</button>
				</div>
			</div>
		);
	}
}

export default Settings;
