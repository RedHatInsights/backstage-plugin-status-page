import {
  AuthService,
  DatabaseService,
  HttpAuthService,
} from '@backstage/backend-plugin-api';
import { CatalogService } from '@backstage/plugin-catalog-node';

export type RouterOptions = {
  httpAuth: HttpAuthService;
  database: DatabaseService;
  catalog: CatalogService;
  auth: AuthService;
};
