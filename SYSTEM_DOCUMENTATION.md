# SAPRA System - Complete Technical Documentation

## System Overview
**SAPRA** (Smart Access to Project Activities) is a comprehensive web-based project management dashboard for monitoring precommissioning activities, document workflows, and subsystem status tracking.

## Architecture

### 1. System Structure
```
SAPRA2-main/
├── index.html          # Login page
├── main.html           # Main dashboard
├── pages/
│   ├── Work_flow.html  # Document workflow monitoring
│   └── FILE-MAN.html   # File management
├── dbcsv/              # CSV data files
│   ├── HOS_WORK_FLOW.csv
│   ├── DATA.CSV
│   ├── ACTIVITES.CSV
│   └── [other CSV files]
├── libs/               # Offline libraries
│   ├── js/
│   ├── css/
│   └── fonts/
└── [JavaScript modules]
```

### 2. Core Components

#### A. Authentication System (index.html)
- **Purpose**: User login and project phase selection
- **Features**:
  - Multi-phase support (Engineering, Procurement, Construction, Precommissioning, Commissioning, Start-up)
  - Role-based access (Sapra_Sabalan2, Kayson_User, Administrator)
  - Credentials:
    - Precommissioning: `Sapra_Sabalan2` / `1234`
    - Other phases: `Kayson_User` / `869400`
- **Flow**: Login → Validate → Redirect to main.html or construction.html

#### B. Main Dashboard (main.html)
- **Purpose**: Central hub for all project data
- **Key Features**:
  1. **Sidebar Navigation**: Tree-view of systems/subsystems
  2. **Tab System**:
     - Home: Data tables, charts, summary cards
     - Workflow: Embedded Work_flow.html
     - Summary Report: ss-summary-report.html
     - Punch Release: reports.html
     - Resources & Guides
     - Help & About
  3. **Data Display**:
     - Summary cards (FORM A-D status)
     - Filterable data tables
     - Interactive charts (Chart.js)
     - Mobile-responsive cards
  4. **Actions**:
     - Export to Excel (XLSX.js)
     - Print reports
     - Refresh data
     - Quick search

#### C. Document Workflow Monitor (Work_flow.html)
- **Purpose**: Track document flow through approval stages
- **Data Source**: `HOS_WORK_FLOW.csv`
- **CSV Structure**:
  ```
  ID, Sub_System, STEP, UNIT, PERSON, DESCRIPTION, Remark, User_Log, RECEIVED_DATE
  ```
- **Key Concepts**:
  1. **Steps**: Execution Activities → FORM A → FORM B → FORM C → FORM D
  2. **Units**: CONTRACTOR, PRECOM, TPA, OWNER
  3. **Document Path**: Chronological record of each subsystem's journey
  4. **Metrics**:
     - Days in stage
     - Loop count (revisits to same stage)
     - Delay threshold: 7 days (warning), 14 days (critical)

**Core Logic**:
```javascript
// 1. Load CSV data
fetch('HOS_WORK_FLOW.csv') → Parse with PapaParse → Filter valid records

// 2. Process document paths
Group by Sub_System → Sort by date → Calculate:
  - Current step/unit
  - Loops (repeated visits)
  - Delays (days > threshold)

// 3. Render visualizations
- Global stats: Count per FORM stage
- Heatmap: Average days per STEP|UNIT combination
- Queue table: Current status of all subsystems
- Timeline modal: Full history per subsystem
```

**Heatmap Algorithm**:
```javascript
For each STEP|UNIT combination:
  - Count total subsystems passed through
  - Calculate average days spent (all-time)
  - Calculate average days for currently active subsystems
  - Color code: Green (<3d) → Blue (3-7d) → Yellow (7-14d) → Red (>14d)
```

**Critical Alerts**:
- Identify subsystems with >14 days in current stage
- Display top 5 + badge count
- Generate printable report grouped by STEP

### 3. Data Flow

#### CSV Data Loading
```
1. Fetch CSV file
2. Parse with PapaParse (header: true)
3. Filter: Remove rows without Sub_System, STEP, UNIT, RECEIVED_DATE
4. Transform: Parse dates, trim strings
5. Sort: By ID ascending
6. Store: In allData array
```

#### Date Handling
```javascript
// CSV format: "11/20/2025 12:00:00 AM"
// Solution: Split by space, take first part
const dateStr = row.RECEIVED_DATE.split(' ')[0];
const date = new Date(dateStr);
```

#### Document Path Processing
```javascript
documentPaths = Map<SubSystem, {
  subSystem: string,
  records: Array<Record>,
  currentStep: string,
  currentUnit: string,
  loops: number,
  delays: number
}>
```

### 4. UI Components

#### Filters
- **Step Filter**: Dropdown of all unique STEPs
- **Unit Filter**: Dropdown of all unique UNITs
- **SubSystem Filter**: Text search (case-insensitive)
- **Active Filters**: Removable badges showing current filters

#### Visualizations
1. **Global Stats Cards**:
   - Doughnut charts (Chart.js)
   - Click to filter by STEP
   - Percentage calculation

2. **Heatmap Matrix**:
   - Rows: STEPs (excluding Execution Activities)
   - Columns: UNITs (CONTRACTOR, PRECOM, TPA, OWNER)
   - Cells: Current count + average days
   - Click to filter by STEP+UNIT

3. **Mini Heatmap**:
   - Appears when STEP+UNIT filtered
   - Shows all subsystems in that combination
   - Sorted by days descending
   - Distinguishes current vs completed

4. **Queue Table**:
   - Sortable columns
   - Inline filters
   - Color-coded rows (delay status)
   - Timeline button per row

#### Modals
1. **Timeline Modal**: Shows full journey of one subsystem
2. **Critical List Modal**: Printable report of delayed subsystems
3. **Full Report Modal**: Complete status matrix + detailed tables

### 5. Export Features

#### Excel Export (XLSX.js)
```javascript
// Queue export
const wb = XLSX.utils.book_new();
const wsData = [headers, ...filteredData];
const ws = XLSX.utils.aoa_to_sheet(wsData);
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, 'filename.xlsx');
```

#### Print Reports
- CSS @media print rules
- Hide no-print elements
- Format for A4 landscape
- Page breaks for sections

### 6. Libraries Used

#### Core Libraries
- **Tailwind CSS**: Utility-first styling
- **Chart.js**: Data visualization
- **PapaParse**: CSV parsing
- **XLSX**: Excel export
- **Font Awesome**: Icons
- **Vazir Font**: Persian typography
- **Bootstrap**: UI framework (main.html)
- **SweetAlert2**: Alerts (main.html)

#### Offline Implementation
All libraries stored in `libs/` directory:
```
libs/
├── js/
│   ├── chart.umd.min.js
│   ├── papaparse.min.js
│   ├── xlsx.full.min.js
│   ├── bootstrap.bundle.min.js
│   └── sweetalert2.min.js
├── css/
│   ├── tailwind.min.css
│   ├── bootstrap.min.css
│   ├── fontawesome.min.css
│   └── bootstrap-icons.min.css
└── fonts/
    ├── vazir/
    ├── webfonts/
    └── bootstrap-icons/
```

### 7. Key Algorithms

#### Loop Detection
```javascript
function calculateLoops(records) {
  const unitVisits = new Map();
  let loops = 0;
  for (const record of records) {
    const key = `${record.STEP}-${record.UNIT}`;
    const count = (unitVisits.get(key) || 0) + 1;
    unitVisits.set(key, count);
    if (count > 1) loops++;
  }
  return loops;
}
```

#### Delay Calculation
```javascript
function calculateDelays(records) {
  let delays = 0;
  for (let i = 0; i < records.length - 1; i++) {
    const days = Math.ceil((records[i+1].RECEIVED_DATE - records[i].RECEIVED_DATE) / 86400000);
    if (days > DELAY_THRESHOLD) delays++;
  }
  return delays;
}
```

#### Days in Stage
```javascript
// For current stage
const daysInStage = Math.ceil((new Date() - lastRecord.RECEIVED_DATE) / 86400000);

// For historical stage
const days = Math.ceil((nextRecord.RECEIVED_DATE - currentRecord.RECEIVED_DATE) / 86400000);
```

### 8. Responsive Design

#### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

#### Mobile Features
- Bottom navigation bar
- Collapsible sidebar
- Card-based data display
- Touch-optimized interactions
- Mobile action menu

### 9. Performance Optimizations

1. **Lazy Loading**: Defer non-critical scripts
2. **RequestAnimationFrame**: Smooth rendering
3. **Debouncing**: Filter inputs
4. **Caching**: Force-cache for CSV
5. **Minimal DOM Updates**: Batch operations

### 10. State Management

```javascript
// Global state
let allData = [];           // All CSV records
let filteredData = [];      // After filters applied
let documentPaths = Map();  // Processed paths
let queueTableData = [];    // Current queue
let criticalDocuments = []; // Delayed items
let sortDirection = {};     // Table sort state
```

### 11. Event Handling

#### Filters
```javascript
applyFilters() → Update filteredData → renderAll()
resetFilters() → Clear filters → Restore allData → renderAll()
```

#### Sorting
```javascript
sortTable(column) → Toggle direction → Sort queueTableData → Re-render
```

#### Modal Interactions
```javascript
showTimeline(subSystem) → Get path → Render timeline → Display modal
closeModal() → Hide modal
```

### 12. Rebuild Instructions

To recreate this system:

1. **Setup Structure**:
   ```bash
   mkdir SAPRA2-main
   cd SAPRA2-main
   mkdir pages dbcsv libs libs/js libs/css libs/fonts
   ```

2. **Download Libraries**:
   - Run `download_all_libs.py` script
   - Or manually download from CDNs

3. **Create HTML Files**:
   - `index.html`: Login page with form validation
   - `main.html`: Dashboard with tabs, sidebar, data tables
   - `pages/Work_flow.html`: Workflow monitor with heatmap

4. **Prepare CSV Data**:
   - `HOS_WORK_FLOW.csv`: ID, Sub_System, STEP, UNIT, PERSON, DESCRIPTION, RECEIVED_DATE
   - Ensure dates in format: "MM/DD/YYYY HH:MM:SS AM/PM"

5. **Implement Core Logic**:
   - CSV loading and parsing
   - Document path processing
   - Heatmap calculation
   - Filter system
   - Export functions

6. **Style with Tailwind/Bootstrap**:
   - Responsive grid layouts
   - Color-coded status indicators
   - Print-friendly styles

7. **Test**:
   - Login flow
   - Data loading
   - Filters and sorting
   - Export functions
   - Print layouts
   - Mobile responsiveness

### 13. Critical Constants

```javascript
const STEPS_ORDER = ['Execution Activities', 'FORM A', 'FORM B', 'FORM C', 'FORM D'];
const DELAY_THRESHOLD = 7; // days
const CRITICAL_THRESHOLD = 14; // days
const UNITS_ORDER = ['CONTRACTOR', 'PRECOM', 'TPA', 'OWNER'];
```

### 14. Color Coding

```javascript
// Days-based colors
days <= 3:  Green (#10b981)
days <= 7:  Blue (#3b82f6)
days <= 14: Yellow (#f59e0b)
days > 14:  Red (#ef4444)

// FORM colors
Execution Activities: Gray (#64748b)
FORM A: Blue (#3b82f6)
FORM B: Green (#10b981)
FORM C: Orange (#f59e0b)
FORM D: Red (#ef4444)
```

## Conclusion

This system provides real-time monitoring of document workflows with visual analytics, filtering, and reporting capabilities. The architecture is modular, data-driven, and fully offline-capable.
