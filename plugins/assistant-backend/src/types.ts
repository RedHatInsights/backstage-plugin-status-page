export type ChatThread = {
  id?: string;
  userRef: string;
  messages: Array<{
    id: string;
    role: 'system' | 'assistant' | 'user' | 'tool';
    content: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type ChatThreadModel = ChatThread & {
  id: string;
};
