/** GDPR API constants */
export const GDPR_CONSTANTS = {
  /** HTTP Methods */
  HTTP_METHODS: {
    POST: 'POST' as const,
    DELETE: 'DELETE' as const,
  },
  
  /** Content Types */
  CONTENT_TYPES: {
    JSON: 'application/json' as const,
  },
  
  /** Error Messages */
  ERROR_MESSAGES: {
    HTTP_ERROR: (platform: string, status: number) => `${platform.toUpperCase()} HTTP error! Status: ${status}`,
    DELETE_ERROR: (url: string, status: number) => `DELETE error at ${url}! Status: ${status}`,
    FETCH_FAILED: (platform: string) => `${platform.toUpperCase()} request failed`,
    DELETE_FAILED: (url: string) => `Error deleting GDPR data from ${url}`,
  },
} as const;

/** JWT token for API authentication (temporary) */
export const JWT = 'temporary-jwt-token';
