import {
  DefaultEntityFilters,
  EntityFilter,
} from '@backstage/plugin-catalog-react';
import { Entity } from '@backstage/catalog-model';

export class WorkstreamLeadFilter implements EntityFilter {
  constructor(readonly values: string[]) {}

  filterEntity(entity: Entity): boolean {
    const lead = entity.spec?.lead as string;
    return lead !== undefined && this.values.includes(lead);
  }

  getCatalogFilters(): Record<string, string | string[]> {
    return {
      'spec.lead': this.values,
    };
  }

  toQueryValue = () => this.values;
}

export class WorkstreamPillarFilter implements EntityFilter {
  constructor(readonly values: string[]) {}

  filterEntity(entity: Entity): boolean {
    const pillar = entity.spec?.pillar as string;
    return pillar !== undefined && this.values.includes(pillar);
  }

  getCatalogFilters(): Record<string, string | string[]> {
    return {
      'spec.pillar': this.values,
    };
  }

  toQueryValue = () => this.values;
}

export class WorkstreamPortfolioFilter implements EntityFilter {
  constructor(readonly values: string[]) {}

  filterEntity(entity: Entity): boolean {
    const portfolio = entity.spec?.portfolio as string[];
    return this.values.every(v => portfolio.includes(v));
  }

  getCatalogFilters(): Record<string, string | string[]> {
    return {
      'spec.portfolio': this.values,
    };
  }
  toQueryValue = () => this.values;
}

export interface ExtendedFilters extends DefaultEntityFilters {
  pillar?: WorkstreamPillarFilter;
  lead?: WorkstreamLeadFilter;
  portfolio?: WorkstreamPortfolioFilter;
}
