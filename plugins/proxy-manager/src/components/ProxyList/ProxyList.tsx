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
import TablePagination from '@material-ui/core/TablePagination';
import { ToastContainer } from 'react-toastify';
import Search from '@material-ui/icons/Search';
import { configApiRef, useAnalytics, useApi } from '@backstage/core-plugin-api';
import { oauth2ApiRef } from '../../plugin';
import { useDebounce } from 'react-use';

export const ProxyList = () => {
  const oauth2Api = useApi(oauth2ApiRef);
  const configApi = useApi(configApiRef);
  const analytics = useAnalytics();
  const [searchValue, setSearchValue] = useState('');
  const [proxyBackup, setProxyBackup] = useState<any>([]);
  const [proxies, setProxies] = useState<any>([]);
  const [pageVariables, setPageVariable] = useState({
    loadingProxy: false,
    page: 1,
    rowPerPage: 10,
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
    async (token: string) => {
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

  useDebounce(
    () => {
      setPageVariable({
        ...pageVariables,
        page: 1,
      });
      if (!searchValue) {
        setProxies(proxyBackup);
      } else {
        setProxies(
          [...proxyBackup].filter((proxy: any) => {
            if (
              proxy?.baseUrl
                ?.toLowerCase()
                .includes(searchValue.toLowerCase()) ||
              proxy?.upstreamHost
                ?.toLowerCase()
                .includes(searchValue.toLowerCase()) ||
              proxy?.authenticationType
                ?.toLowerCase()
                .includes(searchValue.toLowerCase()) ||
              proxy?.createdBy
                ?.toLowerCase()
                .includes(searchValue.toLowerCase()) ||
              ('internal'.includes(searchValue.toLowerCase()) &&
                proxy?.isInternal) ||
              ('external'.includes(searchValue.toLowerCase()) &&
                !proxy?.isInternal) ||
              ('enabled'.includes(searchValue.toLowerCase()) &&
                proxy?.isActive) ||
              ('disabled'.includes(searchValue.toLowerCase()) &&
                !proxy?.isActive)
            ) {
              return true;
            }
            return false;
          }),
        );
        analytics.captureEvent('search', searchValue);
      }
    },
    250,
    [searchValue],
  );

  const filterProxies = (query: string) => {
    setSearchValue(query);
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
            <Typography component="div" variant="body1">
              <div
                style={{
                  margin: 'auto',
                  justifyContent: 'flex-end',
                  display: 'flex',
                }}
              >
                <TablePagination
                  component="div"
                  count={proxies.length}
                  page={pageVariables.page - 1}
                  onPageChange={(_, num) => {
                    setPageVariable({ ...pageVariables, page: num + 1 });
                    analytics.captureEvent(
                      'paginate',
                      `page: ${num + 1}, size: ${pageVariables.rowPerPage}`,
                    );
                  }}
                  rowsPerPage={pageVariables.rowPerPage}
                  onRowsPerPageChange={event => {
                    setPageVariable({
                      ...pageVariables,
                      rowPerPage: parseInt(event.target.value, 10),
                      page: 1,
                    });
                    analytics.captureEvent(
                      'paginate',
                      `page: ${pageVariables.page}, size: ${parseInt(
                        event.target.value,
                        10,
                      )}`,
                    );
                  }}
                />
              </div>
              <Table>
                <TableHead>
                  <TableRow
                    style={{ backgroundColor: 'black', color: 'white' }}
                  >
                    {tableColumns?.map(name => {
                      return (
                        <TableCell
                          key={`${name}-cell`}
                          style={{ color: 'white' }}
                        >
                          {name}
                        </TableCell>
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
                      if (
                        index >
                          (pageVariables.page - 1) * pageVariables.rowPerPage -
                            1 &&
                        index < pageVariables.page * pageVariables.rowPerPage
                      )
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
                              {proxy?.authenticationType || 'N/A'}
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
                      return null;
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
              <div
                style={{
                  margin: 'auto',
                  justifyContent: 'flex-end',
                  display: 'flex',
                }}
              >
                <TablePagination
                  component="div"
                  count={proxies.length}
                  page={pageVariables.page - 1}
                  onPageChange={(_, num) => {
                    setPageVariable({ ...pageVariables, page: num + 1 });
                    analytics.captureEvent(
                      'paginate',
                      `page: ${num + 1}, size: ${pageVariables.rowPerPage}`,
                    );
                  }}
                  rowsPerPage={pageVariables.rowPerPage}
                  onRowsPerPageChange={event => {
                    setPageVariable({
                      ...pageVariables,
                      rowPerPage: parseInt(event.target.value, 10),
                      page: 1,
                    });
                    analytics.captureEvent(
                      'paginate',
                      `page: ${pageVariables.page}, size: ${parseInt(
                        event.target.value,
                        10,
                      )}`,
                    );
                  }}
                />
              </div>
            </Typography>
          </InfoCard>
        </Grid>
      </Grid>
      <ToastContainer />
    </>
  );
};
