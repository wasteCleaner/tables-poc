/** Zod schema for table URL state — shared between TanStack and Tzezar pages */

import { z } from 'zod/v4';

export const tableUrlStateSchema = z.object({
	sort: z.string().optional(),
	sortDir: z.enum(['asc', 'desc']).optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(5).max(100).default(20),
	filters: z.string().optional(), // JSON-encoded FilterState[]
	search: z.string().optional(),
	filterLogic: z.enum(['and', 'or']).default('and'),
	hiddenColumns: z.string().optional(), // comma-separated column names
	pinnedLeft: z.string().optional(), // comma-separated column names
	pinnedRight: z.string().optional(), // comma-separated column names
	hireDateFrom: z.string().optional(), // ISO date string
	hireDateTo: z.string().optional() // ISO date string
});

export type TableUrlState = z.infer<typeof tableUrlStateSchema>;
