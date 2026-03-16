/** Tzezar Datagrid column definitions for Employee data */

import { accessorColumn, displayColumn } from '$lib/datagrid';
import type { Employee } from '$lib/types/employee';

// Formatters shared with TanStack column defs
const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

function relativeDays(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const days = Math.floor(diff / 86_400_000);
	if (days === 0) return 'Today';
	if (days === 1) return 'Yesterday';
	return `${days}d ago`;
}

/** Default options applied to all data columns */
const dataColumnOptions = {
	sortable: true,
	filterable: true,
	pinnable: true,
	hideable: true,
	resizable: true,
	searchable: true,
	groupable: false,
	calculateFacets: false,
	moveable: false
} as const;

export const tzezarColumns = [
	// ── Select checkbox (display column — no sort/filter) ────────────
	displayColumn<Employee, unknown>({
		columnId: 'select',
		header: '',
		cell: () => '', // Rendered in the table component via slot logic
		options: {
			sortable: false,
			filterable: false,
			pinnable: false,
			hideable: false,
			resizable: false,
			moveable: false
		},
		state: {
			size: { width: 40, minWidth: 40, maxWidth: 40 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	}),

	// ── ID ───────────────────────────────────────────────────────────
	accessorColumn<Employee, 'id', unknown>({
		columnId: 'id',
		header: 'ID',
		accessorKey: 'id',
		options: dataColumnOptions,
		state: {
			size: { width: 80, minWidth: 60, maxWidth: 200 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	}),

	// ── First Name ───────────────────────────────────────────────────
	accessorColumn<Employee, 'firstName', unknown>({
		columnId: 'firstName',
		header: 'First Name',
		accessorKey: 'firstName',
		options: dataColumnOptions,
		state: {
			size: { width: 120, minWidth: 80, maxWidth: 300 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	}),

	// ── Last Name ────────────────────────────────────────────────────
	accessorColumn<Employee, 'lastName', unknown>({
		columnId: 'lastName',
		header: 'Last Name',
		accessorKey: 'lastName',
		options: dataColumnOptions,
		state: {
			size: { width: 120, minWidth: 80, maxWidth: 300 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	}),

	// ── Email ────────────────────────────────────────────────────────
	accessorColumn<Employee, 'email', unknown>({
		columnId: 'email',
		header: 'Email',
		accessorKey: 'email',
		options: dataColumnOptions,
		state: {
			size: { width: 220, minWidth: 120, maxWidth: 400 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	}),

	// ── Department ───────────────────────────────────────────────────
	accessorColumn<Employee, 'department', unknown>({
		columnId: 'department',
		header: 'Department',
		accessorKey: 'department',
		options: dataColumnOptions,
		state: {
			size: { width: 130, minWidth: 80, maxWidth: 300 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	}),

	// ── Role ─────────────────────────────────────────────────────────
	accessorColumn<Employee, 'role', unknown>({
		columnId: 'role',
		header: 'Role',
		accessorKey: 'role',
		options: dataColumnOptions,
		state: {
			size: { width: 110, minWidth: 80, maxWidth: 250 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	}),

	// ── Status ───────────────────────────────────────────────────────
	accessorColumn<Employee, 'status', unknown>({
		columnId: 'status',
		header: 'Status',
		accessorKey: 'status',
		options: dataColumnOptions,
		state: {
			size: { width: 100, minWidth: 80, maxWidth: 200 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	}),

	// ── Hire Date ────────────────────────────────────────────────────
	accessorColumn<Employee, 'hireDate', unknown>({
		columnId: 'hireDate',
		header: 'Hire Date',
		accessorKey: 'hireDate',
		formatterFn: (row) => dateFmt.format(new Date((row as Employee).hireDate)),
		options: dataColumnOptions,
		state: {
			size: { width: 120, minWidth: 80, maxWidth: 250 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	}),

	// ── Salary ───────────────────────────────────────────────────────
	accessorColumn<Employee, 'salary', unknown>({
		columnId: 'salary',
		header: 'Salary',
		accessorKey: 'salary',
		formatterFn: (row) => currencyFmt.format((row as Employee).salary),
		options: dataColumnOptions,
		state: {
			size: { width: 110, minWidth: 80, maxWidth: 200 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	}),

	// ── Last Login ───────────────────────────────────────────────────
	accessorColumn<Employee, 'lastLogin', unknown>({
		columnId: 'lastLogin',
		header: 'Last Login',
		accessorKey: 'lastLogin',
		formatterFn: (row) => relativeDays((row as Employee).lastLogin),
		options: dataColumnOptions,
		state: {
			size: { width: 110, minWidth: 80, maxWidth: 200 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	}),

	// ── Actions (display column — no sort/filter) ────────────────────
	displayColumn<Employee, unknown>({
		columnId: 'actions',
		header: 'Actions',
		cell: () => '', // Rendered in the table component via slot logic
		options: {
			sortable: false,
			filterable: false,
			pinnable: false,
			hideable: false,
			resizable: false,
			moveable: false
		},
		state: {
			size: { width: 120, minWidth: 100, maxWidth: 200 },
			visible: true,
			pinning: { position: 'none', offset: 0 }
		}
	})
];
