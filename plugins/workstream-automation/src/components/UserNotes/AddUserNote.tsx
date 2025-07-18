import { parseEntityRef } from '@backstage/catalog-model';
import { useApi } from '@backstage/core-plugin-api';
import { EntityRefLink, useEntity } from '@backstage/plugin-catalog-react';
import { RequirePermission } from '@backstage/plugin-permission-react';
import {
  ArtEntity,
  UserNote,
  userNoteDeletePermission,
  userNoteUpdatePermission,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import {
  Button,
  Checkbox,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@material-ui/core';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import DeleteIcon from '@material-ui/icons/DeleteForeverOutlined';
import ChevronDownIcon from '@material-ui/icons/ExpandMore';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { noteApiRef } from '../../api';

type AddUserModal = {
  userRef: string;
  open: boolean;
  setOpen: Function;
  refreshFn?: VoidFunction;
} & (
  | {
      mode: 'Add';
      note: undefined;
    }
  | {
      mode: 'Update';
      note: UserNote;
    }
);

export const AddUserNote = (props: AddUserModal) => {
  const { open, mode, userRef, note, setOpen, refreshFn } = props;
  const noteApi = useApi(noteApiRef);
  const { entity } = useEntity<WorkstreamEntity | ArtEntity>();
  const { register, handleSubmit, formState, reset } = useForm<{
    userRef: string;
    editHistory: Array<{ timestamp: string; userRef: string; note?: string }>;
    note: string;
  }>({
    values: {
      userRef: userRef,
      editHistory: note?.editHistory ?? [],
      note: note?.note ?? '',
    },
    mode: 'all',
  });
  const [expandHistory, setExpandHistory] = useState(false);

  const handleClose = () => {
    setExpandHistory(false);
    reset();
    setOpen(false);
    refreshFn?.();
  };

  const onSubmit = (data: UserNote) => {
    if (mode === 'Add') {
      noteApi.createNote(data).then(() => handleClose());
    } else {
      noteApi.updateNote(userRef, data).then(() => handleClose());
    }
  };

  const handleClear = () => {
    if (note) {
      noteApi
        .updateNote(userRef, {
          userRef: note.userRef,
          note: '',
          editHistory: note.editHistory,
        })
        .then(() => {
          handleClose();
          refreshFn?.();
        });
    }
  };

  const handleDelete = () => {
    noteApi.deleteNote(userRef).then(() => {
      handleClose();
      refreshFn?.();
    });
  };

  return (
    <Dialog
      open={open}
      onClose={(_, r) => r === 'escapeKeyDown' && handleClose()}
      fullWidth
      maxWidth="sm"
    >
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          &nbsp;
          {mode === 'Add'
            ? `Add note for ${parseEntityRef(userRef).name}`
            : `Edit note for ${parseEntityRef(userRef).name}`}
        </Typography>
        <TextField
          {...register('note', { validate: val => val.trim() !== '' })}
          variant="filled"
          placeholder="Enter note here..."
          disabled={formState.isSubmitting}
          fullWidth
          multiline
          minRows={3}
          InputProps={{ style: { padding: '10px 10px' } }}
        />
        {mode === 'Update' && note.editHistory.length > 0 && (
          <FormControlLabel
            control={
              <Checkbox
                icon={<ChevronRightIcon />}
                checkedIcon={<ChevronDownIcon />}
                color="default"
              />
            }
            onClick={() => setExpandHistory(!expandHistory)}
            checked={expandHistory}
            style={{ padding: '10px 0' }}
            label={`Edit History (${note.editHistory.slice(0, 9).length})`}
          />
        )}
        <Collapse
          in={expandHistory}
          timeout="auto"
          unmountOnExit
          style={{ maxHeight: '150px', overflow: 'scroll' }}
        >
          {mode === 'Update' &&
            note.editHistory
              .map((history, key) => {
                let noteEditor: any;
                try {
                  noteEditor = (
                    <EntityRefLink entityRef={parseEntityRef(history.userRef)}>
                      {parseEntityRef(history.userRef).name}
                    </EntityRefLink>
                  );
                } catch (error) {
                  noteEditor = history.userRef;
                }

                return (
                  <Typography
                    key={key}
                    style={{ padding: '5px 10px' }}
                    component="p"
                    variant="caption"
                  >
                    {noteEditor} - {history.note} -{' '}
                    {DateTime.fromISO(history.timestamp).toRelative()}
                  </Typography>
                );
              })
              .reverse()
              .slice(0, 9)}
        </Collapse>
      </DialogContent>
      <DialogActions style={{ padding: '10px 24px' }}>
        <Button
          variant="contained"
          onClick={handleSubmit(onSubmit)}
          disabled={!formState.isValid}
          color="primary"
        >
          {mode}
        </Button>
        <Button variant="outlined" color="inherit" onClick={handleClose}>
          Cancel
        </Button>
        {mode === 'Update' && note.note && (
          <RequirePermission
            permission={userNoteUpdatePermission}
            resourceRef={
              entity.kind === 'Workstream' ? entity.spec.lead : entity.spec.rte
            }
            errorPage={<></>}
          >
            <Button
              variant="contained"
              onClick={handleClear}
              style={{ backgroundColor: '#eeca00' }}
            >
              Remove
            </Button>
          </RequirePermission>
        )}
        {mode === 'Update' && (
          <RequirePermission
            permission={userNoteDeletePermission}
            errorPage={<></>}
          >
            <Tooltip title="Delete forever">
              <IconButton onClick={handleDelete} style={{ color: '#ee0000' }}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </RequirePermission>
        )}
      </DialogActions>
    </Dialog>
  );
};
