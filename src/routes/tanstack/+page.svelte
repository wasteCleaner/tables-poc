<!--
  TanStack Table v8 POC page — data fetching via @tanstack/svelte-query,
  URL state sync, component composition
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Employee, FilterState } from '$lib/types/employee';
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
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { createSvelteTable } from './lib/create-svelte-table.svelte';
  import { columns } from './lib/tanstack-column-definitions';
  import TanstackTable from './tanstack-data-table.svelte';
  import TanstackToolbar from './tanstack-filter-toolbar.svelte';
  import TanstackPagination from './tanstack-pagination-controls.svelte';
  import { readUrlState, writeUrlState, onPopState } from '$lib/url-state-sync';
  import { fetchEmployees, employeesQueryKey } from '$lib/api/employees';

  // ── State ──────────────────────────────────────────────────────

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

    if (s.sort && s.sortDir) {
      sorting = [{ id: s.sort, desc: s.sortDir === 'desc' }];
    } else {
      sorting = [];
    }

    pagination = { pageIndex: (s.page ?? 1) - 1, pageSize: s.pageSize ?? 20 };

    search = s.search ?? '';
    filterLogic = s.filterLogic ?? 'and';
    hireDateFrom = s.hireDateFrom ?? '';
    hireDateTo = s.hireDateTo ?? '';

    if (s.filters) {
      try {
        filters = JSON.parse(s.filters) as FilterState[];
      } catch {
        filters = [];
      }
    } else {
      filters = [];
    }

    if (s.hiddenColumns) {
      const hidden = s.hiddenColumns.split(',').filter(Boolean);
      const vis: VisibilityState = {};
      for (const id of hidden) vis[id] = false;
      columnVisibility = vis;
    } else {
      columnVisibility = {};
    }

    const left = s.pinnedLeft ? s.pinnedLeft.split(',').filter(Boolean) : [];
    const right = s.pinnedRight ? s.pinnedRight.split(',').filter(Boolean) : [];
    columnPinning = { left, right };
  }

  onMount(() => {
    applyUrlState();
    urlInitialized = true;
    return onPopState(() => applyUrlState());
  });

  // ── URL write effect ───────────────────────────────────────────
  $effect(() => {
    if (!urlInitialized) return;

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

  // ── Data fetching via TanStack Query ──────────────────────────
  const queryClient = useQueryClient();

  const employeesQuery = createQuery(() => {
    const sortEntry = sorting[0];
    const params = {
      sort: sortEntry?.id,
      sortDir: sortEntry ? (sortEntry.desc ? 'desc' : 'asc') : undefined,
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      search: search || undefined,
      filters: filters.length > 0 ? filters : undefined,
      filterLogic,
      hireDateFrom: hireDateFrom || undefined,
      hireDateTo: hireDateTo || undefined
    };
    return {
      queryKey: employeesQueryKey(params),
      queryFn: () => fetchEmployees(params)
    };
  });

  // Derived data from query — no manual loading/data state needed
  let data = $derived<Employee[]>(employeesQuery.data?.data ?? []);
  let totalRows = $derived(employeesQuery.data?.total ?? 0);
  let loading = $derived(employeesQuery.isFetching);

  // ── Table Instance ─────────────────────────────────────────────
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

<div class="mx-auto max-w-350 p-4">
  <h1 class="mb-4 text-2xl font-bold">TanStack Table v8</h1>

  <TanstackToolbar
    {table}
    bind:search
    bind:filters
    bind:filterLogic
    bind:hireDateFrom
    bind:hireDateTo
    onRefresh={() => queryClient.invalidateQueries({ queryKey: ['employees'] })}
  />

  <TanstackTable {table} {loading} />

  <TanstackPagination {table} {totalRows} />
</div>
