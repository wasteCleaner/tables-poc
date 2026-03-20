import type { CellValue, FilterableColumn, FilterOperator, LeafColumn } from "../types";
import { BaseService } from "./base-service";

/**
 * Service for handling filtering functionality in the data grid.
 * This service allows changing filter operators and updating filter conditions for columns.
 * 
 * @extends BaseService
 */
export class FilteringService extends BaseService {

    /**
     * Changes the filter operator for a given column and triggers a full data transformation.
     * This will invalidate the cached filtered data and recalculate the filtered view.
     * 
     * @param {string} columnId The ID of the column whose filter operator is being changed.
     * @param {FilterOperator} operator The new operator to be applied to the filter condition.
     */
    changeFilterOperator(columnId: string, operator: FilterOperator) {
        this.datagrid.features.filtering.changeConditionOperator(columnId, operator);
        this.datagrid.cacheManager.invalidate('filteredData');
        this.datagrid.processors.data.executeFullDataTransformation();
    }

    /**
     * Updates the filter condition for a given column. If the column already has a filter condition,
     * it updates the existing condition; otherwise, it adds a new filter condition.
     * This will trigger the filter change event, invalidate cached filtered data, and refresh pagination.
     * 
     * @param {Object} props The filter condition properties.
     * @param {LeafColumn<any>} props.column The column to which the filter condition applies.
     * @param {CellValue} props.value The value for the filter condition.
     * @param {number} [props.valueTo] The second value for range-based filters (e.g., 'between' filters).
     * @param {FilterOperator} props.operator The operator to use in the filter condition (e.g., 'equals', 'between').
     * 
     * @emits onFilterChange The event emitted when the filter condition changes.
     */
    updateFilterCondition(props: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- accepts any row type column
        column: LeafColumn<any>,
        value: CellValue,
        valueTo?: number,
        operator: FilterOperator,
    }) {
        this.datagrid.events.emit('onFilterChange', { column: props.column });
    
        const { value, operator, valueTo } = props;
        let column = props.column;
    
        if (column === null || !column.isFilterable()) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- narrowing from LeafColumn to FilterableColumn
        column = column as FilterableColumn<any>;
    
        if (!column) return;
    
        // Find existing condition
        const conditionIndex = this.datagrid.features.filtering.filterConditions.findIndex(c => c.columnId === column.columnId);
    
        if (conditionIndex === -1) {
            // If condition doesn't exist, add a new one
            this.datagrid.features.filtering.filterConditions.push({
                columnId: String(column.columnId),
                operator, // Set the operator here
                getValueFn: column.getValueFn,
                value,
                valueTo // Add the second value for 'between' filter
            });
        } else {
            // Update existing condition with the new value and operator
            const condition = this.datagrid.features.filtering.filterConditions[conditionIndex];
            if (condition) {
                condition.value = value;
                condition.operator = operator;
                if (valueTo !== undefined) {
                    condition.valueTo = valueTo;
                }
            }
        }
    
        this.datagrid.cacheManager.invalidate('filteredData');
        this.datagrid.features.pagination.goToFirstPage();
        this.datagrid.processors.data.executeFullDataTransformation();
    }
}
