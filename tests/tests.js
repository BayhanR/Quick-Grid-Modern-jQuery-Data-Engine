QUnit.module('Renderers', function () {
    QUnit.test('renderStatus returns correct HTML for completed task', function (assert) {
        const result = QuickGrid.Renderers.renderStatus(true, 'display', {});
        assert.true(result.includes('badge-completed'), 'Should contain badge-completed class');
        assert.true(result.includes('Completed'), 'Should contain text "Completed"');
    });

    QUnit.test('renderStatus returns correct HTML for pending task', function (assert) {
        const result = QuickGrid.Renderers.renderStatus(false, 'display', {});
        assert.true(result.includes('badge-pending'), 'Should contain badge-pending class');
        assert.true(result.includes('Pending'), 'Should contain text "Pending"');
    });

    QUnit.test('renderStatus returns text for sort/filter', function (assert) {
        assert.equal(QuickGrid.Renderers.renderStatus(true, 'sort', {}), 'Completed', 'Should return "Completed" string');
        assert.equal(QuickGrid.Renderers.renderStatus(false, 'filter', {}), 'Pending', 'Should return "Pending" string');
    });
});

QUnit.module('DataEngine', function (hooks) {
    let mockData;

    hooks.beforeEach(function () {
        mockData = [
            { id: 1, title: 'Test Task 1', completed: false },
            { id: 2, title: 'Another Task', completed: true },
            { id: 3, title: 'Coding works', completed: false }
        ];
    });

    QUnit.test('Filtering works correctly', function (assert) {
        const params = {
            draw: 1,
            start: 0,
            length: 10,
            search: { value: 'Coding' },
            order: []
        };

        QuickGrid.DataEngine._processData(mockData, params, function (result) {
            assert.equal(result.recordsFiltered, 1, 'Should filter down to 1 record');
            assert.equal(result.data[0].id, 3, 'Should be the "Coding works" task');
        });
    });

    QUnit.test('Paging works correctly', function (assert) {
        const params = {
            draw: 1,
            start: 1, // Skip first
            length: 1, // Take one
            search: { value: '' },
            order: []
        };

        QuickGrid.DataEngine._processData(mockData, params, function (result) {
            assert.equal(result.data.length, 1, 'Should return 1 record');
            assert.equal(result.data[0].id, 2, 'Should be the second record');
        });
    });

    QUnit.test('Sorting works correctly', function (assert) {
        const params = {
            draw: 1,
            start: 0,
            length: 10,
            search: { value: '' },
            order: [{ column: 1, dir: 'desc' }] // Sort by Title DESC
        };
        // Titles: "Test Task 1", "Another Task", "Coding works"
        // Sorted DESC: "Test Task 1", "Coding works", "Another Task"

        QuickGrid.DataEngine._processData(mockData, params, function (result) {
            assert.equal(result.data[0].title, 'Test Task 1', 'First should be Test Task 1');
            assert.equal(result.data[1].title, 'Coding works', 'Second should be Coding works');
            assert.equal(result.data[2].title, 'Another Task', 'Third should be Another Task');
        });
    });
});
