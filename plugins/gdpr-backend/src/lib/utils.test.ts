import { Platform } from './types';
import { formatUserData } from './utils';

describe('utils', () => {
  describe('formatUserData', () => {
    it('should format complete user data correctly', () => {
      const inputData = {
        data: {
          user: {
            uid: '12345',
            name: 'testuser',
            mail: 'test@example.com',
          },
          content: [
            { type: 'comment', count: 5 },
            { type: 'file', count: 2 },
          ],
        },
        code: 200,
        status: 'success',
      };

      const result = formatUserData(Platform.DCP, inputData);

      expect(result).toEqual({
        platform: Platform.DCP,
        user: {
          uid: '12345',
          name: 'testuser',
          mail: 'test@example.com',
          roles: [],
        },
        content: [
          { type: 'comment', count: 5 },
          { type: 'file', count: 2 },
        ],
        code: 200,
        status: 'success',
      });
    });

    it('should handle subscription_user data', () => {
      const inputData = {
        data: {
          subscription_user: {
            uid: '67890',
            name: 'subscriptionuser',
          },
          content: [],
        },
        code: 201,
        status: 'created',
      };

      const result = formatUserData(Platform.DXSP, inputData);

      expect(result).toEqual({
        platform: Platform.DXSP,
        user: {
          uid: '67890',
          name: 'subscriptionuser',
          roles: [],
        },
        content: [],
        code: 201,
        status: 'created',
      });
    });

    it('should normalize roles array correctly', () => {
      const inputData = {
        data: {
          user: {
            uid: '12345',
            roles: [
              { target_id: 'admin' },
              { target_id: 'user' },
            ],
          },
          content: [],
        },
      };

      const result = formatUserData(Platform.DCP, inputData);

      expect(result.user.roles).toEqual([
        { target_id: 'admin' },
        { target_id: 'user' },
      ]);
    });

    it('should handle single role object with target_id', () => {
      const inputData = {
        data: {
          user: {
            uid: '12345',
            roles: { target_id: 'single_role' },
          },
          content: [],
        },
      };

      const result = formatUserData(Platform.DCP, inputData);

      expect(result.user.roles).toEqual([{ target_id: 'single_role' }]);
    });

    it('should handle invalid roles data', () => {
      const inputData = {
        data: {
          user: {
            uid: '12345',
            roles: 'invalid_roles_string',
          },
          content: [],
        },
      };

      const result = formatUserData(Platform.DCP, inputData);

      expect(result.user.roles).toEqual([]);
    });

    it('should handle missing roles property', () => {
      const inputData = {
        data: {
          user: {
            uid: '12345',
            name: 'testuser',
          },
          content: [],
        },
      };

      const result = formatUserData(Platform.DCP, inputData);

      expect(result.user.roles).toEqual([]);
    });

    it('should handle missing data property', () => {
      const inputData = {
        code: 200,
        status: 'success',
      };

      const result = formatUserData(Platform.DXSP, inputData);

      expect(result).toEqual({
        platform: Platform.DXSP,
        user: {
          roles: [],
        },
        content: [],
        code: 200,
        status: 'success',
      });
    });

    it('should handle null/undefined input', () => {
      let result = formatUserData(Platform.DCP, null);

      expect(result).toEqual({
        platform: Platform.DCP,
        user: {
          roles: [],
        },
        content: [],
        code: 200,
        status: 'success',
      });

      result = formatUserData(Platform.DXSP, undefined);

      expect(result).toEqual({
        platform: Platform.DXSP,
        user: {
          roles: [],
        },
        content: [],
        code: 200,
        status: 'success',
      });
    });

    it('should handle string input', () => {
      const result = formatUserData(Platform.DCP, 'invalid string input');

      expect(result).toEqual({
        platform: Platform.DCP,
        user: {
          roles: [],
        },
        content: [],
        code: 200,
        status: 'success',
      });
    });

    it('should handle non-array content', () => {
      const inputData = {
        data: {
          user: { uid: '12345' },
          content: 'not an array',
        },
      };

      const result = formatUserData(Platform.DCP, inputData);

      expect(result.content).toEqual([]);
    });

    it('should use default values for missing properties', () => {
      const inputData = {
        data: {
          user: { uid: '12345' },
          content: [],
        },
        // Missing code and status
      };

      const result = formatUserData(Platform.DCP, inputData);

      expect(result.code).toBe(200);
      expect(result.status).toBe('success');
    });

    it('should preserve custom code and status', () => {
      const inputData = {
        data: {
          user: { uid: '12345' },
          content: [],
        },
        code: 404,
        status: 'not_found',
      };

      const result = formatUserData(Platform.DCP, inputData);

      expect(result.code).toBe(404);
      expect(result.status).toBe('not_found');
    });

    it('should handle invalid code type', () => {
      const inputData = {
        data: {
          user: { uid: '12345' },
          content: [],
        },
        code: 'invalid_code',
        status: 'success',
      };

      const result = formatUserData(Platform.DCP, inputData);

      expect(result.code).toBe(200); // Should use default
      expect(result.status).toBe('success');
    });
  });
});
