import {
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableBody,
  Button,
  Chip,
  LinearProgress,
  TablePagination,
  makeStyles,
} from '@material-ui/core';
import { useEffect, useState } from 'react';
import { outageApiRef } from '../api';
import { useApi } from '@backstage/core-plugin-api';
import { getBackstageChipStyle } from '../utils';
import DeleteTemplateModal from './DeleteTemplateModal';
import TemplateViewDrawer from './TemplateViewDrawer';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

const useStyles = makeStyles(() => ({
  updateButton: {
    color: '#1976d2',
    borderColor: '#1976d2',
    '&:hover': {
      backgroundColor: 'rgba(25, 118, 210, 0.04)',
      borderColor: '#1976d2',
    },
  },
  deleteButton: {
    color: '#d32f2f',
    borderColor: '#d32f2f',
    '&:hover': {
      backgroundColor: 'rgba(211, 47, 47, 0.04)',
      borderColor: '#d32f2f',
    },
  },
}));


const TemplatesTable = (props: {
  refreshTemplates: boolean;
  onEditTemplate: (template: any) => void;
  searchTermForTemplates?: string;
}) => {
  const outageApi = useApi(outageApiRef);
  const [templates, setTemplates] = useState<any[]>([]);
  const [backupTemplates, setBackupTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDeleteTemplateModal, setOpenDeleteTemplateModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<any>(null);
  const [templateToView, setTemplateToView] = useState<any>(null);
  const [openTemplateViewDrawer, setOpenTemplateViewDrawer] = useState(true);
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };
  const classes = useStyles();

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const fetchTemplates = async () => {
    setIsLoading(true);
    const response = await outageApi.fetchTemplates();

    if (response.data) {
      let data: any[] = [];
      Object.keys(response.data).forEach((templateKey: string) => {
        data = [response.data[templateKey], ...data];
      });
      setBackupTemplates(data);
      setTemplates(data);
      setPage(0);
      setRowsPerPage(5);
    }
    setIsLoading(false);
  };

  const handleEditTemplate = (template: any) => {
    props.onEditTemplate(template);
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (props.refreshTemplates) {
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.refreshTemplates]);

  useEffect(() => {
    if (templates.length && props?.searchTermForTemplates?.length) {
      setTemplates(
        backupTemplates.filter((template: any) =>
          template.name
            .toLowerCase()
            .includes(props?.searchTermForTemplates?.toLowerCase()),
        ),
      );
    } else if (backupTemplates.length && !props.searchTermForTemplates) {
      setTemplates(backupTemplates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.searchTermForTemplates]);

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Template Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Impact</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Last Updated</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4}>
                <LinearProgress />
              </TableCell>
            </TableRow>
          ) : (
            <TableBody>
              {templates &&
                templates
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((template: any, index: number) => (
                    <TableRow key={`key-${template.name}-${index}`}>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>
                        <Chip
                          variant="outlined"
                          label={template.status.toLocaleUpperCase()}
                          style={{
                            margin: '4px',
                            ...getBackstageChipStyle(template.status, 'outlined'),
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={template.impactOverride.toLocaleUpperCase()}
                          style={{
                            margin: '4px',
                            ...getBackstageChipStyle(template.impactOverride, 'default'),
                          }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{template.created_on}</TableCell>
                      <TableCell>{template.last_updated_on}</TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          color="primary"
                          style={{ margin: '5px' }}
                          onClick={() => {
                            setTemplateToView(template);
                            setOpenTemplateViewDrawer(true);
                          }}
                        >
                          View
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          style={{ margin: '5px' }}
                          onClick={() => handleEditTemplate(template)}
                          startIcon={<EditIcon className={classes.updateButton} />}
                        >
                          Update
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          style={{
                            margin: '5px',
                            color: 'red',
                            fontWeight: 'lighter',
                          }}
                          onClick={() => {
                            setTemplateToDelete(template);
                            setOpenDeleteTemplateModal(true);
                          }}
                          startIcon={<DeleteIcon className={classes.deleteButton} />}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          )}
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 20]}
        component="div"
        count={templates.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <DeleteTemplateModal
        open={openDeleteTemplateModal}
        onClose={() => {
          setOpenDeleteTemplateModal(false);
          setTemplateToDelete(null);
        }}
        templateToDelete={templateToDelete}
        refreshTemplates={fetchTemplates}
      />

      {templateToView && (
        <TemplateViewDrawer
          open={openTemplateViewDrawer}
          onClose={() => {
            setOpenTemplateViewDrawer(false);
            setTemplateToView(null);
          }}
          template={templateToView}
        />
      )}
    </>
  );
};

export default TemplatesTable;
