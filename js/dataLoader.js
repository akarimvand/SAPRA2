(function(app) {
    'use strict';
    app.dataLoader = {};

    // Helper function to parse CSV data using PapaParse with a Promise
    function parseCsv(csvText, config = {}) {
        return new Promise((resolve, reject) => {
            if (!csvText || typeof csvText !== 'string') {
                return reject(new Error("Invalid CSV text provided to parser."));
            }
            Papa.parse(csvText, {
                ...config,
                header: true,
                skipEmptyLines: true,
                complete: results => {
                    if (results.errors && results.errors.length > 0) {
                        // Reject with the first PapaParse error
                        return reject(new Error(results.errors[0].message || "Error during CSV parsing."));
                    }
                    resolve(results.data);
                },
                error: err => reject(err) // Handles more fundamental PapaParse errors
            });
        });
    }

    // Helper function to process raw data from DATA.CSV into systemMap and subSystemMap
    function processRawDataToMaps(allRawData) {
        const systemMap = {};
        const subSystemMap = {};
        if (!allRawData || !Array.isArray(allRawData)) {
            console.error("processRawDataToMaps: input allRawData is invalid.");
            return { systemMap, subSystemMap }; // Return empty maps
        }

        allRawData.forEach(row => {
            if (!row || !row.SD_System || !row.SD_Sub_System || !row.discipline) return;

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
        return { systemMap, subSystemMap };
    }


    // --- Local Helper Functions for data aggregation (copied from previous state, ensure they use app namespace) ---
    function _aggregateStatsForSubSystem(subSystemId, subSystemMap) {
        const subSystem = subSystemMap[subSystemId];
        if (!subSystem) return app.utils._emptyStats();
        return Object.values(subSystem.disciplines).reduce((acc, discipline) => {
            acc.totalItems += discipline.total;
            acc.done += discipline.done;
            acc.pending += discipline.pending;
            acc.punch += discipline.punch;
            acc.hold += discipline.hold;
            return acc;
        }, app.utils._emptyStats());
    }

    function _aggregateStatsForSystem(systemId, systemMap, subSystemMap) {
        const system = systemMap[systemId];
        if (!system) return app.utils._emptyStats();
        return system.subs.reduce((acc, subRef) => {
            const subSystemStats = _aggregateStatsForSubSystem(subRef.id, subSystemMap);
            Object.keys(subSystemStats).forEach(key => acc[key] += subSystemStats[key]);
            return acc;
        }, app.utils._emptyStats());
    }

    function _aggregateStatsForAll(systemMap, subSystemMap) {
        return Object.keys(systemMap).reduce((acc, systemId) => {
            const systemStats = _aggregateStatsForSystem(systemId, systemMap, subSystemMap);
            Object.keys(systemStats).forEach(key => acc[key] += systemStats[key]);
            return acc;
        }, app.utils._emptyStats());
    }

    // --- Functions exposed on app.dataLoader ---
    app.dataLoader._aggregateStatsForView = function(view, systemMap, subSystemMap) {
        let stats;
        if (!systemMap || !subSystemMap) {
             console.warn("_aggregateStatsForView called with undefined systemMap or subSystemMap");
             return app.utils._emptyStats();
        }
        if (view.type === 'all' || !view.id) stats = _aggregateStatsForAll(systemMap, subSystemMap);
        else if (view.type === 'system') stats = _aggregateStatsForSystem(view.id, systemMap, subSystemMap);
        else stats = _aggregateStatsForSubSystem(view.id, subSystemMap);

        if (stats) {
          stats.remaining = Math.max(0, stats.totalItems - stats.done - stats.pending);
        } else {
          stats = app.utils._emptyStats();
        }
        return stats;
    };

    app.dataLoader._generateTableDataForView = function(view, pData, isEmptyView, forExport = false) {
        const { systemMap, subSystemMap, allRawData } = pData;
        if (!allRawData) return [];
        if (!forExport && isEmptyView && view.type !== 'all') return [];

        let relevantRawData = [];
        if (view.type === 'all') relevantRawData = allRawData;
        else if (view.type === 'system' && view.id && systemMap) {
            const system = systemMap[view.id];
            if (system && system.subs) {
                const subIdsInSystem = new Set(system.subs.map(s => s.id));
                relevantRawData = allRawData.filter(row => row.SD_Sub_System && subIdsInSystem.has(row.SD_Sub_System.trim()));
            }
        } else if (view.type === 'subsystem' && view.id) {
            relevantRawData = allRawData.filter(row => row.SD_Sub_System && row.SD_Sub_System.trim() === view.id);
        }

        if (!forExport && relevantRawData.length === 0 && view.type !== 'all') return [];

        return relevantRawData.map(row => {
            const totalItems = parseInt(row["TOTAL ITEM"]) || 0;
            const completed = parseInt(row["TOTAL DONE"]) || 0;
            return {
                system: row.SD_System?.trim() || 'N/A',
                systemName: (row.SD_System_Name || 'N/A').trim(),
                subsystem: row.SD_Sub_System?.trim() || 'N/A',
                subsystemName: (row.SD_Subsystem_Name || 'N/A').trim(),
                discipline: row.discipline?.trim() || 'N/A',
                totalItems, completed,
                pending: parseInt(row["TOTAL PENDING"]) || 0,
                punch: parseInt(row["TOTAL NOT CLEAR PUNCH"]) || 0,
                holdPoint: parseInt(row["TOTAL HOLD POINT"]) || 0,
                statusPercent: totalItems > 0 ? Math.round((completed / totalItems) * 100) : 0,
            };
        });
    };

    app.dataLoader.loadAndProcessData = async function() {
        if (!app.DOMElements || !app.DOMElements.loadingModalInstance) {
            console.error("DOMElements not initialized for loadAndProcessData.");
            return;
        }

        const loadingModalLabel = app.DOMElements.loadingModalInstance.querySelector('.fw-bold');

        // Initialize loading modal if not already
        if (!app.state.loadingModal) {
            app.state.loadingModal = new bootstrap.Modal(app.DOMElements.loadingModalInstance, { backdrop: 'static', keyboard: false });
        }
        app.state.loadingModal.show();
        app.DOMElements.errorMessage.style.display = 'none'; // Clear previous errors

        let rawData, detailedData, punchData, holdData;

        try {
            // --- Main Data (DATA.CSV) ---
            if (loadingModalLabel) loadingModalLabel.textContent = 'Loading main data (DATA.CSV)...';
            const response = await fetch(app.constants.CSV_URL);
            if (!response.ok) throw new Error(`Network error (${response.status}) for DATA.CSV`);
            const csvText = await response.text();
            rawData = await parseCsv(csvText);
            if (!rawData || rawData.length === 0) throw new Error('No data found or error parsing DATA.CSV');
            app.state.processedData.allRawData = rawData;
            const { systemMap, subSystemMap } = processRawDataToMaps(rawData);
            app.state.processedData.systemMap = systemMap;
            app.state.processedData.subSystemMap = subSystemMap;

            // --- Detailed Items Data (ITEMS.CSV) ---
            if (loadingModalLabel) loadingModalLabel.textContent = 'Loading item details (ITEMS.CSV)...';
            const itemsResponse = await fetch(app.constants.ITEMS_CSV_URL);
            if (!itemsResponse.ok) throw new Error(`Network error (${itemsResponse.status}) for ITEMS.CSV`);
            const itemsCsvText = await itemsResponse.text();
            detailedData = await parseCsv(itemsCsvText);
            if (!detailedData) throw new Error('Error parsing ITEMS.CSV (returned undefined)'); // Allow empty array, but not undefined
            app.state.detailedItemsData = detailedData.map(item => ({
                subsystem: item.SD_Sub_System?.trim() || '', discipline: item.Discipline_Name?.trim() || '',
                tagNo: item.ITEM_Tag_NO?.trim() || '', typeCode: item.ITEM_Type_Code?.trim() || '',
                description: item.ITEM_Description?.trim() || '', status: item.ITEM_Status?.trim() || ''
            }));
            console.log("Detailed items data loaded:", app.state.detailedItemsData.length, "items");

            // --- Punch Items Data (PUNCH.CSV) ---
            if (loadingModalLabel) loadingModalLabel.textContent = 'Loading punch list (PUNCH.CSV)...';
            const punchResponse = await fetch(app.constants.PUNCH_CSV_URL);
            if (!punchResponse.ok) throw new Error(`Network error (${punchResponse.status}) for PUNCH.CSV`);
            const punchCsvText = await punchResponse.text();
            punchData = await parseCsv(punchCsvText);
            if (!punchData) throw new Error('Error parsing PUNCH.CSV (returned undefined)');
            app.state.punchItemsData = punchData.map(item => ({
                subsystem: item.SD_SUB_SYSTEM?.trim() || '', discipline: item.Discipline_Name?.trim() || '',
                tagNo: item.ITEM_Tag_NO?.trim() || '', typeCode: item.ITEM_Type_Code?.trim() || '',
                punchCategory: item.PL_Punch_Category?.trim() || '', punchDescription: item.PL_Punch_Description?.trim() || ''
            }));
            console.log("Punch items data loaded:", app.state.punchItemsData.length, "items");

            // --- Hold Point Items Data (HOLD_POINT.CSV) ---
            if (loadingModalLabel) loadingModalLabel.textContent = 'Loading hold points (HOLD_POINT.CSV)...';
            const holdResponse = await fetch(app.constants.HOLD_POINT_CSV_URL);
            if (!holdResponse.ok) throw new Error(`Network error (${holdResponse.status}) for HOLD_POINT.CSV`);
            const holdCsvText = await holdResponse.text();
            holdData = await parseCsv(holdCsvText);
            if (!holdData) throw new Error('Error parsing HOLD_POINT.CSV (returned undefined)');
            app.state.holdPointItemsData = holdData.map(item => ({
                subsystem: item.SD_SUB_SYSTEM?.trim() || '', discipline: item.Discipline_Name?.trim() || '',
                tagNo: item.ITEM_Tag_NO?.trim() || '', typeCode: item.ITEM_Type_Code?.trim() || '',
                hpPriority: item.HP_Priority?.trim() || '', hpDescription: item.HP_Description?.trim() || '',
                hpLocation: item.HP_Location?.trim() || ''
            }));
            console.log("Hold point items data loaded:", app.state.holdPointItemsData.length, "items");

            // All data fetched and parsed successfully
            if (loadingModalLabel) loadingModalLabel.textContent = 'Processing data and rendering view...';

            app.state.aggregatedStats = app.dataLoader._aggregateStatsForView(app.state.selectedView, app.state.processedData.systemMap, app.state.processedData.subSystemMap);

            if (app.main && app.main.updateView) {
               app.main.updateView();
            } else {
                console.error("app.main.updateView is not defined for initial render.");
            }

            if (app.state.loadingModal) app.state.loadingModal.hide();

        } catch (e) {
            console.error("Error during data loading/processing pipeline:", e);
            app.DOMElements.errorMessage.textContent = `خطا: ${e.message}. لطفاً اتصال اینترنت و صحت فایل‌ها را بررسی کنید.`;
            app.DOMElements.errorMessage.style.display = 'block';
            if (app.state.loadingModal) app.state.loadingModal.hide();
            // Do not proceed to updateView or further processing
        }
    };
})(window.SAPRA_APP);
