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
} from './lib';
import { BusinessApplicationEntity } from './lib/types';

export class BusinessApplicationEntityProcessor implements CatalogProcessor {
  /* TODO: Add JSON Schema validator for BusinessApplication entity kind */
  private readonly validator = (_entity: Entity) => true;

  constructor(private catalog: CatalogClient) {}

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
    _cache: CatalogProcessorCache,
  ): Promise<Entity> {
    const selfRef = getCompoundEntityRef(entity);

    if (entity.metadata.annotations?.hasOwnProperty(ANNOTATION_CMDB_APPCODE)) {
      const appCode = entity.metadata.annotations[ANNOTATION_CMDB_APPCODE];

      const businessApp: BusinessApplicationEntity | Entity | undefined =
        await this.catalog.getEntityByRef(
          `businessapplication:redhat/${appCode}`,
        );

      if (businessApp) {
        const inheritedProps = {
          metadata: {
            cmdb: businessApp.metadata.cmdb,
          },
        };

        this.doEmit(
          emit,
          selfRef,
          stringifyEntityRef(businessApp),
          {
            defaultKind: 'businessapplication',
            defaultNamespace: 'redhat',
          },
          'inheritsFrom',
          'inheritedBy',
        );

        return merge(entity, inheritedProps);
      }
    }

    return entity;
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
