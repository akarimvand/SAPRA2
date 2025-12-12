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
    
    const g2j = (gy, gm, gd) => { const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]; let jy = (gy <= 1600) ? 0 : 979; gy -= (gy <= 1600) ? 621 : 1600; let gy2 = (gm > 2) ? (gy + 1) : gy; let days = (365 * gy) + (parseInt((gy2 + 3) / 4)) - (parseInt((gy2 + 99) / 100)) + (parseInt((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1]; jy += 33 * (parseInt(days / 12053)); days %= 12053; jy += 4 * (parseInt(days / 1461)); days %= 1461; jy += parseInt((days - 1) / 365); if (days > 365) days = (days - 1) % 365; let jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30); let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30)); return [jy, jm, jd]; }; const now = new Date(); const [y, m, d] = g2j(now.getFullYear(), now.getMonth() + 1, now.getDate()); const currentDate = `${y}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`; const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    let printContent = '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>گزارش خلاصه کلی وضعیت پیش راه اندازی</title><link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/font-face.css" rel="stylesheet"><style>@page { size: A4 landscape; margin: 15mm; counter-increment: page; @bottom-right { content: "صفحه " counter(page); } }body { font-family: Vazir, Arial, sans-serif; font-size: 11px; margin: 0; color: #000; direction: rtl; font-weight: 600; }.page-break { page-break-before: always; }.report-header { display: flex; align-items: center; justify-content: space-between; padding: 15px 20px; margin-bottom: 20px; border: 3px solid #0066cc; border-radius: 12px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); box-shadow: 0 4px 12px rgba(0,102,204,0.15); }.header-logo { flex: 0 0 80px; }.header-logo img { height: 70px; width: auto; }.header-center { flex: 1; text-align: center; padding: 0 20px; }.header-center h1 { margin: 0 0 8px 0; font-size: 16px; color: #0066cc; font-weight: 900; line-height: 1.3; }.header-center h2 { margin: 0; font-size: 13px; color: #495057; font-weight: 700; }.header-left { flex: 0 0 120px; text-align: left; font-size: 11px; color: #495057; font-weight: 700; }.header-left div { margin-bottom: 4px; }.category-title { font-size: 15px; font-weight: bold; text-align: center; margin: 15px 0; padding: 10px; background: linear-gradient(135deg, #e3f2fd, #bbdefb); border: 2px solid #0066cc; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }table { width: 100%; border-collapse: collapse; margin: 0 auto 20px; }th, td { border: 1px solid #666; padding: 5px; text-align: center; font-size: 10px; }th { background-color: #0066cc; color: white; font-weight: bold; }tr:nth-child(even) { background-color: #f5f5f5; }</style></head><body>';
    
    const categoryOrder = ['Above 70%', '50% to 70%', '25% to 50%', 'Below 25%'];
    let isFirstCategory = true;
    let pageNum = 1;
    categoryOrder.forEach(cat => {
        if (categories[cat].length > 0) {
            printContent += '<div class="' + (isFirstCategory ? '' : 'page-break') + '">';
            printContent += '<div class="report-header"><div class="header-logo"><img src="https://raw.githubusercontent.com/akarimvand/SAPRA2/main/images/SAPRA.png" alt="SAPRA"></div><div class="header-center"><h1>Smart Access to Project Activities</h1><h2>گزارش خلاصه کلی وضعیت پیش راه اندازی</h2></div><div class="header-left"><div>تاریخ: ' + currentDate + '</div><div>ساعت: ' + currentTime + '</div><div>صفحه: ' + pageNum + '</div></div></div>';
            pageNum++;
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
    const allRows = Array.from(allData);
    if (allRows.length === 0) { alert('No data to print'); return; }
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
        const hasNoForm = row.FormA != '1' && row.FormB != '1' && row.FormC != '1' && row.FormD != '1';
        if (hasNoForm) {
            noForm++;
            const category = row.Progress_Category;
            if (category === 'Above 70%') above70++;
            else if (category === '50% to 70%') between50_70++;
            else if (category === '25% to 50%') between25_50++;
            else if (category === 'Below 25%') below25++;
        }
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
    const g2j = (gy, gm, gd) => { const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]; let jy = (gy <= 1600) ? 0 : 979; gy -= (gy <= 1600) ? 621 : 1600; let gy2 = (gm > 2) ? (gy + 1) : gy; let days = (365 * gy) + (parseInt((gy2 + 3) / 4)) - (parseInt((gy2 + 99) / 100)) + (parseInt((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1]; jy += 33 * (parseInt(days / 12053)); days %= 12053; jy += 4 * (parseInt(days / 1461)); days %= 1461; jy += parseInt((days - 1) / 365); if (days > 365) days = (days - 1) % 365; let jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30); let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30)); return [jy, jm, jd]; }; const now = new Date(); const [y, m, d] = g2j(now.getFullYear(), now.getMonth() + 1, now.getDate()); const currentDate = `${y}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`; const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    const printContent = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>گزارش خلاصه کلی وضعیت پیش راه اندازی</title><link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazir-font@v30.1.0/dist/font-face.css" rel="stylesheet"><style>@page{size:A4 portrait;margin:10mm;@bottom-right{content:"صفحه " counter(page) " از " counter(pages)}}body{font-family:Vazir,Arial,sans-serif;font-size:11px;margin:0;color:#000;direction:rtl;font-weight:600}.report-header{display:flex;align-items:center;justify-content:space-between;padding:15px 20px;margin-bottom:20px;border:3px solid #0066cc;border-radius:12px;background:linear-gradient(135deg,#f8f9fa 0%,#e9ecef 100%);box-shadow:0 4px 12px rgba(0,102,204,0.15)}.header-logo{flex:0 0 80px}.header-logo img{height:70px;width:auto}.header-center{flex:1;text-align:center;padding:0 20px}.header-center h1{margin:0 0 8px 0;font-size:18px;color:#0066cc;font-weight:900;line-height:1.3}.header-center h2{margin:0;font-size:14px;color:#495057;font-weight:700}.header-left{flex:0 0 120px;text-align:left;font-size:11px;color:#495057;font-weight:700}.header-left div{margin-bottom:4px}.section{margin-bottom:12px;page-break-inside:avoid}.section-title{font-size:14px;font-weight:900;color:#0066cc;margin-bottom:8px;padding-bottom:3px;border-bottom:2px solid #0066cc}.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}.card{background:#fff;border:2px solid #0066cc;border-radius:8px;padding:12px;box-shadow:0 3px 8px rgba(0,0,0,0.12)}.card-item{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb}.card-item:last-child{border-bottom:none}.card-label{font-size:11px;color:#333;font-weight:600}.card-value{font-size:14px;font-weight:900;color:#0066cc}.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.stat-box{background:linear-gradient(135deg,#f0f4ff,#e3f2fd);border:2px solid #0066cc;border-radius:8px;padding:10px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.1)}.stat-box.green{border-color:#10b981;background:linear-gradient(135deg,#ecfdf5,#d1fae5)}.stat-box.blue{border-color:#3b82f6;background:linear-gradient(135deg,#eff6ff,#dbeafe)}.stat-box.orange{border-color:#f59e0b;background:linear-gradient(135deg,#fffbeb,#fef3c7)}.stat-box.red{border-color:#ef4444;background:linear-gradient(135deg,#fef2f2,#fee2e2)}.stat-num{font-size:24px;font-weight:900;color:#0066cc;margin:4px 0}.stat-num.green{color:#10b981}.stat-num.blue{color:#3b82f6}.stat-num.orange{color:#f59e0b}.stat-num.red{color:#ef4444}.stat-label{font-size:10px;color:#333;font-weight:700}</style></head><body><div class="report-header"><div class="header-logo"><img src="https://raw.githubusercontent.com/akarimvand/SAPRA2/main/images/SAPRA.png" alt="SAPRA"></div><div class="header-center"><h1>سیستم هوشمند دسترسی به فعالیت‌های پروژه</h1><h2>گزارش خلاصه کلی وضعیت پیش راه اندازی</h2></div><div class="header-left"><div>تاریخ: ${currentDate}</div><div>ساعت: ${currentTime}</div><div>صفحه: 1</div></div></div><div class="section"><div class="section-title">📊 وضعیت ساب سیستمها</div><div class="grid-2"><div class="card"><div class="card-item"><span class="card-label">تعداد کل زیرسیستمها</span><span class="card-value">${totalSubsystems}</span></div><div class="card-item"><span class="card-label">فرم A تعداد</span><span class="card-value" style="color:#10b981">${formA}</span></div><div class="card-item"><span class="card-label">فرم B تعداد</span><span class="card-value" style="color:#3b82f6">${formB}</span></div></div><div class="card"><div class="card-item"><span class="card-label">فرم C تعداد</span><span class="card-value" style="color:#f59e0b">${formC}</span></div><div class="card-item"><span class="card-label">فرم D تعداد</span><span class="card-value" style="color:#8b5cf6">${formD}</span></div><div class="card-item"><span class="card-label">باقیمانده در حال تکمیل فعالیتهای اجرایی</span><span class="card-value" style="color:#ef4444">${noForm}</span></div></div></div></div><div class="section"><div class="section-title">📦 وضعیت آیتمها</div><div class="grid-2"><div class="card"><div class="card-item"><span class="card-label">کل آیتمها</span><span class="card-value">${totalItems.toLocaleString()}</span></div><div class="card-item"><span class="card-label">تکمیل شده</span><span class="card-value" style="color:#10b981">${totalCompleted.toLocaleString()}</span></div><div class="card-item"><span class="card-label">در حال انجام</span><span class="card-value" style="color:#3b82f6">${totalPending.toLocaleString()}</span></div></div><div class="card"><div class="card-item"><span class="card-label">باقیمانده</span><span class="card-value" style="color:#ef4444">${totalRemaining.toLocaleString()}</span></div><div class="card-item" style="background:#e3f2fd;margin-top:10px;padding:12px;border-radius:6px;border:none"><span class="card-label" style="font-size:13px">درصد تکمیل</span><span class="card-value" style="font-size:22px">${completionRate}%</span></div></div></div></div><div class="section"><div class="section-title">⚠️ پانچ لیست</div><div class="grid-2"><div class="card"><div class="card-item"><span class="card-label">کل پانچ</span><span class="card-value">${totalPunch.toLocaleString()}</span></div><div class="card-item"><span class="card-label">برطرف شده</span><span class="card-value" style="color:#10b981">${clearedPunch.toLocaleString()}</span></div><div class="card-item"><span class="card-label">باقیمانده</span><span class="card-value" style="color:#ef4444">${remainingPunch.toLocaleString()}</span></div><div class="card-item" style="background:#e3f2fd;margin-top:10px;padding:12px;border-radius:6px;border:none"><span class="card-label" style="font-size:13px">درصد برطرف شده</span><span class="card-value" style="font-size:22px">${punchClearRate}%</span></div></div><div class="card"><div class="card-item"><span class="card-label">PUNCH-A باقیمانده</span><span class="card-value" style="color:#ef4444">${punchA.toLocaleString()}</span></div><div class="card-item"><span class="card-label">PUNCH-B باقیمانده</span><span class="card-value" style="color:#f59e0b">${punchB.toLocaleString()}</span></div><div class="card-item"><span class="card-label">PUNCH-C باقیمانده</span><span class="card-value" style="color:#3b82f6">${punchC.toLocaleString()}</span></div></div></div></div><div class="section"><div class="section-title">📈 توزیع پیشرفت زیرسیستمها در حال تکمیل</div><div class="grid-4"><div class="stat-box green"><div class="stat-num green">${above70}</div><div class="stat-label">بالای ۷۰٪<br>(★★★★)</div></div><div class="stat-box blue"><div class="stat-num blue">${between50_70}</div><div class="stat-label">تا ۷۰٪<br>(★★★)</div></div><div class="stat-box orange"><div class="stat-num orange">${between25_50}</div><div class="stat-label">تا ۵۰٪<br>(★★)</div></div><div class="stat-box red"><div class="stat-num red">${below25}</div><div class="stat-label">زیر ۲۵٪<br>(★)</div></div></div></div><script>window.onload=function(){window.print()}</script></body></html>`;
    printWindow.document.write(printContent);
    printWindow.document.close();
}


