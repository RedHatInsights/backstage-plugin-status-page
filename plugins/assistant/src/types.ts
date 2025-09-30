import { ProfileInfo } from '@backstage/core-plugin-api';

export type User = ProfileInfo & { userRef?: string; username?: string };

export type ChatMessage = UserMessage | AssistantMessage | ToolMessage;

export type UserMessage = {
  role: 'user';
  content: string;
};

export type AssistantMessage = {
  role: 'assistant';
  content: Array<{
    type: string;
    text?: string;
    toolCallId: string;
    toolName: string;
    input?: {
      [arg: string]: any;
    };
  }>;
};

export type ToolMessage = {
  role: 'tool';
  content: Array<{
    type: string;
    toolCallId: string;
    toolName: string;
    output: {
      type: string;
      value: string;
    };
  }>;
};
