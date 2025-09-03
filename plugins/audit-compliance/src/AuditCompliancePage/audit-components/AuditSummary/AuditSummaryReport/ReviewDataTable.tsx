import {
  Table as BackstageTable,
  Content,
  Page,
  TableColumn,
} from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { EntityDisplayName } from '@backstage/plugin-catalog-react';
import {
  ExportCsv as exportCsv,
  ExportPdf as exportPdf,
} from '@material-table/exporters';
import {
  Box,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  Link,
  Switch,
  Typography,
} from '@material-ui/core';
import GitHubIcon from '@material-ui/icons/GitHub';
import PersonIcon from '@material-ui/icons/Person';
import { useState } from 'react';
import { useStyles } from './AuditSummaryReport.styles';

interface ReviewDataTableProps {
  app_name: string;
  frequency: string;
  period: string;
  type: 'user_access' | 'service_account';
  pdfMode?: boolean;
  data?: any[];
  loading?: boolean;
}

export const ReviewDataTable: React.FC<ReviewDataTableProps> = ({
  type,
  pdfMode = false,
  data: propData,
  loading: propLoading,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const configApi = useApi(configApiRef);
  const jiraUrl = configApi.getString('auditCompliance.jiraUrl');
  const classes = useStyles();

  // Use props data if provided, otherwise use empty array
  const tableData = propData || [];
  const tableLoading = propLoading !== undefined ? propLoading : false;

  // Define columns based on type
  const columns: TableColumn<any>[] =
    type === 'service_account'
      ? [
          { title: 'Service Account', field: 'service_account' },
          { title: 'App Name', field: 'app_name' },
          { title: 'Environment', field: 'environment' },
          { title: 'User Role', field: 'user_role' },
          {
            title: 'Status',
            field: 'sign_off_status',
            render: rowData => {
              let chipStyle = {};
              if (rowData.sign_off_status === 'approved') {
                chipStyle = { backgroundColor: '#d1f1bb' };
              } else if (rowData.sign_off_status === 'rejected') {
                chipStyle = { backgroundColor: '#fbc5c5' };
              } else {
                chipStyle = { backgroundColor: '#cbc9c9' };
              }
              return (
                <Chip
                  label={rowData.sign_off_status}
                  style={{ textTransform: 'capitalize', ...chipStyle }}
                />
              );
            },
          },
          // Detailed columns (hidden by default)
          { title: 'User ID', field: 'user_id', hidden: !showDetails },
          { title: 'Period', field: 'period', hidden: !showDetails },
          { title: 'Frequency', field: 'frequency', hidden: !showDetails },
          { title: 'Manager', field: 'manager', hidden: !showDetails },
          {
            title: 'Custom Reviewer',
            field: 'app_delegate',
            hidden: !showDetails,
            render: rowData => {
              if (!rowData.app_delegate) return null;
              return (
                <EntityDisplayName
                  entityRef={{
                    name: rowData.app_delegate,
                    kind: 'User',
                    namespace: 'redhat',
                  }}
                />
              );
            },
          },
          {
            title: 'Account Source',
            field: 'source',
            render: rowData => {
              const source = rowData.source?.toLowerCase();
              const icon =
                source === 'gitlab' ? <GitHubIcon /> : <PersonIcon />;
              return (
                <Chip
                  icon={icon}
                  label={rowData.source}
                  variant="outlined"
                  size="small"
                  className={classes.sourceChip}
                />
              );
            },
          },
          { title: 'Account Name', field: 'account_name' },
          {
            title: 'Ticket ID',
            field: 'ticket_reference',
            render: rowData => {
              if (!rowData.ticket_reference) return null;
              return (
                <Link
                  href={`${jiraUrl}/browse/${rowData.ticket_reference}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {rowData.ticket_reference}
                </Link>
              );
            },
          },
          { title: 'Ticket Status', field: 'ticket_status' },
          { title: 'Comments', field: 'comments' },
          {
            title: 'Date of Access Revoked or Added',
            field: 'access_change_date',
            hidden: !showDetails,
          },
          { title: 'Created At', field: 'created_at', hidden: !showDetails },
          { title: 'Approval Date', field: 'sign_off_date' },
          {
            title: 'Approved By',
            field: 'sign_off_by',
            render: rowData => {
              if (
                !rowData.sign_off_by ||
                rowData.sign_off_by === '' ||
                rowData.sign_off_by === 'N/A'
              ) {
                return rowData.sign_off_by || 'N/A';
              }

              // Extract username from entity reference (e.g., "user:redhat/yoswal" -> "yoswal")
              const username = rowData.sign_off_by.includes('user:redhat/')
                ? rowData.sign_off_by.replace('user:redhat/', '')
                : rowData.sign_off_by;

              return (
                <EntityDisplayName
                  entityRef={{
                    name: username,
                    kind: 'User',
                    namespace: 'redhat',
                  }}
                />
              );
            },
          },
        ]
      : [
          { title: 'Full Name', field: 'full_name' },
          { title: 'App Name', field: 'app_name' },
          { title: 'Environment', field: 'environment' },
          { title: 'User Role', field: 'user_role' },
          {
            title: 'Status',
            field: 'sign_off_status',
            render: rowData => {
              let chipStyle = {};
              if (rowData.sign_off_status === 'approved') {
                chipStyle = { backgroundColor: '#d1f1bb' };
              } else if (rowData.sign_off_status === 'rejected') {
                chipStyle = { backgroundColor: '#fbc5c5' };
              } else {
                chipStyle = { backgroundColor: '#cbc9c9' };
              }
              return (
                <Chip
                  label={rowData.sign_off_status}
                  style={{ textTransform: 'capitalize', ...chipStyle }}
                />
              );
            },
          },
          // Detailed columns (hidden by default)
          { title: 'User ID', field: 'user_id', hidden: !showDetails },
          { title: 'Period', field: 'period', hidden: !showDetails },
          { title: 'Frequency', field: 'frequency', hidden: !showDetails },
          { title: 'Manager', field: 'manager', hidden: !showDetails },
          {
            title: 'Custom Reviewer',
            field: 'app_delegate',
            hidden: !showDetails,
            render: rowData => {
              if (!rowData.app_delegate) return null;
              return (
                <EntityDisplayName
                  entityRef={{
                    name: rowData.app_delegate,
                    kind: 'User',
                    namespace: 'redhat',
                  }}
                />
              );
            },
          },
          {
            title: 'Account Source',
            field: 'source',
            render: rowData => {
              const source = rowData.source?.toLowerCase();
              let icon = <PersonIcon />;
              if (source === 'gitlab') {
                icon = <GitHubIcon />;
              } else if (source === 'ldap') {
                icon = <PersonIcon />; // Using PersonIcon for LDAP
              }
              return (
                <Chip
                  icon={icon}
                  label={rowData.source}
                  variant="outlined"
                  size="small"
                  className={classes.sourceChip}
                />
              );
            },
          },
          { title: 'Account Name', field: 'account_name' },
          {
            title: 'Ticket ID',
            field: 'ticket_reference',
            render: rowData => {
              if (!rowData.ticket_reference) return null;
              return (
                <Link
                  href={`${jiraUrl}/browse/${rowData.ticket_reference}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {rowData.ticket_reference}
                </Link>
              );
            },
          },
          { title: 'Ticket Status', field: 'ticket_status' },
          { title: 'Comments', field: 'comments' },
          {
            title: 'Date of Access Revoked or Added',
            field: 'access_change_date',
            hidden: !showDetails,
          },
          { title: 'Created At', field: 'created_at', hidden: !showDetails },
          { title: 'Approval Date', field: 'sign_off_date' },
          {
            title: 'Approved By',
            field: 'sign_off_by',
            render: rowData => {
              if (
                !rowData.sign_off_by ||
                rowData.sign_off_by === '' ||
                rowData.sign_off_by === 'N/A'
              ) {
                return rowData.sign_off_by || 'N/A';
              }

              // Extract username from entity reference (e.g., "user:redhat/yoswal" -> "yoswal")
              const username = rowData.sign_off_by.includes('user:redhat/')
                ? rowData.sign_off_by.replace('user:redhat/', '')
                : rowData.sign_off_by;

              return (
                <EntityDisplayName
                  entityRef={{
                    name: username,
                    kind: 'User',
                    namespace: 'redhat',
                  }}
                />
              );
            },
          },
        ];

  return (
    <Page themeId="tool">
      <Content>
        <Box mb={2}>
          <Typography variant="h6">
            {type === 'user_access' ? 'User Access' : 'Service Accounts'}{' '}
            Reviews ({tableData.length})
          </Typography>
        </Box>
        {tableLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid
              container
              spacing={2}
              alignItems="center"
              style={{ marginBottom: 16 }}
            >
              <Grid item>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showDetails}
                      onChange={e => setShowDetails(e.target.checked)}
                    />
                  }
                  label="Show Details"
                />
              </Grid>
            </Grid>
            <BackstageTable
              options={{
                paging: !pdfMode, // Disable pagination in PDF mode
                pageSize: pdfMode ? 1000 : 5, // Show all data in PDF mode
                pageSizeOptions: pdfMode
                  ? []
                  : [5, 10, 25, 50, tableData.length], // Add "Show All" option
                exportAllData: true,
                exportMenu: pdfMode
                  ? []
                  : [
                      // Hide export menu in PDF mode
                      {
                        label: 'Export to PDF',
                        exportFunc: (cols, renderData) =>
                          exportPdf(
                            cols,
                            renderData,
                            `${type}_access_reviews_${new Date().getTime()}`,
                          ),
                      },
                      {
                        label: 'Export to CSV',
                        exportFunc: (cols, renderData) =>
                          exportCsv(
                            cols,
                            renderData,
                            `${type}_access_reviews_${new Date().getTime()}`,
                          ),
                      },
                    ],
              }}
              columns={columns}
              data={tableData}
            />
          </>
        )}
      </Content>
    </Page>
  );
};
