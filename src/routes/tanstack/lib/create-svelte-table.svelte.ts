/**
 * Svelte 5 adapter for @tanstack/table-core
 *
 * Accepts a getter function `() => TableOptions` so that every time the
 * `$effect.pre` runs it re-reads all reactive $state values (data, state,
 * rowCount, etc.) from the parent component.  This is the key to correct
 * reactivity: Svelte 5 tracks signal reads that happen *during* an effect,
 * so passing a getter ensures the effect subscribes to every reactive value
 * used by the options object.
 */

import {
	createTable,
	type RowData,
	type TableOptions,
	type Table
} from '@tanstack/table-core';

/**
 * Creates a reactive TanStack table instance for Svelte 5.
 *
 * @param options - A getter function returning the full TableOptions object.
 *   Called inside `$effect.pre` so Svelte tracks every reactive value it reads.
 *
 * Reactivity design:
 * - `internalState` holds uncontrolled state (resizing, etc.) managed by TanStack.
 * - Each `$effect.pre` run calls `options()`, reads all current reactive values,
 *   and passes a merged state `{ ...internalState, ...opts.state }` to `setOptions`.
 *   Controlled state (sorting, pagination, columnVisibility, …) comes from
 *   `opts.state` and takes priority.
 * - `_invalidate` is reassigned on every `updateOptions` call.  The Proxy reads
 *   it on every property access, so Svelte re-renders any template expression
 *   that touches `table.*` whenever options or state changes.
 */
export function createSvelteTable<TData extends RowData>(
	options: () => TableOptions<TData>
): Table<TData> {
	// Bootstrap the table with initial options so we can read initialState.
	const table = createTable({
		state: {},
		onStateChange() {},
		renderFallbackValue: null,
		...options()
	});

	// Uncontrolled internal state (e.g. column sizing internals).
	let internalState = $state(table.initialState);

	// Reassigned on every updateOptions call — the Proxy reads it to create
	// a Svelte reactive dependency that triggers re-renders.
	let _invalidate = $state({});

	function updateOptions() {
		const opts = options();
		table.setOptions((prev) => ({
			...prev,
			...opts,
			// Controlled state (opts.state) overrides uncontrolled internal state.
			state: { ...internalState, ...opts.state },
			onStateChange: (updater: any) => {
				internalState = typeof updater === 'function' ? updater(internalState) : updater;
				opts.onStateChange?.(updater);
			}
		}));
		_invalidate = {};
	}

	// Run once synchronously for SSR (where $effect.pre does not execute).
	updateOptions();

	// Re-run before every render whenever any reactive value read inside
	// options() changes (data, sorting, columnVisibility, rowCount, etc.).
	$effect.pre(() => {
		updateOptions();
	});

	// Proxy: every table property access reads `_invalidate`, subscribing the
	// calling template to re-render when _invalidate is reassigned.
	return new Proxy(table, {
		get(target, prop, receiver) {
			_invalidate; // reactive dependency
			return Reflect.get(target, prop, receiver);
		}
	});
}
