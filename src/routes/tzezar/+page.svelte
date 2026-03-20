<!--
  Tzezar Datagrid POC page — server-side data fetching via @tanstack/svelte-query,
  manual pagination/sorting, column management via DatagridCore headless class
-->
<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { Employee, FilterState } from '$lib/types/employee';
  import { DatagridCore } from '$lib/datagrid';
  import { tzezarColumns } from './lib/tzezar-column-definitions';
  import TzezarFilterToolbar from './tzezar-filter-toolbar.svelte';
  import TzezarDataTable from './tzezar-data-table.svelte';
  import TzezarPaginationControls from './tzezar-pagination-controls.svelte';
  import { readUrlState, writeUrlState, onPopState } from '$lib/url-state-sync';
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { fetchEmployees, employeesQueryKey } from '$lib/api/employees';

  // ── State ──────────────────────────────────────────────────────────
  let totalRows = $state(0);

  // Manual server-side sorting state (mirrors TanStack pattern)
  let sortColumn = $state('');
  let sortDir = $state<'asc' | 'desc'>('asc');

  // Manual server-side pagination state
  let page = $state(1);
  let pageSize = $state(20);

  // Filter state
  let search = $state('');
  let filters = $state<FilterState[]>([]);
  let filterLogic = $state<'and' | 'or'>('and');
  let hireDateFrom = $state('');
  let hireDateTo = $state('');

  // Guard flag to prevent read → write → read infinite loop on init
  let urlInitialized = $state(false);

  // ── DatagridCore instance ──────────────────────────────────────────
  const datagrid = new DatagridCore<Employee>({
    columns: tzezarColumns,
    data: [],
    initialState: {
      sorting: { isManual: true },
      pagination: { manual: true, page: 1, pageSize: 20, pageCount: 1, totalCount: 0, pageSizes: [20, 50, 100] }
    }
  });

  // ── URL init helpers ───────────────────────────────────────────────

  /** Apply parsed URL state to all reactive state variables */
  function applyUrlState() {
    const s = readUrlState();

    sortColumn = s.sort ?? '';
    sortDir = s.sortDir ?? 'asc';
    page = s.page ?? 1;
    pageSize = s.pageSize ?? 20;
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

    // Apply hidden columns to datagrid column state
    const hiddenSet = s.hiddenColumns
      ? new Set(s.hiddenColumns.split(',').filter(Boolean))
      : new Set<string>();

    const leafCols = datagrid.columns.getLeafColumns();
    for (const col of leafCols) {
      col.state.visible = !hiddenSet.has(col.columnId);
    }

    // Apply pinning to datagrid column state
    const pinnedLeft = s.pinnedLeft ? s.pinnedLeft.split(',').filter(Boolean) : [];
    const pinnedRight = s.pinnedRight ? s.pinnedRight.split(',').filter(Boolean) : [];

    for (const col of leafCols) {
      if (pinnedLeft.includes(col.columnId)) {
        col.state.pinning.position = 'left';
      } else if (pinnedRight.includes(col.columnId)) {
        col.state.pinning.position = 'right';
      } else {
        col.state.pinning.position = 'none';
      }
    }
  }

  onMount(() => {
    applyUrlState();
    urlInitialized = true;
    return onPopState(() => applyUrlState());
  });

  // ── URL write effect ───────────────────────────────────────────────
  $effect(() => {
    if (!urlInitialized) return;

    const allLeafCols = datagrid.columns.getLeafColumns();

    const hiddenIds = allLeafCols
      .filter((col) => col.state.visible === false)
      .map((col) => col.columnId);

    const pinnedLeftIds = allLeafCols
      .filter((col) => col.state.pinning?.position === 'left')
      .map((col) => col.columnId);

    const pinnedRightIds = allLeafCols
      .filter((col) => col.state.pinning?.position === 'right')
      .map((col) => col.columnId);

    writeUrlState({
      sort: sortColumn || undefined,
      sortDir: sortColumn ? sortDir : undefined,
      page,
      pageSize,
      search: search || undefined,
      filters: filters.length > 0 ? JSON.stringify(filters) : undefined,
      filterLogic,
      hireDateFrom: hireDateFrom || undefined,
      hireDateTo: hireDateTo || undefined,
      hiddenColumns: hiddenIds.length > 0 ? hiddenIds.join(',') : undefined,
      pinnedLeft: pinnedLeftIds.length > 0 ? pinnedLeftIds.join(',') : undefined,
      pinnedRight: pinnedRightIds.length > 0 ? pinnedRightIds.join(',') : undefined
    });
  });

  // ── Data fetching via TanStack Query ──────────────────────────────
  const queryClient = useQueryClient();

  const employeesQuery = createQuery(() => {
    const params = {
      sort: sortColumn || undefined,
      sortDir: sortColumn ? sortDir : undefined,
      page,
      pageSize,
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

  // Sync query results into datagrid + local state
  $effect(() => {
    const result = employeesQuery.data;
    if (!result) return;

    // untrack: the datagrid methods read from $state internally (originalState,
    // cacheManager, processors) — without untrack the $effect would subscribe
    // to those reads and re-trigger itself in a loop (~100× → 20s delay).
    untrack(() => {
      datagrid.originalState.data = result.data;
      datagrid.cacheManager.invalidate('everything');
      datagrid.processors.data.executeFullDataTransformation();

      totalRows = result.total;
      datagrid.features.pagination.totalCount = result.total;
      datagrid.features.pagination.pageCount = Math.ceil(result.total / pageSize);
    });
  });

  let loading = $derived(employeesQuery.isFetching);

  // ── Page navigation helpers passed down to pagination component ────
  function goToPage(newPage: number) {
    page = newPage;
  }

  function setPageSize(newSize: number) {
    pageSize = newSize;
    page = 1;
  }
</script>

<div class="mx-auto max-w-350 p-4">
  <h1 class="mb-4 text-2xl font-bold">Tzezar Datagrid</h1>

  <TzezarFilterToolbar
    {datagrid}
    bind:search
    bind:filters
    bind:filterLogic
    bind:hireDateFrom
    bind:hireDateTo
    onRefresh={() => queryClient.invalidateQueries({ queryKey: ['employees'] })}
  />

  <TzezarDataTable
    {datagrid}
    {loading}
    bind:sortColumn
    bind:sortDir
  />

  <TzezarPaginationControls
    {datagrid}
    {totalRows}
    {page}
    {pageSize}
    selectedCount={datagrid.features.rowSelection.selectedRowIds.size}
    onPageChange={goToPage}
    onPageSizeChange={setPageSize}
  />
</div>
