import { WorkstreamDataV1alpha1 } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import {
  alertApiRef,
  discoveryApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import React from 'react';
import { workstreamApiRef } from '../../api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  FormInputJiraProject,
  FormInputLeadName,
  FormInputTextField,
} from '../CreateWorkstreamModal/Inputs';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
} from '@material-ui/core';
import { Form1 } from '../CreateWorkstreamModal/Inputs/types';
import useAsync from 'react-use/esm/useAsync';
import { CustomUserEntity } from '../../types';
import { stringifyEntityRef } from '@backstage/catalog-model';

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

  const form = useForm<Form1>({
    values: {
      workstreamName: null,
      lead: !leadEntityFetch ? leadEntity : undefined,
      pillar: entity.spec.pillar,
      description: entity.metadata.description,
      email: entity.metadata.links.at(0)?.url.replace('mailto://', ''),
      slackChannelUrl: entity.metadata.links.at(1)?.url,
      jiraProject: !isJiraLoading ? jiraOptions : undefined,
      portfolio: [],
    },
    mode: 'all',
  });

  function handleClose() {
    form.reset();
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
              <FormInputTextField
                name="email"
                rules={{
                  required: 'Email is required',
                  validate: (val: string) => {
                    if (!RegExp(/^\S+@\S+\.\S+$/).exec(val))
                      return 'Email should be in format: your-name@company.com';
                    return true;
                  },
                }}
                label="Email"
                placeholder="Enter team email"
              />
            </Grid>
            <Grid item xs={12}>
              <FormInputTextField
                name="slackChannelUrl"
                label="Slack Link"
                rules={{
                  required: 'Slack link is required',
                  validate: (val: string) => {
                    if (
                      !RegExp(
                        /^https:\/\/([a-zA-Z0-9-.]+\.)?slack\.com\/archives\/[a-zA-Z0-9]+$/,
                      ).exec(val)
                    )
                      return 'Slack link should be in format: https://*.slack.com/archives/CHANNEL_ID';
                    return true;
                  },
                }}
                placeholder="Enter link"
              />
            </Grid>
          </Grid>
        </FormProvider>
      </DialogContent>
      <DialogActions style={{ marginRight: '8px' }}>
        <Button
          variant="contained"
          color="primary"
          disabled={!form.formState.isDirty}
          onClick={form.handleSubmit(data => {
            workstreamApi
              .updateWorkstream({
                name: entity.metadata.name,
                lead: data.lead && stringifyEntityRef(data.lead),
                pillar: data.pillar,
                description: data.description,
                email: data.email,
                slackChannelUrl: data.slackChannelUrl,
                jiraProject: data.jiraProject?.key,
              })
              .then(resp => {
                alertApi.post({
                  message: resp.message,
                  display: 'transient',
                  severity: 'info',
                });
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
