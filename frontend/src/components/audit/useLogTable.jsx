import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

export function useLogTable(data) {
  const column = createColumnHelper();

  const columns = [
    column.accessor('operation', {
      header: 'Level',
      cell: info => info.getValue(),
      size: 120,
      pin: 'left',             // we’ll read this later for sticky
    }),
    column.accessor('changed_at', {
      header: 'Timestamp',
      cell: info => new Date(info.getValue()).toLocaleString(),
      size: 220,
      sortingFn: 'datetime',
    }),
    column.accessor(row => row.actor?.username || 'System', {
      id: 'actor',
      header: 'Actor',
    }),
    column.accessor('table_name', { header: 'Table', size: 160 }),
    column.accessor('diff', {
      header: 'Changes',
      enableColumnFilter: false,
      cell: ({ getValue }) => getValue(), // we format later
    }),
  ];

  return useReactTable({
    data,
    columns,
    state: { /* local state via useState in parent */ },
    groupingFns: {},       // custom group fns
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: 'onChange',
    debugTable: false,
  });
}
