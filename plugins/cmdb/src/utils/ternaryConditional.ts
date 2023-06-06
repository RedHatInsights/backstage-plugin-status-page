/**
 * Ternary conditional function.
 * 
 * Can be used to avoid nested ternary conditions in JSX
 */
export const iff = (condition: boolean, then: any, otherwise: any) =>
  condition ? then : otherwise;
