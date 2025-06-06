(function(app) {
    'use strict';
    app.constants = {
        CSV_URL: "https://raw.githubusercontent.com/akarimvand/SAPRA2/refs/heads/main/DATA.CSV",
        ITEMS_CSV_URL: "https://raw.githubusercontent.com/akarimvand/SAPRA2/refs/heads/main/ITEMS.CSV",
        PUNCH_CSV_URL: "https://raw.githubusercontent.com/akarimvand/SAPRA2/refs/heads/main/PUNCH.CSV",
        HOLD_POINT_CSV_URL: "https://raw.githubusercontent.com/akarimvand/SAPRA2/refs/heads/main/HOLD_POINT.CSV",
        COLORS_STATUS_CHARTJS: {
            done: 'rgba(76, 175, 80, 0.8)',
            pending: 'rgba(255, 166, 0, 0.8)',
            remaining: 'rgba(0, 146, 202, 0.8)'
        },
        COLORS_ISSUES_CHARTJS: {
            punch: 'rgba(255, 46, 99, 0.8)',
            hold: 'rgba(155, 89, 182, 0.8)'
        },
        ICONS: {
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
        }
    };
})(window.SAPRA_APP);
