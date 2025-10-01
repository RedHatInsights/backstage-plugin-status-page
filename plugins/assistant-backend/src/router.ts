import {
  AuthService,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
  RootConfigService,
  SchedulerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import { SignalsService } from '@backstage/plugin-signals-node';
import express from 'express';
import Router from 'express-promise-router';
import { ChatThreads } from './models/ChatThreads';
import { ChatThreadModel } from './types';
import { getMCPClient } from './utils/MCPClient';
import { getAgent } from './utils/MastraAgent';

export async function createRouter({
  auth,
  rootConfig,
  discoveryApi,
  httpAuth,
  logger,
  model,
  taskRunner,
  scheduler,
  signals,
}: {
  auth: AuthService;
  rootConfig: RootConfigService;
  discoveryApi: DiscoveryService;
  httpAuth: HttpAuthService;
  logger: LoggerService;
  model: ChatThreads;
  taskRunner: SchedulerServiceTaskRunner;
  scheduler: SchedulerService;
  signals: SignalsService;
}): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/health', async (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.get('/tools', async (req, res) => {
    const authToken = req.headers.authorization;

    const baseUrl = await discoveryApi.getBaseUrl('mcp-actions');
    const url = new URL(`${baseUrl}/v1`);

    const mcpClient = await getMCPClient(url, authToken ?? '');
    const tools = await mcpClient.getTools();

    res.json(tools);
  });

  /**
   * Create a new session for the user (if one does not already exist)
   *
   * This includes:
   * 1. Creating a new session id
   * 2. Creating a new memory (serialize it and store in the database along with the session id)
   * 3. Create an event listener for the session id (background task)
   * 4. Return an active event-stream in the response
   */
  router.get('/chat', async (req, res) => {
    let threadId = req.header('x-assistant-thread-id');
    let thread: ChatThreadModel | undefined;
    let userRef: string;

    const credentials = await httpAuth.credentials(req);
    if (auth.isPrincipal(credentials, 'user')) {
      userRef = credentials.principal.userEntityRef;
    } else if (auth.isPrincipal(credentials, 'service')) {
      userRef = credentials.principal.subject;
    } else {
      res.status(401).json({
        error: 'Invalid credentials',
      });
      return;
    }

    if (!threadId) {
      const existingThreads = await model.getThreadsForUser(userRef);
      if (existingThreads.length > 0) {
        thread = existingThreads.at(-1)!;
        threadId = thread.id;
      } else {
        threadId = await model.createThread(userRef, []);
      }
    }
    thread = await model.getThreadById(threadId);

    if (!thread) {
      res.status(404).json({
        error: `Thread not found for id: ${threadId}`,
      });
      return;
    }

    /* HACK: Manually parsing string to JSON array if the database doesn't already return an array. (Required for sqlite) */
    const messages = (typeof thread.messages === 'string') ? JSON.parse(thread.messages) : thread.messages;

    res
      .status(200)
      .setHeader('x-assistant-thread-id', threadId)
      .json({
        threadId,
        messages,
        _meta: {
          count: messages.length,
        },
      });
    return;
  });

  /**
   * Submit a new chat query to the agent
   *
   * This includes:
   * 1. Identify the active session for the user (using the session id in the request)
   * 2. Get the serialized memory from the database for the session id
   * 3. Create an agent with the deserialized memory and the selected tools from the request input
   * 4. Trigger a background task for the user query
   */
  router.post('/chat', async (req, res) => {
    const body = req.body;
    let userRef: string = 'user:development/guest';
    const authToken = req.headers.authorization;

    const credentials = await httpAuth.credentials(req);
    if (auth.isPrincipal(credentials, 'user')) {
      userRef = credentials.principal.userEntityRef;
    } else if (auth.isPrincipal(credentials, 'service')) {
      userRef = credentials.principal.subject;
    } else {
      res.status(401).json({
        error: 'Invalid credentials',
      });
      return;
    }

    const threadId = req.header('x-assistant-thread-id');
    if (!threadId) {
      res.status(400).json({
        error: 'Please provide a threadId',
      });
      return;
    }
    const thread = await model.getThreadById(threadId);
    if (!thread) {
      res.status(404).json({
        error: `Thread not found for id: ${threadId}`,
      });
      return;
    }
    if (thread.userRef !== userRef) {
      res.status(403).json({
        error: 'Unauthorized'
      });
    }

    if (!body?.prompt) {
      res.status(400).json({
        error: 'No prompt provided',
      });
      return;
    }

    const selectedTools = body?.tools;

    await model.appendMessagesToThread(threadId, [
      {
        role: 'user',
        content: body.prompt,
      },
    ]);

    const taskId = Buffer.from(
      `${userRef}::${threadId}@${Date.now()}`,
    ).toString('base64url');

    await taskRunner.run({
      id: taskId,
      fn: async () => {
        logger.info(JSON.stringify(body));

        const agent = await getAgent({
          authToken,
          discoveryApi,
          rootConfig,
          selectedTools,
        });

        logger.info('generating response...');

        const { response } = await agent.generateVNext(
          [
            {
              role: 'user',
              content: body?.prompt,
            },
          ],
          {
            memory: {
              resource: userRef,
              thread: threadId,
            },
            savePerStep: true,
            onStepFinish: async ({ stepType, toolCalls, toolResults }) => {
              const message = {
                stepType,
                toolCalls,
                toolResults,
              };
              logger.debug(JSON.stringify(message));
              await signals.publish({
                message,
                channel: `assistant:${threadId}`,
                recipients: {
                  type: 'broadcast',
                },
              });
            },
          },
        );

        await model.appendMessagesToThread(
          threadId,
          response.messages as ChatThreadModel['messages'],
        );

        logger.info('Response generated');
      },
    });
    await scheduler.triggerTask(taskId);

    res.status(201).json({
      status: 'processing',
    });
    return;
  });

  /**
   * Delete a chat thread
   */
  router.delete('/chat/:threadId', async (req, res) => {
    console.log(req.params);
    const threadId = req.params.threadId;
    let userRef: string;

    const credentials = await httpAuth.credentials(req);
    if (auth.isPrincipal(credentials, 'user')) {
      userRef = credentials.principal.userEntityRef;
    } else if (auth.isPrincipal(credentials, 'service')) {
      userRef = credentials.principal.subject;
    } else {
      res.status(401).json({
        error: 'Invalid credentials',
      });
      return;
    }

    if (!threadId) {
      res.status(400).json({
        error: 'Please provide a threadId',
      });
      return;
    }

    const thread = await model.getThreadById(threadId);
    if (!thread) {
      res.status(404).json({
        error: `Thread not found for id: ${threadId}`,
      });
      return;
    }
    if (thread.userRef !== userRef) {
      res.status(403).json({
        error: 'Unauthorized'
      });
      return;
    }

    await model.deleteThread(threadId);

    res.status(200).json({
      message: `Deleted thread with threadId: ${threadId}`,
    });
    return;
  });

  return router;
}
