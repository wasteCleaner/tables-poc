<!--
  TanStack Table v8 POC page — data fetching, URL state, component composition
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Employee, ApiResponse, FilterState, SortState } from '$lib/types/employee';
  import type {
    SortingState,
    PaginationState,
    VisibilityState,
    RowSelectionState,
    ColumnPinningState,
    RowPinningState,
    ColumnSizingState,
    ColumnSizingInfoState
  } from '@tanstack/table-core';
  import { getCoreRowModel, getExpandedRowModel } from '@tanstack/table-core';
  import { createSvelteTable } from './lib/create-svelte-table.svelte';
  import { columns } from './lib/tanstack-column-definitions';
  import TanstackTable from './tanstack-data-table.svelte';
  import TanstackToolbar from './tanstack-filter-toolbar.svelte';
  import TanstackPagination from './tanstack-pagination-controls.svelte';
  import { readUrlState, writeUrlState, onPopState } from '$lib/url-state-sync';

  // ── State ──────────────────────────────────────────────────────
  let data = $state<Employee[]>([]);
  let totalRows = $state(0);
  let loading = $state(false);
  let refreshKey = $state(0);

  // Table state synced with URL — initialized from URL on mount
  let sorting = $state<SortingState>([]);
  let pagination = $state<PaginationState>({ pageIndex: 0, pageSize: 20 });
  let columnVisibility = $state<VisibilityState>({});
  let rowSelection = $state<RowSelectionState>({});
  let columnPinning = $state<ColumnPinningState>({ left: [], right: [] });
  let rowPinning = $state<RowPinningState>({ top: [], bottom: [] });
  let columnSizing = $state<ColumnSizingState>({});
  let columnSizingInfo = $state<ColumnSizingInfoState>({} as ColumnSizingInfoState);
  let search = $state('');
  let filters = $state<FilterState[]>([]);
  let filterLogic = $state<'and' | 'or'>('and');
  let hireDateFrom = $state('');
  let hireDateTo = $state('');

  // Guard flag to prevent read → write → read infinite loop on init
  let urlInitialized = $state(false);

  // ── URL init helpers ───────────────────────────────────────────

  /** Apply parsed URL state to all reactive state variables */
  function applyUrlState() {
    const s = readUrlState();

    // Sorting
    if (s.sort && s.sortDir) {
      sorting = [{ id: s.sort, desc: s.sortDir === 'desc' }];
    } else {
      sorting = [];
    }

    // Pagination (URL uses 1-based page, TanStack uses 0-based pageIndex)
    pagination = { pageIndex: (s.page ?? 1) - 1, pageSize: s.pageSize ?? 20 };

    // Filters
    search = s.search ?? '';
    filterLogic = s.filterLogic ?? 'and';
    hireDateFrom = s.hireDateFrom ?? '';
    hireDateTo = s.hireDateTo ?? '';

    // Parse JSON-encoded filters
    if (s.filters) {
      try {
        filters = JSON.parse(s.filters) as FilterState[];
      } catch {
        filters = [];
      }
    } else {
      filters = [];
    }

    // Column visibility — comma-separated hidden column IDs → VisibilityState map
    if (s.hiddenColumns) {
      const hidden = s.hiddenColumns.split(',').filter(Boolean);
      const vis: VisibilityState = {};
      for (const id of hidden) vis[id] = false;
      columnVisibility = vis;
    } else {
      columnVisibility = {};
    }

    // Column pinning
    const left = s.pinnedLeft ? s.pinnedLeft.split(',').filter(Boolean) : [];
    const right = s.pinnedRight ? s.pinnedRight.split(',').filter(Boolean) : [];
    columnPinning = { left, right };
  }

  onMount(() => {
    applyUrlState();
    urlInitialized = true;

    // Handle browser back/forward navigation
    const unsubscribe = onPopState(() => {
      applyUrlState();
    });
    return unsubscribe;
  });

  // ── URL write effect ───────────────────────────────────────────
  // Only write to URL after initial state has been read from URL
  $effect(() => {
    if (!urlInitialized) return;

    // Build serialized state for URL
    const sortEntry = sorting[0];
    const hiddenIds = Object.entries(columnVisibility)
      .filter(([, v]) => v === false)
      .map(([k]) => k);

    writeUrlState({
      sort: sortEntry?.id,
      sortDir: sortEntry ? (sortEntry.desc ? 'desc' : 'asc') : undefined,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: search || undefined,
      filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
      filterLogic,
      hireDateFrom: hireDateFrom || undefined,
      hireDateTo: hireDateTo || undefined,
      hiddenColumns: hiddenIds.length > 0 ? hiddenIds.join(',') : undefined,
      pinnedLeft: (columnPinning.left ?? []).length > 0 ? (columnPinning.left ?? []).join(',') : undefined,
      pinnedRight: (columnPinning.right ?? []).length > 0 ? (columnPinning.right ?? []).join(',') : undefined
    });
  });

  // ── API Fetch ──────────────────────────────────────────────────
  async function fetchData() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (sorting.length > 0) {
        params.set('sort', sorting.map((s) => s.id).join(','));
        params.set('sortDir', sorting.map((s) => (s.desc ? 'desc' : 'asc')).join(','));
      }
      params.set('page', String(pagination.pageIndex + 1));
      params.set('pageSize', String(pagination.pageSize));
      if (search) params.set('search', search);
      if (filters.length > 0) params.set('filters', JSON.stringify(filters));
      params.set('filterLogic', filterLogic);
      if (hireDateFrom) params.set('hireDateFrom', hireDateFrom);
      if (hireDateTo) params.set('hireDateTo', hireDateTo);

      const res = await fetch(`/api/employees?${params}`);
      const json: ApiResponse<Employee> = await res.json();
      data = json.data;
      totalRows = json.total;
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      loading = false;
    }
  }

  // Re-fetch on any query param change
  $effect(() => {
    // Touch reactive deps
    sorting; pagination; search; filters; filterLogic; hireDateFrom; hireDateTo; refreshKey;
    fetchData();
  });

  // ── Table Instance ─────────────────────────────────────────────
  // Row model factories must be created ONCE, not on every options() call.
  // Re-creating them causes TanStack to reset internal state (resize, etc.).
  const coreRowModel = getCoreRowModel();
  const expandedRowModel = getExpandedRowModel();

  const table = createSvelteTable(() => ({
    data,
    columns,
    getCoreRowModel: coreRowModel,
    getExpandedRowModel: expandedRowModel,
    manualSorting: true,
    manualFiltering: true,
    manualPagination: true,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnPinning: true,
    enableRowPinning: true,
    columnResizeMode: 'onChange',
    rowCount: totalRows,
    state: {
      sorting,
      pagination,
      columnVisibility,
      rowSelection,
      columnPinning,
      rowPinning,
      columnSizing,
      columnSizingInfo
    },
    onSortingChange: (updater) => {
      sorting = typeof updater === 'function' ? updater(sorting) : updater;
    },
    onPaginationChange: (updater) => {
      pagination = typeof updater === 'function' ? updater(pagination) : updater;
    },
    onColumnVisibilityChange: (updater) => {
      columnVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
    },
    onRowSelectionChange: (updater) => {
      rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
    },
    onColumnPinningChange: (updater) => {
      columnPinning = typeof updater === 'function' ? updater(columnPinning) : updater;
    },
    onRowPinningChange: (updater) => {
      rowPinning = typeof updater === 'function' ? updater(rowPinning) : updater;
    },
    onColumnSizingChange: (updater) => {
      columnSizing = typeof updater === 'function' ? updater(columnSizing) : updater;
    },
    onColumnSizingInfoChange: (updater) => {
      columnSizingInfo = typeof updater === 'function' ? updater(columnSizingInfo) : updater;
    }
  }));
</script>

<div class="mx-auto max-w-[1400px] p-4">
  <h1 class="mb-4 text-2xl font-bold">TanStack Table v8</h1>

  <TanstackToolbar
    {table}
    bind:search
    bind:filters
    bind:filterLogic
    bind:hireDateFrom
    bind:hireDateTo
    onRefresh={() => refreshKey++}
  />

  <TanstackTable {table} {loading} />

  <TanstackPagination {table} {totalRows} />
</div>
