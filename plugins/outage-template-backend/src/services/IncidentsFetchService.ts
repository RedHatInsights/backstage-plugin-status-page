import { LoggerService } from '@backstage/backend-plugin-api';
import { IncidentService } from './types';
import {
  createIncident,
  deleteIncident,
  fetchComponents,
  fetchIncident,
  fetchIncidents,
  updateIncident,
} from '../api';

import { StatusPageIncident, UpdateIncidentProps } from '../constants';

export async function IncidentFetchService({
  logger,
  statusPageUrl,
  statusPageAuthToken,
}: {
  logger: LoggerService;
  statusPageUrl: string;
  statusPageAuthToken: string;
}): Promise<IncidentService> {
  logger.info('Initializing IncidentFetchService');
  return {
    async getIncidents() {
      return fetchIncidents(statusPageUrl, statusPageAuthToken, logger);
    },
    async getIncidentsById(id: string) {
      return fetchIncident(id, statusPageUrl, statusPageAuthToken, logger);
    },
    async getComponents() {
      return fetchComponents(statusPageUrl, statusPageAuthToken, logger);
    },
    async createIncident(incidentData: StatusPageIncident) {
      return createIncident(
        incidentData,
        statusPageUrl,
        statusPageAuthToken,
        logger,
      );
    },
    async updateIncident(id: string, incidentData: UpdateIncidentProps) {
      return updateIncident(
        id,
        incidentData,
        statusPageUrl,
        statusPageAuthToken,
        logger,
      );
    },
    async deleteIncident(id: string) {
      return deleteIncident(id, statusPageUrl, statusPageAuthToken, logger);
    },
  };
}
