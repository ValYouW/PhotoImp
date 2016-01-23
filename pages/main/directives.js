var angular = require('angular');

var mainApp = angular.module('mainWinApp');

/**
 * A simple progress-bar directive
 */
mainApp.directive('simpleProgress', ['$document', function($document) {
	return {
		// Replace the directive
		replace: true,
		// Only use as a element
		restrict: 'E',
		scope: {
			options: '='
		},
		link: function (scope) {
			// Add the progress-bar div as first element of the body
			var body = $document.find('body');
			var elem = angular.element('<div class="progress hidden"></div>');
			body.prepend(elem);

			var visible = false;
			if (typeof scope.options === 'object' && typeof scope.options.onRegisterApi === 'function') {
				// Expose the progress-bar api
				scope.options.onRegisterApi({
					set: function(pct) {
						var n = parseInt(pct);
						if (isNaN(n)) {return;}
						if (n === 0) {return;}

						// Make sure we are visible
						if (!visible) {
							elem.toggleClass('visible hidden');
							visible = true;
						}

						// Set the progress-bar div width
						elem.css('width', pct + '%');
					},
					complete: function() {
						// Change the width to 100% and hide the progress-bar div
						elem.css('width', '100%');
						elem.toggleClass('visible hidden');
						visible = false;
					}
				});
			}
		}
	};
}]);