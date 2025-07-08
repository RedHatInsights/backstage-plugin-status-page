import {
  Entity,
  getCompoundEntityRef,
  parseEntityRef,
  RELATION_CONSUMES_API,
  RELATION_DEPENDS_ON,
  RELATION_DEPENDENCY_OF,
  RELATION_PROVIDES_API,
  DEFAULT_NAMESPACE,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
} from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  CatalogProcessor,
  CatalogProcessorCache,
  CatalogProcessorEmit,
  processingResult,
} from '@backstage/plugin-catalog-node';
import { LoggerService } from '@backstage/backend-plugin-api';
import { mcpServerValidatorAlpha, mcpServerValidatorBeta } from './lib/validator';

export class MCPServerProcessor implements CatalogProcessor {
  private readonly logger: LoggerService;

  constructor(options: { logger: LoggerService }) {
    this.logger = options.logger.child({ name: this.getProcessorName() });
  }

  getProcessorName(): string {
    return 'MCPServerEntityProcessor';
  }

  async validateEntityKind(entity: Entity): Promise<boolean> {
    return mcpServerValidatorAlpha.check(entity) || mcpServerValidatorBeta.check(entity);
  }

  async postProcessEntity(
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
      incomingRelation?: string,
    ) {
      if (!targets) return;
      for (const target of [targets].flat()) {
        const entityRef = parseEntityRef(target, context);

        emit(
          processingResult.relation({
            source: selfRef,
            target: entityRef,
            type: outgoingRelation,
          }),
        );

        if (incomingRelation) {
          emit(
            processingResult.relation({
              source: entityRef,
              target: selfRef,
              type: incomingRelation,
            }),
          );
        }
      }
    }

    if (entity.kind === 'MCPServer') {
      const spec = entity.spec as any;

      this.logger.debug(
        `Emitting relations for MCPServer entity: ${entity.metadata.name}`,
      );

      doEmit(
        spec.owner,
        { defaultNamespace: DEFAULT_NAMESPACE },
        RELATION_OWNED_BY,
        RELATION_OWNER_OF,
      );
      doEmit(
        spec.dependsOn,
        { defaultNamespace: selfRef.namespace },
        RELATION_DEPENDS_ON,
        RELATION_DEPENDENCY_OF,
      );
      doEmit(
        spec.providesApi,
        { defaultNamespace: selfRef.namespace },
        RELATION_PROVIDES_API,
      );
      doEmit(
        spec.consumesApi,
        { defaultNamespace: selfRef.namespace },
        RELATION_CONSUMES_API,
      );
    }

    return entity;
  }
}
