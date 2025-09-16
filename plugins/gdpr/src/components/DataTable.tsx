import { useState, useMemo, ReactNode, ChangeEvent } from 'react';
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Chip,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  tableContainer: {
    marginTop: theme.spacing(2),
  },
  searchContainer: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    gap: theme.spacing(2),
    alignItems: 'center',
  },
  emptyState: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  headerCell: {
    fontWeight: 'bold',
    backgroundColor: theme.palette.grey[50],
  },
  selectedRow: {
    backgroundColor: theme.palette.action.selected,
  },
}));

export interface Column<T> {
  id: keyof T | 'actions';
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  selectable?: boolean;
  searchable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  onSelectionChange?: (selectedRows: T[]) => void;
  onRowClick?: (row: T, index: number) => void;
  emptyStateText?: string;
  title?: string;
}

type Order = 'asc' | 'desc';

/**
 * Advanced data table component with sorting, filtering, pagination, and selection
 */
export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  selectable = false,
  searchable = true,
  paginated = true,
  pageSize = 10,
  onSelectionChange,
  onRowClick,
  emptyStateText = 'No data available',
  title,
}: DataTableProps<T>) => {
  const classes = useStyles();
  
  // State management
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof T | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  // Filtering logic
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row =>
      columns.some(column => {
        if (column.id === 'actions' || !column.filterable) return false;
        
        const value = row[column.id];
        if (value === null || value === undefined) return false;
        
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, searchTerm, columns]);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!orderBy) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, order, orderBy]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    
    const startIndex = page * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, page, rowsPerPage, paginated]);

  // Handlers
  const handleSort = (columnId: keyof T) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = paginatedData.map((_, index) => page * rowsPerPage + index);
      setSelected(newSelected);
      onSelectionChange?.(newSelected.map(index => data[index]));
    } else {
      setSelected([]);
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (index: number) => {
    const selectedIndex = selected.indexOf(index);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, index];
    } else {
      newSelected = selected.filter(i => i !== index);
    }

    setSelected(newSelected);
    onSelectionChange?.(newSelected.map(i => data[i]));
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (index: number) => selected.indexOf(index) !== -1;

  return (
    <Box>
      {/* Header */}
      {(title || searchable || selected.length > 0) && (
        <Box className={classes.searchContainer}>
          {title && (
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
          )}
          
          <Box flex={1} />
          
          {selected.length > 0 && (
            <Chip
              label={`${selected.length} selected`}
              color="primary"
              variant="outlined"
            />
          )}
          
          {searchable && (
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          )}
        </Box>
      )}

      {/* Table */}
      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox" className={classes.headerCell}>
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < paginatedData.length}
                    checked={paginatedData.length > 0 && selected.length === paginatedData.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              
              {columns.map((column) => (
                <TableCell
                  key={String(column.id)}
                  align={column.align || 'left'}
                  className={classes.headerCell}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.sortable && column.id !== 'actions' ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id as keyof T)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => {
                const globalIndex = page * rowsPerPage + index;
                const isItemSelected = isSelected(globalIndex);
                
                return (
                  <TableRow
                    key={index}
                    hover
                    className={isItemSelected ? classes.selectedRow : ''}
                    onClick={() => onRowClick?.(row, globalIndex)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onChange={() => handleSelectRow(globalIndex)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    
                    {columns.map((column) => (
                      <TableCell
                        key={String(column.id)}
                        align={column.align || 'left'}
                      >
                        {column.render
                          ? column.render(
                              column.id === 'actions' ? null : row[column.id],
                              row,
                              globalIndex
                            )
                          : String(row[column.id] || '')}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className={classes.emptyState}
                >
                  <Typography variant="body1">{emptyStateText}</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {paginated && filteredData.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </Box>
  );
};
