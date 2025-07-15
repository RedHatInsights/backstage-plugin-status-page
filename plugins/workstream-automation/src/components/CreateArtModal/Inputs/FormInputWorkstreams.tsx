import {
  ArtEntity,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  EntityDisplayName,
} from '@backstage/plugin-catalog-react';
import { Box, Checkbox, TextField, Typography } from '@material-ui/core';
import {
  OverflowTooltip,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { Autocomplete } from '@material-ui/lab';
import { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useDebounce } from 'react-use';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';

export const FormInputWorkstreams = (props: { currentEntity?: ArtEntity }) => {
  const catalogApi = useApi(catalogApiRef);
  const [workstreamOptions, setWorkstreamOptions] = useState<
    WorkstreamEntity[]
  >([]);
  const [searchText, setSearchText] = useState<string>();

  const { control, getValues, setValue } = useFormContext<{
    workstreams: WorkstreamEntity[];
  }>();

  const columns: TableColumn<WorkstreamEntity>[] = [
    {
      field: 'metadata.name',
      title: 'Name',
      width: '25%',
      render: data => <EntityDisplayName disableTooltip entityRef={data} />,
    },
    {
      field: 'metadata.description',
      title: 'Description',
      width: '50%',
      render: data => (
        <OverflowTooltip
          text={data.metadata.description}
          placement="bottom-start"
          line={1}
        />
      ),
    },
    {
      title: 'Workstream Lead',
      field: 'spec.lead',
      tooltip: 'Workstream lead',
      render: data =>
        data.spec.lead ? parseEntityRef(data.spec.lead).name : '-',
    },
  ];

  useEffect(() => {
    catalogApi
      .queryEntities({ filter: [{ kind: ['Workstream'] }], limit: 10 })
      .then(res => setWorkstreamOptions(res.items as WorkstreamEntity[]));
  }, [catalogApi]);

  useDebounce(
    () => {
      if (searchText) {
        catalogApi
          .queryEntities({
            limit: 20,
            filter: [{ kind: ['Workstream'] }],
            fullTextFilter: {
              term: searchText,
              fields: ['metadata.name', 'metadata.title'],
            },
          })
          .then(res => setWorkstreamOptions(res.items as WorkstreamEntity[]));
      }
    },
    400,
    [searchText],
  );

  return (
    <Controller
      name="workstreams"
      control={control}
      render={({ field: { onBlur, onChange, value } }) => {
        return (
          <>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={workstreamOptions}
              limitTags={2}
              getOptionDisabled={option => {
                const artRef = option.relations?.find(
                  relation => parseEntityRef(relation.targetRef).kind === 'art',
                )?.targetRef;
                if (
                  props.currentEntity &&
                  artRef === stringifyEntityRef(props.currentEntity)
                )
                  return false;
                else if (artRef) return true;
                return false;
              }}
              getOptionSelected={(option, val) =>
                stringifyEntityRef(option) === stringifyEntityRef(val)
              }
              getOptionLabel={option => {
                return stringifyEntityRef(option);
              }}
              renderOption={(option, { selected }) => {
                const artRef = option.relations?.find(
                  relation => parseEntityRef(relation.targetRef).kind === 'art',
                )?.targetRef;
                return (
                  <>
                    <Checkbox checked={selected} />
                    <Box
                      display="flex"
                      width="100%"
                      justifyContent="space-between"
                    >
                      <EntityDisplayName entityRef={option} disableTooltip />
                      {artRef && (
                        <Typography
                          style={{ fontStyle: 'italic' }}
                          variant="subtitle1"
                        >
                          Part of: {artRef}
                        </Typography>
                      )}
                    </Box>
                  </>
                );
              }}
              onBlur={onBlur}
              onChange={(_, val) => onChange(val)}
              onInputChange={(_, val) => {
                if (val.length > 2) setSearchText(val);
              }}
              value={value}
              renderInput={params => (
                <TextField
                  {...params}
                  variant="outlined"
                  fullWidth
                  label="Add workstreams"
                  placeholder="Select from list"
                  helperText="Optional can be added later"
                />
              )}
            />
            <br />
            <Table
              columns={columns}
              style={{ padding: 0 }}
              data={getValues('workstreams')}
              title="Selected workstreams"
              actions={[
                {
                  icon: () => <RemoveCircleOutlineIcon color="primary" />,
                  tooltip: 'Remove workstream',
                  position: 'row',
                  onClick: (_, rowData) => {
                    const currWorkstreams = getValues('workstreams');
                    const updatedWorkstreams = currWorkstreams.filter(
                      workstream =>
                        workstream.metadata.workstreamId !==
                        (rowData as WorkstreamEntity).metadata.workstreamId,
                    );
                    setValue('workstreams', updatedWorkstreams);
                  },
                },
              ]}
              options={{
                actionsColumnIndex: -1,
                toolbar: true,
                search: false,
                draggable: false,
                padding: 'dense',
                pageSize: 5,
              }}
            />
          </>
        );
      }}
    />
  );
};
