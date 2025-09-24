
import { LoggerService } from '@backstage/backend-plugin-api';
import { GdprConfig, Platform, UserData, GdprError } from './types';
import { formatUserData } from './utils';
import { makeAuthenticatedRequest, parseJsonResponse } from './httpUtils';
import { GDPR_CONSTANTS } from './constants';

/**
 * Fetches user data from a specific platform with email fallback
 * First tries with username, then falls back to email if no results
 */
async function fetchUserDataFromPlatform(
  config: GdprConfig,
  platform: Platform,
  name: string,
  email: string,
  logger?: LoggerService,
): Promise<UserData> {
  const platformConfig = config[platform];

  logger?.info(`Fetching GDPR data from ${platform.toUpperCase()}`, {
    platform,
    apiUrl: platformConfig.apiBaseUrl,
    name,
    email,
  });

  // First try with username
  try {
    const nameBody = JSON.stringify({ summarize: true, name });
    logger?.info(`Trying ${platform.toUpperCase()} search with username: ${name}`);

    const nameResponse = await makeAuthenticatedRequest(
      platformConfig.apiBaseUrl,
      platformConfig,
      platform,
      {
        method: GDPR_CONSTANTS.HTTP_METHODS.POST,
        body: nameBody,
      },
      logger,
    );

    const nameData = await parseJsonResponse(nameResponse, platform);
    const userData = formatUserData(platform, nameData);
    
    // Check if we got meaningful results (user exists and has content/data)
    if (userData.user && Object.keys(userData.user).length > 0) {
      logger?.info(`Successfully fetched data from ${platform.toUpperCase()} using username`);
      return userData;
    }
    
    logger?.info(`No results from ${platform.toUpperCase()} using username, trying email fallback`);
  } catch (nameError) {
    logger?.warn(`Username search failed for ${platform.toUpperCase()}, trying email fallback`, {
      error: String(nameError),
    });
  }

  // Fallback to email search
  const emailBody = JSON.stringify({ summarize: true, mail: email });
  logger?.info(`Trying ${platform.toUpperCase()} search with email: ${email}`);
  
  const emailResponse = await makeAuthenticatedRequest(
    platformConfig.apiBaseUrl,
    platformConfig,
    platform,
    {
      method: GDPR_CONSTANTS.HTTP_METHODS.POST,
      body: emailBody,
    },
    logger,
  );

  const emailData = await parseJsonResponse(emailResponse, platform);
  const userData = formatUserData(platform, emailData);
  
  logger?.info(`Successfully fetched data from ${platform.toUpperCase()} using email fallback`);
  return userData;
}

/**
 * Fetches GDPR data from all platforms: DCP → DXSP → CPPG → CPHUB
 * Returns data from all available platforms
 */
export async function fetchGDPRData(
  drupalConfig: GdprConfig,
  name: string,
  email: string,
  logger?: LoggerService,
): Promise<UserData[]> {
  const results: UserData[] = [];
  const errors: string[] = [];

  logger?.info('Starting GDPR data fetch from all platforms', {
    name,
    email,
    dcpUrl: drupalConfig.dcp.apiBaseUrl,
    dxspUrl: drupalConfig.dxsp.apiBaseUrl,
    cppgUrl: drupalConfig.cppg.apiBaseUrl,
    cphubUrl: drupalConfig.cphub.apiBaseUrl,
  });

  // Step 1: Try DCP first
  try {
    const dcpData = await fetchUserDataFromPlatform(drupalConfig, Platform.DCP, name, email, logger);
    results.push(dcpData);
    logger?.info('Successfully fetched data from DCP');
  } catch (dcpError) {
    const errorMsg = `Failed to fetch data from DCP: ${String(dcpError)}`;
    errors.push(errorMsg);
    logger?.warn(errorMsg);
  }

  // Step 2: Try DXSP second
  try {
    const dxspData = await fetchUserDataFromPlatform(drupalConfig, Platform.DXSP, name, email, logger);
    results.push(dxspData);
    logger?.info('Successfully fetched data from DXSP');
  } catch (dxspError) {
    const errorMsg = `Failed to fetch data from DXSP: ${String(dxspError)}`;
    errors.push(errorMsg);
    logger?.warn(errorMsg);
  }

  // Step 3: Try CPPG third
  try {
    const cppgData = await fetchUserDataFromPlatform(drupalConfig, Platform.CPPG, name, email, logger);
    results.push(cppgData);
    logger?.info('Successfully fetched data from CPPG');
  } catch (cppgError) {
    const errorMsg = `Failed to fetch data from CPPG: ${String(cppgError)}`;
    errors.push(errorMsg);
    logger?.warn(errorMsg);
  }

  // Step 4: Try CPHUB fourth
  try {
    const cphubData = await fetchUserDataFromPlatform(drupalConfig, Platform.CPHUB, name, email, logger);
    results.push(cphubData);
    logger?.info('Successfully fetched data from CPHUB');
  } catch (cphubError) {
    const errorMsg = `Failed to fetch data from CPHUB: ${String(cphubError)}`;
    errors.push(errorMsg);
    logger?.warn(errorMsg);
  }

  // Check if we got any results
  if (results.length === 0) {
    logger?.error('Failed to fetch GDPR data from all platforms', { errors });
    throw new GdprError(
      'Failed to fetch GDPR data from all platforms',
      Platform.DCP, // Primary platform
      undefined,
      new Error(errors.join('; ')),
    );
  }

  logger?.info('GDPR data fetch completed', {
    totalPlatforms: 4,
    successfulPlatforms: results.length,
    failedPlatforms: errors.length,
  });

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
