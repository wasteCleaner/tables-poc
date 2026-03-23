/**
 * URL state sync utility — read/write table state to browser URL search params.
 * Uses history.replaceState to avoid polluting browser history on every change.
 * Handles popstate for back/forward navigation.
 */

import { SvelteURLSearchParams } from 'svelte/reactivity';
import { tableUrlStateSchema, type TableUrlState } from './schemas/table-url-state';

/** Default values — omit from URL when value matches these */
const DEFAULTS: Partial<TableUrlState> = {
	page: 1,
	pageSize: 20
};

/** Parse current URL search params and return typed state with defaults applied */
export function readUrlState(): TableUrlState {
	if (typeof window === 'undefined') {
		// SSR fallback — return schema defaults
		return tableUrlStateSchema.parse({});
	}
	const params = Object.fromEntries(new SvelteURLSearchParams(window.location.search).entries());
	const result = tableUrlStateSchema.safeParse(params);
	if (result.success) return result.data;
	// On parse error, fall back to defaults
	return tableUrlStateSchema.parse({});
}

/** Write state to URL via replaceState — omits default/empty values for clean URLs */
export function writeUrlState(state: Partial<TableUrlState>): void {
	if (typeof window === 'undefined') return;

	const params = new SvelteURLSearchParams();

	if (state.sort) params.set('sort', state.sort);
	if (state.sortDir) params.set('sortDir', state.sortDir);

	if (state.page != null && state.page !== DEFAULTS.page) {
		params.set('page', String(state.page));
	}
	if (state.pageSize != null && state.pageSize !== DEFAULTS.pageSize) {
		params.set('pageSize', String(state.pageSize));
	}

	if (state.search) params.set('search', state.search);
	if (state.filters) params.set('filters', state.filters);


	if (state.hireDateFrom) params.set('hireDateFrom', state.hireDateFrom);
	if (state.hireDateTo) params.set('hireDateTo', state.hireDateTo);
	if (state.hiddenColumns) params.set('hiddenColumns', state.hiddenColumns);
	if (state.pinnedLeft) params.set('pinnedLeft', state.pinnedLeft);
	if (state.pinnedRight) params.set('pinnedRight', state.pinnedRight);

	const search = params.toString();
	const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
	history.replaceState(null, '', newUrl);
}

/**
 * Register a popstate listener so back/forward navigation triggers a callback.
 * Returns an unsubscribe function — call it on component destroy.
 */
export function onPopState(callback: () => void): () => void {
	window.addEventListener('popstate', callback);
	return () => window.removeEventListener('popstate', callback);
}
