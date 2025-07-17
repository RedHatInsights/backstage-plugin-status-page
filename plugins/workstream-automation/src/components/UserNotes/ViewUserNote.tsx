import { parseEntityRef, stringifyEntityRef } from '@backstage/catalog-model';
import { EntityRefLink, useEntity } from '@backstage/plugin-catalog-react';
import { usePermission } from '@backstage/plugin-permission-react';
import {
  ArtEntity,
  UserNote,
  userNoteCreatePermission,
  userNoteUpdatePermission,
  WorkstreamEntity,
} from '@compass/backstage-plugin-workstream-automation-common';
import {
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@material-ui/core';
import AddCommentTwoTone from '@material-ui/icons/AddCommentOutlined';
import CommentTwoTone from '@material-ui/icons/ModeCommentTwoTone';
import { DateTime } from 'luxon';
import HoverPopover from 'material-ui-popup-state/HoverPopover';
import {
  bindHover,
  bindPopover,
  usePopupState,
} from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import { CustomUserEntity } from '../../types';
import { AddUserNote } from './AddUserNote';

export const ViewUserNote = (props: {
  user: CustomUserEntity;
  note?: UserNote;
  refresh?: VoidFunction;
}) => {
  const popupState = usePopupState({
    variant: 'dialog',
    popupId: 'user-note',
  });
  const { entity } = useEntity<WorkstreamEntity | ArtEntity>();
  const { user, note, refresh } = props;

  const { allowed: createAllowed } = usePermission({
    permission: userNoteCreatePermission,
    resourceRef:
      entity.kind === 'Workstream' ? entity.spec.lead : entity.spec.rte,
  });
  const { allowed: updateAllowed } = usePermission({
    permission: userNoteUpdatePermission,
    resourceRef:
      entity.kind === 'Workstream' ? entity.spec.lead : entity.spec.rte,
  });

  const [open, setOpen] = useState(false);

  if (!note) {
    if (createAllowed) {
      return (
        <>
          <Tooltip title="Click to add" arrow placement="top">
            <IconButton onClick={() => setOpen(true)} size="small">
              <AddCommentTwoTone fontSize="small" color="inherit" />
            </IconButton>
          </Tooltip>
          {open && (
            <AddUserNote
              mode="Add"
              note={undefined}
              open={open}
              setOpen={setOpen}
              userRef={stringifyEntityRef(user)}
              refreshFn={refresh}
            />
          )}
        </>
      );
    }
    return null;
  }

  let noteEditor;
  try {
    noteEditor = (
      <EntityRefLink
        entityRef={parseEntityRef(note.editHistory.at(-1)!.userRef)}
      >
        {parseEntityRef(note.editHistory.at(-1)!.userRef).name}
      </EntityRefLink>
    );
  } catch (error) {
    noteEditor = note.editHistory.at(-1)!.userRef;
  }

  return (
    <>
      <Tooltip
        title={updateAllowed ? 'Click to edit' : ''}
        arrow
        placement="top"
      >
        <IconButton
          onClick={() => updateAllowed && setOpen(true)}
          {...bindHover(popupState)}
          size="small"
        >
          {note.note?.trim() === '' ? (
            <AddCommentTwoTone fontSize="small" color="inherit" />
          ) : (
            <CommentTwoTone fontSize="small" color="inherit" />
          )}
        </IconButton>
      </Tooltip>
      <HoverPopover
        {...bindPopover(popupState)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Paper elevation={0} style={{ maxWidth: '320px' }}>
          <Typography component="pre" style={{ padding: '10px' }}>
            {note.note}
          </Typography>
          <Divider />
          <Typography
            style={{ padding: '5px 10px' }}
            component="p"
            variant="caption"
          >
            Added by {noteEditor}
            ,&nbsp;
            {DateTime.fromISO(
              note.editHistory.at(-1)?.timestamp ?? '',
            ).toRelative()}
          </Typography>
        </Paper>
      </HoverPopover>
      {open && (
        <AddUserNote
          mode="Update"
          note={note}
          open={open}
          setOpen={setOpen}
          userRef={stringifyEntityRef(user)}
          refreshFn={refresh}
        />
      )}
    </>
  );
};
