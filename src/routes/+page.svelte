<!-- Home page — project overview, navigation cards, feature comparison matrix -->

<script lang="ts">
	const features = [
		'Server-side sorting (multi-column)',
		'Server-side filtering (6 operators)',
		'Server-side pagination',
		'Enum filters (Department, Role, Status)',
		'Filter chips (removable)',
		'Logical operators (AND/OR toggle)',
		'Text search (debounced)',
		'Date range picker',
		'Column resize (drag handles)',
		'Action buttons (view/edit/delete)',
		'Data refresh button',
		'Hide/unhide columns toggle',
		'Bulk row selection (checkbox)',
		'Shift+click range selection',
		'Column pinning (left/right)',
		'Row pinning (top/bottom)',
		'Full pagination controls',
		'URL state persistence'
	];
</script>

<div class="mx-auto max-w-[1000px] p-6">
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-3xl font-bold text-gray-900">Svelte 5 Tables POC</h1>
		<p class="text-gray-600">
			Comparing <strong>TanStack Table v8</strong> and <strong>Tzezar Datagrid</strong> for server-side backoffice tables
		</p>
		<p class="mt-1 text-sm text-gray-400">
			SvelteKit 2 &middot; Svelte 5.51 &middot; Tailwind CSS 4 &middot; TypeScript strict
		</p>
	</div>

	<!-- Navigation cards -->
	<div class="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2">
		<a href="/tanstack" class="group rounded-lg border border-gray-200 p-5 transition-all hover:border-blue-400 hover:shadow-md">
			<h2 class="mb-1 text-xl font-semibold text-gray-900 group-hover:text-blue-600">TanStack Table v8</h2>
			<p class="text-sm text-gray-500">Headless table-core with custom Svelte 5 adapter. Full control, manual wiring.</p>
		</a>
		<a href="/tzezar" class="group rounded-lg border border-gray-200 p-5 transition-all hover:border-blue-400 hover:shadow-md">
			<h2 class="mb-1 text-xl font-semibold text-gray-900 group-hover:text-blue-600">Tzezar Datagrid</h2>
			<p class="text-sm text-gray-500">Svelte-native DatagridCore with built-in features, events, and handlers.</p>
		</a>
	</div>

	<!-- Feature comparison matrix -->
	<h2 class="mb-3 text-xl font-bold text-gray-900">Feature Comparison</h2>
	<div class="overflow-auto rounded-lg border border-gray-200">
		<table class="w-full text-left text-sm">
			<thead class="border-b bg-gray-50 text-xs font-medium uppercase text-gray-600">
				<tr>
					<th class="px-4 py-2.5">Feature</th>
					<th class="px-4 py-2.5 text-center">TanStack</th>
					<th class="px-4 py-2.5 text-center">Tzezar</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each features as feature, i}
					<tr class="{i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}">
						<td class="px-4 py-2">{feature}</td>
						<td class="px-4 py-2 text-center text-green-600">&#10003;</td>
						<td class="px-4 py-2 text-center text-green-600">&#10003;</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Performance notes -->
	<h2 class="mb-3 mt-8 text-xl font-bold text-gray-900">Performance Notes</h2>
	<div class="rounded-lg border border-gray-200 p-5 text-sm text-gray-600">
		<p class="mb-2 italic text-gray-400">Run both implementations and compare in browser DevTools.</p>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<div><span class="block text-xs font-medium text-gray-400">Metric</span></div>
			<div><span class="block text-xs font-medium text-gray-400">TanStack</span></div>
			<div><span class="block text-xs font-medium text-gray-400">Tzezar</span></div>
			<div><span class="block text-xs font-medium text-gray-400">Notes</span></div>
		</div>
		<p class="mt-2 text-xs text-gray-400">Bundle size, LOC, initial render, re-render on sort — to be measured after manual testing.</p>
	</div>
</div>
