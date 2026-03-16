import type { Employee, FilterState, SortState } from '$lib/types/employee';

export function parseFilters(filtersParam: string | null): FilterState[] {
	if (!filtersParam) return [];
	try {
		const parsed = JSON.parse(filtersParam);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function parseSorts(sort: string | null, sortDir: string | null): SortState[] {
	if (!sort) return [];
	const columns = sort.split(',');
	const directions = (sortDir ?? '').split(',');
	return columns.map((col, i) => ({
		column: col.trim(),
		direction: directions[i]?.trim() === 'desc' ? 'desc' : 'asc'
	}));
}

export function applySearch(data: Employee[], search: string): Employee[] {
	if (!search) return data;
	const term = search.toLowerCase();
	return data.filter(
		(e) =>
			e.firstName.toLowerCase().includes(term) ||
			e.lastName.toLowerCase().includes(term) ||
			e.email.toLowerCase().includes(term)
	);
}

function getFieldValue(employee: Employee, column: string): string | number {
	return employee[column as keyof Employee] as string | number;
}

function evaluateFilter(employee: Employee, filter: FilterState): boolean {
	const raw = getFieldValue(employee, filter.column);
	const val = String(raw).toLowerCase();
	const filterVal = filter.value?.toLowerCase() ?? '';

	switch (filter.operator) {
		case 'IS':
			return val === filterVal;
		case 'IS_NOT':
			return val !== filterVal;
		case 'INCLUDES':
			return val.includes(filterVal);
		case 'DOES_NOT_INCLUDE':
			return !val.includes(filterVal);
		case 'IS_EMPTY':
			return val === '' || raw === null || raw === undefined;
		case 'IS_NOT_EMPTY':
			return val !== '' && raw !== null && raw !== undefined;
		default:
			return true;
	}
}

export function applyFilters(
	data: Employee[],
	filters: FilterState[],
	logic: 'and' | 'or'
): Employee[] {
	if (filters.length === 0) return data;

	// Group filters by column so same-column filters use OR (union)
	const groups = new Map<string, FilterState[]>();
	for (const f of filters) {
		const group = groups.get(f.column) ?? [];
		group.push(f);
		groups.set(f.column, group);
	}

	const columnGroups = Array.from(groups.values());

	return data.filter((employee) => {
		// Each column group: employee must match ANY filter in that group (OR within column)
		const groupResults = columnGroups.map((group) =>
			group.some((f) => evaluateFilter(employee, f))
		);
		// Between groups: apply the logic parameter (AND or OR)
		return logic === 'and'
			? groupResults.every(Boolean)
			: groupResults.some(Boolean);
	});
}

export function applySort(data: Employee[], sorts: SortState[]): Employee[] {
	if (sorts.length === 0) return data;
	return [...data].sort((a, b) => {
		for (const { column, direction } of sorts) {
			const aVal = getFieldValue(a, column);
			const bVal = getFieldValue(b, column);
			let cmp = 0;
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				cmp = aVal - bVal;
			} else {
				cmp = String(aVal).localeCompare(String(bVal));
			}
			if (cmp !== 0) return direction === 'desc' ? -cmp : cmp;
		}
		return 0;
	});
}

export function applyPagination(
	data: Employee[],
	page: number,
	pageSize: number
): { data: Employee[]; total: number } {
	const total = data.length;
	const start = (page - 1) * pageSize;
	return { data: data.slice(start, start + pageSize), total };
}

/** Filter employees by hireDate range (ISO date strings, inclusive). Either bound is optional. */
export function applyDateRange(
	data: Employee[],
	from: string | null,
	to: string | null
): Employee[] {
	if (!from && !to) return data;
	const fromMs = from ? new Date(from).getTime() : -Infinity;
	const toMs = to ? new Date(to).getTime() : Infinity;
	return data.filter((e) => {
		const hireMs = new Date(e.hireDate).getTime();
		return hireMs >= fromMs && hireMs <= toMs;
	});
}
