import {
  Entity,
  getCompoundEntityRef,
  parseEntityRef,
  RELATION_CONSUMES_API,
  RELATION_DEPENDS_ON,
  RELATION_DEPENDENCY_OF,
  RELATION_PROVIDES_API,
} from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  CatalogProcessor,
  CatalogProcessorCache,
  CatalogProcessorEmit,
  CatalogProcessorParser,
  processingResult,
} from '@backstage/plugin-catalog-node';
import { LoggerService } from '@backstage/backend-plugin-api';
import { mcpServerValidator } from './lib/validator';

export class MCPEntityProcessor implements CatalogProcessor {
  private readonly logger: LoggerService;

  constructor(options: {
    logger: LoggerService;
  }) {
    this.logger = options.logger.child({ name: this.getProcessorName() });
  }

  getProcessorName(): string {
    return 'MCPServerEntityProcessor';
  }

  async validateEntityKind(entity: Entity): Promise<boolean> {
    return mcpServerValidator.check(entity);
  }

  async readLocation?(
    location: LocationSpec,
    _optional: boolean,
    _emit: CatalogProcessorEmit,
    _parser: CatalogProcessorParser,
    _cache: CatalogProcessorCache,
  ): Promise<boolean> {
    if (location.target.match(/gitlab/g)) {
      return true;
    }
    return false;
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

      doEmit(spec.dependsOn, { defaultNamespace: selfRef.namespace }, RELATION_DEPENDS_ON, RELATION_DEPENDENCY_OF);
      doEmit(spec.providesApi, { defaultNamespace: selfRef.namespace }, RELATION_PROVIDES_API);
      doEmit(spec.consumesApi, { defaultNamespace: selfRef.namespace }, RELATION_CONSUMES_API);
    }

    return entity;
  }
}
