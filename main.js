// Initialize form counts
window.formCounts = {
    formA: 0,
    formB: 0,
    formC: 0,
    formD: 0
};

// --- Constants ---
const CSV_URL = "dbcsv/DATA.CSV";
const ITEMS_CSV_URL = "dbcsv/ITEMS.CSV";
const PUNCH_CSV_URL = "dbcsv/PUNCH.CSV";
const HOLD_POINT_CSV_URL = "dbcsv/HOLD_POINT.CSV";
const ACTIVITIES_CSV_URL = "dbcsv/ACTIVITES.CSV";
const ICONS = {
     Collection: '<i class="bi bi-collection" aria-hidden="true"></i>',
     Folder: '<i class="bi bi-folder" aria-hidden="true"></i>',
     Puzzle: '<i class="bi bi-puzzle" aria-hidden="true"></i>',
     ChevronRight: '<i class="bi bi-chevron-right chevron-toggle" aria-hidden="true"></i>',
     CheckCircle: '<i class="bi bi-check-circle" aria-hidden="true"></i>',
     Clock: '<i class="bi bi-clock" aria-hidden="true"></i>',
     ArrowRepeat: '<i class="bi bi-arrow-repeat" aria-hidden="true"></i>',
     ExclamationTriangle: '<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>',
     FileEarmarkText: '<i class="bi bi-file-earmark-text" aria-hidden="true"></i>',
     FileEarmarkCheck: '<i class="bi bi-file-earmark-check" aria-hidden="true"></i>',
     FileEarmarkMedical: '<i class="bi bi-file-earmark-medical" aria-hidden="true"></i>',
     FileEarmarkSpreadsheet: '<i class="bi bi-file-earmark-spreadsheet" aria-hidden="true"></i>',
     PieChartIcon: '<i class="bi bi-pie-chart-fill fs-1" aria-hidden="true"></i>'
};

// --- Global State ---
let processedData = { systemMap: {}, subSystemMap: {}, allRawData: [] };
let selectedView = { type: 'all', id: 'all', name: 'All Systems' };
let searchTerm = '';
let activeChartTab = 'Overview';
let aggregatedStats = { totalItems: 0, done: 0, pending: 0, punch: 0, hold: 0, remaining: 0 };
let detailedItemsData = [];
let punchItemsData = [];
let holdPointItemsData = [];
let activitiesData = [];
let displayedItemsInModal = [];
let currentModalDataType = null;
let modalCurrentPage = 1;
const modalRowsPerPage = 15;

const chartInstances = {
    overview: null,
    disciplines: {},
    systems: {}
};
let bootstrapTabObjects = {};
let itemDetailsModal;
let activitiesModal;

let DOMElements = {};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    DOMElements = {
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
        itemDetailsPagination: document.getElementById('itemDetailsPagination'),
    };

    const savedTheme = localStorage.getItem('sapraTheme') || 'light';
    setTheme(savedTheme);
    initEventListeners();
    initBootstrapTabs();
    initModals();
    loadAndProcessData();
    DOMElements.sidebarToggle.setAttribute('aria-expanded', 'false');
});

// --- Theme Management ---
function getChartColors() {
    const style = getComputedStyle(document.documentElement);
    return {
        done: style.getPropertyValue('--color-success').trim() || 'rgba(39, 174, 96, 0.9)',
        pending: style.getPropertyValue('--color-warning').trim() || 'rgba(243, 156, 18, 0.9)',
        remaining: style.getPropertyValue('--color-info').trim() || 'rgba(52, 152, 219, 0.9)',
        text: style.getPropertyValue('--text-secondary').trim() || '#6c757d',
        background: style.getPropertyValue('--bg-secondary').trim() || '#ffffff'
    };
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sapraTheme', theme);
    const themeSwitch = document.getElementById('theme-switch-checkbox');
    if (themeSwitch) {
        themeSwitch.checked = (theme === 'dark');
    }
    if (processedData.allRawData.length > 0) {
        renderCharts();
    }
}

function initBootstrapTabs() {
    DOMElements.chartTabs.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tabEl => {
         bootstrapTabObjects[tabEl.id] = new bootstrap.Tab(tabEl);
    });
    document.getElementById('itemDetailsModal').addEventListener('click', function(e) {
        if (e.target.tagName === 'TD' && e.target.cellIndex === 3 && ['items', 'punch', 'hold'].includes(currentModalDataType)) {
            const tagNo = e.target.textContent.trim();
            if (tagNo) {
                loadActivitiesForTag(tagNo);
                activitiesModal.show();
            }
        }
    });
}

function initModals() {
     itemDetailsModal = new bootstrap.Modal(document.getElementById('itemDetailsModal'), {});
     activitiesModal = new bootstrap.Modal(document.getElementById('activitiesModal'), {});
     const exportDetailsExcelBtn = document.getElementById('exportDetailsExcelBtn');
     if (exportDetailsExcelBtn) {
         exportDetailsExcelBtn.addEventListener('click', handleDetailsExport);
     }
}

function initEventListeners() {
    const themeSwitch = document.getElementById('theme-switch-checkbox');
    if (themeSwitch) {
        themeSwitch.addEventListener('change', function() {
            setTheme(this.checked ? 'dark' : 'light');
        });
    }
    DOMElements.sidebarToggle.addEventListener('click', () => {
        const isOpen = DOMElements.sidebar.classList.contains('open');
        DOMElements.sidebar.classList.toggle('open');
        DOMElements.mainContent.classList.toggle('sidebar-open');
        DOMElements.sidebarOverlay.style.display = isOpen ? 'block' : 'none';
        DOMElements.sidebarToggle.setAttribute('aria-expanded', !isOpen);
    });
    DOMElements.sidebarOverlay.addEventListener('click', () => {
        DOMElements.sidebar.classList.remove('open');
        DOMElements.mainContent.classList.remove('sidebar-open');
        DOMElements.sidebarOverlay.style.display = 'none';
        DOMElements.sidebarToggle.setAttribute('aria-expanded', 'false');
    });
    DOMElements.searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderSidebar();
    });
    DOMElements.exportExcelBtn.addEventListener('click', handleExport);
    DOMElements.chartTabs.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-bs-toggle="tab"]');
        if (button) {
            const tabName = button.dataset.tabName;
            if (tabName && tabName !== activeChartTab) {
                activeChartTab = tabName;
                renderCharts();
            }
        }
    });
    document.addEventListener('click', handleDetailsClick);
    DOMElements.totalItemsCounter.closest('span.badge').addEventListener('click', () => {
        if (detailedItemsData.length > 0) {
            const filteredItems = filterDetailedItems({ type: 'summary', status: 'TOTAL' });
            populateDetailsModal(filteredItems, { type: 'summary', status: 'TOTAL' });
            itemDetailsModal.show();
        }
    });
    document.addEventListener('click', function(e) {
        const formCard = e.target.closest('.gradient-form-a, .gradient-form-b, .gradient-form-c, .gradient-form-d');
        if (formCard) {
            const title = formCard.querySelector('.card-title-custom')?.textContent.trim();
            let statusType = null;
            let dataType = null;
            if (title === 'FORM A') { statusType = 'FORM_A'; dataType = 'formA'; }
            else if (title === 'FORM B') { statusType = 'FORM_B'; dataType = 'formB'; }
            else if (title === 'FORM C') { statusType = 'FORM_C'; dataType = 'formC'; }
            else if (title === 'FORM D') { statusType = 'FORM_D'; dataType = 'formD'; }
            if (statusType) {
                filterHOSItems(statusType, dataType);
            }
        }
    });
    document.getElementById('itemDetailsModal').addEventListener('keyup', function(e) {
        if (e.target.tagName === 'INPUT' && e.target.closest('#modal-filter-row')) {
            filterModalTable();
        }
    });
    DOMElements.itemDetailsPagination.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-page]');
        if (button && !button.disabled) {
            const page = parseInt(button.dataset.page, 10);
            populateDetailsModal(null, null, null, page);
        }
    });
}

function filterModalTable() {
    const tableBody = document.getElementById('itemDetailsTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    const filters = Array.from(document.querySelectorAll('#modal-filter-row input')).map(input => input.value.toLowerCase());

    for (const row of rows) {
        let display = true;
        const cells = row.getElementsByTagName('td');
        for (let i = 0; i < filters.length; i++) {
            if (filters[i] && cells[i]) {
                if (!cells[i].textContent.toLowerCase().includes(filters[i])) {
                    display = false;
                    break;
                }
            }
        }
        row.style.display = display ? '' : 'none';
    }
}

function handleDetailsClick(e) {
    let target = e.target;
    let statusType = null;
    let filterContext = null;
    let dataType = null;

    if (target.closest('span.badge') === DOMElements.totalItemsCounter.closest('span.badge')) {
        statusType = 'TOTAL';
        filterContext = { type: 'summary', status: statusType };
        dataType = 'items';
    }
    if (!filterContext) {
        const summaryCard = target.closest('.summary-card');
        if (summaryCard) {
            const title = summaryCard.querySelector('.card-title-custom')?.textContent.trim();
            const mainCountDisplay = target.closest('h3.count-display');
            if (mainCountDisplay && summaryCard.contains(mainCountDisplay)) {
                if (title === 'Completed') { statusType = 'DONE'; dataType = 'items'; }
                else if (title === 'Pending') { statusType = 'PENDING'; dataType = 'items'; }
                else if (title === 'Remaining') { statusType = 'OTHER'; dataType = 'items'; }
            }
            if (title === 'Issues') {
                const punchCountElement = summaryCard.querySelector('.row.g-2 .col-6:first-child h4');
                const holdCountElement = summaryCard.querySelector('.row.g-2 .col-6:last-child h4');
                if (target === punchCountElement || punchCountElement.contains(target)) {
                    statusType = 'PUNCH';
                    dataType = 'punch';
                } else if (target === holdCountElement || holdCountElement.contains(target)) {
                    statusType = 'HOLD';
                    dataType = 'hold';
                }
            }
            if (statusType) {
                filterContext = { type: 'summary', status: statusType };
            }
        }
    }
    if (!filterContext) {
        const dataTableCell = target.closest('#dataTableBody td, #dataTableBody th');
        if (dataTableCell) {
            const tableRow = dataTableCell.closest('tr');
            if (tableRow) {
                const cells = Array.from(tableRow.children);
                const cellIndex = cells.indexOf(dataTableCell);
                const headerCell = DOMElements.dataTableHead.querySelector(`th:nth-child(${cellIndex + 1})`);
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
                            if (accessorMap[idx]) {
                                rowData[accessorMap[idx]] = cell.textContent.trim();
                            }
                        });
                        filterContext = { type: 'table', rowData: rowData, status: statusType };
                    }
                }
            }
        }
    }
    if (filterContext) {
        let dataToDisplay = [];
        let dataLoaded = false;
        if (dataType === 'items') {
            if (detailedItemsData.length > 0) {
                dataToDisplay = filterDetailedItems(filterContext);
                dataLoaded = true;
            }
        } else if (dataType === 'punch') {
            if (punchItemsData.length > 0) {
                dataToDisplay = filterPunchItems(filterContext);
                dataLoaded = true;
            }
        } else if (dataType === 'hold') {
            if (holdPointItemsData.length > 0) {
                dataToDisplay = filterHoldItems(filterContext);
                dataLoaded = true;
            }
        }
        if (dataLoaded) {
            populateDetailsModal(dataToDisplay, filterContext, dataType, 1);
            itemDetailsModal.show();
        } else {
            populateDetailsModal([], filterContext, dataType, 1);
            itemDetailsModal.show();
        }
    }
}

function filterDetailedItems(context) {
    let filtered = detailedItemsData;
    let modalTitle = 'Item Details';
    if (context.type === 'summary') {
        if (selectedView.type === 'system' && selectedView.id) {
            const subSystemIds = processedData.systemMap[selectedView.id]?.subs.map(sub => sub.id.toLowerCase()) || [];
            filtered = filtered.filter(item => item.subsystem.toLowerCase() && subSystemIds.includes(item.subsystem.toLowerCase()));
            modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'PENDING' ? 'Pending' : context.status === 'TOTAL' ? 'Total' : 'Remaining'} Items in System: ${selectedView.name}`;
        } else if (selectedView.type === 'subsystem' && selectedView.id) {
            filtered = filtered.filter(item => item.subsystem.toLowerCase() === selectedView.id.toLowerCase());
            modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'PENDING' ? 'Pending' : context.status === 'TOTAL' ? 'Total' : 'Remaining'} Items in Subsystem: ${selectedView.name}`;
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
        filtered = filtered.filter(item => item.subsystem && item.subsystem.toLowerCase() === clickedSubsystem && item.discipline && item.discipline.toLowerCase() === clickedDiscipline);
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
    document.getElementById('itemDetailsModalLabel').textContent = modalTitle;
    return filtered;
}

function filterPunchItems(context) {
    let filtered = punchItemsData;
    let modalTitle = 'Punch Details';
    if (context.type === 'summary') {
        if (selectedView.type === 'system' && selectedView.id) {
            const system = processedData.systemMap[selectedView.id];
            if (system) {
                const subSystemIds = system.subs.map(sub => sub.id.toLowerCase());
                filtered = filtered.filter(item => item.SD_Sub_System && subSystemIds.includes(item.SD_Sub_System.trim().toLowerCase()));
            }
            modalTitle = `Punch Items in System: ${selectedView.name}`;
        } else if (selectedView.type === 'subsystem' && selectedView.id) {
            filtered = filtered.filter(item => item.SD_Sub_System && item.SD_Sub_System.trim().toLowerCase() === selectedView.id.toLowerCase());
            modalTitle = `Punch Items in Subsystem: ${selectedView.name}`;
        } else {
            modalTitle = 'Punch Items (All Systems)';
        }
    } else if (context.type === 'table') {
        const rowData = context.rowData;
        const clickedSubsystem = rowData.subsystem.split(' - ')[0].trim().toLowerCase();
        const clickedDiscipline = rowData.discipline.trim().toLowerCase();
        filtered = filtered.filter(item => item.SD_Sub_System && item.SD_Sub_System.trim().toLowerCase() === clickedSubsystem && item.Discipline_Name && item.Discipline_Name.trim().toLowerCase() === clickedDiscipline);
        modalTitle = `Punch Items in ${rowData.subsystem.split(' - ')[0]} / ${rowData.discipline}`;
    }
    filtered = filtered.filter(item => item.SD_Sub_System && item.Discipline_Name && item.ITEM_Tag_NO && item.PL_Punch_Category);
    document.getElementById('itemDetailsModalLabel').textContent = modalTitle;
    return filtered;
}

function filterHoldItems(context) {
    let filtered = holdPointItemsData;
    let modalTitle = 'Hold Point Details';
    if (context.type === 'summary') {
        if (selectedView.type === 'system' && selectedView.id) {
            const subSystemIds = processedData.systemMap[selectedView.id]?.subs.map(sub => sub.id.toLowerCase()) || [];
            filtered = filtered.filter(item => item.subsystem.toLowerCase() && subSystemIds.includes(item.subsystem.toLowerCase()));
            modalTitle = `Hold Point Items in System: ${selectedView.name}`;
        } else if (selectedView.type === 'subsystem' && selectedView.id) {
            filtered = filtered.filter(item => item.subsystem.toLowerCase() === selectedView.id.toLowerCase());
            modalTitle = `Hold Point Items in Subsystem: ${selectedView.name}`;
        } else {
            modalTitle = 'Hold Point Items (All Systems)';
        }
    } else if (context.type === 'table') {
        const rowData = context.rowData;
        const clickedSubsystem = rowData.subsystem.split(' - ')[0].toLowerCase();
        const clickedDiscipline = rowData.discipline.toLowerCase();
        filtered = filtered.filter(item => item.subsystem && item.subsystem.toLowerCase() === clickedSubsystem && item.discipline && item.discipline.toLowerCase() === clickedDiscipline);
        modalTitle = `Hold Point Items in ${rowData.subsystem.split(' - ')[0]} / ${rowData.discipline}`;
    }
    document.getElementById('itemDetailsModalLabel').textContent = modalTitle;
    return filtered;
}

function populateDetailsModal(items, context, dataType, page = 1) {
    if (items) {
        displayedItemsInModal = items;
        if(context) {
            document.getElementById('itemDetailsModalLabel').textContent = `${context.status} Details`;
        }
        if(dataType) {
            currentModalDataType = dataType;
        }
    }
    modalCurrentPage = page;
    const tbody = document.getElementById('itemDetailsTableBody');
    const noDetailsMessage = document.getElementById('noDetailsMessage');
    tbody.innerHTML = '';
    const startIndex = (modalCurrentPage - 1) * modalRowsPerPage;
    const endIndex = startIndex + modalRowsPerPage;
    const paginatedItems = displayedItemsInModal.slice(startIndex, endIndex);
    let headers = [];
    if (currentModalDataType === 'items') {
        headers = ['#', 'Subsystem', 'Discipline', 'Tag No', 'Type', 'Description', 'Status'];
    } else if (currentModalDataType === 'punch') {
        headers = ['#', 'Subsystem', 'Discipline', 'Tag No', 'Type', 'Category', 'Description', 'PL No'];
    } else if (currentModalDataType === 'hold') {
        headers = ['#', 'Subsystem', 'Discipline', 'Tag No', 'Type', 'HP Priority', 'HP Description', 'HP Location'];
    }
    document.getElementById('itemDetailsModalHeader').innerHTML = headers.map(h => `<th scope="col">${h}</th>`).join('');
    document.getElementById('modal-filter-row').innerHTML = headers.map((h, i) => `<th><input type="text" class="form-control form-control-sm" placeholder="Filter..." data-col-index="${i}"></th>`).join('');
    if (paginatedItems.length === 0) {
        noDetailsMessage.style.display = 'block';
    } else {
        noDetailsMessage.style.display = 'none';
        paginatedItems.forEach((item, index) => {
            const row = document.createElement('tr');
            let rowContent = '';
            let rowClass = '';
            const itemNumber = startIndex + index + 1;
            if (currentModalDataType === 'items') {
                rowContent = `<td>${itemNumber}</td><td>${item.subsystem}</td><td>${item.discipline}</td><td style="cursor: pointer; color: #007bff; text-decoration: underline;">${item.tagNo}</td><td>${item.typeCode}</td><td>${item.description}</td><td>${item.status}</td>`;
            } else if (currentModalDataType === 'punch') {
                const punchCat = item.PL_Punch_Category ? item.PL_Punch_Category.toLowerCase() : '';
                if (punchCat === 'a') rowClass = 'table-danger'; else if (punchCat === 'b') rowClass = 'table-info'; else if (punchCat === 'c') rowClass = 'table-success';
                rowContent = `<td>${itemNumber}</td><td>${item.SD_Sub_System || 'N/A'}</td><td>${item.Discipline_Name || 'N/A'}</td><td>${item.ITEM_Tag_NO || 'N/A'}</td><td>${item.ITEM_Type_Code || 'N/A'}</td><td style="${punchCat === 'a' ? 'color: red; font-weight: bold;' : ''}">${item.PL_Punch_Category || 'N/A'}</td><td>${item.PL_Punch_Description || 'N/A'}</td><td>${item.PL_No || 'N/A'}</td>`;
            } else if (currentModalDataType === 'hold') {
                rowContent = `<td>${itemNumber}</td><td>${item.subsystem}</td><td>${item.discipline}</td><td>${item.tagNo}</td><td>${item.typeCode || 'N/A'}</td><td>${item.hpPriority || 'N/A'}</td><td>${item.hpDescription || 'N/A'}</td><td>${item.hpLocation || 'N/A'}</td>`;
            }
            row.innerHTML = rowContent;
            if (rowClass) row.classList.add(rowClass);
            tbody.appendChild(row);
        });
    }
    renderPaginationControls(displayedItemsInModal.length);
}

function renderPaginationControls(totalItems) {
    const paginationContainer = DOMElements.itemDetailsPagination;
    paginationContainer.innerHTML = '';
    const totalPages = Math.ceil(totalItems / modalRowsPerPage);
    if (totalPages <= 1) return;
    const prevDisabled = modalCurrentPage === 1 ? 'disabled' : '';
    const nextDisabled = modalCurrentPage === totalPages ? 'disabled' : '';
    paginationContainer.innerHTML = `
        <div class="pagination-nav">
            <button class="btn btn-sm btn-outline-secondary" data-page="${modalCurrentPage - 1}" ${prevDisabled}>&laquo; Prev</button>
        </div>
        <div class="pagination-info">
            Page ${modalCurrentPage} of ${totalPages}
        </div>
        <div class="pagination-nav">
            <button class="btn btn-sm btn-outline-secondary" data-page="${modalCurrentPage + 1}" ${nextDisabled}>Next &raquo;</button>
        </div>
    `;
}

function filterHOSItems(statusType, dataType) {
    fetch('dbcsv/HOS.CSV')
        .then(response => response.text())
        .then(csvText => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    let filteredData = [];
                    if (statusType === 'FORM_A') {
                        filteredData = results.data.filter(row => row.FormA && row.FormA.trim() !== '');
                    } else if (statusType === 'FORM_B') {
                        filteredData = results.data.filter(row => row.FormB && row.FormB.trim() !== '');
                    } else if (statusType === 'FORM_C') {
                        filteredData = results.data.filter(row => row.FormC && row.FormC.trim() !== '');
                    } else if (statusType === 'FORM_D') {
                        filteredData = results.data.filter(row => row.FormD && row.FormD.trim() !== '');
                    }
                    const modalData = filteredData.map(row => ({
                        subsystem: row.Sub_System,
                        subsystemName: row.Subsystem_Name,
                        formA: row.FormA || '',
                        formB: row.FormB || '',
                        formC: row.FormC || '',
                        formD: row.FormD || ''
                    }));
                    populateHOSDetailsModal(modalData, statusType, dataType);
                    itemDetailsModal.show();
                },
                error: (err) => console.error("PapaParse error for HOS CSV:", err)
            });
        })
        .catch(error => console.error("Error loading HOS CSV:", error));
}

function populateHOSDetailsModal(items, statusType, dataType) {
    const tbody = document.getElementById('itemDetailsTableBody');
    tbody.innerHTML = '';
    displayedItemsInModal = items;
    currentModalDataType = dataType;
    const theadRow = document.getElementById('itemDetailsModal').querySelector('thead tr');
    theadRow.innerHTML = `
        <th scope="col" style="width: 5%;">#</th>
        <th scope="col" style="width: 10%;">Subsystem</th>
        <th scope="col" style="width: 25%;">Subsystem Name</th>
        <th scope="col" style="width: 15%;">Form A</th>
        <th scope="col" style="width: 15%;">Form B</th>
        <th scope="col" style="width: 15%;">Form C</th>
        <th scope="col" style="width: 15%;">Form D</th>
    `;
    if (items.length === 0) {
        document.getElementById('noDetailsMessage').style.display = 'block';
    } else {
        document.getElementById('noDetailsMessage').style.display = 'none';
        items.forEach((item, index) => {
            const row = document.createElement('tr');
            const formADate = item.formA ? new Date(item.formA).toLocaleDateString() : '';
            const formBDate = item.formB ? new Date(item.formB).toLocaleDateString() : '';
            const formCDate = item.formC ? new Date(item.formC).toLocaleDateString() : '';
            const formDDate = item.formD ? new Date(item.formD).toLocaleDateString() : '';
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.subsystem}</td>
                <td>${item.subsystemName}</td>
                <td>${formADate}</td>
                <td>${formBDate}</td>
                <td>${formCDate}</td>
                <td>${formDDate}</td>
            `;
            tbody.appendChild(row);
        });
    }
    document.getElementById('itemDetailsModalLabel').textContent = `${statusType} Details`;
}

async function loadAndProcessData() {
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'), {});
    loadingModal.show();
    setTimeout(() => { loadingModal.hide(); }, 1500);
    DOMElements.errorMessage.style.display = 'none';
    try {
        const hosResponse = await fetch('dbcsv/HOS.CSV');
        if (!hosResponse.ok) throw new Error(`Network response for HOS CSV was not ok: ${hosResponse.statusText}`);
        const hosCsvText = await hosResponse.text();
        Papa.parse(hosCsvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                window.formCounts.formA = results.data.filter(row => row.FormA && row.FormA.trim() !== '').length;
                window.formCounts.formB = results.data.filter(row => row.FormB && row.FormB.trim() !== '').length;
                window.formCounts.formC = results.data.filter(row => row.FormC && row.FormC.trim() !== '').length;
                window.formCounts.formD = results.data.filter(row => row.FormD && row.FormD.trim() !== '').length;
            },
            error: (err) => console.error("PapaParse error for HOS CSV:", err)
        });
        const response = await fetch(CSV_URL);
        if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
        const csvText = await response.text();
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                const systemMap = {};
                const subSystemMap = {};
                data.forEach(row => {
                    if (!row.SD_System || !row.SD_Sub_System || !row.discipline) return;
                    const systemId = row.SD_System.trim();
                    const systemName = (row.SD_System_Name || 'Unknown System').trim();
                    const subId = row.SD_Sub_System.trim();
                    const subName = (row.SD_Subsystem_Name || 'Unknown Subsystem').trim();
                    const discipline = row.discipline.trim();
                    if (!systemMap[systemId]) {
                        systemMap[systemId] = { id: systemId, name: systemName, subs: [] };
                    }
                    if (!systemMap[systemId].subs.find(s => s.id === subId)) {
                        systemMap[systemId].subs.push({ id: subId, name: subName });
                    }
                    if (!subSystemMap[subId]) {
                        subSystemMap[subId] = { id: subId, name: subName, systemId: systemId, title: `${subId} - ${subName}`, disciplines: {} };
                    }
                    const total = parseInt(row["TOTAL ITEM"]) || 0;
                    const done = parseInt(row["TOTAL DONE"]) || 0;
                    const pending = parseInt(row["TOTAL PENDING"]) || 0;
                    subSystemMap[subId].disciplines[discipline] = {
                        total: total,
                        done: done,
                        pending: pending,
                        punch: parseInt(row["TOTAL NOT CLEAR PUNCH"]) || 0,
                        hold: parseInt(row["TOTAL HOLD POINT"]) || 0,
                        remaining: Math.max(0, total - done - pending)
                    };
                });
                processedData = { systemMap, subSystemMap, allRawData: data };
                updateView();
            },
            error: (err) => {
                DOMElements.errorMessage.textContent = `Failed to load or parse CSV: ${err.message}`;
                DOMElements.errorMessage.style.display = 'block';
                console.error("PapaParse error:", err);
            }
        });
        const itemsResponse = await fetch(ITEMS_CSV_URL);
        if (!itemsResponse.ok) throw new Error(`Network response for items CSV was not ok: ${itemsResponse.statusText}`);
        const itemsCsvText = await itemsResponse.text();
        Papa.parse(itemsCsvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                detailedItemsData = results.data.map(item => ({
                    subsystem: item.SD_Sub_System?.trim() || '',
                    discipline: item.Discipline_Name?.trim() || '',
                    tagNo: item.ITEM_Tag_NO?.trim() || '',
                    typeCode: item.ITEM_Type_Code?.trim() || '',
                    description: item.ITEM_Description?.trim() || '',
                    status: item.ITEM_Status?.trim() || ''
                }));
            },
            error: (err) => console.error("PapaParse error for items CSV:", err)
        });
        const punchResponse = await fetch(PUNCH_CSV_URL);
        if (!punchResponse.ok) throw new Error(`Network response for punch CSV was not ok: ${punchResponse.statusText}`);
        const punchCsvText = await punchResponse.text();
        Papa.parse(punchCsvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                punchItemsData = results.data.map(item => ({
                    SD_Sub_System: item.SD_Sub_System?.trim() || '',
                    Discipline_Name: item.Discipline_Name?.trim() || '',
                    ITEM_Tag_NO: item.ITEM_Tag_NO?.trim() || '',
                    ITEM_Type_Code: item.ITEM_Type_Code?.trim() || '',
                    PL_Punch_Category: item.PL_Punch_Category?.trim() || '',
                    PL_Punch_Description: item.PL_Punch_Description?.trim() || '',
                    PL_No: item.PL_No?.trim() || ''
                }));
            },
            error: (err) => console.error("PapaParse error for punch CSV:", err)
        });
        const holdResponse = await fetch(HOLD_POINT_CSV_URL);
        if (!holdResponse.ok) throw new Error(`Network response for hold point CSV was not ok: ${holdResponse.statusText}`);
        const holdCsvText = await holdResponse.text();
        Papa.parse(holdCsvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                holdPointItemsData = results.data.map(item => ({
                    subsystem: item.SD_SUB_SYSTEM?.trim() || '',
                    discipline: item.Discipline_Name?.trim() || '',
                    tagNo: item.ITEM_Tag_NO?.trim() || '',
                    typeCode: item.ITEM_Type_Code?.trim() || '',
                    hpPriority: item.HP_Priority?.trim() || '',
                    hpDescription: item.HP_Description?.trim() || '',
                    hpLocation: item.HP_Location?.trim() || ''
                }));
            },
            error: (err) => console.error("PapaParse error for hold point CSV:", err)
        });
        const activitiesResponse = await fetch(ACTIVITIES_CSV_URL);
        if (!activitiesResponse.ok) throw new Error(`Network response for activities CSV was not ok: ${activitiesResponse.statusText}`);
        const activitiesCsvText = await activitiesResponse.text();
        Papa.parse(activitiesCsvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                activitiesData = results.data.map(item => ({
                    Tag_No: item.Tag_No?.trim() || '',
                    Form_Title: item.Form_Title?.trim() || '',
                    Done: item.Done?.trim() || ''
                }));
            },
            error: (err) => console.error("PapaParse error for activities CSV:", err)
        });
    } catch (e) {
        DOMElements.errorMessage.textContent = `Error fetching data: ${e.message}`;
        DOMElements.errorMessage.style.display = 'block';
        console.error("Fetch error:", e);
    }
}

function renderSidebar() {
    let html = '';
    const createNodeHTML = (node, level = 0, parentId = null) => {
        const isSelected = selectedView.type === node.type && selectedView.id === node.id;
        const hasChildren = node.children && node.children.length > 0;
        let childrenHTML = '';
        let isOpen = node.isOpen || false;
        if (searchTerm && node.children?.some(child => child.name.toLowerCase().includes(searchTerm))) {
            isOpen = true;
        }
        if (hasChildren && isOpen) {
            childrenHTML = `<div class="tree-children" role="group" style="display: block;">${node.children.map(child => createNodeHTML(child, level + 1, node.id)).join('')}</div>`;
        } else if (hasChildren) {
            childrenHTML = `<div class="tree-children" role="group" style="display: none;">${node.children.map(child => createNodeHTML(child, level + 1, node.id)).join('')}</div>`;
        }
        const paddingLeft = level * 12 + 12;
        let subtitle = '';
        if (node.type === 'system' && processedData.systemMap[node.id]) {
            subtitle = `<div class='small' style='font-size:0.78em; color: var(--text-on-dark-bg-secondary) !important;'>${processedData.systemMap[node.id].name}</div>`;
        }
        if (node.type === 'subsystem' && processedData.subSystemMap[node.id]) {
            subtitle = `<div class='small' style='font-size:0.78em; color: var(--text-on-dark-bg-secondary) !important;'>${processedData.subSystemMap[node.id].name}</div>`;
        }
        return `
            <div class="tree-node ${isSelected ? 'selected' : ''} ${isOpen ? 'open' : ''}"
                 role="treeitem" aria-selected="${isSelected}" ${hasChildren ? `aria-expanded="${isOpen}"` : ''}
                 data-type="${node.type}" data-id="${node.id}" data-name="${node.name}"
                 data-parent-id="${parentId || ''}" style="padding-left: ${paddingLeft}px;">
                ${node.icon || ''}
                <span class="flex-grow-1 text-truncate me-2">${node.name}${subtitle}</span>
                ${hasChildren ? ICONS.ChevronRight : ''}
            </div>
            ${childrenHTML}
        `;
    };
    const treeNodes = [ { id: 'all', name: 'All Systems', type: 'all', icon: ICONS.Collection } ];
    Object.values(processedData.systemMap).forEach(system => {
        treeNodes.push({
            id: system.id,
            name: system.id,
            type: 'system',
            icon: ICONS.Folder,
            children: system.subs.map(sub => ({
                id: sub.id,
                name: sub.id,
                type: 'subsystem',
                icon: ICONS.Puzzle,
                parentId: system.id
            })),
            isOpen: selectedView.id === system.id || selectedView.parentId === system.id || (searchTerm && system.subs.some(s => s.id.toLowerCase().includes(searchTerm)))
        });
    });
    const filterNodes = (nodes) => {
        if (!searchTerm) return nodes;
        return nodes.map(node => {
            const isMatch = node.name.toLowerCase().includes(searchTerm);
            const filteredChildren = node.children ? filterNodes(node.children) : null;
            if (isMatch || (filteredChildren && filteredChildren.length > 0)) {
                return { ...node, children: filteredChildren, isOpen: true };
            }
            return null;
        }).filter(Boolean);
    };
    const finalTreeNodes = filterNodes(treeNodes);
    DOMElements.treeView.innerHTML = `<div role="tree" aria-label="System and Subsystem Navigation">${finalTreeNodes.map(node => createNodeHTML(node)).join('')}</div>`;
    attachSidebarEventListeners();
}

function attachSidebarEventListeners() {
    DOMElements.treeView.querySelectorAll('.tree-node').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const type = this.dataset.type;
            const id = this.dataset.id;
            const name = this.dataset.name;
            const parentId = this.dataset.parentId;
            const targetIsChevron = e.target.classList.contains('chevron-toggle') || e.target.closest('.chevron-toggle');
            const hasChildren = this.hasAttribute('aria-expanded');
            if (targetIsChevron && hasChildren) {
                const isOpen = this.classList.toggle('open');
                this.setAttribute('aria-expanded', isOpen);
                const childrenContainer = this.nextElementSibling;
                if (childrenContainer) childrenContainer.style.display = isOpen ? 'block' : 'none';
            } else {
                handleNodeSelect(type, id, name, parentId);
                if (window.innerWidth < 992) {
                    DOMElements.sidebar.classList.remove('open');
                    DOMElements.mainContent.classList.remove('sidebar-open');
                    DOMElements.sidebarOverlay.style.display = 'none';
                    DOMElements.sidebarToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
}

function handleNodeSelect(type, id, name, parentId = null) {
    selectedView = { type, id, name, parentId };
    updateView();
}

function updateView() {
    aggregatedStats = _aggregateStatsForView(selectedView, processedData.systemMap, processedData.subSystemMap);
    let titleText = 'Dashboard';
    if (selectedView.type === 'system') {
        titleText = `System: ${selectedView.id} - ${processedData.systemMap[selectedView.id]?.name || selectedView.name}`;
    } else if (selectedView.type === 'subsystem') {
        titleText = `System: ${selectedView.parentId} - ${processedData.systemMap[selectedView.parentId]?.name || ''}<br>Subsystem: ${selectedView.id} - ${processedData.subSystemMap[selectedView.id]?.name || ''}`;
    }
    DOMElements.dashboardTitle.innerHTML = titleText;
    DOMElements.totalItemsCounter.textContent = aggregatedStats.totalItems.toLocaleString();
    renderSummaryCards();
    renderCharts();
    renderDataTable();
    renderSidebar();
}

function renderSummaryCards() {
    let row1HTML = '';
    let row2HTML = '';
    const originalCardsData = [
        { title: 'Completed', count: aggregatedStats.done, total: aggregatedStats.totalItems, icon: ICONS.CheckCircle, iconWrapperBgClass: 'bg-success-subtle', iconColorClass: 'text-success', progressColor: 'success', countColor: 'text-success' },
        { title: 'Pending', count: aggregatedStats.pending, total: aggregatedStats.totalItems, icon: ICONS.Clock, iconWrapperBgClass: 'bg-warning-subtle', iconColorClass: 'text-warning', progressColor: 'warning', countColor: 'text-warning' },
        { title: 'Remaining', count: aggregatedStats.remaining, total: aggregatedStats.totalItems, icon: ICONS.ArrowRepeat, iconWrapperBgClass: 'bg-info-subtle', iconColorClass: 'text-info', progressColor: 'info', countColor: 'text-info' },
    ];
    originalCardsData.forEach(card => {
        const percentage = (card.total > 0) ? Math.round((card.count / card.total) * 100) : 0;
        row1HTML += `
            <div class="col">
                <section class="card summary-card shadow-sm">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="card-title-custom fw-medium">${card.title}</h6>
                            <span class="icon-wrapper ${card.iconWrapperBgClass} ${card.iconColorClass}">${card.icon}</span>
                        </div>
                        <h3 class="count-display ${card.countColor} mb-1">${card.count.toLocaleString()}</h3>
                        ${card.total > 0 ? `<div class="progress mt-2" style="height: 6px;"><div class="progress-bar bg-${card.progressColor}" role="progressbar" style="width: ${percentage}%"></div></div><p class="text-muted small mt-1 mb-0">${percentage}% of total</p>` : ''}
                    </div>
                </section>
            </div>`;
    });
    row1HTML += `
        <div class="col">
            <section class="card summary-card shadow-sm">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="card-title-custom fw-medium">Issues</h6>
                        <span class="icon-wrapper bg-danger-subtle text-danger">${ICONS.ExclamationTriangle}</span>
                    </div>
                    <div class="row g-2">
                        <div class="col-6"><p class="small text-muted mb-0">Punch</p><h4 class="text-danger fw-semibold">${aggregatedStats.punch.toLocaleString()}</h4></div>
                        <div class="col-6"><p class="small text-muted mb-0">Hold Point</p><h4 class="text-danger fw-semibold">${aggregatedStats.hold.toLocaleString()}</h4></div>
                    </div>
                </div>
            </section>
        </div>`;
    DOMElements.summaryCardsRow1.innerHTML = row1HTML;
    const formCardsData = [
        { title: 'FORM A', count: window.formCounts.formA, gradientClass: 'gradient-form-a', icon: ICONS.FileEarmarkText, desc: 'Submitted for MC Approval' },
        { title: 'FORM B', count: window.formCounts.formB, gradientClass: 'gradient-form-b', icon: ICONS.FileEarmarkCheck, desc: 'Returned with Punches' },
        { title: 'FORM C', count: window.formCounts.formC, gradientClass: 'gradient-form-c', icon: ICONS.FileEarmarkMedical, desc: 'Punches Cleared' },
        { title: 'FORM D', count: window.formCounts.formD, gradientClass: 'gradient-form-d', icon: ICONS.FileEarmarkSpreadsheet, desc: 'Final Handover' },
    ];
    formCardsData.forEach(card => {
        row2HTML += `
            <div class="col">
                <section class="card summary-card shadow-sm ${card.gradientClass}">
                    <div class="card-body text-white">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="card-title-custom">${card.title}</h6>
                            <span class="icon-wrapper" style="background-color: rgba(0,0,0,0.2);">${card.icon}</span>
                        </div>
                        <h3 class="count-display mb-1">${card.count.toLocaleString()}</h3>
                        <small class="d-block mt-2 text-white-50">${card.desc}</small>
                    </div>
                </section>
            </div>`;
    });
    DOMElements.summaryCardsRow2.innerHTML = row2HTML;
}

function destroyChart(chartInstance) {
    if (chartInstance) chartInstance.destroy();
}

function renderCharts() {
    destroyChart(chartInstances.overview);
    Object.values(chartInstances.disciplines).forEach(destroyChart);
    chartInstances.disciplines = {};
    Object.values(chartInstances.systems).forEach(destroyChart);
    chartInstances.systems = {};
    const activeTabPane = document.querySelector(`.tab-pane.active[role="tabpanel"]`);
    if (!activeTabPane) return;
    if (activeTabPane.id === 'overviewChartsContainer') renderOverviewCharts();
    else if (activeTabPane.id === 'disciplineChartsContainer') renderDisciplineCharts();
    else if (activeTabPane.id === 'systemChartsContainer') renderSystemSubsystemCharts();
}

function renderOverviewCharts() {
    const overviewCanvas = document.getElementById('overviewChart');
    const overviewParent = overviewCanvas.parentElement;
    overviewParent.innerHTML = '<canvas id="overviewChart" role="img" aria-label="General status doughnut chart"></canvas>';
    const overviewCtx = document.getElementById('overviewChart').getContext('2d');
    const chartColors = getChartColors();
    const overviewChartData = {
        labels: ['Completed', 'Pending', 'Remaining'],
        datasets: [{
            label: 'General Status',
            data: [aggregatedStats.done, aggregatedStats.pending, aggregatedStats.remaining].filter(v => v >= 0),
            backgroundColor: [chartColors.done, chartColors.pending, chartColors.remaining],
            borderColor: chartColors.background,
            borderWidth: 2,
            hoverOffset: 4
        }]
    };
    if (aggregatedStats.totalItems === 0) {
        overviewParent.insertAdjacentHTML('beforeend', '<div class="text-center text-muted small p-5">No data to display.</div>');
    } else {
        chartInstances.overview = new Chart(overviewCtx, { type: 'doughnut', data: overviewChartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: chartColors.text } }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.formattedValue} (${Math.round(context.parsed / aggregatedStats.totalItems * 100)}%)` } } } } });
    }
}

function renderDisciplineCharts() {
    const container = DOMElements.disciplineChartsContainer;
    container.innerHTML = '';
    if (selectedView.type !== 'subsystem' || !selectedView.id) {
        container.innerHTML = `<div class="col-12 text-center py-5 text-muted">${ICONS.PieChartIcon}<p class="mt-2">Select a subsystem to view discipline details.</p></div>`;
        return;
    }
    const subSystem = processedData.subSystemMap[selectedView.id];
    if (!subSystem || Object.keys(subSystem.disciplines).length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5 text-muted">${ICONS.PieChartIcon}<p class="mt-2">No discipline data for this subsystem.</p></div>`;
        return;
    }
    const row = document.createElement('div');
    row.className = 'row g-3';
    Object.entries(subSystem.disciplines).forEach(([name, data]) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4 col-xl-3';
        const chartId = `disciplineChart-${name.replace(/\s+/g, '-')}`;
        col.innerHTML = `<div class="card h-100 shadow-sm"><div class="card-body text-center"><h6 class="text-muted small fw-medium mb-1">${name}</h6><p class="text-muted small mb-2">${data.total.toLocaleString()} items</p><div class="chart-container" style="height: 200px;"><canvas id="${chartId}"></canvas></div></div></div>`;
        row.appendChild(col);
        if (data.total > 0) {
            setTimeout(() => {
                const ctx = document.getElementById(chartId).getContext('2d');
                const chartColors = getChartColors();
                const chartData = {
                    labels: ['Completed', 'Pending', 'Remaining'],
                    datasets: [{ label: name, data: [data.done, data.pending, data.remaining], backgroundColor: [chartColors.done, chartColors.pending, chartColors.remaining], borderColor: chartColors.background, borderWidth: 2 }]
                };
                chartInstances.disciplines[name] = new Chart(ctx, { type: 'doughnut', data: chartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, color: chartColors.text } }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.formattedValue} (${Math.round(context.parsed / data.total * 100)}%)` } } } } });
            }, 0);
        } else {
            setTimeout(() => { document.getElementById(chartId).parentElement.innerHTML = '<div class="text-center text-muted small p-5 h-100 d-flex align-items-center justify-content-center">No data.</div>'; }, 0);
        }
    });
    container.appendChild(row);
}

function renderSystemSubsystemCharts() {
    const container = DOMElements.systemChartsContainer;
    container.innerHTML = '';
    let itemsToDisplay = [];
    if (selectedView.type === 'all') {
        itemsToDisplay = Object.values(processedData.systemMap).map(system => ({ id: system.id, name: `${system.id} - ${system.name}`, data: _aggregateStatsForSystem(system.id, processedData.systemMap, processedData.subSystemMap) }));
    } else if (selectedView.type === 'system' && selectedView.id) {
        const system = processedData.systemMap[selectedView.id];
        if (system) {
            itemsToDisplay = system.subs.map(subRef => ({ id: subRef.id, name: `${subRef.id} - ${processedData.subSystemMap[subRef.id]?.name || 'N/A'}`, data: _aggregateStatsForSubSystem(subRef.id, processedData.subSystemMap) }));
        }
    }
    itemsToDisplay = itemsToDisplay.filter(item => item.data.totalItems > 0);
    if (itemsToDisplay.length === 0) {
        container.innerHTML = `<div class="col-12 text-center py-5 text-muted">${ICONS.PieChartIcon}<p class="mt-2">No systems with data to display.</p></div>`;
        return;
    }
    const row = document.createElement('div');
    row.className = 'row g-3';
    itemsToDisplay.forEach(item => {
        item.data.remaining = Math.max(0, item.data.totalItems - item.data.done - item.data.pending);
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6 col-lg-4 col-xl-3';
        const chartId = `systemSubChart-${item.id.replace(/\s+/g, '-|')}`;
        col.innerHTML = `<div class="card h-100 shadow-sm"><div class="card-body text-center"><h6 class="text-muted small fw-medium mb-1 text-truncate" title="${item.name}">${item.name}</h6><p class="text-muted small mb-2">${item.data.totalItems.toLocaleString()} items</p><div class="chart-container" style="height: 200px;"><canvas id="${chartId}"></canvas></div></div></div>`;
        row.appendChild(col);
        if (item.data.totalItems > 0) {
            setTimeout(() => {
                const ctx = document.getElementById(chartId).getContext('2d');
                const chartColors = getChartColors();
                const chartData = {
                    labels: ['Completed', 'Pending', 'Remaining'],
                    datasets: [{ label: item.name, data: [item.data.done, item.data.pending, item.data.remaining], backgroundColor: [chartColors.done, chartColors.pending, chartColors.remaining], borderColor: chartColors.background, borderWidth: 2 }]
                };
                chartInstances.systems[item.id] = new Chart(ctx, { type: 'doughnut', data: chartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, color: chartColors.text } }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.formattedValue} (${Math.round(context.parsed / item.data.totalItems * 100)}%)` } } } } });
            }, 0);
        } else {
            setTimeout(() => { document.getElementById(chartId).parentElement.innerHTML = '<div class="text-center text-muted small p-5 h-100 d-flex align-items-center justify-content-center">No data.</div>'; }, 0);
        }
    });
    container.appendChild(row);
}

function renderDataTable() {
    const columns = [
        { header: 'System', accessor: 'system' }, { header: 'Subsystem', accessor: 'subsystem' },
        { header: 'Discipline', accessor: 'discipline' }, { header: 'Total Items', accessor: 'totalItems' },
        { header: 'Completed', accessor: 'completed' }, { header: 'Pending', accessor: 'pending' },
        { header: 'Punch', accessor: 'punch' }, { header: 'Hold Point', accessor: 'holdPoint' },
        { header: 'Status', accessor: 'statusPercent' },
    ];
    DOMElements.dataTableHead.innerHTML = columns.map(col => `<th scope="col">${col.header}</th>`).join('');
    const tableData = _generateTableDataForView(selectedView, processedData, aggregatedStats.totalItems === 0);
    let bodyHTML = '';
    if (tableData.length === 0) {
        bodyHTML = `<tr><td colspan="${columns.length}" class="text-center py-5 text-muted">No data for current filter.</td></tr>`;
    } else {
        tableData.forEach(row => {
            bodyHTML += `<tr>`;
            columns.forEach((col, index) => {
                let cellValue = row[col.accessor];
                if (col.accessor === 'statusPercent') {
                    const badgeClass = row.statusPercent > 80 ? 'bg-success-subtle text-success' : row.statusPercent > 50 ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning';
                    cellValue = `<span class="badge ${badgeClass} rounded-pill">${row.statusPercent}%</span>`;
                } else if (col.accessor === 'subsystem') {
                    cellValue = `${row.subsystem} - ${row.subsystemName}`;
                } else {
                    cellValue = (typeof cellValue === 'number') ? cellValue.toLocaleString() : cellValue;
                }
                bodyHTML += index === 0 ? `<th scope="row">${cellValue}</th>` : `<td>${cellValue}</td>`;
            });
            bodyHTML += `</tr>`;
        });
    }
    DOMElements.dataTableBody.innerHTML = bodyHTML;
}

const _emptyStats = () => ({ totalItems: 0, done: 0, pending: 0, punch: 0, hold: 0, remaining: 0 });

function _aggregateStatsForSubSystem(subSystemId, subSystemMap) {
    const subSystem = subSystemMap[subSystemId];
    if (!subSystem) return _emptyStats();
    return Object.values(subSystem.disciplines).reduce((acc, discipline) => {
        acc.totalItems += discipline.total;
        acc.done += discipline.done;
        acc.pending += discipline.pending;
        acc.punch += discipline.punch;
        acc.hold += discipline.hold;
        return acc;
    }, _emptyStats());
}

function _aggregateStatsForSystem(systemId, systemMap, subSystemMap) {
    const system = systemMap[systemId];
    if (!system) return _emptyStats();
    return system.subs.reduce((acc, subRef) => {
        const subSystemStats = _aggregateStatsForSubSystem(subRef.id, subSystemMap);
        Object.keys(subSystemStats).forEach(key => acc[key] += subSystemStats[key]);
        return acc;
    }, _emptyStats());
}

function _aggregateStatsForAll(systemMap, subSystemMap) {
    return Object.keys(systemMap).reduce((acc, systemId) => {
        const systemStats = _aggregateStatsForSystem(systemId, systemMap, subSystemMap);
        Object.keys(systemStats).forEach(key => acc[key] += systemStats[key]);
        return acc;
    }, _emptyStats());
}

function _aggregateStatsForView(view, systemMap, subSystemMap) {
    let stats;
    if (view.type === 'all' || !view.id) stats = _aggregateStatsForAll(systemMap, subSystemMap);
    else if (view.type === 'system') stats = _aggregateStatsForSystem(view.id, systemMap, subSystemMap);
    else stats = _aggregateStatsForSubSystem(view.id, subSystemMap);
    stats.remaining = Math.max(0, stats.totalItems - stats.done - stats.pending);
    return stats;
}

function _generateTableDataForView(view, pData, isEmptyView, forExport = false) {
    const { allRawData, systemMap } = pData;
    if (!forExport && isEmptyView && view.type !== 'all') return [];
    let relevantRawData = [];
    if (view.type === 'all') relevantRawData = allRawData;
    else if (view.type === 'system' && view.id) {
        const system = systemMap[view.id];
        if (system) {
            const subIdsInSystem = new Set(system.subs.map(s => s.id));
            relevantRawData = allRawData.filter(row => subIdsInSystem.has(row.SD_Sub_System.trim()));
        }
    } else if (view.type === 'subsystem' && view.id) {
        relevantRawData = allRawData.filter(row => row.SD_Sub_System.trim() === view.id);
    }
    if (!forExport && relevantRawData.length === 0 && view.type !== 'all') return [];
    return relevantRawData.map(row => {
        const totalItems = parseInt(row["TOTAL ITEM"]) || 0;
        return {
            system: row.SD_System.trim(),
            systemName: (row.SD_System_Name || 'N/A').trim(),
            subsystem: row.SD_Sub_System.trim(),
            subsystemName: (row.SD_Subsystem_Name || 'N/A').trim(),
            discipline: row.discipline.trim(),
            totalItems,
            completed: parseInt(row["TOTAL DONE"]) || 0,
            pending: parseInt(row["TOTAL PENDING"]) || 0,
            punch: parseInt(row["TOTAL NOT CLEAR PUNCH"]) || 0,
            holdPoint: parseInt(row["TOTAL HOLD POINT"]) || 0,
            statusPercent: totalItems > 0 ? Math.round(((parseInt(row["TOTAL DONE"]) || 0) / totalItems) * 100) : 0,
        };
    });
}

function handleExport() {
    if (!processedData.allRawData.length) return alert("No data loaded to export.");
    const dataToExportRaw = _generateTableDataForView(selectedView, processedData, false, true);
    if (dataToExportRaw.length === 0) return alert("No data to export for current selection.");
    const dataToExport = dataToExportRaw.map(row => ({
        System: row.system, SystemName: row.systemName,
        SubSystem: row.subsystem, SubSystemName: row.subsystemName,
        Discipline: row.discipline, TotalItems: row.totalItems,
        Completed: row.completed, Pending: row.pending,
        Punch: row.punch, HoldPoint: row.holdPoint,
        ProgressPercent: `${row.statusPercent}%`
    }));
    const viewName = selectedView.type === 'system' ? `System_${selectedView.id}` : selectedView.type === 'subsystem' ? `SubSystem_${selectedView.id}` : "AllSystems";
    const fileName = `SAPRA_Report_${viewName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    try {
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'SAPRA Report');
        XLSX.writeFile(workbook, fileName);
    } catch (error) {
        console.error("Error exporting to Excel:", error);
        alert("Error during Excel export.");
    }
}

function handleDetailsExport() {
    if (displayedItemsInModal.length === 0) return alert("No data in modal to export.");
    const modalTitle = document.getElementById('itemDetailsModalLabel').textContent.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '_');
    let exportConfig;
    if (currentModalDataType === 'punch') {
        exportConfig = {
            fileName: `SAPRA_Punch_Details_${modalTitle || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: 'Punch Items',
            headers: ['#', 'Subsystem', 'Discipline', 'Tag No', 'Type', 'Category', 'Description', 'PL No'],
            data: displayedItemsInModal.map((item, index) => [index + 1, item.SD_Sub_System || 'N/A', item.Discipline_Name || 'N/A', item.ITEM_Tag_NO || 'N/A', item.ITEM_Type_Code || 'N/A', item.PL_Punch_Category || 'N/A', item.PL_Punch_Description || 'N/A', item.PL_No || 'N/A'])
        };
    } else if (currentModalDataType === 'items') {
        exportConfig = {
            fileName: `SAPRA_Item_Details_${modalTitle || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: 'Item Details',
            headers: ['#', 'Subsystem', 'Discipline', 'Tag No', 'Type', 'Description', 'Status'],
            data: displayedItemsInModal.map((item, index) => [index + 1, item.subsystem, item.discipline, item.tagNo, item.typeCode, item.description, item.status])
        };
    } else if (currentModalDataType === 'hold') {
        exportConfig = {
            fileName: `SAPRA_Hold_Details_${modalTitle || 'All'}_${new Date().toISOString().split('T')[0]}.xlsx`,
            sheetName: 'Hold Points',
            headers: ['#', 'Subsystem', 'Discipline', 'Tag No', 'Type', 'Priority', 'Description', 'Location'],
            data: displayedItemsInModal.map((item, index) => [index + 1, item.subsystem, item.discipline, item.tagNo, item.typeCode || 'N/A', item.hpPriority || 'N/A', item.hpDescription || 'N/A', item.hpLocation || 'N/A'])
        };
    }
    try {
        const ws = XLSX.utils.aoa_to_sheet([exportConfig.headers, ...exportConfig.data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, exportConfig.sheetName);
        XLSX.writeFile(wb, exportConfig.fileName);
    } catch (error) {
        console.error("Export error:", error);
        alert(`Error exporting ${currentModalDataType} data.`);
    }
}

function loadActivitiesForTag(tagNo) {
    document.getElementById('activitiesTagTitle').textContent = `فعالیت‌ها برای: ${tagNo}`;
    const filtered = activitiesData.filter(a => a.Tag_No === tagNo);
    const list = document.getElementById('activitiesList');
    list.innerHTML = '';
    let doneCount = 0;
    if (filtered.length === 0) {
        list.innerHTML = '<tr><td colspan="3" class="no-activities">هیچ فعالیتی یافت نشد.</td></tr>';
        document.getElementById('activitiesProgressText').textContent = '0%';
        document.getElementById('activitiesProgressFill').style.width = '0%';
        return;
    }
    filtered.forEach((act, index) => {
        const tr = document.createElement('tr');
        const status = act.Done === '1' ? '✅' : '❌';
        tr.innerHTML = `<td>${index + 1}</td><td>${act.Form_Title}</td><td class="text-center">${status}</td>`;
        list.appendChild(tr);
        if (act.Done === '1') doneCount++;
    });
    const percent = Math.round((doneCount / filtered.length) * 100);
    document.getElementById('activitiesProgressFill').style.width = `${percent}%`;
    document.getElementById('activitiesProgressText').textContent = `${percent}% (${doneCount}/${filtered.length})`;
}
(function() {
    // This IIFE for hover effects can remain as is.
})();
