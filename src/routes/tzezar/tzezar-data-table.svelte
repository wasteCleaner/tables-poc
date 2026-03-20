<!--
  Tzezar data table — column headers with sort indicators and resize handles,
  pinned columns (sticky), row body with selection checkboxes, status badges,
  formatted dates/currency, row pinning, action buttons, loading overlay
-->
<script lang="ts">
  import type { DatagridCore } from '$lib/datagrid';
  import type { GridBasicRow, GridRow, LeafColumn } from '$lib/datagrid/core/types';
  import type { Employee } from '$lib/types/employee';
  import { getCellContent } from '$lib/datagrid';

  type Props = {
    datagrid: DatagridCore<Employee>;
    loading: boolean;
    sortColumn: string;
    sortDir: 'asc' | 'desc';
  };

  let { datagrid, loading, sortColumn = $bindable(), sortDir = $bindable() }: Props = $props();

  // ── Shift+click range selection ─────────────────────────────────────
  let lastSelectedIdx = $state<number | null>(null);

  function handleRowClick(row: GridBasicRow<Employee>, idx: number, e: MouseEvent) {
    if (e.shiftKey && lastSelectedIdx !== null) {
      const rows = datagrid.rows.getVisibleBasicRows();
      const start = Math.min(lastSelectedIdx, idx);
      const end = Math.max(lastSelectedIdx, idx);
      for (let i = start; i <= end; i++) {
        datagrid.features.rowSelection.selectRowById(rows[i].identifier);
      }
    } else {
      datagrid.handlers.rows.toggleRowSelection(row.identifier);
      lastSelectedIdx = idx;
    }
  }

  // ── Sorting ─────────────────────────────────────────────────────────
  function handleSort(col: LeafColumn<Employee>) {
    if (!col.options.sortable) return;
    if (sortColumn === col.columnId) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = col.columnId;
      sortDir = 'asc';
    }
  }

  function getSortIndicator(columnId: string): string {
    if (sortColumn !== columnId) return '';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  }

  // ── Column resize via mousedown tracking ────────────────────────────
  function startResize(e: MouseEvent, col: LeafColumn<Employee>) {
    console.log('TZEZAR startResize fired', col.columnId, col.state.size.width);
    if (!col.options.resizable) return;
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = col.state.size.width;

    function onMouseMove(ev: MouseEvent) {
      const newWidth = Math.max(
        col.state.size.minWidth,
        Math.min(col.state.size.maxWidth, startWidth + (ev.clientX - startX))
      );
      datagrid.handlers.column.updateColumnSize(col.columnId, newWidth);
    }

    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  // ── Column pinning ──────────────────────────────────────────────────
  function pinColumn(col: LeafColumn<Employee>, position: 'left' | 'right' | 'none') {
    datagrid.handlers.column.pinColumn(col.columnId, position);
  }

  // ── Row pinning ─────────────────────────────────────────────────────
  function toggleRowPin(row: GridBasicRow<Employee>) {
    if (datagrid.features.rowPinning.isPinned(row.identifier)) {
      datagrid.handlers.rows.unpinRow(row.identifier);
    } else {
      datagrid.handlers.rows.pinRowToTop(row.identifier);
    }
  }

  // ── Rows in pinned order (top, center, bottom) ──────────────────────
  function getRowsInPinnedOrder(): GridBasicRow<Employee>[] {
    return datagrid.rows
      .getVisibleRows()
      .filter((r): r is GridBasicRow<Employee> => !r.isGroupRow());
  }

  // ── Select all on current page ──────────────────────────────────────
  function toggleSelectAll(checked: boolean) {
    if (checked) {
      datagrid.handlers.rows.selectRowsOnCurrentPage();
    } else {
      datagrid.handlers.rows.deselectRowsOnCurrentPage();
    }
  }

  // ── Status badge styling ────────────────────────────────────────────
  function statusColor(s: string): string {
    switch (s) {
      case 'Active':  return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-gray-100 text-gray-800';
      case 'OnLeave': return 'bg-yellow-100 text-yellow-800';
      default:        return 'bg-gray-100 text-gray-800';
    }
  }

  function handleAction(action: string, employee: Employee) {
    console.log(`${action}:`, employee.id, `${employee.firstName} ${employee.lastName}`);
  }

  // ── Derived helpers ─────────────────────────────────────────────────
  function isPinnedLeft(col: LeafColumn<Employee>): boolean {
    return col.state.pinning.position === 'left';
  }

  function isPinnedRight(col: LeafColumn<Employee>): boolean {
    return col.state.pinning.position === 'right';
  }

  function isPinned(col: LeafColumn<Employee>): boolean {
    return col.state.pinning.position !== 'none';
  }

  function allPageSelected(): boolean {
    const rows = datagrid.rows.getVisibleBasicRows();
    if (rows.length === 0) return false;
    return rows.every((r) => datagrid.features.rowSelection.isRowSelected(r.identifier));
  }

  function somePageSelected(): boolean {
    const rows = datagrid.rows.getVisibleBasicRows();
    return rows.some((r) => datagrid.features.rowSelection.isRowSelected(r.identifier));
  }

  /** Dynamic table width = sum of visible column widths + 32px for pin button column */
  function getTableWidth(): number {
    return datagrid.columns.getLeafColumnsInOrder()
      .filter(c => c.state.visible)
      .reduce((sum, c) => sum + c.state.size.width, 0) + 32;
  }
</script>

<div class="relative max-h-[600px] overflow-auto rounded-md border border-gray-200">
  <!-- Loading overlay -->
  {#if loading}
    <div class="absolute inset-0 z-[60] flex items-center justify-center bg-white/60">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
    </div>
  {/if}

  <table class="text-left text-sm" style="table-layout: fixed; width: {getTableWidth()}px">
    <!-- Header -->
    <thead class="sticky top-0 z-30 border-b bg-gray-50 text-xs font-medium uppercase text-gray-600">
      <tr>
        {#each datagrid.columns.getLeafColumnsInOrder() as col (col.columnId)}
          {#if col.state.visible}
            <th
              class="relative select-none overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2
                {isPinned(col) ? 'sticky z-40 bg-gray-100' : ''}"
              style="width: {col.state.size.width}px; left: {isPinnedLeft(col) ? col.state.pinning.offset + 'px' : 'auto'}; right: {isPinnedRight(col) ? col.state.pinning.offset + 'px' : 'auto'}"
            >
              {#if col.columnId === 'select'}
                <!-- Select-all checkbox -->
                <input
                  type="checkbox"
                  checked={allPageSelected()}
                  indeterminate={!allPageSelected() && somePageSelected()}
                  onchange={(e) => toggleSelectAll((e.target as HTMLInputElement).checked)}
                  class="rounded border-gray-300"
                />
              {:else}
                <div class="flex items-center gap-1">
                  {#if col.options.sortable}
                    <button
                      onclick={() => handleSort(col)}
                      class="flex items-center gap-1 hover:text-gray-900"
                    >
                      {col.header}
                      <span class="text-blue-500">{getSortIndicator(col.columnId)}</span>
                    </button>
                  {:else}
                    <span>{col.header}</span>
                  {/if}

                  <!-- Pin toggle -->
                  {#if col.options.pinnable}
                    <button
                      onclick={() => pinColumn(col, isPinned(col) ? 'none' : 'left')}
                      class="ml-auto text-[10px] {isPinned(col) ? 'text-blue-500' : 'text-gray-400'}"
                      title={isPinned(col) ? 'Unpin' : 'Pin'}
                    >
                      &#x1F4CC;
                    </button>
                  {/if}
                </div>

                <!-- Resize handle — z-50 to stay above pin toggle, w-1.5 for easier grab -->
                {#if col.options.resizable}
                  <!-- svelte-ignore a11y_no_static_element_interactions -->
                  <div
                    onmousedown={(e) => { e.stopPropagation(); startResize(e, col); }}
                    class="absolute top-0 right-0 z-50 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-gray-300"
                  ></div>
                {/if}
              {/if}
            </th>
          {/if}
        {/each}
        <!-- Extra th for row-pin button column -->
        <th class="w-8"></th>
      </tr>
    </thead>

    <!-- Body -->
    <tbody class="divide-y divide-gray-100">
      {#each getRowsInPinnedOrder() as row, idx (row.identifier)}
        {@const employee = row.original}
        {@const isPinnedRow = datagrid.features.rowPinning.isPinned(row.identifier)}
        {@const isSelected = datagrid.features.rowSelection.isRowSelected(row.identifier)}
        <tr
          class="transition-colors hover:bg-gray-50
            {isSelected ? 'bg-blue-50' : ''}
            {isPinnedRow ? 'bg-yellow-50' : ''}"
        >
          {#each datagrid.columns.getLeafColumnsInOrder() as col (col.columnId)}
            {#if col.state.visible}
              <td
                class="overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2
                  {isPinned(col) ? `sticky z-10 ${isSelected ? 'bg-blue-50' : isPinnedRow ? 'bg-yellow-50' : 'bg-white'}` : ''}"
                style="width: {col.state.size.width}px; left: {isPinnedLeft(col) ? col.state.pinning.offset + 'px' : 'auto'}; right: {isPinnedRight(col) ? col.state.pinning.offset + 'px' : 'auto'}"
              >
                {#if col.columnId === 'select'}
                  <!-- Row selection checkbox -->
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onclick={(e) => handleRowClick(row, idx, e)}
                    class="rounded border-gray-300"
                  />

                {:else if col.columnId === 'actions'}
                  <!-- Action buttons -->
                  <div class="flex gap-1">
                    <button onclick={() => handleAction('view', employee)} class="rounded px-1.5 py-0.5 text-xs text-blue-600 hover:bg-blue-50">View</button>
                    <button onclick={() => handleAction('edit', employee)} class="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100">Edit</button>
                    <button onclick={() => handleAction('delete', employee)} class="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50">Delete</button>
                  </div>

                {:else if col.columnId === 'status'}
                  <!-- Status badge -->
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {statusColor(employee.status)}">
                    {employee.status}
                  </span>

                {:else if col.columnId === 'id'}
                  <!-- Truncated ID -->
                  <span class="font-mono text-xs text-gray-500">{employee.id.slice(0, 8)}</span>

                {:else if col.columnId === 'email'}
                  <!-- Email link style -->
                  <span class="text-blue-600">{employee.email}</span>

                {:else}
                  <!-- Standard cell via getCellContent (handles formatterFn) -->
                  {getCellContent(col, employee)}
                {/if}
              </td>
            {/if}
          {/each}

          <!-- Row pin control -->
          <td class="w-8 px-1">
            {#if isPinnedRow}
              <button onclick={() => toggleRowPin(row)} class="text-xs text-gray-400 hover:text-gray-600" title="Unpin row">&times;</button>
            {:else}
              <button onclick={() => toggleRowPin(row)} class="text-xs text-gray-400 hover:text-gray-600" title="Pin to top">&#x1F4CC;</button>
            {/if}
          </td>
        </tr>
      {:else}
        <tr>
          <td
            colspan={datagrid.columns.getLeafColumns().filter((c) => c.state.visible).length + 1}
            class="py-8 text-center text-gray-400"
          >
            No results found.
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
