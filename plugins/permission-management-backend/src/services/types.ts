import {
  LoggerService,
  RootConfigService,
  DatabaseService,
  AuthService,
  DiscoveryService,
  PermissionsService,
  HttpAuthService,
} from '@backstage/backend-plugin-api';

export interface RouterOptions {
  logger: LoggerService;
  config: RootConfigService;
  database: DatabaseService;
  auth: AuthService;
  discovery: DiscoveryService;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
}


export interface AccessRequestRouterOptions {
  logger: LoggerService;
  config: RootConfigService;
  database: DatabaseService;
  auth: AuthService;
  discovery: DiscoveryService;
  permissions: PermissionsService;
  httpAuth: HttpAuthService;
}
