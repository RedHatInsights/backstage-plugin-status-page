import {
  Entity,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
  getCompoundEntityRef,
  parseEntityRef,
} from '@backstage/catalog-model';
import {
  CatalogProcessor,
  CatalogProcessorEmit,
  processingResult,
} from '@backstage/plugin-catalog-node';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import { RELATION_DELEGATED_TO, RELATION_DELEGATE_OF } from './lib';

export type BusinessApplicationEntityProcessorOptions = {
  integrations: any;
};

export class BusinessApplicationEntityProcessor implements CatalogProcessor {
  /* TODO: Add JSON Schema validator for BusinessApplication entity kind */
  private readonly validator = (_entity: Entity) => true

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

  async postProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (entity.kind !== 'BusinessApplication') {
      return entity;
    }

    const selfRef = getCompoundEntityRef(entity);

    function doEmit(
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

    const businessApplication = entity as any;

    doEmit(
      businessApplication.spec.owner,
      { defaultKind: 'User', defaultNamespace: selfRef.namespace },
      RELATION_OWNED_BY,
      RELATION_OWNER_OF,
    );
    doEmit(
      businessApplication.spec.delegate,
      { defaultKind: 'User', defaultNamespace: selfRef.namespace },
      RELATION_DELEGATED_TO,
      RELATION_DELEGATE_OF,
    );

    return entity;
  }
}
