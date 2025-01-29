interface Incident {
  id: string;
  name: string;
  status: string;
  impactOverride: string;
  createdAt: string;
  updatedAt: string;
  components: any[];
  incidentUpdates: { status: string; body: string }[];
}

interface CreateIncidentProps {
  component: any;
  open: boolean;
  onClose: () => void;
  onSubmit: (incidentData: any) => void;
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
