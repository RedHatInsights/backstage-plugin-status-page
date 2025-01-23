interface Incident {
  id: string;
  name: string;
  status: string;
  impactOverride: string;
  createdAt: string;
  updatedAt: string;
  incidentUpdates: { status: string; body: string }[];
}

interface CreateIncidentProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (incidentData: any) => void;
}

interface IncidentsTableProps {
  incidents: Incident[];
  onViewUpdates: (updates: any[]) => void;
  onUpdate: (incidentId: string) => void;
  onDelete: (incidentId: string) => void;
}

interface UpdateIncidentProps {
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
  updates: { status: string; body: string }[];
}
