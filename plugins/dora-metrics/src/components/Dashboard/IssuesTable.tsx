import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
} from '@material-ui/core';
import { Link } from '@backstage/core-components';
import { useState } from 'react';

export const IssuesTable = ({ closedIssues }: { closedIssues: any }) => {
  const calculateLeadTime = (created: string, resolution: string) => {
    return Math.round(
      (new Date(resolution).getTime() - new Date(created).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  };
  const data = closedIssues.sort((a: any, b: any) => {
    return (
      calculateLeadTime(b.fields.created, b.fields.resolutiondate) -
      calculateLeadTime(a.fields.created, a.fields.resolutiondate)
    );
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Card
        style={{ height: '25rem', overflowY: 'auto', scrollbarWidth: 'none' }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Component</TableCell>
              <TableCell>Created On</TableCell>
              <TableCell>Resolved On</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Lead Time (Days)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item: any) => (
                <TableRow key={item.key}>
                  <TableCell>
                    <Tooltip title={item.fields.summary}>
                      <Link
                        to={`https://issues.redhat.com/browse/${item.key}`}
                        target="_blank"
                      >
                        {item.key}
                      </Link>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {item.fields.components?.[0]?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{formatDate(item.fields.created)}</TableCell>
                  <TableCell>
                    {formatDate(item.fields.resolutiondate) || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {item.fields.priority?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {calculateLeadTime(
                      item.fields.created,
                      item.fields.resolutiondate,
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
      <TablePagination
        rowsPerPageOptions={[5, 10, 20]}
        component="div"
        count={data.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
};
