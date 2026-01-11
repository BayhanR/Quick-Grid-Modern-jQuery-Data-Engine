var QuickGrid = QuickGrid || {};

QuickGrid.DataEngine = (function () {
    'use strict';

    let cachedData = null;

    // Helper: Generate random date within last 365 days
    function randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    function processRequest(dataTablesParameters, callback) {
        if (!cachedData) {
            $.ajax({
                url: 'https://jsonplaceholder.typicode.com/todos',
                method: 'GET',
                dataType: 'json',
                success: function (data) {
                    // Enrich data with simulated dates
                    cachedData = data.map(item => ({
                        ...item,
                        date: randomDate(new Date(2023, 0, 1), new Date()).toISOString().split('T')[0]
                    }));
                    _processData(cachedData, dataTablesParameters, callback);

                    // Trigger an event to update dashboard stats when data is first loaded
                    $(document).trigger('dataEngine:dataLoaded', [cachedData]);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error('Error fetching data:', textStatus, errorThrown);
                    callback({
                        draw: dataTablesParameters.draw,
                        recordsTotal: 0,
                        recordsFiltered: 0,
                        data: [],
                        error: "Could not fetch data"
                    });
                }
            });
        } else {
            _processData(cachedData, dataTablesParameters, callback);
        }
    }

    function _processData(fullData, params, callback) {
        let processedData = [...fullData];
        const searchValue = params.search.value.toLowerCase();

        // Custom Filter: Status
        const statusFilter = params.customStatusFilter; // Passed from App.js

        // 1. Filtering (Global Search + Status Filter)
        if (searchValue || statusFilter) {
            processedData = processedData.filter(item => {
                const matchesSearch = !searchValue || (
                    item.title.toLowerCase().includes(searchValue) ||
                    item.id.toString().includes(searchValue) ||
                    item.date.includes(searchValue)
                );

                const matchesStatus = !statusFilter || (
                    (statusFilter === 'completed' && item.completed) ||
                    (statusFilter === 'pending' && !item.completed)
                );

                return matchesSearch && matchesStatus;
            });
        }

        const recordsFiltered = processedData.length;

        // 2. Sorting
        if (params.order && params.order.length > 0) {
            const order = params.order[0];
            const columnIdx = order.column;
            const dir = order.dir;

            const colMap = {
                0: 'id',
                1: 'title',
                2: 'date',
                3: 'completed'
            };
            const prop = colMap[columnIdx];

            if (prop) {
                processedData.sort((a, b) => {
                    let valA = a[prop];
                    let valB = b[prop];

                    if (typeof valA === 'string') valA = valA.toLowerCase();
                    if (typeof valB === 'string') valB = valB.toLowerCase();

                    if (valA < valB) return dir === 'asc' ? -1 : 1;
                    if (valA > valB) return dir === 'asc' ? 1 : -1;
                    return 0;
                });
            }
        }

        // 3. Paging
        const start = params.start || 0;
        const length = params.length || 10;
        const pageData = length === -1 ? processedData : processedData.slice(start, start + length);

        callback({
            draw: params.draw,
            recordsTotal: fullData.length,
            recordsFiltered: recordsFiltered,
            data: pageData
        });
    }

    /**
     * Updates a specific field of a record. Simulates a DB update.
     */
    function updateRecord(id, field, value) {
        if (!cachedData) return false;

        const recordIndex = cachedData.findIndex(item => item.id == id);
        if (recordIndex !== -1) {
            cachedData[recordIndex][field] = value;
            console.log(`[DataHub] Updated ID ${id}: set ${field} to "${value}"`);

            // Re-broadcast statistics in case a status changed (future proofing)
            $(document).trigger('dataEngine:dataUpdated', [cachedData]);

            return true;
        }
        return false;
    }

    function getStats() {
        if (!cachedData) return { total: 0, completed: 0, pending: 0 };
        return {
            total: cachedData.length,
            completed: cachedData.filter(i => i.completed).length,
            pending: cachedData.filter(i => !i.completed).length
        };
    }

    return {
        processRequest: processRequest,
        updateRecord: updateRecord,
        getStats: getStats,
        _processData: _processData // exposed for tests
    };

})();
