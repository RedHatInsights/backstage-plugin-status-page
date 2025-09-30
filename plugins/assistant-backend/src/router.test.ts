import {
  mockErrorHandler,
  mockServices,
  TestDatabases,
} from '@backstage/backend-test-utils';
import express from 'express';
import request from 'supertest';
import { createRouter } from './router';
import { ChatThreads } from './models/ChatThreads';

// Mock implementation of the Agent class
jest.mock("@mastra/core/agent", () => {
  return {
    Agent: jest.fn().mockImplementation(() => {
      return {
        generate: jest.fn().mockResolvedValue({ text: "Mocked response" }),
        getDescription: jest.fn().mockReturnValue("Mocked agent description"),
        // Add more mocked methods as needed
      };
    }),
  };
});

jest.mock('./models/ChatThreads.ts', () => {
  const mockThread = {
    id: 'thread-id',
    userRef: 'user:default/development',
    messages: [],
  }
  return {
    ChatThreads: class {
      createThread() {
        return Promise.resolve(mockThread.id);
      }
      appendMessagesToThread(id: string) {
        return {id, updatedAt: new Date()};
      }
      deleteThread() {
        return true;
      }
      getThreadById() {
        return mockThread;
      }
      getThreadsForUser() {
        return [mockThread];
      }
      listThreads() {
        return [mockThread];
      }
  }};
});

// Mocking SignalsService
const mockSignalService = {
  publish: jest.fn(),
};

// Testing the router directly allows you to write a unit test that mocks the provided options.
describe('createRouter', () => {
  let app: express.Express;
  const databases = TestDatabases.create();

  beforeEach(async () => {
    const db = await databases.init('SQLITE_3');
    const model = new ChatThreads(db);
    const taskRunner = mockServices.scheduler().createScheduledTaskRunner({
      frequency: {
        trigger: 'manual',
      },
      timeout: {
        minutes: 1,
      },
      scope: 'global'
    });

    const router = await createRouter({
      httpAuth: mockServices.httpAuth(),
      auth: mockServices.auth(),
      discoveryApi: mockServices.discovery(),
      logger: mockServices.logger.mock(),
      rootConfig: mockServices.rootConfig(),
      scheduler: mockServices.scheduler(),
      signals: mockSignalService,
      model,
      taskRunner,
    });
    app = express();
    app.use(router);
    app.use(mockErrorHandler());
  });

  it('should be up and running', async () => {
    const response = await request(app)
      .get('/health')
      .send();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
