interface Incident {
  id: string;
  name: string;
  status: string;
  impactOverride: string;
  createdAt: string;
  updatedAt: string;
  components: any[];
  incidentUpdates: { status: string; body: string }[];
  scheduledFor: string;
  scheduledUntil: string;
  scheduledAutoCompleted: boolean;
  startedAt: string;
  resolvedAt: string;
  componentStatus: ComponentStatusMap
}

interface StatusPageIncident {
  id?: string;
  name?: string;
  status?: string;
  impact_override?: string;
  created_at?: string;
  updated_at?: string;
  component_ids?: any[];
  body?: string;
  notify?: boolean;
  incident_updates?: { status?: string; body?: string }[];
  scheduled_for?: string;
  scheduled_until?: string;
  scheduled_auto_completed?: boolean;
  started_at?: string;
  resolved_at?: string;
  components?: ComponentStatusMap;
}

type ComponentStatusMap = {
  [key: string]: string; 
}; 

interface CreateIncidentProps {
  component: any;
  open: boolean;
  onClose: () => void;
  onSubmit: (incidentData: StatusPageIncident) => void;
}

interface IncidentsTableProps {
  incidents: Incident[];
  onViewUpdates: (data: IncidentDrawerData) => void;
  onUpdate: (incidentId: string) => void;
  onDelete: (incidentId: string) => void;
}

interface UpdateIncidentProps {
  component: any;
  open: boolean;
  incidentId: string;
  incidentData: any;
  onClose: () => void;
  onUpdate: (incidentId: string, updatedData: any) => void;
}

interface DeleteIncidentProps {
  incidentId: string;
  open: boolean;
  onClose: () => void;
  onDelete: (incidentId: string) => void;
}

interface IncidentUpdatesDrawerProps {
  open: boolean;
  onClose: () => void;
  data: IncidentDrawerData;
}

interface IncidentDrawerData {
  updates: Update[];
  component: Component[];
}
interface Component {
  status: string;
  name: string;
}

interface Update {
  body: string;
  status: string;
}
