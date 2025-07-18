import {
  BackstageServicePrincipal,
  BackstageUserPrincipal,
} from '@backstage/backend-plugin-api';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { NotAllowedError } from '@backstage/errors';
import {
  UserNote,
  userNoteCreatePermission,
  userNoteDeletePermission,
  UserNoteSchema,
  userNoteUpdatePermission,
} from '@compass/backstage-plugin-workstream-automation-common';
import { Router } from 'express';
import z from 'zod/v4';
import { NotesBackendDatabase } from '../database/NotesBackendDatabase';
import { userNotePermissionResourceRef } from '../permissions/resources';
import { isValidUser } from '../permissions/rules';
import { knexNow } from '../utils/knexNow';
import { RouterOptions } from './types';

export async function noteRouter(options: RouterOptions) {
  const { database, permissions, httpAuth, permissionsRegistry } = options;

  permissionsRegistry.addResourceType({
    resourceRef: userNotePermissionResourceRef,
    rules: [isValidUser],
    permissions: [
      userNoteCreatePermission,
      userNoteDeletePermission,
      userNoteUpdatePermission,
    ],
    async getResources(resourceRefs) {
      return resourceRefs;
    },
  });

  const notesDatabaseClient = new NotesBackendDatabase(
    await database.getClient(),
  );
  const router = Router();

  router.get('/', async (req, res) => {
    const userRef = req.query.userRef as string | string[];
    if (!userRef) {
      const notes = await notesDatabaseClient.getAllNotes();
      return res.status(200).json({ notes, totalItems: notes.length });
    }
    const userRefs = Array.isArray(userRef) ? userRef : [userRef];
    const notes = await notesDatabaseClient.getNotesByUserRefs(userRefs);
    return res.status(200).json({ notes });
  });

  router.post('/', async (req, res) => {
    const [decision] = await permissions.authorizeConditional(
      [
        {
          permission: userNoteCreatePermission,
        },
      ],
      {
        credentials: await httpAuth.credentials(req),
      },
    );
    if (decision.result === 'DENY') {
      return res
        .status(403)
        .json({ error: new NotAllowedError('Not allowed').message });
    }
    const parsedBody = UserNoteSchema.safeParse(req.body);
    if (!parsedBody.success)
      return res.status(403).json({ error: z.treeifyError(parsedBody.error) });

    try {
      const note = parsedBody.data;
      const principal = (await httpAuth.credentials(req)).principal as
        | BackstageUserPrincipal
        | BackstageServicePrincipal;

      if (principal.type === 'user') {
        note.editHistory.push({
          timestamp: knexNow(),
          userRef: principal.userEntityRef,
          note: note.note,
        });
      } else if (principal.type === 'service') {
        note.editHistory.push({
          timestamp: knexNow(),
          userRef: principal.subject,
          note: note.note,
        });
      }
      const dbResult = await notesDatabaseClient.addNote(note);
      return res.status(201).json({ message: 'Note created', data: dbResult });
    } catch (error) {
      return res.status(500).json({ error: 'Failed', stack: error });
    }
  });

  router.put('/:kind/:namespace/:name', async (req, res) => {
    const [decision] = await permissions.authorizeConditional(
      [{ permission: userNoteUpdatePermission }],
      {
        credentials: await httpAuth.credentials(req),
      },
    );
    if (decision.result === 'DENY') {
      return res.status(403).json({ message: 'Access Denied' });
    }

    const compoundEntity = req.params;
    if (compoundEntity.kind.toLowerCase() !== 'user')
      return res.status(400).json({
        message: 'Only user entites are supported',
        compoundEntity,
      });

    const parsedBody = UserNoteSchema.safeParse(req.body);
    if (!parsedBody.success)
      return res.status(403).json({ error: z.treeifyError(parsedBody.error) });

    const userRef = stringifyEntityRef(compoundEntity);
    const newNote = parsedBody.data;
    const oldNote = await notesDatabaseClient.getNoteByUserRef(userRef);
    if (!oldNote)
      return res
        .status(404)
        .json({ error: `No note found for user: ${userRef}` });

    const updatedNote: UserNote = {
      ...oldNote,
      ...newNote,
      editHistory: oldNote.editHistory.slice(-10), // keep history of last 10 edits
    };

    const principal = (await httpAuth.credentials(req)).principal as
      | BackstageUserPrincipal
      | BackstageServicePrincipal;

    if (principal.type === 'user') {
      updatedNote.editHistory.push({
        timestamp: knexNow(),
        userRef: principal.userEntityRef,
        note: newNote.note,
      });
    } else if (principal.type === 'service') {
      updatedNote.editHistory.push({
        timestamp: knexNow(),
        userRef: principal.subject,
        note: newNote.note,
      });
    }

    const result = await notesDatabaseClient.updateNote(userRef, updatedNote);

    return res.status(200).json({ data: result, message: 'Note updated' });
  });

  router.get('/:kind/:namespace/:name', async (req, res) => {
    const compoundEntity = req.params;
    if (compoundEntity.kind.toLowerCase() !== 'user')
      return res.status(400).json({
        message: 'Only user entites are supported',
        compoundEntity,
      });

    const userRef = stringifyEntityRef(compoundEntity);
    const note = await notesDatabaseClient.getNoteByUserRef(userRef);
    if (note)
      return res
        .status(200)
        .json({ note, message: 'Note fetched successfully' });

    return res
      .status(404)
      .json({ error: `No note found for user: ${userRef}` });
  });

  router.delete('/:kind/:namespace/:name', async (req, res) => {
    const [decision] = await permissions.authorize(
      [{ permission: userNoteDeletePermission }],
      {
        credentials: await httpAuth.credentials(req),
      },
    );
    if (decision.result === 'DENY') {
      return res.status(403).json({ message: 'Access Denied' });
    }

    const compoundEntity = req.params;
    if (compoundEntity.kind.toLowerCase() !== 'user')
      return res.status(400).json({
        message: 'Only user entites are supported',
        compoundEntity,
      });

    const userRef = stringifyEntityRef(compoundEntity);
    const noteExists = await notesDatabaseClient.getNoteByUserRef(userRef);
    if (!noteExists)
      return res
        .status(404)
        .json({ error: `Cannot delete, no note found for user: ${userRef}` });

    const result = await notesDatabaseClient.deleteNote(userRef);
    if (result) return res.status(200).json('Note deleted successfully');
    return res
      .status(404)
      .json({ error: `Failed to delete note for user: ${userRef}` });
  });

  return router;
}
