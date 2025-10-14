import {
  alertApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import AddIcon from '@material-ui/icons/Add';
import CloseIcon from '@material-ui/icons/Close';
import { useEffect, useState } from 'react';

interface JiraField {
  id: string;
  name: string;
  schema: any;
  custom: boolean;
}

interface JiraMetadataItem {
  key: string;
  value: string;
  schema?: any;
}

interface JiraMetadataSectionProps {
  jiraMetadata: JiraMetadataItem[];
  onJiraMetadataChange: (metadata: JiraMetadataItem[]) => void;
}

export const JiraMetadataSection = ({
  jiraMetadata,
  onJiraMetadataChange,
}: JiraMetadataSectionProps) => {
  const fetchApi = useApi(fetchApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const alertApi = useApi(alertApiRef);

  // Jira field mapping state
  const [jiraFields, setJiraFields] = useState<JiraField[]>([]);
  const [jiraFieldsLoading, setJiraFieldsLoading] = useState(false);
  const [jiraFieldsError, setJiraFieldsError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJiraFields() {
      setJiraFieldsLoading(true);
      setJiraFieldsError(null);
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const resp = await fetchApi.fetch(`${baseUrl}/jira/fields`);
        if (resp.ok) {
          const data = await resp.json();
          setJiraFields(data);
        } else {
          setJiraFieldsError('Failed to fetch Jira fields');
          alertApi.post({
            message: 'Failed to fetch Jira fields',
            severity: 'error',
          });
        }
      } catch (err) {
        setJiraFieldsError('Error fetching Jira fields');
        alertApi.post({
          message: 'Error fetching Jira fields',
          severity: 'error',
        });
      } finally {
        setJiraFieldsLoading(false);
      }
    }

    fetchJiraFields();
  }, [fetchApi, discoveryApi, alertApi]);

  // Handlers for Jira Metadata
  const handleJiraMetadataKeyChange = (idx: number, newKey: string) => {
    const newMetadata = jiraMetadata.map((item, i) => {
      if (i === idx) {
        // Find the selected field to get its schema
        const selectedField = jiraFields.find(field => field.id === newKey);
        return {
          ...item,
          key: newKey,
          schema: selectedField?.schema || undefined,
        };
      }
      return item;
    });
    onJiraMetadataChange(newMetadata);
  };

  const handleJiraMetadataValueChange = (idx: number, newValue: string) => {
    const newMetadata = jiraMetadata.map((item, i) =>
      i === idx ? { ...item, value: newValue } : item,
    );
    onJiraMetadataChange(newMetadata);
  };

  const handleAddJiraMetadata = () => {
    const newMetadata = [
      ...jiraMetadata,
      { key: '', value: '', schema: undefined },
    ];
    onJiraMetadataChange(newMetadata);
  };

  const handleRemoveJiraMetadata = (idx: number) => {
    const newMetadata = jiraMetadata.filter((_, i) => i !== idx);
    onJiraMetadataChange(newMetadata);
  };

  // Helper to render Jira metadata section
  const renderJiraMetadataSection = () => {
    if (jiraFieldsLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CircularProgress size={20} />{' '}
          <Typography color="textSecondary">Loading Jira fields...</Typography>
        </div>
      );
    }
    if (jiraFieldsError) {
      return <Typography color="error">{jiraFieldsError}</Typography>;
    }
    if (jiraFields.length === 0) {
      return (
        <Typography color="textSecondary">No Jira fields found.</Typography>
      );
    }
    if (jiraMetadata.length === 0) {
      return (
        <Typography variant="body2" color="textSecondary">
          No Jira metadata fields added yet.
        </Typography>
      );
    }
    return jiraMetadata.map((item, idx) => {
      const selectedField = jiraFields.find(field => field.id === item.key);
      return (
        <Grid
          container
          spacing={1}
          alignItems="center"
          key={idx}
          style={{ marginBottom: 8 }}
        >
          <Grid item xs={12} sm={4}>
            <Autocomplete
              options={jiraFields}
              getOptionLabel={field => field.name}
              value={selectedField || undefined}
              onChange={(_, newValue) => {
                handleJiraMetadataKeyChange(idx, newValue ? newValue.id : '');
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Jira Field"
                  variant="outlined"
                  required
                  fullWidth
                  size="small"
                />
              )}
              fullWidth
              disableClearable
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Field ID"
              value={item.key}
              disabled
              fullWidth
              margin="normal"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Field Value"
              fullWidth
              value={item.value}
              onChange={e => handleJiraMetadataValueChange(idx, e.target.value)}
              required
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={1}>
            <IconButton
              color="secondary"
              onClick={() => handleRemoveJiraMetadata(idx)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
      );
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Jira Compulsory Fields (Metadata)
        </Typography>
        <Typography variant="body2" color="error" gutterBottom>
          <b>Tip:</b> These fields are <b>case sensitive</b> and the value
          should match <b>exactly</b> as it is used in Jira. If not, Jira issues
          will not be created.
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Add key-value pairs for compulsory Jira fields. These will be stored
          as metadata.
        </Typography>
        {renderJiraMetadataSection()}
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddJiraMetadata}
          style={{ marginTop: 8 }}
        >
          Add Jira Field
        </Button>
      </CardContent>
    </Card>
  );
};
