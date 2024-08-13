import { stringifyEntityRef, SystemEntity } from '@backstage/catalog-model';
import { alertApiRef, useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  EntityDisplayName,
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
  List,
  ListItem,
  TextField,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React, { useEffect, useState } from 'react';
import { workstreamApiRef } from '../../api';

type EditDialogProps = {
  portfolio: string[];
  open: boolean;
  setEditModalOpen: Function;
};

export const PortfolioEditModal = (props: EditDialogProps) => {
  const { portfolio, open, setEditModalOpen } = props;
  const [allSystems, setAllSystems] = useState<SystemEntity[]>([]);
  const [selectedSystems, setSelectedSystems] = useState<SystemEntity[]>([]);
  const { entity } = useEntity();
  const [loading, setLoading] = useState(false);
  const catalogApi = useApi(catalogApiRef);
  const alertApi = useApi(alertApiRef);
  const workstreamApi = useApi(workstreamApiRef);

  useEffect(() => {
    catalogApi.queryEntities({ filter: [{ kind: 'System' }] }).then(res => {
      setAllSystems(res.items as SystemEntity[]);
    });
    catalogApi.getEntitiesByRefs({ entityRefs: portfolio }).then(res => {
      if (res.items) setSelectedSystems(res.items as SystemEntity[]);
    });
  }, [catalogApi, portfolio]);

  function handleSubmit() {
    setLoading(true);
    workstreamApi
      .updateWorkstream({
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
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Edit Portfolio</DialogTitle>
      <DialogContent
        dividers
        style={{ minHeight: '30rem', maxHeight: '40rem' }}
      >
        <Grid container>
          <Grid item xs={12}>
            <Autocomplete
              fullWidth
              multiple
              disableCloseOnSelect
              getOptionSelected={(option, val) =>
                option.metadata.uid === val.metadata.uid
              }
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
                    <EntityDisplayName
                      entityRef={option}
                      defaultKind="System"
                    />
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
            Add or Remove
            <List>
              {selectedSystems.map(system => (
                <ListItem key={system.metadata.uid} divider>
                  <EntityDisplayName entityRef={system} defaultKind="system" />
                </ListItem>
              ))}
            </List>
          </Grid>
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
