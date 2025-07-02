import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AccessRequest } from '../types';
import { AccessRequestBackendDatabase } from '../databse/AccessRequestBackendDatabase';
import { PermissionEmailService } from '../services/email-service/permissionMailerService';

/**
 * Creates access request routes for the plugin backend.
 *
 * @param accessRequestDb - Instance of AccessRequestBackendDatabase
 * @returns Express router with access request endpoints
 */
export function createAccessRequestRoutes(
  accessRequestDb: AccessRequestBackendDatabase,
  emailService: PermissionEmailService
): express.Router {
  const router = express.Router();

  router.use(express.json());

  /**
   * GET /
   * Fetch all access requests.
   *
   * @route GET /
   * @returns {Object[]} 200 - List of access requests
   */
  router.get('/', async (_req, res) => {
    const data = await accessRequestDb.listAccessRequests();
    return res.status(200).json({ data });
  });

  /**
   * GET /:id
   * Fetch a single access request by ID.
   *
   * @route GET /:id
   * @param {string} id - Access request ID
   * @returns {Object} 200 - Access request data
   * @returns {Object} 404 - Access request not found
   */
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const request = await accessRequestDb.getAccessRequestById(id);
      if (request) {
        return res.json(request);
      }
      return res.status(404).json({ error: 'Access request not found' });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /**
   * POST /
   * Create one or more new access requests.
   *
   * @route POST /
   * @param {Object[]} req.body - List of access request objects or single object
   * @returns {Object} 201 - Successfully created requests
   * @returns {Object} 207 - Partial success with error details
   */
  router.post('/', async (req, res) => {
    const requests = Array.isArray(req.body) ? req.body : [req.body];
    const now = new Date().toISOString();

    const existingRequests = await accessRequestDb.listAccessRequests();
    const validRequests: AccessRequest[] = [];
    const errors: any[] = [];

    for (const [index, reqItem] of requests.entries()) {
      const { username, userId, group, role, updatedBy } = reqItem;

      if (!username || !userId || !group) {
        errors.push({ index, error: 'Missing required fields', username, group });
        continue;
      }

      const isDuplicate = existingRequests.some(
        r => r.username === username && r.group === group && r.status === 'pending',
      );

      if (isDuplicate) {
        errors.push({
          index,
          error: `Access request for username '${username}' in group '${group}' already exists in 'pending' state.`,
          username,
          group,
        });
        continue;
      }

      validRequests.push({
        id: uuidv4(),
        username,
        userId,
        group,
        role: role ?? 'member',
        timestamp: now,
        status: 'pending',
        reason: 'N/A',
        reviewer: 'N/A',
        rejectionReason: '',
        createdBy: username,
        updatedBy: updatedBy ?? username,
        createdAt: now,
        updatedAt: now,
      });
    }

    let insertedResults: any[] = [];
    if (validRequests.length > 0) {
      insertedResults = await accessRequestDb.insertAccessRequests(validRequests);

      // Send emails to group owners for each request
      for (const [i, request] of requests.entries()) {
        const groupOwners = request.groupOwners?.filter((owner: string) => !!owner.trim()) ?? [];
        if (groupOwners.length > 0) {
          try {
            await emailService.processEmail(groupOwners, 'owners', { userId : request.userId, role : request.role});
          } catch (e) {
            errors.push({ index: i, error: 'Failed to send email to group owners', groupOwners });
          }
        }
        try {
          await emailService.processEmail(request.username, 'member', { userId : request.userId});
        } catch (e) {
          errors.push({ index: i, error: 'Failed to send email to member', username: request.username });
        }
      }
    }

    return res.status(errors.length ? 207 : 201).json({
      successCount: insertedResults.length,
      errorCount: errors.length,
      inserted: insertedResults,
      errors,
    });
  });

  /**
   * PUT /:id
   * Update an existing access request by ID.
   *
   * @route PUT /:id
   * @param {string} id - Access request ID
   * @param {Object} req.body.data - Updated fields for access request
   * @returns {Object} 200 - Updated access request
   * @returns {Object} 404 - Access request not found
   * @returns {Object} 500 - Update failure
   */
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const existing = await accessRequestDb.getAccessRequestById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Access request not found' });
      }

      const updated: AccessRequest = {
        ...existing,
        ...req.body.data,
        id,
        updatedAt: new Date().toISOString(),
      };

      const result = await accessRequestDb.updateAccessRequest(id, updated);
      if (!result) {
        return res.status(500).json({ error: 'Update failed' });
      }

      return res.status(200).json({ data: result });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /**
   * DELETE /:id
   * Delete an access request by ID.
   *
   * @route DELETE /:id
   * @param {string} id - Access request ID
   * @returns {Object} 200 - Deletion confirmation
   * @returns {Object} 404 - Access request not found
   */
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const existing = await accessRequestDb.getAccessRequestById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Access request not found' });
      }

      await accessRequestDb.deleteAccessRequest(id);
      return res.status(200).json({ message: 'Deleted successfully' });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /**
   * POST /access-provision
   * Update status (approve/reject) for a batch of access requests.
   *
   * @route POST /access-provision
   * @param {Object[]} req.body - Array of updates with userId, status, rejectionReason, updatedBy
   * @returns {Object} 200 - Successfully updated requests
   * @returns {Object} 207 - Partial update with error details
   * @returns {Object} 400 - Invalid request payload
   */
  router.post('/provision', async (req, res) => {
    const updates: Partial<AccessRequest>[] = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Invalid payload format' });
    }

    const allExisting = await accessRequestDb.listAccessRequests();
    const results: AccessRequest[] = [];
    const errors: any[] = [];

    for (const update of updates) {
      const existing = allExisting.find(r => r.userId === update.userId);

      if (!existing) {
        errors.push({ userId: update.userId, error: 'No existing access request found' });
        continue;
      }

      const updated: AccessRequest = {
        ...existing,
        status: update.status || existing.status,
        rejectionReason: update.rejectionReason ?? 'N/A',
        updatedBy: update.updatedBy || existing.updatedBy,
        updatedAt: new Date().toISOString(),
      };

      try {
        const result = await accessRequestDb.updateAccessRequest(existing.id, updated);
        if (result) {
          results.push(result);
        } else {
          errors.push({ userId: update.userId, error: 'Update failed' });
        }
      } catch (e: any) {
        errors.push({ userId: update.userId, error: e.message });
      }
    }

    return res.status(errors.length ? 207 : 200).json({
      message: 'Access request update processed',
      updated: results,
      errors,
    });
  });

  return router;
}
