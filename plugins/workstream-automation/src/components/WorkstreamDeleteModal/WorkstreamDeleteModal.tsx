import {
  ArtEntity,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from '@material-ui/core';
import { artApiRef, workstreamApiRef } from '../../api';
import { useNavigate } from 'react-router-dom';

type DeleteProps = {
  open: boolean;
  deleteModalCloseFn: Function;
};

export const WorkstreamDeleteModal = (props: DeleteProps) => {
  const { open, deleteModalCloseFn } = props;
  const { entity } = useEntity<WorkstreamEntity | ArtEntity>();
  const workstreamApi = useApi(workstreamApiRef);
  const artApi = useApi(artApiRef);
  const navigate = useNavigate();
  const alertApi = useApi(alertApiRef);

  function handleClose() {
    deleteModalCloseFn();
  }

  return (
    <Dialog
      open={open}
      onClose={(_e, reason) =>
        reason !== 'backdropClick' ? handleClose() : null
      }
    >
      <DialogContent dividers>
        <Typography variant="body1">
          Are you sure you want to delete this&nbsp;{entity.kind}?
        </Typography>
      </DialogContent>
      <DialogActions style={{ marginRight: '8px' }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            if (entity.kind === 'Workstream')
              workstreamApi
                .deleteWorkstream(entity.metadata.name)
                .then(resp => {
                  alertApi.post({
                    message: resp.message,
                    display: 'transient',
                    severity: 'info',
                  });
                  navigate('/catalog?filters[kind]=workstream');
                  handleClose();
                });
            else if (entity.kind === 'ART')
              artApi.deleteArt(entity.metadata.name).then(resp => {
                alertApi.post({
                  message: resp.message,
                  display: 'transient',
                  severity: 'info',
                });
                navigate('/catalog?filters[kind]=art');
                handleClose();
              });
          }}
        >
          Delete
        </Button>
        <Button color="primary" onClick={() => handleClose()}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
