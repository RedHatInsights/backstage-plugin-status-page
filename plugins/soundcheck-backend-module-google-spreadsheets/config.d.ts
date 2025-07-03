import { HumanDuration } from '@backstage/types';
import {
  CacheConfig,
  EntityFilter,
} from '@spotify/backstage-plugin-soundcheck-common';
import { Duration } from 'luxon';

export interface Config {
  soundcheck: {
    collectors: {
      googleSpreadsheets?: {
        /**
         * @visibility secret
         */
        googleCredentials?: string;

        // Common collector options
        filter?: EntityFilter;
        exclude?: EntityFilter;
        frequency?: { cron: string } | HumanDuration;
        initialDelay?: Duration | HumanDuration;
        cache?: CacheConfig;
        batchSize?: number;

        collects?: Array<{
          type: string;
          spreadsheetId: string;
          sheetId: string | number;
          // Common collector options
          filter?: EntityFilter;
          exclude?: EntityFilter;
          frequency?: { cron: string } | HumanDuration;
          initialDelay?: Duration | HumanDuration;
          cache?: CacheConfig;
          batchSize?: number;
        }>;
      };
    };
  };
}
