import { LoggerService } from '@backstage/backend-plugin-api';
import { TemplateBody } from '../constants';
import { TemplateServiceType } from './types';
import { IncidentsStore } from '../database/IncidentsDatabase';

export async function TemplateFetchService({
  logger,
}: {
  logger: LoggerService;
}): Promise<TemplateServiceType> {
  logger.info('Initializing TemplateService');

  // Cache for templates with file watching

  return {
    async createTemplate(templateBody: TemplateBody, database: IncidentsStore) {
      try {
        const response = await database.insertTemplate(templateBody);
        return response;
      } catch (error) {
        logger.error(String(`Error writing template to JSON file: ${error}`));
        return { success: false, error: 'Failed to write template' };
      }
    },
    async getTemplates(database: IncidentsStore) {
      try {
        const response = await database.getTemplates();
        return response;
      } catch (error) {
        logger.error(String(`Error reading templates from file: ${error}`));
        return { success: false, error: 'Failed to fetch templates' };
      }
    },
    async updateTemplate(templateBody: TemplateBody, database: IncidentsStore) {
      try {
        const response = await database.updateTemplate(templateBody);
        return response;
      } catch (error) {
        logger.error(String(`Error updating template: ${error}`));
        return { success: false, error: 'Failed to update template' };
      }
    },
    async deleteTemplate(templateId: string, database: IncidentsStore) {
      try {
        const response = await database.deleteTemplate(templateId);
        return response;
      } catch (error) {
        logger.error(String(`Error deleting template: ${error}`));
        return { success: false, error: 'Failed to delete template' };
      }
    },
  };
}
