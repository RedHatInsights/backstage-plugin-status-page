import { LoggerService } from '@backstage/backend-plugin-api';
import { Knex } from 'knex';
import { Config } from '@backstage/config';

import axios from 'axios';

/**
 * Interface representing the response structure for Jira issue status.
 */
interface JiraIssueStatusResponse {
  fields: {
    status: {
      /** Current status name of the Jira issue */
      name: string;
    };
  };
}

/**
 * Checks and updates the status of Jira tickets in the database.
 * Fetches current status from Jira API and updates local records if changed.
 * Uses a cache to minimize API calls for frequently checked tickets.
 *
 * @param db - Knex database instance for database operations
 * @param logger - Logger service for logging operations
 * @param config - Config object for accessing configuration
 * @returns Promise that resolves when all status checks are complete
 */
export async function checkAndUpdateJiraStatuses(
  db: Knex,
  logger: LoggerService,
  config: Config,
): Promise<void> {
  const statusCache: Map<string, string> = new Map();

  try {
    // Fetch all tickets that are not completed or closed
    const rows = await db('group_access_reports')
      .select('ticket_reference', 'ticket_status')
      .whereNotIn('ticket_status', ['Completed', 'Closed'])
      .whereNotNull('ticket_reference');

    logger.info(
      `Found ${rows.length} Jira tickets to check for status updates`,
    );

    for (const row of rows) {
      const { ticket_reference, ticket_status } = row;

      // Skip if no ticket reference (extra safety check)
      if (!ticket_reference) continue;

      // Use cache to avoid redundant API calls
      const cachedStatus = statusCache.get(ticket_reference);
      if (cachedStatus && cachedStatus === ticket_status) {
        logger.debug(`Cache hit for ${ticket_reference}, skipping`);
        continue;
      }

      // Fetch current status from Jira
      const latestStatus = await fetchJiraStatus(
        ticket_reference,
        logger,
        config,
      );
      if (!latestStatus) continue;

      // Update database if status has changed
      if (latestStatus !== ticket_status) {
        await db('group_access_reports')
          .where('ticket_reference', ticket_reference)
          .update({ ticket_status: latestStatus });

        logger.info(
          `Updated JIRA status for ${ticket_reference}: ${ticket_status} → ${latestStatus}`,
        );
      }

      // Cache the status for potential reuse
      statusCache.set(ticket_reference, latestStatus);
    }
  } catch (err) {
    logger.error(`Error checking/updating JIRA statuses: ${err}`);
  }
}

/**
 * Fetches the current status of a Jira issue from the Jira API.
 *
 * @param issueKey - The Jira issue key (e.g., 'PROJ-123')
 * @param logger - Logger service for logging operations
 * @param config - Config object for accessing configuration
 * @returns Promise resolving to the current status name or null if fetch fails
 * @throws Will not throw but returns null on error
 */
export async function fetchJiraStatus(
  issueKey: string,
  logger: LoggerService,
  config: Config,
): Promise<string | null> {
  try {
    const jiraUrl = config.getString('auditCompliance.jiraUrl');
    const jiraToken = config.getString('auditCompliance.jiraToken');
    const detailsResp = await axios.get<JiraIssueStatusResponse>(
      `${jiraUrl}/rest/api/latest/issue/${issueKey}`,
      {
        headers: {
          Authorization: `Bearer ${jiraToken}`,
          Accept: 'application/json',
        },
      },
    );

    const status = detailsResp.data.fields.status.name;
    logger.debug(`Retrieved status for ${issueKey}: ${status}`);
    return status;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      logger.warn(
        `Axios error fetching ${issueKey}: ${err.response?.status} - ${err.message}`,
      );
    } else {
      logger.error(`Unknown error fetching ${issueKey}: ${err}`);
    }
    return null;
  }
}
