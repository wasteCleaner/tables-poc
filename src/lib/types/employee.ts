/** Employee domain types, enums, and API contracts */

export const DEPARTMENTS = [
	'Engineering',
	'Marketing',
	'Sales',
	'HR',
	'Finance',
	'Operations'
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const ROLES = ['Admin', 'Manager', 'Developer', 'Designer', 'Analyst', 'Support'] as const;
export type Role = (typeof ROLES)[number];

export const EMPLOYEE_STATUSES = ['Active', 'Inactive', 'OnLeave'] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export interface Employee {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	department: Department;
	role: Role;
	status: EmployeeStatus;
	hireDate: string; // ISO 8601
	salary: number;
	lastLogin: string; // ISO 8601
}

/** Filter operators matching original requirements */
export const FILTER_OPERATORS = [
	'INCLUDES',
	'DOES_NOT_INCLUDE',
	'IS',
	'IS_NOT',
	'IS_EMPTY',
	'IS_NOT_EMPTY'
] as const;
export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export interface FilterState {
	column: string;
	operator: FilterOperator;
	value: string;
	valueTo?: string;
}

export interface SortState {
	column: string;
	direction: 'asc' | 'desc';
}

export interface PaginationState {
	page: number;
	pageSize: number;
}

export interface ApiResponse<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
}
