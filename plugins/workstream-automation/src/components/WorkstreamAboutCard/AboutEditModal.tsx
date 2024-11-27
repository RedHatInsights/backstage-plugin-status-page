import { WorkstreamDataV1alpha1 } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { stringifyEntityRef } from '@backstage/catalog-model';
import {
  alertApiRef,
  discoveryApiRef,
  useApi,
  useRouteRef,
} from '@backstage/core-plugin-api';
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
import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import useAsync from 'react-use/esm/useAsync';
import { workstreamApiRef } from '../../api';
import { CustomUserEntity } from '../../types';
import {
  FormInputJiraProject,
  FormInputLeadName,
  FormInputName,
  FormInputTextField,
} from '../CreateWorkstreamModal/Inputs';
import { FormInputPath } from './FormInputPath';
import { Form } from './type';

type EditDialogProps = {
  entity: WorkstreamDataV1alpha1;
  open: boolean;
  editModalCloseFn: Function;
};

export const AboutEditModal = (props: EditDialogProps) => {
  const { entity, open, editModalCloseFn } = props;

  const workstreamApi = useApi(workstreamApiRef);
  const catalogApi = useApi(catalogApiRef);
  const discoveryApi = useApi(discoveryApiRef);
  const alertApi = useApi(alertApiRef);
  const navigate = useNavigate();
  const entityRoute = useRouteRef(entityRouteRef);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { value: leadEntity, loading: leadEntityFetch } = useAsync(async () => {
    if (entity.spec.lead) {
      const resp = await catalogApi.getEntityByRef(entity.spec.lead);
      return resp as CustomUserEntity;
    }
    return undefined;
  }, []);

  const { value: jiraOptions, loading: isJiraLoading } = useAsync(async () => {
    const proxy = await discoveryApi.getBaseUrl('proxy');
    const base = `${proxy}/jira/rest/api/2/project/${entity.metadata.annotations['jira/project-key']}`;
    const resp = await fetch(base);
    const respd = await resp.json();
    return {
      key: respd.key,
      name: respd.name,
    };
  }, []);

  const form = useForm<Form>({
    values: {
      workstreamName: entity.metadata.title,
      workstreamPath: entity.metadata.name,
      lead: !leadEntityFetch ? leadEntity : undefined,
      pillar: entity.spec.pillar,
      description: entity.metadata.description,
      jiraProject: !isJiraLoading ? jiraOptions : undefined,
      portfolio: [],
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
      <DialogTitle>Edit Workstream Info</DialogTitle>
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
              <FormInputLeadName />
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
              <FormInputJiraProject />
            </Grid>
            <Grid item xs={12}>
              <FormInputPath
                entity={entity}
                currentWorkstreamName={entity.metadata.name}
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
            workstreamApi
              .updateWorkstream(entity.metadata.name, {
                name: kebabCase(data.workstreamPath),
                title: data.workstreamName,
                lead: data.lead && stringifyEntityRef(data.lead),
                pillar: data.pillar,
                description: data.description,
                jiraProject: data.jiraProject?.key,
              })
              .then(resp => {
                alertApi.post({
                  message: resp.message,
                  display: 'transient',
                  severity: 'info',
                });
                if (entity.metadata.name !== kebabCase(data.workstreamPath)) {
                  setTimeout(() => {
                    navigate(
                      entityRoute({
                        name:
                          kebabCase(data.workstreamPath) ??
                          entity.metadata.name,
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
