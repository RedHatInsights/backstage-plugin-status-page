/** @public */
export const getServiceNowDashboardUrl = (hostname: string, sys_id: string) => {
  const url = new URL('/cmdb_dashboard.do', hostname);
  url.searchParams.append('sysparm_record', sys_id);
  url.searchParams.append('sysparm_table', 'cmdb_ci_business_app');
  url.searchParams.append('sysparm_view', 'ci_dashboard');

  return url.toString();
};
