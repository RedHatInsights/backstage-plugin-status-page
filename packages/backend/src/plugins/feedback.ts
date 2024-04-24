import { createRouter } from '@janus-idp/backstage-plugin-feedback-backend';
import { PluginEnvironment } from '../types';
import { Router } from 'express';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  return await createRouter({
    logger: env.logger,
    config: env.config,
    discovery: env.discovery,
  });
}
