import React from 'react';
import ReactDOM from 'react-dom';
import Settings from '../../components/settings';

window.onload = function() {
	ReactDOM.render(<Settings/>, document.getElementById('settings'));
};
