export interface Incident {
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
  componentStatus: ComponentsStatusMap;
}

export interface StatusPageIncident {
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
  components?: ComponentsStatusMap;
}

export type ComponentsStatusMap = {
  [key: string]: string;
};

export interface CreateIncidentProps {
  component: any;
  open: boolean;
  onClose: () => void;
  onSubmit: (incidentData: StatusPageIncident) => void;
}

export interface IncidentsTableProps {
  incidents: Incident[];
  onViewUpdates: (data: IncidentDrawerData) => void;
  onUpdate: (incidentId: string) => void;
  onDelete: (incidentId: string) => void;
}

export interface UpdateIncidentProps {
  component: any;
  open: boolean;
  incidentId: string;
  incidentData: any;
  onClose: () => void;
  onUpdate: (incidentId: string, updatedData: any) => void;
}

export interface DeleteIncidentProps {
  incidentId: string;
  open: boolean;
  onClose: () => void;
  onDelete: (incidentId: string) => void;
}

export interface IncidentUpdatesDrawerProps {
  open: boolean;
  onClose: () => void;
  data: IncidentDrawerData;
}

export interface IncidentDrawerData {
  updates: Update[];
  component: Component[];
}
export interface Component {
  status: string;
  name: string;
}

export interface Update {
  body: string;
  status: string;
}

export interface PostmortemBodyDraft {
  body_draft: string;
}

export interface PostmortemBody {
  postmortem: PostmortemBodyDraft;
}
