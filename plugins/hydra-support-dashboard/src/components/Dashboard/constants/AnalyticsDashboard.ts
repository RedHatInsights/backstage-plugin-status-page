export const SUPPORT_JIRAS = [
  'HYDRA-11575',
  'HYDRA-11576',
  'HYDRA-11577',
  'HYDRA-11685',
  'HYDRA-11579',
  'HYDRA-11542',
];

export const EPIC_TITLES: any = {
  'HYDRA-11575': 'Hydra Support, Maintenance & Ops',
  'HYDRA-11576': 'Hydra Adoption',
  'HYDRA-11577': 'Hydra unplanned requests',
  'HYDRA-11685': 'Breakdown/Outage for Hydra apps',
  'HYDRA-11579': 'Hydra enhancements',
  'HYDRA-11542': 'Compliance & Vulnerabilities for Hydra Modules',
};

export enum JiraCustomFields {
  epicNumber = 'customfield_12311140',
  storyPoints = 'customfield_12310243',
  browserLink = 'https://issues.redhat.com/browse/',
}

export const HLG_EPICS = [
  'HYDRA-11589', // Broker
  'HYDRA-11575', // Hydra Support
  'HYDRA-11590', // Notifications UI
  'HYDRA-11015', // Java 17 Migration
  'HYDRA-11541', // Notification Template
  'HYDRA-11773', // Case Bot
];
