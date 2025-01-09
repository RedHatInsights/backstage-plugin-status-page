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
  UserWorkstreamPicker,
  WorkstreamLeadPicker,
  WorkstreamPillarPicker,
  WorkstreamPortfolioPicker,
} from '@appdev-platform/backstage-plugin-workstream-automation';
import { usePermission } from '@backstage/plugin-permission-react';
import { workstreamCreatePermission } from '@appdev-platform/backstage-plugin-workstream-automation-common';
import { createTableColumnsFunc } from './createCatalogTableFunc';
import {
  ExportCsv as exportCsv,
  ExportPdf as exportPdf,
} from '@material-table/exporters';


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
        <EntityListProvider>
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
              <UserWorkstreamPicker />
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
                  draggable: true,
                  columnsButton: true,
                  paginationPosition: 'both',
                  exportAllData: true,
                  exportMenu: [
                    {
                      label: 'Export to PDF',
                      exportFunc: (columns, renderData) =>
                        exportPdf(
                          columns,
                          renderData,
                          `pdf_${new Date().getTime()}`,
                        ),
                    },
                    {
                      label: 'Export to CSV',
                      exportFunc: (col, rData) => {
                        exportCsv(col, rData, `csv_${new Date().getTime()}`);
                      },
                    },
                  ],
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
