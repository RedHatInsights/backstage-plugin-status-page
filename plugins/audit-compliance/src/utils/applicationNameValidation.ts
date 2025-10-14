/**
 * Utility functions for validating application names
 * Only allows: Letters, numbers, hyphens (-), underscores (_)
 * Disallows: Forward slashes (/), ampersands (&), spaces, and other special characters
 */

/**
 * Validates if an application name contains only allowed characters
 * @param appName - The application name to validate
 * @returns true if valid, false if invalid
 */
export function isValidApplicationName(appName: string): boolean {
  if (!appName || appName.trim().length === 0) {
    return false;
  }

  // Regular expression to match only allowed characters:
  // - Letters (a-z, A-Z)
  // - Numbers (0-9)
  // - Hyphens (-)
  // - Underscores (_)
  // - Spaces
  const allowedPattern = /^[a-zA-Z0-9_\s-]+$/;

  return allowedPattern.test(appName.trim());
}

/**
 * Gets validation error message for invalid application names
 * @param appName - The application name to validate
 * @returns Error message if invalid, empty string if valid
 */
export function getApplicationNameValidationError(appName: string): string {
  if (!appName || appName.trim().length === 0) {
    return 'Application name is required';
  }

  if (!isValidApplicationName(appName)) {
    return 'Application name can only contain letters, numbers, hyphens (-), underscores (_), and spaces. Special characters like slashes (/), and ampersands (&) are not allowed.';
  }

  return '';
}

/**
 * Suggests a valid application name by replacing invalid characters
 * @param appName - The original application name
 * @returns A suggested valid application name
 */
export function suggestValidApplicationName(appName: string): string {
  if (!appName) return '';

  return (
    appName
      .trim()
      // Replace spaces with hyphens
      .replace(/\s+/g, '-')
      // Replace special characters with hyphens
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      // Remove multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '') ||
    // Ensure it's not empty
    'application-name'
  );
}
