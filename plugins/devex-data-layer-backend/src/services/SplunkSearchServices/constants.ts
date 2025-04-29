// DTL Queries
export const queryForNumberOfSubgraphsDeveloped = `search index="federated:rh_paas" earliest=-7d | regex kubernetes.container_name="^rhg-.*" | dedup kubernetes.container_name | table kubernetes.container_name`;
export const queryForAkamaiApiGatewayRequestsRecord = `search index=federated:rh_akamai sourcetype=datastream:access reqHost=graphql.redhat.com* | timechart span=1d count | makecontinuous _time`;
export const queryForAkamaiApiGatewayResponseTimeRecord = `search index=federated:rh_akamai sourcetype=datastream:access reqHost=graphql.redhat.com* | timechart span=1d median( turnAroundTimeMSec) as "Median", avg( turnAroundTimeMSec) as "Average", perc95( turnAroundTimeMSec) as "95th" | eval Average = round('Average',0) | eval 95th = round('95th',0) | makecontinuous _time`;

export const queryForTotalRequestOnInternalServer = `search ((index=federated:rh_paas OR index=federated:rh_paas_preprod) "dep_env=prod" "log_module=req-log") | regex kubernetes.container_name="rhg-gateway$" | rex field=message "client_name=(?<client_name>[^,]+)" | where true() | timechart span=1d count by client_name | makecontinuous _time`;
export const queryForTotalRequestOnPublicServer = `search ((index=federated:rh_paas OR index=federated:rh_paas_preprod) "dep_env=prod" "log_module=req-log") | regex kubernetes.container_name="rhg-gateway-public" | rex field=message "client_name=(?<client_name>[^,]+)" | where true() | timechart span=1d count by client_name | makecontinuous _time`;

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

// Hydra Queries
export const queryForNotificationsActiveUsers = `search index="federated:rh_jboss" host="hydra-notifications-prod*" sourcetype=access_combined source="/usr/app/hydra/log/access.log" | stats distinct_count("AuthenticatedUser")`;
export const queryForNotificationsServed = `search host="hydra-notifications-engine-prod*" index="federated:rh_jboss" "notifications-engine ReportProcessor :" | timechart span=1d count AS "Notifications Sent"`;
export const queryForNotificationsPerChannel = `search host="hydra-notifications-engine-prod*" index="federated:rh_jboss" "notifications-engine ReportProcessor :" "Channel" | rex field=_raw "Channel\\\\s+(?<channel>[^\\\\|]+)" | eval channel=trim(channel) | timechart span="1d" count by channel`;

export enum PollingTypes {
  Subgraph = 'Subgraph',
  GatewayRequest = 'Gateway',
  GatewayResponseTime = 'GatewayResponseTime',
  GatewayInternal = 'GatewayInternal',
  GatewayPublic = 'GatewayPublic',
  ClientQueries = 'ClientQueries',
  ErrorRates = 'ErrorRates',
  HydraNotificationsActiveUsers = 'HydraNotificationsActiveUsers',
  HydraNotificationsServed = 'HydraNotificationsServed',
  HydraNotificationsPerChannel = 'HydraNotificationsPerChannel',
}

export enum HydraNotificationsLogIds {
  ActiveUsers = 'active_users',
  NotificationsServed = 'notifications_served',
  NotificationsPerChannel = 'notifications_per_channel',
}
