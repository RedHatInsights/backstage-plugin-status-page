import {
  ArtEntity,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@material-ui/core';
import { FormInputWorkstreams } from '../CreateArtModal/Inputs';
import { FormProvider, useForm } from 'react-hook-form';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { useEntity } from '@backstage/plugin-catalog-react';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import { artApiRef } from '../../api';
import { ErrorPanel } from '@backstage/core-components';

type EditDialogProps = {
  workstreams: WorkstreamEntity[];
  open: boolean;
  setEditModalOpen: Function;
  entitiesNotFound: string[];
};

export const WorkstreamEditModal = (props: EditDialogProps) => {
  const { open, setEditModalOpen, workstreams, entitiesNotFound } = props;
  const { entity } = useEntity<ArtEntity>();
  const artApi = useApi(artApiRef);
  const alertApi = useApi(alertApiRef);

  const form = useForm<{ workstreams: WorkstreamEntity[] }>({
    values: { workstreams },
    mode: 'all',
  });

  function handleUpdate(formData: { workstreams: WorkstreamEntity[] }) {
    artApi
      .updateArt(entity.metadata.name, {
        name: entity.metadata.name,
        workstreams: formData.workstreams.map(val => stringifyEntityRef(val)),
      })
      .then(res =>
        alertApi.post({ message: res.message, display: 'transient' }),
      );
    handleClose();
  }

  function handleClose() {
    form.reset();
    setEditModalOpen(false);
  }

  return (
    <Dialog
      open={open}
      onClose={(_e, reason) => reason === 'escapeKeyDown' && handleClose()}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Edit Workstreams</DialogTitle>
      <DialogContent>
        <FormProvider {...form}>
          <FormInputWorkstreams currentEntity={entity} />
        </FormProvider>
        {entitiesNotFound.length > 0 && (
          <ErrorPanel
            error={{
              name: 'Missing workstreams',
              stack: ` - ${entitiesNotFound.join('\n - ')}`,
              message: `Following workstreams are missing or deleted,\nand will be removed from ART when you next hit the Update button`,
            }}
            title="Missing Workstreams"
            defaultExpanded
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          onClick={form.handleSubmit(formData => handleUpdate(formData))}
          variant="contained"
          disabled={!form.formState.isValid}
        >
          Update
        </Button>
        <Button color="primary" onClick={handleClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
