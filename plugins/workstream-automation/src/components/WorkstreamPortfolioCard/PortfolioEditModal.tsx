import { stringifyEntityRef, Entity } from '@backstage/catalog-model';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  EntityDisplayName,
  EntityRefLink,
  useEntity,
} from '@backstage/plugin-catalog-react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React, { useEffect, useState } from 'react';
import { useDebounce } from 'react-use';
import { workstreamApiRef } from '../../api';
import { ErrorPanel, Table, TableColumn } from '@backstage/core-components';

type EditDialogProps = {
  open: boolean;
  setEditModalOpen: Function;
  entitiesNotFound: string[];
  portfoliosData: Entity[];
};

export const PortfolioEditModal = (props: EditDialogProps) => {
  const { open, setEditModalOpen, entitiesNotFound, portfoliosData } = props;
  const [allSystems, setAllSystems] = useState<Entity[]>([]);
  const [searchText, setSearchText] = useState<string>();
  const [selectedSystems, setSelectedSystems] =
    useState<Entity[]>(portfoliosData);
  const { entity } = useEntity();
  const [loading, setLoading] = useState(false);
  const catalogApi = useApi(catalogApiRef);
  const alertApi = useApi(alertApiRef);
  const workstreamApi = useApi(workstreamApiRef);

  const columns: TableColumn<Entity>[] = [
    {
      title: 'Name',
      field: 'metadata.name',
      cellStyle: { lineHeight: '1.6rem' },
      render: data => <EntityRefLink entityRef={data} />,
      width: '80%',
    },
    {
      sorting: false,
      title: 'Appcode',
      align: 'center',
      field: 'metadata.annotations.servicenow.com/appcode',
      render: data =>
        data.metadata?.annotations?.['servicenow.com/appcode'] ?? '-',
    },
  ];

  useEffect(() => {
    catalogApi
      .queryEntities({ filter: [{ kind: ['System', 'Component'] }], limit: 20 })
      .then(res => {
        setAllSystems(res.items as Entity[]);
      });
  }, [catalogApi]);

  useDebounce(
    () => {
      if (searchText) {
        catalogApi
          .queryEntities({
            limit: 20,
            filter: { kind: ['System', 'Component'] },
            fullTextFilter: {
              term: searchText,
              fields: ['metadata.name', 'metadata.title'],
            },
          })
          .then(res => setAllSystems(res.items as Entity[]));
      }
    },
    400,
    [searchText],
  );

  function handleSubmit() {
    setLoading(true);
    workstreamApi
      .updateWorkstream(entity.metadata.name, {
        name: entity.metadata.name,
        portfolio: selectedSystems.map(system => stringifyEntityRef(system)),
      })
      .then(res => {
        alertApi.post({ message: res.message, display: 'transient' });
      });
    handleClose();
  }

  function handleClose() {
    setLoading(false);
    setSelectedSystems([]);
    setAllSystems([]);
    setEditModalOpen(false);
  }

  return (
    <Dialog
      open={open}
      onClose={(_e, reason) => {
        if (reason !== 'backdropClick') handleClose();
      }}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Edit Portfolio</DialogTitle>
      <DialogContent
        dividers
        style={{ minHeight: '30rem', maxHeight: '50rem' }}
      >
        <Grid container>
          <Grid item xs={12}>
            <Autocomplete
              fullWidth
              multiple
              disableCloseOnSelect
              groupBy={option => option.kind}
              getOptionSelected={(option, val) =>
                option.metadata.uid === val.metadata.uid
              }
              onInputChange={(_, val) => {
                if (val.length > 2) setSearchText(val);
              }}
              value={selectedSystems}
              options={allSystems}
              getOptionLabel={option => stringifyEntityRef(option)}
              onChange={(_evt, val) => {
                setSelectedSystems(val);
              }}
              disableClearable
              renderOption={(option, { selected }) => {
                return (
                  <Box display="flex" alignItems="center">
                    <Checkbox checked={selected} />
                    <EntityDisplayName entityRef={option} />
                  </Box>
                );
              }}
              renderTags={() => null}
              renderInput={params => (
                <TextField
                  {...params}
                  placeholder="Type to search"
                  label="Select Portfolio"
                  variant="outlined"
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Table
              data={selectedSystems}
              columns={columns}
              title="Selected Portfolios"
              emptyContent={
                <Typography
                  align="center"
                  style={{
                    height: '3rem',
                    alignContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  This workstream does not contain any portfolio.
                </Typography>
              }
              options={{
                padding: 'dense',
                search: false,
                draggable: false,
                pageSize: portfoliosData.length > 5 ? 10 : 5,
                pageSizeOptions: [5, 10, 25],
              }}
            />
          </Grid>
          {entitiesNotFound.length > 0 && (
            <Grid item xs={12}>
              <ErrorPanel
                error={{
                  name: 'Missing portfolio',
                  message: `Following entites are not found in catalog,\nand will be removed from workstream when you next hit the update button`,
                  stack: ` - ${entitiesNotFound.join('\n - ')}`,
                }}
                title="Following entites are not found in catalog"
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions style={{ marginRight: '8px' }}>
        <Button
          variant="contained"
          color="primary"
          disabled={loading}
          onClick={() => handleSubmit()}
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
