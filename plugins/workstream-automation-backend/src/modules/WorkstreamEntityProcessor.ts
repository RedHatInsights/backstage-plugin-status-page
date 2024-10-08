import {
  RELATION_LEAD_BY,
  RELATION_LEAD_OF,
  WorkstreamDataV1alpha1,
} from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  Entity,
  getCompoundEntityRef,
  parseEntityRef,
  RELATION_HAS_PART,
  RELATION_PART_OF,
} from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  CatalogProcessor,
  CatalogProcessorCache,
  CatalogProcessorEmit,
  CatalogProcessorParser,
  processingResult,
} from '@backstage/plugin-catalog-node';
import { kebabCase } from 'lodash';
import { WorkstreamBackendApi } from './lib/client';
import { workstreamDataV1alpha1Validator } from './lib/validator';

export class WorkstreamEntityProcessor implements CatalogProcessor {
  private readonly logger: LoggerService;
  private readonly workstreamClient: WorkstreamBackendApi;

  constructor(options: {
    logger: LoggerService;
    workstreamClient: WorkstreamBackendApi;
  }) {
    this.workstreamClient = options.workstreamClient;
    this.logger = options.logger.child({ name: this.getProcessorName() });
  }

  getProcessorName() {
    return 'WorkstreamEntityProcessor';
  }

  async validateEntityKind?(entity: Entity): Promise<boolean> {
    return workstreamDataV1alpha1Validator.check(entity);
  }

  async readLocation?(
    location: LocationSpec,
    _optional: boolean,
    emit: CatalogProcessorEmit,
    _parser: CatalogProcessorParser,
    _cache: CatalogProcessorCache,
  ): Promise<boolean> {
    if (location.target.match(/api\/workstream/g)) {
      this.logger.debug(`Reading location: ${location.target}`);
      const data = await this.workstreamClient.getWorkstreamByLocation(
        location.target,
      );
      emit(processingResult.entity(location, data));
      return true;
    }
    return false;
  }

  async postProcessEntity?(
    entity: Entity,
    location: LocationSpec,
    emit: CatalogProcessorEmit,
    _cache: CatalogProcessorCache,
  ): Promise<Entity> {
    const selfRef = getCompoundEntityRef(entity);

    if (
      entity.kind === 'Location' &&
      location.target.match(/api\/workstream/g)
    ) {
      const data = await this.workstreamClient.getWorkstreamByLocation(
        location.target,
      );
      emit(processingResult.entity(location, data));
    }
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

        // workstream entity to target entity
        emit(
          processingResult.relation({
            source: selfRef,
            target: entityRef,
            type: outgoingRelation,
          }),
        );

        // target entity to workstream
        emit(
          processingResult.relation({
            source: entityRef,
            target: selfRef,
            type: incomingRelation,
          }),
        );
      }
    }
    if (entity.kind === 'Workstream') {
      const workstreamEntity = entity as WorkstreamDataV1alpha1;
      const members = workstreamEntity.spec.members;
      members.forEach(member => {
        doEmit(
          member.userRef,
          { defaultNamespace: selfRef.namespace },
          kebabCase(member.role),
          kebabCase(member.role),
        );
      });

      const portfolios = workstreamEntity.spec.portfolio;
      portfolios.forEach(portfolio => {
        doEmit(
          portfolio,
          { defaultNamespace: selfRef.namespace },
          RELATION_HAS_PART,
          RELATION_PART_OF,
        );
      });

      doEmit(
        workstreamEntity.spec.lead,
        { defaultNamespace: selfRef.namespace },
        RELATION_LEAD_BY,
        RELATION_LEAD_OF,
      );
    }

    return entity;
  }
}
