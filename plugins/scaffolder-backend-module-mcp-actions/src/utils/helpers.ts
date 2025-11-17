/**
 * Helper utilities for Scaffolder MCP Actions
 */

/**
 * Format error messages for consistent output
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Build base URL for scaffolder API
 */
export function buildScaffolderUrl(baseUrl: string, endpoint: string): string {
  // Ensure baseUrl ends with /
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  // Remove leading / from endpoint if present
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${normalizedBaseUrl}${normalizedEndpoint}`;
}

/**
 * Build fetch headers with authentication
 */
export function buildHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

