import { JsonValue } from '@backstage/types/index';
import { CMDB_TABLE_NAME } from './constants';

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
