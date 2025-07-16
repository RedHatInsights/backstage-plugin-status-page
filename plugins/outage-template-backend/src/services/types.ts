import { StatusPageIncident, UpdateIncidentProps } from '../constants';

export interface IncidentService {
  getIncidents(): Promise<any>;
  getIncidentsById(id: string): Promise<any>;
  getComponents(): Promise<any>;
  createIncident(IncidentData: StatusPageIncident): Promise<any>;
  updateIncident(id: string, IncidentData: UpdateIncidentProps): Promise<any>;
  deleteIncident(id: string): Promise<any>;
}
