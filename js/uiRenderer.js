(function(app) {
    'use strict';
    app.uiRenderer = {};

    app.uiRenderer.renderSummaryCards = function() {
        let row1HTML = '';
        let row2HTML = '';

        const originalCardsData = [
            { title: 'Completed', count: app.state.aggregatedStats.done, total: app.state.aggregatedStats.totalItems, baseClass: 'bg-white', icon: app.constants.ICONS.CheckCircle, iconWrapperBgClass: 'bg-success-subtle', iconColorClass: 'text-success', progressColor: 'success', countColor: 'text-success', titleColor: 'text-muted' },
            { title: 'Pending', count: app.state.aggregatedStats.pending, total: app.state.aggregatedStats.totalItems, baseClass: 'bg-white', icon: app.constants.ICONS.Clock, iconWrapperBgClass: 'bg-warning-subtle', iconColorClass: 'text-warning', progressColor: 'warning', countColor: 'text-warning', titleColor: 'text-muted' },
            { title: 'Remaining', count: app.state.aggregatedStats.remaining, total: app.state.aggregatedStats.totalItems, baseClass: 'bg-white', icon: app.constants.ICONS.ArrowRepeat, iconWrapperBgClass: 'bg-info-subtle', iconColorClass: 'text-info', progressColor: 'info', countColor: 'text-info', titleColor: 'text-muted' },
        ];

        originalCardsData.forEach(card => {
            const percentage = (card.total && card.total > 0 && card.count >= 0) ? Math.round((card.count / card.total) * 100) : 0;
            row1HTML += `
                <div class="col">
                    <section class="card summary-card shadow-sm ${card.baseClass}" aria-labelledby="summary-title-${card.title.toLowerCase()}">
                    <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 id="summary-title-${card.title.toLowerCase()}" class="card-title-custom fw-medium ${card.titleColor}">${card.title}</h6>
                                <span class="icon-wrapper ${card.iconWrapperBgClass} ${card.iconColorClass}" aria-hidden="true">${card.icon}</span>
                    </div>
                            <h3 class="count-display ${card.countColor} mb-1">${card.count.toLocaleString()}</h3>
                            ${card.total > 0 ? `
                            <div class="progress mt-2" style="height: 6px;" aria-label="${card.title} progress ${percentage}%">
                                <div class="progress-bar bg-${card.progressColor}" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
                            <p class="text-muted small mt-1 mb-0">${percentage}% of total items</p>
                            ` : '<div style="height: 28px;"></div>'}
            </div>
                    </section>
                </div>`;
        });

        row1HTML += `
            <div class="col">
                <section class="card summary-card shadow-sm bg-white" aria-labelledby="summary-title-issues">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 id="summary-title-issues" class="card-title-custom fw-medium text-muted">Issues</h6>
                            <span class="icon-wrapper bg-danger-subtle text-danger" aria-hidden="true">${app.constants.ICONS.ExclamationTriangle}</span>
                    </div>
                        <div class="row g-2">
                            <div class="col-6">
                                <p class="small text-muted mb-0">Punch</p>
                                <h4 class="text-danger fw-semibold">${app.state.aggregatedStats.punch.toLocaleString()}</h4>
                            </div>
                            <div class="col-6">
                                <p class="small text-muted mb-0">Hold Point</p>
                                <h4 class="text-danger fw-semibold">${app.state.aggregatedStats.hold.toLocaleString()}</h4>
                            </div>
                        </div>
                    </div>
                </section>
            </div>`;
        app.DOMElements.summaryCardsRow1.innerHTML = row1HTML;

        const formCardsData = [
            { title: 'FORM A', count: 0, gradientClass: 'gradient-form-a animated-gradient', icon: app.constants.ICONS.FileEarmarkText, desc: 'Submitted to Client for Mechanical Completion Approval' },
            { title: 'FORM B', count: 0, gradientClass: 'gradient-form-b animated-gradient', icon: app.constants.ICONS.FileEarmarkCheck, desc: 'Returned by Client with Pre-Commissioning Punches' },
            { title: 'FORM C', count: 0, gradientClass: 'gradient-form-c animated-gradient', icon: app.constants.ICONS.FileEarmarkMedical, desc: 'Precom Punches Cleared and Resubmitted for Approval' },
            { title: 'FORM D', count: 0, gradientClass: 'gradient-form-d animated-gradient', icon: app.constants.ICONS.FileEarmarkSpreadsheet, desc: 'Final Client Approval and Subsystem Handover' },
        ];
        formCardsData.forEach(card => {
            row2HTML += `
                <div class="col">
                    <section class="card summary-card shadow-sm ${card.gradientClass}" aria-labelledby="summary-title-${card.title.toLowerCase().replace(' ','-')}">
                        <div class="card-body text-white">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 id="summary-title-${card.title.toLowerCase().replace(' ','-')}" class="card-title-custom">${card.title}</h6>
                                <span class="icon-wrapper" style="background-color: rgba(0,0,0,0.2);" aria-hidden="true">${card.icon}</span>
                </div>
                            <h3 class="count-display mb-1">${card.count.toLocaleString()}</h3>
                            <small class="d-block mt-2 text-white" style="color: #fff !important;">${card.desc}</small>
            </div>
                    </section>
                </div>`;
        });
        app.DOMElements.summaryCardsRow2.innerHTML = row2HTML;
    };

    app.uiRenderer.renderDataTable = function() {
        const columns = [
            { header: 'System', accessor: 'system' }, { header: 'Subsystem', accessor: 'subsystem' },
            { header: 'Discipline', accessor: 'discipline' }, { header: 'Total Items', accessor: 'totalItems' },
            { header: 'Completed', accessor: 'completed' }, { header: 'Pending', accessor: 'pending' },
            { header: 'Punch', accessor: 'punch' }, { header: 'Hold Point', accessor: 'holdPoint' },
            { header: 'Status', accessor: 'statusPercent' },
        ];
        app.DOMElements.dataTableHead.innerHTML = columns.map(col => `<th scope="col">${col.header}</th>`).join('');

        const tableData = app.dataLoader._generateTableDataForView(app.state.selectedView, app.state.processedData, app.state.aggregatedStats.totalItems === 0);
        let bodyHTML = '';
        if (tableData.length === 0) {
            bodyHTML = `<tr><td colspan="${columns.length}" class="text-center py-5 text-muted">Please select a subsystem or system to view details, or no data matches the current filter.</td></tr>`;
        } else {
            tableData.forEach(row => {
                bodyHTML += '<tr>';
                columns.forEach((col, index) => {
                    let cellValue = row[col.accessor];
                     if (col.accessor === 'statusPercent') {
                        const badgeClass = row.statusPercent > 80 ? 'bg-success-subtle text-success' : row.statusPercent > 50 ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning';
                        cellValue = `<span class="badge ${badgeClass} rounded-pill">${row.statusPercent}%</span>`;
                    } else if (col.accessor === 'system') {
                        cellValue = row.system;
                    } else if (col.accessor === 'subsystem') {
                        cellValue = `${row.subsystem} - ${row.subsystemName}`;
                    } else {
                        cellValue = (typeof cellValue === 'number') ? cellValue.toLocaleString() : cellValue;
                    }
                    const cellTag = index === 0 ? `<th scope="row">${cellValue}</th>` : `<td>${cellValue}</td>`;
                    bodyHTML += cellTag;
                });
                bodyHTML += '</tr>';
            });
        }
        app.DOMElements.dataTableBody.innerHTML = bodyHTML;
    };

    app.uiRenderer.updateDashboardHeader = function() {
        let titleText = 'Dashboard';
        if (app.state.selectedView.type === 'system' && app.state.selectedView.id) {
            const systemName = app.state.processedData.systemMap[app.state.selectedView.id]?.name || app.state.selectedView.name;
            titleText = `System: ${app.state.selectedView.id} - ${systemName}`;
        } else if (app.state.selectedView.type === 'subsystem' && app.state.selectedView.id) {
            const systemName = app.state.processedData.systemMap[app.state.selectedView.parentId]?.name || app.state.selectedView.parentId;
            const subsystemName = app.state.processedData.subSystemMap[app.state.selectedView.id]?.name || app.state.selectedView.name;
            titleText = `System: ${app.state.selectedView.parentId} - ${systemName}<br>Subsystem: ${app.state.selectedView.id} - ${subsystemName}`;
        } else if (app.state.selectedView.type === 'all') {
            titleText = 'Dashboard';
        }
        app.DOMElements.dashboardTitle.innerHTML = titleText;
        app.DOMElements.totalItemsCounter.textContent = app.state.aggregatedStats.totalItems.toLocaleString();
    };

})(window.SAPRA_APP);
