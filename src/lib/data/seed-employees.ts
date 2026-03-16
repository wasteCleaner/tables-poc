import { faker } from '@faker-js/faker';
import {
	DEPARTMENTS,
	ROLES,
	EMPLOYEE_STATUSES,
	type Employee
} from '$lib/types/employee';

faker.seed(42);

function generateEmployees(count = 500): Employee[] {
	return Array.from({ length: count }, () => ({
		id: faker.string.uuid(),
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		email: faker.internet.email().toLowerCase(),
		department: faker.helpers.arrayElement([...DEPARTMENTS]),
		role: faker.helpers.arrayElement([...ROLES]),
		status: faker.helpers.arrayElement([...EMPLOYEE_STATUSES]),
		hireDate: faker.date.past({ years: 10 }).toISOString(),
		salary: faker.number.int({ min: 40000, max: 200000 }),
		lastLogin: faker.date.recent({ days: 30 }).toISOString()
	}));
}

let _cache: Employee[] | null = null;
export function getEmployees(): Employee[] {
	return (_cache ??= generateEmployees());
}
