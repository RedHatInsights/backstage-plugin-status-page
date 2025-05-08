// DTL Queries
export const queryForNumberOfSubgraphsDeveloped = `search index="federated:rh_paas" earliest=-1d | regex kubernetes.container_name="^rhg-.*" | dedup kubernetes.container_name | table kubernetes.container_name`;
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

// Hydra Attachments Queries
export const queryForAttachmentsDownloads = `search index=federated:rh_jboss host="hydra-attachments-prod*" sourcetype=access_combined path="*download*" OR "Case-Attachment-Metadata-Service:Start download operation*"|timechart count span=1d`;
export const queryForAttachmentsUniqueUsers = `search index=federated:rh_jboss host="hydra-attachments-prod*" | timechart span=1d distinct_count("authenticatedUser")`;
export const queryForAttachmentsUploads = `search index=federated:rh_jboss host="hydra-attachments-prod*" sourcetype=access_combined path="*/upload/credentials" | timechart span=1d count`;

// Hydra CaseBot Queries
export const queryForCaseBotUniqueUsers = `search host="hydra-bots-prod*" index="federated:rh_jboss" "hydra-bots EventLoggingMiddleware: Received Event: {*\\"command\\":*}" OR "hydra-bots CaseMessageEventHandler: Message event processed - {*\\"command\\":*}" OR "hydra-bots MessageEventHandler: Message event processed - {*\\"command\\":*}" | rex "\\"user_id\\":\\"(?<user_id>[^\\"]+)\\"" | timechart span=1mon distinct_count(user_id) AS "#Users"`;
export const queryForCaseBotFrequencyPerCommand = `search host="hydra-bots-prod*" index="federated:rh_jboss" "hydra-bots EventLoggingMiddleware: Received Event: {*\\"command\\":*}" OR "hydra-bots CaseMessageEventHandler: Message event processed - {*\\"command\\":*}" OR "hydra-bots MessageEventHandler: Message event processed - {*\\"command\\":*}" | rex "\\"command\\":\\s*\\"(?<command_name>[^\\"]+)\\"" | timechart span=1mon count by command_name`;

// Hydra Search Queries
export const queryForHydraSearchRequests = `search index=federated:rh_jboss host="hydra-search-api-prod*" sourcetype=access_combined source="/usr/app/hydra/log/access.log" NOT (path="*health" OR path="*version") | timechart count span=1d`;
export const queryForHydraSearchActiveUsers = `search index=federated:rh_jboss host="hydra-search-api-prod*" | timechart span=1d  distinct_count("AuthenticatedUser")`;

// Hydra Rest Queries
export const queryForRestCasesCreated = `search index=federated:rh_jboss host="hydra-rest-prod*" path="/hydra/rest/v1/cases" method=POST | timechart count span=1d`;
export const queryForRestActiveUsers = `search index=federated:rh_jboss host="hydra-rest-prod*" | timechart span=1d  distinct_count("AuthenticatedUser")`;

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
  HydraAttachmentsDownloads = 'HydraAttachmentsDownloads',
  HydraAttachmentsUploads = 'HydraAttachmentsUploads',
  HydraAttachmentsUniqueUsers = 'HydraAttachmentsUniqueUsers',
  HydraCaseBotUniqueUsers = 'HydraCaseBotUniqueUsers',
  HydraCaseBotCommandFrequency = 'HydraCaseBotCommandFrequency',
}

export enum HydraNotificationsLogIds {
  ActiveUsers = 'notifications_active_users',
  NotificationsServed = 'notifications_served',
  NotificationsPerChannel = 'notifications_per_channel',
}

export enum HydraAttachmentLogIds {
  UniqueUsers = 'attachments_unique_users',
  AttachmentsDownloads = 'attachments_downloads',
  AttachmentsUploads = 'attachments_uploads',
}

export enum HydraCaseBotLogIds {
  UniqueUsers = 'casebot_unique_users',
  FrequencyPerCommand = 'casebot_frequency_per_command',
}

export enum HydraSearchLogIds {
  UniqueUsers = 'search_unique_users',
  SearchRequest = 'search_requests',
}

export enum HydraRestLogIds {
  UniqueUsers = 'rest_unique_users',
  CasesCreated = 'rest_cases_created',
}
