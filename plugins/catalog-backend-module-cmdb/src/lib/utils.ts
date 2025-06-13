import { JsonValue } from '@backstage/types';
import { CMDB_TABLE_NAME, installStatuses } from './constants';

export function getViewUrl(host: string, sysId: string) {
  const uri = `/${CMDB_TABLE_NAME}.do?sys_id=${sysId}`;
  return new URL(
    `/nav_to.do?uri=${encodeURIComponent(uri)}`,
    `https://${host}`,
  ).toString();
}

export function sanitizeUrl(str: JsonValue) {
  const url = str?.toString().startsWith('http') ? str.toString() : `https://${str}`
  try {
    const validUrl = new URL(url);
    return validUrl.toString();
  } catch(err) {
    return false;
  }
}

export function getInstallStatus (installStatus: JsonValue) {
  if (!Object.keys(installStatuses).includes(installStatus?.toString()!)) {
    return 'unknown';
  }
  return installStatuses[installStatus?.toString()!];
}

export function getInstallStatusLabel(installStatus: JsonValue): string {
  return installStatuses[installStatus?.toString() ?? ''] ?? 'Unknown';
}
