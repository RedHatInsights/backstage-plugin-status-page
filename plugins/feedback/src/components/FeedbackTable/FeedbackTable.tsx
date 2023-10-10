import {
  Chip,
  Link,
  Paper,
  TableContainer,
  Typography,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { parseEntityRef } from '@backstage/catalog-model';
import {
  EntityRefLink,
  EntityPeekAheadPopover,
} from '@backstage/plugin-catalog-react';
import { FeedbackModel } from '../../models/feedback.model';
import { useApi } from '@backstage/core-plugin-api';
import { feedbackApiRef } from '../../api';
import {
  SubvalueCell,
  Table,
  TableColumn,
  useQueryParamState,
} from '@backstage/core-components';
import TextsmsOutlined from '@material-ui/icons/TextsmsOutlined';
import '@material-ui/icons/BugReportOutlined';
import BugReportOutlined from '@material-ui/icons/BugReportOutlined';

export const FeedbackTable: React.FC<{ projectId?: string }> = (props: {
  projectId?: string;
}) => {
  const projectId = props.projectId ? props.projectId : 'all';
  const api = useApi(feedbackApiRef);
  const [feedbackData, setFeedbackData] = useState<FeedbackModel[]>([]);
  const [tableConfig, setTableConfig] = useState({
    totalFeedbacks: 100,
    page: 1,
    pageSize: 5,
  });
  const [queryState, setQueryState] = useQueryParamState<string>('id');
  const [isLoading, setLoading] = useState(true);

  const columns: TableColumn[] = [
    {
      width: '1%',
      field: 'feedbackType',
      title: 'Type',
      render: (row: any) => {
        const data: FeedbackModel = row;
        return data.feedbackType === 'BUG' ? (
          <BugReportOutlined color="secondary" key={data.feedbackType} />
        ) : (
          <TextsmsOutlined color="primary" key={data.feedbackType} />
        );
      },
    },
    {
      field: 'summary',
      title: 'Summary',
      render: (row: any) => {
        const data: FeedbackModel = row;
        return (
          <SubvalueCell
            value={
              <Typography variant="h6">
                {data.summary.length > 100
                  ? `${data.summary.substring(
                      0,
                      data.summary.lastIndexOf(' ', 100),
                    )}...`
                  : data.summary}
              </Typography>
            }
            subvalue={
              <EntityPeekAheadPopover entityRef={data.createdBy}>
                Submitted by&nbsp;
                <EntityRefLink entityRef={data.createdBy}>
                  {parseEntityRef(data.createdBy).name}
                </EntityRefLink>
              </EntityPeekAheadPopover>
            }
          />
        );
      },
    },
    {
      field: 'projectId',
      title: 'Project',
      render: (row: any) => {
        const data: FeedbackModel = row;
        return (
          <EntityRefLink entityRef={data.projectId}>
            {parseEntityRef(data.projectId).name}
          </EntityRefLink>
        );
      },
      align: 'center',
      width: '40%',
    },
    {
      align: 'left',
      field: 'ticketUrl',
      title: 'Ticket',
      disableClick: true,
      width: '10%',
      render: (row: any) => {
        const data: FeedbackModel = row;
        return data.ticketUrl ? (
          <Link target="_blank" rel="noopener noreferrer" href={data.ticketUrl}>
            {data.ticketUrl.split('/').pop()}
          </Link>
        ) : (
          'N/A'
        );
      },
    },
    {
      title: 'Tag',
      customSort: (data1: any, data2: any) => {
        const currentRow: FeedbackModel = data1;
        const nextRow: FeedbackModel = data2;
        return currentRow.tag
          .toLowerCase()
          .localeCompare(nextRow.tag.toLowerCase());
      },
      render: (row: any) => {
        const data: FeedbackModel = row;
        return (
          <Chip
            label={data.tag}
            variant="outlined"
            color={data.feedbackType === 'FEEDBACK' ? 'primary' : 'secondary'}
          />
        );
      },
    },
  ];

  useEffect(() => {
    api
      .getAllFeedbacks(tableConfig.page, tableConfig.pageSize, projectId)
      .then(data => {
        setFeedbackData(data.data);
        setTableConfig({
          totalFeedbacks: data.totalFeedbacks,
          page: data.currentPage,
          pageSize: data.pageSize,
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [projectId, api, tableConfig.page, tableConfig.pageSize]);

  async function handlePageChange(newPage: number, pageSize: number) {
    if (newPage > tableConfig.page) {
      setTableConfig({
        totalFeedbacks: tableConfig.totalFeedbacks,
        pageSize: pageSize,
        page: newPage - 1,
      });
    }
    setTableConfig({
      totalFeedbacks: tableConfig.totalFeedbacks,
      pageSize: pageSize,
      page: newPage + 1,
    });
    const newData = await api.getAllFeedbacks(newPage + 1, pageSize, projectId);
    return setFeedbackData(newData.data);
  }

  async function handleChangeRowsPerPage(pageSize: number) {
    setTableConfig({
      ...tableConfig,
      pageSize: pageSize,
    });
    const newData = await api.getAllFeedbacks(
      tableConfig.page,
      pageSize,
      projectId,
    );
    return setFeedbackData(newData.data);
  }

  function handleRowClick(
    event?: React.MouseEvent<Element, MouseEvent> | undefined,
    rowData?: any,
  ) {
    event?.preventDefault();
    const data: FeedbackModel = rowData;
    if (!queryState) setQueryState(data.feedbackId);
  }

  return (
    <Paper>
      <TableContainer component={Paper}>
        <Table
          options={{
            paging: feedbackData.length > 0,
            pageSizeOptions: [5, 10, 25],
            pageSize: tableConfig.pageSize,
            paginationPosition: 'bottom',
            padding: 'dense',
            toolbar: true,
            search: true,
            searchFieldVariant: 'outlined',
            searchFieldAlignment: 'left',
            loadingType: 'linear',
          }}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          data={feedbackData}
          columns={columns}
          totalCount={tableConfig.totalFeedbacks}
          page={tableConfig.page - 1}
        />
      </TableContainer>
    </Paper>
  );
};
