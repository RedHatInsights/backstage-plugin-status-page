import {
  Table as BackstageTable,
  Content,
  Page,
  TableColumn,
} from '@backstage/core-components';
import {
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
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
import { useEffect, useState } from 'react';
import { useStyles } from './AuditSummaryReport.styles';
import { ReviewDataItem } from './types';

interface ReviewDataTableProps {
  app_name: string;
  frequency: string;
  period: string;
  type: 'user_access' | 'service_account';
}

export const ReviewDataTable: React.FC<ReviewDataTableProps> = ({
  app_name,
  frequency,
  period,
  type,
}) => {
  const [data, setData] = useState<ReviewDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const configApi = useApi(configApiRef);
  const jiraUrl = configApi.getString('auditCompliance.jiraUrl');
  const classes = useStyles();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');

        if (type === 'user_access') {
          // Fetch user access reviews
          const response = await fetchApi.fetch(
            `${baseUrl}/access-reviews?app_name=${app_name}&frequency=${frequency}&period=${period}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            },
          );

          if (!response.ok) {
            throw new Error('Failed to fetch user access reviews');
          }

          const reviews = await response.json();
          // Filter to only include rover and gitlab sources
          const filteredReviews = reviews.filter(
            (review: any) =>
              review.source === 'rover' || review.source === 'gitlab',
          );
          setData(filteredReviews);
        } else {
          // Fetch service account reviews
          const response = await fetchApi.fetch(
            `${baseUrl}/service_account_access_review?app_name=${app_name}&frequency=${frequency}&period=${period}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            },
          );

          if (!response.ok) {
            throw new Error('Failed to fetch service account reviews');
          }

          const reviews = await response.json();
          setData(reviews);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error fetching ${type} reviews:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [app_name, frequency, period, type, discoveryApi, fetchApi]);

  const columns: TableColumn<any>[] = [
    // Essential columns (always visible)
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
    { title: 'Custom Reviewer', field: 'app_delegate', hidden: !showDetails },
    {
      title: 'Account Source',
      field: 'source',
      render: rowData => {
        const source = rowData.source?.toLowerCase();
        const icon = source === 'gitlab' ? <GitHubIcon /> : <PersonIcon />;
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
    { title: 'Approved By', field: 'sign_off_by' },
  ];

  return (
    <Page themeId="tool">
      <Content>
        <Box mb={2}>
          <Typography variant="h6">
            {type === 'user_access' ? 'User Access' : 'Service Accounts'}{' '}
            Reviews ({data.length})
          </Typography>
        </Box>
        {loading ? (
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
                paging: true,
                pageSize: 5,
                exportAllData: true,
                exportMenu: [
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
              data={data}
            />
          </>
        )}
      </Content>
    </Page>
  );
};
