import {
  Button,
  TextField,
  Grid,
  Typography,
  MenuItem,
  Modal,
  makeStyles,
  CircularProgress,
} from '@material-ui/core';
import { useEffect, useRef, useState } from 'react';
import { outageApiRef } from '../api';
import { useApi } from '@backstage/core-plugin-api';

interface TemplateFormModalProps {
  open: boolean;
  onCreateTemplate: () => void;
  onClose: () => void;
  type: string;
  templateToEdit?: any;
}

const useStyles = makeStyles(theme => ({
  root: {
    height: 500,
    flexGrow: 1,
    minWidth: 500,
    transform: 'translateZ(0)',
    // The position fixed scoping doesn't work in IE 11.
    // Disable this demo to preserve the others.
    '@media all and (-ms-high-contrast: none)': {
      display: 'none',
    },
  },
  modal: {
    display: 'flex',
    padding: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: 600,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

const TemplateFormModal = (props: TemplateFormModalProps) => {
  const { open, onClose, onCreateTemplate, type, templateToEdit } = props;
  const classes = useStyles();
  const rootRef = useRef(null);
  const outageApi = useApi(outageApiRef);
  const [isLoading, setIsLoading] = useState(false);
  const [backupFormData, setBackupFormData] = useState({
    name: '',
    description: '',
    impact: '',
    status: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    impact: '',
    status: '',
  });

  const handleValidation = () => {
    if (
      Object.values(formData).every(value => value !== '') &&
      JSON.stringify(formData) !== JSON.stringify(backupFormData)
    ) {
      return true;
    }
    return false;
  };
  const handleCreateTemplate = async () => {
    setIsLoading(true);
    const templateData = {
      name: formData.name,
      body: formData.description,
      impactOverride: formData.impact,
      status: formData.status,
    };
    const response = await outageApi.createTemplate(templateData);
    if (response) {
      onCreateTemplate();
      onClose();
      setFormData({
        name: '',
        description: '',
        impact: '',
        status: '',
      });
    }
    setIsLoading(false);
  };

  const handleUpdateTemplate = async () => {
    setIsLoading(true);
    const templateData = {
      id: templateToEdit.id,
      name: formData.name,
      body: formData.description,
      impactOverride: formData.impact,
      status: formData.status,
    };
    const response = await outageApi.updateTemplate(templateData);
    if (response) {
      onCreateTemplate();
      onClose();
      setFormData({
        name: '',
        description: '',
        impact: '',
        status: '',
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
        impact: '',
        status: '',
      });
    }
  }, [open]);

  useEffect(() => {
    if (templateToEdit) {
      setFormData({
        name: templateToEdit.name,
        description: templateToEdit.body,
        impact: templateToEdit.impactOverride,
        status: templateToEdit.status,
      });

      setBackupFormData({
        name: templateToEdit.name,
        description: templateToEdit.body,
        impact: templateToEdit.impactOverride,
        status: templateToEdit.status,
      });
    }
  }, [templateToEdit]);

  return (
    <Modal
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      aria-labelledby="template-form-modal"
      aria-describedby="template-form-modal-description"
      className={classes.modal}
      container={() => rootRef.current}
      open={open}
      onClose={onClose}
    >
      <Grid container spacing={2} className={classes.paper}>
        <Grid item xs={12}>
          <Typography variant="h6">
            {type === 'create' ? 'Create Template' : 'Edit Template'}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Template Name"
            variant="outlined"
            fullWidth
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Template Impact"
            variant="outlined"
            fullWidth
            required
            select
            value={formData.impact}
            onChange={e => setFormData({ ...formData, impact: e.target.value })}
          >
            <MenuItem value="">Select Impact</MenuItem>
            <MenuItem value="critical">Critical</MenuItem>
            <MenuItem value="major">Major</MenuItem>
            <MenuItem value="minor">Minor</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Template Status"
            variant="outlined"
            fullWidth
            required
            select
            value={formData.status}
            onChange={e => setFormData({ ...formData, status: e.target.value })}
          >
            <MenuItem value="">Select Status</MenuItem>
            <MenuItem value="investigating">Investigating</MenuItem>
            <MenuItem value="identified">Identified</MenuItem>
            <MenuItem value="monitoring">Monitoring</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Template Description"
            variant="outlined"
            fullWidth
            multiline
            minRows={5}
            required
            value={formData.description}
            onChange={e =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={type === 'create' ? handleCreateTemplate : handleUpdateTemplate}
            disabled={!handleValidation() || isLoading}
          >
            {isLoading && <CircularProgress size={20} />}

            {type === 'create' ? 'Create Template' : 'Update Template'}
          </Button>
        </Grid>
      </Grid>
    </Modal>
  );
};

export default TemplateFormModal;
