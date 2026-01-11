var QuickGrid = QuickGrid || {};

QuickGrid.Renderers = (function () {
    'use strict';

    /**
     * Renders the status column (completed/pending)
     */
    function renderStatus(data, type, row) {
        if (type === 'display') {
            if (data === true) {
                return '<span class="badge badge-status badge-completed"><i class="bi bi-check-circle-fill me-1"></i>Completed</span>';
            } else {
                return '<span class="badge badge-status badge-pending"><i class="bi bi-clock-fill me-1"></i>Pending</span>';
            }
        }
        return data ? 'Completed' : 'Pending'; // For sorting/filtering
    }

    /**
     * Renders action buttons
     */
    function renderActions(data, type, row) {
        return `
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" onclick="alert('Viewing ID: ${row.id}')" title="View">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-outline-warning" onclick="alert('Editing ID: ${row.id}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger" onclick="alert('Deleting ID: ${row.id}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    }

    return {
        renderStatus: renderStatus,
        renderActions: renderActions
    };

})();
