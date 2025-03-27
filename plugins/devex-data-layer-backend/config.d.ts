import { SchedulerServiceTaskScheduleDefinitionConfig } from "@backstage/backend-plugin-api/index";

export interface Config {
  dataLayer: {
    /**
     * @visibility secret
     */
    splunkToken: string;
    splunkApiHost: string;
    splunkSubgraphsSnippet: string;
    schedule: SchedulerServiceTaskScheduleDefinitionConfig;
  };
}
