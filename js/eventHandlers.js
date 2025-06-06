(function(app) {
    'use strict';
    app.eventHandlers = {};

    app.eventHandlers.initBootstrapTabs = function() {
        // Ensure DOMElements is initialized
        if (!app.DOMElements || !app.DOMElements.chartTabs) {
            console.error("DOMElements not fully initialized for initBootstrapTabs.");
            return;
        }
        app.DOMElements.chartTabs.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tabEl => {
             app.state.bootstrapTabObjects[tabEl.id] = new bootstrap.Tab(tabEl);
        });
    };

    app.eventHandlers.initEventListeners = function() {
        // Ensure DOMElements is initialized
        if (!app.DOMElements) {
            console.error("DOMElements not initialized for initEventListeners.");
            return;
        }

        app.DOMElements.sidebarToggle.addEventListener('click', () => {
            const isOpen = app.DOMElements.sidebar.classList.contains('open');
            app.DOMElements.sidebar.classList.toggle('open');
            app.DOMElements.mainContent.classList.toggle('sidebar-open');
            app.DOMElements.sidebarOverlay.style.display = app.DOMElements.sidebar.classList.contains('open') ? 'block' : 'none';
            app.DOMElements.sidebarToggle.setAttribute('aria-expanded', String(!isOpen));
        });

        app.DOMElements.sidebarOverlay.addEventListener('click', () => {
            app.DOMElements.sidebar.classList.remove('open');
            app.DOMElements.mainContent.classList.remove('sidebar-open');
            app.DOMElements.sidebarOverlay.style.display = 'none';
            app.DOMElements.sidebarToggle.setAttribute('aria-expanded', 'false');
        });

        app.DOMElements.searchInput.addEventListener('input', (e) => {
            app.state.searchTerm = e.target.value.toLowerCase();
            app.sidebarManager.renderSidebar(); // Call namespaced function
        });
        app.DOMElements.searchInput.setAttribute('aria-label', 'Search system or subsystem');

        app.DOMElements.exportExcelBtn.addEventListener('click', app.exportManager.handleExport); // Call namespaced function

        app.DOMElements.chartTabs.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-bs-toggle="tab"]');
            if (button) {
                const tabName = button.dataset.tabName;
                if (tabName && tabName !== app.state.activeChartTab) {
                    app.state.activeChartTab = tabName;
                    app.chartManager.renderCharts(); // Call namespaced function
                }
            }
        });

        // Global click listener for details (summary cards, table cells)
        // This relies on app.modalManager.handleDetailsClick being correctly defined.
        document.addEventListener('click', function(e) {
            if (app.modalManager && app.modalManager.handleDetailsClick) {
                 // Check if the click is on the sidebar toggle, search input, or export buttons,
                 // or within the modal itself, or on a tree node chevron. If so, don't trigger handleDetailsClick.
                if (e.target.closest('#sidebarToggle') ||
                    e.target.closest('#searchInput') ||
                    e.target.closest('#exportExcelBtn') ||
                    e.target.closest('#exportDetailsExcelBtn') ||
                    e.target.closest('.modal-content') ||
                    e.target.closest('.chevron-toggle')) {
                    return;
                }
                // Also, if the click is on a tab button, don't trigger details.
                if (e.target.closest('button[data-bs-toggle="tab"]')) {
                    return;
                }

                app.modalManager.handleDetailsClick(e);
            }
        });

        // Click listener for the total items counter badge
        const totalItemsBadge = app.DOMElements.totalItemsCounter.closest('span.badge');
        if (totalItemsBadge) {
            totalItemsBadge.style.cursor = 'pointer';
            totalItemsBadge.addEventListener('click', () => {
                 if (app.state.detailedItemsData && app.state.detailedItemsData.length > 0) {
                     const pseudoEvent = { target: totalItemsBadge }; // Create a pseudo-event
                     app.modalManager.handleDetailsClick(pseudoEvent); // Call namespaced function
                } else {
                    alert("Detailed item data not loaded yet.");
                }
            });
        }
    };

})(window.SAPRA_APP);
