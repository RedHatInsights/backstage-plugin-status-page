/**
 * Formats an application name for display by replacing hyphens/underscores
 * with spaces and capitalizing each word (Pascal-style words separated by spaces).
 *
 * Examples:
 * - "case-attachments-and-hydra" -> "Case Attachments And Hydra"
 * - "test-1" -> "Test 1"
 */
export function formatAppDisplayName(appName: string): string {
  if (!appName) {
    return '';
  }

  const normalized = appName
    .replace(/[-_]+/g, ' ') // replace hyphens/underscores with space
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .trim();

  return normalized
    .split(' ')
    .map(word => {
      if (word.length === 0) {
        return word;
      }
      const firstChar = word.charAt(0).toUpperCase();
      const rest = word.slice(1).toLowerCase();
      return `${firstChar}${rest}`;
    })
    .join(' ');
}
