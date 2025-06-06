(function(app) {
    'use strict';
    app.state = {
        processedData: { systemMap: {}, subSystemMap: {}, allRawData: [] },
        selectedView: { type: 'all', id: 'all', name: 'All Systems' },
        searchTerm: '',
        activeChartTab: 'Overview',
        aggregatedStats: { totalItems: 0, done: 0, pending: 0, punch: 0, hold: 0, remaining: 0 },
        detailedItemsData: [],
        punchItemsData: [],
        holdPointItemsData: [],
        displayedItemsInModal: [],
        currentModalDataType: null,
        chartInstances: {
            overview: null,
            issues: null,
            disciplines: {},
            systems: {}
        },
        bootstrapTabObjects: {},
        itemDetailsModal: null // This will be the Bootstrap Modal instance
    };
})(window.SAPRA_APP);
