import { GroupEntity, RELATION_HAS_MEMBER } from '@backstage/catalog-model';
import { Table, TableColumn } from '@backstage/core-components';
import {
  CheckboxProps,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@material-ui/core';

import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  EntityDisplayName,
  humanizeEntityRef,
} from '@backstage/plugin-catalog-react';
import { Autocomplete } from '@material-ui/lab';
import React, { useEffect, useState } from 'react';
import { Controller, useFormContext, UseFormReturn } from 'react-hook-form';
import { useDebounce } from 'react-use';
import { CustomUserEntity, TableRowDataType } from '../../../types';

import { Form1 } from '../Inputs/types';

export const MemberDetailsForm = (props: { form1: UseFormReturn<Form1> }) => {
  const { form1 } = props;
  const { lead } = form1.getValues();
  const catalogApi = useApi(catalogApiRef);
  const { getFieldState, getValues, control, resetField, setValue } =
    useFormContext<{
      searchQuery: GroupEntity | CustomUserEntity;
      kind: { label: string; value: string };
      selectedMembers: TableRowDataType[];
    }>();
  const [tableData, setTableData] = useState<TableRowDataType[]>(
    getValues('selectedMembers'),
  );
  const [options, setOptions] = useState<(GroupEntity | CustomUserEntity)[]>(
    [],
  );
  const [searchText, setSearchText] = useState('');
  const [searchedEntity, setSearchedEntity] = useState<
    CustomUserEntity | GroupEntity
  >();

  const selectOptions = [
    { label: 'Rover User', value: 'user' },
    { label: 'Rover Group', value: 'group' },
  ];

  const roleOptions = [
    'Workstream Lead',
    'Technical Lead',
    'Software Engineer',
    'Quality Engineer',
  ];

  function handleRoleChange(
    evt: React.ChangeEvent<{ name?: string; value: unknown }>,
    data: TableRowDataType,
  ) {
    setValue('selectedMembers', []);
    setTableData(t =>
      t.map(u =>
        u.user.metadata.uid === data.user.metadata.uid
          ? { ...u, role: evt.target.value as string }
          : u,
      ),
    );
  }

  const columns: TableColumn<TableRowDataType>[] = [
    {
      id: 'name',
      title: 'Name',
      field: 'spec.profile.displayName',
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
      render: data => {
        return (
          <Select
            variant="standard"
            style={{ padding: '0' }}
            placeholder="Select a role"
            fullWidth
            value={data.role}
            disabled={data.role === 'Workstream Lead'}
            onChange={evt => handleRoleChange(evt, data)}
          >
            {roleOptions.map(option => (
              <MenuItem
                disabled={option === 'Workstream Lead'}
                key={option}
                value={option}
              >
                {option}
              </MenuItem>
            ))}
          </Select>
        );
      },
    },
    {
      id: 'manager',
      title: 'Manager',
      field: 'user.spec.manager',
      render: data =>
        data.user.spec.manager ? (
          <EntityDisplayName
            hideIcon
            defaultNamespace="redhat"
            entityRef={data.user.spec.manager}
          />
        ) : (
          '-'
        ),
    },
  ];
  const [loading, setLoading] = useState(false);

  function handleInputChange(_e: React.ChangeEvent<{}>, value: string) {
    if (value.trim().length > 2) {
      setLoading(true);
      setSearchText(value.trim());
    }
  }

  function handleInputSelectedEntity(entity: CustomUserEntity | GroupEntity) {
    setSearchedEntity(entity);
  }

  function setTableDataFn(
    entity: CustomUserEntity,
    workstreamLead?: CustomUserEntity,
  ) {
    setTableData(t => {
      if (
        t.find(
          v =>
            v.user.metadata.uid === entity.metadata.uid ||
            v.user.metadata.uid === workstreamLead?.metadata.uid,
        )
      )
        return t;
      return t.concat({ user: entity, role: undefined });
    });
  }

  useEffect(() => {
    if (searchedEntity) {
      const entity = searchedEntity;
      if (entity.kind === 'Group') {
        const relations = entity.relations;
        if (!relations) return;
        for (const relation of relations) {
          if (relation.type === RELATION_HAS_MEMBER) {
            catalogApi.getEntityByRef(relation.targetRef).then(res => {
              if (res) setTableDataFn(res as CustomUserEntity, lead);
            });
          }
        }
      } else {
        setTableDataFn(entity, lead);
      }
    }
  }, [searchedEntity, catalogApi, lead]);

  useDebounce(
    async () => {
      if (loading) {
        if (searchText.length > 2 && getValues('kind')) {
          const res = await catalogApi.queryEntities({
            filter: [{ kind: getValues('kind').value }],
            fullTextFilter: {
              term: searchText,
              fields: [
                'spec.profile.displayName', // This field filter does not work
                'metadata.name',
                'metadata.annotations.servicenow.com/appcode',
                'metadata.title',
              ],
            },
          });
          setOptions(res.items as GroupEntity[] | CustomUserEntity[]);
          setLoading(false);
        } else setOptions([]);
      }
    },
    400,
    [catalogApi, setOptions, searchText, loading],
  );

  const getOptionLabel = (option: GroupEntity | CustomUserEntity) =>
    option.spec.profile
      ? `${option.spec.profile.displayName} (${option.spec.profile.email})`
      : humanizeEntityRef(option, {
          defaultKind: 'user',
          defaultNamespace: false,
        });

  return (
    <Grid container style={{ width: '100%' }}>
      <Grid item xs={12}>
        <Typography variant="h3">Member Details</Typography>
      </Grid>
      <Grid item lg={4} md={6}>
        <Controller
          name="kind"
          control={control}
          rules={{
            required: 'Please select an option',
          }}
          render={({
            field: { value, onChange, onBlur },
            fieldState: { error },
          }) => {
            return (
              <Autocomplete
                options={selectOptions}
                getOptionSelected={(op, sel) => op.value === sel.value}
                getOptionLabel={option => option.label}
                onChange={(_e, val) => {
                  onChange(val);
                  resetField('searchQuery');
                }}
                disableClearable
                value={value ?? null}
                selectOnFocus={false}
                onBlur={onBlur}
                renderInput={params => {
                  return (
                    <TextField
                      {...params}
                      label="Select type"
                      variant="outlined"
                      error={!!error}
                      helperText={error ? error.message : null}
                    />
                  );
                }}
              />
            );
          }}
        />
      </Grid>
      <Grid item lg={7} md={6}>
        <Controller
          name="searchQuery"
          control={control}
          rules={{
            deps: ['kind'],
          }}
          render={({
            field: { value, onChange, onBlur },
            fieldState: { error },
          }) => {
            return (
              <Autocomplete
                options={options}
                getOptionLabel={o => getOptionLabel(o)}
                getOptionSelected={(op, sel) =>
                  op.metadata.uid === sel.metadata.uid
                }
                loading={loading}
                onInputChange={handleInputChange}
                onChange={(_e, val) => {
                  handleInputSelectedEntity(val);
                  onChange(val);
                }}
                disableClearable
                disabled={!getFieldState('kind').isDirty}
                value={value ?? null}
                onBlur={onBlur}
                renderInput={params => {
                  return (
                    <TextField
                      {...params}
                      color="primary"
                      label="Enter rover user/group name"
                      placeholder="Type here"
                      variant="outlined"
                      error={!!error}
                      helperText={error ? error.message : null}
                    />
                  );
                }}
              />
            );
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <Table
          data={[
            ...(lead
              ? [
                  {
                    role: 'Workstream Lead',
                    user: lead,
                    tableData: undefined,
                  },
                ]
              : []),
            ...tableData,
          ]}
          columns={columns}
          onSelectionChange={(data, _rowData) => {
            setValue(
              'selectedMembers',
              data.map(v => ({
                role: v.role,
                user: v.user,
              })),
            );
          }}
          options={{
            search: false,
            showTitle: false,
            toolbar: true,
            padding: 'dense',
            selection: true,
            showTextRowsSelected: true,
            headerSelectionProps: {
              disabled: false,
              size: 'small',
              style: { paddingTop: '0', paddingBottom: '0px' },
            },
            selectionProps: (data: TableRowDataType): CheckboxProps => {
              return {
                hidden: data.role === 'Workstream Lead',
                disabled:
                  !data.role ||
                  data.role === 'Workstream Lead' ||
                  !roleOptions.includes(data.role),
                color: 'primary',
                style: { marginLeft: '20px' },
                ...(data.role === 'Workstream Lead' && { checked: true }),
              };
            },
          }}
        />
      </Grid>
    </Grid>
  );
};
