import { UserNote } from '@compass/backstage-plugin-workstream-automation-common';
import { Knex } from 'knex';
import { UserNoteModel } from './types';

interface NotesBackendStore {
  getAllNotes(): Promise<UserNote[]>;
  getNotesByUserRefs(userRef: string[]): Promise<UserNote[]>;
  getNoteByUserRef(userRef: string): Promise<UserNote | null>;
  addNote(note: UserNote): Promise<UserNote>;
  updateNote(userRef: string, note: UserNote): Promise<UserNote | null>;
  deleteNote(userRef: string): Promise<boolean>;
}

export class NotesBackendDatabase implements NotesBackendStore {
  private USER_NOTES_TABLE = 'user_notes';
  constructor(private readonly knex: Knex) {}

  async addNote(note: UserNote): Promise<UserNote> {
    const data = this.mapUserNoteToNoteModel(note);
    const [dbResult] = await this.knex
      .table<UserNoteModel>(this.USER_NOTES_TABLE)
      .insert(data, '*');
    return this.mapNoteModelToUserNote(dbResult);
  }

  async updateNote(userRef: string, note: UserNote) {
    const updatedData = this.mapUserNoteToNoteModel(note);
    const dbResult = await this.knex
      .table<UserNoteModel>(this.USER_NOTES_TABLE)
      .select('*')
      .where('user_ref', userRef)
      .update(updatedData, '*');
    if (dbResult.length < 1) {
      return null;
    }
    return this.mapNoteModelToUserNote(dbResult[0]);
  }

  async deleteNote(userRef: string) {
    const dbResult = await this.knex
      .table<UserNoteModel>(this.USER_NOTES_TABLE)
      .select('*')
      .where('user_ref', userRef)
      .del();
    if (dbResult >= 1) return true;
    return false;
  }

  async getNotesByUserRefs(userRefs: string[]) {
    const dbResult = await this.knex
      .table<UserNoteModel>(this.USER_NOTES_TABLE)
      .select('*')
      .whereIn('user_ref', userRefs);
    return dbResult.map(r => this.mapNoteModelToUserNote(r));
  }

  async getNoteByUserRef(userRef: string): Promise<UserNote | null> {
    const dbResult = await this.knex
      .table<UserNoteModel>(this.USER_NOTES_TABLE)
      .select('*')
      .where('user_ref', userRef)
      .first();
    if (!dbResult) return null;
    return this.mapNoteModelToUserNote(dbResult);
  }

  async getAllNotes() {
    const dbResult = await this.knex
      .table<UserNoteModel>(this.USER_NOTES_TABLE)
      .select('*');
    return dbResult.map(r => this.mapNoteModelToUserNote(r));
  }

  private mapUserNoteToNoteModel(note: UserNote): UserNoteModel {
    return {
      user_ref: note.userRef,
      note: note.note,
      modification_history: JSON.stringify(note.editHistory),
    };
  }

  private mapNoteModelToUserNote(dbNote: UserNoteModel): UserNote {
    return {
      userRef: dbNote.user_ref,
      note: dbNote.note ?? '',
      editHistory: JSON.parse(dbNote.modification_history),
    };
  }
}
