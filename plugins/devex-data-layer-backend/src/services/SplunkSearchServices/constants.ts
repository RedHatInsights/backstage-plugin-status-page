export const queryForNumberOfSubgraphsDeveloped = `search index="federated:rh_paas" earliest=-7d | regex kubernetes.container_name="^rhg-.*" | dedup kubernetes.container_name | table kubernetes.container_name`;

const queryForNumberOfQueriesClientPreFix = `search (index="federated:rh_paas" "kubernetes.container_name"="`;
const queryForNumberOfQueriesClientPostFix = `" "dep_env=prod" "log_module=req-log") | rex field=message "client_name=(?<client_name>[^,]+)" | where true() | timechart span=1d count by client_name | makecontinuous _time`;

export const getQueryForNumberOfQueriesClient = (subgraph: string) => {
  return `${queryForNumberOfQueriesClientPreFix}${subgraph}${queryForNumberOfQueriesClientPostFix}`;
};
