import { createRouter } from "@appdev-platform/backstage-plugin-report-portal-backend";
import { Router } from 'express';

import { PluginEnvironment } from '../types';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({ logger: env.logger, config: env.config });
}
