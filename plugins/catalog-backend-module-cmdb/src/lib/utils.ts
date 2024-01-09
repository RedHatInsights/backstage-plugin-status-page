import { CMDB_TABLE_NAME } from './constants';

export function getViewUrl(host: string, sysId: string) {
  const uri = `/${CMDB_TABLE_NAME}.do?sys_id=${sysId}`;
  return new URL(
    `/nav_to.do?uri=${encodeURIComponent(uri)}`,
    `https://${host}`,
  ).toString();
}

export function toValidUrl(url: string) {
  return url.toString().startsWith('http') ? url.toString() : `https://${url}`;
}
