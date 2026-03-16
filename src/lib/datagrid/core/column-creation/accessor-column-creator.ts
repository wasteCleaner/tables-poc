import { DEFAULT_COLUMN_SIZE, DEFAULT_NOT_DEFINED_COLUMN_SIZE } from "../defaults";
import type { AccessorColumn } from "../types";
import { isColumnFilterable, isColumnSortable, isColumnVisible } from "./column-methods";
import type { DotNestedKeys, CreateAccessorColumnProps } from "./types";
import { getNestedValue } from "./utils";

/**
 * Formats an accessor key into a more human-readable string by splitting it into words
 * and capitalizing the first letter of each word.
 *
 * @param {string} accessorKey The accessor key to format.
 * @returns {string} The formatted accessor key.
 *
 * @example
 * formatAccessorKey("profile.email"); // "Profile Email"
 */
function formatAccessorKey(accessorKey: string): string {
  return accessorKey
    .split('.')
    .map(key => key.charAt(0).toUpperCase() + key.slice(1))
    .join(' ');
}

function createColumnHeader({
  header,
  accessorKey,
  columnId
}: {
  header?: string;
  accessorKey?: string;
  columnId?: string;
}): string {
  if (header) {
    return header;
  } else if (columnId) {
    return columnId;
  } else if (accessorKey) {
    return formatAccessorKey(accessorKey);
  }
  throw new Error("Either header, accessorKey, or columnId must be defined");
}

function createColumnId({
  columnId,
  accessorKey,
  header,
}: {
  columnId?: string;
  accessorKey?: string;
  header?: string;
}): string {
  if (columnId) return columnId;
  if (accessorKey) return accessorKey;
  if (header) return header.toLowerCase().replace(/\s+/g, "_");
  throw new Error("A valid columnId, accessorKey, or header must be provided");
}

export function createAccessorColumn<
  TOriginalRow extends Record<string, any>,
  TKey extends DotNestedKeys<TOriginalRow>,
  TMeta,
>(props: CreateAccessorColumnProps<TOriginalRow, TKey, TMeta>): AccessorColumn<TOriginalRow, TMeta> {
  const {
    header,
    accessorKey,
    columnId,
    getValueFn: customGetValue,
    align,
    options,
    _meta,
    state,
    ...rest
  } = props;

  if (!accessorKey) {
    throw new Error("accessorKey must be defined");
  }

  const getValueFn = customGetValue || ((row: TOriginalRow) => getNestedValue(row, accessorKey));

  const computedHeader = createColumnHeader({ header, accessorKey, columnId });
  const computedColumnId = createColumnId({ columnId, accessorKey, header });

  return {
    type: 'accessor',
    columnId: computedColumnId,
    parentColumnId: rest.parentColumnId || null,
    header: computedHeader,
    accessorKey,
    getValueFn,
    options: {
      calculateFacets: options?.calculateFacets ?? false,
      searchable: options?.searchable ?? true,
      groupable: options?.groupable ?? true,
      sortable: options?.sortable ?? true,
      filterable: options?.filterable ?? true,
      pinnable: options?.pinnable ?? true,
      moveable: options?.moveable ?? true,
      hideable: options?.hideable ?? true,
      resizable: options?.resizable ?? true
    },
    state: {
      size: state?.size ?? DEFAULT_NOT_DEFINED_COLUMN_SIZE,
      visible: state?.visible ?? true,
      pinning: {
        position: state?.pinning?.position ?? 'none',
        offset: 0
      },
    },
    align: align ?? 'left',
    _meta: _meta as TMeta ?? {} as TMeta,
    ...rest,

    isVisible: function() { return isColumnVisible(this); },
    isSortable: function() { return isColumnSortable(this); },
    isFilterable: function() { return isColumnFilterable(this); }
  };
}
