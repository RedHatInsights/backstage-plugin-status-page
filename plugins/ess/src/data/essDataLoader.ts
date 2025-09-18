import { SecurityRequirementsData } from '../components/SecurityRequirementsCards/SecurityRequirementsCards';
import { Config } from '@backstage/config';

// GitLab configuration interface
interface GitLabConfig {
  baseUrl: string; 
}


// Convert various ESS data formats to our standard format
const normalizeEssData = (data: any): SecurityRequirementsData => {
  const result: SecurityRequirementsData = {};

  // Process all top-level keys dynamically - preserve original category names
  Object.keys(data).forEach(categoryKey => {
    const categoryData = data[categoryKey];

    // Skip if not an array
    if (!Array.isArray(categoryData)) {
      return;
    }

    // Use the original category name from JSON as the key
    result[categoryKey] = categoryData.map(req => ({
      requirementId: req.requirementId || '',
      description: req.description || '',
      response: req.response || []
    }));
  });

  return result;
};

// Generate possible filename variations dynamically
const generatePossibleFilenames = (platformName: string): string[] => {
  const normalized = platformName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  // Remove existing 'platform' suffix/prefix to avoid duplication
  const cleanName = normalized.replace(/-platform$/, '').replace(/^platform-/, '');

  return [
    platformName, // exact match
    normalized,   // normalized version
    cleanName,    // clean version without platform prefix/suffix
    `${cleanName}-platform`, // with platform suffix
    `platform-${cleanName}`, // with platform prefix
  ].filter((name, index, array) => array.indexOf(name) === index); // Remove duplicates
};

// Load ESS data from GitLab snippet API
export const loadPlatformEssData = async (platformName: string, config: GitLabConfig): Promise<SecurityRequirementsData | null> => {
  const gitlabConfig = config;

  // Generate possible filename variations dynamically
  const possibleNames = generatePossibleFilenames(platformName);

  // Try each possible filename until one works
  for (const fileName of possibleNames) {
    try {
      // Attempting to fetch ESS data

      const url = `${gitlabConfig.baseUrl}/${fileName}.json`;
      // GitLab API URL constructed

      const headers: HeadersInit = {
        'Accept': 'application/json',
      };


      const response = await fetch(url, {
        method: 'GET',
        headers,
        // Don't set mode or credentials when using proxy
      });

      if (response.ok) {
        const data = await response.json();
        // Successfully fetched ESS data

        // Convert the platform-specific format to our standard SecurityRequirementsData format
        return normalizeEssData(data);
      } else if (response.status === 404) {
        // ESS data not found for filename
        continue;
      } else {
        // Failed to fetch ESS data
        continue;
      }
    } catch (error) {
      // Error fetching ESS data
      continue;
    }
  }

  // ESS data not found for platform
  return null;
};

// Check if ESS data exists for a platform
export const hasEssData = async (platformName: string, config: GitLabConfig): Promise<boolean> => {
  const data = await loadPlatformEssData(platformName, config);
  return data !== null;
};

// Create GitLab configuration from app config
export const createGitLabConfigFromAppConfig = (config: Config): GitLabConfig => {
  // Get backend baseUrl with fallback
  const backendBaseUrl = config.getOptionalString('backend.baseUrl');
  const gitlabBaseUrl = `${backendBaseUrl}/api/proxy/gitlab-ess`;

  // Create configuration with dynamic baseUrl (token handled by proxy)
  const gitlabConfig: GitLabConfig = {
    baseUrl: gitlabBaseUrl,
  };

  return gitlabConfig;
};

// Get domain programmatically from current window location
const getDomainProgrammatically = (): string => {

  return `${window.location.protocol}//${window.location.host}`;

};

// Base URL configuration - gets domain programmatically
const getBaseUrl = (): string => {
  // For platform URLs, use the current domain programmatically
  return getDomainProgrammatically();
};

// Generate platform-specific documentation URL
export const getPlatformDocumentationUrl = (entity: any): string => {
  if (!entity || !entity.metadata) {
    return '';
  }

  const { namespace, name } = entity.metadata;
  const kind = entity.kind?.toLowerCase() || 'component';

  return `${getBaseUrl()}/docs/${namespace}/${kind}/${name}`;
};

// Generate platform-specific catalog URL
export const getPlatformCatalogUrl = (entity: any): string => {
  if (!entity || !entity.metadata) {
    return '';
  }

  const { namespace, name } = entity.metadata;
  const kind = entity.kind?.toLowerCase() || 'component';

  return `${getBaseUrl()}/catalog/${namespace}/${kind}/${name}`;
};
