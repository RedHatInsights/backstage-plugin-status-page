import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
} from '@material-ui/core';
import { Link } from '@backstage/core-components';
import { useState } from 'react';

export const MRTable = ({ mergerMRs }: { mergerMRs: any }) => {
  const calculateLeadTime = (created: string, resolution: string) => {
    return Math.round(
      (new Date(resolution).getTime() - new Date(created).getTime()) /
        (1000 * 60 * 60 * 24),
    );
  };
  const data = mergerMRs.sort((a: any, b: any) => {
    return (
      calculateLeadTime(b.created_at, b.merged_at) -
      calculateLeadTime(a.created_at, a.merged_at)
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
    if(!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Card
        style={{ height: '35rem', overflowY: 'auto', scrollbarWidth: 'none' }}
      >
        <Table>
          <TableHead>
            <TableRow>
                <TableCell>MR ID</TableCell>  
              <TableCell>MR Title</TableCell>
              <TableCell>Assignee</TableCell>
              <TableCell>Created On</TableCell>
              <TableCell>Merged On</TableCell>
              <TableCell>Lead Time (Days)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item: any) => (
                <TableRow key={item.key}>
                  <TableCell>
                    <Link to={item.web_url} target="_blank">#{item.id}</Link>
                  </TableCell>
                  <TableCell>
                    {item.title}
                  </TableCell>
                  <TableCell>
                    {item.assignee.name}
                  </TableCell>
                  <TableCell>{formatDate(item.created_at)}</TableCell>
                  <TableCell>
                    {formatDate(item.merged_at) || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {calculateLeadTime(
                      item.created_at,
                      item.merged_at,
                    ) || 1}
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
