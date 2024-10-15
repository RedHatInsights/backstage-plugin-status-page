import {
  CompoundEntityRef,
  Entity,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
  getCompoundEntityRef,
  parseEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  CatalogProcessor,
  CatalogProcessorCache,
  CatalogProcessorEmit,
  processingResult,
} from '@backstage/plugin-catalog-node';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import { merge } from 'lodash';
import { CatalogClient } from '@backstage/catalog-client';
import {
  ANNOTATION_CMDB_APPCODE,
  PROCESSOR_CACHE_INVALIDATION_PERIOD,
} from './lib';
import { BusinessApplicationEntity, CMDBMeta } from './lib/types';
import { JsonValue } from '@backstage/types';
import { AuthService, LoggerService } from '@backstage/backend-plugin-api';

export class BusinessApplicationEntityProcessor implements CatalogProcessor {
  private readonly catalogApi: CatalogClient;
  private readonly logger: LoggerService;
  private readonly auth: AuthService;

  /* TODO: Add JSON Schema validator for BusinessApplication entity kind */
  private readonly validator = (_entity: Entity) => true;

  constructor(options: {
    catalogApi: CatalogClient;
    logger: LoggerService;
    auth: AuthService;
  }) {
    this.catalogApi = options.catalogApi;
    this.logger = options.logger.child({
      target: this.getProcessorName(),
    });
    this.auth = options.auth;
  }

  getProcessorName(): string {
    return 'BusinessApplicationEntityProcessor';
  }

  async validateEntityKind(entity: Entity): Promise<boolean> {
    const results = this.validator(entity);
    if (results) {
      return true;
    }

    return false;
  }

  async preProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
    _originLocation: LocationSpec,
    cache: CatalogProcessorCache,
  ): Promise<Entity> {
    const selfRef = getCompoundEntityRef(entity);

    /* Skip the preprocess step for BusinessApplication entities */
    if (
      selfRef.kind === 'BusinessApplication' ||
      !entity.metadata.annotations?.hasOwnProperty(ANNOTATION_CMDB_APPCODE)
    ) {
      return entity;
    }

    const appCode = entity.metadata.annotations[ANNOTATION_CMDB_APPCODE];

    /* Get the cached data for the appcode */
    let cachedData = await cache.get<{
      created: number;
      businessAppRef?: string;
      cmdb?: CMDBMeta | JsonValue | undefined;
    }>(appCode);

    this.logger.debug(JSON.stringify({ cachedData }, null, 2));

    /* If no cache is found, or the cache has expired, fetch the business application details */
    if (
      !cachedData ||
      (cachedData.created &&
        Date.now() - cachedData.created > PROCESSOR_CACHE_INVALIDATION_PERIOD)
    ) {
      const { token: serviceToken } = await this.auth.getPluginRequestToken({
        onBehalfOf: await this.auth.getOwnServiceCredentials(),
        targetPluginId: 'catalog',
      });

      this.logger.debug(`fetching ${appCode} from catalog`);

      const businessApp: BusinessApplicationEntity | Entity | undefined =
        await this.catalogApi.getEntityByRef(
          `businessapplication:redhat/${appCode}`,
          { token: serviceToken },
        );

      /* Update the cache with the new data */
      cachedData = {
        created: Date.now(),
        ...(businessApp
          ? {
              businessAppRef: stringifyEntityRef(businessApp),
              cmdb: businessApp.metadata.cmdb,
            }
          : {}),
      };
      await cache.set(appCode, cachedData);
      this.logger.debug(
        JSON.stringify(
          {
            newCache: cachedData,
          },
          null,
          2,
        ),
      );
    }

    /* If the businessApplication could not be found, skip */
    if (!cachedData.businessAppRef) {
      return entity;
    }

    /* Emit the relationship between the entity and businessapplication entity */
    this.doEmit(
      emit,
      selfRef,
      cachedData.businessAppRef,
      {
        defaultKind: 'businessapplication',
        defaultNamespace: 'redhat',
      },
      'inheritsFrom',
      'inheritedBy',
    );

    /* Create a new cmdb meta field for the entity */
    const inheritedProps = {
      metadata: {
        cmdb: cachedData.cmdb,
      },
    };
    return merge(entity, inheritedProps);
  }

  async postProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    const selfRef = getCompoundEntityRef(entity);

    if (entity.kind === 'BusinessApplication') {
      const businessApplication = entity as any;

      this.doEmit(
        emit,
        selfRef,
        businessApplication.spec.owner,
        { defaultKind: 'User', defaultNamespace: selfRef.namespace },
        RELATION_OWNED_BY,
        RELATION_OWNER_OF,
      );
    }

    return entity;
  }

  /**
   * A helper method to emit relationships with one or more targets
   */
  private doEmit(
    emit: CatalogProcessorEmit,
    selfRef: CompoundEntityRef,
    targets: string | string[] | undefined,
    context: { defaultKind?: string; defaultNamespace?: string },
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
}
