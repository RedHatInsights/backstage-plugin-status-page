import { useState, useMemo, FC, ReactNode, ChangeEvent } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  TablePagination,
  TableSortLabel,
  Paper,
  Checkbox,
  Box,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';

import VisibilityIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { GdprTableData } from '../types';

const useStyles = makeStyles(theme => ({
  tableContainer: {
    [theme.breakpoints.down('md')]: {
      overflow: 'auto',
      '& .MuiTable-root': {
        minWidth: 650,
      },
    },
  },
  tableHeader: {
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50],
    '& .MuiTableCell-head': {
      fontWeight: 600,
      color: theme.palette.text.primary,
    },
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
  searchField: {
    minWidth: 250,
    [theme.breakpoints.down('sm')]: {
      minWidth: '100%',
    },
  },
  filterChips: {
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
    marginBottom: theme.spacing(1),
  },
  actionCell: {
    display: 'flex',
    gap: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      '& button': {
        fontSize: '0.7rem',
        padding: theme.spacing(0.25, 0.5),
      },
    },
  },
  mobileHideColumn: {
    [theme.breakpoints.down('sm')]: {
      display: 'none',
    },
  },
  statusChip: {
    fontSize: '0.75rem',
    height: 20,
  },
  sortLabel: {
    '&.MuiTableSortLabel-active': {
      color: theme.palette.primary.main,
    },
  },
  pagination: {
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.grey[50],
  },
}));

interface Column {
  id: keyof GdprTableData;
  label: string;
  sortable: boolean;
  filterable: boolean;
  mobileHide?: boolean;
  render?: (value: any, row: GdprTableData) => ReactNode;
}

interface EnhancedDataTableProps {
  data: GdprTableData[];
  searchType: string;
  onRowSelect?: (selectedRows: GdprTableData[]) => void;
  onViewUser?: (user: GdprTableData) => void;
  onDeleteUser?: (user: GdprTableData) => void;
  loading?: boolean;
}

const columns: Column[] = [
  { id: 'platform', label: 'Platform', sortable: true, filterable: true },
  { id: 'username', label: 'Username', sortable: true, filterable: true },
  { id: 'ssoId', label: 'SSO ID', sortable: true, filterable: true },
  { id: 'roles', label: 'Roles', sortable: true, filterable: true },
  { id: 'comment', label: 'Comment', sortable: true, filterable: true, mobileHide: true },
  { id: 'file', label: 'File', sortable: true, filterable: true, mobileHide: true },
  { id: 'node', label: 'Node', sortable: true, filterable: true, mobileHide: true },
  { id: 'rhlearnId', label: 'RH Learn ID', sortable: true, filterable: true, mobileHide: true },
  { id: 'media', label: 'Media', sortable: true, filterable: true, mobileHide: true },
];

export const EnhancedDataTable: FC<EnhancedDataTableProps> = ({
  data,
  searchType,
  onRowSelect,
  onViewUser,
  onDeleteUser,
  loading = false,
}) => {
  const classes = useStyles();
  
  // State management
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof GdprTableData>('username');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<GdprTableData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    columns.reduce((acc, col) => ({ ...acc, [col.id]: true }), {})
  );

  // Sorting logic
  const handleSort = (property: keyof GdprTableData) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Filter and search logic
  const filteredAndSortedData = useMemo(() => {
    let processedData = [...data];

    // Apply search filter
    if (searchTerm) {
      processedData = processedData.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([column, filterValue]) => {
      if (filterValue) {
        processedData = processedData.filter(row =>
          String(row[column as keyof GdprTableData])
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        );
      }
    });

    // Apply sorting
    processedData.sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
      if (aValue !== null && aValue !== undefined && bValue !== null && bValue !== undefined) {
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return processedData;
  }, [data, searchTerm, filters, orderBy, order]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedData, page, rowsPerPage]);

  // Selection handlers
  const handleSelectAll = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(filteredAndSortedData);
      onRowSelect?.(filteredAndSortedData);
    } else {
      setSelected([]);
      onRowSelect?.([]);
    }
  };

  const handleRowSelect = (row: GdprTableData) => {
    const selectedIndex = selected.findIndex(item => item.uid === row.uid);
    let newSelected: GdprTableData[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, row];
    } else {
      newSelected = selected.filter(item => item.uid !== row.uid);
    }

    setSelected(newSelected);
    onRowSelect?.(newSelected);
  };

  const isSelected = (row: GdprTableData) => 
    selected.some(item => item.uid === row.uid);

  // Filter handlers
  const handleFilterChange = (column: string, value: string) => {
    setFilters(prev => ({ ...prev, [column]: value }));
    setPage(0); // Reset to first page when filtering
  };

  const clearFilter = (column: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPage(0);
  };

  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnId]: !prev[columnId]
    }));
  };

  return (
    <Box>
      {/* Search and Filter Controls */}
      <Box className={classes.searchContainer}>
        <TextField
          className={classes.searchField}
          placeholder="Search all columns..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Tooltip title="Column Options">
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
          >
            <MoreVertIcon />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem onClick={clearAllFilters}>
            Clear All Filters
          </MenuItem>
          <MenuItem divider />
          {columns.map(column => (
            <MenuItem key={column.id}>
              <FormControlLabel
                control={
                  <Switch
                    checked={columnVisibility[column.id]}
                    onChange={() => toggleColumnVisibility(column.id)}
                    size="small"
                  />
                }
                label={column.label}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Active Filters */}
      {(Object.keys(filters).length > 0 || searchTerm) && (
        <Box className={classes.filterChips}>
          {searchTerm && (
            <Chip
              label={`Search: "${searchTerm}"`}
              onDelete={() => setSearchTerm('')}
              size="small"
              color="primary"
            />
          )}
          {Object.entries(filters).map(([column, value]) => (
            <Chip
              key={column}
              label={`${column}: "${value}"`}
              onDelete={() => clearFilter(column)}
              size="small"
              color="secondary"
            />
          ))}
        </Box>
      )}

      {/* Data Table */}
      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table>
          <TableHead className={classes.tableHeader}>
            <TableRow>
              {searchType !== "All System" && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < filteredAndSortedData.length}
                    checked={filteredAndSortedData.length > 0 && selected.length === filteredAndSortedData.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              
              {columns.map(column => {
                if (!columnVisibility[column.id]) return null;
                
                return (
                  <TableCell
                    key={column.id}
                    className={column.mobileHide ? classes.mobileHideColumn : undefined}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleSort(column.id)}
                        className={classes.sortLabel}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                    
                    {column.filterable && (
                      <TextField
                        size="small"
                        placeholder={`Filter ${column.label}`}
                        value={filters[column.id] || ''}
                        onChange={(e) => handleFilterChange(column.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginTop: 4, fontSize: '0.75rem' }}
                        InputProps={{ style: { fontSize: '0.75rem' } }}
                      />
                    )}
                  </TableCell>
                );
              })}
              
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 2} align="center">
                  No data found
                </TableCell>
              </TableRow>
            )}
            {!loading && paginatedData.length > 0 && paginatedData.map((row, index) => (
              <TableRow
                key={`${row.uid}-${index}`}
                selected={isSelected(row)}
                hover
              >
                {searchType !== "All System" && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected(row)}
                      onChange={() => handleRowSelect(row)}
                    />
                  </TableCell>
                )}
                
                {columns.map(column => {
                  if (!columnVisibility[column.id]) return null;
                  
                  const value = row[column.id];
                  return (
                    <TableCell
                      key={column.id}
                      className={column.mobileHide ? classes.mobileHideColumn : undefined}
                    >
                      {column.render ? column.render(value, row) : String(value)}
                    </TableCell>
                  );
                })}
                
                <TableCell>
                  <Box className={classes.actionCell}>
                    <Tooltip title="View User Details">
                      <IconButton
                        size="small"
                        onClick={() => onViewUser?.(row)}
                        color="primary"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Delete User Data">
                      <IconButton
                        size="small"
                        onClick={() => onDeleteUser?.(row)}
                        color="secondary"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={filteredAndSortedData.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25, 50, 100]}
        className={classes.pagination}
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} of ${count} records`
        }
      />
    </Box>
  );
};
