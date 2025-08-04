import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  Typography,
  InputAdornment,
} from '@material-ui/core';
import { Table } from '@backstage/core-components';
import SearchIcon from '@material-ui/icons/Search';
import ClearIcon from '@material-ui/icons/Clear';
import RefreshIcon from '@material-ui/icons/Refresh';

interface Application {
  id: string;
  app_name: string;
  app_owner: string;
  cmdb_id: string;
}

interface ApplicationsTableProps {
  applications: Application[];
  selectedApplications: string[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectionChange: (selectedIds: string[]) => void;
  onRefresh: () => void;
}

export const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  selectedApplications,
  searchTerm,
  onSearchChange,
  onSelectionChange,
  onRefresh,
}) => {
  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Applications</Typography>
          <TextField
            size="small"
            variant="outlined"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => onSearchChange('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Table
          title={`${selectedApplications.length} selected of ${applications.length} applications`}
          options={{
            selection: true,
            search: false,
            filtering: false,
            pageSize: 8,
          }}
          data={applications}
          columns={[
            {
              title: 'Application Name',
              field: 'app_name',
              render: (row: Application) => (
                <Typography variant="body2" style={{ fontWeight: 500 }}>
                  {row.app_name}
                </Typography>
              ),
            },
            {
              title: 'Owner',
              field: 'app_owner',
            },
            {
              title: 'CMDB ID',
              field: 'cmdb_id',
              render: (row: Application) => (
                <Chip size="small" label={row.cmdb_id} variant="outlined" />
              ),
            },
          ]}
          onSelectionChange={rows => {
            onSelectionChange(rows.map((row: Application) => row.id));
          }}
          actions={[
            {
              icon: () => <RefreshIcon />,
              tooltip: 'Refresh Applications',
              onClick: onRefresh,
            },
          ]}
        />
      </CardContent>
    </Card>
  );
};
