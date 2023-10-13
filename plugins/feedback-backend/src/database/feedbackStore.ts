import {
  PluginDatabaseManager,
  resolvePackagePath,
} from '@backstage/backend-common';
import { Knex } from 'knex';
import { FeedbackModel } from '../model/feedback.model';
import short from 'short-uuid';
import { Logger } from 'winston';

export interface FeedbackStore {
  getFeedbackByUuid(uuid: String): Promise<FeedbackModel>;

  storeFeedbackGetUuid(
    data: FeedbackModel,
  ): Promise<{ feedbackId: String; projectId: string } | 0>;

  getAllFeedbacks(
    projectId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: FeedbackModel[]; totalFeedbacks: number }>;
}

const migrationsDir = resolvePackagePath(
  '@appdev-platform/backstage-plugin-feedback-backend', // Package name
  'migrations', // Migrations directory
);

export class DatabaseFeedbackStore implements FeedbackStore {
  private constructor(
    private readonly db: Knex,
    private readonly logger: Logger,
  ) {}

  static async create({
    database,
    skipMigrations,
    logger,
  }: {
    database: PluginDatabaseManager;
    skipMigrations: boolean;
    logger: Logger;
  }): Promise<DatabaseFeedbackStore> {
    const client = await database.getClient();

    if (!database.migrations?.skip && !skipMigrations) {
      await client.migrate.latest({
        directory: migrationsDir,
      });
    }
    return new DatabaseFeedbackStore(client, logger);
  }

  async getFeedbackByUuid(feedbackId: string): Promise<FeedbackModel> {
    const result: FeedbackModel = await this.db('feedback')
      .select('*')
      .where({ feedbackId: feedbackId })
      .first();
    return result;
  }

  async getAllFeedbacks(
    projectId: string,
    page: number,
    pageSize: number,
  ): Promise<{ data: FeedbackModel[]; totalFeedbacks: number }> {
    const model = this.db('feedback');
    const offset = (page - 1) * pageSize;
    const result: FeedbackModel[] = [];

    if (projectId !== 'all') {
      try {
        const tempFeedbacksArr = await model
          .clone()
          .select('projectId')
          .where('projectId', projectId)
          .count('feedbackId')
          .groupBy('projectId');

        const totalFeedbacks =
          // count the correct number of feedbacks for
          // sqlite db
          tempFeedbacksArr[0]?.['count(`feedbackId`)'] ??
          // for postgres db
          tempFeedbacksArr[0]?.count ??
          // else
          0;
        await model
          .clone()
          .select('*')
          .where('projectId', projectId)
          .orderBy('updatedAt', 'desc')
          .offset(offset)
          .limit(pageSize)
          .then(res => {
            res.forEach(data => result.push(data));
          });
        return {
          data: result,
          totalFeedbacks: parseInt(totalFeedbacks as string, 10),
        };
      } catch (error: any) {
        this.logger.error(error.message);
      }
      return { data: result, totalFeedbacks: 0 };
    }
    const totalFeedbacks =
      // count the correct number of feedbacks
      // for sqlitedb
      (await model.clone().count('feedbackId'))[0]?.['count(`feedbackId`)'] ??
      // for postgresdb
      (await model.clone().count('feedbackId'))[0]?.count ??
      // else
      0;
    await model
      .clone()
      .select('*')
      .orderBy('updatedAt', 'desc')
      .limit(pageSize)
      .offset(offset)
      .then(res => {
        res.forEach(data => result.push(data));
      });

    return {
      data: result,
      totalFeedbacks: parseInt(totalFeedbacks as string, 10),
    };
  }

  async storeFeedbackGetUuid(
    data: FeedbackModel,
  ): Promise<{ projectId: string; feedbackId: string } | 0> {
    try {
      const id = short().generate();
      if (await this.checkFeedbackId(id))
        return await this.storeFeedbackGetUuid(data);
      await this.db('feedback').insert({
        feedbackId: id,
        summary: data.summary,
        projectId: data.projectId,
        description: data.description,
        tag: data.tag,
        ticketUrl: data.ticketUrl,
        feedbackType: data.feedbackType,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
        url: data.url,
        userAgent: data.userAgent,
      });

      return {
        feedbackId: id,
        projectId: data.projectId as string,
      };
    } catch (error: any) {
      this.logger.error(error.message);
      return 0;
    }
  }

  async checkFeedbackId(feedbackId: string): Promise<boolean> {
    const result: string = await this.db('feedback')
      .select('feedbackId')
      .where({ feedbackId: feedbackId })
      .first();

    if (result === undefined) {
      return false;
    }
    return true;
  }

  async updateFeedback(
    data: FeedbackModel,
  ): Promise<FeedbackModel | undefined> {
    const model = this.db('feedback').where('feedbackId', data.feedbackId);

    if (data.projectId) model.update('projectId', data.projectId);
    if (data.summary) model.update('summary', data.summary);
    if (data.description) model.update('description', data.description);
    if (data.tag) model.update('tag', data.tag);
    if (data.ticketUrl) model.update('ticketUrl', data.ticketUrl);
    if (data.feedbackType) model.update('feedbackType', data.feedbackType);
    if (data.createdAt) model.update('createdAt', data.createdAt);
    if (data.createdBy) model.update('createdBy', data.createdBy);
    if (data.updatedAt) model.update('updatedAt', data.updatedAt);
    if (data.updatedBy) model.update('updatedBy', data.updatedBy);
    if (data.userAgent) model.update('userAgent', data.userAgent);
    if (data.url) model.update('url', data.url);

    try {
      await model.clone();
      const result: FeedbackModel = await this.db('feedback')
        .select('*')
        .where({ feedbackId: data.feedbackId })
        .first();
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to update feedback: ${error.message}`);
      return undefined;
    }
  }

  async deleteFeedbackById(id: string): Promise<number> {
    return await this.db('feedback').where('feedbackId', id).del();
  }
}
