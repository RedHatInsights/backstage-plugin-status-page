import {
  PageWithHeader,
  Content,
  ContentHeader,
  SupportButton,
  CreateButton,
} from '@backstage/core-components';
import { useApi, configApiRef, useRouteRef } from '@backstage/core-plugin-api';
import { CatalogTable, catalogPlugin } from '@backstage/plugin-catalog';

import {
  EntityListProvider,
  CatalogFilterLayout,
  EntityKindPicker,
  EntityLifecyclePicker,
  EntityTagPicker,
  UserListPicker,
  EntityTypePicker,
  EntityNamespacePicker,
  EntityOwnerPicker,
  useEntityList,
} from '@backstage/plugin-catalog-react';
import React from 'react';
import {
  CreateWorkstreamModal,
  WorkstreamLeadPicker,
  WorkstreamPillarPicker,
  WorkstreamPortfolioPicker,
} from '@appdev-platform/backstage-plugin-workstream-automation';
import { usePermission } from '@backstage/plugin-permission-react';
import { workstreamCreatePermission } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { createTableColumnsFunc } from './createCatalogTableFunc';

const HeaderButtons = () => {
  const createComponentLink = useRouteRef(
    catalogPlugin.externalRoutes.createComponent,
  );

  const { allowed: isAllowed } = usePermission({
    permission: workstreamCreatePermission,
  });

  const {
    filters: { kind },
  } = useEntityList();

  if (kind?.value === 'workstream')
    return <>{isAllowed && <CreateWorkstreamModal />}</>;

  return (
    <>
      <CreateButton
        title="Create"
        to={createComponentLink && createComponentLink()}
      />
      <SupportButton>All your software catalog entities</SupportButton>
    </>
  );
};

export const CatalogPage = () => {
  const orgName =
    useApi(configApiRef).getOptionalString('organization.name') ?? 'Backstage';

  return (
    <PageWithHeader title={orgName} themeId="app">
      <Content>
        <EntityListProvider pagination>
          <ContentHeader title="">
            <HeaderButtons />
          </ContentHeader>
          <CatalogFilterLayout>
            <CatalogFilterLayout.Filters>
              <EntityKindPicker initialFilter="system" />
              <UserListPicker
                availableFilters={['all', 'starred']}
                initialFilter="all"
              />
              <WorkstreamLeadPicker />
              <WorkstreamPillarPicker />
              <WorkstreamPortfolioPicker />
              <EntityLifecyclePicker />
              <EntityTagPicker />
              <EntityOwnerPicker />
              <EntityTypePicker />
              <EntityLifecyclePicker />
              <EntityTagPicker />
              <EntityNamespacePicker />
            </CatalogFilterLayout.Filters>
            <CatalogFilterLayout.Content>
              <CatalogTable
                columns={createTableColumnsFunc}
                tableOptions={{
                  padding: 'dense',
                  draggable: false,
                }}
                actions={[]}
              />
            </CatalogFilterLayout.Content>
          </CatalogFilterLayout>
        </EntityListProvider>
      </Content>
    </PageWithHeader>
  );
};
