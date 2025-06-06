(function(app) {
    'use strict';
    // This function will be called after DOMContentLoaded in main.js
    app.initDOMElements = function() {
        app.DOMElements = {
            sidebar: document.getElementById('sidebar'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            sidebarOverlay: document.getElementById('sidebarOverlay'),
            mainContent: document.getElementById('mainContent'),
            treeView: document.getElementById('treeView'),
            searchInput: document.getElementById('searchInput'),
            dashboardTitle: document.getElementById('dashboardTitle'),
            totalItemsCounter: document.getElementById('totalItemsCounter'),
            summaryCardsRow1: document.getElementById('summaryCardsRow1'),
            summaryCardsRow2: document.getElementById('summaryCardsRow2'),
            chartTabs: document.getElementById('chartTabs'),
            overviewChartsContainer: document.getElementById('overviewChartsContainer'),
            disciplineChartsContainer: document.getElementById('disciplineChartsContainer'),
            systemChartsContainer: document.getElementById('systemChartsContainer'),
            dataTableHead: document.getElementById('dataTableHead'),
            dataTableBody: document.getElementById('dataTableBody'),
            exportExcelBtn: document.getElementById('exportExcelBtn'),
            errorMessage: document.getElementById('errorMessage'),
            // Modal related DOM elements
            itemDetailsModalInstance: document.getElementById('itemDetailsModal'),
            itemDetailsModalLabel: document.getElementById('itemDetailsModalLabel'),
            itemDetailsTableBody: document.getElementById('itemDetailsTableBody'),
            noDetailsMessage: document.getElementById('noDetailsMessage'),
            exportDetailsExcelBtn: document.getElementById('exportDetailsExcelBtn'),
            loadingModalInstance: document.getElementById('loadingModal')
            // Note: itemDetailsModal (the bootstrap instance) is in app.state
        };
    };
})(window.SAPRA_APP);
