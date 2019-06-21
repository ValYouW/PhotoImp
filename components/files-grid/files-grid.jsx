import React from 'react';
import PropTypes from 'prop-types';
import Grid from '../grid';

class FilesGrid extends React.Component {
	constructor(props) {
		super(props);

		this.fileColumns = [
			{
				key: 'name',
				name: 'Name',
				width: 150,
				sortable: true,
				resizable: true
			},
			{
				key: 'size',
				name: 'Size',
				width: 80,
				sortable: true,
				resizable: true,
				formatter: this.sizeFormatter
			},
			{
				key: 'lastModified',
				name: 'Date',
				sortable: true,
				resizable: true,
				formatter: this.dateFormatter
			},
			{
				key: 'dstPath',
				name: 'Download Path',
				resizable: true
			}
		];

		this.grid = null;
	}

	getSelection() {
		return this.grid.getSelection();
	}

	selectByDate(dates) {
		this.grid.clearSelection();
		var selection = this.props.files.map((f, i) => {return dates.indexOf(f.dateStr) >= 0 ? i : -1; }).filter(i => i >= 0);
		this.grid.setSelection(selection);
	}

	dateFormatter(iProps) {
		var val = iProps.value ? iProps.value.toLocaleString() : '';
		return <span>{val}</span>;
	}

	sizeFormatter(iProps) {
		var size = Number(iProps.value);
		var val;
		if (isNaN(size)) {
			val = '';
		} else {
			val = parseInt(size / 1024) + 'KB';
		}

		return <span>{val}</span>;
	}

	render() {
		return (
			<Grid
				ref={g => {this.grid = g;}}
				columns={this.fileColumns}
				rowHeight={30}
				rows={this.props.files}
				enableRowSelect={true}
				selectOnClick={true}
				showCheckbox={false}
			/>
		);
	}
}

FilesGrid.propTypes = {
	files: PropTypes.arrayOf(PropTypes.object)
};

FilesGrid.defaultProps = {
	files: []
};

export default FilesGrid;
