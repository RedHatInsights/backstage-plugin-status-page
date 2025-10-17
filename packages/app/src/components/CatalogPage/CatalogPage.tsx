import {
  Content,
  ContentHeader,
  CreateButton,
  LinkButton,
  PageWithHeader,
  SupportButton,
} from '@backstage/core-components';
import { configApiRef, useApi, useRouteRef } from '@backstage/core-plugin-api';
import { CatalogTable, catalogPlugin } from '@backstage/plugin-catalog';

import { FeatureFlagged } from '@backstage/core-app-api';
import {
  CatalogFilterLayout,
  EntityKindPicker,
  EntityLifecyclePicker,
  EntityListProvider,
  EntityNamespacePicker,
  EntityOwnerPicker,
  EntityTagPicker,
  EntityTypePicker,
  UserListPicker,
  useEntityList,
} from '@backstage/plugin-catalog-react';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  CreateArtModal,
  CreateWorkstreamModal,
  UserWorkstreamPicker,
  WorkstreamLeadPicker,
  WorkstreamPillarPicker,
  WorkstreamPortfolioPicker,
  WorkstreamTechLeadPicker,
} from '@compass/backstage-plugin-workstream-automation';
import {
  artCreatePermission,
  workstreamCreatePermission,
} from '@compass/backstage-plugin-workstream-automation-common';
import {
  ExportCsv as exportCsv,
  ExportPdf as exportPdf,
} from '@material-table/exporters';
import { Box } from '@material-ui/core';
import { createTableColumnsFunc } from './createCatalogTableFunc';

const HeaderButtons = () => {
  const createComponentLink = useRouteRef(
    catalogPlugin.externalRoutes.createComponent,
  );

  const { allowed: workstreamAllowed } = usePermission({
    permission: workstreamCreatePermission,
  });
  const { allowed: artAllowed } = usePermission({
    permission: artCreatePermission,
  });

  const {
    queryParameters: { kind },
    filters: { kind: filterKind },
  } = useEntityList();

  const kindValue = (filterKind?.value ?? kind)?.toString().toLocaleLowerCase();
  const CustomCreateButton = () => {
    if (kindValue === 'art' && artAllowed) {
      return (
        <Box display="flex" alignItems="center">
          <CreateArtModal />
          <FeatureFlagged with="workstream-automation-dashboard">
            <Box ml={1}>
              <LinkButton
                variant="outlined"
                color="primary"
                to="/workstream/dashboard"
              >
                Dashboard
              </LinkButton>
            </Box>
          </FeatureFlagged>
        </Box>
      );
    }
    if (kindValue === 'workstream' && workstreamAllowed) {
      return (
        <Box display="flex" alignItems="center">
          <CreateWorkstreamModal />
          <FeatureFlagged with="workstream-automation-dashboard">
            <Box ml={1}>
              <LinkButton
                variant="outlined"
                color="primary"
                to="/workstream/dashboard"
              >
                Dashboard
              </LinkButton>
            </Box>
          </FeatureFlagged>
        </Box>
      );
    }
    return (
      <CreateButton
        title="Create"
        to={createComponentLink && createComponentLink()}
      />
    );
  };

  return (
    <Box display="flex">
      <CustomCreateButton />
      <SupportButton>All your software catalog entities</SupportButton>
    </Box>
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
              <WorkstreamTechLeadPicker />
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
