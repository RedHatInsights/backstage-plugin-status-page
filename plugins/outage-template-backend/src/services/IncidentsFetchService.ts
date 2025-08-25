import { LoggerService } from '@backstage/backend-plugin-api';
import { IncidentServiceType } from './types';
import {
  createIncident,
  deleteIncident,
  fetchComponents,
  fetchIncident,
  fetchIncidents,
  updateIncident,
} from '../api';

import { StatusPageIncident } from '../constants';

export async function IncidentFetchService({
  logger,
  statusPageUrl,
  statusPageAuthToken,
}: {
  logger: LoggerService;
  statusPageUrl: string;
  statusPageAuthToken: string;
}): Promise<IncidentServiceType> {
  logger.info('Initializing IncidentFetchService');
  return {
    async getIncidents(cookie: any) {
      return fetchIncidents(statusPageUrl, statusPageAuthToken, logger, cookie);
    },
    async getIncidentsById(id: string, cookie: any) {
      return fetchIncident(
        id,
        statusPageUrl,
        statusPageAuthToken,
        logger,
        cookie,
      );
    },
    async getComponents(cookie: any) {
      const [componentsPage1, componentsPage2] = await Promise.all([
        fetchComponents(statusPageUrl, statusPageAuthToken, logger, 1, cookie),
        fetchComponents(statusPageUrl, statusPageAuthToken, logger, 2, cookie),
      ]);
      return [...componentsPage1, ...componentsPage2];
    },
    async createIncident(incidentData: StatusPageIncident, cookie: any) {
      return createIncident(
        incidentData,
        statusPageUrl,
        statusPageAuthToken,
        logger,
        cookie,
      );
    },
    async updateIncident(
      id: string,
      incidentData: StatusPageIncident,
      cookie: any,
    ) {
      return updateIncident(
        id,
        incidentData,
        statusPageUrl,
        statusPageAuthToken,
        logger,
        cookie,
      );
    },
    async deleteIncident(id: string, cookie: any) {
      return deleteIncident(
        id,
        statusPageUrl,
        statusPageAuthToken,
        logger,
        cookie,
      );
    },
  };
}
