import {
  Chip,
  IconButton,
  Link,
  Paper,
  TableContainer,
  TextField,
  Theme,
  Tooltip,
  Typography,
  makeStyles,
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
import Clear from '@material-ui/icons/Clear';
import Search from '@material-ui/icons/Search';

const useStyles = makeStyles((theme: Theme) => ({
  textField: {
    padding: 0,
    margin: theme.spacing(2),
    width: '70%',
    [theme.breakpoints.up('lg')]: {
      width: '30%',
    },
  },
}));

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
  const [searchText, setSearchText] = useState<string>('');
  const [timer, setTimer] = useState<NodeJS.Timeout>();
  const classes = useStyles();

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
        const getSummary = () => {
          if (data.summary.length > 100) {
            if (data.summary.split(' ').length > 1)
              return `${data.summary.substring(
                0,
                data.summary.lastIndexOf(' ', 100),
              )}...`;
            return `${data.summary.slice(0, 100)}...`;
          }
          return data.summary;
        };
        return (
          <SubvalueCell
            value={<Typography variant="h6">{getSummary()}</Typography>}
            subvalue={
              <div onClick={e => e.stopPropagation()}>
                <EntityPeekAheadPopover entityRef={data.createdBy}>
                  Submitted by&nbsp;
                  <EntityRefLink entityRef={data.createdBy}>
                    {parseEntityRef(data.createdBy).name}
                  </EntityRefLink>
                </EntityPeekAheadPopover>
              </div>
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
    setTimer(
      setTimeout(() => {
        api
          .getAllFeedbacks(1, tableConfig.pageSize, projectId, searchText)
          .then(data => {
            setFeedbackData(data.data);
            setTableConfig({
              totalFeedbacks: data.count,
              page: data.currentPage,
              pageSize: data.pageSize,
            });
            setLoading(false);
          })
          .catch(() => {
            setLoading(false);
          });
      }, 400),
    );
  }, [projectId, api, tableConfig.pageSize, searchText]);

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
    const newData = await api.getAllFeedbacks(
      newPage + 1,
      pageSize,
      projectId,
      searchText,
    );
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
      searchText,
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

  function handleSearch(
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) {
    const _searchText = event.target.value;
    if (timer) clearTimeout(timer);
    if (_searchText.trim().length !== 0) return setSearchText(_searchText);
    return setSearchText('');
  }

  return (
    <Paper>
      <TextField
        onChange={handleSearch}
        variant="outlined"
        placeholder="Search Feedback"
        value={searchText}
        className={classes.textField}
        InputProps={{
          startAdornment: (
            <IconButton
              onClick={() => {
                if (searchText.trim().length !== 0) setSearchText(searchText);
              }}
              children={<Search />}
            />
          ),
          endAdornment: (
            <Tooltip title="Clear search" arrow>
              <IconButton
                onClick={() => {
                  setSearchText('');
                }}
                children={<Clear />}
              />
            </Tooltip>
          ),
        }}
      />
      <TableContainer component={Paper}>
        <Table
          options={{
            paging: feedbackData.length > 0,
            pageSizeOptions: [5, 10, 25],
            pageSize: tableConfig.pageSize,
            paginationPosition: 'bottom',
            padding: 'dense',
            toolbar: false,
            search: false,
            sorting: false,
            emptyRowsWhenPaging: false,
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
