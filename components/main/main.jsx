import React from 'react';
import {Component} from 'react';
import FilesGrid from '../files-grid';
import DatesGrid from '../dates-grid';

import {ipcRenderer} from 'electron';
import CONSTANTS from '../../common/constants.js';
import {File} from '../../common/model.js';

class Main extends Component {
	constructor(props) {
		super(props);

		this.state = {
			files: [],
			fileDates: [],
			downloading: false,
			currFile: ''
		};

		ipcRenderer.on(CONSTANTS.IPC.LOAD_FILE_LIST, (sender, files) => this.onLoadFiles(files));

		this.filesGrid = null;
		this.onDownloadClick = this.onDownloadClick.bind(this);
		this.onDatesSelected = this.onDatesSelected.bind(this);
	}

	onLoadFiles(files) {
		files = File.deserializeArray(files) || [];
		var distinctDates = {}; // Helper for creating a distinct list of dates
		for (var i = 0; i < files.length; ++i) {
			var f = files[i];

			// Add a "date" property to the file, will be used when we would like to select all files of a specific date
			f.dateStr = f.lastModified.toLocaleDateString();

			if (!distinctDates[f.dateStr]) {
				// Add a date also to this object (for the datesGrid), will be used to select all files of this date
				distinctDates[f.dateStr] = {lastModified: f.lastModified, dateStr: f.dateStr};
			}
		}

		// Convert the dates dictionary into array of objects (for the grid).
		var fileDates = Object.keys(distinctDates).map(date => {
			return distinctDates[date];
		});

		this.setState({files, fileDates});
	}

	onDatesSelected(dates) {
		this.filesGrid.selectByDate(dates);
	}

	onDownloadClick() {

	}

	render() {
		return (
			<div className="main">
				<div className="gridsWrapper">
					<div className="datesGrid" >
						<DatesGrid dates={this.state.fileDates} selectionChanged={this.onDatesSelected}/>
					</div>
					<div className="filesGrid">
						<FilesGrid ref={fg => {this.filesGrid = fg;}} files={this.state.files} />
					</div>
				</div>
				<div className="statusWrapper">
					<button onClick={this.onDownloadClick} disabled={this.state.files.length < 1}>{this.state.downloading ? 'Abort' : 'Download'}</button>
					<span>{this.state.downloading ? `Copying: ${this.state.currFile}` : `${this.state.files.length} files found`}</span>
				</div>
			</div>
		);
	}
}

export default Main;
