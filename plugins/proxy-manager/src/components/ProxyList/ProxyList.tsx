/* eslint-disable no-nested-ternary */
import React, { useCallback, useEffect, useState } from 'react';

import { InfoCard } from '@backstage/core-components';
import {
  Grid,
  Table,
  TableHead,
  TableRow,
  Typography,
  TableCell,
  TableBody,
  Chip,
} from '@material-ui/core';
import { fetchAll } from '../../apis/ProxyFetch';
import './proxy-list.css';
import { Skeleton } from '@material-ui/lab';
import { ToastContainer } from 'react-toastify';
import Search from '@material-ui/icons/Search';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { oauth2ApiRef } from '../../plugin';

export const ProxyList = () => {
  const oauth2Api = useApi(oauth2ApiRef);
  const configApi = useApi(configApiRef);
  const [proxyBackup, setProxyBackup] = useState<any>([]);
  const [proxies, setProxies] = useState<any>([]);
  const [pageVariables, setPageVariable] = useState({
    loadingProxy: false,
  });

  const tableColumns = [
    'URL Suffix',
    'Destination URL',
    'Authentication',
    'Proxy Type',
    'Status',
    'Owner',
  ];

  const getAllProxies = useCallback(
    async token => {
      const apiBaseUrl = configApi.getString('proxyManager.apiBaseUrl');

      try {
        setPageVariable(variables => ({ ...variables, loadingProxy: true }));
        const response = await fetchAll(apiBaseUrl, token);
        if (response) {
          setProxies(response);
          setProxyBackup(response);
        } else {
          setProxies([]);
          setProxyBackup([]);
        }
        setPageVariable(variables => ({ ...variables, loadingProxy: false }));
      } catch (err) {
        setPageVariable(variables => ({ ...variables, loadingProxy: true }));
      }
    },
    [configApi],
  );

  const filterProxies = (query: string) => {
    if (!query) {
      setProxies(proxyBackup);
    } else {
      setProxies(
        [...proxyBackup].filter((proxy: any) => {
          return proxy?.baseUrl?.includes(query);
        }),
      );
    }
  };

  useEffect(() => {
    oauth2Api.getAccessToken().then(accessToken => {
      getAllProxies(accessToken);
    });
  }, [getAllProxies, oauth2Api]);

  return (
    <>
      <Grid container spacing={3} direction="column">
        <Grid item>
          <InfoCard>
            <div className="card-title">
              <div className="list-proxy-title"> List of Proxies </div>
              <div className="search-input">
                <input
                  type="text"
                  placeholder="search proxy"
                  onChange={event => filterProxies(event.target.value)}
                />
                <Search />
              </div>
            </div>
            <Typography variant="body1">
              <Table>
                <TableHead>
                  <TableRow
                    style={{ backgroundColor: 'black', color: 'white' }}
                  >
                    {tableColumns?.map(name => {
                      return (
                        <TableCell style={{ color: 'white' }}>{name}</TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageVariables.loadingProxy ? (
                    Array(3)
                      .fill(0)
                      .map((_, index) => {
                        return (
                          <TableRow key={`${index}-skeleton`}>
                            <TableCell align="left" colSpan={8}>
                              <Skeleton width="100%" height={50} />
                            </TableCell>
                          </TableRow>
                        );
                      })
                  ) : proxies && proxies.length ? (
                    proxies?.map((proxy: any, index: number) => {
                      return (
                        <TableRow key={index}>
                          <TableCell align="left" width="15%">
                            <span style={{ fontWeight: 'bold' }}>
                              {proxy?.baseUrl}
                            </span>
                          </TableCell>
                          <TableCell align="left" width="25%">
                            {proxy?.upstreamHost}
                          </TableCell>
                          <TableCell align="left" width="15%">
                            {proxy?.authenticationType}
                          </TableCell>
                          <TableCell align="left" width="10%">
                            {proxy?.isInternal ? 'Internal' : 'External'}
                          </TableCell>
                          <TableCell align="left" width="10%">
                            <Chip
                              label={proxy?.isActive ? 'Enabled' : 'Disabled'}
                              color={proxy?.isActive ? 'primary' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="left" width="10%">
                            {proxy?.createdBy}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell align="center" colSpan={8}>
                        No Proxies
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Typography>
          </InfoCard>
        </Grid>
      </Grid>
      <ToastContainer />
    </>
  );
};
