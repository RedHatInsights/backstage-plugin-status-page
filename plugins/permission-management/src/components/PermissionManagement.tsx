import {
  Content,
  Header,
  HeaderLabel,
  Page,
} from '@backstage/core-components';
import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import { Grid, LinearProgress } from '@material-ui/core';
import { useEffect, useState } from 'react';
import { permissionManagementApiRef } from '../api';
import { oauth2ApiRef } from '../plugin';
import { PermissionManagementComponent } from './Admin';
import { PermissionUserTable } from './User/PermissionUserTable';
import { parseEntityRef } from '@backstage/catalog-model';

export const PermissionManagement = () => {
  const identityApi = useApi(identityApiRef);
  const oauth2Api = useApi(oauth2ApiRef);
  const permissionApi = useApi(permissionManagementApiRef);

  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const token = await oauth2Api.getAccessToken();
        if (!token) return;

        const identity = await identityApi.getBackstageIdentity();
      
        const payload = JSON.parse(atob(token.split('.')[1]));
        const identityName = parseEntityRef(identity.userEntityRef).name;
        const userId = identityName !== 'guest' ? identityName : payload.uid;

        // TODO : to be read from the catalog
        const result = await permissionApi.checkUserAccessStatus(
          'hydra-notifications-escalation-forecaster',
          userId,
        );

        setIsOwner(result.isOwner === true);
      } catch (error) {
        setIsOwner(false);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [identityApi, oauth2Api, permissionApi]);

  if (loading) {
    return (
      <Page themeId="tool">
        <Header title="Escalation Forecaster - Permission Management">
          <HeaderLabel label="Maintainer" value="AppDev" />
          <HeaderLabel label="Lifecycle" value="Alpha" />
        </Header>
        <Content>
          <LinearProgress />
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header
        title="Escalation Forecaster - Permission Management"
        subtitle={
          isOwner
            ? 'Admin dashboard to review and manage user access requests'
            : 'View your submitted access requests and their status'
        }
      >
        <HeaderLabel label="Maintainer" value="AppDev" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <Grid container spacing={3} direction="column">
          <Grid item>
            {isOwner ? <PermissionManagementComponent /> : <PermissionUserTable />}
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
