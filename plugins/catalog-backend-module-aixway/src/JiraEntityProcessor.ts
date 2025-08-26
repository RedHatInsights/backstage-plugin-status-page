import {
  CatalogProcessor,
  CatalogProcessorEmit,
} from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import { LoggerService, DiscoveryService } from '@backstage/backend-plugin-api';
import { JiraClient } from './lib/client';

const XEAIXWAY_INITIATIVE_ANNOTATION = 'xeaixway/initiative';

export class JiraEntityProcessor implements CatalogProcessor {
  private readonly logger: LoggerService;
  private readonly jiraClient: JiraClient;

  constructor(options: {
    discovery: DiscoveryService;
    logger: LoggerService;
  }) {
    this.logger = options.logger;
    this.jiraClient = new JiraClient({
      discovery: options.discovery,
      logger: this.logger,
    });
  }

  getProcessorName(): string {
    return 'JiraEntityProcessor';
  }

  async preProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    _emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    // Only process entities with xeaixway/initiative annotation
    const initiativeKey = entity.metadata.annotations?.[XEAIXWAY_INITIATIVE_ANNOTATION];
    
    if (!initiativeKey) {
      return entity;
    }

    try {
      const enrichedEntity = await this.enrichEntityWithJiraData(entity, initiativeKey);
      return enrichedEntity;
    } catch (error) {
      this.logger.error(`Failed to process xeaixway initiative ${initiativeKey} for entity ${entity.metadata.name}:`, error as Error);
      return entity; // Return original entity if enrichment fails
    }
  }

  private async enrichEntityWithJiraData(entity: Entity, initiativeKey: string): Promise<Entity> {
    this.logger.info(`Enriching entity ${entity.metadata.name} with JIRA initiative ${initiativeKey}`);

    const jiraIssue = await this.jiraClient.getIssue(initiativeKey);
    
    if (!jiraIssue) {
      this.logger.warn(`JIRA issue ${initiativeKey} not found for xeaixway initiative`);
      return entity;
    }

    // Determine phase from components (prioritizing PRE-ALPHA, ALPHA, BETA, GA)
    const priorityPhases = ['PRE-ALPHA', 'ALPHA', 'BETA', 'GA'];
    let phase = undefined;
    let componentsForTags: string[] = [];

    if (jiraIssue.fields.components && jiraIssue.fields.components.length > 0) {
      const componentNames = jiraIssue.fields.components.map(c => c.name);
      
      const foundPriorityPhase = componentNames
        .filter(name => priorityPhases.includes(name.toUpperCase()))
        .reduce((highest, current) => {
          const currentIndex = priorityPhases.indexOf(current.toUpperCase());
          const highestIndex = highest ? priorityPhases.indexOf(highest.toUpperCase()) : -1;
          return currentIndex > highestIndex ? current : highest;
        }, undefined as string | undefined);
      
      if (foundPriorityPhase) {
        phase = foundPriorityPhase.toUpperCase();
        componentsForTags = componentNames.filter(name =>
          !priorityPhases.includes(name.toUpperCase())
        );
      } else {
        phase = componentNames[0];
        componentsForTags = componentNames.slice(1);
      }
    }

    // Create enriched entity with JIRA data in metadata
    const enrichedEntity: Entity = {
      ...entity,
      metadata: {
        ...entity.metadata,
        // Add JIRA data to metadata for UI consumption (following CMDB pattern)
        xeaixway: {
          id: jiraIssue.key,
          summary: jiraIssue.fields.summary,
          phase: phase,
          assignee: jiraIssue.fields.assignee?.displayName,
          owner: jiraIssue.fields.assignee?.displayName,
          ownerEmail: jiraIssue.fields.assignee?.emailAddress,
          status: jiraIssue.fields.status.name,
          tags: componentsForTags,
          url: `https://issues.redhat.com/browse/${jiraIssue.key}`,
        },
      },
    };

    this.logger.info(`Updated enriched entity ${entity.metadata.name} with JIRA data from ${initiativeKey}`);
    return enrichedEntity;
  }
}