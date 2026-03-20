/**
 * Svelte 5 adapter for @tanstack/table-core
 *
 * Uses a deep reactive Proxy so that every property access on the table
 * instance — and on any object returned by its methods (rows, cells,
 * columns, headers) — reads a shared `_invalidate` signal.  This ensures
 * that ALL template expressions re-evaluate on any table state change,
 * including nested calls like `cell.column.getIsPinned()`.
 */

import {
	createTable,
	type RowData,
	type TableOptions,
	type Table,
	type Updater,
	type TableState
} from '@tanstack/table-core';

export function createSvelteTable<TData extends RowData>(
	options: () => TableOptions<TData>
): Table<TData> {
	const table = createTable({
		state: {},
		onStateChange() {},
		renderFallbackValue: null,
		...options()
	});

	// Uncontrolled internal state (e.g. column sizing internals).
	let internalState = $state(table.initialState);

	// Bumped on every state update — the deep Proxy reads it on every
	// property access, so Svelte subscribes the calling template expression
	// to re-render.
	let _invalidate = $state({});

	// Proxy cache — cleared on every state update so that {#each} keyed
	// blocks see new item references and re-evaluate inner expressions.
	let proxyCache = new WeakMap<object, object>();

	function updateOptions() {
		const opts = options();
		table.setOptions((prev) => ({
			...prev,
			...opts,
			state: { ...internalState, ...opts.state },
			onStateChange: (updater: Updater<TableState>) => {
				internalState = typeof updater === 'function' ? updater(internalState) : updater;
				opts.onStateChange?.(updater);
			}
		}));
		_invalidate = {};
		proxyCache = new WeakMap();
	}

	// Run once synchronously for SSR (where $effect.pre does not execute).
	updateOptions();

	// Re-run before every render whenever any reactive value read inside
	// options() changes (data, sorting, columnVisibility, rowCount, etc.).
	$effect.pre(() => {
		updateOptions();
	});

	/**
	 * Recursively wraps objects in Proxy so that every property access
	 * reads `_invalidate`, subscribing the calling Svelte template
	 * expression to re-render on any table state change.
	 *
	 * Methods are wrapped so that (a) `this` stays bound to the real
	 * target (TanStack's internal code works normally) and (b) return
	 * values are also proxied for the same deep-reactivity guarantee.
	 */
	function toReactive<T>(value: T): T {
		if (value == null || typeof value !== 'object') return value;

		const obj = value as object;
		const cached = proxyCache.get(obj);
		if (cached) return cached as T;

		const proxy = new Proxy(obj, {
			get(target, prop, receiver) {
				// eslint-disable-next-line @typescript-eslint/no-unused-expressions
				_invalidate;
				const result = Reflect.get(target, prop, receiver);
				if (typeof result === 'function') {
					return (...args: unknown[]) =>
						toReactive(result.apply(target, args));
				}
				return toReactive(result);
			}
		});

		proxyCache.set(obj, proxy);
		return proxy as T;
	}

	return toReactive(table);
}
