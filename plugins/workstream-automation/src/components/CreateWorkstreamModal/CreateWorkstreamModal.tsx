import { stringifyEntityRef, SystemEntity } from '@backstage/catalog-model';
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
import { Autocomplete, TabContext, TabList } from '@material-ui/lab';
import TabPanel from '@material-ui/lab/TabPanel';
import { kebabCase } from 'lodash';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import { workstreamApiRef } from '../../api';
import {
  CustomUserEntity,
  Member,
  TableRowDataType,
  Workstream,
} from '../../types';

import { MemberDetailsForm } from './Forms/MemberDetailsForm';
import { WorkstreamDetailsForm } from './Forms/WorkstreamDetailsForm';
import { Form1, Form2 } from './Inputs/types';

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
  form1: UseFormReturn<Form1>;
  form2: UseFormReturn<Form2>;
}) => {
  const { form1, form2 } = props;
  const workstreamDetails = form1.getValues();
  const { selectedMembers } = form2.getValues();
  const columns: TableColumn<TableRowDataType>[] = [
    {
      id: 'name',
      title: 'Name',
      field: 'user.spec.profile.displayName',
      render: data => (
        <EntityDisplayName entityRef={data.user} hideIcon disableTooltip />
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
        <Typography variant="body1">Workstream Details</Typography>
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="Workstream Name"
          value={workstreamDetails.workstreamName}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="Description"
          value={workstreamDetails.description}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="Lead Name"
          value={
            workstreamDetails.lead
              ? getHumanReadableValue(workstreamDetails.lead)
              : '-'
          }
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="Pillar"
          value={workstreamDetails.pillar}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="JIRA Project"
          value={`${workstreamDetails.jiraProject?.name} (${workstreamDetails.jiraProject?.key})`}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="Email"
          value={workstreamDetails.email}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          variant="outlined"
          fullWidth
          label="Slack Link"
          value={workstreamDetails.slackChannelUrl}
          InputProps={{ readOnly: true }}
        />
      </Grid>
      <Grid item xs={12}>
        <Autocomplete
          freeSolo
          disableClearable
          multiple
          fullWidth
          options={[] as SystemEntity[]}
          value={workstreamDetails.portfolio}
          getOptionLabel={option => stringifyEntityRef(option)}
          renderTags={(value, renderProps) =>
            value.map((option, index) => (
              <Chip
                label={stringifyEntityRef(option)}
                {...renderProps({ index })}
                deleteIcon={<></>}
              />
            ))
          }
          renderInput={params => (
            <TextField {...params} variant="outlined" label="Portfolio" />
          )}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body1">Member Details</Typography>
      </Grid>

      <Grid item xs={12}>
        <Table
          columns={columns}
          data={[
            ...(workstreamDetails.lead
              ? [
                  {
                    role: 'Workstream Lead',
                    user: workstreamDetails.lead,
                  },
                ]
              : []),
            ...selectedMembers.filter(v => v.tableData?.checked),
          ]}
          options={{
            toolbar: false,
            padding: 'dense',
          }}
        />
      </Grid>
    </Grid>
  );
};

export const CreateWorkstreamModal = () => {
  const classes = useStyles();
  const workstreamApi = useApi(workstreamApiRef);
  const [value, setValue] = React.useState<string>('1');

  const form1 = useForm<Form1>({
    values: {
      workstreamName: undefined,
      description: undefined,
      lead: undefined,
      pillar: undefined,
      jiraProject: undefined,
      email: undefined,
      slackChannelUrl: undefined,
      portfolio: [],
    },
    mode: 'all',
  });

  const form2 = useForm<Form2>({
    values: {
      kind: { label: 'Rover User', value: 'user' },
      searchQuery: null,
      selectedMembers: [],
    },
    mode: 'all',
  });

  const handleChange = (val: string) => {
    if (form1.formState.isValid) {
      setValue(val);
    }
  };
  const [workstreamData, setWorkstreamData] = useState<Workstream>();
  const [loading, setLoading] = useState<boolean>(false);

  const workstreamDetails = form1.getValues();
  const { selectedMembers } = form2.getValues();

  function handleCreate(_e: React.MouseEvent<HTMLButtonElement>) {
    if (workstreamDetails.workstreamName) {
      setLoading(true);
      setWorkstreamData({
        name: kebabCase(workstreamDetails.workstreamName),
        title: workstreamDetails.workstreamName,
        members: selectedMembers
          .filter(p => p.tableData?.checked)
          .map<Member>(val => ({
            userRef: stringifyEntityRef(val.user),
            role: val.role ?? '-',
          })),
        description: workstreamDetails.description,
        jiraProject: workstreamDetails.jiraProject?.key,
        lead: workstreamDetails.lead
          ? stringifyEntityRef(workstreamDetails.lead)
          : undefined,
        pillar: workstreamDetails.pillar,
        portfolio: workstreamDetails.portfolio.map<string>(val =>
          stringifyEntityRef(val),
        ),
        links: [
          ...(workstreamDetails.slackChannelUrl
            ? [
                {
                  url: workstreamDetails.slackChannelUrl,
                  title: 'Slack',
                  type: 'Contact',
                  icon: 'slack_contact',
                },
              ]
            : []),
          ...(workstreamDetails.email
            ? [
                {
                  url: workstreamDetails.email,
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
  const [openFinalModal, setOpenFinalModal] = useState(false);

  useEffect(() => {
    if (loading && workstreamData) {
      workstreamApi
        .createNewWorkstream(workstreamData)
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
  }, [workstreamApi, workstreamData, form2, form1, loading]);

  const tabsMap = [
    {
      index: '1',
      label: 'Workstream details',
      children: (
        <FormProvider {...form1}>
          <WorkstreamDetailsForm />
        </FormProvider>
      ),
    },
    {
      index: '2',
      label: 'Member details',
      children: (
        <ErrorBoundary slackChannel={{ name: 'one-platform' }}>
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
    setWorkstreamData(undefined);
    setOpenFinalModal(false);
    setOpen(false);
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
  if (kind?.value !== 'workstream') {
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
        Create Workstream
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
          <DialogTitle>Create a workstream</DialogTitle>
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
                  Your workstream{' '}
                  <b>
                    <EntityRefLink
                      entityRef={`workstream:redhat/${workstreamData?.name}`}
                    />
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
