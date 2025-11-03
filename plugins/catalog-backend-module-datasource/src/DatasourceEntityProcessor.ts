import { AuthService, LoggerService } from '@backstage/backend-plugin-api';
import {
  DEFAULT_NAMESPACE,
  Entity,
  getCompoundEntityRef,
  parseEntityRef,
  RELATION_DEPENDENCY_OF,
  RELATION_DEPENDS_ON,
  RELATION_HAS_PART,
  RELATION_PART_OF,
} from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  CatalogProcessor,
  CatalogProcessorEmit,
  processingResult,
} from '@backstage/plugin-catalog-node';
import {
  DatasourceApiClient,
  DatasourceEntity,
  parseDatasourceRef,
} from '@compass/backstage-plugin-datasource-common';
import {
  isAiDatasourceEntity,
  mapDatasourceToResourceEntity,
} from './lib/utils';
import { datasourceEntityValidator } from './lib/validator';

export class DatasourceEntityProcessor implements CatalogProcessor {
  private readonly logger: LoggerService;

  constructor(
    logger: LoggerService,
    private readonly datasourceClient: DatasourceApiClient,
    private readonly auth: AuthService,
  ) {
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
  async readLocation(
    location: LocationSpec,
    _optional: boolean,
    emit: CatalogProcessorEmit,
  ): Promise<boolean> {
    if (location.type !== 'datasource') {
      return false;
    }

    const { token } = await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: 'datasource',
    });
    const resp = await this.datasourceClient.getDatasource(
      { path: parseDatasourceRef(location.target) },
      { token },
    );

    if (resp.status === 404) {
      emit(
        processingResult.notFoundError(
          location,
          `Datasource: ${location.target} not found`,
        ),
      );
    } else {
      emit(
        processingResult.entity(
          location,
          mapDatasourceToResourceEntity(await resp.json()),
        ),
      );
    }
    return true;
  }

  async postProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    const selfRef = getCompoundEntityRef(entity);

    function doEmit(
      targets: string | string[] | undefined,
      context: { defaultKind?: string; defaultNamespace: string },
      outgoingRelation: string,
      incomingRelation: string,
    ) {
      if (!targets) {
        return;
      }

      for (const target of [targets].flat()) {
        const entityRef = parseEntityRef(target, context);

        // datasouce to target entity
        emit(
          processingResult.relation({
            source: selfRef,
            target: entityRef,
            type: outgoingRelation,
          }),
        );

        // target entity to datasource
        emit(
          processingResult.relation({
            source: entityRef,
            target: selfRef,
            type: incomingRelation,
          }),
        );
      }
    }
    if (isAiDatasourceEntity(entity)) {
      const dataEntity = entity as DatasourceEntity;
      doEmit(
        dataEntity.spec.steward,
        { defaultKind: 'User', defaultNamespace: 'redhat' },
        'data-steward',
        'data-steward',
      );
      doEmit(
        dataEntity.spec.dependencyOf,
        {
          defaultKind: 'Component',
          defaultNamespace: entity.metadata.namespace ?? DEFAULT_NAMESPACE,
        },
        RELATION_DEPENDENCY_OF,
        RELATION_DEPENDS_ON,
      );
      doEmit(
        dataEntity.spec.dependsOn,
        {
          defaultKind: 'Component',
          defaultNamespace: entity.metadata.namespace ?? DEFAULT_NAMESPACE,
        },
        RELATION_DEPENDS_ON,
        RELATION_DEPENDENCY_OF,
      );
      doEmit(
        dataEntity.spec.system,
        {
          defaultKind: 'System',
          defaultNamespace: entity.metadata.namespace ?? DEFAULT_NAMESPACE,
        },
        RELATION_PART_OF,
        RELATION_HAS_PART,
      );
    }
    return entity;
  }

  getPriority(): number {
    return 1;
  }
}
