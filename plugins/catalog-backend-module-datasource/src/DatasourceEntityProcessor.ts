import { LoggerService } from '@backstage/backend-plugin-api';
import { Entity } from '@backstage/catalog-model';
import { CatalogProcessor } from '@backstage/plugin-catalog-node';
import { isAiDatasourceEntity } from './lib/utils';
import { datasourceEntityValidator } from './lib/validator';

export class DatasourceEntityProcessor implements CatalogProcessor {
  private readonly logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger.child({ name: this.getProcessorName() });
  }

  getProcessorName(): string {
    return 'DatasourceEntityProcessor';
  }

  async validateEntityKind?(entity: Entity): Promise<boolean> {
    if (isAiDatasourceEntity(entity)) {
      this.logger.debug('Validating datasource entity');
      return await datasourceEntityValidator.check(entity);
    }
    return false;
  }

  // TODO Implement read location method to read from backend database
  // async readLocation?(
  //   location: LocationSpec,
  //   optional: boolean,
  //   emit: CatalogProcessorEmit,
  //   parser: CatalogProcessorParser,
  //   cache: CatalogProcessorCache,
  // ): Promise<boolean> {
  //   throw new Error('Method not implemented.');
  // }
}
