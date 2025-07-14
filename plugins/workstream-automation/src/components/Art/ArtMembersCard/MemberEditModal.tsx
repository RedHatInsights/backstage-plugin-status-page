import { ArtEntity } from '@compass/backstage-plugin-workstream-automation-common';
import {
  GroupEntity,
  RELATION_HAS_MEMBER,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { Table, TableColumn } from '@backstage/core-components';
import { alertApiRef, configApiRef, useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  humanizeEntityRef,
  useEntity,
} from '@backstage/plugin-catalog-react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  Grid,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
} from '@material-ui/core';
import RemoveCircleOutlineOutlinedIcon from '@material-ui/icons/RemoveCircleOutlineOutlined';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useDebounce } from 'react-use';
import { artApiRef } from '../../../api';
import { CustomUserEntity, Member, TableRowDataType } from '../../../types';
import { MemberWarningChip } from '../../MemberWarningChip/MemberWarningChip';
import { artRolesMap } from '../../../utlis/roleMapper';

interface EditDialogProps {
  columns: TableColumn<TableRowDataType>[];
  tableData: TableRowDataType[];
  setEditModal: Function;
  rteEntity?: CustomUserEntity;
}

export const MembersEditModal = (props: EditDialogProps) => {
  const { entity: currentEntity } = useEntity<ArtEntity>();
  const rteRef = currentEntity.spec.rte;
  const { setEditModal: setEditModalOpen, rteEntity } = props;
  const [tableData, setTableData] = useState(props.tableData);
  const selectOptions = [
    {
      label: 'Rover User',
      value: 'User',
    },
    {
      label: 'Rover Group',
      value: 'Group',
    },
  ];
  const {
    control,
    resetField,
    getValues,
    reset,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
  } = useForm<{
    kind: { label: string; value: string };
    searchQuery: GroupEntity | CustomUserEntity | null;
    members: Member[];
  }>({
    values: {
      kind: selectOptions[0],
      searchQuery: null,
      members: [],
    },
  });
  const configApi = useApi(configApiRef);
  const customRoles = configApi.getOptional<{
    [key: string]: string;
  }>('workstream.artRoles');

  const roleOptions = [
    'Release Train Engineer (RTE)',
    ...Object.values({ ...artRolesMap, ...customRoles }),
  ];

  function handleRoleChange(
    evt: React.ChangeEvent<{ name?: string; value: unknown }>,
    data: TableRowDataType,
  ) {
    setTableData(t =>
      t.map(u =>
        u.user.metadata.uid === data.user.metadata.uid
          ? { ...u, role: evt.target.value as string }
          : u,
      ),
    );
  }

  const [roleFieldError, setRoleFieldError] = useState<
    {
      rowId?: string;
      error: boolean;
    }[]
  >([]);

  const columns: TableColumn<TableRowDataType>[] = [
    props.columns[0],
    {
      title: 'Email',
      field: 'user.spec.profile.email',
      render: data => data.user.spec.profile?.email,
    },
    {
      title: 'Role',
      field: 'role',
      render: data => {
        return (
          <>
            <Select
              variant="standard"
              style={{ padding: '0' }}
              placeholder="Select a role"
              fullWidth
              value={data.role}
              error={
                roleFieldError.find(
                  r => r.rowId === stringifyEntityRef(data.user),
                )?.error
              }
              disabled={data.role === 'Release Train Engineer (RTE)'}
              onChange={evt => handleRoleChange(evt, data)}
            >
              {roleOptions.map(option => (
                <MenuItem
                  disabled={option === 'Release Train Engineer (RTE)'}
                  key={option}
                  value={option}
                >
                  {option}
                </MenuItem>
              ))}
            </Select>
            {roleFieldError.find(r => r.rowId === stringifyEntityRef(data.user))
              ?.error && (
              <FormHelperText
                error={
                  roleFieldError.find(
                    r => r.rowId === stringifyEntityRef(data.user),
                  )?.error
                }
              >
                Please select an option
              </FormHelperText>
            )}
          </>
        );
      },
    },
    props.columns[2],
    {
      align: 'right',
      width: '5%',
      render: data => (
        <Box display="flex" alignItems="center">
          <Tooltip
            title={
              data.role === 'Release Train Engineer (RTE)'
                ? 'You can remove RTE from about card'
                : 'Remove member'
            }
          >
            <IconButton
              size="small"
              color="secondary"
              onClick={() => {
                setTableData(t =>
                  t.filter(v => v.user.metadata.uid !== data.user.metadata.uid),
                );
              }}
            >
              <RemoveCircleOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <MemberWarningChip user={data.user} />
        </Box>
      ),
    },
  ];
  const catalogApi = useApi(catalogApiRef);
  const artApi = useApi(artApiRef);
  const alertApi = useApi(alertApiRef);

  const [options, setOptions] = useState<(GroupEntity | CustomUserEntity)[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState<string>('');
  function handleInputChange(val: string) {
    if (val.length === 1) clearErrors('searchQuery');
    if (val.length > 2) {
      setLoading(true);
      setSearchTerm(val);
    }
  }

  const [fetchLoading, setFetchLoading] = useState(false);

  useDebounce(
    async () => {
      if (loading) {
        if (searchTerm.length > 2 && getValues('kind')) {
          const res = await catalogApi.queryEntities({
            filter: [{ kind: getValues('kind').value }],
            fullTextFilter: {
              term: searchTerm,
              fields: [
                'spec.profile.displayName', // This field filter does not work
                'metadata.name',
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
    [catalogApi, searchTerm, loading],
  );

  useEffect(() => {
    setValue(
      'members',
      tableData.map(fData => ({
        userRef: stringifyEntityRef(fData.user),
        role: fData.role ?? '-',
      })),
    );
  }, [tableData, setValue]);

  const [selectedEntity, setSelectedEntity] = useState<
    CustomUserEntity | GroupEntity
  >();

  function handleInputSelectedEntity(
    val: CustomUserEntity | GroupEntity | null,
  ) {
    if (val) setSelectedEntity(val);
  }

  useEffect(() => {
    function setTableDataFn(entity: CustomUserEntity) {
      if (stringifyEntityRef(entity) === rteRef) {
        setError('searchQuery', {
          message: 'User is already added to workstream',
          type: 'validate',
        });
        return;
      }
      setTableData(t => {
        if (t.some(p => p.user.metadata.uid === entity.metadata.uid)) {
          setError('searchQuery', {
            message: 'User is already added to workstream',
            type: 'validate',
          });
          return t;
        }
        return t.concat({ user: entity, role: '-' });
      });
    }
    if (selectedEntity) {
      const entity = selectedEntity;
      if (entity.kind === 'Group') {
        const relations = entity.relations;
        if (!relations) return;
        for (const relation of relations) {
          if (relation.type === RELATION_HAS_MEMBER) {
            catalogApi.getEntityByRef(relation.targetRef).then(res => {
              if (res) setTableDataFn(res as CustomUserEntity);
            });
          }
        }
      } else {
        setTableDataFn(entity);
      }
      setValue('searchQuery', null);
      setOptions([]);
    }
  }, [selectedEntity, catalogApi, rteRef, setValue, setError]);

  const getOptionLabel = (option: GroupEntity | CustomUserEntity) =>
    option.spec.profile
      ? `${option.spec.profile.displayName} (${option.spec.profile.email})`
      : humanizeEntityRef(option, {
          defaultKind: 'user',
          defaultNamespace: false,
        });

  return (
    <Dialog
      open
      fullWidth
      maxWidth="md"
      onClose={(_e, reason) => {
        if (reason !== 'backdropClick') {
          reset();
          setEditModalOpen(false);
        }
      }}
    >
      <DialogTitle>Edit members</DialogTitle>
      <DialogContent dividers>
        <Grid container alignItems="center">
          <Grid item lg={4} md={4} xs={2}>
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
                      setOptions([]);
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
          <Grid item lg={8} md={8} xs={10}>
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
                    getOptionLabel={option => getOptionLabel(option)}
                    getOptionSelected={(op, sel) =>
                      op.metadata.uid === sel.metadata.uid
                    }
                    loading={loading}
                    onInputChange={(_, val) => {
                      if (
                        (value && getOptionLabel(value) === val) ||
                        options.some(p => getOptionLabel(p) === val)
                      )
                        return;
                      handleInputChange(val);
                    }}
                    onChange={(_evt, val) => {
                      handleInputSelectedEntity(val);
                      onChange(val);
                    }}
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
                ...(rteEntity
                  ? [
                      {
                        user: rteEntity,
                        role: 'Release Train Engineer (RTE)',
                      },
                    ]
                  : []),
                ...tableData,
              ]}
              columns={columns}
              options={{
                pageSize: 20,
                pageSizeOptions: [10, 20, 30],
                padding: 'dense',
                toolbar: true,
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions style={{ marginRight: '8px' }}>
        <Button
          variant="contained"
          color="primary"
          disabled={fetchLoading}
          onClick={handleSubmit(formData => {
            if (formData.members.find(m => m.role === '-')) {
              const e = formData.members.filter(m => m.role === '-');
              setRoleFieldError(
                e.map(r => ({ rowId: r.userRef, error: true })),
              );
              return;
            }
            setRoleFieldError([]);
            setFetchLoading(true);
            artApi
              .updateArt(currentEntity.metadata.name, {
                name: currentEntity.metadata.name,
                members: formData.members,
              })
              .then(res => {
                alertApi.post({ message: res.message, display: 'transient' });
                setFetchLoading(false);
                reset();
                setEditModalOpen(false);
              });
          })}
        >
          Update
        </Button>
        <Button
          color="primary"
          onClick={() => {
            reset();
            setOptions([]);
            setSelectedEntity(undefined);
            setEditModalOpen(false);
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
