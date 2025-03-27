const commonQueryPreFix = `search (index="federated:rh_paas" "kubernetes.container_name"="`;
const commonQueryPostFix = `" "dep_env=prod" "log_module=req-log") | rex field=message "client_name=(?<client_name>[^,]+)" | where true() | timechart span=1d count by client_name | makecontinuous _time`;


export const getQueryForNumberOfQueriesClient = (subgraph: string) => {
  return `${commonQueryPreFix}${subgraph}${commonQueryPostFix}`;
};
