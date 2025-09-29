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
    // Fetch all tickets that are not completed or closed from both tables
    const [groupAccessRows, serviceAccountRows] = await Promise.all([
      db('group_access_reports')
        .select('ticket_reference', 'ticket_status')
        .whereNotIn('ticket_status', ['Completed', 'Closed'])
        .whereNotNull('ticket_reference'),
      db('service_account_access_review')
        .select('ticket_reference', 'ticket_status')
        .whereNotIn('ticket_status', ['Completed', 'Closed'])
        .whereNotNull('ticket_reference'),
    ]);

    const allRows = [
      ...groupAccessRows.map(row => ({
        ...row,
        table: 'group_access_reports',
      })),
      ...serviceAccountRows.map(row => ({
        ...row,
        table: 'service_account_access_review',
      })),
    ];

    logger.info(
      `Found ${allRows.length} Jira tickets to check for status updates (${groupAccessRows.length} group access, ${serviceAccountRows.length} service account)`,
    );

    for (const row of allRows) {
      const { ticket_reference, ticket_status, table } = row;

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
        await db(table)
          .where('ticket_reference', ticket_reference)
          .update({ ticket_status: latestStatus });

        logger.info(
          `Updated JIRA status for ${ticket_reference} in ${table}: ${ticket_status} → ${latestStatus}`,
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

/**
 * Adds a comment to a Jira issue using the Jira API.
 *
 * @param issueKey - The Jira issue key
 * @param comment - The comment to add
 * @param logger - Logger service for logging operations
 * @param config - Config object for accessing configuration
 * @returns Promise that resolves when the comment is added
 * @throws Throws an error if the API call fails
 */
export async function addJiraComment(
  issueKey: string,
  comment: string,
  logger: LoggerService,
  config: Config,
): Promise<void> {
  try {
    const jiraUrl = config.getString('auditCompliance.jiraUrl');
    const jiraToken = config.getString('auditCompliance.jiraToken');
    const commentUrl = `${jiraUrl}/rest/api/latest/issue/${issueKey}/comment`;

    await axios.post(
      commentUrl,
      { body: comment },
      {
        headers: {
          Authorization: `Bearer ${jiraToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    logger.info(`Successfully added comment to Jira issue ${issueKey}`);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const errorMsg = `Axios error adding comment to ${issueKey}: ${err.response?.status} - ${err.message}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    } else {
      const errorMsg = `Unknown error adding comment to ${issueKey}: ${err}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }
}

/**
 * Fetches all Jira fields and returns a mapping of field id to field name.
 *
 * @param logger - Logger service for logging operations
 * @param config - Config object for accessing configuration
 * @returns Promise resolving to an object mapping field id to field name
 */
export async function fetchJiraFieldMappings(
  logger: LoggerService,
  config: Config,
): Promise<Record<string, string>> {
  try {
    const jiraUrl = config.getString('auditCompliance.jiraUrl');
    const jiraToken = config.getString('auditCompliance.jiraToken');
    const fieldsUrl = `${jiraUrl}/rest/api/2/field`;

    const response = await axios.get(fieldsUrl, {
      headers: {
        Authorization: `Bearer ${jiraToken}`,
        Accept: 'application/json',
      },
    });

    const fields = response.data;
    // Map field id to field name
    const mapping: Record<string, string> = {};
    for (const field of fields) {
      if (field.id && field.name) {
        mapping[field.id] = field.name;
      }
    }
    logger.info(`Fetched ${Object.keys(mapping).length} Jira field mappings`);
    return mapping;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      logger.error(
        `Axios error fetching Jira fields: ${err.response?.status} - ${err.message}`,
      );
    } else {
      logger.error(`Unknown error fetching Jira fields: ${err}`);
    }
    return {};
  }
}

/**
 * Fetches all Jira fields with their complete schema information.
 * This provides detailed field type information for accurate transformation.
 *
 * @param logger - Logger service for logging operations
 * @param config - Config object for accessing configuration
 * @returns Promise resolving to an object mapping field id to complete field schema
 */
export async function fetchJiraFieldSchemas(
  logger: LoggerService,
  config: Config,
): Promise<Record<string, any>> {
  try {
    const jiraUrl = config.getString('auditCompliance.jiraUrl');
    const jiraToken = config.getString('auditCompliance.jiraToken');
    const fieldsUrl = `${jiraUrl}/rest/api/2/field`;

    const response = await axios.get(fieldsUrl, {
      headers: {
        Authorization: `Bearer ${jiraToken}`,
        Accept: 'application/json',
      },
    });

    const fields = response.data;
    // Map field id to complete field schema
    const schemas: Record<string, any> = {};
    for (const field of fields) {
      if (field.id) {
        schemas[field.id] = field;
      }
    }
    logger.info(`Fetched ${Object.keys(schemas).length} Jira field schemas`);
    return schemas;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      logger.error(
        `Axios error fetching Jira field schemas: ${err.response?.status} - ${err.message}`,
      );
    } else {
      logger.error(`Unknown error fetching Jira field schemas: ${err}`);
    }
    return {};
  }
}

/**
 * Transforms user input (name: value pairs) into Jira-compatible format.
 * This function takes the raw field data from the form and converts it to the format
 * that Jira expects for different field types.
 *
 * @param rawMetadata - Object with field IDs as keys and raw values as values, or enhanced format with schema
 * @param fieldSchemas - Object mapping field IDs to their schema information (fallback)
 * @param logger - Logger service for logging operations
 * @returns Transformed metadata ready for Jira API
 */
export function transformJiraMetadataForStorage(
  rawMetadata: Record<string, string | { value: string; schema?: any }>,
  fieldSchemas?: Record<string, any>,
  logger?: LoggerService,
): Record<string, any> {
  const transformed: Record<string, any> = {};

  for (const [fieldId, rawValue] of Object.entries(rawMetadata)) {
    // Handle both string format and enhanced format with schema
    let value: string;
    let fieldSchema: any = undefined;

    if (typeof rawValue === 'string') {
      value = rawValue;
      // Use fallback schema if available
      if (fieldSchemas && fieldSchemas[fieldId]) {
        fieldSchema = fieldSchemas[fieldId];
      }
    } else if (
      rawValue &&
      typeof rawValue === 'object' &&
      'value' in rawValue
    ) {
      value = rawValue.value;
      fieldSchema = rawValue.schema || (fieldSchemas && fieldSchemas[fieldId]);
    } else {
      continue; // Skip invalid values
    }

    if (!value || value.trim() === '') {
      continue; // Skip empty values
    }

    try {
      // Use schema information if available, otherwise fall back to pattern matching
      const transformedValue = fieldSchema
        ? transformFieldValueWithSchema(fieldId, value, fieldSchema, logger)
        : transformFieldValue(fieldId, value, logger);

      transformed[fieldId] = transformedValue;
    } catch (error) {
      if (logger) {
        logger.warn(`Failed to transform field ${fieldId}: ${error}`);
      }
      // Keep original value if transformation fails
      transformed[fieldId] = value;
    }
  }

  if (logger) {
    logger.debug('Transformed Jira metadata', {
      original: rawMetadata,
      transformed,
    });
  }

  return transformed;
}

/**
 * Transforms a single field value based on field type patterns.
 *
 * @param fieldId - The Jira field ID (e.g., 'components', 'customfield_12320040')
 * @param rawValue - The raw value from user input
 * @param logger - Logger service for logging operations
 * @returns Transformed value in Jira-compatible format
 */
function transformFieldValue(
  fieldId: string,
  rawValue: string,
  logger?: LoggerService,
): any {
  // Handle components field
  if (fieldId === 'components') {
    return transformComponentsField(rawValue);
  }

  // Handle select fields (single choice)
  if (
    fieldId === 'customfield_12320040' ||
    fieldId === 'customfield_12320041' ||
    fieldId.includes('select')
  ) {
    return transformSelectField(rawValue);
  }

  // Handle multi-select fields
  if (fieldId === 'customfield_12320050' || fieldId.includes('multiselect')) {
    return transformMultiSelectField(rawValue);
  }

  // Handle user fields
  if (fieldId === 'customfield_12320060' || fieldId.includes('user')) {
    return transformUserField(rawValue);
  }

  // Handle number fields
  if (
    fieldId === 'customfield_12320070' ||
    fieldId === 'customfield_12320071' ||
    fieldId.includes('number')
  ) {
    return transformNumberField(rawValue);
  }

  // Handle date fields
  if (fieldId === 'customfield_12320080' || fieldId.includes('date')) {
    return transformDateField(rawValue);
  }

  // Handle priority field
  if (fieldId === 'priority') {
    return transformPriorityField(rawValue);
  }

  // Handle labels field
  if (fieldId === 'labels') {
    return transformLabelsField(rawValue);
  }

  // Default: return as string
  if (logger) {
    logger.debug(
      `No specific transformation for field ${fieldId}, using as string`,
    );
  }
  return rawValue;
}

/**
 * Transforms a single field value based on Jira field schema information.
 * This function uses the actual field schema to determine the correct format.
 *
 * @param fieldId - The Jira field ID
 * @param rawValue - The raw value from user input
 * @param fieldSchema - The field schema from Jira API
 * @param logger - Logger service for logging operations
 * @returns Transformed value in Jira-compatible format
 */
function transformFieldValueWithSchema(
  fieldId: string,
  rawValue: string,
  fieldSchema: any,
  logger?: LoggerService,
): any {
  if (!fieldSchema || !fieldSchema.schema) {
    if (logger) {
      logger.warn(
        `No schema found for field ${fieldId}, using pattern matching`,
      );
    }
    return transformFieldValue(fieldId, rawValue, logger);
  }

  const schema = fieldSchema.schema;
  const schemaType = schema.type;
  const customType = schema.custom;

  if (logger) {
    logger.debug(`Transforming field ${fieldId} with schema`, {
      schemaType,
      customType,
      rawValue,
    });
  }

  // Handle based on schema type and custom type
  if (schemaType === 'option') {
    // Single select field
    return { value: rawValue.trim() };
  }

  if (schemaType === 'array' && schema.items === 'option') {
    // Multi-select field
    const options = rawValue
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt);
    return options.map(opt => ({ value: opt }));
  }

  if (schemaType === 'user') {
    // User field
    if (rawValue.includes('@')) {
      return { emailAddress: rawValue.trim() };
    }
    return { name: rawValue.trim() };
  }

  if (schemaType === 'number') {
    // Number field
    const num = parseFloat(rawValue.trim());
    return isNaN(num) ? 0 : num;
  }

  if (schemaType === 'date') {
    // Date field
    const trimmed = rawValue.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return trimmed;
  }

  if (schemaType === 'string') {
    // Text field
    return rawValue.trim();
  }

  // Handle specific custom field types
  if (customType) {
    if (customType.includes('select')) {
      return { value: rawValue.trim() };
    }
    if (customType.includes('multiselect')) {
      const options = rawValue
        .split(',')
        .map(opt => opt.trim())
        .filter(opt => opt);
      return options.map(opt => ({ value: opt }));
    }
    if (customType.includes('userpicker')) {
      if (rawValue.includes('@')) {
        return { emailAddress: rawValue.trim() };
      }
      return { name: rawValue.trim() };
    }
    if (customType.includes('number')) {
      const num = parseFloat(rawValue.trim());
      return isNaN(num) ? 0 : num;
    }
    if (customType.includes('datepicker')) {
      const trimmed = rawValue.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return trimmed;
    }
    if (customType.includes('textfield') || customType.includes('textarea')) {
      return rawValue.trim();
    }
  }

  // Fallback to pattern matching if schema doesn't match known types
  if (logger) {
    logger.warn(`Unknown schema type for field ${fieldId}`, { schema });
  }
  return transformFieldValue(fieldId, rawValue, logger);
}

/**
 * Transforms components field value.
 * Input: "Component1,Component2" or "Component1"
 * Output: [{ name: "Component1" }, { name: "Component2" }]
 */
function transformComponentsField(value: string): any[] {
  if (!value) return [];

  const components = value
    .split(',')
    .map(comp => comp.trim())
    .filter(comp => comp);
  return components.map(comp => ({ name: comp }));
}

/**
 * Transforms select field value.
 * Input: "Option Value"
 * Output: { value: "Option Value" }
 */
function transformSelectField(value: string): any {
  if (!value) return null;
  return { value: value.trim() };
}

/**
 * Transforms multi-select field value.
 * Input: "Option1,Option2" or "Option1"
 * Output: [{ value: "Option1" }, { value: "Option2" }]
 */
function transformMultiSelectField(value: string): any[] {
  if (!value) return [];

  const options = value
    .split(',')
    .map(opt => opt.trim())
    .filter(opt => opt);
  return options.map(opt => ({ value: opt }));
}

/**
 * Transforms user field value.
 * Input: "user@example.com" or "username"
 * Output: { emailAddress: "user@example.com" } or { name: "username" }
 */
function transformUserField(value: string): any {
  if (!value) return null;

  // Check if it looks like an email
  if (value.includes('@')) {
    return { emailAddress: value.trim() };
  }

  // Otherwise treat as username
  return { name: value.trim() };
}

/**
 * Transforms number field value.
 * Input: "123" or "123.45"
 * Output: 123 or 123.45
 */
function transformNumberField(value: string): number {
  if (!value) return 0;

  const num = parseFloat(value.trim());
  return isNaN(num) ? 0 : num;
}

/**
 * Transforms date field value.
 * Input: "2024-01-15" or "2024-01-15T10:30:00"
 * Output: "2024-01-15" (YYYY-MM-DD format)
 */
function transformDateField(value: string): string {
  if (!value) return '';

  const trimmed = value.trim();

  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Try to parse and format as YYYY-MM-DD
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // Return original if can't parse
  return trimmed;
}

/**
 * Transforms priority field value.
 * Input: "High", "Medium", "Low"
 * Output: { name: "High" }
 */
function transformPriorityField(value: string): any {
  if (!value) return null;
  return { name: value.trim() };
}

/**
 * Transforms labels field value.
 * Input: "label1,label2" or "label1"
 * Output: ["label1", "label2"]
 */
function transformLabelsField(value: string): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map(label => label.trim())
    .filter(label => label);
}
