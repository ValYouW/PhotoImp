import React from 'react';
import PropTypes from 'prop-types';

const ProgressBar = ({showProgress, progress}) => {
	var style = {
		display: showProgress ? 'block' : 'none',
		zIndex: 999,
		height: '5px',
		backgroundColor: 'red',
		width: parseInt(progress) + 'px'
	};

	return <div style={style} />;
};

ProgressBar.propTypes = {
	showProgress: PropTypes.bool,
	progress: PropTypes.number
};

export default ProgressBar;
