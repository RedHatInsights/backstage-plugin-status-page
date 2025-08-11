
import { LoggerService } from '@backstage/backend-plugin-api';
import { GdprConfig, Platform, UserData, GdprError } from './types';
import { formatUserData } from './utils';
import { makeAuthenticatedRequest, parseJsonResponse } from './httpUtils';
import { GDPR_CONSTANTS } from './constants';

/**
 * Fetches user data from a specific platform
 */
async function fetchUserDataFromPlatform(
  config: GdprConfig,
  platform: Platform,
  name: string,
  logger?: LoggerService,
): Promise<UserData> {
  const platformConfig = config[platform];
  const body = JSON.stringify({ summarize: true, name });

  logger?.info(`Fetching GDPR data from ${platform.toUpperCase()}`, {
    platform,
    apiUrl: platformConfig.apiBaseUrl,
    name,
  });

  const response = await makeAuthenticatedRequest(
    platformConfig.apiBaseUrl,
    platformConfig,
    platform,
    {
      method: GDPR_CONSTANTS.HTTP_METHODS.POST,
      body,
    },
    logger,
  );

  const data = await parseJsonResponse(response, platform);
  return formatUserData(platform, data);
}

/**
 * Fetches GDPR data from both DCP and DXSP platforms
 * Returns data from both platforms if available, or fallback to single platform
 */
export async function fetchGDPRData(
  drupalConfig: GdprConfig,
  name: string,
  logger?: LoggerService,
): Promise<UserData[]> {
  const results: UserData[] = [];

  logger?.info('Starting GDPR data fetch', {
    name,
    dcpUrl: drupalConfig.dcp.apiBaseUrl,
    dxspUrl: drupalConfig.dxsp.apiBaseUrl,
  });

  // Try DCP first
  try {
    const dcpData = await fetchUserDataFromPlatform(drupalConfig, Platform.DCP, name, logger);
    results.push(dcpData);
    logger?.info('Successfully fetched data from DCP');
  } catch (dcpError) {
    logger?.warn('Failed to fetch data from DCP', { error: String(dcpError) });
    
    // If DCP fails, try DXSP only
    try {
      const dxspData = await fetchUserDataFromPlatform(drupalConfig, Platform.DXSP, name, logger);
      results.push(dxspData);
      logger?.info('Successfully fetched data from DXSP (fallback)');
      return results;
    } catch (dxspError) {
      logger?.error('Failed to fetch data from both platforms', {
        dcpError: String(dcpError),
        dxspError: String(dxspError),
      });
      throw new GdprError(
        'Failed to fetch GDPR data from both DCP and DXSP platforms',
        Platform.DCP, // Primary platform
        undefined,
        dcpError instanceof Error ? dcpError : new Error(String(dcpError)),
      );
    }
  }

  // If DCP succeeded, try DXSP as well
  try {
    const dxspData = await fetchUserDataFromPlatform(drupalConfig, Platform.DXSP, name, logger);
    results.push(dxspData);
    logger?.info('Successfully fetched data from both platforms');
  } catch (dxspError) {
    logger?.warn('Failed to fetch data from DXSP, continuing with DCP data only', {
      error: String(dxspError),
    });
  }

  return results;
}

/**
 * Deletes user data from a specific platform
 */
export async function deleteUserDataByPlatform(
  drupalConfig: GdprConfig,
  id: string,
  platform: Platform,
  logger?: LoggerService,
): Promise<unknown> {
  const platformConfig = drupalConfig[platform];
  const body = JSON.stringify({ uid: id });

  logger?.info(`Deleting GDPR data from ${platform.toUpperCase()}`, {
    platform,
    apiUrl: platformConfig.apiBaseUrl,
    uid: id,
  });

  try {
    const response = await makeAuthenticatedRequest(
      platformConfig.apiBaseUrl,
      platformConfig,
      platform,
      {
        method: GDPR_CONSTANTS.HTTP_METHODS.DELETE,
        body,
      },
      logger,
    );

    const result = await parseJsonResponse(response, platform);
    logger?.info(`Successfully deleted data from ${platform.toUpperCase()}`, { uid: id });
    return result;
  } catch (error) {
    logger?.error(`Failed to delete data from ${platform.toUpperCase()}`, {
      platform,
      uid: id,
      error: String(error),
    });
    throw error;
  }
}
