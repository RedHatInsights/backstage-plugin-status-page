import { parseEntityRef } from '@backstage/catalog-model';
import {
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { createContext, PropsWithChildren, useEffect, useState } from 'react';
import {
  useAsync,
  useAsyncFn,
  useEffectOnce,
  useSessionStorage,
} from 'react-use';
import { SESSION_HEADER_KEY, SESSION_STORE_KEY } from '../constants';
import { ChatMessage, User } from '../types';

export type AgentContextProps = {
  loading: boolean;
  messages: ChatMessage[];
  error?: Error;
  user?: User;
  threadId?: string | null;
  loadingTools: boolean;
  availableTools: { id: string; description: string }[];
  selectedTools: string[];
  updateSelectedTools: (tools: string[]) => void;
  reloadChat?: () => void;
  submitQuery: (query: string) => Promise<void>;
  clearChat?: () => Promise<void>;
};

export const AgentContext = createContext<AgentContextProps>({
  loading: true,
  messages: [],
  loadingTools: true,
  availableTools: [],
  selectedTools: [],
  updateSelectedTools: () => {},
  submitQuery: () => Promise.resolve(),
});

export const AgentProvider = ({ children }: PropsWithChildren<any>) => {
  const discoveryApi = useApi(discoveryApiRef);
  const identityApi = useApi(identityApiRef);
  const [user, setUser] = useState<User>();
  const [threadId, setThreadId] = useSessionStorage<string | null>(
    SESSION_STORE_KEY,
    '',
    true,
  );
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const { fetch } = useApi(fetchApiRef);

  const tools = useAsync(async () => {
    const baseUrl = await discoveryApi.getBaseUrl('assistant');
    const url = new URL(`${baseUrl}/tools`);
    const response = await fetch(url);
    const allTools = await response.json();
    if (!allTools) {
      return [];
    }
    return Object.values<{ id: string; description: string }>(allTools);
  }, []);

  const [chat, fetchChat] = useAsyncFn(async () => {
    const baseUrl = await discoveryApi.getBaseUrl('assistant');
    const url = new URL(`${baseUrl}/chat`);
    const response = await fetch(url, {
      headers: {
        ...(threadId && {
          [SESSION_HEADER_KEY]: threadId,
        }),
      },
    });

    if (!response.ok) {
      const body = await response.json();
      throw new Error(
        `Error ${response.status}: ${body.error ?? response.statusText}`,
      );
    }

    const body = await response.json();

    if (!threadId || threadId !== body.threadId) {
      setThreadId(body.threadId);
    }

    return body.messages ?? [];
  }, [threadId]);

  useEffectOnce(() => {
    fetchChat();
  });

  useEffect(() => {
    /* Fetch user ref */
    identityApi.getBackstageIdentity().then(identity => {
      const username = parseEntityRef(identity.userEntityRef).name;
      setUser(u => ({
        ...u,
        userRef: identity.userEntityRef,
        username,
      }));
    });

    /* Get user profile info */
    identityApi.getProfileInfo().then(info => {
      setUser(u => ({ ...u, ...info }));
    });
  }, [identityApi]);

  const updateSelectedTools = ($tools: string[]) => {
    setSelectedTools($tools);
  };

  const [_response, submitQuery] = useAsyncFn(
    async (prompt: string) => {
      if (!threadId) {
        return;
      }
      const activeTools =
        selectedTools.length > 0
          ? tools.value?.filter(tool => selectedTools.includes(tool.id))
          : tools.value;
      const baseUrl = await discoveryApi.getBaseUrl('assistant');
      const url = new URL(`${baseUrl}/chat`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          [SESSION_HEADER_KEY]: threadId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          prompt,
          tools: activeTools ?? [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      /* Force a chatReload */
      fetchChat();

      return;
    },
    [threadId, selectedTools],
  );

  const [_clearThreadResponse, clearChat] = useAsyncFn(async () => {
    if (!threadId) {
      return;
    }
    const baseUrl = await discoveryApi.getBaseUrl('assistant');
    const url = new URL(`${baseUrl}/chat/${threadId}`);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    setThreadId('');
    return;
  }, [threadId]);

  return (
    <AgentContext.Provider
      value={{
        loading: chat.value ? chat.value.at(-1)?.role === 'user' : chat.loading,
        messages: chat.value,
        reloadChat: fetchChat,
        user,
        threadId,
        loadingTools: tools.loading,
        availableTools: tools.value ?? [],
        selectedTools,
        updateSelectedTools,
        submitQuery,
        clearChat,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};
