import {
  Button,
  Grid,
  Typography,
  Modal,
  makeStyles,
  Chip,
  CircularProgress,
} from '@material-ui/core';
import { useRef, useState } from 'react';
import { outageApiRef } from '../api';
import { useApi } from '@backstage/core-plugin-api';

interface DeleteTemplateModalProps {
  open: boolean;
  onClose: () => void;
  templateToDelete?: any;
  refreshTemplates: () => void;
}

const useStyles = makeStyles(theme => ({
  root: {
    height: 500,
    flexGrow: 1,
    minWidth: 450,
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
    width: 450,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

const DeleteTemplateModal = (props: DeleteTemplateModalProps) => {
  const { open, onClose, templateToDelete, refreshTemplates } = props;
  const classes = useStyles();
  const rootRef = useRef(null);
  const outageApi = useApi(outageApiRef);
  const [isLoading, setIsLoading] = useState(false);

  const deleteTemplate = async () => {
    setIsLoading(true);
    const response = await outageApi.deleteTemplate(templateToDelete.id);
    if (response) {
      refreshTemplates();
      onClose();
      setIsLoading(false);
    }
  };

  return (
    <Modal
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      aria-labelledby="delete-template-modal"
      aria-describedby="delete-template-modal-description"
      className={classes.modal}
      container={() => rootRef.current}
      open={open}
      onClose={onClose}
    >
      <Grid container spacing={2} className={classes.paper}>
        <Grid item xs={12}>
          <Typography variant="h6">
            Are you sure you want to delete this template?
          </Typography>
          <Typography variant="body1">
            <Chip label={templateToDelete?.name} color="default" />
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Button variant="text" color="primary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              deleteTemplate();
            }}
            style={{ marginLeft: '10px', color: 'red', fontWeight: 'lighter' }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </Grid>
      </Grid>
    </Modal>
  );
};

export default DeleteTemplateModal;
