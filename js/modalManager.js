(function(app) {
    'use strict';
    app.modalManager = {};

    // Local helper functions (populateDetailsModal, filterDetailedItems, etc. - keep as is from previous step)
    function populateDetailsModal(items, context, dataType) {
        const tbody = app.DOMElements.itemDetailsTableBody;
        const noDetailsMessage = app.DOMElements.noDetailsMessage;
        tbody.innerHTML = '';
        app.state.displayedItemsInModal = items;
        app.state.currentModalDataType = dataType;

        const theadRow = app.DOMElements.itemDetailsModalInstance.querySelector('thead tr');
        if (dataType === 'items') {
            theadRow.innerHTML = `
                <th scope="col">#</th>
                <th scope="col">Subsystem</th>
                <th scope="col">Discipline</th>
                <th scope="col">Tag No</th>
                <th scope="col">Type</th>
                <th scope="col">Description</th>
                <th scope="col">Status</th>
            `;
        } else if (dataType === 'punch') {
            theadRow.innerHTML = `
                <th scope="col">#</th>
                <th scope="col">Subsystem</th>
                <th scope="col">Discipline</th>
                <th scope="col">Tag No</th>
                <th scope="col">Type</th>
                <th scope="col">Category</th>
                <th scope="col">Description</th>
            `;
        } else if (dataType === 'hold') {
            theadRow.innerHTML = `
                <th scope="col">#</th>
                <th scope="col">Subsystem</th>
                <th scope="col">Discipline</th>
                <th scope="col">Tag No</th>
                <th scope="col">Type</th>
                <th scope="col">HP Priority</th>
                <th scope="col">HP Description</th>
                <th scope="col">HP Location</th>
            `;
        }

        if (items.length === 0) {
            noDetailsMessage.style.display = 'block';
        } else {
            noDetailsMessage.style.display = 'none';
            items.forEach((item, index) => {
                const row = document.createElement('tr');
                let rowContent = '';
                let rowClass = '';

                if (dataType === 'items') {
                    rowContent = `
                        <td>${index + 1}</td>
                        <td>${item.subsystem}</td>
                        <td>${item.discipline}</td>
                        <td>${item.tagNo}</td>
                        <td>${item.typeCode}</td>
                        <td>${item.description}</td>
                        <td>${item.status}</td>
                    `;
                } else if (dataType === 'punch') {
                    switch (item.punchCategory?.toLowerCase()) {
                        case 'a': rowClass = 'table-danger'; break;
                        case 'b': rowClass = 'table-info'; break;
                        case 'c': rowClass = 'table-success'; break;
                        default: rowClass = '';
                    }
                    rowContent = `
                        <td>${index + 1}</td>
                        <td>${item.subsystem}</td>
                        <td>${item.discipline}</td>
                        <td>${item.tagNo}</td>
                        <td>${item.typeCode || 'N/A'}</td>
                        <td>${item.punchCategory}</td>
                        <td>${item.punchDescription}</td>
                    `;
                } else if (dataType === 'hold') {
                    rowContent = `
                        <td>${index + 1}</td>
                        <td>${item.subsystem}</td>
                        <td>${item.discipline}</td>
                        <td>${item.tagNo}</td>
                        <td>${item.typeCode || 'N/A'}</td>
                        <td>${item.hpPriority || 'N/A'}</td>
                        <td>${item.hpDescription || 'N/A'}</td>
                        <td>${item.hpLocation || 'N/A'}</td>
                    `;
                }
                row.innerHTML = rowContent;
                if (rowClass) row.classList.add(rowClass);
                tbody.appendChild(row);
            });
        }
    }

    function filterDetailedItems(context) {
        let filtered = app.state.detailedItemsData;
        let modalTitle = 'Item Details';

        if (context.type === 'summary') {
            if (app.state.selectedView.type === 'system' && app.state.selectedView.id) {
                const subSystemIds = app.state.processedData.systemMap[app.state.selectedView.id]?.subs.map(sub => sub.id.toLowerCase()) || [];
                filtered = filtered.filter(item => item.subsystem?.toLowerCase() && subSystemIds.includes(item.subsystem.toLowerCase()));
                modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'PENDING' ? 'Pending' : context.status === 'TOTAL' ? 'Total' : 'Remaining'} Items in System: ${app.state.selectedView.name}`;
            } else if (app.state.selectedView.type === 'subsystem' && app.state.selectedView.id) {
                filtered = filtered.filter(item => item.subsystem?.toLowerCase() === app.state.selectedView.id.toLowerCase());
                modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'PENDING' ? 'Pending' : context.status === 'TOTAL' ? 'Total' : 'Remaining'} Items in Subsystem: ${app.state.selectedView.name}`;
            } else {
                modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'PENDING' ? 'Pending' : context.status === 'TOTAL' ? 'Total' : 'Remaining'} Items (All Systems)`;
            }

            if (context.status !== 'TOTAL') {
                if (context.status === 'OTHER') {
                    filtered = filtered.filter(item => !item.status || (item.status.toLowerCase() !== 'done' && item.status.toLowerCase() !== 'pending'));
                } else if (context.status === 'HOLD') {
                    filtered = filtered.filter(item => item.status && item.status.toLowerCase() === 'hold');
                } else {
                    filtered = filtered.filter(item => item.status && item.status.toLowerCase() === context.status.toLowerCase());
                }
            }
        } else if (context.type === 'table') {
            const rowData = context.rowData;
            const clickedSubsystem = rowData.subsystem.split(' - ')[0].toLowerCase();
            const clickedDiscipline = rowData.discipline.toLowerCase();

            filtered = filtered.filter(item =>
                item.subsystem?.toLowerCase() === clickedSubsystem &&
                item.discipline?.toLowerCase() === clickedDiscipline
            );

            if (context.status !== 'TOTAL') {
                if (context.status === 'OTHER') {
                    filtered = filtered.filter(item => !item.status || (item.status.toLowerCase() !== 'done' && item.status.toLowerCase() !== 'pending'));
                } else if (context.status === 'HOLD') {
                     filtered = filtered.filter(item => item.status && item.status.toLowerCase() === 'hold');
                } else {
                    filtered = filtered.filter(item => item.status && item.status.toLowerCase() === context.status.toLowerCase());
                }
            }
            modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'TOTAL' ? 'Total' : context.status} Items in ${rowData.subsystem.split(' - ')[0]} / ${rowData.discipline}`;
        }
        app.DOMElements.itemDetailsModalLabel.textContent = modalTitle;
        return filtered;
    }

    function filterPunchItems(context) {
        let filtered = app.state.punchItemsData;
        let modalTitle = 'Punch Details';

        if (context.type === 'summary') {
            if (app.state.selectedView.type === 'system' && app.state.selectedView.id) {
                const subSystemIds = app.state.processedData.systemMap[app.state.selectedView.id]?.subs.map(sub => sub.id.toLowerCase()) || [];
                filtered = filtered.filter(item => item.subsystem?.toLowerCase() && subSystemIds.includes(item.subsystem.toLowerCase()));
                modalTitle = `Punch Items in System: ${app.state.selectedView.name}`;
            } else if (app.state.selectedView.type === 'subsystem' && app.state.selectedView.id) {
                filtered = filtered.filter(item => item.subsystem?.toLowerCase() === app.state.selectedView.id.toLowerCase());
                modalTitle = `Punch Items in Subsystem: ${app.state.selectedView.name}`;
            } else {
                modalTitle = 'Punch Items (All Systems)';
            }
        } else if (context.type === 'table') {
            const rowData = context.rowData;
            const clickedSubsystem = rowData.subsystem.split(' - ')[0].toLowerCase();
            const clickedDiscipline = rowData.discipline.toLowerCase();
            filtered = filtered.filter(item =>
                item.subsystem?.toLowerCase() === clickedSubsystem &&
                item.discipline?.toLowerCase() === clickedDiscipline
            );
            modalTitle = `Punch Items in ${rowData.subsystem.split(' - ')[0]} / ${rowData.discipline}`;
        }
        app.DOMElements.itemDetailsModalLabel.textContent = modalTitle;
        return filtered;
    }

    function filterHoldItems(context) {
        let filtered = app.state.holdPointItemsData;
        let modalTitle = 'Hold Point Details';
        if (context.type === 'summary') {
            if (app.state.selectedView.type === 'system' && app.state.selectedView.id) {
                const subSystemIds = app.state.processedData.systemMap[app.state.selectedView.id]?.subs.map(sub => sub.id.toLowerCase()) || [];
                filtered = filtered.filter(item => item.subsystem?.toLowerCase() && subSystemIds.includes(item.subsystem.toLowerCase()));
                modalTitle = `Hold Point Items in System: ${app.state.selectedView.name}`;
            } else if (app.state.selectedView.type === 'subsystem' && app.state.selectedView.id) {
                filtered = filtered.filter(item => item.subsystem?.toLowerCase() === app.state.selectedView.id.toLowerCase());
                modalTitle = `Hold Point Items in Subsystem: ${app.state.selectedView.name}`;
            } else {
                modalTitle = 'Hold Point Items (All Systems)';
            }
        } else if (context.type === 'table') {
            const rowData = context.rowData;
            const clickedSubsystem = rowData.subsystem.split(' - ')[0].toLowerCase();
            const clickedDiscipline = rowData.discipline.toLowerCase();
            filtered = filtered.filter(item =>
                item.subsystem?.toLowerCase() === clickedSubsystem &&
                item.discipline?.toLowerCase() === clickedDiscipline
            );
            modalTitle = `Hold Point Items in ${rowData.subsystem.split(' - ')[0]} / ${rowData.discipline}`;
        }
        app.DOMElements.itemDetailsModalLabel.textContent = modalTitle;
        return filtered;
    }

    // Exposed functions
    app.modalManager.initModals = function() {
        // Ensure DOMElements are available
        if (!app.DOMElements || !app.DOMElements.itemDetailsModalInstance || !app.DOMElements.loadingModalInstance) {
            console.error("DOMElements for modals not initialized properly.");
            return;
        }

        app.state.itemDetailsModal = new bootstrap.Modal(app.DOMElements.itemDetailsModalInstance, {});

        // Initialize Loading Modal and store instance in app.state
        app.state.loadingModal = new bootstrap.Modal(app.DOMElements.loadingModalInstance, { backdrop: 'static', keyboard: false });

        if (app.DOMElements.exportDetailsExcelBtn) {
             // Ensure exportManager and its functions are available
            if (app.exportManager && app.exportManager.handleDetailsExport) {
                app.DOMElements.exportDetailsExcelBtn.addEventListener('click', app.exportManager.handleDetailsExport);
            } else {
                console.error("app.exportManager.handleDetailsExport is not defined.");
            }
        }
    };

    app.modalManager.handleDetailsClick = function(e) {
        let target = e.target;
        let statusType = null;
        let filterContext = null;
        let dataType = null;

        if (target.closest('span.badge') === app.DOMElements.totalItemsCounter.closest('span.badge')) {
            statusType = 'TOTAL';
            filterContext = { type: 'summary', status: statusType };
            dataType = 'items';
        }

        if (!filterContext) {
            const summaryCard = target.closest('.summary-card');
            if (summaryCard) {
                const cardBody = summaryCard.querySelector('.card-body');
                const cardTitleElement = cardBody.querySelector('.card-title-custom');
                const title = cardTitleElement ? cardTitleElement.textContent.trim() : '';
                const mainCountDisplay = target.closest('h3.count-display');

                if (mainCountDisplay && cardBody.contains(mainCountDisplay)) {
                    if (title === 'Completed') { statusType = 'DONE'; dataType = 'items'; }
                    else if (title === 'Pending') { statusType = 'PENDING'; dataType = 'items'; }
                    else if (title === 'Remaining') { statusType = 'OTHER'; dataType = 'items'; }
                }

                if (title === 'Issues') {
                    const punchCountElement = cardBody.querySelector('.row.g-2 .col-6:first-child h4');
                    const holdCountElement = cardBody.querySelector('.row.g-2 .col-6:last-child h4');
                    if (target === punchCountElement || punchCountElement?.contains(target)) {
                        statusType = 'PUNCH'; dataType = 'punch';
                    } else if (target === holdCountElement || holdCountElement?.contains(target)) {
                        statusType = 'HOLD'; dataType = 'hold';
                    }
                }
                if (statusType) filterContext = { type: 'summary', status: statusType };
            }
        }

        if (!filterContext) {
            const dataTableCell = target.closest('#dataTableBody td, #dataTableBody th');
            if (dataTableCell) {
                const tableRow = dataTableCell.closest('tr');
                if (tableRow) {
                    const cells = Array.from(tableRow.children);
                    const cellIndex = cells.indexOf(dataTableCell);
                    const headerCell = app.DOMElements.dataTableHead.querySelector(`th:nth-child(${cellIndex + 1})`);
                    if (headerCell) {
                        const headerText = headerCell.textContent.trim();
                        if (headerText === 'Completed') { statusType = 'DONE'; dataType = 'items'; }
                        else if (headerText === 'Pending') { statusType = 'PENDING'; dataType = 'items'; }
                        else if (headerText === 'Punch') { statusType = 'PUNCH'; dataType = 'punch'; }
                        else if (headerText === 'Hold Point') { statusType = 'HOLD'; dataType = 'hold'; }
                        else if (headerText === 'Status') { statusType = 'OTHER'; dataType = 'items'; }
                        else if (headerText === 'Total Items') { statusType = 'TOTAL'; dataType = 'items'; }

                        if (statusType) {
                            const rowData = {};
                            Array.from(tableRow.children).forEach((cell, idx) => {
                                const accessorMap = ['system', 'subsystem', 'discipline', 'totalItems', 'completed', 'pending', 'punch', 'holdPoint', 'statusPercent'];
                                if (accessorMap[idx]) rowData[accessorMap[idx]] = cell.textContent.trim();
                            });
                            filterContext = { type: 'table', rowData: rowData, status: statusType };
                        }
                    }
                }
            }
        }

        if (filterContext) {
            let dataToDisplay = [];
            // dataLoaded check was removed in previous step, assuming it's fine.
            // Default to empty array if data source is empty or not loaded.
            if (dataType === 'items') {
                dataToDisplay = app.state.detailedItemsData ? filterDetailedItems(filterContext) : [];
            } else if (dataType === 'punch') {
                dataToDisplay = app.state.punchItemsData ? filterPunchItems(filterContext) : [];
            } else if (dataType === 'hold') {
                dataToDisplay = app.state.holdPointItemsData ? filterHoldItems(filterContext) : [];
            }

            populateDetailsModal(dataToDisplay, filterContext, dataType);
            if (app.state.itemDetailsModal) {
                 app.state.itemDetailsModal.show();
            } else {
                console.error("ItemDetailsModal instance not found in app.state");
            }
        }
    };

})(window.SAPRA_APP);
