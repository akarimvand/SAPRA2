// Initialize form counts
window.formCounts = {
    formA: 0,
    formB: 0,
    formC: 0,
    formD: 0
};

// --- Constants ---
// Use GitHub Pages URL to avoid CORS issues
const GITHUB_BASE_URL = "https://akarimvand.github.io/SAPRA2/dbcsv/";

const CSV_URL = GITHUB_BASE_URL + "DATA.CSV";
const ITEMS_CSV_URL = GITHUB_BASE_URL + "ITEMS.CSV";
const PUNCH_CSV_URL = GITHUB_BASE_URL + "PUNCH.CSV";
const HOLD_POINT_CSV_URL = GITHUB_BASE_URL + "HOLD_POINT.CSV";
const ACTIVITIES_CSV_URL = GITHUB_BASE_URL + "ACTIVITES.CSV";

const COLORS_STATUS_CHARTJS = {
    done: 'rgba(76, 175, 80, 0.8)',    // success
    pending: 'rgba(255, 166, 0, 0.8)', // warning
    remaining: 'rgba(252, 95, 63, 0.8)' // info
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
        let aggregatedStats = { totalItems: 0, done: 0, pending: 0, punch: 0, hold: 0, remaining: 0 };
        let detailedItemsData = []; // Added global variable for detailed items data
        let punchItemsData = []; // Added global variable for punch items data
        let holdPointItemsData = []; // Added global variable for hold point items data
        let activitiesData = []; // Added global variable for activities data (loaded on demand)
        let activitiesLoaded = false; // Flag to track if activities data has been loaded
        let hosData = []; // Full HOS data for modal
        let subsystemStatusMap = {}; // To store the status from HOS.CSV
        let displayedItemsInModal = []; // Added to store items currently shown in the modal
        let currentModalDataType = null; // 'items' or 'punch' or 'hold' or 'activities'


        const chartInstances = {
            overview: null,
            disciplines: {} // { disciplineName: chartInstance }
        };
        let bootstrapTabObjects = {}; // To store Bootstrap Tab instances
        let itemDetailsModal; // Added variable for item details modal instance
        let loadingModalInstance;

        // --- DOM Elements ---
        const DOMElements = {
            sidebar: document.getElementById('sidebar'),
            sidebarToggle: document.getElementById('sidebarToggle'),
            sidebarOverlay: document.getElementById('sidebarOverlay'),
            mainContent: document.getElementById('mainContent'),
            treeView: document.getElementById('treeView'),
            searchInput: document.getElementById('searchInput'),
            totalItemsCounter: document.getElementById('totalItemsCounter'),
            summaryCardsRow1: document.getElementById('summaryCardsRow1'),
            summaryCardsRow2: document.getElementById('summaryCardsRow2'),
            chartTabs: document.getElementById('chartTabs'),
            overviewChartsContainer: document.getElementById('overviewChartsContainer'),
            disciplineChartsContainer: document.getElementById('disciplineChartsContainer'),
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
            initModals();
            initUIFeatures(); // Initialize new UI features
            initKeyboardShortcuts();
            initAccessibility();
            
            // Initialize tooltips
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
            
            loadAndProcessData();
            DOMElements.sidebarToggle.setAttribute('aria-expanded', 'false');
            
            // Add debug info to console
            console.log('🚀 SAPRA Application Started');
            console.log('Debug commands available:');
            console.log('- checkDataStatus(): Check if data is loaded');
            console.log('- forceReloadData(): Force reload all data');
            console.log('- toggleDarkMode(): Toggle dark/light theme');
            console.log('- showToast(message, type): Show notification');
            console.log('- window.processedData: Access main data object');
        });

        // Function to activate tabs from iframe
        window.activateTab = function(tabId) {
            const tabButton = document.getElementById(tabId);
            if (tabButton) {
                const tab = new bootstrap.Tab(tabButton);
                tab.show();
            }
        };

        // Debug function to check data loading status
        window.checkDataStatus = function() {
            console.log('🔍 Data Loading Status Check:');
            console.log('processedData:', processedData);
            console.log('selectedView:', selectedView);
            console.log('aggregatedStats:', aggregatedStats);
            console.log('detailedItemsData length:', detailedItemsData.length);
            console.log('punchItemsData length:', punchItemsData.length);
            console.log('holdPointItemsData length:', holdPointItemsData.length);
            console.log('hosData length:', hosData.length);
            console.log('subsystemStatusMap:', subsystemStatusMap);
            
            if (processedData.systemMap && Object.keys(processedData.systemMap).length > 0) {
                console.log('✅ Main data loaded successfully');
            } else {
                console.log('❌ Main data not loaded');
            }
            
            return {
                mainDataLoaded: Object.keys(processedData.systemMap || {}).length > 0,
                detailedItemsLoaded: detailedItemsData.length > 0,
                punchItemsLoaded: punchItemsData.length > 0,
                holdItemsLoaded: holdPointItemsData.length > 0,
                hosDataLoaded: hosData.length > 0
            };
        };

        // Force reload data function
        window.forceReloadData = function() {
            console.log('🔄 Force reloading data...');
            showToast('🔄 Reloading data...', 'info');
            
            // Show progress
            showProgress(0);
            
            // Reset all data
            processedData = { systemMap: {}, subSystemMap: {}, allRawData: [] };
            detailedItemsData = [];
            punchItemsData = [];
            holdPointItemsData = [];
            hosData = [];
            subsystemStatusMap = {};
            
            // Clear cache and reload
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                    });
                });
            }
            
            loadAndProcessData();
        };

        // === NEW UI FEATURES ===
        

        
        // Toast Notifications
        window.showToast = function(message, type = 'info', duration = 3000) {
            const toastContainer = document.getElementById('toastContainer');
            const toastId = 'toast-' + Date.now();
            
            const toastHtml = `
                <div class="toast toast-${type}" id="${toastId}" role="alert">
                    <div class="toast-body d-flex align-items-center">
                        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                        <span class="flex-grow-1">${message}</span>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                    </div>
                </div>
            `;
            
            toastContainer.insertAdjacentHTML('beforeend', toastHtml);
            
            const toastElement = document.getElementById(toastId);
            const toast = new bootstrap.Toast(toastElement, { delay: duration });
            toast.show();
            
            // Auto remove after hide
            toastElement.addEventListener('hidden.bs.toast', () => {
                toastElement.remove();
            });
        };
        
        // Progress Indicator
        window.showProgress = function(percent) {
            const progressContainer = document.getElementById('dataLoadProgress');
            const progressBar = progressContainer.querySelector('.progress-bar');
            
            if (percent === 0) {
                progressContainer.style.display = 'block';
                progressBar.style.width = '0%';
            } else if (percent === 100) {
                progressBar.style.width = '100%';
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 500);
            } else {
                progressBar.style.width = percent + '%';
            }
        };
        
        // Update Breadcrumb
        window.updateBreadcrumb = function(path) {
            const breadcrumb = document.getElementById('breadcrumbNav');
            breadcrumb.innerHTML = path.map((item, index) => {
                const isLast = index === path.length - 1;
                return `<li class="breadcrumb-item ${isLast ? 'active' : ''}">${item}</li>`;
            }).join('');
        };
        
        // Quick Search in Items
        window.performQuickSearch = function(query) {
            const results = [];
            const searchQuery = query.toLowerCase();
            
            // Search in detailed items
            detailedItemsData.forEach(item => {
                if (item.tagNo.toLowerCase().includes(searchQuery) ||
                    item.description.toLowerCase().includes(searchQuery) ||
                    item.typeCode.toLowerCase().includes(searchQuery) ||
                    item.subsystem.toLowerCase().includes(searchQuery) ||
                    item.discipline.toLowerCase().includes(searchQuery)) {
                    
                    results.push({
                        tagNo: item.tagNo,
                        description: item.description,
                        subsystem: item.subsystem,
                        discipline: item.discipline,
                        typeCode: item.typeCode,
                        status: item.status
                    });
                }
            });
            
            return results.slice(0, 20); // Limit to 20 results
        };
        
        // Initialize UI Features
        function initUIFeatures() {
            
            // Quick search
            const quickSearchBtn = document.getElementById('quickSearchBtn');
            const quickSearchModal = new bootstrap.Modal(document.getElementById('quickSearchModal'));
            const quickSearchInput = document.getElementById('quickSearchInput');
            const quickSearchResults = document.getElementById('quickSearchResults');
            
            if (quickSearchBtn) {
                quickSearchBtn.addEventListener('click', () => {
                    quickSearchModal.show();
                    setTimeout(() => quickSearchInput.focus(), 100);
                });
            }
            
            if (quickSearchInput) {
                quickSearchInput.addEventListener('input', (e) => {
                    const query = e.target.value.trim();
                    if (query.length < 2) {
                        quickSearchResults.innerHTML = '';
                        return;
                    }
                    
                    const results = performQuickSearch(query);
                    
                    if (results.length === 0) {
                        quickSearchResults.innerHTML = '<div class="text-center text-muted py-3">No items found</div>';
                        return;
                    }
                    
                    quickSearchResults.innerHTML = results.map(result => `
                        <div class="search-result-item" data-tag-no="${result.tagNo}">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <div class="search-result-title fw-bold text-primary">${result.tagNo}</div>
                                    <div class="search-result-subtitle text-muted small">${result.description}</div>
                                    <div class="small text-secondary">
                                        <span class="badge bg-light text-dark me-1 subsystem-badge" data-subsystem="${result.subsystem}" style="cursor: pointer;">${result.subsystem}</span>
                                        <span class="badge bg-light text-dark me-1">${result.discipline}</span>
                                        <span class="badge bg-light text-dark">${result.typeCode}</span>
                                    </div>
                                </div>
                                <div class="text-end">
                                    <span class="badge ${result.status?.toLowerCase() === 'done' ? 'bg-success' : 'bg-warning'}">
                                        ${result.status || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `).join('');
                    
                    // Add click handlers for items
                    quickSearchResults.querySelectorAll('.search-result-item').forEach(item => {
                        item.addEventListener('click', (e) => {
                            // Check if clicked on subsystem badge
                            if (e.target.classList.contains('subsystem-badge')) {
                                e.stopPropagation();
                                const subsystemId = e.target.dataset.subsystem;
                                const subsystemData = processedData.subSystemMap[subsystemId];
                                
                                if (subsystemData) {
                                    quickSearchModal.hide();
                                    handleNodeSelect('subsystem', subsystemId, subsystemData.title || subsystemId, subsystemData.systemId);
                                    showToast(`Filtered to subsystem: ${subsystemId}`, 'success');
                                }
                                return;
                            }
                            
                            // Default behavior - show activities
                            const tagNo = item.dataset.tagNo;
                            quickSearchModal.hide();
                            
                            // Load activities for the selected tag
                            loadActivitiesForTag(tagNo);
                            activitiesModal.show();
                            
                            showToast(`Showing activities for ${tagNo}`, 'success');
                        });
                    });
                    
                    // Add hover effect for subsystem badges
                    quickSearchResults.querySelectorAll('.subsystem-badge').forEach(badge => {
                        badge.addEventListener('mouseenter', () => {
                            badge.classList.add('bg-primary', 'text-white');
                            badge.classList.remove('bg-light', 'text-dark');
                        });
                        badge.addEventListener('mouseleave', () => {
                            badge.classList.remove('bg-primary', 'text-white');
                            badge.classList.add('bg-light', 'text-dark');
                        });
                    });
                });
            }
            
            // Refresh data button
            const refreshBtn = document.getElementById('refreshDataBtn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', forceReloadData);
            }
        }
        
        // Initialize Keyboard Shortcuts
        function initKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+E: Export
                if (e.ctrlKey && e.key === 'e') {
                    e.preventDefault();
                    handleExport();
                    showToast('Exporting data...', 'info');
                }
                
                // Ctrl+R: Refresh
                if (e.ctrlKey && e.key === 'r') {
                    e.preventDefault();
                    forceReloadData();
                }
                
                // Ctrl+F: Quick Search
                if (e.ctrlKey && e.key === 'f') {
                    e.preventDefault();
                    document.getElementById('quickSearchBtn').click();
                }
                
                // Ctrl+D: Database
                if (e.ctrlKey && e.key === 'd') {
                    e.preventDefault();
                    document.getElementById('dbStorageBtn').click();
                }
                
                // Ctrl+Q: Exit
                if (e.ctrlKey && e.key === 'q') {
                    e.preventDefault();
                    document.getElementById('exitBtn').click();
                }
                
                // ?: Show shortcuts
                if (e.key === '?' && !e.ctrlKey && !e.altKey) {
                    e.preventDefault();
                    const shortcutsModal = new bootstrap.Modal(document.getElementById('shortcutsModal'));
                    shortcutsModal.show();
                }
            });
        }
        
        // Initialize Accessibility
        function initAccessibility() {
            // Focus management
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    document.body.classList.add('keyboard-navigation');
                }
            });
            
            document.addEventListener('mousedown', () => {
                document.body.classList.remove('keyboard-navigation');
            });
            
            // ARIA live regions
            const liveRegion = document.createElement('div');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.className = 'visually-hidden';
            liveRegion.id = 'live-region';
            document.body.appendChild(liveRegion);
        }
        
        // Announce to screen readers
        window.announceToScreenReader = function(message) {
            const liveRegion = document.getElementById('live-region');
            if (liveRegion) {
                liveRegion.textContent = message;
            }
        };

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
     loadingModalInstance = new bootstrap.Modal(document.getElementById('loadingModal'), {
        keyboard: false,
        backdrop: 'static'
     });
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

            // New listener for when a chart tab is shown, ensuring charts render only when visible.
            DOMElements.chartTabs.addEventListener('shown.bs.tab', function (event) {
                const tabId = event.target.id;
                if (tabId === 'overview-tab-btn') {
                    renderOverviewCharts();
                } else if (tabId === 'bydiscipline-tab-btn') {
                    renderDisciplineCharts();
                }
            });

        // Add click listeners to summary cards and data table for showing details
        document.addEventListener('click', handleDetailsClick);



        // Add click listeners for form cards and new cards
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

            // Check if click is on the new Total Items card
            const totalItemsCard = e.target.closest('[data-card-type="total-items"]');
            if (totalItemsCard) {
                if (detailedItemsData.length > 0) {
                    const filteredItems = filterDetailedItems({ type: 'summary', status: 'TOTAL' });
                    populateDetailsModal(filteredItems, { type: 'summary', status: 'TOTAL' }, 'items');
                    itemDetailsModal.show();
                } else {
                    alert("Detailed item data not loaded yet.");
                }
            }

            // Check if click is on the new Total Forms card
            const totalFormsCard = e.target.closest('[data-card-type="total-forms"]');
            if (totalFormsCard) {
                if (hosData.length > 0) {
                    populateHOSDetailsModal(hosData.map(row => ({
                        subsystem: row.Sub_System,
                        subsystemName: row.Subsystem_Name,
                        formA: row.FormA || '',
                        formB: row.FormB || '',
                        formC: row.FormC || '',
                        formD: row.FormD || ''
                    })), 'TOTAL_FORMS', 'hos');
                    itemDetailsModal.show();
                } else {
                    alert("HOS data not loaded yet.");
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

    // Re-number the visible rows
    let visibleRowIndex = 1;
    for (const row of rows) {
        if (row.style.display !== 'none') {
            const firstCell = row.getElementsByTagName('td')[0];
            if (firstCell) {
                firstCell.textContent = visibleRowIndex++;
            }
        }
    }
}

        function handleDetailsClick(e) {
            let target = e.target;
            let statusType = null;
            let filterContext = null; // { type: 'summary', status: 'DONE' } or { type: 'table', rowData: {...}, status: 'PUNCH' } or { type: 'table', rowData: {...}, status: 'HOLD' }
             let dataType = null; // 'items' or 'punch' or 'hold'

            // Check if click is on the total items counter badge (removed, now handled by new card)

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
                                      const accessorMap = ['system', 'subsystem', 'formStatus', 'discipline', 'totalItems', 'completed', 'pending', 'punch', 'holdPoint', 'statusPercent'];
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


function isPendingStatus(status) {
    if (!status) return false;
    const s = status.trim();

    // 1. Exclude '0%' and '0'
    if (/^0[%]?$/.test(s)) return false;

    // 2. Check for specific text values (case-insensitive)
    const pendingTexts = ['face_cleaning', 'fl/dry', 'hydrotest', 'cleaning', 'line check'];
    if (pendingTexts.includes(s.toLowerCase())) return true;

    // 3. Check for digits or '%'
    return /\d/.test(s) || s.includes('%');
}

function filterDetailedItems(context) {
    let filtered = detailedItemsData;
    let modalTitle = 'Item Details';

    // --- Helper function for PENDING logic ---
    function isPendingStatus(status) {
        if (!status) return false;
        const s = status.trim();
        // Exclude '0' and '0%'
        if (/^0[%]?$/.test(s)) return false;
        // Specific text values (case-insensitive)
        const pendingTexts = ['face_cleaning', 'fl/dry', 'hydrotest', 'cleaning', 'line check'];
        if (pendingTexts.includes(s.toLowerCase())) return true;
        // Contains digit or '%'
        return /\d/.test(s) || s.includes('%');
    }

    if (context.type === 'summary') {
        // Filter based on current selected view
        if (selectedView.type === 'system' && selectedView.id) {
            const subSystemIds = processedData.systemMap[selectedView.id]?.subs.map(sub => sub.id.toLowerCase()) || [];
            filtered = filtered.filter(item => 
                item.subsystem && subSystemIds.includes(item.subsystem.toLowerCase())
            );
            modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'PENDING' ? 'Pending' : context.status === 'TOTAL' ? 'Total' : 'Remaining'} Items in System: ${selectedView.name}`;
        } else if (selectedView.type === 'subsystem' && selectedView.id) {
            filtered = filtered.filter(item => 
                item.subsystem && item.subsystem.toLowerCase() === selectedView.id.toLowerCase()
            );
            modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'PENDING' ? 'Pending' : context.status === 'TOTAL' ? 'Total' : 'Remaining'} Items in Subsystem: ${selectedView.name}`;
        } else {
            modalTitle = `${context.status === 'DONE' ? 'Completed' : context.status === 'PENDING' ? 'Pending' : context.status === 'TOTAL' ? 'Total' : 'Remaining'} Items (All Systems)`;
        }

        // Filter by status (unless TOTAL)
        if (context.status !== 'TOTAL') {
            if (context.status === 'OTHER') {
                filtered = filtered.filter(item =>
                    !item.status || (item.status.toLowerCase() !== 'done' && !isPendingStatus(item.status))
                );
            } else if (context.status === 'HOLD') {
                filtered = filtered.filter(item => item.status && item.status.toLowerCase() === 'hold');
            } else if (context.status === 'PENDING') {
                filtered = filtered.filter(item => isPendingStatus(item.status));
            } else {
                filtered = filtered.filter(item => 
                    item.status && item.status.toLowerCase() === context.status.toLowerCase()
                );
            }
        }
    } 
    else if (context.type === 'table') {
        const rowData = context.rowData;
        const clickedSubsystem = rowData.subsystem.split(' - ')[0].toLowerCase();
        const clickedDiscipline = rowData.discipline.toLowerCase();
        filtered = filtered.filter(item =>
            item.subsystem && item.subsystem.toLowerCase() === clickedSubsystem &&
            item.discipline && item.discipline.toLowerCase() === clickedDiscipline
        );

        // Filter by status (unless TOTAL)
        if (context.status !== 'TOTAL') {
            if (context.status === 'OTHER') {
                filtered = filtered.filter(item =>
                    !item.status || (item.status.toLowerCase() !== 'done' && !isPendingStatus(item.status))
                );
            } else if (context.status === 'HOLD') {
                filtered = filtered.filter(item => item.status && item.status.toLowerCase() === 'hold');
            } else if (context.status === 'PENDING') {
                // ✅ این خط مهم است: در جدول هم از منطق جدید استفاده می‌شود
                filtered = filtered.filter(item => isPendingStatus(item.status));
            } else {
                // For 'DONE' or other exact matches
                filtered = filtered.filter(item => 
                    item.status && item.status.toLowerCase() === context.status.toLowerCase()
                );
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
            fetch('https://akarimvand.github.io/SAPRA2/dbcsv/HOS.CSV')
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
            const titleMap = {
                'FORM_A': 'FORM A Details',
                'FORM_B': 'FORM B Details',
                'FORM_C': 'FORM C Details',
                'FORM_D': 'FORM D Details',
                'TOTAL_FORMS': 'Total Forms Details'
            };
            document.getElementById('itemDetailsModalLabel').textContent = titleMap[statusType] || `${statusType} Details`;
        }

        // --- Data Loading and Processing ---
        async function loadAndProcessData() {
            loadingModalInstance.show();
            DOMElements.errorMessage.style.display = 'none';

            // Unified fetch function with cache busting and retry
            const fetchCsvData = async (url, retries = 3) => {
                for (let attempt = 1; attempt <= retries; attempt++) {
                    try {
                        console.log(`Loading ${url} (attempt ${attempt}/${retries})`);
                        
                        // Add cache buster and use both local and GitHub URLs
                        const cacheBuster = '?t=' + Date.now() + '&v=' + Math.random();
                        let finalUrl = url;
                        
                        // Use GitHub Pages URL
                        if (!url.startsWith('http')) {
                            finalUrl = GITHUB_BASE_URL + url.split('/').pop() + cacheBuster;
                        } else {
                            finalUrl = url + cacheBuster;
                        }
                        
                        const response = await Promise.race([
                            fetch(finalUrl, {
                                method: 'GET',
                                cache: 'no-store',
                                headers: {
                                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                                    'Pragma': 'no-cache',
                                    'Expires': '0'
                                }
                            }),
                            new Promise((_, reject) => 
                                setTimeout(() => reject(new Error(`Timeout after 10s: ${url}`)), 10000)
                            )
                        ]);
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status} ${response.statusText}: ${url}`);
                        }
                        
                        const csvText = await response.text();
                        
                        if (!csvText || csvText.trim().length === 0) {
                            throw new Error(`Empty response from: ${url}`);
                        }
                        
                        return new Promise((resolve, reject) => {
                            Papa.parse(csvText, {
                                header: true,
                                skipEmptyLines: true,
                                complete: (results) => {
                                    if (results.errors && results.errors.length > 0) {
                                        console.warn(`Parse warnings for ${url}:`, results.errors);
                                    }
                                    if (!results.data || results.data.length === 0) {
                                        reject(new Error(`No data parsed from: ${url}`));
                                    } else {
                                        console.log(`Successfully loaded ${url}: ${results.data.length} rows`);
                                        resolve(results);
                                    }
                                },
                                error: (error) => {
                                    reject(new Error(`Parse error for ${url}: ${error.message}`));
                                }
                            });
                        });
                        
                    } catch (error) {
                        console.warn(`Attempt ${attempt} failed for ${url}:`, error.message);
                        
                        if (attempt === retries) {
                            // Last attempt failed, try local files if we were using GitHub
                            if (url.startsWith('http')) {
                                console.log(`Trying local files for ${url}`);
                                const localUrl = 'dbcsv/' + url.split('/').pop();
                                return fetchCsvData(localUrl, 1);
                            }
                            throw error;
                        }
                        
                        // Wait before retry
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                    }
                }
            };

            // Add overall timeout for the entire loading process
            const loadingTimeout = setTimeout(() => {
                console.error('Loading timeout - forcing modal hide');
                if (loadingModalInstance) {
                    loadingModalInstance.hide();
                    DOMElements.errorMessage.textContent = 'بارگذاری دیتا بیش از حد طول کشید. لطفاً صفحه را رفرش کنید.';
                    DOMElements.errorMessage.style.display = 'block';
                }
            }, 30000); // 30 second overall timeout

            try {
                console.log('Starting data loading process...');
                
                const [hosResults, dataResults, itemsResults, punchResults, holdResults] = await Promise.all([
                    fetchCsvData('dbcsv/HOS.CSV'),
                    fetchCsvData(CSV_URL),
                    fetchCsvData(ITEMS_CSV_URL),
                    fetchCsvData(PUNCH_CSV_URL),
                    fetchCsvData(HOLD_POINT_CSV_URL)
                ]);
                
                clearTimeout(loadingTimeout); // Clear timeout on success

                // --- Process HOS Data First ---
                hosData = hosResults.data; // Store full data for modal
                window.totalForms = hosResults.data.length;
                window.formCounts.formA = hosResults.data.filter(row => row.FormA && row.FormA.trim() !== '').length;
                window.formCounts.formB = hosResults.data.filter(row => row.FormB && row.FormB.trim() !== '').length;
                window.formCounts.formC = hosResults.data.filter(row => row.FormC && row.FormC.trim() !== '').length;
                window.formCounts.formD = hosResults.data.filter(row => row.FormD && row.FormD.trim() !== '').length;

                hosResults.data.forEach(row => {
                    const subSystemId = row.Sub_System?.trim();
                    if (subSystemId) {
                        if (row.FormD && row.FormD.trim() !== '') subsystemStatusMap[subSystemId] = 'D';
                        else if (row.FormC && row.FormC.trim() !== '') subsystemStatusMap[subSystemId] = 'C';
                        else if (row.FormB && row.FormB.trim() !== '') subsystemStatusMap[subSystemId] = 'B';
                        else if (row.FormA && row.FormA.trim() !== '') subsystemStatusMap[subSystemId] = 'A';
                    }
                });
                console.log("✅ All data loaded successfully!");
                console.log("📊 Data summary:", {
                    systems: Object.keys(processedData.systemMap).length,
                    subsystems: Object.keys(processedData.subSystemMap).length,
                    totalItems: aggregatedStats.totalItems,
                    detailedItems: detailedItemsData.length,
                    punchItems: punchItemsData.length,
                    holdItems: holdPointItemsData.length,
                    hosRecords: hosData.length
                });
                
                // Show success notification
                showToast('✅ Data loaded successfully!', 'success');
                showProgress(100);
                
                // Add loading progress updates
                showProgress(20); // After HOS data
                
                setTimeout(() => showProgress(40), 100); // After main data
                setTimeout(() => showProgress(60), 200); // After items data
                setTimeout(() => showProgress(80), 300); // After punch data
                setTimeout(() => showProgress(100), 400); // Complete
                
                // Announce to screen readers
                announceToScreenReader('Data has been loaded successfully');
                console.log("Subsystem statuses loaded:", subsystemStatusMap);

                // --- Process Main Data ---
                const systemMap = {};
                const subSystemMap = {};
                dataResults.data.forEach(row => {
                    if (!row.SD_System || !row.SD_Sub_System || !row.discipline) return;
                    const systemId = row.SD_System.trim();
                    const systemName = (row.SD_System_Name || 'Unknown System').trim();
                    const subId = row.SD_Sub_System.trim();
                    const subName = (row.SD_Subsystem_Name || 'Unknown Subsystem').trim();
                    const discipline = row.discipline.trim();

                    if (!systemMap[systemId]) systemMap[systemId] = { id: systemId, name: systemName, subs: [] };
                    if (!systemMap[systemId].subs.find(s => s.id === subId)) systemMap[systemId].subs.push({ id: subId, name: subName });
                    if (!subSystemMap[subId]) subSystemMap[subId] = { id: subId, name: subName, systemId: systemId, title: `${subId} - ${subName}`, disciplines: {} };

                    const total = parseInt(row["TOTAL ITEM"]) || 0;
                    const done = parseInt(row["TOTAL DONE"]) || 0;
                    const pending = parseInt(row["TOTAL PENDING"]) || 0;

                    subSystemMap[subId].disciplines[discipline] = {
                        total, done, pending,
                        punch: parseInt(row["TOTAL NOT CLEAR PUNCH"]) || 0,
                        hold: parseInt(row["TOTAL HOLD POINT"]) || 0,
                        remaining: Math.max(0, total - done - pending)
                    };
                });
                processedData = { systemMap, subSystemMap, allRawData: dataResults.data };

                // --- Process Other Detailed Data ---
                detailedItemsData = itemsResults.data.map(item => ({
                    subsystem: item.SD_Sub_System?.trim() || '', discipline: item.Discipline_Name?.trim() || '',
                    tagNo: item.ITEM_Tag_NO?.trim() || '', typeCode: item.ITEM_Type_Code?.trim() || '',
                    description: item.ITEM_Description?.trim() || '', status: item.ITEM_Status?.trim() || ''
                }));
                console.log("Detailed items data loaded:", detailedItemsData.length, "items");

                punchItemsData = punchResults.data.map(item => ({
                    SD_Sub_System: item.SD_Sub_System?.trim() || '', Discipline_Name: item.Discipline_Name?.trim() || '',
                    ITEM_Tag_NO: item.ITEM_Tag_NO?.trim() || '', ITEM_Type_Code: item.ITEM_Type_Code?.trim() || '',
                    PL_Punch_Category: item.PL_Punch_Category?.trim() || '', PL_Punch_Description: item.PL_Punch_Description?.trim() || '',
                    PL_No: item.PL_No?.trim() || ''
                }));
                console.log("Punch items data loaded:", punchItemsData.length, "items");

                holdPointItemsData = holdResults.data.map(item => ({
                    subsystem: item.SD_SUB_SYSTEM?.trim() || '', discipline: item.Discipline_Name?.trim() || '',
                    tagNo: item.ITEM_Tag_NO?.trim() || '', typeCode: item.ITEM_Type_Code?.trim() || '',
                    hpPriority: item.HP_Priority?.trim() || '', hpDescription: item.HP_Description?.trim() || '',
                    hpLocation: item.HP_Location?.trim() || ''
                }));
                console.log("Hold point items data loaded:", holdPointItemsData.length, "items");

                // Activities data will be loaded on demand (lazy loaded)

                // --- Initial Render ---
                updateView();

            } catch (e) {
                clearTimeout(loadingTimeout);
                console.error("Data loading failed:", e);
                
                let errorMessage = 'خطا در بارگذاری دیتا: ';
                
                if (e.message.includes('Timeout')) {
                    errorMessage += 'زمان بارگذاری به پایان رسید. لطفاً اتصال اینترنت خود را بررسی کنید.';
                } else if (e.message.includes('HTTP')) {
                    errorMessage += 'مشکل در دسترسی به سرور. لطفاً بعداً تلاش کنید.';
                } else if (e.message.includes('Empty') || e.message.includes('No data')) {
                    errorMessage += 'فایلهای دیتا خالی هستند. لطفاً با مدیر سیستم تماس بگیرید.';
                } else {
                    errorMessage += e.message + '. لطفاً صفحه را رفرش کنید (Ctrl+F5).';
                }
                
                // Show error toast
                showToast('❌ Data loading failed', 'error');
                showProgress(0);
                
                // Announce to screen readers
                announceToScreenReader('Data loading failed. Please try again.');
                
                document.getElementById('errorMessageText').textContent = errorMessage;
                DOMElements.errorMessage.classList.remove('d-none');
                
            } finally {
                clearTimeout(loadingTimeout);
                
                // Force hide loading modal with multiple fallback methods
                const hideModal = () => {
                    try {
                        if (loadingModalInstance && loadingModalInstance._element) {
                            loadingModalInstance.hide();
                        }
                    } catch (modalError) {
                        console.warn('Bootstrap modal hide error:', modalError);
                    }
                    
                    // Force hide by manipulating DOM directly
                    setTimeout(() => {
                        const modalEl = document.getElementById('loadingModal');
                        if (modalEl) {
                            modalEl.style.display = 'none';
                            modalEl.classList.remove('show', 'fade');
                            modalEl.setAttribute('aria-hidden', 'true');
                            modalEl.removeAttribute('aria-modal');
                        }
                        
                        // Remove backdrop
                        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                            backdrop.remove();
                        });
                        
                        // Reset body classes
                        document.body.classList.remove('modal-open');
                        document.body.style.overflow = '';
                        document.body.style.paddingRight = '';
                    }, 100);
                };
                
                hideModal();
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

                let iconHTML = node.icon || '';
                if (node.type === 'subsystem' && subsystemStatusMap[node.id]) {
                    const status = subsystemStatusMap[node.id];
                    iconHTML = `<span class="status-indicator-icon status-${status.toLowerCase()}" title="Status: ${status}">${status}</span>`;
                }

                return `
                    <div id="${nodeId}" class="tree-node ${isSelected ? 'selected' : ''} ${isOpen ? 'open' : ''}"
                         role="treeitem" aria-selected="${isSelected}" ${hasChildren ? `aria-expanded="${isExpanded}"` : ''}
                         data-type="${node.type}" data-id="${node.id}" data-name="${node.name}"
                         data-parent-id="${parentId || ''}" style="padding-left: ${paddingLeft}px;" tabindex="${isSelected || (level === 0 && !document.querySelector('.tree-node.selected')) ? '0' : '-1'}">
                        ${iconHTML}
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
                         if (window.innerWidth < 992) { // On mobile
                            // Only close sidebar if a leaf node (subsystem or all) is selected
                            if (type === 'subsystem' || type === 'all') {
                                DOMElements.sidebar.classList.remove('open');
                                DOMElements.mainContent.classList.remove('sidebar-open');
                                DOMElements.sidebarOverlay.style.display = 'none';
                                DOMElements.sidebarToggle.setAttribute('aria-expanded', 'false');
                            }
                        }
                    }
                });
            });
        }

        function handleNodeSelect(type, id, name, parentId = null) {
            selectedView = { type, id, name, parentId };
            
            // Update breadcrumb
            const breadcrumbPath = ['All Systems'];
            if (type === 'system') {
                breadcrumbPath.push(name);
            } else if (type === 'subsystem') {
                const system = processedData.systemMap[parentId];
                if (system) breadcrumbPath.push(system.name);
                breadcrumbPath.push(name);
            }
            updateBreadcrumb(breadcrumbPath);
            
            // Announce to screen readers
            announceToScreenReader(`Selected ${type}: ${name}`);
            
            updateView();

            // Send message to workflow iframe
            const iframe = document.querySelector('#workflow-tab-pane iframe');
            if (iframe) {
                if (type === 'subsystem') {
                    iframe.contentWindow.postMessage({type: 'subsystemSelection', subsystemCode: id}, '*');
                } else {
                    iframe.contentWindow.postMessage({type: 'clearDashboard'}, '*');
                }
            }
        }

        function updateView() {
            aggregatedStats = _aggregateStatsForView(selectedView, processedData.systemMap, processedData.subSystemMap);

            // DOMElements.totalItemsCounter.textContent = aggregatedStats.totalItems.toLocaleString(); // Removed, now shown in card

            renderSummaryCards();
            renderOverviewCharts(); // Render the initial overview chart
            
            // Check if By Discipline tab is currently active and render it
            const byDisciplineTab = document.getElementById('bydiscipline-tab-btn');
            if (byDisciplineTab && byDisciplineTab.classList.contains('active')) {
                renderDisciplineCharts();
            }
            
            renderDataTable();
            renderSidebar();
            if (loadingModalInstance) {
                loadingModalInstance.hide();
            }
        }

        function renderSummaryCards() {
            let row1HTML = '';
            let row2HTML = '';

            // New Total Items card (left of Completed)
            const totalItemsCard = { title: 'Total Items', count: aggregatedStats.totalItems, baseClass: 'bg-white', icon: ICONS.Collection, iconWrapperBgClass: 'bg-primary-subtle', iconColorClass: 'text-primary', countColor: 'text-primary', titleColor: 'text-muted', desc: 'Total items of Selected Subsystem' };
            row1HTML += `
                <div class="col">
                    <section class="card summary-card shadow-sm ${totalItemsCard.baseClass}" aria-labelledby="summary-title-${totalItemsCard.title.toLowerCase().replace(' ','-')}" data-card-type="total-items">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 id="summary-title-${totalItemsCard.title.toLowerCase().replace(' ','-')}" class="card-title-custom fw-medium ${totalItemsCard.titleColor}">${totalItemsCard.title}</h6>
                                <span class="icon-wrapper ${totalItemsCard.iconWrapperBgClass} ${totalItemsCard.iconColorClass}" aria-hidden="true">${totalItemsCard.icon}</span>
                            </div>
                            <h3 class="count-display ${totalItemsCard.countColor} mb-1">${totalItemsCard.count.toLocaleString()}</h3>
                            <small class="d-block mt-2 text-muted" style="color: #6c757d !important;">${totalItemsCard.desc}</small>
                        </div>
                    </section>
                </div>`;

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

            // New Total Forms card (similar to form cards, placed to the left of FORM A)
            const totalFormsCount = window.totalForms || 0;
            const totalFormsCard = { title: 'TOTAL FORMS', count: totalFormsCount, gradientClass: 'gradient-total-forms animated-gradient', icon: ICONS.FileEarmarkText, desc: 'The total number of subsystems that require handover' };
            row2HTML += `
                <div class="col">
                    <section class="card summary-card shadow-sm ${totalFormsCard.gradientClass}" aria-labelledby="summary-title-${totalFormsCard.title.toLowerCase().replace(' ','-')}" data-card-type="total-forms">
                        <div class="card-body text-white">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <h6 id="summary-title-${totalFormsCard.title.toLowerCase().replace(' ','-')}" class="card-title-custom">${totalFormsCard.title}</h6>
                                <span class="icon-wrapper" style="background-color: rgba(0,0,0,0.2);" aria-hidden="true">${totalFormsCard.icon}</span>
                            </div>
                            <h3 class="count-display mb-1">${totalFormsCard.count.toLocaleString()}</h3>
                            <small class="d-block mt-2 text-white" style="color: #fff !important;">${totalFormsCard.desc}</small>
                        </div>
                    </section>
                </div>`;

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
chartInstances.overview = new Chart(overviewCtx, {
    type: 'doughnut',
    data: overviewChartData,
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const value = context.parsed;
                        const total = aggregatedStats.totalItems;
                        const percent = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${context.label}: ${value.toLocaleString()} (${percent}%)`;
                    }
                }
            }
        }
    }
});            }
        }

        function renderDisciplineCharts() {
            const container = DOMElements.disciplineChartsContainer;
            container.innerHTML = '';

            // Collect discipline data based on selected view
            let disciplineData = {};
            
            if (selectedView.type === 'all') {
                // Aggregate all disciplines across all subsystems
                Object.values(processedData.subSystemMap).forEach(subSystem => {
                    Object.entries(subSystem.disciplines).forEach(([disciplineName, data]) => {
                        if (!disciplineData[disciplineName]) {
                            disciplineData[disciplineName] = { total: 0, done: 0, pending: 0, punch: 0, hold: 0, remaining: 0 };
                        }
                        disciplineData[disciplineName].total += data.total;
                        disciplineData[disciplineName].done += data.done;
                        disciplineData[disciplineName].pending += data.pending;
                        disciplineData[disciplineName].punch += data.punch;
                        disciplineData[disciplineName].hold += data.hold;
                        disciplineData[disciplineName].remaining += data.remaining;
                    });
                });
            } else if (selectedView.type === 'system' && selectedView.id) {
                // Aggregate disciplines for selected system
                const system = processedData.systemMap[selectedView.id];
                if (system) {
                    system.subs.forEach(subRef => {
                        const subSystem = processedData.subSystemMap[subRef.id];
                        if (subSystem) {
                            Object.entries(subSystem.disciplines).forEach(([disciplineName, data]) => {
                                if (!disciplineData[disciplineName]) {
                                    disciplineData[disciplineName] = { total: 0, done: 0, pending: 0, punch: 0, hold: 0, remaining: 0 };
                                }
                                disciplineData[disciplineName].total += data.total;
                                disciplineData[disciplineName].done += data.done;
                                disciplineData[disciplineName].pending += data.pending;
                                disciplineData[disciplineName].punch += data.punch;
                                disciplineData[disciplineName].hold += data.hold;
                                disciplineData[disciplineName].remaining += data.remaining;
                            });
                        }
                    });
                }
            } else if (selectedView.type === 'subsystem' && selectedView.id) {
                // Use disciplines from selected subsystem
                const subSystem = processedData.subSystemMap[selectedView.id];
                if (subSystem) {
                    disciplineData = subSystem.disciplines;
                }
            }

            // Check if we have any discipline data
            if (Object.keys(disciplineData).length === 0) {
                container.innerHTML = `<div class="col-12 text-center py-5 text-muted" role="status">${ICONS.PieChartIcon}<p class="mt-2">No discipline data available for the current selection.</p></div>`;
                return;
            }

            const row = document.createElement('div');
            row.className = 'row g-3';

            Object.entries(disciplineData).forEach(([name, data]) => {
                const col = document.createElement('div');
                col.className = 'col-12 col-md-6 col-lg-4 col-xl-3';
                const chartId = `disciplineChart-${name.replace(/\s+/g, '-')}`;
                const chartLabel = `${name} status for ${selectedView.name}`;
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

        function renderDataTable() {
            const columns = [
                { header: 'System', accessor: 'system' }, { header: 'Subsystem', accessor: 'subsystem' }, { header: 'Form', accessor: 'formStatus' },
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
                        } else if (col.accessor === 'formStatus') {
                            const status = row.formStatus;
                            if (status) {
                                cellValue = `<span class="status-indicator-icon status-${status.toLowerCase()}" title="Status: ${status}">${status}</span>`;
                            } else {
                                cellValue = '';
                            }
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
                const subSystemId = row.SD_Sub_System.trim();
                const totalItems = parseInt(row["TOTAL ITEM"]) || 0;
                const completed = parseInt(row["TOTAL DONE"]) || 0;
                return {
                    system: row.SD_System.trim(),
                    systemName: (row.SD_System_Name || 'N/A').trim(),
                    subsystem: subSystemId,
                    subsystemName: (row.SD_Subsystem_Name || 'N/A').trim(),
                    formStatus: subsystemStatusMap[subSystemId] || '',
                    discipline: row.discipline.trim(),
                    totalItems,
                    completed,
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
                const baseUrl = 'https://akarimvand.github.io/SAPRA2/dbcsv/';

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
            const tableBody = document.getElementById('itemDetailsTableBody');
            const visibleRows = Array.from(tableBody.querySelectorAll('tr')).filter(row => row.style.display !== 'none');

            if (visibleRows.length === 0) {
                alert("No visible data to export.");
                return;
            }

            // Get current date for filename
            const currentDate = new Date().toISOString().split('T')[0];
            const modalTitle = document.getElementById('itemDetailsModalLabel').textContent
                .replace(/[^a-zA-Z0-9 ]/g, '')
                .replace(/ /g, '_');

            // Get headers from the table header
            const headerRow = document.getElementById('itemDetailsModalHeader');
            const headers = Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent);

            // Get data from visible rows only
            const data = visibleRows.map(row =>
                Array.from(row.querySelectorAll('td')).map(td => td.textContent)
            );

            const exportConfig = {
                fileName: `SAPRA_Export_${modalTitle || 'Details'}_${currentDate}.xlsx`,
                sheetName: 'Exported Data',
                headers: headers,
                data: data
            };

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
                alert(`Error exporting data: ${error.message}`);
            }
        }

        async function loadActivitiesForTag(tagNo) {
            document.getElementById('activitiesTagTitle').textContent = `فعالیت‌ها برای: ${tagNo}`;

            // Lazy load activities data if not already loaded
            if (!activitiesLoaded) {
                try {
                    const response = await fetch(ACTIVITIES_CSV_URL);
                    if (!response.ok) throw new Error(`Network response was not ok for ${ACTIVITIES_CSV_URL}`);
                    const csvText = await response.text();
                    Papa.parse(csvText, {
                        header: true,
                        skipEmptyLines: true,
                        complete: (results) => {
                            activitiesData = results.data.map(item => ({
                                Tag_No: item.Tag_No?.trim() || '',
                                Form_Title: item.Form_Title?.trim() || '',
                                Done: item.Done?.trim() || ''
                            }));
                            activitiesLoaded = true;
                            console.log("Activities data loaded:", activitiesData.length, "items");
                            // Now process the tag
                            processActivitiesForTag(tagNo);
                        },
                        error: (err) => {
                            console.error("PapaParse error for ACTIVITIES CSV:", err);
                            // Show error in modal
                            const list = document.getElementById('activitiesList');
                            list.innerHTML = '<tr><td colspan="3" class="no-activities">خطا در بارگذاری داده‌ها.</td></tr>';
                            document.getElementById('activitiesProgressText').textContent = '0%';
                            document.getElementById('activitiesProgressFill').style.width = '0%';
                        }
                    });
                } catch (error) {
                    console.error("Error loading ACTIVITIES CSV:", error);
                    // Show error in modal
                    const list = document.getElementById('activitiesList');
                    list.innerHTML = '<tr><td colspan="3" class="no-activities">خطا در بارگذاری داده‌ها.</td></tr>';
                    document.getElementById('activitiesProgressText').textContent = '0%';
                    document.getElementById('activitiesProgressFill').style.width = '0%';
                }
            } else {
                // Data already loaded, process directly
                processActivitiesForTag(tagNo);
            }
        }

        function processActivitiesForTag(tagNo) {
            const filtered = activitiesData.filter(a => a.Tag_No === tagNo);
            const list = document.getElementById('activitiesList');
            list.innerHTML = '';
            let doneCount = 0;

            if (filtered.length === 0) {
                list.innerHTML = '<tr><td colspan="3" class="no-activities">No activities found for this Tag No.</td></tr>';
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

        });
    })();
