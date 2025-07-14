import {
  ArtEntity,
  RELATION_LEAD_BY,
  RELATION_LEAD_OF,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  Entity,
  getCompoundEntityRef,
  parseEntityRef,
  RELATION_HAS_MEMBER,
  RELATION_HAS_PART,
  RELATION_MEMBER_OF,
  RELATION_CHILD_OF,
  RELATION_OWNED_BY,
  RELATION_OWNER_OF,
  RELATION_PARENT_OF,
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
import { artEntityValidator, workstreamEntityValidator } from './lib/validator';

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
    if (entity.kind === 'ART') return workstreamEntityValidator.check(entity);
    else if (entity.kind === 'Workstream')
      return artEntityValidator.check(entity);
    return false;
  }

  async readLocation?(
    location: LocationSpec,
    _optional: boolean,
    _emit: CatalogProcessorEmit,
    _parser: CatalogProcessorParser,
    _cache: CatalogProcessorCache,
  ): Promise<boolean> {
    if (location.target.match(/api\/workstream/g)) {
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
      let data: WorkstreamEntity | ArtEntity;
      if (location.target.match(/api\/workstream\/art/g))
        data = await this.workstreamClient.getArtByLocation(location.target);
      else
        data = await this.workstreamClient.getWorkstreamByLocation(
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

    if (entity.kind === 'ART') {
      const artEntity = entity as ArtEntity;
      this.logger.debug(
        `Creating relations for ${artEntity.metadata.name} ART`,
      );
      const members = artEntity.spec.members;
      members.forEach(member => {
        doEmit(
          member.userRef,
          { defaultNamespace: selfRef.namespace },
          kebabCase(member.role),
          kebabCase(member.role),
        );
        doEmit(
          member.userRef,
          { defaultNamespace: selfRef.namespace },
          RELATION_HAS_MEMBER,
          RELATION_MEMBER_OF,
        );
      });

      const workstreams = artEntity.spec.workstreams;
      workstreams.forEach(ws =>
        doEmit(
          ws,
          { defaultNamespace: selfRef.namespace },
          RELATION_PARENT_OF,
          RELATION_CHILD_OF,
        ),
      );

      doEmit(
        artEntity.spec.rte,
        { defaultNamespace: selfRef.namespace },
        'release-train-engineer',
        'release-train-engineer',
      );
      doEmit(
        artEntity.spec.rte,
        { defaultNamespace: selfRef.namespace },
        RELATION_OWNED_BY,
        RELATION_OWNER_OF,
      );
    }

    if (entity.kind === 'Workstream') {
      const workstreamEntity = entity as WorkstreamEntity;
      this.logger.debug(
        `Creating relations for ${workstreamEntity.metadata.name} workstream.`,
      );
      const members = workstreamEntity.spec.members;
      members.forEach(member => {
        doEmit(
          member.userRef,
          { defaultNamespace: selfRef.namespace },
          kebabCase(member.role),
          kebabCase(member.role),
        );
        doEmit(
          member.userRef,
          { defaultNamespace: selfRef.namespace },
          RELATION_HAS_MEMBER,
          RELATION_MEMBER_OF,
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
      doEmit(
        workstreamEntity.spec.lead,
        { defaultNamespace: selfRef.namespace },
        RELATION_HAS_MEMBER,
        RELATION_MEMBER_OF,
      );
    }

    return entity;
  }
}
