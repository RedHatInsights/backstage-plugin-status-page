import { PostmortemBody, StatusPageIncident, UpdateIncidentProps } from '../constants';

export interface IncidentService {
  getIncidents(): Promise<any>;
  getIncidentsById(id: string): Promise<any>;
  getComponents(): Promise<any>;
  createIncident(IncidentData: StatusPageIncident): Promise<any>;
  updateIncident(id: string, IncidentData: UpdateIncidentProps): Promise<any>;
  deleteIncident(id: string): Promise<any>;
}

export interface PostmortemService {
  draftPostmortem(id: string, draft: PostmortemBody ): Promise<any>;
  publishPostmortem(id: string, draft: PostmortemBody ): Promise<any>;
}
