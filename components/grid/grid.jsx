import React from 'react';
import PropTypes from 'prop-types';
import ReactDataGrid from 'react-data-grid';

import update from 'immutability-helper';
import utils from '../../common/utils.js';

utils.injectCSS(document, 'components/grid/grid.css');

// The idea of this component is just fix style issues of react-data-grid
class Grid extends React.Component {
	constructor(props) {
		super(props);
		this.grid = null;

		this.state = {
			rows: this.props.rows,
			selection: []
		};
	}

	scrollToRow(idx) {
		var top = this.grid.getRowOffsetHeight() * idx;
		var gridCanvas = this.grid.getDataGridDOMNode().querySelector('.react-grid-Canvas');
		gridCanvas.scrollTop = top;
	}

	getSelection() {
		return this.state.selection.map(i => this.state.rows[i]);
	}

	clearSelection() {
		this.setState(update(this.state, {selection: {$set: []}}));
	}

	setSelection(selection) {
		this.setState(update(this.state, {selection: {$set: selection}}));
	}

	select(rows) {
		var selection = this.props.allowMultiSelect ? this.state.selection.concat(rows) : rows.slice(0, 1);
		this.setState(update(this.state, {selection: {$set: selection}}), () => this.props.selectionChanged(this.getSelection()));
	}

	deselect(rows) {
		this.setState(update(this.state, {selection: {$set: this.state.selection.filter(i => rows.indexOf(i) === -1)}}), () => this.props.selectionChanged(this.getSelection()));
	}

	onRowsSelected(rows) {
		this.select(rows.map(r => r.rowIdx));
	}

	onRowsDeselected(rows) {
		this.deselect(rows.map(r => r.rowIdx));
	}

	onRowClick(rowIdx) {
		if (rowIdx < 0) {return;}
		var currIdx = this.state.selection.findIndex(i => i === rowIdx);
		if (currIdx < 0) {
			this.select([rowIdx]);
		} else {
			this.deselect([rowIdx]);
		}
	}

	onGridSort(sortColumn, sortDirection) {
		if (sortDirection === 'NONE') {return;}

		function comparer(a, b) {
			if (sortDirection === 'ASC') {
				return (a[sortColumn] > b[sortColumn]) ? 1 : -1;
			} else if (sortDirection === 'DESC') {
				return (a[sortColumn] < b[sortColumn]) ? 1 : -1;
			}
		}

		var rows = this.state.rows.sort(comparer);
		this.setState(update(this.state, {rows: {$set: rows}}));
	}

	componentWillReceiveProps(np) {
		if (np.rows !== this.state.rows) {
			this.setState(update(this.state, {rows: {$set: np.rows}}));
		}
	}

	render() {
		// eslint-disable-next-line no-unused-vars
		var {rows, enableRowSelect, showCheckbox, selectOnClick, allowMultiSelect, ...props} = this.props;
		var extraProps = {
			rowGetter: idx => this.state.rows[idx],
			rowsCount: this.state.rows.length,
			onGridSort: this.onGridSort.bind(this)
		};

		if (enableRowSelect) {
			extraProps.rowSelection = {
				selectBy: {
					indexes: this.state.selection
				},
				showCheckbox: showCheckbox,
				onRowsSelected: this.onRowsSelected.bind(this),
				onRowsDeselected: this.onRowsDeselected.bind(this)
			};

			if (!allowMultiSelect) {
				extraProps.enableRowSelect = 'single';
			}

			if (selectOnClick) {
				extraProps.onRowClick = this.onRowClick.bind(this);
			}
		}

		return (
			<div className="grid">
				<ReactDataGrid
					ref={(g) => {this.grid = g;}}
					{...props}
					{...extraProps}
				/>
			</div>
		);
	}
}

Grid.propTypes = {
	rows: PropTypes.array,
	enableRowSelect: PropTypes.bool,
	showCheckbox: PropTypes.bool,
	selectOnClick: PropTypes.bool,
	allowMultiSelect: PropTypes.bool,
	selectionChanged: PropTypes.func
};

function nop() {}
Grid.defaultProps = {
	enableRowSelect: false,
	showCheckbox: true,
	selectOnClick: false,
	allowMultiSelect: true,
	selectionChanged: nop
};

export default Grid;
