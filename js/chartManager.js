(function(app) {
    'use strict';
    app.chartManager = {};

    app.chartManager.renderCharts = function() {
        app.utils.destroyChart(app.state.chartInstances.overview);
        app.utils.destroyChart(app.state.chartInstances.issues);
        Object.values(app.state.chartInstances.disciplines).forEach(app.utils.destroyChart);
        app.state.chartInstances.disciplines = {};
        Object.values(app.state.chartInstances.systems).forEach(app.utils.destroyChart);
        app.state.chartInstances.systems = {};

        const activeTabPane = document.querySelector(`.tab-pane.active[role="tabpanel"]`);

        if (activeTabPane && activeTabPane.id === 'overviewChartsContainer') {
            app.chartManager.renderOverviewCharts();
        } else if (activeTabPane && activeTabPane.id === 'disciplineChartsContainer') {
            app.chartManager.renderDisciplineCharts();
        } else if (activeTabPane && activeTabPane.id === 'systemChartsContainer') {
            app.chartManager.renderSystemSubsystemCharts();
        }
    };

    app.chartManager.renderOverviewCharts = function() {
        const overviewCanvas = app.DOMElements.overviewChartsContainer.querySelector('canvas'); // More robust selection
        const overviewParent = overviewCanvas.parentElement;
        overviewParent.innerHTML = '<canvas id="overviewChart" role="img" aria-label="General status doughnut chart"></canvas>';
        const overviewCtx = overviewParent.querySelector('#overviewChart').getContext('2d');


        const overviewChartData = {
            labels: ['Completed', 'Pending', 'Remaining'],
            datasets: [{
                label: 'General Status',
                data: [app.state.aggregatedStats.done, app.state.aggregatedStats.pending, app.state.aggregatedStats.remaining].filter(v => v >=0),
                backgroundColor: [app.constants.COLORS_STATUS_CHARTJS.done, app.constants.COLORS_STATUS_CHARTJS.pending, app.constants.COLORS_STATUS_CHARTJS.remaining],
                hoverOffset: 4
            }]
        };
        if (app.state.aggregatedStats.totalItems === 0 || (app.state.aggregatedStats.done === 0 && app.state.aggregatedStats.pending === 0 && app.state.aggregatedStats.remaining === 0)) {
             overviewParent.insertAdjacentHTML('beforeend', '<div class="text-center text-muted small p-5">No data to display for General Status.</div>');
        } else {
            app.state.chartInstances.overview = new Chart(overviewCtx, { type: 'doughnut', data: overviewChartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.formattedValue} (${Math.round(context.parsed / app.state.aggregatedStats.totalItems * 100)}%)`}}}} });
        }

        const issuesCanvas = app.DOMElements.overviewChartsContainer.querySelector('#issuesChart'); // More robust selection
        const issuesParent = issuesCanvas.parentElement;
        issuesParent.innerHTML = '<canvas id="issuesChart" role="img" aria-label="Issue distribution pie chart"></canvas>';
        const issuesCtx = issuesParent.querySelector('#issuesChart').getContext('2d');

        const issuesChartData = {
            labels: ['Punch', 'Hold Point'],
            datasets: [{
                label: 'Issues Distribution',
                data: [app.state.aggregatedStats.punch, app.state.aggregatedStats.hold].filter(v=>v>=0),
                backgroundColor: [app.constants.COLORS_ISSUES_CHARTJS.punch, app.constants.COLORS_ISSUES_CHARTJS.hold],
                hoverOffset: 4
            }]
        };
         if (app.state.aggregatedStats.punch === 0 && app.state.aggregatedStats.hold === 0) {
              issuesParent.insertAdjacentHTML('beforeend', '<div class="text-center text-muted small p-5">No issues data to display.</div>');
        } else {
            const totalIssues = app.state.aggregatedStats.punch + app.state.aggregatedStats.hold;
            app.state.chartInstances.issues = new Chart(issuesCtx, { type: 'pie', data: issuesChartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.formattedValue} (${totalIssues > 0 ? Math.round(context.parsed / totalIssues * 100) : 0}%)`}}}} });
        }
    };

    app.chartManager.renderDisciplineCharts = function() {
        const container = app.DOMElements.disciplineChartsContainer;
        container.innerHTML = '';

        if (app.state.selectedView.type !== 'subsystem' || !app.state.selectedView.id) {
            container.innerHTML = `<div class="col-12 text-center py-5 text-muted" role="status">${app.constants.ICONS.PieChartIcon}<p class="mt-2">Select a subsystem to view discipline details.</p></div>`;
            return;
        }
        const subSystem = app.state.processedData.subSystemMap[app.state.selectedView.id];
        if (!subSystem || Object.keys(subSystem.disciplines).length === 0) {
            container.innerHTML = `<div class="col-12 text-center py-5 text-muted" role="status">${app.constants.ICONS.PieChartIcon}<p class="mt-2">No discipline data available for this subsystem.</p></div>`;
            return;
        }

        const row = document.createElement('div');
        row.className = 'row g-3';

        Object.entries(subSystem.disciplines).forEach(([name, data]) => {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 col-lg-4 col-xl-3';
            const chartId = `disciplineChart-${name.replace(/\s+/g, '-')}`;
            const chartLabel = `${name} status for subsystem ${app.state.selectedView.id}`;
            col.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body text-center">
                        <h6 class="text-muted small fw-medium mb-1">${name}</h6>
                        <p class="text-muted small mb-2">${data.total.toLocaleString()} items</p>
                        <div class="chart-container" style="height: 200px;"><canvas id="${chartId}" role="img" aria-label="${chartLabel}"></canvas></div>
                    </div>
                </div>`;
            row.appendChild(col);

            if (data.total > 0) {
                setTimeout(() => {
                    const canvasElement = document.getElementById(chartId);
                    if (!canvasElement) return; // Guard against element not found
                    const ctx = canvasElement.getContext('2d');
                    const chartData = {
                        labels: ['Completed', 'Pending', 'Remaining'],
                        datasets: [{ label: name, data: [data.done, data.pending, data.remaining], backgroundColor: [app.constants.COLORS_STATUS_CHARTJS.done, app.constants.COLORS_STATUS_CHARTJS.pending, app.constants.COLORS_STATUS_CHARTJS.remaining] }]
                    };
                    app.state.chartInstances.disciplines[name] = new Chart(ctx, { type: 'doughnut', data: chartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth:10, font: {size: 10}} }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.formattedValue} (${data.total > 0 ? Math.round(context.parsed / data.total * 100) : 0}%)`}}} } });
                }, 0);
            } else {
                 setTimeout(() => {
                    const chartContainer = document.getElementById(chartId)?.parentElement;
                    if (chartContainer) chartContainer.innerHTML = '<div class="text-center text-muted small p-5" style="height:100%; display:flex; align-items:center; justify-content:center;">No data.</div>';
                },0);
            }
        });
        container.appendChild(row);
    };

    app.chartManager.renderSystemSubsystemCharts = function() {
        const container = app.DOMElements.systemChartsContainer;
        container.innerHTML = '';
        let itemsToDisplay = [];

        if (app.state.selectedView.type === 'all') {
            itemsToDisplay = Object.values(app.state.processedData.systemMap).map(system => ({
                id: system.id,
                name: `${system.id} - ${system.name}`,
                data: app.dataLoader._aggregateStatsForSystem(system.id, app.state.processedData.systemMap, app.state.processedData.subSystemMap) // Assuming this is exposed or local
            }));
        } else if (app.state.selectedView.type === 'system' && app.state.selectedView.id) {
            const system = app.state.processedData.systemMap[app.state.selectedView.id];
            if (system) {
                itemsToDisplay = system.subs.map(subRef => {
                    const subSystem = app.state.processedData.subSystemMap[subRef.id];
                    return {
                        id: subRef.id,
                        name: `${subRef.id} - ${subSystem?.name || 'N/A'}`,
                        data: app.dataLoader._aggregateStatsForSubSystem(subRef.id, app.state.processedData.subSystemMap) // Assuming this is exposed or local
                    };
                });
            }
        } else if (app.state.selectedView.type === 'subsystem' && app.state.selectedView.id) {
            const subSystem = app.state.processedData.subSystemMap[app.state.selectedView.id];
             if (subSystem) {
                itemsToDisplay = [{
                    id: subSystem.id, name: `${subSystem.id} - ${subSystem.name}`,
                    data: app.dataLoader._aggregateStatsForSubSystem(subSystem.id, app.state.processedData.subSystemMap) // Assuming this is exposed or local
                }];
             }
        }

        itemsToDisplay = itemsToDisplay.filter(item => item.data.totalItems > 0);


        if (itemsToDisplay.length === 0) {
            container.innerHTML = `<div class="col-12 text-center py-5 text-muted" role="status">${app.constants.ICONS.PieChartIcon}<p class="mt-2">No systems or subsystems with data to display for this view.</p></div>`;
            return;
        }

        const row = document.createElement('div');
        row.className = 'row g-3';

        itemsToDisplay.forEach(item => {
            item.data.remaining = Math.max(0, item.data.totalItems - item.data.done - item.data.pending);

            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 col-lg-4 col-xl-3';
            const chartId = `systemSubChart-${item.id.replace(/\s+/g, '-|')}`; // Ensure unique IDs
            const chartLabel = `Status for ${item.name}`;
             col.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body text-center">
                        <h6 class="text-muted small fw-medium mb-1 text-truncate" title="${item.name}">${item.name}</h6>
                        <p class="text-muted small mb-2">${item.data.totalItems.toLocaleString()} items</p>
                        <div class="chart-container" style="height: 200px;"><canvas id="${chartId}" role="img" aria-label="${chartLabel}"></canvas></div>
                    </div>
                </div>`;
            row.appendChild(col);

            if (item.data.totalItems > 0) {
                 setTimeout(() => {
                    const canvasElement = document.getElementById(chartId);
                    if(!canvasElement) return;
                    const ctx = canvasElement.getContext('2d');
                    const chartData = {
                        labels: ['Completed', 'Pending', 'Remaining'],
                        datasets: [{ label: item.name, data: [item.data.done, item.data.pending, item.data.remaining], backgroundColor: [app.constants.COLORS_STATUS_CHARTJS.done, app.constants.COLORS_STATUS_CHARTJS.pending, app.constants.COLORS_STATUS_CHARTJS.remaining] }]
                    };
                    app.state.chartInstances.systems[item.id] = new Chart(ctx, { type: 'doughnut', data: chartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth:10, font: {size: 10}} }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.formattedValue} (${item.data.totalItems > 0 ? Math.round(context.parsed / item.data.totalItems * 100) : 0}%)`}} }} });
                }, 0);
            } else {
                setTimeout(() => {
                    const chartContainer = document.getElementById(chartId)?.parentElement;
                    if (chartContainer) chartContainer.innerHTML = '<div class="text-center text-muted small p-5" style="height:100%; display:flex; align-items:center; justify-content:center;">No data.</div>';
                },0);
            }
        });
         container.appendChild(row);
    };

    // This function might be redundant if Bootstrap handles active states automatically via data-bs-toggle
    // However, it's kept for explicit control if needed.
    app.chartManager.updateActiveTabUI = function() {
        const buttons = app.DOMElements.chartTabs.querySelectorAll('button');
        buttons.forEach(btn => {
            const isActive = btn.dataset.tabName === app.state.activeChartTab;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive);

            const targetPaneId = btn.dataset.bsTarget;
            if (targetPaneId) {
                const targetPane = document.querySelector(targetPaneId);
                if (targetPane) {
                    targetPane.classList.toggle('show', isActive);
                    targetPane.classList.toggle('active', isActive);
                }
            }
        });
    };

})(window.SAPRA_APP);
