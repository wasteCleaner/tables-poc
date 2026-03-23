/** GET /api/employees — server-side query endpoint with artificial latency */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEmployees } from '$lib/data/seed-employees';
import {
	parseFilters,
	parseSorts,
	applySearch,
	applyFilters,
	applySort,
	applyPagination,
	applyDateRange
} from '$lib/api/employee-query-parser';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const params = url.searchParams;
		let data = getEmployees();

		// Search
		const search = params.get('search') ?? '';
		data = applySearch(data, search);

		// Filters
		const filters = parseFilters(params.get('filters'));
		data = applyFilters(data, filters, 'and');

		// Date range filter for hireDate
		data = applyDateRange(data, params.get('hireDateFrom'), params.get('hireDateTo'));

		// Sort
		const sorts = parseSorts(params.get('sort'), params.get('sortDir'));
		data = applySort(data, sorts);

		// Pagination
		const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
		const pageSize = Math.min(100, Math.max(5, parseInt(params.get('pageSize') ?? '20', 10) || 20));
		const result = applyPagination(data, page, pageSize);

		// Simulate backend latency (200-500ms)
		await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

		return json({
			data: result.data,
			total: result.total,
			page,
			pageSize
		});
	} catch (err) {
		return json({ error: 'Invalid query parameters' }, { status: 400 });
	}
};
