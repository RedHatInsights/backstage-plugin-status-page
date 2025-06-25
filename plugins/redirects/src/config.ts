import { Config } from '@backstage/config';
import { RedirectionRule, RedirectsConfig } from './types';

const readRedirectionRules = (config: Config): RedirectionRule => {
  const type = config.get<'url' | 'entity'>('type');
  const from = config.getString('from');
  const to = config.getString('to');
  const message = config.getOptionalString('message');

  return {
    type,
    from,
    to,
    message,
  };
};

export const readRedirectionConfig = (config: Config): RedirectsConfig => {
  const redirectsConfig = config.getConfig('app.redirects');

  const rulesConfig = redirectsConfig?.getOptionalConfigArray('rules') || [];

  const rules = rulesConfig?.map(readRedirectionRules);

  return {
    rules,
  };
};
