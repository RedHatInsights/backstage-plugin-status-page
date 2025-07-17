import { parseEntityRef } from '@backstage/catalog-model';
import {
  AlertApi,
  createApiRef,
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';
import { UserNote } from '@compass/backstage-plugin-workstream-automation-common';

export class NoteApiClient {
  constructor(
    private readonly alertApi: AlertApi,
    private readonly discoveryApi: DiscoveryApi,
    private readonly fetchApi: FetchApi,
  ) {}

  private async getBaseUrl() {
    return `${await this.discoveryApi.getBaseUrl('workstream')}/note`;
  }

  async getNote(userId: string) {
    const { kind, name, namespace } = parseEntityRef(userId);
    const baseUrl = `${await this.getBaseUrl()}/${kind}/${namespace}/${name}`;

    const res = await this.fetchApi.fetch(baseUrl, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()).note;
      return data;
    }
    return undefined;
  }

  async getNotes(userRefs: string[]) {
    const baseUrl = new URL(await this.getBaseUrl());
    for (const userRef of userRefs) {
      baseUrl.searchParams.append('userRef', userRef);
    }
    const res = await this.fetchApi.fetch(baseUrl, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const data = (await res.json()).notes;
      return data;
    }
    return undefined;
  }

  async createNote(note: UserNote) {
    try {
      const baseUrl = await this.getBaseUrl();
      const res = await this.fetchApi.fetch(baseUrl, {
        method: 'POST',
        body: JSON.stringify(note),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(
          `Failed to create note for ${parseEntityRef(note.userRef).name}`,
        );
      } else {
        this.alertApi.post({
          message: `Note for ${
            parseEntityRef(note.userRef).name
          } created successfully`,
          severity: 'success',
          display: 'transient',
        });
      }
    } catch (error) {
      this.alertApi.post({
        message:
          error instanceof Error ? error.message : 'Failed to create note',
        severity: 'error',
        display: 'transient',
      });
    }
  }

  async updateNote(userRef: string, note: UserNote) {
    try {
      const { kind, name, namespace } = parseEntityRef(userRef);
      const baseUrl = `${await this.getBaseUrl()}/${kind}/${namespace}/${name}`;
      const res = await this.fetchApi.fetch(baseUrl, {
        method: 'PUT',
        body: JSON.stringify(note),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`Failed to update note for ${name}`);
      } else {
        this.alertApi.post({
          message: `Note for ${name} updated successfully`,
          severity: 'success',
          display: 'transient',
        });
      }
    } catch (error) {
      this.alertApi.post({
        message:
          error instanceof Error ? error.message : 'Failed to delete note',
        severity: 'error',
        display: 'transient',
      });
    }
  }

  async deleteNote(userRef: string) {
    try {
      const { kind, name, namespace } = parseEntityRef(userRef);
      const baseUrl = `${await this.getBaseUrl()}/${kind}/${namespace}/${name}`;
      const res = await this.fetchApi.fetch(baseUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`Failed to delete note for ${name}`);
      }
      this.alertApi.post({
        message: `Note for ${name} deleted successfully`,
        severity: 'success',
        display: 'transient',
      });
    } catch (error) {
      this.alertApi.post({
        message:
          error instanceof Error ? error.message : 'Failed to delete note',
        severity: 'error',
        display: 'transient',
      });
    }
  }
}

export const noteApiRef = createApiRef<NoteApiClient>({
  id: 'workstream-automation.user-note',
});
