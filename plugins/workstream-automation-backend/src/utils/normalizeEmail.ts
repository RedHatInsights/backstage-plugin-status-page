export function normalizeEmail(input: string) {
  // Remove all repeated `mailto:` or `mailto://` prefixes
  const cleaned = input.replace(/(mailto:\/{0,2})+/gi, '');

  return `mailto:${cleaned}`;
}
