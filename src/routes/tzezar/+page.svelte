<!--
  Tzezar Datagrid POC page — server-side data fetching, manual pagination/sorting,
  column management via DatagridCore headless class
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { Employee, ApiResponse, FilterState } from '$lib/types/employee';
  import { DatagridCore } from '$lib/datagrid';
  import { tzezarColumns } from './lib/tzezar-column-definitions';
  import TzezarFilterToolbar from './tzezar-filter-toolbar.svelte';
  import TzezarDataTable from './tzezar-data-table.svelte';
  import TzezarPaginationControls from './tzezar-pagination-controls.svelte';
  import { readUrlState, writeUrlState, onPopState } from '$lib/url-state-sync';

  // ── State ──────────────────────────────────────────────────────────
  let data = $state<Employee[]>([]);
  let totalRows = $state(0);
  let loading = $state(false);
  let refreshKey = $state(0);

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
  // isManual=true disables internal sorting/pagination so we manage server-side
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

    // Handle browser back/forward navigation
    const unsubscribe = onPopState(() => {
      applyUrlState();
    });
    return unsubscribe;
  });

  // ── URL write effect ───────────────────────────────────────────────
  // Only write to URL after initial state has been read from URL
  $effect(() => {
    if (!urlInitialized) return;

    // Collect hidden/pinned column IDs from datagrid leaf column state
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

  // ── API Fetch ──────────────────────────────────────────────────────
  async function fetchData() {
    loading = true;
    try {
      const params = new URLSearchParams();
      if (sortColumn) {
        params.set('sort', sortColumn);
        params.set('sortDir', sortDir);
      }
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (search) params.set('search', search);
      if (filters.length > 0) params.set('filters', JSON.stringify(filters));
      params.set('filterLogic', filterLogic);
      if (hireDateFrom) params.set('hireDateFrom', hireDateFrom);
      if (hireDateTo) params.set('hireDateTo', hireDateTo);

      const res = await fetch(`/api/employees?${params}`);
      const json: ApiResponse<Employee> = await res.json();

      // Feed fresh data into datagrid — invalidate cache so stale filtered/sorted
      // data from the initial empty-data run is cleared before re-processing
      datagrid.originalState.data = json.data;
      datagrid.cacheManager.invalidate('everything');
      datagrid.processors.data.executeFullDataTransformation();

      data = json.data;
      totalRows = json.total;

      // Sync pagination metadata into the datagrid feature
      datagrid.features.pagination.totalCount = json.total;
      datagrid.features.pagination.pageCount = Math.ceil(json.total / pageSize);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      loading = false;
    }
  }

  // Re-fetch on any query param change
  $effect(() => {
    // Touch reactive deps
    sortColumn; sortDir; page; pageSize; search; filters; filterLogic; hireDateFrom; hireDateTo; refreshKey;
    fetchData();
  });

  // ── Page navigation helpers passed down to pagination component ────
  function goToPage(newPage: number) {
    page = newPage;
  }

  function setPageSize(newSize: number) {
    pageSize = newSize;
    page = 1; // reset to first page on page size change
  }
</script>

<div class="mx-auto max-w-[1400px] p-4">
  <h1 class="mb-4 text-2xl font-bold">Tzezar Datagrid</h1>

  <TzezarFilterToolbar
    {datagrid}
    bind:search
    bind:filters
    bind:filterLogic
    bind:hireDateFrom
    bind:hireDateTo
    onRefresh={() => refreshKey++}
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
