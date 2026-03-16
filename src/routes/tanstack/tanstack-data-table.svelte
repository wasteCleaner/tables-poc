<!--
  TanStack data table — headers with sort/resize, body with pinned rows,
  selection checkboxes, action buttons, column pinning, loading overlay
-->
<script lang="ts">
  import type { Table, Header, Row } from '@tanstack/table-core';
  import type { Employee } from '$lib/types/employee';
  import FlexRender from './lib/flex-render.svelte';

  type Props = {
    table: Table<Employee>;
    loading: boolean;
  };

  let { table, loading }: Props = $props();

  // Shift+click range selection tracking
  let lastSelectedIdx = $state<number | null>(null);

  function handleRowClick(row: Row<Employee>, idx: number, e: MouseEvent) {
    if (e.shiftKey && lastSelectedIdx !== null) {
      const start = Math.min(lastSelectedIdx, idx);
      const end = Math.max(lastSelectedIdx, idx);
      const rows = table.getRowModel().rows;
      const newSelection: Record<string, boolean> = { ...table.getState().rowSelection };
      for (let i = start; i <= end; i++) {
        newSelection[rows[i].id] = true;
      }
      table.setRowSelection(newSelection);
    } else {
      row.toggleSelected();
      lastSelectedIdx = idx;
    }
  }

  function getSortIndicator(header: Header<Employee, unknown>): string {
    const sort = header.column.getIsSorted();
    if (sort === 'asc') return ' \u2191';
    if (sort === 'desc') return ' \u2193';
    return '';
  }

  function handleAction(action: string, employee: Employee) {
    console.log(`${action}:`, employee.id, `${employee.firstName} ${employee.lastName}`);
  }

  function pinColumn(header: Header<Employee, unknown>, position: 'left' | 'right' | false) {
    header.column.pin(position);
  }

  /** Consistent row background for both <tr> and pinned <td> */
  function rowBg(row: Row<Employee>): string {
    if (row.getIsSelected()) return 'bg-blue-50';
    if (row.getIsPinned()) return 'bg-yellow-50';
    return '';
  }
</script>

<div class="relative max-h-[600px] overflow-auto rounded-md border border-gray-200">
  <!-- Loading overlay -->
  {#if loading}
    <div class="absolute inset-0 z-[60] flex items-center justify-center bg-white/60">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
    </div>
  {/if}

  <table class="text-left text-sm" style="table-layout: fixed; width: {table.getVisibleLeafColumns().reduce((sum, c) => sum + c.getSize(), 0) + 32}px">
    <!-- Header -->
    <thead class="sticky top-0 z-30 border-b bg-gray-50 text-xs font-medium uppercase text-gray-600">
      {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
        <tr>
          {#each headerGroup.headers as header (header.id)}
            <th
              class="relative select-none whitespace-nowrap px-3 py-2
                {header.column.getIsPinned() ? 'sticky z-40 bg-gray-100' : ''}"
              style="width: {header.getSize()}px;{header.column.getIsPinned() === 'left' ? ` left: ${header.column.getStart('left')}px;` : ''}{header.column.getIsPinned() === 'right' ? ` right: ${header.column.getAfter('right')}px;` : ''}"
              colspan={header.colSpan}
            >
              {#if header.column.columnDef.meta?.type === 'select'}
                <!-- Select all checkbox -->
                <input
                  type="checkbox"
                  checked={table.getIsAllPageRowsSelected()}
                  indeterminate={table.getIsSomePageRowsSelected()}
                  onchange={() => table.toggleAllPageRowsSelected()}
                  class="rounded border-gray-300"
                />
              {:else if !header.isPlaceholder}
                <!-- Sortable header -->
                <div class="flex items-center gap-1">
                  {#if header.column.getCanSort()}
                    <button
                      onclick={() => header.column.toggleSorting()}
                      class="flex items-center gap-1 hover:text-gray-900"
                    >
                      <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
                      <span class="text-blue-500">{getSortIndicator(header)}</span>
                    </button>
                  {:else}
                    <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
                  {/if}

                  <!-- Pin toggle -->
                  {#if header.column.getCanPin()}
                    <button
                      onclick={() => pinColumn(header, header.column.getIsPinned() ? false : 'left')}
                      class="ml-auto text-[10px] {header.column.getIsPinned() ? 'text-blue-500' : 'text-gray-400'}"
                      title={header.column.getIsPinned() ? 'Unpin' : 'Pin'}
                    >
                      &#x1F4CC;
                    </button>
                  {/if}
                </div>

                <!-- Resize handle — z-50 to stay above pin toggle, w-1.5 for easier grab -->
                {#if header.column.getCanResize()}
                  <div
                    onmousedown={(e) => { console.log('TANSTACK resize mousedown', header.column.id); e.stopPropagation(); header.getResizeHandler()(e); }}
                    ontouchstart={(e) => { e.stopPropagation(); header.getResizeHandler()(e); }}
                    class="absolute top-0 right-0 z-50 h-full w-1.5 cursor-col-resize select-none touch-none
                      {header.column.getIsResizing() ? 'bg-blue-500' : 'hover:bg-gray-300'}"
                  ></div>
                {/if}
              {/if}
            </th>
          {/each}
        </tr>
      {/each}
    </thead>

    <!-- Body -->
    <tbody class="divide-y divide-gray-100">
      {#snippet rowTemplate(row: Row<Employee>, idx: number)}
        <tr class="transition-colors hover:bg-gray-50 {rowBg(row)}">
          {#each [...row.getLeftVisibleCells(), ...row.getCenterVisibleCells(), ...row.getRightVisibleCells()] as cell (cell.id)}
            <td
              class="whitespace-nowrap px-3 py-2
                {cell.column.getIsPinned() ? `sticky z-10 ${rowBg(row) || 'bg-white'}` : ''}"
              style="width: {cell.column.getSize()}px;{cell.column.getIsPinned() === 'left' ? ` left: ${cell.column.getStart('left')}px;` : ''}{cell.column.getIsPinned() === 'right' ? ` right: ${cell.column.getAfter('right')}px;` : ''}"
            >
              {#if cell.column.columnDef.meta?.type === 'select'}
                <input
                  type="checkbox"
                  checked={row.getIsSelected()}
                  onclick={(e) => handleRowClick(row, idx, e)}
                  class="rounded border-gray-300"
                />
              {:else if cell.column.columnDef.meta?.type === 'actions'}
                <div class="flex gap-1">
                  <button onclick={() => handleAction('view', row.original)} class="rounded px-1.5 py-0.5 text-xs text-blue-600 hover:bg-blue-50">View</button>
                  <button onclick={() => handleAction('edit', row.original)} class="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-100">Edit</button>
                  <button onclick={() => handleAction('delete', row.original)} class="rounded px-1.5 py-0.5 text-xs text-red-600 hover:bg-red-50">Delete</button>
                </div>
              {:else}
                <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
              {/if}
            </td>
          {/each}

          <!-- Row pin control -->
          <td class="w-8 px-1">
            {#if row.getIsPinned()}
              <button onclick={() => row.pin(false)} class="text-xs text-gray-400 hover:text-gray-600" title="Unpin row">&times;</button>
            {:else}
              <button onclick={() => row.pin('top')} class="text-xs text-gray-400 hover:text-gray-600" title="Pin to top">&#x1F4CC;</button>
            {/if}
          </td>
        </tr>
      {/snippet}

      {#if table.getRowModel().rows.length === 0}
        <tr>
          <td colspan={table.getAllColumns().length + 1} class="py-8 text-center text-gray-400">
            No results found.
          </td>
        </tr>
      {:else}
        <!-- Pinned top rows -->
        {#each table.getTopRows() as row, idx (row.id)}
          {@render rowTemplate(row, idx)}
        {/each}
        <!-- Center (unpinned) rows -->
        {#each table.getCenterRows() as row, idx (row.id)}
          {@render rowTemplate(row, idx)}
        {/each}
        <!-- Pinned bottom rows -->
        {#each table.getBottomRows() as row, idx (row.id)}
          {@render rowTemplate(row, idx)}
        {/each}
      {/if}
    </tbody>
  </table>
</div>
