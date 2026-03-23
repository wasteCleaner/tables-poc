<!--
  TanStack toolbar — search, enum filters, filter chips,
  column visibility, refresh button
-->
<script lang="ts">
  import type { Table } from '@tanstack/table-core';
  import type { Employee, FilterState } from '$lib/types/employee';
  import { DEPARTMENTS, ROLES, EMPLOYEE_STATUSES } from '$lib/types/employee';

  type Props = {
    table: Table<Employee>;
    search: string;
    filters: FilterState[];
    hireDateFrom: string;
    hireDateTo: string;
    onRefresh: () => void;
  };

  let {
    table,
    search = $bindable(),
    filters = $bindable(),
    hireDateFrom = $bindable(),
    hireDateTo = $bindable(),
    onRefresh
  }: Props = $props();

  let searchTimeout: ReturnType<typeof setTimeout>;

  function onSearchInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { search = value; }, 300);
  }

  // Enum filter helpers
  const enumColumns = [
    { key: 'department', label: 'Department', options: DEPARTMENTS },
    { key: 'role', label: 'Role', options: ROLES },
    { key: 'status', label: 'Status', options: EMPLOYEE_STATUSES }
  ] as const;

  function getActiveValues(column: string): string[] {
    return filters
      .filter((f) => f.column === column && f.operator === 'IS')
      .map((f) => f.value);
  }

  function toggleEnumValue(column: string, value: string) {
    const active = getActiveValues(column);
    if (active.includes(value)) {
      filters = filters.filter((f) => !(f.column === column && f.operator === 'IS' && f.value === value));
    } else {
      filters = [...filters, { column, operator: 'IS', value }];
    }
  }

  function removeFilter(index: number) {
    filters = filters.filter((_, i) => i !== index);
  }

  function clearAllFilters() {
    filters = [];
    search = '';
    hireDateFrom = '';
    hireDateTo = '';
  }

  // Dropdown toggles
  let openDropdown = $state<string | null>(null);

  function toggleDropdown(key: string) {
    openDropdown = openDropdown === key ? null : key;
  }
</script>

<div class="mb-3 space-y-2">
  <!-- Top row: search + controls -->
  <div class="flex flex-wrap items-center gap-2">
    <!-- Search -->
    <input
      type="text"
      placeholder="Search employees..."
      value={search}
      oninput={onSearchInput}
      class="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
    />

    <!-- Enum filter dropdowns -->
    {#each enumColumns as col}
      {@const active = getActiveValues(col.key)}
      <div class="relative">
        <button
          onclick={(e) => { e.stopPropagation(); toggleDropdown(col.key); }}
          class="rounded-md border px-3 py-1.5 text-sm transition-colors
            {active.length > 0 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
        >
          {col.label}
          {#if active.length > 0}
            <span class="ml-1 rounded-full bg-blue-500 px-1.5 text-xs text-white">{active.length}</span>
          {/if}
        </button>

        {#if openDropdown === col.key}
          <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
          <div
            class="absolute z-50 mt-1 min-w-[160px] rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            onclick={(e) => e.stopPropagation()}
          >
            {#each col.options as option}
              {@const checked = active.includes(option)}
              <label class="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50">
                <input
                  type="checkbox"
                  {checked}
                  onchange={() => toggleEnumValue(col.key, option)}
                  class="rounded border-gray-300"
                />
                {option}
              </label>
            {/each}
          </div>
        {/if}
      </div>
    {/each}

    <!-- Hire Date range inputs -->
    <label class="flex items-center gap-1.5 text-sm text-gray-600">
      From
      <input
        type="date"
        value={hireDateFrom}
        oninput={(e) => { hireDateFrom = (e.target as HTMLInputElement).value; }}
        class="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
    </label>
    <label class="flex items-center gap-1.5 text-sm text-gray-600">
      To
      <input
        type="date"
        value={hireDateTo}
        oninput={(e) => { hireDateTo = (e.target as HTMLInputElement).value; }}
        class="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
      />
    </label>


    <!-- Column visibility -->
    <div class="relative ml-auto">
      <button
        onclick={(e) => { e.stopPropagation(); toggleDropdown('columns'); }}
        class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
      >
        Columns
      </button>
      {#if openDropdown === 'columns'}
        <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
        <div
          class="absolute right-0 z-50 mt-1 min-w-[160px] rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          onclick={(e) => e.stopPropagation()}
        >
          {#each table.getAllLeafColumns().filter((c) => c.getCanHide()) as column}
            <label class="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50">
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onchange={(e) => column.toggleVisibility((e.target as HTMLInputElement).checked)}
                class="rounded border-gray-300"
              />
              {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
            </label>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Refresh -->
    <button
      onclick={onRefresh}
      class="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
    >
      Refresh
    </button>
  </div>

  <!-- Filter chips -->
  {#if filters.length > 0 || hireDateFrom || hireDateTo}
    <div class="flex flex-wrap items-center gap-1.5">
      {#each filters as filter, i}
        <span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          {filter.column}: {filter.value}
          <button onclick={() => removeFilter(i)} class="ml-0.5 hover:text-blue-600">&times;</button>
        </span>
      {/each}
      {#if hireDateFrom || hireDateTo}
        <span class="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          hireDate: {hireDateFrom || '...'} – {hireDateTo || '...'}
          <button onclick={() => { hireDateFrom = ''; hireDateTo = ''; }} class="ml-0.5 hover:text-blue-600">&times;</button>
        </span>
      {/if}
      <button onclick={clearAllFilters} class="text-xs text-gray-500 hover:text-gray-700">Clear all</button>
    </div>
  {/if}
</div>

<!-- Close dropdowns on outside click -->
<svelte:window onclick={() => (openDropdown = null)} />
