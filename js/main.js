(function(app) {
    'use strict';
    app.main = {};

    app.main.updateView = function() {
        // Ensure necessary data and DOMElements are available
        if (!app.state || !app.DOMElements || !app.dataLoader || !app.uiRenderer || !app.chartManager || !app.sidebarManager) {
            console.error("One or more APP modules are not available for updateView.");
            return;
        }

        // It's better if _aggregateStatsForView is consistently called when selectedView changes (e.g., in handleNodeSelect)
        // or if loadAndProcessData sets the initial aggregatedStats correctly.
        // Forcing recalculation here might be redundant if already handled.
        // However, if it's intended as a catch-all, ensure `_aggregateStatsForView` is correctly exposed.
        // app.state.aggregatedStats = app.dataLoader._aggregateStatsForView(app.state.selectedView, app.state.processedData.systemMap, app.state.processedData.subSystemMap);
        // This line is commented out assuming aggregatedStats is updated by the functions that change the view (loadAndProcessData, handleNodeSelect)

        app.uiRenderer.updateDashboardHeader();
        // app.DOMElements.totalItemsCounter.textContent = app.state.aggregatedStats.totalItems.toLocaleString(); // This is part of updateDashboardHeader

        app.uiRenderer.renderSummaryCards();
        app.chartManager.renderCharts();
        app.uiRenderer.renderDataTable();
        app.sidebarManager.renderSidebar();
    };

    document.addEventListener('DOMContentLoaded', () => {
        // Initialize DOMElements first as other modules might depend on it
        if (app.initDOMElements) {
            app.initDOMElements();
        } else {
            console.error("app.initDOMElements is not defined. Ensure domElements.js is loaded correctly.");
            return;
        }

        // Initialize other modules that set up event listeners or require setup
        if (app.eventHandlers && app.eventHandlers.initEventListeners && app.eventHandlers.initBootstrapTabs) {
            app.eventHandlers.initEventListeners();
            app.eventHandlers.initBootstrapTabs();
        } else {
            console.error("app.eventHandlers or its functions are not defined.");
        }

        if (app.modalManager && app.modalManager.initModals) {
            app.modalManager.initModals();
        } else {
            console.error("app.modalManager.initModals is not defined.");
        }

        // Load initial data
        if (app.dataLoader && app.dataLoader.loadAndProcessData) {
            app.dataLoader.loadAndProcessData(); // This will call updateView once data is processed
        } else {
            console.error("app.dataLoader.loadAndProcessData is not defined.");
        }

        // Set initial ARIA attribute for sidebar toggle
        if (app.DOMElements && app.DOMElements.sidebarToggle) {
             app.DOMElements.sidebarToggle.setAttribute('aria-expanded', 'false');
        }
    });

})(window.SAPRA_APP);
