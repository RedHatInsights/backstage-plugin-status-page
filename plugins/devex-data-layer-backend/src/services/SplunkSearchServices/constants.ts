export const queryForNumberOfSubgraphsDeveloped = `search index="federated:rh_paas" earliest=-7d | regex kubernetes.container_name="^rhg-.*" | dedup kubernetes.container_name | table kubernetes.container_name`;
export const queryForAkamaiApiGatewayRequestsRecord = `search index=federated:rh_akamai sourcetype=datastream:access reqHost=graphql.redhat.com* | timechart span=1d count | makecontinuous _time`;

const queryForNumberOfQueriesClientPreFix = `search (index="federated:rh_paas" "kubernetes.container_name"="`;
const queryForNumberOfQueriesClientPostFix = `" "dep_env=prod" "log_module=req-log") | rex field=message "client_name=(?<client_name>[^,]+)" | where true() | timechart span=1d count by client_name | makecontinuous _time`;

const queryForErrorRatesPerSubgraphPreFix = `search (host="*" "kubernetes.container_name"=`;
const queryForErrorRatesPerSubgraphPostFix = ` (index=federated:rh_paas OR index=federated:rh_paas_preprod) "dep_env=prod" "log_level=warn" "log_module=req-log") | rex field=message "client_name=(?<client_name>[^,]+)" | timechart span=1d count by client_name | makecontinuous _time`;

export const getQueryForNumberOfQueriesClient = (subgraph: string) => {
  return `${queryForNumberOfQueriesClientPreFix}${subgraph}${queryForNumberOfQueriesClientPostFix}`;
};

export const getQueryForErrorRatesPerSubgraph = (subgraph: string) => {
  return `${queryForErrorRatesPerSubgraphPreFix}${subgraph}${queryForErrorRatesPerSubgraphPostFix}`;
};

export enum PollingTypes {
  Subgraph = 'Subgraph',
  GatewayRequest = 'Gateway',
  ClientQueries = 'ClientQueries',
  ErrorRates = 'ErrorRates',
}
