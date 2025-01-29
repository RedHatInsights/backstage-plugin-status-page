import { Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Button, Grid, TextField } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { outageApiRef } from '../api';
import CreateIncident from './CreateIncident';
import DeleteIncident from './DeleteIncident';
import IncidentsTable from './IncidentsTable';
import IncidentUpdatesDrawer from './IncidentUpdatesDrawer';
import UpdateIncident from './UpdateIncident';

export const OutageComponent = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIncidentUpdates, setSelectedIncidentUpdates] =
    useState<IncidentDrawerData>({
      updates: [],
      component: [],
    });
  const [editingIncident, setEditingIncident] = useState<any | null>(null);
  const [deletingIncident, setDeletingIncident] = useState<any | null>(null);
  const outageApi = useApi(outageApiRef);
  const [components, setComponents] = useState<any | []>([]);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const fetchedIncidents = await outageApi.fetchIncidents();
        setIncidents(fetchedIncidents);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching incidents:', error);
      }
    };
    const loadComponents = async () => {
      try {
        const response = await outageApi.fetchComponents();
        await setComponents(response);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching incidents:', error);
      }
    };
    loadIncidents();
    loadComponents();
  }, [outageApi]);

  const handleCreateSubmit = async (incidentData: Incident) => {
    const updatedIncidents = await outageApi.createIncident(incidentData);
    setIncidents(updatedIncidents);
    setCreateModalOpen(false);
  };

  const handleUpdateIncident = (incidentId: string) => {
    const incident = incidents.find(inc => inc.id === incidentId);
    if (incident) {
      setEditingIncident(incident);
    }
  };

  const handleUpdateSubmit = async (
    incidentId: string,
    updatedData: UpdateIncidentProps,
  ) => {
    const updatedIncidents = await outageApi.updateIncident(
      incidentId,
      updatedData,
    );
    setIncidents(updatedIncidents);
  };

  const handleDeleteIncident = async (incidentId: string) => {
    const updatedIncidents = await outageApi.deleteIncident(incidentId);
    setIncidents(updatedIncidents);
    setDeletingIncident(null);
  };

  const filteredIncidents = incidents.filter(incident =>
    incident.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Page themeId="tool">
      <Header
        title="Outage Management"
        subtitle="Incident Tracking & Management"
      >
        <HeaderLabel label="Owner" value="Team X" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setCreateModalOpen(true)}
              style={{ marginBottom: '20px' }}
            >
              Create Incident
            </Button>
          </Grid>

          <Grid item>
            <TextField
              label="Search Incidents"
              variant="outlined"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              fullWidth
              style={{ marginBottom: '20px' }}
            />
          </Grid>

          <Grid item>
            <IncidentsTable
              incidents={filteredIncidents}
              onViewUpdates={updates => {
                setSelectedIncidentUpdates(updates);
                setDrawerOpen(true);
              }}
              onUpdate={handleUpdateIncident}
              onDelete={incidentId => setDeletingIncident(incidentId)}
            />
          </Grid>
        </Grid>
        <CreateIncident
          component={components}
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleCreateSubmit}
        />
        <UpdateIncident
          component={components}
          incidentId={editingIncident?.id || ''}
          incidentData={editingIncident || {}}
          open={!!editingIncident}
          onClose={() => setEditingIncident(null)}
          onUpdate={handleUpdateSubmit}
        />
        <DeleteIncident
          incidentId={deletingIncident}
          open={!!deletingIncident}
          onClose={() => setDeletingIncident(null)}
          onDelete={handleDeleteIncident}
        />
        <IncidentUpdatesDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          data={selectedIncidentUpdates}
        />
      </Content>
    </Page>
  );
};
