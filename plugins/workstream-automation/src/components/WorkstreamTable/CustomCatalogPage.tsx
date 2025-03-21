import { workstreamCreatePermission } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import {
  Content,
  ContentHeader,
  PageWithHeader,
  SupportButton,
} from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { CatalogTable } from '@backstage/plugin-catalog';
import {
  CatalogFilterLayout,
  EntityKindPicker,
  EntityLifecyclePicker,
  EntityListProvider,
  EntityTagPicker,
  UserListPicker,
} from '@backstage/plugin-catalog-react';
import { usePermission } from '@backstage/plugin-permission-react';
import React from 'react';
import { CreateWorkstreamModal } from '../CreateWorkstreamModal/CreateWorkstreamModal';
import { columnFactories } from './workstreamColumns';

export const CustomCatalogPage = () => {
  const orgName =
    useApi(configApiRef).getOptionalString('organization.name') ?? 'Backstage';

  const { allowed: isAllowed } = usePermission({
    permission: workstreamCreatePermission,
  });

  return (
    <PageWithHeader title={orgName} themeId="app">
      <Content>
        <EntityListProvider pagination>
          <ContentHeader title="">
            {isAllowed && <CreateWorkstreamModal />}
            <SupportButton>All your software catalog entities</SupportButton>
          </ContentHeader>
          <CatalogFilterLayout>
            <CatalogFilterLayout.Filters>
              <EntityKindPicker hidden initialFilter="workstream" />
              <UserListPicker
                availableFilters={['all', 'starred']}
                initialFilter="all"
              />
              <EntityLifecyclePicker />
              <EntityTagPicker />
            </CatalogFilterLayout.Filters>
            <CatalogFilterLayout.Content>
              <CatalogTable
                columns={createColumnsFunc}
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

export function createColumnsFunc() {
  return [
    columnFactories.createNameColumn(),
    columnFactories.createLeadColumn(),
    columnFactories.createPillarColumn(),
    columnFactories.createJiraProjectKeyColumn(),
    columnFactories.createMembersColumn(),
    columnFactories.createActionsColumn(),
  ];
}

export const workstreamColumns = [
  columnFactories.createTitleColumn({ hidden: true }),
  columnFactories.createNameColumn({ defaultKind: 'workstream' }),
  columnFactories.createLeadColumn(),
  columnFactories.createPillarColumn(),
  columnFactories.createJiraProjectKeyColumn(),
  columnFactories.createTechLeadColumn(),
  columnFactories.createSEColumn(),
  columnFactories.createQEColumn(),
  columnFactories.createMembersColumn(),
  columnFactories.createActionsColumn(),
];
