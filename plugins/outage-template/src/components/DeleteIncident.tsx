import { useAnalytics } from '@backstage/core-plugin-api';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { useState } from 'react';

const DeleteIncident = ({
  incidentId,
  open,
  onClose,
  onDelete,
}: DeleteIncidentProps) => {
  const analytics = useAnalytics();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = () => {
    setDeleting(true);
    onDelete(incidentId);
    analytics.captureEvent('delete', `Deletion Requested`);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Incident</DialogTitle>
      <DialogContent>
        Are you sure you want to delete this incident?
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={deleting}>
          Cancel
        </Button>
        <Button onClick={handleDelete} color="secondary" disabled={deleting}>
          {deleting ? 'Deleting' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteIncident;
