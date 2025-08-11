import { Config } from '@backstage/config';
import { GdprConfig } from './types';

export const readDrupalConfig = (config: Config): GdprConfig => {
  const gdprConfig = config.getConfig('gdpr');

  const dcpConfig = gdprConfig.getConfig('dcp');
  const dxspConfig = gdprConfig.getConfig('dxsp');

  return {
    dcp: {
      token: dcpConfig.getString('token'),
      apiBaseUrl: dcpConfig.getString('apiBaseUrl'),
      serviceAccount: dcpConfig.getString('serviceAccount'),
    },
    dxsp: {
      token: dxspConfig.getString('token'),
      apiBaseUrl: dxspConfig.getString('apiBaseUrl'),
      serviceAccount: dxspConfig.getString('serviceAccount'),
    },
  };
};
