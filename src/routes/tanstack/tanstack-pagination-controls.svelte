<!--
  TanStack pagination — first/prev/next/last, page size select, row count info
-->
<script lang="ts">
  import type { Table } from '@tanstack/table-core';
  import type { Employee } from '$lib/types/employee';

  type Props = {
    table: Table<Employee>;
    totalRows: number;
  };

  let { table, totalRows }: Props = $props();

  const pageSizes = [20, 50, 100];

  let pageIndex = $derived(table.getState().pagination.pageIndex);
  let pageSize = $derived(table.getState().pagination.pageSize);
  let pageCount = $derived(table.getPageCount());
  let selectedCount = $derived(Object.keys(table.getState().rowSelection).length);
  let showingStart = $derived(pageIndex * pageSize + 1);
  let showingEnd = $derived(Math.min((pageIndex + 1) * pageSize, totalRows));
</script>

<div class="mt-3 flex items-center justify-between text-sm text-gray-600">
  <!-- Left: selection info -->
  <div class="flex items-center gap-4">
    {#if selectedCount > 0}
      <span>{selectedCount} row{selectedCount > 1 ? 's' : ''} selected</span>
    {/if}
    <span>
      Showing {showingStart}-{showingEnd} of {totalRows}
    </span>
  </div>

  <!-- Right: pagination controls -->
  <div class="flex items-center gap-2">
    <!-- Page size -->
    <select
      value={pageSize}
      onchange={(e) => table.setPageSize(Number((e.target as HTMLSelectElement).value))}
      class="rounded-md border border-gray-300 px-2 py-1 text-sm"
    >
      {#each pageSizes as size}
        <option value={size}>{size} / page</option>
      {/each}
    </select>

    <!-- Nav buttons -->
    <button
      onclick={() => table.setPageIndex(0)}
      disabled={!table.getCanPreviousPage()}
      class="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
    >
      First
    </button>
    <button
      onclick={() => table.previousPage()}
      disabled={!table.getCanPreviousPage()}
      class="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
    >
      Prev
    </button>
    <span class="px-2 text-xs">
      Page {pageIndex + 1} of {pageCount}
    </span>
    <button
      onclick={() => table.nextPage()}
      disabled={!table.getCanNextPage()}
      class="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
    >
      Next
    </button>
    <button
      onclick={() => table.setPageIndex(pageCount - 1)}
      disabled={!table.getCanNextPage()}
      class="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
    >
      Last
    </button>
  </div>
</div>
