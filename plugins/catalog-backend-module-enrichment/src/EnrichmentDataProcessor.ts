import {
  Entity,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
  getCompoundEntityRef,
  parseEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  CatalogProcessor,
  CatalogProcessorCache,
  CatalogProcessorEmit,
  processingResult,
} from '@backstage/plugin-catalog-node';
import {
  EnrichmentData,
  enrichmentDataV1alpha1Validator,
  RELATION_ENRICHES,
  RELATION_ENRICHED_BY,
} from './kinds';
import {
  AuthService,
  DiscoveryService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { CatalogClient } from '@backstage/catalog-client';
import merge from 'deepmerge';

export class EnrichmentDataProcessor implements CatalogProcessor {
  private logger: LoggerService;
  private catalogApi: CatalogClient;
  private auth: AuthService;

  constructor(options: {
    logger: LoggerService;
    catalogApi: CatalogClient;
    discovery: DiscoveryService;
    auth: AuthService;
  }) {
    this.logger = options.logger.child({
      target: this.getProcessorName(),
    });
    this.catalogApi = options.catalogApi;
    this.auth = options.auth;

    this.logger.info(`Initialized ${this.getProcessorName()}`);
  }

  getProcessorName(): string {
    return 'EnrichmentDataProcessor';
  }

  validateEntityKind?(entity: Entity): Promise<boolean> {
    return enrichmentDataV1alpha1Validator.check(entity);
  }

  async postProcessEntity?(
    entity: Entity,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
    _cache: CatalogProcessorCache,
  ): Promise<Entity> {
    const selfRef = getCompoundEntityRef(entity);

    function doEmit(
      targets: string | string[] | undefined,
      context: { defaultKind?: string; defaultNamespace: string },
      outgoingRelation: string,
      incomingRelation: string,
    ): void {
      if (!targets) {
        return;
      }
      for (const target of [targets].flat()) {
        const targetRef = parseEntityRef(target, context);

        emit(
          processingResult.relation({
            source: selfRef,
            type: outgoingRelation,
            target: {
              kind: targetRef.kind,
              namespace: targetRef.namespace,
              name: targetRef.name,
            },
          }),
        );
        emit(
          processingResult.relation({
            source: {
              kind: targetRef.kind,
              namespace: targetRef.namespace,
              name: targetRef.name,
            },
            type: incomingRelation,
            target: selfRef,
          }),
        );
      }
    }

    if (!(entity.kind in ['EnrichmentData', 'Location'])) {
      this.logger.debug(
        `fetching enrichmentdata for ${stringifyEntityRef(selfRef)}`,
      );

      const { token } = await this.auth.getPluginRequestToken({
        onBehalfOf: await this.auth.getOwnServiceCredentials(),
        targetPluginId: 'catalog',
      });

      const enrichmentData = await this.catalogApi.queryEntities(
        {
          filter: [
            {
              kind: 'EnrichmentData',
              'spec.selectors.entityRef': stringifyEntityRef(selfRef),
            },
          ],
        },
        { token },
      );

      this.logger.debug(
        `found ${
          enrichmentData.items.length
        } enrichment data entities for ${stringifyEntityRef(selfRef)}`,
      );

      return enrichmentData.items.reduce(
        (mergedEntity, enrichmentDataEntity) => {
          const template = (enrichmentDataEntity as EnrichmentData).spec
            .template;

          this.logger.debug(
            `Merging ${stringifyEntityRef(
              enrichmentDataEntity,
            )} into ${stringifyEntityRef(selfRef)}`,
          );

          doEmit(
            stringifyEntityRef(enrichmentDataEntity),
            { defaultKind: 'Component', defaultNamespace: selfRef.namespace },
            RELATION_ENRICHED_BY,
            RELATION_ENRICHES,
          );

          return merge<Entity>(template, mergedEntity);
        },
        entity,
      );
    }

    if (entity.kind === 'EnrichmentData') {
      const enrichmentData = entity as EnrichmentData;

      doEmit(
        enrichmentData.spec.owner,
        { defaultKind: 'Group', defaultNamespace: selfRef.namespace },
        RELATION_OWNED_BY,
        RELATION_OWNER_OF,
      );
    }

    return entity;
  }
}
