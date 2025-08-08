import { Content, Page } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Button, Grid, InputAdornment, TextField } from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import LinearProgress from '@mui/material/LinearProgress';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { outageApiRef } from '../api';
import DeleteIncident from './DeleteIncident';
import { StatusPageHeader } from './Header';
import IncidentsTable from './IncidentsTable';
import IncidentUpdatesDrawer from './IncidentUpdatesDrawer';
import TemplateFormModal from './TemplateForm';

export const OutageComponent = () => {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTermForTemplates, setSearchTermForTemplates] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedIncidentUpdates, setSelectedIncidentUpdates] =
    useState<IncidentDrawerData>({
      updates: [],
      component: [],
    });
  const [deletingIncident, setDeletingIncident] = useState<any | null>(null);
  const outageApi = useApi(outageApiRef);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);
  const [refreshTemplates, setRefreshTemplates] = useState(false);
  const [templateFormType, setTemplateFormType] = useState<string>('create');
  const [templateToEdit, setTemplateToEdit] = useState<any | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const fetchedIncidents = await outageApi.fetchIncidents();
        setIncidents(fetchedIncidents);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching incidents:', error);
      } finally {
        setLoading(false);
      }
    };
    loadIncidents();
  }, [outageApi]);

  const handleUpdateIncident = (incidentId: string) => {
    navigate(`/status-page/incident/${incidentId}`);
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
      <StatusPageHeader
        title="Status Page"
        subtitle="Incident & Maintenance Tracking"
      />
      <Content>
        <Grid container spacing={3} direction="column">
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/status-page/create-incident')}
              style={{ marginBottom: '20px' }}
            >
              Create Status Update
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setTemplateFormType('create');
                setTemplateFormOpen(true);
              }}
              style={{ marginBottom: '20px', marginLeft: '10px' }}
            >
              Create Template
            </Button>
          </Grid>

          <Grid item>
            <TextField
              label={tabIndex === 2 ? "Search Templates" : "Search Incidents & Maintenance"}
              variant="outlined"
              value={tabIndex === 2 ? searchTermForTemplates : searchTerm}
              onChange={e => {
                if (tabIndex === 2) {
                  setSearchTermForTemplates(e.target.value);
                } else {
                  setSearchTerm(e.target.value);
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                shrink: Boolean(searchTerm) || isFocused,
                style: { paddingLeft: '30px' },
              }}
            />
          </Grid>

          {loading ? (
            <LinearProgress
              sx={{ width: '110vw', marginLeft: '-5vw', height: 4 }}
            />
          ) : (
            <Grid item>
              <IncidentsTable
                incidents={filteredIncidents}
                onViewUpdates={updates => {
                  setSelectedIncidentUpdates(updates);
                  setDrawerOpen(true);
                }}
                onUpdate={handleUpdateIncident}
                onDelete={incidentId => setDeletingIncident(incidentId)}
                refreshTemplates={refreshTemplates}
                onEditTemplate={template => {
                  setTemplateToEdit(template);
                  setTemplateFormType('edit');
                  setTemplateFormOpen(true);
                }}
                onSetTabIndex={(index) => setTabIndex(index)}
                searchTermForTemplates={searchTermForTemplates}
              />
            </Grid>
          )}
        </Grid>

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
        {templateFormOpen && (
          <TemplateFormModal
            open={templateFormOpen}
            onClose={() => {
              setTemplateFormOpen(false);
              setTemplateToEdit(null);
              setRefreshTemplates(false);
            }}
            onCreateTemplate={() => setRefreshTemplates(true)}
            type={templateFormType}
            templateToEdit={templateToEdit}
          />
        )}
      </Content>
    </Page>
  );
};
