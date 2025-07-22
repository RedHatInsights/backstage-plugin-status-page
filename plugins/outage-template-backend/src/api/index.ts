import { LoggerService } from '@backstage/backend-plugin-api';
import { StatusPageIncident, UpdateIncidentProps, PostmortemBody } from '../constants';

export const fetchIncidents = async (
  statusPageUrl: string,
  token: string,
  logger: LoggerService,
) => {
  try {
    const response = await fetch(`${statusPageUrl}/incidents.json`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json',
        Authorization: `${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch incidents: ${response.status} ${response.statusText}`,
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error(String(`Error fetching incidents:', ${error}`));
    return [];
  }
};

export const fetchIncident = async (
  id: string,
  statusPageUrl: string,
  token: string,
  logger: LoggerService,
) => {
  try {
    const response = await fetch(`${statusPageUrl}/incidents/${id}`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json',
        Authorization: `${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch incident: ${response.status} ${response.statusText}`,
      );
    }
    const result = await response.json();
    return result;
  } catch (error) {
    logger.error(String(`Error fetching incident:', ${error}`));
    throw new Error(`Failed to fetch incident`);
  }
};

export const fetchComponents = async (
  statusPageUrl: string,
  token: string,
  logger: LoggerService,
) => {
  try {
    const response = await fetch(`${statusPageUrl}/components`, {
      method: 'GET',
      headers: {
        'Content-type': 'application/json',
        Authorization: `${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch components: ${response.status} ${response.statusText}`,
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error(String(`Error fetching components:', ${error}`));
    return [];
  }
};

export const createIncident = async (
  incidentData: StatusPageIncident,
  statusPageUrl: string,
  token: string,
  logger: LoggerService,
) => {
  try {
    await fetch(`${statusPageUrl}/incidents`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        Authorization: `${token}`,
      },
      body: JSON.stringify({ incident: incidentData }),
    });
    return { incident: incidentData };
  } catch (error) {
    logger.error(String(`Error creating incident:', ${error}`));
    return { message: 'Error: failed to create incident' };
  }
};

export const updateIncident = async (
  incidentId: string,
  updatedData: UpdateIncidentProps,
  statusPageUrl: string,
  token: string,
  logger: LoggerService,
) => {
  try {
    const response = await fetch(`${statusPageUrl}/incidents/${incidentId}`, {
      method: 'PATCH',
      headers: {
        'Content-type': 'application/json',
        Authorization: `${token}`,
      },
      body: JSON.stringify({ incident: updatedData }),
    });
    if (response.status === 422) {
      return { success: true };
    }
    if (!response.ok) {
      throw new Error(
        `Failed to update incident: ${response.status} ${response.statusText}`,
      );
    }
    return { success: true };
  } catch (error) {
    logger.error(String(`Error updating incident:', ${error}`));
    return { message: 'Error: failed to update incident' };
  }
};

export const deleteIncident = async (
  incidentId: string,
  statusPageUrl: string,
  token: string,
  logger: LoggerService,
) => {
  try {
    await fetch(`${statusPageUrl}/incidents/${incidentId}.json`, {
      method: 'DELETE',
      headers: {
        'Content-type': 'application/json',
        Authorization: `${token}`,
      },
    });
    return {};
  } catch (error) {
    logger.error(String(`Error deleting incident:', ${error}`));
    return { message: 'Error: failed to delete incident' };
  }
};

export const draftPostmortem = async (
  incidentId: string,
  statusPageUrl: string,
  token: string,
  logger: LoggerService,
  postmortemBody: PostmortemBody
) => {
  try {
    const response = await fetch(
      `${statusPageUrl}/incidents/${incidentId}/postmortem`,
      {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
          Authorization: `${token}`,
        },
        body: JSON.stringify(postmortemBody),
      },
    )
      .then(data => {
        return data.json();
      })
      .catch(err => {
        throw new Error(err);
      });
    return response;
  } catch (error) {
    logger.error(String(`Error drafting postmortem:', ${error}`));
    return { message: 'Error: failed to draft postmortem' };
  }
};

export const publishPostmortem = async (
  incidentId: string,
  statusPageUrl: string,
  token: string,
  logger: LoggerService,
  postmortemBody: PostmortemBody
) => {
  try {
    await fetch(`${statusPageUrl}/incidents/${incidentId}/postmortem/publish`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
        Authorization: `${token}`,
        body: JSON.stringify(postmortemBody),
      },
      body: JSON.stringify({ postmortem: {} }),
    });
    return {};
  } catch (error) {
    logger.error(String(`Error publishing postmortem:', ${error}`));
    return { message: 'Error: failed to publish postmortem' };
  }
};
