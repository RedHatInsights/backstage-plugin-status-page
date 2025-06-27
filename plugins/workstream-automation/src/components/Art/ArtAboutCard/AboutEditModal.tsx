import { stringifyEntityRef } from '@backstage/catalog-model';
import { alertApiRef, useApi, useRouteRef } from '@backstage/core-plugin-api';
import { catalogApiRef, entityRouteRef } from '@backstage/plugin-catalog-react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
} from '@material-ui/core';
import { kebabCase } from 'lodash';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import useAsync from 'react-use/esm/useAsync';
import { artApiRef } from '../../../api';
import { CustomUserEntity } from '../../../types';
import { FormInputTextField } from '../../CreateWorkstreamModal/Inputs';
import { FormInputName, FormInputRteName } from '../../CreateArtModal/Inputs';
import { FormInputPath } from './FormInputPath';
import { EditDialogProps, Form } from './types';

export const AboutEditModal = (props: EditDialogProps) => {
  const { entity, open, editModalCloseFn } = props;

  const artApi = useApi(artApiRef);
  const catalogApi = useApi(catalogApiRef);
  const alertApi = useApi(alertApiRef);
  const navigate = useNavigate();
  const entityRoute = useRouteRef(entityRouteRef);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { value: rteEntity, loading: rteEntityFetch } = useAsync(async () => {
    if (entity.spec.rte) {
      const resp = await catalogApi.getEntityByRef(entity.spec.rte);
      return resp as CustomUserEntity;
    }
    return undefined;
  }, []);

  const form = useForm<Form>({
    values: {
      artName: entity.metadata.title,
      artPath: entity.metadata.name,
      rte: !rteEntityFetch ? rteEntity : undefined,
      pillar: entity.spec.pillar,
      description: entity.metadata.description,
      workstreams: [],
    },
    mode: 'all',
  });

  function handleClose() {
    form.reset();
    setIsSubmitted(false);
    editModalCloseFn();
  }

  return (
    <Dialog
      open={open}
      onClose={(_e, reason) =>
        reason !== 'backdropClick' ? handleClose() : null
      }
    >
      <DialogTitle>Edit ART Info</DialogTitle>
      <DialogContent dividers>
        <FormProvider {...form}>
          <Grid container>
            <Grid item xs={12}>
              <FormInputName currentEntity={entity} />
            </Grid>
            <Grid item xs={12}>
              <FormInputTextField
                name="description"
                label="Description"
                placeholder="Enter some description"
                textFieldProps={{ multiline: true, rows: '5' }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormInputRteName members={entity.spec.members} />
            </Grid>
            <Grid item xs={12}>
              <FormInputTextField
                name="pillar"
                rules={{ required: 'Pillar name is required' }}
                label="Pillar name"
                placeholder="Enter Pillar name"
              />
            </Grid>
            <Grid item xs={12}>
              <FormInputPath
                entity={entity}
                currentArtName={entity.metadata.name}
              />
            </Grid>
          </Grid>
        </FormProvider>
      </DialogContent>
      <DialogActions style={{ marginRight: '8px' }}>
        <Button
          variant="contained"
          color="primary"
          disabled={isSubmitted}
          onClick={form.handleSubmit(data => {
            setIsSubmitted(true);
            artApi
              .updateArt(entity.metadata.name, {
                name: kebabCase(data.artPath),
                title: data.artName,
                rte: data.rte && stringifyEntityRef(data.rte),
                pillar: data.pillar,
                description: data.description,
              })
              .then(resp => {
                alertApi.post({
                  message: resp.message,
                  display: 'transient',
                });
                if (entity.metadata.name !== kebabCase(data.artPath)) {
                  setTimeout(() => {
                    navigate(
                      entityRoute({
                        name: kebabCase(data.artPath) ?? entity.metadata.name,
                        kind: entity.kind,
                        namespace: entity.metadata.namespace,
                      }),
                    );
                  }, 1000);
                }
                handleClose();
              });
          })}
        >
          Update
        </Button>
        <Button color="primary" onClick={() => handleClose()}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
