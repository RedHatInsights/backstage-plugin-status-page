import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';

const DeleteIncident = ({
  incidentId,
  open,
  onClose,
  onDelete,
}: DeleteIncidentProps) => {
  const handleDelete = () => {
    onDelete(incidentId);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Incident</DialogTitle>
      <DialogContent>
        Are you sure you want to delete this incident?
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleDelete} color="secondary">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteIncident;
