import React, { useEffect, useState } from 'react';
import 'react-toastify/dist/ReactToastify.min.css';
import {
  Header,
  Page,
  Content,
  ContentHeader,
  HeaderLabel,
} from '@backstage/core-components';

import { ProxyList } from '../ProxyList';
import { Loader } from '../../utils/Loader';
import { Bounce, ToastContainer } from 'react-toastify';
import { Typography } from '@material-ui/core';
import OpenInNew from '@material-ui/icons/OpenInNew';
import { useApi } from '@backstage/core-plugin-api';
import { oauth2ApiRef } from '../../plugin';
import 'react-toastify/dist/ReactToastify.min.css';

declare global {
  interface Window {
    sessionjs: any;
  }
}

export const ContainerComponent = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const oauth2Api = useApi(oauth2ApiRef);

  useEffect(() => {
    oauth2Api.getAccessToken().then(accessToken => {
      if (accessToken) {
        setAuthenticated(true);
      }
    });
  }, [oauth2Api]);

  return (
    <Page themeId="tool">
      <Header
        pageTitleOverride='Proxy Manager'
        title={
          <a
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
            }}
            href="https://one.redhat.com/hydra-manager/#/proxy"
          >
            <Typography variant="h4">Hydra Proxy</Typography>
            <OpenInNew style={{ fontSize: 14, marginLeft: '0.25rem' }} />
          </a>
        }
        subtitle="Manage your Proxies with Hydra Proxy Manager"
      >
        <HeaderLabel label="Owner" value="Team Hydra" />

        <HeaderLabel label="Mail" value="hydra-dev@redhat.com" />
      </Header>
      <Content>
        <ContentHeader title="" />
        {authenticated ? <ProxyList /> : <Loader message="Authenticating" />}
        <ToastContainer transition={Bounce} />
      </Content>
    </Page>
  );
};
