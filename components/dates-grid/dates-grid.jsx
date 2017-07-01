import React from 'react';
import PropTypes from 'prop-types';
import Grid from '../grid';

class FilesGrid extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			selection: []
		};

		this.fileColumns = [
			{
				key: 'lastModified',
				name: 'Last Modified',
				resizable: false,
				sortable: true,
				formatter: this.dateFormatter
			}
		];

		this.onSelectionChanged = this.onSelectionChanged.bind(this);
	}

	dateFormatter(iProps) {
		var val = iProps.value ? iProps.value.toLocaleDateString() : '';
		return <span>{val}</span>;
	}

	onSelectionChanged(idxs) {
		var selection = idxs.map(i => this.props.dates[i].dateStr);
		this.props.selectionChanged(selection);
	}

	render() {
		return (
			<Grid
				columns={this.fileColumns}
				rowHeight={30}
				rows={this.props.dates}
				enableRowSelect={true}
                selectOnClick={true}
                showCheckbox={false}
                selectionChanged={this.onSelectionChanged}
			/>
		);
	}
}

FilesGrid.propTypes = {
	dates: PropTypes.arrayOf(PropTypes.object),
	selectionChanged: PropTypes.func
};

FilesGrid.defaultProps = {
	dates: [],
	selectionChanged: function nop() {}
};

export default FilesGrid;
