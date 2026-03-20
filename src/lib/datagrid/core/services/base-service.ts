import type { DatagridCore } from "../index.svelte";
import type { EventService } from "./event-service";

type CacheKey = "everything" | "sortedData" | "filteredData" | "hierarchicalRows" | "rows" | "paginatedRows";

/**
 * Base class for service operations related to the datagrid, providing shared functionality such as refreshing the grid.
 */
export class BaseService {
    /**
     * Creates an instance of the BaseService class.
     * 
     * @param {DatagridCore<any>} datagrid The core datagrid instance.
     * @param {EventService} events The event service used for emitting events.
     */
    constructor(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- base service must accept any row type
        protected datagrid: DatagridCore<any>,
        protected events: EventService
    ) {}

    /**
     * Refreshes the datagrid, optionally invalidating cache and triggering a full data transformation.
     * 
     * @param {Object} options The options for refreshing the grid.
     * @param {CacheKey[]} [options.cache] List of cache keys to invalidate.
     * @param {boolean} [options.fullRefresh=false] Whether to perform a full data transformation.
     */
    protected refreshGrid(options: { 
        cache?: CacheKey[], 
        fullRefresh?: boolean 
    } = {}) {
        const { cache = [], fullRefresh = false } = options;
        
        // Invalidate the specified cache keys
        cache.forEach(key => this.datagrid.cacheManager.invalidate(key));

        // Optionally perform a full data transformation
        if (fullRefresh) {
            this.datagrid.processors.data.executeFullDataTransformation();
        }
    }
}
