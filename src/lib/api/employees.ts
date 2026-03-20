/**
 * Employee API client — shared fetch logic for both TanStack and Tzezar pages.
 * Used as the queryFn for @tanstack/svelte-query.
 */

import type { ApiResponse, Employee, FilterState } from '$lib/types/employee';

/** All filter/sort/pagination params needed for the employees endpoint */
export interface EmployeeQueryParams {
	sort?: string;
	sortDir?: string;
	page: number;
	pageSize: number;
	search?: string;
	filters?: FilterState[];
	filterLogic: 'and' | 'or';
	hireDateFrom?: string;
	hireDateTo?: string;
}

/** Build a stable, serializable query key from params */
export function employeesQueryKey(params: EmployeeQueryParams): readonly unknown[] {
	return [
		'employees',
		{
			sort: params.sort,
			sortDir: params.sortDir,
			page: params.page,
			pageSize: params.pageSize,
			search: params.search,
			filters: params.filters,
			filterLogic: params.filterLogic,
			hireDateFrom: params.hireDateFrom,
			hireDateTo: params.hireDateTo
		}
	] as const;
}

/** Fetch employees from the API endpoint */
export async function fetchEmployees(params: EmployeeQueryParams): Promise<ApiResponse<Employee>> {
	const searchParams = new URLSearchParams();

	if (params.sort) {
		searchParams.set('sort', params.sort);
		searchParams.set('sortDir', params.sortDir ?? 'asc');
	}
	searchParams.set('page', String(params.page));
	searchParams.set('pageSize', String(params.pageSize));
	if (params.search) searchParams.set('search', params.search);
	if (params.filters && params.filters.length > 0) {
		searchParams.set('filters', JSON.stringify(params.filters));
	}
	searchParams.set('filterLogic', params.filterLogic);
	if (params.hireDateFrom) searchParams.set('hireDateFrom', params.hireDateFrom);
	if (params.hireDateTo) searchParams.set('hireDateTo', params.hireDateTo);

	const res = await fetch(`/api/employees?${searchParams}`);
	if (!res.ok) throw new Error(`Failed to fetch employees: ${res.status}`);
	return res.json();
}

