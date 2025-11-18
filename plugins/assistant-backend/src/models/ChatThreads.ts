import { ChatThreadModel } from '../types';
import { Knex } from 'knex';
import { customAlphabet, urlAlphabet } from 'nanoid';

const nanoid = customAlphabet(urlAlphabet, 10);

export interface ChatThreadsStore {
  createThread(userRef: string, memory: any): Promise<string>;
  deleteThread(id: string): Promise<boolean>;
  getThreadById(id: string): Promise<ChatThreadModel | undefined>;
  getThreadsForUser(userRef: string): Promise<ChatThreadModel[]>;
  listThreads(): Promise<ChatThreadModel[]>;
}

export class ChatThreads implements ChatThreadsStore {
  private readonly TABLE_NAME = 'chatthreads';

  constructor(private readonly db: Knex) {}

  async createThread(userRef: string, messages: any[]): Promise<string> {
    const [result] = await this.db<ChatThreadModel>(this.TABLE_NAME).insert(
      {
        id: nanoid(),
        userRef,
        /*
        Stringifying array due to incompatibility between native array and postgres json types
        Ref: https://knexjs.org/guide/schema-builder.html#json
        */
        messages: JSON.stringify(messages) as any,
      },
      'id',
    );

    return result.id;
  }

  async appendMessagesToThread(
    id: string,
    messages: ChatThreadModel['messages'],
  ): Promise<boolean> {
    const thread = await this.getThreadById(id);

    if (!thread) {
      return false;
    }

    const existingMessages =
      typeof thread.messages === 'string'
        ? JSON.parse(thread.messages) as ChatThreadModel['messages']
        : thread.messages;

    const result = await this.db<ChatThreadModel>(this.TABLE_NAME)
      .where({ id })
      .update(
        {
          /*
        Stringifying array due to incompatibility between native array and postgres json types
        Ref: https://knexjs.org/guide/schema-builder.html#json
        */
          messages: JSON.stringify([
            ...existingMessages,
            ...messages,
          ]) as any,
        },
        ['id', 'updatedAt'],
      );

    return result?.length > 0;
  }

  async deleteThread(id: string): Promise<boolean> {
    const result = await this.db<ChatThreadModel>(this.TABLE_NAME)
      .select('*')
      .where('id', id)
      .del();

    return result === 1;
  }

  async getThreadById(id: string): Promise<ChatThreadModel | undefined> {
    return await this.db<ChatThreadModel>(this.TABLE_NAME)
      .select('*')
      .where('id', id)
      .first();
  }

  async getThreadsForUser(userRef: string): Promise<ChatThreadModel[]> {
    return await this.db<ChatThreadModel>(this.TABLE_NAME)
      .select('*')
      .where('userRef', userRef)
      .orderBy('createdAt');
  }

  async listThreads(): Promise<ChatThreadModel[]> {
    return await this.db<ChatThreadModel>(this.TABLE_NAME).select('*');
  }
}
