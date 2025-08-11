import { LoggerService } from '@backstage/backend-plugin-api';
import { DrupalHostConfig, Platform, GdprError } from './types';
import { GDPR_CONSTANTS } from './constants';

/**
 * Creates Basic authentication header for Drupal API
 */
export function createBasicAuthHeader(config: DrupalHostConfig): Record<string, string> {
  const credentials = `${config.serviceAccount}:${config.token}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');
  
  return {
    Authorization: `Basic ${encodedCredentials}`,
    'Content-Type': GDPR_CONSTANTS.CONTENT_TYPES.JSON,
  };
}

/**
 * Makes an authenticated HTTP request to a Drupal endpoint
 */
export async function makeAuthenticatedRequest(
  url: string,
  config: DrupalHostConfig,
  platform: Platform,
  options: {
    method: 'POST' | 'DELETE';
    body: string;
  },
  logger?: LoggerService,
): Promise<Response> {
  const headers = createBasicAuthHeader(config);
  
  logger?.debug(`Making ${options.method} request to ${platform.toUpperCase()}`, {
    url,
    platform,
    method: options.method,
  });

  try {
    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body,
    });

    if (!response.ok) {
      throw new GdprError(
        GDPR_CONSTANTS.ERROR_MESSAGES.HTTP_ERROR(platform, response.status),
        platform,
        response.status,
      );
    }

    return response;
  } catch (error) {
    if (error instanceof GdprError) {
      throw error;
    }
    
    throw new GdprError(
      GDPR_CONSTANTS.ERROR_MESSAGES.FETCH_FAILED(platform),
      platform,
      undefined,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}

/**
 * Safely parses JSON response with error handling
 */
export async function parseJsonResponse<T = unknown>(
  response: Response,
  platform: Platform,
): Promise<T> {
  try {
    return await response.json() as T;
  } catch (error) {
    throw new GdprError(
      `Failed to parse JSON response from ${platform.toUpperCase()}`,
      platform,
      response.status,
      error instanceof Error ? error : new Error(String(error)),
    );
  }
}
