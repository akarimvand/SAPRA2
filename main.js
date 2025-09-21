// Initialize form counts
window.formCounts = {
    formA: 0,
    formB: 0,
    formC: 0,
    formD: 0
};

// --- Constants ---
// ✅ Changed to use GitHub raw URLs to bypass CSP restrictions when running via file://
const GITHUB_BASE_URL = "https://raw.githubusercontent.com/akarimvand/SAPRA2/refs/heads/main/dbcsv/";

const CSV_URL = GITHUB_BASE_URL + "DATA.CSV";
const ITEMS_CSV_URL = GITHUB_BASE_URL + "ITEMS.CSV";
const PUNCH_CSV_URL = GITHUB_BASE_URL + "PUNCH.CSV";
const HOLD_POINT_CSV_URL = GITHUB_BASE_URL + "HOLD_POINT.CSV";
const ACTIVITIES_CSV_URL = GITHUB_BASE_URL + "ACTIVITES.CSV"; // Preserving original filename

const COLORS_STATUS_CHARTJS = {
    done: 'rgba(76, 175, 80, 0.8)',    // success
    pending: 'rgba(255, 166, 0, 0.8)', // warning
    remaining: 'rgba(0, 146, 202, 0.8)' // info
};

// Icon SVGs (simplified for direct use, could be more complex if needed)
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
        let detailedItemsData = []; // Added global variable for detailed items data
        let punchItemsData = []; // Added global variable for punch items data
        let holdPointItemsData = []; // Added global variable for hold point items data
        let activitiesData = []; // Added global variable for activities data
        let displayedItemsInModal = []; // Added to store items currently shown in the modal
        let currentModalDataType = null; // 'items' or 'punch' or 'hold' or 'activities'


        const chartInstances = {
            overview: null,
            disciplines: {}, // { disciplineName: chartInstance }
            systems: {}      // { systemOrSubId: chartInstance }
        };
        let bootstrapTabObjects = {}; // To store Bootstrap Tab instances
        let itemDetailsModal; // Added variable for item details modal instance

        // --- DOM Elements ---
        const DOMElements = {
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
            reportsBtn: document.getElementById('reportsBtn'),
            downloadAllBtn: document.getElementById('downloadAllBtn'),
            exitBtn: document.getElementById('exitBtn'),
        };


        // --- Initialization ---
        document.addEventListener('DOMContentLoaded', () => {
            initEventListeners();
            initBootstrapTabs();
            initModals(); // Initialize modals
            loadAndProcessData();
            DOMElements.sidebarToggle.setAttribute('aria-expanded', 'false');
        });

        function initBootstrapTabs() {
            DOMElements.chartTabs.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tabEl => {
                 bootstrapTabObjects[tabEl.id] = new bootstrap.Tab(tabEl);
        });

        // Add click listener for Tag No in itemDetailsModal
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
     // Get reference to the export button inside the modal
    const exportDetailsExcelBtn = document.getElementById('exportDetailsExcelBtn');
     if (exportDetailsExcelBtn) {
         exportDetailsExcelBtn.addEventListener('click', handleDetailsExport);
     }
}

        function initEventListeners() {
            DOMElements.sidebarToggle.addEventListener('click', () => {
                const isOpen = DOMElements.sidebar.classList.contains('open');
                DOMElements.sidebar.classList.toggle('open');
                DOMElements.mainContent.classList.toggle('sidebar-open');
                DOMElements.sidebarOverlay.style.display = DOMElements.sidebar.classList.contains('open') ? 'block' : 'none';
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
             DOMElements.searchInput.setAttribute('aria-label', 'Search system or subsystem');


            DOMElements.exportExcelBtn.addEventListener('click', handleExport);
            DOMElements.exitBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
            DOMElements.downloadAllBtn.addEventListener('click', handleDownloadAll);

            DOMElements.chartTabs.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-bs-toggle="tab"]');
                if (button) {
                    const tabName = button.dataset.tabName;
                    if (tabName && tabName !== activeChartTab) {
                        activeChartTab = tabName;
                        // Bootstrap handles the tab UI update automatically via data-bs-toggle
                        renderCharts();
                    }
                }
            });

        // Add click listeners to summary cards and data table for showing details
        document.addEventListener('click', handleDetailsClick);

        // Add click listener for the total items counter badge
        DOMElements.totalItemsCounter.closest('span.badge').style.cursor = 'pointer'; // Indicate clickable
        DOMElements.totalItemsCounter.closest('span.badge').addEventListener('click', () => {
            if (detailedItemsData.length > 0) {
                const filteredItems = filterDetailedItems({ type: 'summary', status: 'TOTAL' });
                populateDetailsModal(filteredItems, { type: 'summary', status: 'TOTAL' });
                itemDetailsModal.show();
            } else {
                alert("Detailed item data not loaded yet.");
            }
        });

        // Add click listeners for form cards
        document.addEventListener('click', function(e) {
            // Check if click is on a form card count
            const formCard = e.target.closest('.gradient-form-a, .gradient-form-b, .gradient-form-c, .gradient-form-d');
            if (formCard) {
                const cardBody = formCard.querySelector('.card-body');
                const cardTitleElement = cardBody.querySelector('.card-title-custom');
                const title = cardTitleElement ? cardTitleElement.textContent.trim() : '';

                let statusType = null;
                let dataType = null;

                if (title === 'FORM A') {
                    statusType = 'FORM_A';
                    dataType = 'formA';
                } else if (title === 'FORM B') {
                    statusType = 'FORM_B';
                    dataType = 'formB';
                } else if (title === 'FORM C') {
                    statusType = 'FORM_C';
                    dataType = 'formC';
                } else if (title === 'FORM D') {
                    statusType = 'FORM_D';
                    dataType = 'formD';
                }

                if (statusType) {
                    // Filter HOS data based on form type
                    filterHOSItems(statusType, dataType);
                }
            }
        });

        // Add event listener for modal filter inputs
        document.getElementById('itemDetailsModal').addEventListener('keyup', function(e) {
            if (e.target.tagName === 'INPUT' && e.target.closest('#modal-filter-row')) {
                filterModalTable();
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
                const cellText = cells[i].textContent.toLowerCase();
                if (!cellText.includes(filters[i])) {
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
            let filterContext = null; // { type: 'summary', status: 'DONE' } or { type: 'table', rowData: {...}, status: 'PUNCH' } or { type: 'table', rowData: {...}, status: 'HOLD' }
             let dataType = null; // 'items' or 'punch' or 'hold'

            // Check if click is on the total items counter badge
             if (target.closest('span.badge') === DOMElements.totalItemsCounter.closest('span.badge')) {
                 statusType = 'TOTAL';
                 filterContext = { type: 'summary', status: statusType };
                 dataType = 'items'; // Total items counter always shows general items
             }

            // Check if click is on a summary card count (excluding total items counter)
            if (!filterContext) {
                const summaryCard = target.closest('.summary-card'); // Find the closest summary card
                if (summaryCard) {
                     const cardBody = summaryCard.querySelector('.card-body');
                     const cardTitleElement = cardBody.querySelector('.card-title-custom');
                     const title = cardTitleElement ? cardTitleElement.textContent.trim() : '';

                    // Check if clicked on the main count display (Completed, Pending, Remaining)
                    const mainCountDisplay = target.closest('h3.count-display');
                    if (mainCountDisplay && cardBody.contains(mainCountDisplay)) {
                        if (title === 'Completed') { statusType = 'DONE'; dataType = 'items'; }
                        else if (title === 'Pending') { statusType = 'PENDING'; dataType = 'items'; }
                        else if (title === 'Remaining') { statusType = 'OTHER'; dataType = 'items'; }
                    }

                    // Check if clicked on the Punch or Hold Point counts in the Issues card
                     if (title === 'Issues') {
                         const punchCountElement = cardBody.querySelector('.row.g-2 .col-6:first-child h4');
                         const holdCountElement = cardBody.querySelector('.row.g-2 .col-6:last-child h4');

                         if (target === punchCountElement || punchCountElement.contains(target)) {
                             statusType = 'PUNCH';
                             dataType = 'punch';
                         } else if (target === holdCountElement || holdCountElement.contains(target)) {
                             statusType = 'HOLD';
                             dataType = 'hold'; // Set data type to 'hold' for hold points
                         }
                     }

                    if (statusType) {
                        filterContext = { type: 'summary', status: statusType };
                    }
                }
            }

            // Check if click is on a data table cell with a status count or Total Items
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
                             else if (headerText === 'Hold Point') { statusType = 'HOLD'; dataType = 'hold'; } // Set data type to 'hold' for hold points
                             else if (headerText === 'Status') { statusType = 'OTHER'; dataType = 'items'; }
                             else if (headerText === 'Total Items') { statusType = 'TOTAL'; dataType = 'items'; }

                             if (statusType) {
                                 // Get the row data for filtering
                                 const rowData = {};
                                 Array.from(tableRow.children).forEach((cell, idx) => {
                                     // Use the correct accessor names from renderDataTable
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
                 } else if (dataType === 'hold') { // Handle 'hold' data type
                     if (holdPointItemsData.length > 0) {
                         dataToDisplay = filterHoldItems(filterContext);
                         dataLoaded = true;
                     }
                 }

                 if (dataLoaded) {
                    populateDetailsModal(dataToDisplay, filterContext, dataType);
                     itemDetailsModal.show();
                 } else {
                    // Data loaded was true, but filteredData was empty. Populate modal with empty data.
                    populateDetailsModal([], filterContext, dataType);
                    itemDetailsModal.show();
                 }
             }
        }

        function filterDetailedItems(context) {
            let filtered = detailedItemsData;
            let modalTitle = 'Item Details';

            if (context.type === 'summary') {
                 // Filter based on current selected view
                 if (selectedView.type === 'system' && selectedView.id) {
                     const subSystemIds = processedData.systemMap[selectedView.id]?.subs.map(sub => sub.id.toLowerCase()) || []; // Convert subSystemIds to lower case
                     filtered = filtered.filter(item => item.subsystem.toLowerCase() && subSystemIds.includes(item.subsystem.toLowerCase())); // Convert item.subsystem to lower case
                      modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'PENDING' ? 'Pending' : context.status === 'TOTAL' ? 'Total' : 'Remaining'} Items in System: ${selectedView.name}`;
                 } else if (selectedView.type === 'subsystem' && selectedView.id) {
                     filtered = filtered.filter(item => item.subsystem.toLowerCase() === selectedView.id.toLowerCase()); // Convert both to lower case
                      modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'PENDING' ? 'Pending' : context.status === 'TOTAL' ? 'Total' : 'Remaining'} Items in Subsystem: ${selectedView.name}`;
                 } else { // 'all' view - no subsystem filter needed here
                      modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'PENDING' ? 'Pending' : context.status === 'TOTAL' ? 'Total' : 'Remaining'} Items (All Systems)`;
                 }

                 // Filter by status (unless status is TOTAL)
                 if (context.status !== 'TOTAL') {
                      if (context.status === 'OTHER') {
                           // Filter items whose status is NOT DONE or PENDING (case-insensitive)
                           filtered = filtered.filter(item =>
                               // Check if status is defined and not empty, THEN compare case-insensitively
                               // If status is empty or null/undefined, this condition will be false, including them.
                               !item.status || (item.status.toLowerCase() !== 'done' && item.status.toLowerCase() !== 'pending')
                            );
                      } else if (context.status === 'HOLD') { // Added filtering for HOLD status
                           filtered = filtered.filter(item => item.status && item.status.toLowerCase() === 'hold'); // Convert to lower case
                      } else { // Filter by specific status (DONE or PENDING) (case-insensitive)
                           filtered = filtered.filter(item => item.status && item.status.toLowerCase() === context.status.toLowerCase()); // Convert both to lower case
                      }
                 } // If status is TOTAL, no further status filtering needed

            } else if (context.type === 'table') {
                const rowData = context.rowData;
                // Filter by Subsystem and Discipline from the clicked row (case-insensitive)
                 const clickedSubsystem = rowData.subsystem.split(' - ')[0].toLowerCase();
                 const clickedDiscipline = rowData.discipline.toLowerCase();

                 filtered = filtered.filter(item =>
                      item.subsystem && item.subsystem.toLowerCase() === clickedSubsystem &&
                      item.discipline && item.discipline.toLowerCase() === clickedDiscipline
                 );

                 // Filter by status based on the clicked column (unless status is TOTAL) (case-insensitive)
                 if (context.status !== 'TOTAL') {
                      if (context.status === 'OTHER') { // Status percentage column
                           // Filter items whose status is NOT DONE or PENDING (case-insensitive)
                           filtered = filtered.filter(item =>
                               // Check if status is defined and not empty, THEN compare case-insensitively
                               // If status is empty or null/undefined, this condition will be false, including them.
                               !item.status || (item.status.toLowerCase() !== 'done' && item.status.toLowerCase() !== 'pending')
                            );
                      } else if (context.status === 'HOLD') { // Added filtering for HOLD status
                           filtered = filtered.filter(item => item.status && item.status.toLowerCase() === 'hold'); // Convert to lower case
                      } else { // Filter by specific status (Completed, Pending, Punch) (case-insensitive)
                           filtered = filtered.filter(item => item.status && item.status.toLowerCase() === context.status.toLowerCase()); // Convert both to lower case
                      }
                 } // If status is TOTAL, no further status filtering needed

                 modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'TOTAL' ? 'Total' : context.status} Items in ${rowData.subsystem.split(' - ')[0]} / ${rowData.discipline}`;
            }

            document.getElementById('itemDetailsModalLabel').textContent = modalTitle;
            return filtered;
        }

        function filterPunchItems(context) {
            let filtered = punchItemsData;
            let modalTitle = 'Punch Details';

            if (context.type === 'summary') {
                // Filter based on current selected view
                if (selectedView.type === 'system' && selectedView.id) {
                    const system = processedData.systemMap[selectedView.id];
                    if (system) {
                        const subSystemIds = system.subs.map(sub => sub.id.toLowerCase());
                        filtered = filtered.filter(item =>
                            item.SD_Sub_System && subSystemIds.includes(item.SD_Sub_System.trim().toLowerCase())
                        );
                    }
                    modalTitle = `Punch Items in System: ${selectedView.name}`;
                } else if (selectedView.type === 'subsystem' && selectedView.id) {
                    filtered = filtered.filter(item =>
                        item.SD_Sub_System && item.SD_Sub_System.trim().toLowerCase() === selectedView.id.toLowerCase()
                    );
                    modalTitle = `Punch Items in Subsystem: ${selectedView.name}`;
                } else { // 'all' view
                    modalTitle = 'Punch Items (All Systems)';
                }
            } else if (context.type === 'table') {
                const rowData = context.rowData;
                // Extract subsystem and discipline from row data
                const clickedSubsystem = rowData.subsystem.split(' - ')[0].trim().toLowerCase();
                const clickedDiscipline = rowData.discipline.trim().toLowerCase();

                filtered = filtered.filter(item =>
                    item.SD_Sub_System && item.SD_Sub_System.trim().toLowerCase() === clickedSubsystem &&
                    item.Discipline_Name && item.Discipline_Name.trim().toLowerCase() === clickedDiscipline
                );
                modalTitle = `Punch Items in ${rowData.subsystem.split(' - ')[0]} / ${rowData.discipline}`;
            }

            // Additional filtering to ensure we have valid data
            filtered = filtered.filter(item =>
                item.SD_Sub_System && item.Discipline_Name && item.ITEM_Tag_NO && item.PL_Punch_Category
            );

            document.getElementById('itemDetailsModalLabel').textContent = modalTitle;
            return filtered;
        }

        function filterHoldItems(context) {
             let filtered = holdPointItemsData;
             let modalTitle = 'Hold Point Details';

             if (context.type === 'summary') {
                  // Filter based on current selected view (case-insensitive subsystem)
                 if (selectedView.type === 'system' && selectedView.id) {
                     const subSystemIds = processedData.systemMap[selectedView.id]?.subs.map(sub => sub.id.toLowerCase()) || []; // Convert subSystemIds to lower case
                     filtered = filtered.filter(item => item.subsystem.toLowerCase() && subSystemIds.includes(item.subsystem.toLowerCase())); // Convert item.subsystem to lower case
                     modalTitle = `Hold Point Items in System: ${selectedView.name}`;
                 } else if (selectedView.type === 'subsystem' && selectedView.id) {
                     filtered = filtered.filter(item => item.subsystem.toLowerCase() === selectedView.id.toLowerCase()); // Convert both to lower case
                     modalTitle = `Hold Point Items in Subsystem: ${selectedView.name}`;
                 } else { // 'all' view - no subsystem filter needed here
                     modalTitle = 'Hold Point Items (All Systems)';
                 }
                // For hold point summary, status is always 'HOLD', no further filtering by status needed here.

             } else if (context.type === 'table') {
                 const rowData = context.rowData;
                // Filter by Subsystem and Discipline from the clicked row (case-insensitive)
                 const clickedSubsystem = rowData.subsystem.split(' - ')[0].toLowerCase();
                 const clickedDiscipline = rowData.discipline.toLowerCase();

                 filtered = filtered.filter(item =>
                     item.subsystem && item.subsystem.toLowerCase() === clickedSubsystem &&
                     item.discipline && item.discipline.toLowerCase() === clickedDiscipline
                 );
                // For hold point table column, status is always 'HOLD', no further filtering by status needed here.

                 modalTitle = `Hold Point Items in ${rowData.subsystem.split(' - ')[0]} / ${rowData.discipline}`;
             }

            document.getElementById('itemDetailsModalLabel').textContent = modalTitle;
            return filtered;
        }

        function populateDetailsModal(items, context, dataType) {
             const tbody = document.getElementById('itemDetailsTableBody');
            const noDetailsMessage = document.getElementById('noDetailsMessage');
            tbody.innerHTML = ''; // Clear previous results
             displayedItemsInModal = items; // Store items being displayed
             currentModalDataType = dataType; // Store the type of data being displayed

            // Define headers based on data type
            let headers = [];
            if (dataType === 'items') {
                headers = ['#', 'Subsystem', 'Discipline', 'Tag No', 'Type', 'Description', 'Status'];
            } else if (dataType === 'punch') {
                headers = ['#', 'Subsystem', 'Discipline', 'Tag No', 'Type', 'Category', 'Description', 'PL No'];
            } else if (dataType === 'hold') {
                headers = ['#', 'Subsystem', 'Discipline', 'Tag No', 'Type', 'HP Priority', 'HP Description', 'HP Location'];
            }

            // Update table headers
            const theadRow = document.getElementById('itemDetailsModalHeader');
            theadRow.innerHTML = headers.map(h => `<th scope="col">${h}</th>`).join('');

            // Update filter row
            const filterRow = document.getElementById('modal-filter-row');
            filterRow.innerHTML = headers.map((h, i) => `<th><input type="text" class="form-control form-control-sm" placeholder="Filter..." data-col-index="${i}"></th>`).join('');


            if (items.length === 0) {
                noDetailsMessage.style.display = 'block';
            } else {
                noDetailsMessage.style.display = 'none';
                items.forEach((item, index) => { // Added index for row numbering
                    const row = document.createElement('tr');
                    let rowContent = '';
                     let rowClass = '';

                    if (dataType === 'items') {
                         rowContent = `
                            <td style="word-wrap: break-word; white-space: normal;">${index + 1}</td>
                            <td style="word-wrap: break-word; white-space: normal;">${item.subsystem}</td>
                            <td style="word-wrap: break-word; white-space: normal;">${item.discipline}</td>
                            <td style="word-wrap: break-word; white-space: normal; cursor: pointer; color: #007bff; text-decoration: underline;">${item.tagNo}</td>
                            <td style="word-wrap: break-word; white-space: normal;">${item.typeCode}</td>
                            <td style="word-wrap: break-word; white-space: normal;">${item.description}</td>
                            <td style="word-wrap: break-word; white-space: normal; cursor: pointer; color: #007bff; text-decoration: underline;">${item.status}</td>
                         `;
                    } else if (dataType === 'punch') {
                        // Apply color based on punch category (case-insensitive)
                        const punchCat = item.punchCategory ? item.punchCategory.toLowerCase() : '';
                        switch (punchCat) {
                            case 'a': rowClass = 'table-danger'; break;
                            case 'b': rowClass = 'table-info'; break;
                            case 'c': rowClass = 'table-success'; break;
                            default: rowClass = '';
                        }
                        rowContent = `
                            <td style="word-wrap: break-word; white-space: normal;">${index + 1}</td>
                            <td style="word-wrap: break-word; white-space: normal;">${item.SD_Sub_System || 'N/A'}</td>
                            <td style="word-wrap: break-word; white-space: normal;">${item.Discipline_Name || 'N/A'}</td>
                            <td style="word-wrap: break-word; white-space: normal;">${item.ITEM_Tag_NO || 'N/A'}</td>
                            <td style="word-wrap: break-word; white-space: normal;">${item.ITEM_Type_Code || 'N/A'}</td>
                            <td style="${item.PL_Punch_Category === 'A' ? 'color: red; font-weight: bold;' : ''} word-wrap: break-word; white-space: normal;">${item.PL_Punch_Category || 'N/A'}</td>
                            <td style="word-wrap: break-word; white-space: normal;">${item.PL_Punch_Description || 'N/A'}</td>
                            <td style="word-wrap: break-word; white-space: normal;">${item.PL_No || 'N/A'}</td>
                        `;
                    } else if (dataType === 'hold') { // Populate with hold point data
                         rowContent = `
                             <td style="word-wrap: break-word; white-space: normal;">${index + 1}</td>
                             <td style="word-wrap: break-word; white-space: normal;">${item.subsystem}</td>
                             <td style="word-wrap: break-word; white-space: normal;">${item.discipline}</td>
                             <td style="word-wrap: break-word; white-space: normal;">${item.tagNo}</td>
                             <td style="word-wrap: break-word; white-space: normal;">${item.typeCode || 'N/A'}</td>
                             <td style="word-wrap: break-word; white-space: normal;">${item.hpPriority || 'N/A'}</td>
                             <td style="word-wrap: break-word; white-space: normal;">${item.hpDescription || 'N/A'}</td>
                             <td style="word-wrap: break-word; white-space: normal;">${item.hpLocation || 'N/A'}</td>
                         `;
                         rowClass = ''; // No special coloring for hold points requested
                    }

                    row.innerHTML = rowContent;
                     if (rowClass) {
                         row.classList.add(rowClass);
                     }
                    tbody.appendChild(row);
                });
             }
        }

        function filterHOSItems(statusType, dataType) {
            // Load HOS.CSV data
            fetch('https://raw.githubusercontent.com/akarimvand/SAPRA2/refs/heads/main/dbcsv/HOS.CSV')
                .then(response => response.text())
                .then(csvText => {
                    Papa.parse(csvText, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            // Filter data based on form type
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

                            // Prepare data for modal
                            const modalData = filteredData.map(row => ({
                                subsystem: row.Sub_System,
                                subsystemName: row.Subsystem_Name,
                                formA: row.FormA || '',
                                formB: row.FormB || '',
                                formC: row.FormC || '',
                                formD: row.FormD || ''
                            }));

                            // Populate modal with filtered data
                            populateHOSDetailsModal(modalData, statusType, dataType);
                            itemDetailsModal.show();
                        },
                        error: (err) => {
                            console.error("PapaParse error for HOS CSV:", err);
                        }
                    });
                })
                .catch(error => {
                    console.error("Error loading HOS CSV:", error);
                });
        }

        function populateHOSDetailsModal(items, statusType, dataType) {
            const tbody = document.getElementById('itemDetailsTableBody');
            const noDetailsMessage = document.getElementById('noDetailsMessage');
            tbody.innerHTML = ''; // Clear previous results
            displayedItemsInModal = items; // Store items being displayed
            currentModalDataType = dataType; // Store the type of data being displayed

            // Update table headers for HOS data
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
                noDetailsMessage.style.display = 'block';
            } else {
                noDetailsMessage.style.display = 'none';
                items.forEach((item, index) => {
                    const row = document.createElement('tr');
                    // Format dates to be more readable
                    const formADate = item.formA ? new Date(item.formA).toLocaleDateString() : '';
                    const formBDate = item.formB ? new Date(item.formB).toLocaleDateString() : '';
                    const formCDate = item.formC ? new Date(item.formC).toLocaleDateString() : '';
                    const formDDate = item.formD ? new Date(item.formD).toLocaleDateString() : '';

                    row.innerHTML = `
                        <td style="word-wrap: break-word; white-space: normal;">${index + 1}</td>
                        <td style="word-wrap: break-word; white-space: normal;">${item.subsystem}</td>
                        <td style="word-wrap: break-word; white-space: normal;">${item.subsystemName}</td>
                        <td style="word-wrap: break-word; white-space: normal;">${formADate}</td>
                        <td style="word-wrap: break-word; white-space: normal;">${formBDate}</td>
                        <td style="word-wrap: break-word; white-space: normal;">${formCDate}</td>
                        <td style="word-wrap: break-word; white-space: normal;">${formDDate}</td>
                    `;
                    tbody.appendChild(row);
                });
            }

            // Update modal title
            document.getElementById('itemDetailsModalLabel').textContent = `${statusType} Details`;
        }

        function updateActiveTabUI() { // No longer strictly needed for BS tabs, but kept if manual control is desired elsewhere
            const buttons = DOMElements.chartTabs.querySelectorAll('button');
            buttons.forEach(btn => {
                const isActive = btn.dataset.tabName === activeChartTab;
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
        }

        // --- Data Loading and Processing ---
        async function loadAndProcessData() {
            const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'), {});
            loadingModal.show();
            // Hide the modal after 1.5 seconds
            setTimeout(() => { loadingModal.hide(); }, 1500);

            DOMElements.errorMessage.style.display = 'none';
            try {
                // Load HOS.CSV to get form counts
                const hosResponse = await fetch('dbcsv/HOS.CSV');
                if (!hosResponse.ok) {
                    throw new Error(`Network response for HOS CSV was not ok: ${hosResponse.statusText}`);
                }
                const hosCsvText = await hosResponse.text();
                Papa.parse(hosCsvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        // Count non-empty dates in each form column
                        window.formCounts.formA = results.data.filter(row => row.FormA && row.FormA.trim() !== '').length;
                        window.formCounts.formB = results.data.filter(row => row.FormB && row.FormB.trim() !== '').length;
                        window.formCounts.formC = results.data.filter(row => row.FormC && row.FormC.trim() !== '').length;
                        window.formCounts.formD = results.data.filter(row => row.FormD && row.FormD.trim() !== '').length;
                        console.log("Form counts loaded:", window.formCounts);
                    },
                    error: (err) => {
                        console.error("PapaParse error for HOS CSV:", err);
                    }
                });

                const response = await fetch(CSV_URL);
                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }
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
                        // Modal is hidden by the initial setTimeout, no need to hide here
                        updateView(); // Initial render after data load
                    },
                    error: (err) => {
                        // Modal is hidden by the initial setTimeout, no need to hide here
                        DOMElements.errorMessage.textContent = `Failed to load or parse CSV: ${err.message}`;
                        DOMElements.errorMessage.style.display = 'block';
                        console.error("PapaParse error:", err);
                    }
                });

                // Fetch and parse detailed items data
                const itemsResponse = await fetch(ITEMS_CSV_URL);
                if (!itemsResponse.ok) {
                     throw new Error(`Network response for items CSV was not ok: ${itemsResponse.statusText}`);
                }
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
                         console.log("Detailed items data loaded:", detailedItemsData.length, "items");
                    },
                     error: (err) => {
                         console.error("PapaParse error for items CSV:", err);
                     }
                });

                // Fetch and parse punch items data
                 const punchResponse = await fetch(PUNCH_CSV_URL);
                 if (!punchResponse.ok) {
                      throw new Error(`Network response for punch CSV was not ok: ${punchResponse.statusText}`);
                 }
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
                          console.log("Punch items data loaded:", punchItemsData.length, "items");
                     },
                      error: (err) => {
                         console.error("PapaParse error for punch CSV:", err);
                     }
                 });

                 // Fetch and parse hold point items data
                  const holdResponse = await fetch(HOLD_POINT_CSV_URL);
                  if (!holdResponse.ok) {
                       throw new Error(`Network response for hold point CSV was not ok: ${holdResponse.statusText}`);
                  }
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
                          console.log("Hold point items data loaded:", holdPointItemsData.length, "items");
                      },
                       error: (err) => {
                          console.error("PapaParse error for hold point CSV:", err);
                       }
                  });

                  // Fetch and parse activities data
                  const activitiesResponse = await fetch(ACTIVITIES_CSV_URL);
                  if (!activitiesResponse.ok) {
                       throw new Error(`Network response for activities CSV was not ok: ${activitiesResponse.statusText}`);
                  }
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
                           console.log("Activities data loaded:", activitiesData.length, "items");
                      },
                       error: (err) => {
                          console.error("PapaParse error for activities CSV:", err);
                       }
                  });

            } catch (e) {
                 // Modal is hidden by the initial setTimeout, no need to hide here
                DOMElements.errorMessage.textContent = `Error fetching data: ${e.message}`;
                DOMElements.errorMessage.style.display = 'block';
                console.error("Fetch error:", e);
            }
        }

        // --- Rendering Functions ---
        function renderSidebar() {
            let html = '';
            const createNodeHTML = (node, level = 0, parentId = null) => {
                const isSelected = selectedView.type === node.type && selectedView.id === node.id;
                const hasChildren = node.children && node.children.length > 0;
                let childrenHTML = '';
                let isOpen = node.isOpen || false;
                let isExpanded = isOpen; // For ARIA

                if (searchTerm && node.children?.some(child => child.name.toLowerCase().includes(searchTerm))) {
                    isOpen = true;
                    isExpanded = true;
                }

                if (hasChildren && isOpen) {
                    childrenHTML = `<div class="tree-children" role="group" style="display: block;">${node.children.map(child => createNodeHTML(child, level + 1, node.id)).join('')}</div>`;
                } else if (hasChildren) {
                    childrenHTML = `<div class="tree-children" role="group" style="display: none;">${node.children.map(child => createNodeHTML(child, level + 1, node.id)).join('')}</div>`;
                }
                const paddingLeft = level * 12 + 12; // px
                const nodeId = `tree-node-${node.type}-${node.id.replace(/[^a-zA-Z0-9-_]/g, '')}`;
                let subtitle = '';
                if (node.type === 'system' && processedData.systemMap[node.id]) {
                    subtitle = `<div class='small' style='font-size:0.78em; color: #ced4da !important;'>${processedData.systemMap[node.id].name}</div>`;
                }
                if (node.type === 'subsystem' && processedData.subSystemMap[node.id]) {
                    subtitle = `<div class='small' style='font-size:0.78em; color: #ced4da !important;'>${processedData.subSystemMap[node.id].name}</div>`;
                }
                return `
                    <div id="${nodeId}" class="tree-node ${isSelected ? 'selected' : ''} ${isOpen ? 'open' : ''}"
                         role="treeitem" aria-selected="${isSelected}" ${hasChildren ? `aria-expanded="${isExpanded}"` : ''}
                         data-type="${node.type}" data-id="${node.id}" data-name="${node.name}"
                         data-parent-id="${parentId || ''}" style="padding-left: ${paddingLeft}px;" tabindex="${isSelected || (level === 0 && !document.querySelector('.tree-node.selected')) ? '0' : '-1'}">
                        ${node.icon || ''}
                        <span class="flex-grow-1 text-truncate me-2">${node.name}${subtitle}</span>
                        ${hasChildren ? ICONS.ChevronRight : ''}
                </div>
                    ${childrenHTML}
                `;
            };

            const treeNodes = [
                { id: 'all', name: 'All Systems', type: 'all', icon: ICONS.Collection, isOpen: selectedView.id === 'all' ? true : processedData.systemMap[selectedView.parentId]?.isOpenOnSearch }
            ];

            Object.values(processedData.systemMap).forEach(system => {
                const systemNode = {
                    id: system.id,
                    name: system.id,
                    type: 'system',
                    icon: ICONS.Folder,
                    children: system.subs.map(sub => ({
                        id: sub.id,
                        name: sub.id,
                        type: 'subsystem',
                        icon: ICONS.Puzzle,
                        parentId: system.id,
                        isOpen: selectedView.id === sub.id
                    })),
                    isOpen: selectedView.id === system.id || selectedView.parentId === system.id || (searchTerm && system.subs.some(s => s.id.toLowerCase().includes(searchTerm)))
                };
                treeNodes.push(systemNode);
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
            html = finalTreeNodes.map(node => createNodeHTML(node)).join('');
             if (finalTreeNodes.length === 0 && searchTerm) {
                html = `<p class="text-muted text-center small p-3">No matching items found.</p>`;
            }

            DOMElements.treeView.innerHTML = `<div role="tree" aria-label="System and Subsystem Navigation">${html}</div>`;
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

                    if (targetIsChevron && hasChildren) { // Toggle children
                        const isOpen = this.classList.toggle('open');
                        this.setAttribute('aria-expanded', isOpen);
                        const childrenContainer = this.nextElementSibling;
                        if (childrenContainer && childrenContainer.classList.contains('tree-children')) {
                            childrenContainer.style.display = isOpen ? 'block' : 'none';
                        }
                    } else { // Select node
                         handleNodeSelect(type, id, name, parentId);
                         if (window.innerWidth < 992) { // Close sidebar on mobile after selection
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

            // Update the dashboard title based on the selected view type
            let titleText = 'Dashboard';
            if (selectedView.type === 'system' && selectedView.id) {
                const systemName = processedData.systemMap[selectedView.id]?.name || selectedView.name;
                titleText = `System: ${selectedView.id} - ${systemName}`;
            } else if (selectedView.type === 'subsystem' && selectedView.id) {
                const systemName = processedData.systemMap[selectedView.parentId]?.name || selectedView.parentId;
                const subsystemName = processedData.subSystemMap[selectedView.id]?.name || selectedView.name;
                titleText = `System: ${selectedView.parentId} - ${systemName}<br>Subsystem: ${selectedView.id} - ${subsystemName}`;
            } else if (selectedView.type === 'all') {
                titleText = 'Dashboard';
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
                { title: 'Completed', count: aggregatedStats.done, total: aggregatedStats.totalItems, baseClass: 'bg-white', icon: ICONS.CheckCircle, iconWrapperBgClass: 'bg-success-subtle', iconColorClass: 'text-success', progressColor: 'success', countColor: 'text-success', titleColor: 'text-muted' },
                { title: 'Pending', count: aggregatedStats.pending, total: aggregatedStats.totalItems, baseClass: 'bg-white', icon: ICONS.Clock, iconWrapperBgClass: 'bg-warning-subtle', iconColorClass: 'text-warning', progressColor: 'warning', countColor: 'text-warning', titleColor: 'text-muted' },
                { title: 'Remaining', count: aggregatedStats.remaining, total: aggregatedStats.totalItems, baseClass: 'bg-white', icon: ICONS.ArrowRepeat, iconWrapperBgClass: 'bg-info-subtle', iconColorClass: 'text-info', progressColor: 'info', countColor: 'text-info', titleColor: 'text-muted' },
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
                                <span class="icon-wrapper bg-danger-subtle text-danger" aria-hidden="true">${ICONS.ExclamationTriangle}</span>
                        </div>
                            <div class="row g-2">
                                <div class="col-6">
                                    <p class="small text-muted mb-0">Punch</p>
                                    <h4 class="text-danger fw-semibold">${aggregatedStats.punch.toLocaleString()}</h4>
                                </div>
                                <div class="col-6">
                                    <p class="small text-muted mb-0">Hold Point</p>
                                    <h4 class="text-danger fw-semibold">${aggregatedStats.hold.toLocaleString()}</h4>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>`;
            DOMElements.summaryCardsRow1.innerHTML = row1HTML;

            const formCardsData = [
                { title: 'FORM A', count: window.formCounts.formA, gradientClass: 'gradient-form-a animated-gradient', icon: ICONS.FileEarmarkText, desc: 'Submitted to Client for Mechanical Completion Approval' },
                { title: 'FORM B', count: window.formCounts.formB, gradientClass: 'gradient-form-b animated-gradient', icon: ICONS.FileEarmarkCheck, desc: 'Returned by Client with Pre-Commissioning Punches' },
                { title: 'FORM C', count: window.formCounts.formC, gradientClass: 'gradient-form-c animated-gradient', icon: ICONS.FileEarmarkMedical, desc: 'Precom Punches Cleared and Resubmitted for Approval' },
                { title: 'FORM D', count: window.formCounts.formD, gradientClass: 'gradient-form-d animated-gradient', icon: ICONS.FileEarmarkSpreadsheet, desc: 'Final Client Approval and Subsystem Handover Process' },
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
            DOMElements.summaryCardsRow2.innerHTML = row2HTML;
        }

        function destroyChart(chartInstance) {
            if (chartInstance) {
                chartInstance.destroy();
            }
        }

        function renderCharts() {
            destroyChart(chartInstances.overview);
            Object.values(chartInstances.disciplines).forEach(destroyChart);
            chartInstances.disciplines = {};
            Object.values(chartInstances.systems).forEach(destroyChart);
            chartInstances.systems = {};

            const activeTabPane = document.querySelector(`.tab-pane.active[role="tabpanel"]`);

            if (activeTabPane && activeTabPane.id === 'overviewChartsContainer') {
                renderOverviewCharts();
            } else if (activeTabPane && activeTabPane.id === 'disciplineChartsContainer') {
            renderDisciplineCharts();
            } else if (activeTabPane && activeTabPane.id === 'systemChartsContainer') {
                renderSystemSubsystemCharts();
            }
        }

        function renderOverviewCharts() {
            const overviewCanvas = document.getElementById('overviewChart');
            const overviewParent = overviewCanvas.parentElement;
            overviewParent.innerHTML = '<canvas id="overviewChart" role="img" aria-label="General status doughnut chart"></canvas>'; // Reset for no data message
            const overviewCtx = document.getElementById('overviewChart').getContext('2d');

            const overviewChartData = {
                labels: ['Completed', 'Pending', 'Remaining'],
                datasets: [{
                    label: 'General Status',
                    data: [aggregatedStats.done, aggregatedStats.pending, aggregatedStats.remaining].filter(v => v >=0),
                    backgroundColor: [COLORS_STATUS_CHARTJS.done, COLORS_STATUS_CHARTJS.pending, COLORS_STATUS_CHARTJS.remaining],
                    hoverOffset: 4
                }]
            };
            if (aggregatedStats.totalItems === 0 || (aggregatedStats.done === 0 && aggregatedStats.pending === 0 && aggregatedStats.remaining === 0)) {
                 overviewParent.insertAdjacentHTML('beforeend', '<div class="text-center text-muted small p-5">No data to display for General Status.</div>');
            } else {
                chartInstances.overview = new Chart(overviewCtx, { type: 'doughnut', data: overviewChartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.formattedValue} (${Math.round(context.parsed / aggregatedStats.totalItems * 100)}%)`}}}} });
            }
        }

        function renderDisciplineCharts() {
            const container = DOMElements.disciplineChartsContainer;
            container.innerHTML = '';

            if (selectedView.type !== 'subsystem' || !selectedView.id) {
                container.innerHTML = `<div class="col-12 text-center py-5 text-muted" role="status">${ICONS.PieChartIcon}<p class="mt-2">Select a subsystem to view discipline details.</p></div>`;
                return;
            }
            const subSystem = processedData.subSystemMap[selectedView.id];
            if (!subSystem || Object.keys(subSystem.disciplines).length === 0) {
                container.innerHTML = `<div class="col-12 text-center py-5 text-muted" role="status">${ICONS.PieChartIcon}<p class="mt-2">No discipline data available for this subsystem.</p></div>`;
                return;
            }

            const row = document.createElement('div');
            row.className = 'row g-3';

            Object.entries(subSystem.disciplines).forEach(([name, data]) => {
                const col = document.createElement('div');
                col.className = 'col-12 col-md-6 col-lg-4 col-xl-3';
                const chartId = `disciplineChart-${name.replace(/\s+/g, '-')}`;
                const chartLabel = `${name} status for subsystem ${selectedView.id}`;
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
                        const ctx = document.getElementById(chartId).getContext('2d');
                        const chartData = {
                            labels: ['Completed', 'Pending', 'Remaining'],
                            datasets: [{ label: name, data: [data.done, data.pending, data.remaining], backgroundColor: [COLORS_STATUS_CHARTJS.done, COLORS_STATUS_CHARTJS.pending, COLORS_STATUS_CHARTJS.remaining] }]
                        };
                        chartInstances.disciplines[name] = new Chart(ctx, { type: 'doughnut', data: chartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth:10, font: {size: 10}} }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.formattedValue} (${Math.round(context.parsed / data.total * 100)}%)`}}} } });
                    }, 0);
                } else {
                     setTimeout(() => {document.getElementById(chartId).parentElement.innerHTML = '<div class="text-center text-muted small p-5" style="height:100%; display:flex; align-items:center; justify-content:center;">No data.</div>';},0);
                }
            });
            container.appendChild(row);
        }

        function renderSystemSubsystemCharts() {
            const container = DOMElements.systemChartsContainer;
            container.innerHTML = '';
            let itemsToDisplay = [];

            if (selectedView.type === 'all') {
                itemsToDisplay = Object.values(processedData.systemMap).map(system => ({
                    id: system.id,
                    name: `${system.id} - ${system.name}`,
                    data: _aggregateStatsForSystem(system.id, processedData.systemMap, processedData.subSystemMap)
                }));
            } else if (selectedView.type === 'system' && selectedView.id) {
                const system = processedData.systemMap[selectedView.id];
                if (system) {
                    itemsToDisplay = system.subs.map(subRef => {
                        const subSystem = processedData.subSystemMap[subRef.id];
                        return {
                            id: subRef.id,
                            name: `${subRef.id} - ${subSystem?.name || 'N/A'}`,
                            data: _aggregateStatsForSubSystem(subRef.id, processedData.subSystemMap)
                        };
                    });
                }
            } else if (selectedView.type === 'subsystem' && selectedView.id) {
                const subSystem = processedData.subSystemMap[selectedView.id];
                 if (subSystem) {
                    itemsToDisplay = [{
                        id: subSystem.id, name: `${subSystem.id} - ${subSystem.name}`,
                        data: _aggregateStatsForSubSystem(subSystem.id, processedData.subSystemMap)
                    }];
                 }
            }

            itemsToDisplay = itemsToDisplay.filter(item => item.data.totalItems > 0);


            if (itemsToDisplay.length === 0) {
                container.innerHTML = `<div class="col-12 text-center py-5 text-muted" role="status">${ICONS.PieChartIcon}<p class="mt-2">No systems or subsystems with data to display for this view.</p></div>`;
                return;
            }

            const row = document.createElement('div');
            row.className = 'row g-3';

            itemsToDisplay.forEach(item => {
                // Calculate remaining items for this system/subsystem
                item.data.remaining = Math.max(0, item.data.totalItems - item.data.done - item.data.pending);

                const col = document.createElement('div');
                col.className = 'col-12 col-md-6 col-lg-4 col-xl-3';
                const chartId = `systemSubChart-${item.id.replace(/\s+/g, '-|')}`;
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
                        const ctx = document.getElementById(chartId).getContext('2d');
                        const chartData = {
                            labels: ['Completed', 'Pending', 'Remaining'],
                            datasets: [{ label: item.name, data: [item.data.done, item.data.pending, item.data.remaining], backgroundColor: [COLORS_STATUS_CHARTJS.done, COLORS_STATUS_CHARTJS.pending, COLORS_STATUS_CHARTJS.remaining] }]
                        };
                        chartInstances.systems[item.id] = new Chart(ctx, { type: 'doughnut', data: chartData, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth:10, font: {size: 10}} }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.formattedValue} (${Math.round(context.parsed / item.data.totalItems * 100)}%)`}} }} });
                    }, 0);
                } else {
                    setTimeout(() => {document.getElementById(chartId).parentElement.innerHTML = '<div class="text-center text-muted small p-5" style="height:100%; display:flex; align-items:center; justify-content:center;">No data.</div>';},0);
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
            DOMElements.dataTableBody.innerHTML = bodyHTML;
        }

        // --- Data Aggregation (Adapted from dataAggregator.ts) ---
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
            const { systemMap, subSystemMap, allRawData } = pData;
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
                const completed = parseInt(row["TOTAL DONE"]) || 0;
                return {
                    system: row.SD_System.trim(), systemName: (row.SD_System_Name || 'N/A').trim(),
                    subsystem: row.SD_Sub_System.trim(), subsystemName: (row.SD_Subsystem_Name || 'N/A').trim(),
                    discipline: row.discipline.trim(), totalItems, completed,
                    pending: parseInt(row["TOTAL PENDING"]) || 0,
                    punch: parseInt(row["TOTAL NOT CLEAR PUNCH"]) || 0,
                    holdPoint: parseInt(row["TOTAL HOLD POINT"]) || 0,
                    statusPercent: totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0,
                };
            });
        }

        // --- Export to Excel ---
        function handleExport() {
            if (processedData && processedData.allRawData && processedData.allRawData.length > 0) {
                const dataToExportRaw = _generateTableDataForView(selectedView, processedData, false, true);
                 if (dataToExportRaw.length === 0) {
                    alert("No data available to export for the current selection.");
                    return;
                }
                const dataToExport = dataToExportRaw.map(row => ({
                    System: row.system, SystemName: row.systemName,
                    SubSystem: row.subsystem, SubSystemName: row.subsystemName,
                    Discipline: row.discipline, TotalItems: row.totalItems,
                    Completed: row.completed, Pending: row.pending,
                    Punch: row.punch, HoldPoint: row.holdPoint,
                    ProgressPercent: `${row.statusPercent}%`
                }));

                const currentDate = new Date().toISOString().split('T')[0];
                let viewName = "AllSystems";
                if (selectedView.type === 'system' && selectedView.id) viewName = `System_${selectedView.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
                else if (selectedView.type === 'subsystem' && selectedView.id) viewName = `SubSystem_${selectedView.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

                const fileName = `SAPRA_Report_${viewName}_${currentDate}.xlsx`;
                try {
                    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'SAPRA Report');
                    XLSX.writeFile(workbook, fileName);
                } catch (error) {
                    console.error("Error exporting to Excel:", error);
                    alert("An error occurred while exporting to Excel.");
                }
            } else {
                 alert("No data has been loaded yet to export.");
            }
        }

        async function handleDownloadAll() {
            // 1. Check if JSZip is available
            if (typeof JSZip === 'undefined') {
                alert('A required library (JSZip) could not be loaded. Please check your internet connection or contact support.');
                console.error('JSZip library is not defined.');
                return;
            }

            const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'), {});
            const loadingModalLabel = document.getElementById('loadingModalLabel');
            const originalLabel = loadingModalLabel.textContent;

            try {
                loadingModalLabel.textContent = 'Downloading files (0/7)...';
                loadingModal.show();

                const zip = new JSZip();
                const csvFiles = [
                    'ACTIVITES.CSV', 'DATA.CSV', 'HOLD_POINT.CSV',
                    'HOS.CSV', 'ITEMS.CSV', 'PUNCH.CSV', 'TRANS.CSV'
                ];
                const baseUrl = 'https://raw.githubusercontent.com/akarimvand/SAPRA2/refs/heads/main/dbcsv/';

                // 2. Fetch files
                for (let i = 0; i < csvFiles.length; i++) {
                    const file = csvFiles[i];
                    loadingModalLabel.textContent = `Downloading files (${i + 1}/7)...`;
                    const response = await fetch(baseUrl + file);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${file}. Status: ${response.statusText}`);
                    }
                    const content = await response.blob();
                    zip.file(file, content);
                }

                // 3. Generate zip file
                loadingModalLabel.textContent = 'Creating zip file...';
                const zipContent = await zip.generateAsync({ type: 'blob' });

                // 4. Trigger download
                const currentDate = new Date().toISOString().split('T')[0];
                const fileName = `SAPRA_All_Data_${currentDate}.zip`;

                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipContent);
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

            } catch (error) {
                console.error("An error occurred during the download process:", error);
                alert(`An error occurred: ${error.message}`);
            } finally {
                // 5. Hide modal
                loadingModalLabel.textContent = originalLabel;
                loadingModal.hide();
            }
        }

        // --- Optimized Punch Items Export ---
        function handleDetailsExport() {
            if (displayedItemsInModal.length === 0) {
                alert("No data in the modal to export.");
                return;
            }

            // Get current date for filename
            const currentDate = new Date().toISOString().split('T')[0];
            const modalTitle = document.getElementById('itemDetailsModalLabel').textContent
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .replace(/ /g, '_');

            // Prepare export data based on type
            let exportConfig;

            if (currentModalDataType === 'punch') {
                exportConfig = {
                    fileName: `SAPRA_Punch_Details_${modalTitle || 'All'}_${currentDate}.xlsx`,
                    sheetName: 'Punch Items',
                    headers: [
                        '#', 'Subsystem', 'Discipline', 'Tag No',
                        'Type', 'Category', 'Description', 'PL No'
                    ],
                    data: displayedItemsInModal.map((item, index) => [
                        index + 1,
                        item.SD_Sub_System || 'N/A',
                        item.Discipline_Name || 'N/A',
                        item.ITEM_Tag_NO || 'N/A',
                        item.ITEM_Type_Code || 'N/A',
                        item.PL_Punch_Category || 'N/A',
                        item.PL_Punch_Description || 'N/A',
                        item.PL_No || 'N/A'
                    ])
                };
            } else if (currentModalDataType === 'items') {
                exportConfig = {
                    fileName: `SAPRA_Item_Details_${modalTitle || 'All'}_${currentDate}.xlsx`,
                    sheetName: 'Item Details',
                    headers: [
                        '#', 'Subsystem', 'Discipline', 'Tag No',
                        'Type', 'Description', 'Status'
                    ],
                    data: displayedItemsInModal.map((item, index) => [
                        index + 1,
                        item.subsystem,
                        item.discipline,
                        item.tagNo,
                        item.typeCode,
                        item.description,
                        item.status
                    ])
                };
            } else if (currentModalDataType === 'hold') {
                exportConfig = {
                    fileName: `SAPRA_Hold_Details_${modalTitle || 'All'}_${currentDate}.xlsx`,
                    sheetName: 'Hold Points',
                    headers: [
                        '#', 'Subsystem', 'Discipline', 'Tag No',
                        'Type', 'Priority', 'Description', 'Location'
                    ],
                    data: displayedItemsInModal.map((item, index) => [
                        index + 1,
                        item.subsystem,
                        item.discipline,
                        item.tagNo,
                        item.typeCode || 'N/A',
                        item.hpPriority || 'N/A',
                        item.hpDescription || 'N/A',
                        item.hpLocation || 'N/A'
                    ])
                };
            } else if (currentModalDataType.startsWith('form')) {
                // Handle HOS form data export
                exportConfig = {
                    fileName: `SAPRA_${modalTitle || 'Form'}_Details_${currentDate}.xlsx`,
                    sheetName: 'Form Details',
                    headers: [
                        '#', 'Subsystem', 'Subsystem Name', 'Form A',
                        'Form B', 'Form C', 'Form D'
                    ],
                    data: displayedItemsInModal.map((item, index) => [
                        index + 1,
                        item.subsystem,
                        item.subsystemName,
                        item.formA,
                        item.formB,
                        item.formC,
                        item.formD
                    ])
                };
            }

            try {
                // Create worksheet with headers
                const ws = XLSX.utils.aoa_to_sheet([
                    exportConfig.headers,
                    ...exportConfig.data
                ]);

                // Create workbook and export
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, exportConfig.sheetName);
                XLSX.writeFile(wb, exportConfig.fileName);
            } catch (error) {
                console.error("Export error:", error);
                alert(`Error exporting ${currentModalDataType} data: ${error.message}`);
            }
        }

        function loadActivitiesForTag(tagNo) {
            document.getElementById('activitiesTagTitle').textContent = `فعالیت‌ها برای: ${tagNo}`;
            const filtered = activitiesData.filter(a => a.Tag_No === tagNo);
            const list = document.getElementById('activitiesList');
            list.innerHTML = '';
            let doneCount = 0;

            if (filtered.length === 0) {
                list.innerHTML = '<tr><td colspan="3" class="no-activities">هیچ فعالیتی برای این Tag No یافت نشد.</td></tr>';
                document.getElementById('activitiesProgressText').textContent = '0%';
                document.getElementById('activitiesProgressFill').style.width = '0%';
                return;
            }

            filtered.forEach((act, index) => {
                const tr = document.createElement('tr');
                const status = act.Done === '1' ? '✅' : '❌';
                const cls = act.Done === '1' ? 'done' : 'not-done';
                tr.innerHTML = `
                    <td class="text-center">${index + 1}</td>
                    <td>${act.Form_Title}</td>
                    <td class="text-center"><span class="${cls}">${status}</span></td>
                `;
                list.appendChild(tr);
                if (act.Done === '1') doneCount++;
            });

            const percent = Math.round((doneCount / filtered.length) * 100);
            document.getElementById('activitiesProgressFill').style.width = `${percent}%`;
            document.getElementById('activitiesProgressText').textContent = `${percent}% (${doneCount}/${filtered.length})`;
        }
    (function() {
        const cardSelectors = [
            '.gradient-form-a',
            '.gradient-form-b',
            '.gradient-form-c',
            '.gradient-form-d'
        ];
         const logoSelector = '.sidebar-header img'; // Selector for the logo image
        const treeNodeSelector = '.tree-node'; // Selector for sidebar tree nodes
        const contactInfoSelector = '.sidebar-footer .contact-info'; // Selector for all contact info paragraphs

        function handleMouseMove(e) {
            const element = e.currentTarget;
            const rect = element.getBoundingClientRect();
            const y = e.clientY - rect.top; // Y position relative to element
            const x = e.clientX - rect.left; // X position relative to element

            const percentY = y / rect.height; // 0 (top) to 1 (bottom)
            const percentX = x / rect.width; // 0 (left) to 1 (right)

            const maxTiltY = 25; // Increased max tilt in Y direction for more X rotation
             const maxTiltX = 15; // Increased max tilt in X direction for more Y rotation

            // Calculate tilt based on mouse position
            const tiltX = -percentY * maxTiltY + (maxTiltY / 2); // Tilt from top (+maxTiltY/2) to bottom (-maxTiltY/2)
            const tiltY = percentX * maxTiltX - (maxTiltX / 2); // Tilt from left (-maxTiltX/2) to right (+maxTiltX/2)

            // Apply transform with perspective and rotation
            element.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`; // Adjusted scale slightly
             // Only apply specific styles (like shadows) if needed, otherwise just apply the transform
             // In this case, we want the gradient cards to just have the transform like the title
             // Removed old card-specific shadow/border-radius application from here.

            // Remove any specific hover styles that might interfere
            if (element.classList.contains('tree-node')) {
                 // For tree nodes, only apply the transform, no shadow or border radius changes needed
            }
            // Handle contact info hover
            if (element.classList.contains('contact-info')) {
                 // Only apply transform, no shadow/border radius
            }
        }

        function handleMouseLeave(e) {
            const element = e.currentTarget;
            // Reset transform
            element.style.transform = '';

            // Remove any specific hover styles that were applied
            if (element.classList.contains('tree-node')) {
                 // For tree nodes, reset transform and remove the will-change property set on hover
                 element.style.willChange = 'auto'; // Reset will-change
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            // Apply hover effects to gradient cards
            cardSelectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(card => {
                    // Rely on CSS :hover for the new effect, remove JS listeners
                });
            });

            // Apply hover effects to the logo image
             const logoImage = document.querySelector(logoSelector);
            if (logoImage) {
                 // Add transition for smooth effect
                 logoImage.style.transition = 'transform 0.4s cubic-bezier(.4,2,.6,1)';
                 logoImage.style.willChange = 'transform';

                 logoImage.addEventListener('mousemove', handleMouseMove);
                 logoImage.addEventListener('mouseleave', handleMouseLeave);
            }

            // Apply hover effects to tree view nodes
             document.querySelectorAll(treeNodeSelector).forEach(treeNode => {
                 // Add transition for smooth effect
                 treeNode.style.transition = 'transform 0.2s ease-in-out'; // Use a slightly faster transition for nodes
                 // Set will-change on hover to optimize
                 treeNode.addEventListener('mouseenter', () => { treeNode.style.willChange = 'transform'; });
                 treeNode.addEventListener('mouseleave', () => { treeNode.style.willChange = 'auto'; }); // Reset on leave

                 treeNode.addEventListener('mousemove', handleMouseMove);
                 treeNode.addEventListener('mouseleave', handleMouseLeave);
             });

             // Apply hover effects to contact info
             document.querySelectorAll(contactInfoSelector).forEach(contactElement => {
                 contactElement.addEventListener('mousemove', handleMouseMove);
                 contactElement.addEventListener('mouseleave', handleMouseLeave);
             });

             // Apply hover effects to the dashboard title
             const dashboardTitle = document.getElementById('dashboardTitle');
             if (dashboardTitle) {
                  dashboardTitle.addEventListener('mousemove', handleMouseMove);
                  dashboardTitle.addEventListener('mouseleave', handleMouseLeave);
             }
        });
    })();
