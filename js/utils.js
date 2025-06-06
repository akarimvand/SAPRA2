(function(app) {
    'use strict';
    app.utils = {
        destroyChart: function(chartInstance) {
            if (chartInstance) {
                chartInstance.destroy();
            }
        },
        _emptyStats: function() { // Keep leading underscore if it's meant to be "semi-private" within utils
            return { totalItems: 0, done: 0, pending: 0, punch: 0, hold: 0, remaining: 0 };
        }
    };
})(window.SAPRA_APP);
