import {
  LoggerService,
  RootConfigService,
  DatabaseService,
  AuthService,
  DiscoveryService,
  PermissionsService,
  HttpAuthService,
  PermissionsRegistryService,
} from '@backstage/backend-plugin-api';
import { CatalogService } from '@backstage/plugin-catalog-node';

export interface RouterOptions {
  logger: LoggerService;
  config: RootConfigService;
  database: DatabaseService;
  auth: AuthService;
  discovery: DiscoveryService;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
  catalog: CatalogService;
  permissionsRegistry: PermissionsRegistryService;
}
