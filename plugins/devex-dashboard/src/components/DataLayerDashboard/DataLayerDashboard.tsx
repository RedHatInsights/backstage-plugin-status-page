import React, { useEffect, useState } from 'react';
import { Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import { LinearProgress } from '@material-ui/core';
import { useApi } from '@backstage/core-plugin-api';
import { devexApiRef } from '../../api';
import { RequestPerClientLineChart } from './RequestsPerClientLineChart';
import { SubgraphsDeveloped } from './SubgraphsDeveloped';
import { KeyValue } from '../../Interfaces';

export const DataLayerDashboard = () => {
  const splunk = useApi(devexApiRef);
  const [selectedSubgraph, setSelectedSubgraph] = useState<string>('');
  const [subgraphs, setSubgraphs] = useState<KeyValue>();
  const [clientRequestData, setClientRequestData] = useState<KeyValue[]>();
  const [loadingData, setLoading] = useState(false);

  const fetchSplunkData = async () => {
    try {
      const data = await splunk.getSplunkDataBySubgraph(selectedSubgraph);
      if (data && data?.data?.searchData) {
        setClientRequestData(JSON.parse(data?.data?.searchData).data);
        setLoading(false);
      } else {
        setClientRequestData([]);
        setLoading(false);
      }
    } catch (_err) {
      setLoading(false);
    }
  };

  const formatSubgraphNameFromIndex = (subgraphIndex: string) => {
    const stringArray = subgraphIndex.split('-');
    let subgraphNameBuildUp = '';
    stringArray.forEach((word: string) => {
      if (!['rhg', 'subgraph'].includes(word)) {
        const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);
        subgraphNameBuildUp = subgraphNameBuildUp
          ? `${subgraphNameBuildUp} ${capitalizedWord}`
          : capitalizedWord;
      }
    });

    return subgraphNameBuildUp;
  };

  const fetchSubgraphNames = async () => {
    try {
      setLoading(true);
      const storedSubgraphData = await splunk.getSplunkSubgraphs();
      if (storedSubgraphData && storedSubgraphData?.data?.searchData) {
        const subgraphIndexes = JSON.parse(
          storedSubgraphData?.data?.searchData,
        ).data.map((data: KeyValue) => {
          return Object.values(data)[0];
        });
        if (subgraphIndexes.length) {
          let subgraphNameToIndexMap: KeyValue = {};
          subgraphIndexes.forEach((subgraphIndex: string) => {
            subgraphNameToIndexMap = {
              ...subgraphNameToIndexMap,
              [subgraphIndex]: formatSubgraphNameFromIndex(subgraphIndex),
            };
          });

          const sortedEntries = Object.entries(subgraphNameToIndexMap).sort(
            ([, valueA], [, valueB]) => valueA.localeCompare(valueB),
          );
          const sortedSubgraphNameToIndexMap =
            Object.fromEntries(sortedEntries);
          setSubgraphs(sortedSubgraphNameToIndexMap);
          setSelectedSubgraph(Object.keys(sortedSubgraphNameToIndexMap)[0]);
        }
      }
    } catch (_err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubgraphNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSubgraph) {
      setLoading(true);
      fetchSplunkData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubgraph]);

  return (
    <Page themeId="tool">
      <Header
        title="Data layer Dashboard"
        subtitle="Data layer Analytics Dashboard"
      >
        <HeaderLabel label="Owner" value="Team DevEx" />
      </Header>
      <Content>
        {subgraphs && clientRequestData ? (
          <>
            <SubgraphsDeveloped subgraphsRawData={subgraphs} />
            <RequestPerClientLineChart
              subgraphs={subgraphs}
              statistics={clientRequestData}
              fetchStatsForSubgraph={subgraphName =>
                setSelectedSubgraph(subgraphName)
              }
              loading={!(clientRequestData && !loadingData && subgraphs)}
            />
          </>
        ) : (
          <LinearProgress />
        )}
      </Content>
    </Page>
  );
};
