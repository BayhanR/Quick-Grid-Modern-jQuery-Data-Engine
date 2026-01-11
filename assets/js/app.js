$(document).ready(function () {

    // --- Chart Initialization ---
    const ctx = document.getElementById('statusChart').getContext('2d');
    let statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#d1e7dd', '#fff3cd'], // Match badge colors (Bootstrap light variants)
                borderColor: ['#0f5132', '#664d03'],
                borderWidth: 1,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } } }
            },
            cutout: '70%'
        }
    });

    function updateDashboard(data) {
        const stats = QuickGrid.DataEngine.getStats();

        // Update Numbers
        $('#totalCount').text(stats.total);
        $('#completedCount').text(stats.completed);
        $('#pendingCount').text(stats.pending);

        // Update Chart
        statusChart.data.datasets[0].data = [stats.completed, stats.pending];
        statusChart.update();
    }

    // Listener for DataHub events
    $(document).on('dataEngine:dataLoaded dataEngine:dataUpdated', function () {
        updateDashboard();
    });


    // --- DataTables Initialization ---
    var table = $('#quickGridTable').DataTable({
        serverSide: true,
        processing: true,
        ajax: function (data, callback, settings) {
            // Append custom filter value to DataTables params
            data.customStatusFilter = $('#statusFilter').val();
            QuickGrid.DataEngine.processRequest(data, callback);
        },
        columns: [
            { data: 'id', width: '50px' },
            {
                data: 'title',
                createdCell: function (td, cellData, rowData, row, col) {
                    // Mark cell as editable
                    $(td).addClass('editable-cell').attr('data-id', rowData.id).attr('data-field', 'title');
                }
            },
            { data: 'date', width: '100px' },
            {
                data: 'completed',
                width: '100px',
                render: QuickGrid.Renderers.renderStatus
            },
            {
                data: null,
                orderable: false,
                searchable: false,
                width: '80px',
                render: QuickGrid.Renderers.renderActions
            }
        ],
        dom: 'Bfrtip',
        buttons: [
            {
                extend: 'excelHtml5',
                text: '<i class="bi bi-file-earmark-excel me-1"></i>Excel',
                className: 'btn btn-success btn-sm',
                exportOptions: { columns: [0, 1, 2, 3] }
            },
            {
                extend: 'pdfHtml5',
                text: '<i class="bi bi-file-earmark-pdf me-1"></i>PDF',
                className: 'btn btn-danger btn-sm',
                exportOptions: { columns: [0, 1, 2, 3] }
            }
        ],
        language: {
            processing: '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>',
            search: "_INPUT_",
            searchPlaceholder: "Search records..."
        },
        pageLength: 10,
        lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
        responsive: true,
        initComplete: function () {
            $('.dt-buttons .btn').removeClass('btn-secondary');
            $('#quickGridTable tbody').addClass('fade-in');
        }
    });

    // --- Interaction Logic ---

    // 1. Refresh Button
    $('#refreshBtn').on('click', function () {
        table.ajax.reload();
    });

    // 2. Status Filter
    $('#statusFilter').on('change', function () {
        table.ajax.reload(); // Trigger Ajax reload, DataEngine picks up new filter param
    });

    // 3. Inline Editing (Double Click)
    $('#quickGridTable tbody').on('dblclick', '.editable-cell', function () {
        var $cell = $(this);
        var originalValue = table.cell(this).data();
        var id = $cell.attr('data-id');
        var field = $cell.attr('data-field');

        // Avoid multiple inputs
        if ($cell.find('input').length > 0) return;

        var $input = $('<input type="text" class="form-control form-control-sm" />')
            .val(originalValue)
            .css('width', '100%');

        $cell.html($input);
        $input.focus();

        // Save on Enter or Blur
        $input.on('blur keydown', function (e) {
            if (e.type === 'keydown' && e.key !== 'Enter') return;

            var newValue = $input.val();

            // Optimistic UI update
            // Note: In a real app we'd wait for API response. Here we update memory via DataEngine.

            if (newValue !== originalValue) {
                QuickGrid.DataEngine.updateRecord(id, field, newValue);
                // We must redraw to keep DataTables internal cache in sync, 
                // but 'draw(false)' keeps paging position.
                table.ajax.reload(null, false);
            } else {
                table.ajax.reload(null, false); // Just restore original view
            }
        });
    });

});
