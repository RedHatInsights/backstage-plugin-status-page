import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Config } from '@backstage/config';
import { AccessRequest } from '../types';
import { AccessRequestBackendDatabase } from '../databse/AccessRequestBackendDatabase';
import { PermissionEmailService } from '../services/email-service/permissionMailerService';
import { RoverClient } from '../services/rover-service/roverService';

/**
 * Creates access request routes for the plugin backend.
 *
 * @param accessRequestDb - Instance of AccessRequestBackendDatabase
 * @param emailService - Instance of PermissionEmailService
 * @param roverClient - Instance of RoverClient
 * @param config - Backstage configuration
 * @returns Express router with access request endpoints
 */
export function createAccessRequestRoutes(
  accessRequestDb: AccessRequestBackendDatabase,
  emailService: PermissionEmailService,
  roverClient: RoverClient,
  config: Config
): express.Router {
  const router = express.Router();

  router.use(express.json());

  /**
   * GET /
   * Fetch all access requests.
   *
   * @route GET /
   * @returns {Object[]} 200 - List of access requests
   * @returns {Object} 204 - No access requests found
   */
  router.get('/', async (_req, res) => {
    const data = await accessRequestDb.listAccessRequests();
    if (data.length === 0) {
      return res.status(204).send();
    }
    return res.status(200).json({ data });
  });

  /**
   * GET /:id
   * Fetch a single access request by ID.
   *
   * @route GET /:id
   * @param {string} id - Access request ID
   * @returns {Object} 200 - Access request data
   * @returns {Object} 204 - No access request found for user
   */
  router.get('/:id', async (req, res) => {
    const { id: userId } = req.params;
    try {
      const filters: Partial<AccessRequest> = { userId };
      const requests = await accessRequestDb.getAccessRequests(filters);
      if (requests.length > 0) {
        return res.json(requests);
      }
      return res.status(204).send();
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
   * @returns {Object} 400 - Bad request (invalid or missing data)
   * @returns {Object} 500 - Internal server error
   */
  router.post('/', async (req, res) => {
    if (!req.body || (Array.isArray(req.body) && req.body.length === 0)) {
      return res.status(400).json({ error: 'Request body cannot be empty' });
    }

    const requests = Array.isArray(req.body) ? req.body : [req.body];
    const now = new Date().toISOString();

    try {
      const existingRequests = await accessRequestDb.listAccessRequests();
      const validRequests: AccessRequest[] = [];
      const updatedRequests: AccessRequest[] = [];
      const errors: any[] = [];

      for (const [index, reqItem] of requests.entries()) {
        const { userName, userId, userEmail, group, role, updatedBy, reason } = reqItem;

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
                reason: reason ?? 'N/A',
                role,
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
          reason: reason ?? 'N/A',
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
            await emailService.processEmail(groupOwners, 'owners-request', { userName: request.userName, role: request.role });
          } catch (e) {
            errors.push({ index: i, error: 'Failed to send email to group owners', groupOwners });
          }
        }

        try {
          await emailService.processEmail(request.userEmail, 'member-ack', { userName: request.userName });
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
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });


  /**
   * PUT /
   * Update existing access requests in batch.
   *
   * @route PUT /
   * @param {Object[]} req.body - Array of access request updates
   * @returns {Object} 200 - Successfully updated requests
   * @returns {Object} 400 - Bad request (invalid data)
   * @returns {Object} 401 - Unauthorized (missing or invalid token)
   * @returns {Object} 404 - One or more access requests not found
   * @returns {Object} 500 - Internal server error
   */
  router.put('/', async (req, res) => {
    const updates = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Request body must be a non-empty array of access requests' });
    }

    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!bearerToken) {
      return res.status(401).json({ error: 'Missing or invalid Authorization Bearer token' });
    }

    try {
      const results: any[] = [];
      const groupRoleMap = new Map<string, { members: string[], owners: string[] }>();
      const updateMap = new Map<string, AccessRequest>(); // key: group-userId

      for (const update of updates) {
        const { userId, group, role, status } = update;

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

        if (status === 'approved') {
          const key = `${group}`;
          if (!groupRoleMap.has(key)) {
            groupRoleMap.set(key, { members: [], owners: [] });
          }

          if (role === 'owner') {
            groupRoleMap.get(key)!.owners.push(userId);
          } else if (role === 'member') {
            groupRoleMap.get(key)!.members.push(userId);
          } else {
            results.push({ success: false, error: `Invalid role: ${role}`, update });
            continue;
          }
        }

        updateMap.set(`${group}-${userId}`, updated);
      }

      const roverSuccessSet = new Set<string>();

      for (const [group, { members, owners }] of groupRoleMap.entries()) {
        if (owners.length > 0) {
          const success = await roverClient.addUsersToGroupOwners(group, owners, bearerToken);
          if (success) {
            owners.forEach(uid => roverSuccessSet.add(`${group}-${uid}`));
          } else {
            owners.forEach(uid =>
              results.push({
                success: false,
                error: `Rover failed to add ${uid} as owner to group ${group}`,
                update: updateMap.get(`${group}-${uid}`),
              }),
            );
          }
        }

        if (members.length > 0) {
          const success = await roverClient.addUsersToGroupMember(group, members, bearerToken);
          if (success) {
            members.forEach(uid => roverSuccessSet.add(`${group}-${uid}`));
          } else {
            members.forEach(uid =>
              results.push({
                success: false,
                error: `Rover failed to add ${uid} as member to group ${group}`,
                update: updateMap.get(`${group}-${uid}`),
              }),
            );
          }
        }
      }

      for (const update of updates) {
        const key = `${update.group}-${update.userId}`;
        const updated = updateMap.get(key);
        if (!updated) continue;

        const shouldUpdate = updated.status === 'approved' ? roverSuccessSet.has(key) : true;

        if (shouldUpdate) {
          const result = await accessRequestDb.updateAccessRequest(updated.id, updated);
          if (!result) {
            results.push({ success: false, error: 'Database update failed', update });
          } else {
            results.push({ success: true, data: result });

            try {
              if (updated.status === 'approved') {
                await emailService.processEmail(
                  updated.userEmail,
                  'member-approved',
                  {
                    userName: updated.userName,
                    role: updated.role,
                  }
                );
              } else if (updated.status === 'rejected') {
                await emailService.processEmail(
                  updated.userEmail,
                  'member-rejected',
                  {
                    userName: updated.userName,
                    role: updated.role,
                    rejectionReason: updated.rejectionReason,
                  }
                );
              }
            } catch (e: any) {
              results.push({
                success: false,
                warning: 'Update saved, but email failed to send',
                userEmail: updated.userEmail,
                error: e.message,
              });
            }
          }
        }
      }

      return res.status(200).json({ results });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /**
   * DELETE /all
   * Delete all access requests from the database.
   * This route is only active when enableDeleteRoute is set to true in app-config.yaml
   *
   * @route DELETE /all
   * @returns {Object} 200 - Successfully deleted access requests with deletion count
   * @returns {Object} 403 - Forbidden (delete route is disabled)
   * @returns {Object} 500 - Internal server error
   */
  router.delete('/all', async (_req, res) => {
    try {
      // Check if delete route is enabled in configuration
      const enableDeleteRoute = config.getOptionalBoolean('permissionManagement.enableDeleteRoute') ?? false;
      
      if (!enableDeleteRoute) {
        return res.status(403).json({ 
          error: 'Delete all route is disabled',
          message: 'To enable this route, set permissionManagement.enableDeleteRoute to true in app-config.yaml'
        });
      }

      // Get all access requests before deletion for logging
      const allRequests = await accessRequestDb.listAccessRequests();
      const requestCount = allRequests.length;

      if (requestCount === 0) {
        return res.status(200).json({ 
          message: 'No access requests to delete',
          totalRequests: 0,
          deletedCount: 0
        });
      }

      // Delete all access requests individually
      let deletedCount = 0;
      for (const request of allRequests) {
        const result = await accessRequestDb.deleteAccessRequest(request.userId);
        if (result) {
          deletedCount++;
        }
      }
      // Return success response with deletion count
      return res.status(200).json({
        message: `Successfully deleted ${deletedCount} out of ${requestCount} access requests`,
        totalRequests: requestCount,
        deletedCount: deletedCount,
        failedCount: requestCount - deletedCount
      });
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
   * @returns {Object} 200 - Deletion confirmation with message
   * @returns {Object} 404 - Access request not found
   * @returns {Object} 500 - Internal server error
   */
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const existing = await accessRequestDb.getAccessRequestById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Access request not found' });
      }

      await accessRequestDb.deleteAccessRequest(id);
      // Return 204 No Content for successful deletion with no response body
      return res.status(200).json({ message: 'Deleted successfully' });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  /**
   * POST /provision
   * Update status (approve/reject) for a batch of access requests.
   *
   * @route POST /provision
   * @param {Object[]} req.body - Array of updates with userId, status, rejectionReason, updatedBy
   * @returns {Object} 200 - Successfully updated all requests
   * @returns {Object} 207 - Multi-status (partial success with error details)
   * @returns {Object} 400 - Bad request (invalid payload format)
   * @returns {Object} 500 - Internal server error
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


  /**
   * GET /check/:groupCn/user/:userId
   * Check if the user is a member or owner of the group.
   *
   * @route GET /check/:groupCn/user/:userId
   * @param {string} groupCn - Group common name
   * @param {string} userId - User ID to check
   * @queryParam {string} role - Optional filter (e.g., "member" or "owner")
   * @returns {Object} 200 - Result indicating membership status
   * @returns {Object} 500 - Internal server error
   */
  router.get('/check/:groupCn/user/:userId', async (req, res) => {
    const { groupCn, userId } = req.params;
    const roleQuery = req.query.role as string | undefined;
    try {
      const { memberUids, ownerUids } = await roverClient.getGroupMembersAndOwners(groupCn);
      const isMember = memberUids.includes(userId);
      const isOwner = ownerUids.includes(userId);
      if (roleQuery === 'member') {
        return res.status(200).json({ isMember });
      } else if (roleQuery === 'owner') {
        return res.status(200).json({ isOwner });
      }
      return res.status(200).json({ isMember, isOwner });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  return router;
}
