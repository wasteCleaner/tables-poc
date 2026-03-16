/** TanStack Table column definitions for Employee data */

import type { ColumnDef } from '@tanstack/table-core';
import { createRawSnippet } from 'svelte';
import type { Employee } from '$lib/types/employee';
import { DEPARTMENTS, ROLES, EMPLOYEE_STATUSES } from '$lib/types/employee';
import { renderSnippet } from './render-snippet';

const currencyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

function relativeDays(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const days = Math.floor(diff / 86_400_000);
	if (days === 0) return 'Today';
	if (days === 1) return 'Yesterday';
	return `${days}d ago`;
}

/** Status badge color mapping */
function statusColor(s: string): string {
	switch (s) {
		case 'Active': return 'bg-green-100 text-green-800';
		case 'Inactive': return 'bg-gray-100 text-gray-800';
		case 'OnLeave': return 'bg-yellow-100 text-yellow-800';
		default: return 'bg-gray-100 text-gray-800';
	}
}

export const columns: ColumnDef<Employee, unknown>[] = [
	// Selection checkbox
	{
		id: 'select',
		enableSorting: false,
		enableResizing: false,
		size: 40,
		meta: { type: 'select' }
	},
	{
		accessorKey: 'id',
		header: 'ID',
		size: 80,
		enablePinning: true,
		cell: ({ row }) => {
			const s = createRawSnippet<[string]>((getId) => ({
				render: () => `<span class="font-mono text-xs text-gray-500">${getId().slice(0, 8)}</span>`
			}));
			return renderSnippet(s, row.original.id);
		}
	},
	{
		accessorKey: 'firstName',
		header: 'First Name',
		size: 120
	},
	{
		accessorKey: 'lastName',
		header: 'Last Name',
		size: 120
	},
	{
		accessorKey: 'email',
		header: 'Email',
		size: 220,
		cell: ({ row }) => {
			const s = createRawSnippet<[string]>((getEmail) => ({
				render: () => `<span class="text-blue-600">${getEmail()}</span>`
			}));
			return renderSnippet(s, row.original.email);
		}
	},
	{
		accessorKey: 'department',
		header: 'Department',
		size: 130,
		meta: { filterType: 'enum', options: DEPARTMENTS }
	},
	{
		accessorKey: 'role',
		header: 'Role',
		size: 110,
		meta: { filterType: 'enum', options: ROLES }
	},
	{
		accessorKey: 'status',
		header: 'Status',
		size: 100,
		meta: { filterType: 'enum', options: EMPLOYEE_STATUSES },
		cell: ({ row }) => {
			const s = createRawSnippet<[{ status: string; color: string }]>((getProps) => {
				const { status, color } = getProps();
				return {
					render: () =>
						`<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${color}">${status}</span>`
				};
			});
			return renderSnippet(s, {
				status: row.original.status,
				color: statusColor(row.original.status)
			});
		}
	},
	{
		accessorKey: 'hireDate',
		header: 'Hire Date',
		size: 120,
		cell: ({ row }) => {
			const s = createRawSnippet<[string]>((getDate) => ({
				render: () => `<span>${dateFmt.format(new Date(getDate()))}</span>`
			}));
			return renderSnippet(s, row.original.hireDate);
		}
	},
	{
		accessorKey: 'salary',
		header: 'Salary',
		size: 110,
		cell: ({ row }) => {
			const s = createRawSnippet<[number]>((getSalary) => ({
				render: () => `<span class="font-medium">${currencyFmt.format(getSalary())}</span>`
			}));
			return renderSnippet(s, row.original.salary);
		}
	},
	{
		accessorKey: 'lastLogin',
		header: 'Last Login',
		size: 110,
		cell: ({ row }) => {
			const s = createRawSnippet<[string]>((getDate) => ({
				render: () => `<span class="text-gray-500">${relativeDays(getDate())}</span>`
			}));
			return renderSnippet(s, row.original.lastLogin);
		}
	},
	// Actions column
	{
		id: 'actions',
		header: 'Actions',
		enableSorting: false,
		enableResizing: false,
		size: 120,
		meta: { type: 'actions' }
	}
];
