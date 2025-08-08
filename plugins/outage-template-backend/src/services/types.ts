import { PostmortemBody, StatusPageIncident, TemplateBody, UpdateIncidentProps } from '../constants';
import { IncidentsStore } from '../database/IncidentsDatabase';

export interface IncidentServiceType {
  getIncidents(cookie: any): Promise<any>;
  getIncidentsById(id: string, cookie: any): Promise<any>;
  getComponents(cookie: any): Promise<any>;
  createIncident(IncidentData: StatusPageIncident, cookie: any): Promise<any>;
  updateIncident(id: string, IncidentData: UpdateIncidentProps, cookie: any): Promise<any>;
  deleteIncident(id: string, cookie: any): Promise<any>;
}

export interface PostmortemServiceType {
  draftPostmortem(id: string, draft: PostmortemBody, cookie: any): Promise<any>;
  publishPostmortem(id: string, draft: PostmortemBody, cookie: any): Promise<any>;
}

export interface TemplateServiceType {
  createTemplate(templateBody: TemplateBody, database: IncidentsStore): Promise<any>;
  getTemplates(database: IncidentsStore): Promise<any>;
  updateTemplate(templateBody: TemplateBody, database: IncidentsStore): Promise<any>;
  deleteTemplate(templateId: string, database: IncidentsStore): Promise<any>;
}