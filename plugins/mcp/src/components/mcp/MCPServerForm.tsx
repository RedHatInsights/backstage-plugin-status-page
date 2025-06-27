import {
  alertApiRef,
  discoveryApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
  TextField,
} from '@material-ui/core';
import { useState } from 'react';

interface MCPServerFormProps {
  open: boolean;
  onClose: () => void;
}

const MCPServerForm: React.FC<MCPServerFormProps> = ({ open, onClose }) => {
  const discoveryApi = useApi(discoveryApiRef);
  const alertApi = useApi(alertApiRef);
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    npmId: '',
    dockerId: '',
    version: '',
    description: '',
    maintainers: '',
    tags: '',
    readme: '',
    changelog: '',
    offer: '',
    documentation: '',
    status: '',
    customRegistry: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUrl(input);
    try {
      // eslint-disable-next-line no-new
      new URL(input);
      setError(false);
    } catch (_) {
      setError(true);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      const requiredFields = [
        'name',
        'url',
        'npmId',
        'version',
        'description',
        'maintainers',
        'tags',
      ];
      return requiredFields.every(
        field => formData[field as keyof typeof formData].trim() !== '',
      );
    }
    return true;
  };

  const handleFetch = async () => {
    setLoading(true);
    const inputUrl = url.trim();
    let transformedUrl = inputUrl;

    try {
      const parsedUrl = new URL(inputUrl);
      if (parsedUrl.hostname.includes('gitlab')) {
        const path = parsedUrl.pathname.replace(/\/$/, '');
        transformedUrl = `${parsedUrl.origin}${path}/-/raw/main/package.json?ref_type=heads`;
      }
    } catch (_) {
      // eslint-disable-next-line no-console
      console.error('URL error:', _);
    }

    let fetchedData = {
      name: '',
      version: '',
      description: '',
      maintainers: '',
      npmId: '',
      dockerId: '',
    };

    try {
      const response = await fetch(transformedUrl);
      const json = await response.json();

      fetchedData = {
        name: json.name || '',
        version: json.version || '',
        description: json.description || '',
        npmId: json.npmId || '',
        dockerId: json.dockerId || '',
        maintainers: json.maintainers || '',
      };
    } catch (_) {
      alertApi.post({
        message:
          'Could not load data from URL. You can still proceed manually.',
        severity: 'error',
      });
    }

    setFormData({
      name: fetchedData.name,
      url: inputUrl,
      npmId: fetchedData.npmId,
      dockerId: fetchedData.dockerId,
      version: fetchedData.version,
      description: fetchedData.description,
      maintainers: fetchedData.maintainers,
      tags: '',
      readme: '',
      changelog: '',
      offer: '',
      documentation: '',
      status: '',
      customRegistry: '',
    });
    setStep(1);
    setLoading(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    if (!validateStep()) {
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);

    try {
      const data = await discoveryApi.getBaseUrl('proxy');
      const response = await fetch(`${data}/mcp/raw`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok)
        throw new Error('Failed to fetch existing registry data');

      const jsonData = await response.json();
      const timestampKey = `mcp-server-${Date.now()}`;
      const updatedData = { ...jsonData, [timestampKey]: formData };

      const updateResponse = await fetch(`${data}/mcp`, {
        method: 'PUT',
        body: JSON.stringify({
          title: 'mcp-registry',
          file_name: 'mcp-registry.json',
          content: JSON.stringify(updatedData),
          visibility: 'public',
        }),
      });

      if (!updateResponse.ok) {
        alertApi.post({
          message: 'Failed to update GitLab snippet.',
          severity: 'error',
        });
        throw new Error('Failed to update GitLab snippet');
      }
      alertApi.post({
        message: 'MCP Server Registered Successfully.',
        severity: 'success',
      });
    } catch (_) {
      // eslint-disable-next-line no-console
      console.error('Submission error:', _);
      alertApi.post({
        message: 'Submission error:.',
        severity: 'error',
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 2000);
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 0:
        return (
          <TextField
            label="Gitlab Repository URL"
            value={url}
            onChange={handleUrlChange}
            fullWidth
            margin="dense"
            placeholder="https://gitlab.cee.redhat.com/app-dev-platform/mcp"
            error={error}
            helperText={error ? 'Please enter a valid URL' : ''}
          />
        );
      case 1:
        return (
          <>
            {[
              'name',
              'url',
              'npmId',
              'dockerId',
              'version',
              'description',
              'maintainers',
              'tags',
            ].map(field => (
              <TextField
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                name={field}
                value={formData[field as keyof typeof formData]}
                onChange={handleFormChange}
                fullWidth
                margin="dense"
                disabled={loading}
                required
              />
            ))}
          </>
        );
      case 2:
        return (
          <>
            {[
              'readme',
              'changelog',
              'offer',
              'documentation',
              'status',
              'customRegistry',
            ].map(field => (
              <TextField
                key={field}
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                name={field}
                value={formData[field as keyof typeof formData]}
                onChange={handleFormChange}
                fullWidth
                margin="dense"
                disabled={loading}
              />
            ))}
          </>
        );
      case 3:
        return (
          <>
            <h3>Review Submission</h3>
            {Object.entries(formData).map(([key, value]) => (
              <p key={key}>
                <strong>{key}:</strong> {value}
              </p>
            ))}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Register MCP Server</DialogTitle>
      <DialogContent>
        <Stepper activeStep={step} alternativeLabel>
          {[0, 1, 2, 3].map(n => (
            <Step key={n}>
              <StepLabel>{`Step ${n + 1}`}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {getStepContent()}
      </DialogContent>
      <DialogActions>
        {step === 0 && (
          <Button
            onClick={handleFetch}
            color="primary"
            variant="contained"
            disabled={loading || error || !url.trim()}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Import'
            )}
          </Button>
        )}
        {step > 0 && (
          <Button onClick={handleBack} disabled={loading}>
            Back
          </Button>
        )}
        {step > 0 && step < 3 && (
          <Button
            onClick={handleNext}
            color="primary"
            variant="contained"
            disabled={loading || !validateStep()}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Next'}
          </Button>
        )}
        {step === 3 && (
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="contained"
            disabled={loading || !validateStep()}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Submit'
            )}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MCPServerForm;
