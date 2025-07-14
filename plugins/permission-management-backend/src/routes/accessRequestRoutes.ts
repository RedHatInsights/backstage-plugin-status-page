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
    const { id: userId } = req.params;
    try {
      const filters: Partial<AccessRequest> = { userId };
      const requests = await accessRequestDb.getAccessRequests(filters);
      if (requests.length > 0) {
        return res.json(requests);
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
    const updatedRequests: AccessRequest[] = [];
    const errors: any[] = [];

    for (const [index, reqItem] of requests.entries()) {
      const { userName, userId, userEmail, group, role, updatedBy } = reqItem;

      if (!userName || !userId || !group) {
        errors.push({ index, error: 'Missing required fields', userName, group });
        continue;
      }

      const existing = existingRequests.find(
        r => r.userId === userId && r.group === group
      );

      if (existing) {
        if (existing.status === 'pending') {
          errors.push({
            index,
            error: `Access request for '${userName}' in group '${group}' is already in 'pending' state.`,
            userName,
            group,
          });
          continue;
        }

        if (existing.status === 'rejected') {
          try {
            const updatedRequest: AccessRequest = {
              ...existing,
              status: 'pending',
              rejectionReason: '',
              updatedBy: updatedBy ?? userName,
              updatedAt: now,
              timestamp: now,
            };

            const result = await accessRequestDb.updateAccessRequest(existing.id, updatedRequest);
            if (result) {
              updatedRequests.push(result);
            } else {
              errors.push({
                index,
                error: `Failed to update rejected request for '${userName}'`,
                userName,
                group,
              });
            }
          } catch (e) {
            const error = e as Error;
            errors.push({
              index,
              error: `Exception while updating rejected request for '${userName}'`,
              userName,
              group,
              details: error.message,
            });
          }
          continue;
        }
      }

      // Insert as new request
      validRequests.push({
        id: uuidv4(),
        userName,
        userEmail,
        userId,
        group,
        role: role ?? 'member',
        timestamp: now,
        status: 'pending',
        reason: 'N/A',
        reviewer: 'N/A',
        rejectionReason: '',
        createdBy: userName,
        updatedBy: updatedBy ?? userName,
        createdAt: now,
        updatedAt: now,
      });
    }

    let insertedResults: AccessRequest[] = [];
    if (validRequests.length > 0) {
      insertedResults = await accessRequestDb.insertAccessRequests(validRequests);
    }

    const allProcessed = [...insertedResults, ...updatedRequests];

    // Send emails to owners and members
    for (const [i, request] of allProcessed.entries()) {
      const originalRequest = requests[i];
      const groupOwners = originalRequest.groupOwners?.filter((owner: string) => !!owner.trim()) ?? [];
      if (groupOwners.length > 0) {
        try {
          await emailService.processEmail(groupOwners, 'owners', { userName: request.userName, role: request.role });
        } catch (e) {
          errors.push({ index: i, error: 'Failed to send email to group owners', groupOwners });
        }
      }

      try {
        await emailService.processEmail(request.userEmail, 'member', { userName: request.userName });
      } catch (e) {
        errors.push({ index: i, error: 'Failed to send email to member', userName: request.userName });
      }
    }

    return res.status(errors.length ? 207 : 201).json({
      successCount: allProcessed.length,
      insertedCount: insertedResults.length,
      updatedCount: updatedRequests.length,
      errorCount: errors.length,
      inserted: insertedResults,
      updated: updatedRequests,
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
  router.put('/', async (req, res) => {
    const updates = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Request body must be a non-empty array of access requests' });
    }

    try {
      const results = [];

      for (const update of updates) {
        const { userId, group } = update;

        if (!userId || !group || typeof group !== 'string') {
          results.push({ success: false, error: 'Missing or invalid userId/group', update });
          continue;
        }

        const existingList = await accessRequestDb.getAccessRequests({ userId, group });

        if (existingList.length === 0) {
          results.push({ success: false, error: 'Access request not found', update });
          continue;
        }

        const existing = existingList[0];
        const updated: AccessRequest = {
          ...existing,
          ...update,
          id: existing.id,
          updatedAt: new Date().toISOString(),
        };

        const result = await accessRequestDb.updateAccessRequest(existing.id, updated);

        if (!result) {
          results.push({ success: false, error: 'Update failed', update });
          continue;
        }

        results.push({ success: true, data: result });
      }

      return res.status(200).json({ results });
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
