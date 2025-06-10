import { stringifyEntityRef } from '@backstage/catalog-model';
import { ErrorBoundary, Table, TableColumn } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  EntityDisplayName,
  EntityRefLink,
  humanizeEntityRef,
  useEntityList,
} from '@backstage/plugin-catalog-react';
import {
  Box,
  Button,
  ButtonProps,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  makeStyles,
  Tab,
  TextField,
  Theme,
  Typography,
} from '@material-ui/core';
import { TabContext, TabList } from '@material-ui/lab';
import TabPanel from '@material-ui/lab/TabPanel';
import { kebabCase } from 'lodash';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import { artApiRef } from '../../api';
import { ART, CustomUserEntity, Member, TableRowDataType } from '../../types';

import { MemberDetailsForm } from './Forms/MemberDetailsForm';
import { ArtDetailsForm } from './Forms/ArtDetailsForm';
import { ARTForm1, ARTForm2 } from './types';
import { WorkstreamEntity } from '@appdev-platform/backstage-plugin-workstream-automation-common';

const useStyles = makeStyles((theme: Theme) => ({
  fullHeightDialog: {
    height: '90vh',
  },
  root: {
    flexGrow: 1,
    display: 'flex',
    padding: 0,
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
    minWidth: '15rem',
    padding: '0',
  },
  tabRoot: {
    maxWidth: 'none',
    cursor: 'default',
  },
  tabSpan: {
    alignItems: 'flex-start',
    width: '100%',
  },
  panel: {
    overflowY: 'auto',
  },
  dialogActions: {
    justifyContent: 'flex-start',
    marginLeft: '15rem',
    paddingLeft: '16px',
    '& button': {
      margin: '8px',
    },
  },
}));

const TabTitle = (props: { index: string; label: string; value: string }) => {
  return (
    <Box display="flex" alignItems="center" style={{ padding: '5px 0' }}>
      <Chip
        style={{ marginBottom: '0' }}
        color={props.value === props.index ? 'primary' : 'default'}
        label={props.index}
      />
      <Typography variant="body1">{props.label}</Typography>
    </Box>
  );
};

const ReviewDetailsContent = (props: {
  form1: UseFormReturn<ARTForm1>;
  form2: UseFormReturn<ARTForm2>;
}) => {
  const { form1, form2 } = props;
  const artDetails = form1.getValues();
  const { selectedMembers } = form2.getValues();
  const memberTableColumns: TableColumn<TableRowDataType>[] = [
    {
      id: 'name',
      title: 'Name',
      field: 'user.spec.profile.displayName',
      render: data => (
        <EntityDisplayName entityRef={data.user} disableTooltip />
      ),
    },
    {
      id: 'email',
      title: 'Email',
      field: 'user.spec.profile.email',
      render: data => <>{data.user.spec.profile?.email}</>,
    },
    {
      id: 'role',
      title: 'Role',
      field: 'role',
      render: data => data.role,
    },
    {
      id: 'manager',
      title: 'Manager',
      field: 'user.spec.manager',
      render: data =>
        data.user.spec.manager ? (
          <EntityDisplayName
            entityRef={data.user.spec.manager}
            hideIcon
            disableTooltip
          />
        ) : (
          '-'
        ),
    },
  ];

  const workstreamTableColumns: TableColumn<WorkstreamEntity>[] = [
    {
      field: 'metadata.name',
      title: 'Name',
      render: data => <EntityDisplayName entityRef={data} />,
    },
    {
      field: 'spec.lead',
      title: 'Workstream Lead',
    },
    {
      field: 'metadata.annotations.jira/project-key',
      title: 'Jira Project',
    },
  ];

  function getHumanReadableValue(option: CustomUserEntity) {
    return option.spec.profile
      ? `${option.spec.profile.displayName} (${option.spec.profile.email})`
      : humanizeEntityRef(option, {
          defaultKind: 'user',
          defaultNamespace: false,
        });
  }

  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="h3">Review</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body1">ART Details</Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="ART Name"
          value={artDetails.artName}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="Description"
          value={artDetails.description}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="Release Train Engineer (RTE)"
          value={artDetails.rte ? getHumanReadableValue(artDetails.rte) : '-'}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="Pillar"
          value={artDetails.pillar}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="JIRA Project"
          value={`${artDetails.jiraProject?.name} (${artDetails.jiraProject?.key})`}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="Email"
          value={artDetails.email}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="Slack Link"
          value={artDetails.slackChannelUrl}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body1">Workstreams</Typography>
      </Grid>
      <Grid item xs={12}>
        <Table
          columns={workstreamTableColumns}
          data={artDetails.workstreams}
          options={{
            toolbar: false,
            padding: 'dense',
            paging: artDetails.workstreams.length > 5 ? true : false,
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body1">Member Details</Typography>
      </Grid>
      <Grid item xs={12}>
        <Table
          columns={memberTableColumns}
          data={[
            ...(artDetails.rte
              ? [
                  {
                    role: 'Release Train Engineer (RTE)',
                    user: artDetails.rte,
                  },
                ]
              : []),
            ...selectedMembers,
          ]}
          options={{
            toolbar: false,
            padding: 'dense',
            paging: selectedMembers.length + 1 > 5 ? true : false,
          }}
        />
      </Grid>
    </Grid>
  );
};

export const CreateArtModal = () => {
  const classes = useStyles();
  const artApi = useApi(artApiRef);
  const [value, setValue] = useState<string>('1');
  const form1 = useForm<ARTForm1>({
    values: {
      artName: undefined,
      description: undefined,
      email: undefined,
      jiraProject: undefined,
      // jiraProject: { name: 'PULSE', key: 'PULSE' },
      pillar: undefined,
      rte: undefined,
      slackChannelUrl: undefined,
      workstreams: [],
    },
    mode: 'all',
  });

  const form2 = useForm<ARTForm2>({
    values: {
      kind: { label: 'Rover User', value: 'user' },
      searchQuery: null,
      selectedMembers: [],
    },
  });

  const handleChange = (val: string) => {
    if (form1.formState.isValid) setValue(val);
  };
  const [artData, setArtData] = useState<ART>();
  const [loading, setLoading] = useState<boolean>(false);

  const artDetails = form1.getValues();
  const { selectedMembers } = form2.getValues();

  const [openFinalModal, setOpenFinalModal] = useState(false);

  useEffect(() => {
    if (loading && artData) {
      artApi
        .createNewArt(artData)
        .then(_data => {
          setLoading(false);
          form1.reset();
          form2.reset();
          setOpenFinalModal(true);
        })
        .catch(_err => {
          setLoading(false);
        });
    }
  }, [artApi, artData, form1, form2, loading]);

  const tabsMap = [
    {
      index: '1',
      label: 'Art details',
      children: (
        <FormProvider {...form1}>
          <ArtDetailsForm />
        </FormProvider>
      ),
    },
    {
      index: '2',
      label: 'Member details',
      children: (
        <ErrorBoundary slackChannel={{ name: 'form-one-platform' }}>
          <FormProvider {...form2}>
            <MemberDetailsForm form1={form1} />
          </FormProvider>
        </ErrorBoundary>
      ),
    },
    {
      index: '3',
      label: 'Review',
      children: <ReviewDetailsContent form1={form1} form2={form2} />,
    },
  ];

  const [open, setOpen] = useState(false);

  function handleClose() {
    form1.reset();
    form2.reset();
    setValue('1');
    setArtData(undefined);
    setOpenFinalModal(false);
    setOpen(false);
  }

  function handleCreate(_e: React.MouseEvent<HTMLButtonElement>) {
    if (artDetails.artName) {
      setLoading(true);
      setArtData({
        name: kebabCase(artDetails.artName),
        title: artDetails.artName,
        members: selectedMembers.map<Member>(val => ({
          userRef: stringifyEntityRef(val.user),
          role: val.role ?? '-',
        })),
        description: artDetails.description,
        jiraProject: artDetails.jiraProject?.key,
        rte: artDetails.rte ? stringifyEntityRef(artDetails.rte) : undefined,
        pillar: artDetails.pillar,
        workstreams: artDetails.workstreams.map<string>(val =>
          stringifyEntityRef(val),
        ),
        links: [
          ...(artDetails.slackChannelUrl
            ? [
                {
                  url: artDetails.slackChannelUrl,
                  title: 'Slack',
                  type: 'Contact',
                  icon: 'slack_contact',
                },
              ]
            : []),
          ...(artDetails.email
            ? [
                {
                  url: artDetails.email,
                  title: 'Email',
                  type: 'Email',
                  icon: 'email',
                },
              ]
            : []),
        ],
      });
    }
  }

  const nextButtonProps = (): ButtonProps => {
    if (value === '1')
      return {
        onClick: form1.handleSubmit(() => setValue('2')),
        disabled: !form1.formState.isValid,
        children: 'Next',
      };
    if (value === '2')
      return {
        onClick: form2.handleSubmit(() => setValue('3')),
        children: 'Next',
      };
    return {
      children: 'Create',
      disabled: loading,
      onClick: handleCreate,
    };
  };

  const backButtonProps = (): ButtonProps => {
    return {
      onClick: () => {
        if (value === '2') {
          setValue('1');
          form2.resetField('searchQuery');
        } else if (value === '3') {
          setValue('2');
          form2.resetField('searchQuery');
        }
      },
      children: 'Back',
    };
  };

  const {
    filters: { kind },
  } = useEntityList();
  if (kind?.value !== 'art') {
    return <></>;
  }

  return (
    <div>
      <Button
        variant="contained"
        style={{ margin: '0 8px 0 8px' }}
        onClick={() => setOpen(true)}
        color="primary"
      >
        Create ART
      </Button>
      {open && (
        <Dialog
          open={open}
          maxWidth="lg"
          onClose={(_e, reason) =>
            reason !== 'backdropClick' ? setOpen(false) : null
          }
          PaperProps={{ className: classes.fullHeightDialog }}
        >
          <DialogTitle>Create a ART</DialogTitle>
          <DialogContent dividers className={classes.root}>
            <TabContext value={value}>
              <TabList
                className={classes.tabs}
                onChange={(_e, val) => handleChange(val)}
                orientation="vertical"
              >
                {tabsMap.map(tab => (
                  <Tab
                    key={tab.index}
                    classes={{
                      wrapper: classes.tabSpan,
                      root: classes.tabRoot,
                    }}
                    value={tab.index}
                    fullWidth
                    label={
                      <TabTitle
                        label={tab.label}
                        index={tab.index}
                        value={value}
                      />
                    }
                  />
                ))}
              </TabList>
              {tabsMap.map(tab => (
                <TabPanel
                  key={tab.index}
                  className={classes.panel}
                  value={tab.index}
                >
                  {tab.children}
                </TabPanel>
              ))}
            </TabContext>
          </DialogContent>
          <DialogActions className={classes.dialogActions}>
            {value !== '1' && (
              <Button
                color="primary"
                variant="outlined"
                {...backButtonProps()}
              />
            )}
            <Button
              color="primary"
              variant="contained"
              {...nextButtonProps()}
            />
            <Button
              style={{ marginLeft: '2rem' }}
              color="primary"
              variant="text"
              onClick={() => handleClose()}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      )}
      {openFinalModal && (
        <Dialog maxWidth="sm" fullWidth open={openFinalModal}>
          <DialogContent>
            <Grid container>
              <Grid item xs={12}>
                <Typography variant="h5">
                  Your ART{' '}
                  <b>
                    <EntityRefLink entityRef={`art:redhat/${artData?.name}`} />
                  </b>{' '}
                  has been created successfully.
                </Typography>
              </Grid>
              <Grid item>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleClose()}
                >
                  Close
                </Button>
              </Grid>
            </Grid>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
