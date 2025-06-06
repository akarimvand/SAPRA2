(function(app) {
    'use strict';
    app.exportManager = {};

    app.exportManager.handleExport = function() {
        if (app.state.processedData && app.state.processedData.allRawData && app.state.processedData.allRawData.length > 0) {
            // Assuming _generateTableDataForView is on app.dataLoader
            const dataToExportRaw = app.dataLoader._generateTableDataForView(app.state.selectedView, app.state.processedData, false, true);
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
            if (app.state.selectedView.type === 'system' && app.state.selectedView.id) viewName = `System_${app.state.selectedView.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
            else if (app.state.selectedView.type === 'subsystem' && app.state.selectedView.id) viewName = `SubSystem_${app.state.selectedView.id.replace(/[^a-zA-Z0-9]/g, '_')}`;

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
    };

    app.exportManager.handleDetailsExport = function() {
        if (app.state.displayedItemsInModal.length === 0) {
            alert("No data in the modal to export.");
            return;
        }

         let dataToExport = [];
         let sheetName = '';

         if (app.state.currentModalDataType === 'items') {
              dataToExport = app.state.displayedItemsInModal.map((item, index) => ({
                '#': index + 1,
                  Subsystem: item.subsystem,
                  Discipline: item.discipline,
                  TagNo: item.tagNo,
                  TypeCode: item.typeCode,
                  Description: item.description,
                  Status: item.status,
              }));
             sheetName = 'Item Details';
         } else if (app.state.currentModalDataType === 'punch') {
             dataToExport = app.state.displayedItemsInModal.map((item, index) => ({
                '#': index + 1,
                  Subsystem: item.subsystem,
                  Discipline: item.discipline,
                  TagNo: item.tagNo,
                  TypeCode: item.typeCode || 'N/A',
                  PunchCategory: item.punchCategory,
                  PunchDescription: item.punchDescription,
              }));
             sheetName = 'Punch Details';
         } else if (app.state.currentModalDataType === 'hold') {
              dataToExport = app.state.displayedItemsInModal.map((item, index) => ({
                '#': index + 1,
                  Subsystem: item.subsystem,
                  Discipline: item.discipline,
                  TagNo: item.tagNo,
                  TypeCode: item.typeCode || 'N/A',
                  HPPriority: item.hpPriority || 'N/A',
                  HPDescription: item.hpDescription || 'N/A',
                  HPLocation: item.hpLocation || 'N/A',
              }));
              sheetName = 'Hold Point Details';
         }

        if (dataToExport.length === 0) {
             alert("Failed to format data for export.");
             return;
        }

        const currentDate = new Date().toISOString().split('T')[0];
        const modalTitleText = app.DOMElements.itemDetailsModalLabel.textContent;
        const safeModalTitle = modalTitleText ? modalTitleText.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '_') : 'Items';
        const fileName = `SAPRA_Details_${safeModalTitle}_${currentDate}.xlsx`;

        try {
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            XLSX.writeFile(workbook, fileName);
        } catch (error) {
            console.error("Error exporting modal details to Excel:", error);
            alert("An error occurred while exporting details to Excel.");
        }
    };

})(window.SAPRA_APP);
