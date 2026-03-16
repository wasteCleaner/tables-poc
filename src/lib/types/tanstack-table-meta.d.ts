/** Augment TanStack table-core ColumnMeta to support custom meta fields */

import '@tanstack/table-core';

declare module '@tanstack/table-core' {
	interface ColumnMeta<TData, TValue> {
		type?: 'select' | 'actions';
		filterType?: 'enum';
		options?: readonly string[];
	}
}
