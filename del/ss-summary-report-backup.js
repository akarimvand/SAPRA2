let allData = [], itemsData = [], punchData = [], activitiesData = [];
let selectedView = { type: 'all', id: 'all', name: 'All Systems' };
const itemDetailsModal = new bootstrap.Modal(document.getElementById('itemDetailsModal'));
const activitiesModal = new bootstrap.Modal(document.getElementById('activitiesModal'));

// Listen for sidebar selection from parent window
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'sidebarSelection') {
        selectedView = event.data.view;
        renderReport();
    }
});

Promise.all([
    fetch('dbcsv/SS-SUMMARY-REPORT.csv').then(r => r.text()),
    fetch('dbcsv/ITEMS.CSV').then(r => r.text()),
    fetch('dbcsv/PUNCH.CSV').then(r => r.text()),
    fetch('dbcsv/ACTIVITES.CSV').then(r => r.text())
]).then(([csv1, csv2, csv3, csv4]) => {
    allData = Papa.parse(csv1, { header: true, skipEmptyLines: true }).data.filter(row => row.SD_Sub_System);
    itemsData = Papa.parse(csv2, { header: true, skipEmptyLines: true }).data.filter(row => row.SD_Sub_System).map(item => ({
        subsystem: item.SD_Sub_System?.trim() || '',
        discipline: item.Discipline_Name?.trim() || '',
        tagNo: item.ITEM_Tag_NO?.trim() || '',
        typeCode: item.ITEM_Type_Code?.trim() || '',
        description: item.ITEM_Description?.trim() || '',
        status: item.ITEM_Status?.trim() || ''
    }));
    punchData = Papa.parse(csv3, { header: true, skipEmptyLines: true }).data.filter(row => row.SD_Sub_System).map(item => ({
        SD_Sub_System: item.SD_Sub_System?.trim() || '',
        Discipline_Name: item.Discipline_Name?.trim() || '',
        ITEM_Tag_NO: item.ITEM_Tag_NO?.trim() || '',
        ITEM_Type_Code: item.ITEM_Type_Code?.trim() || '',
        PL_Punch_Category: item.PL_Punch_Category?.trim() || '',
        PL_Punch_Description: item.PL_Punch_Description?.trim() || '',
        PL_No: item.PL_No?.trim() || ''
    }));
    activitiesData = Papa.parse(csv4, { header: true, skipEmptyLines: true }).data.map(item => ({
        Tag_No: item.Tag_No?.trim() || '',
        Form_Title: item.Form_Title?.trim() || '',
        Done: item.Done?.trim() || ''
    }));
    renderReport();
});

function renderReport() {
    let filteredData = allData;
    
    // Filter based on selectedView
    if (selectedView.type === 'system' && selectedView.id) {
        filteredData = allData.filter(row => {
            if (!row.SD_Sub_System) return false;
            const systemCode = row.SD_Sub_System.split('-')[0].trim();
            return systemCode === selectedView.id;
        });
    } else if (selectedView.type === 'subsystem' && selectedView.id) {
        filteredData = allData.filter(row => row.SD_Sub_System && row.SD_Sub_System.trim() === selectedView.id);
    }
    
    const categories = { 'Above 70%': [], '50% to 70%': [], '25% to 50%': [], 'Below 25%': [] };
    filteredData.forEach(row => { if (categories[row.Progress_Category]) categories[row.Progress_Category].push(row); });
    
    const totalSystems = filteredData.length;
    let reportHTML = '<div class="matrix-container">';
    reportHTML += `<div class="matrix-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; cursor: pointer; transition: transform 0.2s;" onclick="filterByCategory('Above 70%')" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
        <h3 style="color: white;">Above 70%</h3>
        <div class="count" style="color: white;">${categories['Above 70%'].length}</div>
        <div class="percentage" style="color: rgba(255,255,255,0.9);">${((categories['Above 70%'].length / totalSystems) * 100).toFixed(1)}% of Total</div>
        <small style="color: rgba(255,255,255,0.8); font-size: 10px; display: block; margin-top: 8px;">Excellent Progress</small>
    </div>`;
    reportHTML += `<div class="matrix-card" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; cursor: pointer; transition: transform 0.2s;" onclick="filterByCategory('50% to 70%')" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
        <h3 style="color: white;">50% to 70%</h3>
        <div class="count" style="color: white;">${categories['50% to 70%'].length}</div>
        <div class="percentage" style="color: rgba(255,255,255,0.9);">${((categories['50% to 70%'].length / totalSystems) * 100).toFixed(1)}% of Total</div>
        <small style="color: rgba(255,255,255,0.8); font-size: 10px; display: block; margin-top: 8px;">Good Progress</small>
    </div>`;
    reportHTML += `<div class="matrix-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; cursor: pointer; transition: transform 0.2s;" onclick="filterByCategory('25% to 50%')" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
        <h3 style="color: white;">25% to 50%</h3>
        <div class="count" style="color: white;">${categories['25% to 50%'].length}</div>
        <div class="percentage" style="color: rgba(255,255,255,0.9);">${((categories['25% to 50%'].length / totalSystems) * 100).toFixed(1)}% of Total</div>
        <small style="color: rgba(255,255,255,0.8); font-size: 10px; display: block; margin-top: 8px;">Needs Attention</small>
    </div>`;
    reportHTML += `<div class="matrix-card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; cursor: pointer; transition: transform 0.2s;" onclick="filterByCategory('Below 25%')" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
        <h3 style="color: white;">Below 25%</h3>
        <div class="count" style="color: white;">${categories['Below 25%'].length}</div>
        <div class="percentage" style="color: rgba(255,255,255,0.9);">${((categories['Below 25%'].length / totalSystems) * 100).toFixed(1)}% of Total</div>
        <small style="color: rgba(255,255,255,0.8); font-size: 10px; display: block; margin-top: 8px;">Critical Status</small>
    </div>`;
    reportHTML += '</div>';
    reportHTML += '<div class="action-buttons"><button class="btn-action" onclick="printExecutiveSummary()"><i class="bi bi-file-earmark-text-fill"></i>Executive Summary</button><button class="btn-action" onclick="printGroupedReport()"><i class="bi bi-printer-fill"></i>Detailed Report</button></div>';
    
    filteredData.sort((a, b) => (a.SD_Sub_System || '').localeCompare(b.SD_Sub_System || ''));
    
    reportHTML += '<table class="data-table" id="mainTable"><thead><tr>';
    reportHTML += '<th>Row</th><th class="sortable" data-col="1">Subsystem</th><th class="sortable" data-col="2">Total Items</th>';
    reportHTML += '<th class="sortable" data-col="3">Completed</th><th class="sortable" data-col="4">Remaining</th><th class="sortable" data-col="5">Progress</th>';
    reportHTML += '<th class="sortable" data-col="6">Total Punch</th><th class="sortable" data-col="7">Cleared Punch</th><th class="sortable" data-col="8">Remaining Punch</th>';
    reportHTML += '<th class="sortable" data-col="9">PUNCH-A</th><th class="sortable" data-col="10">PUNCH-B</th><th class="sortable" data-col="11">PUNCH-C</th>';
    reportHTML += '<th>Completion Steps<br><div style="margin-top:5px;"><span class="filter-step filter-a" onclick="filterByFormHeader(\'A\', \'1\')">A</span><span class="filter-step filter-b" onclick="filterByFormHeader(\'B\', \'1\')">B</span><span class="filter-step filter-c" onclick="filterByFormHeader(\'C\', \'1\')">C</span><span class="filter-step filter-d" onclick="filterByFormHeader(\'D\', \'1\')">D</span><span class="filter-step filter-none" onclick="filterByFormHeader(\'none\', \'0\')">✕</span><span class="filter-step filter-reset" onclick="resetFormFilter()" title="Reset Filter">↻</span></div></th></tr><tr class="no-print"><th></th>';
    for (let i = 1; i <= 11; i++) reportHTML += `<th><input type="text" class="filter-input" data-col="${i}" placeholder="Filter..."></th>`;
    reportHTML += '<th></th></tr></thead><tbody>';
    
    filteredData.forEach((row, idx) => {
        const progress = parseFloat(row.Progress_Percentage) || 0;
        const remaining = Math.max(0, parseInt(row.Total_Items || 0) - parseInt(row.Total_Done || 0) - parseInt(row.Total_Pending || 0));
        reportHTML += `<tr data-category="${row.Progress_Category}"><td>${idx + 1}</td><td><strong>${row.SD_Sub_System}</strong></td>`;
        reportHTML += `<td><span class="clickable" onclick="showItems('${row.SD_Sub_System}', 'all')">${parseInt(row.Total_Items || 0).toLocaleString()}</span></td>`;
        reportHTML += `<td><span class="clickable" onclick="showItems('${row.SD_Sub_System}', 'done')">${parseInt(row.Total_Done || 0).toLocaleString()}</span></td>`;
        reportHTML += `<td><span class="clickable" onclick="showItems('${row.SD_Sub_System}', 'remaining')">${remaining.toLocaleString()}</span></td>`;
        reportHTML += `<td><div class="progress-bar-custom"><div class="progress-fill" style="width: ${progress}%">${progress.toFixed(1)}%</div></div></td>`;
        reportHTML += `<td><span class="clickable" onclick="showPunch('${row.SD_Sub_System}', 'all')">${parseInt(row.Total_Punch || 0).toLocaleString()}</span></td>`;
        reportHTML += `<td><span class="clickable" onclick="showPunch('${row.SD_Sub_System}', 'clear')">${parseInt(row.Total_Clear_Punch || 0).toLocaleString()}</span></td>`;
        reportHTML += `<td><span class="clickable" onclick="showPunch('${row.SD_Sub_System}', 'notclear')">${parseInt(row.Total_Not_Clear_Punch || 0).toLocaleString()}</span></td>`;
        reportHTML += `<td><span class="punch-badge punch-a" onclick="showPunch('${row.SD_Sub_System}', 'A')">⚠ ${row['PUNCH-A'] || 0}</span></td>`;
        reportHTML += `<td><span class="punch-badge punch-b" onclick="showPunch('${row.SD_Sub_System}', 'B')">⚠ ${row['PUNCH-B'] || 0}</span></td>`;
        reportHTML += `<td><span class="punch-badge punch-c" onclick="showPunch('${row.SD_Sub_System}', 'C')">ℹ ${row['PUNCH-C'] || 0}</span></td>`;
        reportHTML += '<td><div class="step-indicator">';
        reportHTML += `<div class="step step-a ${row.FormA == '1' ? 'completed' : ''}" onclick="filterByForm('A', '${row.FormA}')"></div>`;
        reportHTML += `<div class="step-line ${row.FormB == '1' ? 'completed' : ''}"></div>`;
        reportHTML += `<div class="step step-b ${row.FormB == '1' ? 'completed' : ''}" onclick="filterByForm('B', '${row.FormB}')"></div>`;
        reportHTML += `<div class="step-line ${row.FormC == '1' ? 'completed' : ''}"></div>`;
        reportHTML += `<div class="step step-c ${row.FormC == '1' ? 'completed' : ''}" onclick="filterByForm('C', '${row.FormC}')"></div>`;
        reportHTML += `<div class="step-line ${row.FormD == '1' ? 'completed' : ''}"></div>`;
        reportHTML += `<div class="step step-d ${row.FormD == '1' ? 'completed' : ''}" onclick="filterByForm('D', '${row.FormD}')"></div>`;
        reportHTML += '</div></td></tr>';
    });
    
    reportHTML += '</tbody></table>';
    document.getElementById('reportContent').innerHTML = reportHTML;
    
    const subsystemHeader = document.querySelector('.sortable[data-col="1"]');
    if (subsystemHeader) subsystemHeader.classList.add('asc');
    
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', function() {
            const tbody = document.querySelector('#mainTable tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const col = parseInt(this.dataset.col);
            const isAsc = this.classList.contains('asc');
            
            document.querySelectorAll('.sortable').forEach(h => h.classList.remove('asc', 'desc'));
            this.classList.add(isAsc ? 'desc' : 'asc');
            
            rows.sort((a, b) => {
                const aVal = a.cells[col].textContent.trim();
                const bVal = b.cells[col].textContent.trim();
                const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
                const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));
                
                if (!isNaN(aNum) && !isNaN(bNum)) return isAsc ? bNum - aNum : aNum - bNum;
                return isAsc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
            });
            
            rows.forEach(row => tbody.appendChild(row));
        });
    });
    
    document.querySelectorAll('.filter-input').forEach(input => {
        input.addEventListener('input', function() {
            const tbody = document.querySelector('#mainTable tbody');
            const col = parseInt(this.dataset.col);
            const filter = this.value.toLowerCase();
            const numericCols = [2, 3, 4, 6, 7, 8, 9, 10, 11];
            
            tbody.querySelectorAll('tr').forEach(row => {
                const cell = row.cells[col];
                const text = cell.textContent.toLowerCase();
                const cleanText = text.replace(/,/g, '');
                
                if (numericCols.includes(col)) {
                    if (cleanText === filter || filter === '') delete row.dataset['colFilter' + col];
                    else row.dataset['colFilter' + col] = 'hide';
                } else {
                    if (text.includes(filter)) delete row.dataset['colFilter' + col];
                    else row.dataset['colFilter' + col] = 'hide';
                }
            });
            applyAllFilters();
        });
    });
}

function filterByCategory(category) {
    const tbody = document.querySelector('#mainTable tbody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        if (category === 'all' || row.dataset.category === category) {
            delete row.dataset.categoryFilter;
        } else {
            row.dataset.categoryFilter = 'hide';
        }
    });
    applyAllFilters();
}

function filterByForm(form, status) {
    const tbody = document.querySelector('#mainTable tbody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const stepIndicator = row.querySelector('.step-' + form.toLowerCase());
        if (stepIndicator) {
            const isCompleted = stepIndicator.classList.contains('completed');
            row.style.display = (status === '1' && isCompleted) || (status === '0' && !isCompleted) ? '' : 'none';
        }
    });
}

function filterByFormHeader(form, status) {
    const tbody = document.querySelector('#mainTable tbody');
    const rows = tbody.querySelectorAll('tr');
    if (form === 'none') {
        rows.forEach(row => {
            const hasAny = row.querySelector('.step-a.completed') || row.querySelector('.step-b.completed') || row.querySelector('.step-c.completed') || row.querySelector('.step-d.completed');
            if (hasAny) row.dataset.formFilter = 'hide';
            else delete row.dataset.formFilter;
        });
    } else {
        rows.forEach(row => {
            const stepIndicator = row.querySelector('.step-' + form.toLowerCase());
            if (stepIndicator) {
                const isCompleted = stepIndicator.classList.contains('completed');
                if (!isCompleted) row.dataset.formFilter = 'hide';
                else delete row.dataset.formFilter;
            }
        });
    }
    applyAllFilters();
}

function resetFormFilter() {
    const tbody = document.querySelector('#mainTable tbody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        delete row.dataset.formFilter;
        delete row.dataset.categoryFilter;
        for (let i = 1; i <= 11; i++) {
            delete row.dataset['colFilter' + i];
        }
    });
    applyAllFilters();
}

function applyAllFilters() {
    const tbody = document.querySelector('#mainTable tbody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        let shouldHide = false;
        for (let key in row.dataset) {
            if (row.dataset[key] === 'hide') {
                shouldHide = true;
                break;
            }
        }
        row.style.display = shouldHide ? 'none' : '';
    });
}

function printGroupedReport() {
    const tbody = document.querySelector('#mainTable tbody');
    const visibleRows = Array.from(tbody.querySelectorAll('tr')).filter(row => row.style.display !== 'none');
    
    if (visibleRows.length === 0) {
        alert('No data to print');
        return;
    }
    
    const categories = {'Above 70%': [], '50% to 70%': [], '25% to 50%': [], 'Below 25%': []};
    visibleRows.forEach(row => {
        const cat = row.dataset.category;
        if (categories[cat]) {
            categories[cat].push({
                subsystem: row.cells[1].textContent,
                totalItems: row.cells[2].textContent,
                completed: row.cells[3].textContent,
                remaining: row.cells[4].textContent,
                progress: row.cells[5].textContent.trim(),
                totalPunch: row.cells[6].textContent,
                clearedPunch: row.cells[7].textContent,
                remainingPunch: row.cells[8].textContent,
                punchA: row.cells[9].textContent,
                punchB: row.cells[10].textContent,
                punchC: row.cells[11].textContent
            });
        }
    });
    
    const currentDate = new Date().toLocaleString();
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    let printContent = '<!DOCTYPE html><html><head><title>Subsystem Summary Report</title><style>@page { size: A4 landscape; margin: 15mm; }body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding-top: 10px; color: #000; }.page-break { page-break-before: always; }.header { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding: 15px 0; position: relative; min-height: 70px; }.header img { position: absolute; left: 0; height: 60px; top: 50%; transform: translateY(-50%); }.header-content { text-align: center; }.header h2 { margin: 5px 0; font-size: 18px; }.header p { margin: 3px 0; font-size: 11px; }.category-title { font-size: 16px; font-weight: bold; text-align: center; margin: 15px 0; padding: 8px; background: #e0e0e0; border: 2px solid #000; }table { width: 100%; border-collapse: collapse; margin: 0 auto 20px; }th, td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 11px; }th { background-color: #d0d0d0; font-weight: bold; }tr:nth-child(even) { background-color: #f5f5f5; }</style></head><body>';
    
    const categoryOrder = ['Above 70%', '50% to 70%', '25% to 50%', 'Below 25%'];
    let isFirstCategory = true;
    categoryOrder.forEach(cat => {
        if (categories[cat].length > 0) {
            printContent += '<div class="' + (isFirstCategory ? '' : 'page-break') + '">';
            printContent += '<div class="header"><img src="https://raw.githubusercontent.com/akarimvand/SAPRA2/main/images/SAPRA.png" alt="SAPRA"><div class="header-content"><h2>SAPRA - Subsystem Summary Report</h2><p>Generated on: ' + currentDate + '</p></div></div>';
            printContent += '<div class="category-title">Progress Category: ' + cat + '</div>';
            printContent += '<table><thead><tr><th>Row</th><th>Subsystem</th><th>Total Items</th><th>Completed</th><th>Remaining</th><th>Progress</th><th>Total Punch</th><th>Cleared Punch</th><th>Remaining Punch</th><th>PUNCH-A</th><th>PUNCH-B</th><th>PUNCH-C</th></tr></thead><tbody>';
            categories[cat].forEach((item, idx) => {
                printContent += '<tr><td>' + (idx + 1) + '</td><td>' + item.subsystem + '</td><td>' + item.totalItems + '</td><td>' + item.completed + '</td><td>' + item.remaining + '</td><td>' + item.progress + '</td><td>' + item.totalPunch + '</td><td>' + item.clearedPunch + '</td><td>' + item.remainingPunch + '</td><td>' + item.punchA + '</td><td>' + item.punchB + '</td><td>' + item.punchC + '</td></tr>';
            });
            printContent += '</tbody></table></div>';
            isFirstCategory = false;
        }
    });
    
    printContent += '<script>window.onload = function() { window.print(); }<\/script></body></html>';
    printWindow.document.write(printContent);
    printWindow.document.close();
}

function showItems(subsystem, type) {
    const filtered = itemsData.filter(item => item.subsystem === subsystem);
    let items = filtered;
    let title = `Items - ${subsystem}`;
    
    function isPendingStatus(status) {
        if (!status) return false;
        const s = status.trim();
        if (/^0[%]?$/.test(s)) return false;
        const pendingTexts = ['face_cleaning', 'fl/dry', 'hydrotest', 'cleaning', 'line check'];
        if (pendingTexts.includes(s.toLowerCase())) return true;
        return /\d/.test(s) || s.includes('%');
    }
    
    if (type === 'done') {
        items = filtered.filter(item => item.status && item.status.toLowerCase() === 'done');
        title = `Completed Items - ${subsystem}`;
    } else if (type === 'remaining') {
        items = filtered.filter(item => !item.status || (item.status.toLowerCase() !== 'done' && !isPendingStatus(item.status)));
        title = `Remaining Items - ${subsystem}`;
    }
    
    items.sort((a, b) => {
        const discComp = a.discipline.localeCompare(b.discipline);
        return discComp !== 0 ? discComp : a.tagNo.localeCompare(b.tagNo);
    });
    
    document.getElementById('itemDetailsModalLabel').textContent = title;
    const headers = ['#', 'Subsystem', 'Discipline', 'Tag No', 'Type', 'Description', 'Status'];
    document.getElementById('itemDetailsModalHeader').innerHTML = headers.map(h => `<th>${h}</th>`).join('');
    document.getElementById('modal-filter-row').innerHTML = headers.map((h, i) => `<th>${i === 0 ? '' : '<input type="text" class="form-control form-control-sm" placeholder="Filter...">'}</th>`).join('');
    
    const disciplineNames = {'BD': 'BUILDING', 'CV': 'CIVIL', 'EL': 'ELECTRICAL', 'HV': 'HVAC', 'IN': 'INSTRUMENT', 'MER': 'MECHANICAL(ROTARY)', 'MES': 'MECHANICAL(STATIC)', 'PI': 'PIPING', 'PT': 'PAINT & INSULATION', 'ST': 'STRUCTURE'};
    let html = '';
    let currentDisc = '';
    let rowNum = 0;
    items.forEach((item, idx) => {
        if (item.discipline !== currentDisc) {
            currentDisc = item.discipline;
            rowNum = 0;
            const discName = disciplineNames[currentDisc] || currentDisc;
            html += `<tr style="background: #000 !important;"><td colspan="7" style="font-weight: bold; text-align: left; padding: 8px; color: #fff !important; background: #000 !important;">${currentDisc} - ${discName}</td></tr>`;
        }
        rowNum++;
        html += `<tr><td>${rowNum}</td><td>${item.subsystem}</td><td>${item.discipline}</td><td><button class="tag-no-btn" onclick="showActivities('${item.tagNo}')">${item.tagNo}</button></td><td>${item.typeCode}</td><td style="direction: rtl; text-align: right;">${item.description}</td><td>${item.status}</td></tr>`;
    });
    document.getElementById('itemDetailsTableBody').innerHTML = html;
    document.getElementById('noDetailsMessage').style.display = items.length === 0 ? 'block' : 'none';
    itemDetailsModal.show();
}

function showPunch(subsystem, type) {
    const filtered = punchData.filter(punch => punch.SD_Sub_System === subsystem);
    let punches = filtered;
    let title = `Punch List - ${subsystem}`;
    
    if (type === 'A' || type === 'B' || type === 'C') {
        punches = filtered.filter(p => p.PL_Punch_Category === type);
        title = `Punch Category ${type} - ${subsystem}`;
    }
    
    punches.sort((a, b) => {
        const discComp = a.Discipline_Name.localeCompare(b.Discipline_Name);
        return discComp !== 0 ? discComp : a.ITEM_Tag_NO.localeCompare(b.ITEM_Tag_NO);
    });
    
    document.getElementById('itemDetailsModalLabel').textContent = title;
    const headers = ['#', 'Subsystem', 'Discipline', 'Tag No', 'Type', 'Category', 'Description', 'PL No'];
    document.getElementById('itemDetailsModalHeader').innerHTML = headers.map(h => `<th>${h}</th>`).join('');
    document.getElementById('modal-filter-row').innerHTML = headers.map((h, i) => `<th>${i === 0 ? '' : '<input type="text" class="form-control form-control-sm" placeholder="Filter...">'}</th>`).join('');
    
    const disciplineNames = {'BD': 'BUILDING', 'CV': 'CIVIL', 'EL': 'ELECTRICAL', 'HV': 'HVAC', 'IN': 'INSTRUMENT', 'MER': 'MECHANICAL(ROTARY)', 'MES': 'MECHANICAL(STATIC)', 'PI': 'PIPING', 'PT': 'PAINT & INSULATION', 'ST': 'STRUCTURE'};
    let html = '';
    let currentDisc = '';
    let rowNum = 0;
    punches.forEach((punch, idx) => {
        if (punch.Discipline_Name !== currentDisc) {
            currentDisc = punch.Discipline_Name;
            rowNum = 0;
            const discName = disciplineNames[currentDisc] || currentDisc;
            html += `<tr style="background: #000 !important;"><td colspan="8" style="font-weight: bold; text-align: left; padding: 8px; color: #fff !important; background: #000 !important;">${currentDisc} - ${discName}</td></tr>`;
        }
        rowNum++;
        const catStyle = punch.PL_Punch_Category === 'A' ? 'color: red; font-weight: bold;' : '';
        html += `<tr><td>${rowNum}</td><td>${punch.SD_Sub_System}</td><td>${punch.Discipline_Name}</td><td><button class="tag-no-btn" onclick="showActivities('${punch.ITEM_Tag_NO}')">${punch.ITEM_Tag_NO}</button></td><td>${punch.ITEM_Type_Code}</td><td style="${catStyle}">${punch.PL_Punch_Category}</td><td style="direction: rtl; text-align: right;">${punch.PL_Punch_Description}</td><td>${punch.PL_No}</td></tr>`;
    });
    document.getElementById('itemDetailsTableBody').innerHTML = html;
    document.getElementById('noDetailsMessage').style.display = punches.length === 0 ? 'block' : 'none';
    itemDetailsModal.show();
}

function showActivities(tagNo) {
    document.getElementById('activitiesTagTitle').textContent = tagNo;
    const filtered = activitiesData.filter(a => a.Tag_No === tagNo).sort((a, b) => a.Form_Title.localeCompare(b.Form_Title));
    const list = document.getElementById('activitiesList');
    list.innerHTML = '';
    let doneCount = 0;

    if (filtered.length === 0) {
        list.innerHTML = '<tr><td colspan="3" class="text-center text-muted py-4">No activities found for this Tag No.</td></tr>';
        document.getElementById('activitiesProgressText').textContent = '0%';
        document.getElementById('activitiesProgressFill').style.width = '0%';
    } else {
        filtered.forEach((act, index) => {
            const status = act.Done === '1' ? '✅' : '❌';
            const cls = act.Done === '1' ? 'text-success' : 'text-danger';
            list.innerHTML += `<tr><td class="text-center">${index + 1}</td><td>${act.Form_Title}</td><td class="text-center"><span class="${cls}">${status}</span></td></tr>`;
            if (act.Done === '1') doneCount++;
        });

        const percent = Math.round((doneCount / filtered.length) * 100);
        document.getElementById('activitiesProgressFill').style.width = `${percent}%`;
        document.getElementById('activitiesProgressText').textContent = `${percent}% (${doneCount}/${filtered.length})`;
    }
    
    activitiesModal.show();
}

document.getElementById('exportDetailsExcelBtn').addEventListener('click', function() {
    const tableBody = document.getElementById('itemDetailsTableBody');
    const visibleRows = Array.from(tableBody.querySelectorAll('tr')).filter(row => row.style.display !== 'none');
    
    if (visibleRows.length === 0) {
        alert('No data to export');
        return;
    }
    
    const disciplineNames = {'BD': 'BUILDING', 'CV': 'CIVIL', 'EL': 'ELECTRICAL', 'HV': 'HVAC', 'IN': 'INSTRUMENT', 'MER': 'MECHANICAL(ROTARY)', 'MES': 'MECHANICAL(STATIC)', 'PI': 'PIPING', 'PT': 'PAINT & INSULATION', 'ST': 'STRUCTURE'};
    const headers = Array.from(document.querySelectorAll('#itemDetailsModalHeader th')).map(th => th.textContent);
    
    const disciplineGroups = {};
    visibleRows.forEach(row => {
        if (row.cells.length > 1) {
            const discCell = row.cells[2]?.textContent.trim();
            if (discCell) {
                if (!disciplineGroups[discCell]) disciplineGroups[discCell] = [];
                disciplineGroups[discCell].push(Array.from(row.querySelectorAll('td')).map(td => td.textContent));
            }
        }
    });
    
    const wb = XLSX.utils.book_new();
    Object.keys(disciplineGroups).sort().forEach(disc => {
        const discName = disciplineNames[disc] || disc;
        const data = disciplineGroups[disc];
        let rowNum = 0;
        const dataWithNewRowNum = data.map(row => {
            rowNum++;
            return [rowNum, ...row.slice(1)];
        });
        const ws = XLSX.utils.aoa_to_sheet([headers, ...dataWithNewRowNum]);
        XLSX.utils.book_append_sheet(wb, ws, disc + '-' + discName.substring(0, 20));
    });
    
    const date = new Date().toISOString().split('T')[0];
    const modalTitle = document.getElementById('itemDetailsModalLabel').textContent.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, 'SAPRA_' + modalTitle + '_' + date + '.xlsx');
});

document.getElementById('printModalBtn').addEventListener('click', function() {
    const tableBody = document.getElementById('itemDetailsTableBody');
    const visibleRows = Array.from(tableBody.querySelectorAll('tr')).filter(row => row.style.display !== 'none');
    
    if (visibleRows.length === 0) {
        alert('No data to print');
        return;
    }
    
    const disciplineNames = {'BD': 'BUILDING', 'CV': 'CIVIL', 'EL': 'ELECTRICAL', 'HV': 'HVAC', 'IN': 'INSTRUMENT', 'MER': 'MECHANICAL(ROTARY)', 'MES': 'MECHANICAL(STATIC)', 'PI': 'PIPING', 'PT': 'PAINT & INSULATION', 'ST': 'STRUCTURE'};
    const modalTitle = document.getElementById('itemDetailsModalLabel').textContent;
    const headers = Array.from(document.querySelectorAll('#itemDetailsModalHeader th')).map(th => th.textContent);
    const currentDate = new Date().toLocaleString();
    
    const disciplineGroups = {};
    visibleRows.forEach(row => {
        if (row.cells.length > 1) {
            const discCell = row.cells[2]?.textContent.trim();
            if (discCell) {
                if (!disciplineGroups[discCell]) disciplineGroups[discCell] = [];
                disciplineGroups[discCell].push(Array.from(row.querySelectorAll('td')).map(td => td.textContent));
            }
        }
    });
    
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    let printContent = '<!DOCTYPE html><html><head><title>' + modalTitle + '</title><link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/font-face.css" rel="stylesheet"><style>@page { size: A4 landscape; margin: 15mm; }body { font-family: Vazir, Arial, sans-serif; font-size: 14px; margin: 0; }.page-break { page-break-before: always; }.header { display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; text-align: center; }.header-logo { width: 80px; height: 80px; margin-right: 20px; }.header-content { flex: 1; text-align: center; }.header h2 { margin: 0; font-size: 16px; }.header h3 { margin: 5px 0; font-size: 22px; font-weight: bold; }.header p { margin: 5px 0; font-size: 14px; }.discipline-title { font-size: 18px; font-weight: bold; text-align: center; margin: 20px 0; padding: 10px; background: #e3f2fd; border: 2px solid #2196f3; }table { width: 100%; border-collapse: collapse; margin: 0 auto 20px; }th, td { border: 1px solid #000; padding: 3px; text-align: center; word-wrap: break-word; white-space: normal; line-height: 1.2; }th { background-color: #f0f0f0; font-weight: bold; font-size: 13px; }td { font-size: 12px; font-weight: bold; }tr:nth-child(even) { background-color: #f9f9f9; }</style></head><body>';
    
    Object.keys(disciplineGroups).sort().forEach((disc, index) => {
        const discName = disciplineNames[disc] || disc;
        const data = disciplineGroups[disc];
        let rowNum = 0;
        printContent += '<div class="' + (index > 0 ? 'page-break' : '') + '">';
        printContent += '<div class="header"><img src="https://raw.githubusercontent.com/akarimvand/SAPRA2/main/images/SAPRA.png" alt="SAPRA Logo" class="header-logo"><div class="header-content"><h2>SAPRA - Smart Access to Project Activities</h2><h3>' + modalTitle + '</h3><p>Generated on: ' + currentDate + '</p></div></div>';
        printContent += '<div class="discipline-title">' + disc + ' - ' + discName + '</div>';
        printContent += '<table><thead><tr>' + headers.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' + data.map(row => { rowNum++; const newRow = [rowNum, ...row.slice(1)]; return '<tr>' + newRow.map(cell => '<td>' + cell + '</td>').join('') + '</tr>'; }).join('') + '</tbody></table></div>';
    });
    
    printContent += '<script>window.onload = function() { window.print(); }<\/script></body></html>';
    printWindow.document.write(printContent);
    printWindow.document.close();
});

document.getElementById('modal-filter-row').addEventListener('keyup', function(e) {
    if (e.target.tagName === 'INPUT') {
        const filters = Array.from(document.querySelectorAll('#modal-filter-row input')).map(input => input.value.toLowerCase());
        const rows = document.querySelectorAll('#itemDetailsTableBody tr');
        
        rows.forEach(row => {
            let display = true;
            const cells = row.querySelectorAll('td');
            
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
        });
        
        let visibleIndex = 1;
        rows.forEach(row => {
            if (row.style.display !== 'none') {
                row.querySelector('td').textContent = visibleIndex++;
            }
        });
    }
});

document.getElementById('exportActivitiesBtn').addEventListener('click', function() {
    const tagNo = document.getElementById('activitiesTagTitle').textContent;
    const rows = Array.from(document.querySelectorAll('#activitiesList tr'));
    
    if (rows.length === 0 || rows[0].querySelector('.text-muted')) {
        alert('No activities to export');
        return;
    }
    
    const data = rows.map((row, index) => {
        const cells = row.querySelectorAll('td');
        return {
            'ردیف': cells[0]?.textContent || (index + 1),
            'عنوان فعالیت': cells[1]?.textContent || '',
            'وضعیت': cells[2]?.textContent?.includes('✅') ? 'انجام شده' : 'انجام نشده'
        };
    });
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activities');
    
    const date = new Date().toISOString().split('T')[0];
    const fileName = `SAPRA_Activities_${tagNo.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.xlsx`;
    XLSX.writeFile(wb, fileName);
});

function printExecutiveSummary() {
    const tbody = document.querySelector('#mainTable tbody');
    const allRows = Array.from(allData);
    
    if (allRows.length === 0) {
        alert('No data to print');
        return;
    }
    
    const totalSubsystems = allRows.length;
    let formA = 0, formB = 0, formC = 0, formD = 0, noForm = 0;
    let above70 = 0, between50_70 = 0, between25_50 = 0, below25 = 0;
    let totalItems = 0, totalCompleted = 0, totalRemaining = 0, totalPending = 0;
    let totalPunch = 0, clearedPunch = 0, remainingPunch = 0;
    let punchA = 0, punchB = 0, punchC = 0;
    
    allRows.forEach(row => {
        if (row.FormA == '1') formA++;
        if (row.FormB == '1') formB++;
        if (row.FormC == '1') formC++;
        if (row.FormD == '1') formD++;
        if (row.FormA != '1' && row.FormB != '1' && row.FormC != '1' && row.FormD != '1') noForm++;
        
        const category = row.Progress_Category;
        if (category === 'Above 70%') above70++;
        else if (category === '50% to 70%') between50_70++;
        else if (category === '25% to 50%') between25_50++;
        else if (category === 'Below 25%') below25++;
        
        totalItems += parseInt(row.Total_Items || 0);
        totalCompleted += parseInt(row.Total_Done || 0);
        totalPending += parseInt(row.Total_Pending || 0);
        totalPunch += parseInt(row.Total_Punch || 0);
        clearedPunch += parseInt(row.Total_Clear_Punch || 0);
        remainingPunch += parseInt(row.Total_Not_Clear_Punch || 0);
        punchA += parseInt(row['PUNCH-A'] || 0);
        punchB += parseInt(row['PUNCH-B'] || 0);
        punchC += parseInt(row['PUNCH-C'] || 0);
    });
    
    totalRemaining = totalItems - totalCompleted - totalPending;
    const completionRate = totalItems > 0 ? ((totalCompleted / totalItems) * 100).toFixed(1) : 0;
    const punchClearRate = totalPunch > 0 ? ((clearedPunch / totalPunch) * 100).toFixed(1) : 0;
    const currentDate = new Date().toLocaleDateString('fa-IR');
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    const printContent = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>گزارش خلاصه مدیریتی</title><link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/font-face.css" rel="stylesheet"><style>@page{size:A4 portrait;margin:10mm}body{font-family:Vazir,Arial,sans-serif;font-size:13px;margin:0;color:#000;direction:rtl;font-weight:600}.header{text-align:center;margin-bottom:15px;border-bottom:3px solid #0066cc;padding-bottom:10px}.header img{height:55px;margin-bottom:8px}.header h1{margin:8px 0;font-size:24px;color:#0066cc;font-weight:900}.header p{margin:4px 0;font-size:13px;color:#333;font-weight:700}.section{margin-bottom:15px;page-break-inside:avoid}.section-title{font-size:17px;font-weight:900;color:#fff;background:#0066cc;padding:8px 12px;margin-bottom:10px;border-radius:5px}.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px}.stat-card{background:#f0f4ff;border:2px solid #0066cc;border-radius:6px;padding:12px;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,0.1)}.stat-card.green{border-color:#10b981;background:#ecfdf5}.stat-card.blue{border-color:#3b82f6;background:#eff6ff}.stat-card.orange{border-color:#f59e0b;background:#fffbeb}.stat-card.red{border-color:#ef4444;background:#fef2f2}.stat-value{font-size:28px;font-weight:900;color:#000;margin-bottom:5px}.stat-label{font-size:12px;color:#333;font-weight:700}.matrix-table{width:100%;border-collapse:collapse;margin:10px 0;box-shadow:0 2px 4px rgba(0,0,0,0.1)}.matrix-table th,.matrix-table td{border:2px solid #333;padding:8px;text-align:center;font-size:13px;font-weight:700}.matrix-table th{background:#0066cc;color:#fff;font-weight:900;font-size:14px}.matrix-table td{background:#f8f9fa}.matrix-table td.highlight{background:#fff3cd;font-weight:900;font-size:15px}.progress-bar-container{background:#d1d5db;height:28px;border-radius:5px;overflow:hidden;margin:8px 0;border:2px solid #333}.progress-bar-fill{height:100%;background:linear-gradient(90deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px}.summary-box{background:#e3f2fd;border:3px solid #0066cc;border-radius:8px;padding:15px;margin:12px 0;box-shadow:0 3px 6px rgba(0,0,0,0.15)}.summary-box h3{margin:0 0 12px 0;font-size:18px;color:#0066cc;font-weight:900}.key-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.metric{text-align:center;background:#fff;padding:12px;border-radius:6px;border:2px solid #0066cc}.metric-value{font-size:32px;font-weight:900;color:#0066cc;margin-bottom:5px}.metric-label{font-size:12px;color:#333;font-weight:700}.detail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:10px 0}.detail-box{background:#fff;border:2px solid #0066cc;border-radius:6px;padding:10px}.detail-title{font-size:14px;font-weight:900;color:#0066cc;margin-bottom:8px;border-bottom:2px solid #0066cc;padding-bottom:4px}.detail-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #e5e7eb}.detail-row:last-child{border-bottom:none}.detail-label{font-size:12px;color:#333;font-weight:700}.detail-value{font-size:13px;color:#000;font-weight:900}</style></head><body><div class="header"><img src="https://raw.githubusercontent.com/akarimvand/SAPRA2/main/images/SAPRA.png" alt="SAPRA"><h1>گزارش خلاصه مدیریتی پروژه</h1><p>تاریخ تهیه گزارش: ${currentDate}</p></div><div class="summary-box"><h3>📊 خلاصه کلی پروژه</h3><div class="key-metrics"><div class="metric"><div class="metric-value">${totalSubsystems}</div><div class="metric-label">تعداد کل زیرسیستم‌ها</div></div><div class="metric"><div class="metric-value">${completionRate}%</div><div class="metric-label">درصد پیشرفت کلی</div></div><div class="metric"><div class="metric-value">${totalItems.toLocaleString()}</div><div class="metric-label">تعداد کل آیتم‌ها</div></div></div></div><div class="section"><div class="section-title">📋 وضعیت تکمیل فرم‌ها</div><div class="stats-grid"><div class="stat-card green"><div class="stat-value">${formA}</div><div class="stat-label">فرم A تکمیل شده</div></div><div class="stat-card blue"><div class="stat-value">${formB}</div><div class="stat-label">فرم B تکمیل شده</div></div><div class="stat-card orange"><div class="stat-value">${formC}</div><div class="stat-label">فرم C تکمیل شده</div></div><div class="stat-card"><div class="stat-value">${formD}</div><div class="stat-label">فرم D تکمیل شده</div></div></div></div><div class="section"><div class="section-title">📈 توزیع پیشرفت زیرسیستم‌ها</div><div class="stats-grid"><div class="stat-card green"><div class="stat-value">${above70}</div><div class="stat-label">بالای ۷۰٪ (عالی)</div></div><div class="stat-card blue"><div class="stat-value">${between50_70}</div><div class="stat-label">۵۰ تا ۷۰٪ (خوب)</div></div><div class="stat-card orange"><div class="stat-value">${between25_50}</div><div class="stat-label">۲۵ تا ۵۰٪ (نیاز به توجه)</div></div><div class="stat-card red"><div class="stat-value">${below25}</div><div class="stat-label">زیر ۲۵٪ (بحرانی)</div></div></div></div><div class="section"><div class="section-title">دسته‌بندی</th><th>تعداد</th><th>درصد از کل</th><th>وضعیت</th></tr><tr><td>بالای ۷۰٪</td><td class="highlight">${above70}</td><td class="highlight">${((above70/totalSubsystems)*100).toFixed(1)}%</td><td style="color:#10b981;font-weight:900">✓ عالی</td></tr><tr><td>۵۰ تا ۷۰٪</td><td class="highlight">${between50_70}</td><td class="highlight">${((between50_70/totalSubsystems)*100).toFixed(1)}%</td><td style="color:#3b82f6;font-weight:900">✓ خوب</td></tr><tr><td>۲۵ تا ۵۰٪</td><td class="highlight">${between25_50}</td><td class="highlight">${((between25_50/totalSubsystems)*100).toFixed(1)}%</td><td style="color:#f59e0b;font-weight:900">⚠ توجه</td></tr><tr><td>زیر ۲۵٪</td><td class="highlight">${below25}</td><td class="highlight">${((below25/totalSubsystems)*100).toFixed(1)}%</td><td style="color:#ef4444;font-weight:900">✗ بحرانی</td></tr></table></div><div class="section"><div class="section-title">🔧 جزئیات آیتم‌ها و پانچ‌لیست</div><div class="detail-grid"><div class="detail-box"><div class="detail-title">📦 آیتم‌ها</div><div class="detail-row"><span class="detail-label">کل آیتم‌ها:</span><span class="detail-value">${totalItems.toLocaleString()}</span></div><div class="detail-row"><span class="detail-label">تکمیل شده:</span><span class="detail-value" style="color:#10b981">${totalCompleted.toLocaleString()}</span></div><div class="detail-row"><span class="detail-label">در حال انجام:</span><span class="detail-value" style="color:#3b82f6">${totalPending.toLocaleString()}</span></div><div class="detail-row"><span class="detail-label">باقیمانده:</span><span class="detail-value" style="color:#ef4444">${totalRemaining.toLocaleString()}</span></div><div class="detail-row" style="background:#e3f2fd;margin-top:5px;padding:8px;border-radius:4px"><span class="detail-label" style="font-size:14px">درصد تکمیل:</span><span class="detail-value" style="font-size:18px;color:#0066cc">${completionRate}%</span></div></div><div class="detail-box"><div class="detail-title">⚠️ پانچ‌لیست</div><div class="detail-row"><span class="detail-label">کل پانچ:</span><span class="detail-value">${totalPunch.toLocaleString()}</span></div><div class="detail-row"><span class="detail-label">برطرف شده:</span><span class="detail-value" style="color:#10b981">${clearedPunch.toLocaleString()}</span></div><div class="detail-row"><span class="detail-label">باقیمانده:</span><span class="detail-value" style="color:#ef4444">${remainingPunch.toLocaleString()}</span></div><div class="detail-row" style="background:#e3f2fd;margin-top:5px;padding:8px;border-radius:4px"><span class="detail-label" style="font-size:14px">درصد برطرف شده:</span><span class="detail-value" style="font-size:18px;color:#0066cc">${punchClearRate}%</span></div></div></div><table class="matrix-table" style="margin-top:10px"><tr><th></th><th>کل</th><th>تکمیل/برطرف شده</th><th>در حال انجام</th><th>باقیمانده</th><th>درصد</th></tr><tr><th style="text-align:right;padding-right:15px">آیتم‌ها</th><td class="highlight">${totalItems.toLocaleString()}</td><td class="highlight" style="color:#10b981">${totalCompleted.toLocaleString()}</td><td class="highlight" style="color:#3b82f6">${totalPending.toLocaleString()}</td><td class="highlight" style="color:#ef4444">${totalRemaining.toLocaleString()}</td><td class="highlight" style="color:#0066cc;font-size:16px">${completionRate}%</td></tr><tr><th style="text-align:right;padding-right:15px">پانچ</th><td class="highlight">${totalPunch.toLocaleString()}</td><td class="highlight" style="color:#10b981">${clearedPunch.toLocaleString()}</td><td>-</td><td class="highlight" style="color:#ef4444">${remainingPunch.toLocaleString()}</td><td class="highlight" style="color:#0066cc;font-size:16px">${punchClearRate}%</td></tr></table><div class="progress-bar-container"><div class="progress-bar-fill" style="width:${completionRate}%">پیشرفت آیتم‌ها: ${completionRate}%</div></div><div class="progress-bar-container"><div class="progress-bar-fill" style="width:${punchClearRate}%;background:linear-gradient(90deg,#3b82f6,#2563eb)">برطرف شدن پانچ: ${punchClearRate}%</div></div></div><div class="section"><div class="section-title">🔍 تفکیک پانچ بر اساس دسته‌بندی</div><table class="matrix-table"><tr><th>دسته</th><th>تعداد</th><th>درصد از کل</th><th>توضیحات</th></tr><tr><td style="color:#ef4444;font-weight:900">PUNCH-A</td><td class="highlight" style="color:#ef4444">${punchA.toLocaleString()}</td><td class="highlight">${totalPunch > 0 ? ((punchA/totalPunch)*100).toFixed(1) : 0}%</td><td style="font-size:11px">پانچ‌های بحرانی و فوری</td></tr><tr><td style="color:#f59e0b;font-weight:900">PUNCH-B</td><td class="highlight" style="color:#f59e0b">${punchB.toLocaleString()}</td><td class="highlight">${totalPunch > 0 ? ((punchB/totalPunch)*100).toFixed(1) : 0}%</td><td style="font-size:11px">پانچ‌های مهم</td></tr><tr><td style="color:#3b82f6;font-weight:900">PUNCH-C</td><td class="highlight" style="color:#3b82f6">${punchC.toLocaleString()}</td><td class="highlight">${totalPunch > 0 ? ((punchC/totalPunch)*100).toFixed(1) : 0}%</td><td style="font-size:11px">پانچ‌های معمولی</td></tr></table></div><script>window.onload=function(){window.print()}</script></body></html>`;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}
