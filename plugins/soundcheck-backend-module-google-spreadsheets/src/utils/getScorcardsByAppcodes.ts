import { Entity } from '@backstage/catalog-model';

export function getScorecardsByAppcodes(
  sheetData: string[][],
  entity: Entity,
): Record<string, string> | undefined {
  if (!sheetData || sheetData.length < 2) return undefined;

  const header = sheetData[0];
  const rows = sheetData.slice(1);

  const appcode = entity.metadata.annotations?.['servicenow.com/appcode'];
  if (!appcode) return undefined;

  const matchingRow = rows.find(row => row[0] === appcode);
  if (!matchingRow) return undefined;

  const result: Record<string, string> = {};
  for (let i = 0; i < header.length; i++) {
    result[header[i]] = matchingRow[i];
  }
  return result;
}
