import React from 'react';
import { Entity } from '@backstage/catalog-model';
import UserIcon from '@material-ui/icons/PersonOutline';
import GroupIcon from '@material-ui/icons/PeopleOutline';
import WebsiteIcon from '@material-ui/icons/Web';
import ServiceIcon from '@material-ui/icons/MemoryOutlined';
import DomainIcon from '@material-ui/icons/DomainOutlined';
import ExtensionIcon from '@material-ui/icons/ExtensionOutlined';
import LocationIcon from '@material-ui/icons/LocationSearchingOutlined';
import SystemIcon from '@material-ui/icons/CollectionsBookmarkOutlined';
import TemplateIcon from '@material-ui/icons/QueuePlayNextOutlined';
import CodeIcon from '@material-ui/icons/CodeOutlined';
import ResourceIcon from '@material-ui/icons/AccountTreeOutlined';
import { GraphQLIcon } from './icons/graphql';
import { OpenAPIIcon } from './icons/openapi';

const getComponentIcon = (componentType: string) => {
  if (componentType === 'website') {
    return <WebsiteIcon />;
  } else if (componentType === 'service') {
    return <ServiceIcon />;
  }
  return <ExtensionIcon />;
};

const getAPIIcon = (apiType: string) => {
  if (apiType === 'graphql') {
    return <GraphQLIcon />;
  } else if (apiType === 'openapi') {
    return <OpenAPIIcon />;
  }
  return <CodeIcon />
};

export const getEntityIcon = (entity: Pick<Entity, 'kind' | 'spec'>) => {
  if (entity.kind === 'Component') {
    return getComponentIcon(entity.spec!.type!.toString());
  } else if (entity.kind === 'API') {
    return getAPIIcon(entity.spec!.type!.toString());
  } else if (entity.kind === 'User') {
    return <UserIcon />;
  } else if (entity.kind === 'Group') {
    return <GroupIcon />;
  } else if (entity.kind === 'Location') {
    return <LocationIcon />;
  } else if (entity.kind === 'Domain') {
    return <DomainIcon />;
  } else if (entity.kind === 'System') {
    return <SystemIcon />;
  } else if (entity.kind === 'Template') {
    return <TemplateIcon />;
  } else if (entity.kind === 'Resource') {
    return <ResourceIcon />;
  }
  return <></>;
};
