/** @public */
export const getServiceNowFormUrl = (
  hostname: string,
  app_id: string,
): string => {
  const url = new URL('/nav_to.do', hostname);
  url.searchParams.append(
    'uri',
    `/cmdb_ci_business_app.do?sysparm_query=u_application_id=${app_id}`,
  );
  return url.toString();
};
