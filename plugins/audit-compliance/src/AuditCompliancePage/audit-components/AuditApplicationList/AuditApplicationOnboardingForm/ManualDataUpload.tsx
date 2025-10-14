import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import CloudDownload from '@material-ui/icons/CloudDownload';
import CloudUpload from '@material-ui/icons/CloudUpload';
import CheckCircle from '@material-ui/icons/CheckCircle';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
  alertApiRef,
} from '@backstage/core-plugin-api';

const useStyles = makeStyles(theme => ({
  root: {
    marginTop: theme.spacing(2),
  },
  card: {
    marginBottom: theme.spacing(2),
  },
  buttonGroup: {
    display: 'flex',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  fileInput: {
    display: 'none',
  },
  previewTable: {
    marginTop: theme.spacing(2),
  },
  successChip: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  errorChip: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
}));

interface ManualDataUploadProps {
  appName: string;
  frequency: string;
  period: string;
  onUploadSuccess?: (data: any[]) => void;
  onUploadError?: (error: string) => void;
}

interface UploadedData {
  type: string;
  source: string;
  account_name: string;
  custom_reviewer?: string;
}

export const ManualDataUpload: React.FC<ManualDataUploadProps> = ({
  onUploadSuccess,
  onUploadError,
}) => {
  const classes = useStyles();
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);
  const alertApi = useApi(alertApiRef);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedData, setUploadedData] = useState<UploadedData[]>([]);
  const [isUploaded, setIsUploaded] = useState(false);

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
      const response = await fetchApi.fetch(`${baseUrl}/manual-data/template`);

      if (!response.ok) {
        throw new Error('Failed to download template');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'manual-data-template.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alertApi.post({
        message: 'Template downloaded successfully!',
        severity: 'success',
      });
    } catch (error) {
      alertApi.post({
        message: `Failed to download template: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        severity: 'error',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Read and parse Excel file locally
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      if (!rawData || rawData.length === 0) {
        throw new Error('Excel file is empty or contains no data');
      }

      // Validate and transform data
      const processedData = rawData.map((row: any, index: number) => {
        if (!row.type || !row.account_name) {
          throw new Error(
            `Row ${index + 1}: Missing required fields (type, account_name)`,
          );
        }

        return {
          type: row.type,
          source: row.source || 'manual', // Use source from Excel or default to 'manual'
          account_name: row.account_name,
          custom_reviewer: row.custom_reviewer || row['Custom Reviewer'] || '',
        };
      });

      setUploadedData(processedData);
      setIsUploaded(true);
      onUploadSuccess?.(processedData);

      alertApi.post({
        message: `Successfully processed ${processedData.length} manual entries!`,
        severity: 'success',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
      alertApi.post({
        message: `Upload failed: ${errorMessage}`,
        severity: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box className={classes.root}>
      <Card className={classes.card}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Manual Data Upload
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Download the Excel template, fill it with your manual data, and
            upload it here. Manual entries will be marked as unverified in the
            audit summary.
          </Typography>

          <Box className={classes.buttonGroup}>
            <Button
              variant="outlined"
              startIcon={<CloudDownload />}
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Box className={classes.loadingContainer}>
                  <CircularProgress size={16} />
                  Downloading...
                </Box>
              ) : (
                'Download Template'
              )}
            </Button>

            <input
              accept=".xlsx,.xls"
              className={classes.fileInput}
              id="excel-file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <label htmlFor="excel-file-upload">
              <Button
                variant="contained"
                color="primary"
                component="span"
                startIcon={<CloudUpload />}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Box className={classes.loadingContainer}>
                    <CircularProgress size={16} />
                    Uploading...
                  </Box>
                ) : (
                  'Upload Excel File'
                )}
              </Button>
            </label>
          </Box>

          {isUploaded && (
            <Box
              display="flex"
              alignItems="center"
              style={{
                marginBottom: 16,
                padding: 12,
                backgroundColor: '#e8f5e8',
                borderRadius: 4,
                color: '#2e7d32',
              }}
            >
              <CheckCircle />
              <Typography variant="body2">
                Manual data uploaded successfully! {uploadedData.length} entries
                processed.
              </Typography>
            </Box>
          )}

          {uploadedData.length > 0 && (
            <Box className={classes.previewTable}>
              <Typography variant="subtitle1" gutterBottom>
                Uploaded Manual Accounts ({uploadedData.length} entries)
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Account Name</TableCell>
                      <TableCell>Custom Reviewer</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {uploadedData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Chip
                            label={row.type}
                            size="small"
                            color={
                              row.type === 'service-account'
                                ? 'primary'
                                : 'secondary'
                            }
                          />
                        </TableCell>
                        <TableCell>{row.account_name}</TableCell>
                        <TableCell>{row.custom_reviewer || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label="Manual"
                            size="small"
                            className={classes.successChip}
                            icon={<CheckCircle />}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Typography
                variant="body2"
                color="textSecondary"
                style={{ marginTop: 8 }}
              >
                These accounts will be added to your application configuration.
                Manual entries cannot be automatically verified.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
