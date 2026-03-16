<!--
  Tzezar pagination controls — first/prev/next/last buttons, page size select,
  showing X-Y of Z info, selected row count display
-->
<script lang="ts">
  import type { DatagridCore } from '$lib/datagrid';
  import type { Employee } from '$lib/types/employee';

  type Props = {
    datagrid: DatagridCore<Employee>;
    totalRows: number;
    page: number;
    pageSize: number;
    selectedCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };

  let { datagrid, totalRows, page, pageSize, selectedCount, onPageChange, onPageSizeChange }: Props = $props();

  const pageSizes = [20, 50, 100];

  let pageCount = $derived(Math.max(1, Math.ceil(totalRows / pageSize)));
  let showingStart = $derived((page - 1) * pageSize + 1);
  let showingEnd = $derived(Math.min(page * pageSize, totalRows));

  function canGoPrev(): boolean { return page > 1; }
  function canGoNext(): boolean { return page < pageCount; }
</script>

<div class="mt-3 flex items-center justify-between text-sm text-gray-600">
  <!-- Left: selection + row range info -->
  <div class="flex items-center gap-4">
    {#if selectedCount > 0}
      <span>{selectedCount} row{selectedCount > 1 ? 's' : ''} selected</span>
    {/if}
    <span>Showing {showingStart}-{showingEnd} of {totalRows}</span>
  </div>

  <!-- Right: pagination controls -->
  <div class="flex items-center gap-2">
    <!-- Page size selector -->
    <select
      value={pageSize}
      onchange={(e) => onPageSizeChange(Number((e.target as HTMLSelectElement).value))}
      class="rounded-md border border-gray-300 px-2 py-1 text-sm"
    >
      {#each pageSizes as size}
        <option value={size}>{size} / page</option>
      {/each}
    </select>

    <!-- Nav buttons -->
    <button
      onclick={() => onPageChange(1)}
      disabled={!canGoPrev()}
      class="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
    >
      First
    </button>
    <button
      onclick={() => onPageChange(page - 1)}
      disabled={!canGoPrev()}
      class="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
    >
      Prev
    </button>
    <span class="px-2 text-xs">Page {page} of {pageCount}</span>
    <button
      onclick={() => onPageChange(page + 1)}
      disabled={!canGoNext()}
      class="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
    >
      Next
    </button>
    <button
      onclick={() => onPageChange(pageCount)}
      disabled={!canGoNext()}
      class="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
    >
      Last
    </button>
  </div>
</div>
