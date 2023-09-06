import { Entity } from '@backstage/catalog-model';
import { Dispatch, SetStateAction } from 'react';

type PropertyValue = {
  _text: string;
};

export type EntityProps = {
  /** @deprecated The entity is now grabbed from context instead */
  entity?: Entity;
};

export type SelectorsProps = {
  projectKey: string;
  statusesNames: Array<string>;
  setStatusesNames: Dispatch<SetStateAction<Array<string>>>;
  fetchProjectInfo: () => Promise<any>;
};

export type IssueType = {
  name: string;
  iconUrl: string;
};

export type IssuesCounter = {
  total: number;
  name: string;
  iconUrl: string;
};

export type ActivityProperties =
  | 'updated'
  | 'title'
  | 'id'
  | 'summary'
  | 'content';

export type ActivityStreamElement = {
  id: string;
  time: {
    elapsed: string;
    value: string;
  };
  title: string;
  icon?: {
    url: string;
    title: string;
  };
  summary?: string;
  content?: string;
};

export type ActivityStreamKeys =
  | 'updated'
  | 'title'
  | 'summary'
  | 'content'
  | 'id';

export type ActivityStream = {
  feed: {
    entry: ActivityStreamEntry[];
  };
};

export type ActivityStreamEntry = {
  updated: PropertyValue;
  title: PropertyValue;
  summary: PropertyValue;
  content: PropertyValue;
  id: PropertyValue;
  link?: Array<{
    _attributes: {
      href: string;
      title: string;
      rel: string;
    };
  }>;
};

export type Project = {
  name: string;
  avatarUrls: {
    [key: string]: string;
  };
  issueTypes: Array<{
    name: string;
    iconUrl: string;
  }>;
  self: string;
  url: string;
  projectTypeKey: string;
};

export type ProjectDetailsProps = {
  name: string;
  type: string;
  iconUrl: string;
};

export type Status = {
  statuses: Array<{ name: string; statusCategory: { name: string } }>;
};

export type IssueCountSearchParams = {
  startAt: number;
  maxResults: number;
  total: number;
  issues: Ticket[];
};

export type Ticket = {
  key: string;
  fields: {
    issuetype: {
      iconUrl: string;
      name: string;
    };
    summary: string;
    assignee: {
      displayName: string;
      avatarUrls: {
        [key: string]: string;
      };
    };
    status: {
      name: string;
    };
    updated: Date;
    created: Date;
    priority: {
      iconUrl: string;
      name: string;
    };
  };
};

export type IssueCountResult = {
  next: number | undefined;
  issues: Ticket[];
};
