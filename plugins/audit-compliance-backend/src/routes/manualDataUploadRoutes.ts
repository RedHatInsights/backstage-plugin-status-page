import { Knex } from 'knex';
import express from 'express';
import Router from 'express-promise-router';
import * as XLSX from 'xlsx';
import { ManualDataIntegration } from '../database/integrations/ManualDataIntegration';
import { ManualDataItem } from '../types/types';
import busboy from 'busboy';

/**
 * Creates the manual data upload router with all endpoint definitions.
 * @param knex - The Knex client
 * @param config - The root config service
 * @param logger - The logger service
 * @returns An Express router instance with all routes
 */
export async function createManualDataUploadRouter(
  knex: Knex,
  _config: any,
  logger: any,
): Promise<express.Router> {
  const manualStore = new ManualDataIntegration(knex, logger);

  const manualDataUploadRouter = Router();

  /**
   * GET /manual-data/template
   * Generates and downloads an Excel template for manual data upload.
   *
   * @route GET /manual-data/template
   * @returns {Buffer} 200 - Excel template file
   * @returns {Object} 500 - Error response
   */
  manualDataUploadRouter.get('/manual-data/template', async (_req, res) => {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create template data with headers
      const templateData = [
        {
          type: 'service-account',
          source: 'manual',
          account_name: 'example-service-account',
          custom_reviewer: 'reviewer@example.com',
        },
        {
          type: 'rover-group-name',
          source: 'manual',
          account_name: 'example-group',
          custom_reviewer: 'reviewer@example.com',
        },
      ];

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(templateData);

      // Set column widths
      worksheet['!cols'] = [
        { width: 20 }, // type
        { width: 15 }, // source
        { width: 30 }, // account_name
        { width: 30 }, // custom_reviewer
      ];

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Manual Data Template');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set headers for file download
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="manual-data-template.xlsx"',
      );
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error) {
      logger.error('Failed to generate Excel template', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        error: 'Failed to generate Excel template',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /manual-data/upload
   * Accepts an Excel file, parses it, validates the data, and stores it in applications table.
   *
   * @route POST /manual-data/upload
   * @param {Object} req.body - Upload parameters (app_name, frequency, period)
   * @param {File} req.file - Excel file to upload
   * @returns {Object} 200 - Upload results with validation status
   * @returns {Object} 400 - Validation errors or missing parameters
   * @returns {Object} 500 - Error response
   */
  manualDataUploadRouter.post('/manual-data/upload', async (req, res) => {
    try {
      const bb = busboy({
        headers: req.headers,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
      });

      let fileBuffer: Buffer | null = null;
      let fileName: string = '';
      const formData: any = {};

      bb.on('file', (_name, file, info) => {
        const { filename, mimeType } = info;
        fileName = filename;

        // Validate file type
        if (
          !mimeType.includes('spreadsheet') &&
          !mimeType.includes('excel') &&
          !mimeType.includes(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ) &&
          !mimeType.includes('application/vnd.ms-excel')
        ) {
          res
            .status(400)
            .json({ error: 'Only Excel files (.xlsx, .xls) are allowed' });
          // Drain the stream to prevent backpressure after responding
          file.resume();
          return;
        }

        const chunks: Buffer[] = [];
        file.on('data', chunk => chunks.push(chunk));
        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      bb.on('field', (name, val) => {
        formData[name] = val;
      });

      bb.on('finish', async () => {
        try {
          if (res.headersSent) {
            return;
          }
          const { app_name, frequency, period } = formData;

          if (!app_name || !frequency || !period) {
            res.status(400).json({
              error: 'Missing required parameters: app_name, frequency, period',
            });
            return;
          }

          if (!fileBuffer) {
            res.status(400).json({
              error: 'No Excel file provided',
            });
            return;
          }

          logger.info('Processing manual data upload', {
            app_name,
            frequency,
            period,
            fileName,
            fileSize: fileBuffer.length,
          });

          // Parse Excel file
          const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet);

          if (!rawData || rawData.length === 0) {
            res.status(400).json({
              error: 'Excel file is empty or contains no data',
            });
            return;
          }

          // Transform raw data to ManualDataItem format for validation
          const manualData: ManualDataItem[] = rawData.map(
            (row: any, index: number) => {
              // Validate required fields
              if (!row.type || !row.account_name) {
                throw new Error(
                  `Row ${
                    index + 1
                  }: Missing required fields (type, account_name)`,
                );
              }

              // Set default values and transform
              return {
                app_name,
                environment: 'production', // Default environment
                service_account:
                  row.type === 'service-account' ? row.account_name : undefined,
                user_id:
                  row.type === 'rover-group-name'
                    ? row.account_name
                    : undefined,
                full_name:
                  row.type === 'rover-group-name'
                    ? row.account_name
                    : undefined,
                user_role: 'manual-entry', // Default role
                manager: 'Manual Entry', // Default manager
                app_delegate: row.custom_reviewer,
                source: 'manual',
                account_name: row.account_name,
                period,
                frequency,
                custom_reviewer: row.custom_reviewer,
              };
            },
          );

          // Validate the transformed data
          const validation = await manualStore.validateManualData(manualData);
          if (!validation.valid) {
            res.status(400).json({
              error: 'Data validation failed',
              validationErrors: validation.errors,
            });
            return;
          }

          // Clear existing manual accounts for this app
          await knex('applications')
            .where({ app_name, source: 'manual' })
            .delete();

          // Insert new manual accounts into applications table
          const insertData = rawData.map((row: any) => ({
            app_name,
            environment: 'production',
            app_owner: 'Manual Entry',
            app_owner_email: 'manual@example.com',
            app_delegate: row.custom_reviewer,
            account_name: row.account_name,
            source: 'manual',
            type: row.type,
            jira_project: null, // Manual entries don't have JIRA projects
            created_at: new Date(),
          }));

          await knex('applications').insert(insertData);

          logger.info('Manual data upload completed successfully', {
            app_name,
            frequency,
            period,
            recordCount: insertData.length,
          });

          res.json({
            success: true,
            message: 'Manual data uploaded and validated successfully',
            recordCount: insertData.length,
            data: insertData,
          });
          return;
        } catch (error) {
          logger.error('Failed to process manual data upload', {
            error: error instanceof Error ? error.message : String(error),
            app_name: formData.app_name,
            frequency: formData.frequency,
            period: formData.period,
          });

          res.status(500).json({
            error: 'Failed to process manual data upload',
            details: error instanceof Error ? error.message : String(error),
          });
          return;
        }
      });

      bb.on('error', (err: unknown) => {
        const details = err instanceof Error ? err.message : String(err);
        logger.error('Busboy error:', { details });
        res.status(500).json({
          error: 'File upload error',
          details,
        });
      });

      req.pipe(bb);
    } catch (error) {
      logger.error('Failed to process manual data upload', {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        error: 'Failed to process manual data upload',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * GET /manual-data/preview/:app_name/:frequency/:period
   * Retrieves preview of uploaded manual data for validation.
   *
   * @route GET /manual-data/preview/:app_name/:frequency/:period
   * @param {string} app_name - Application name
   * @param {string} frequency - Audit frequency
   * @param {string} period - Audit period
   * @returns {Array} 200 - Preview of uploaded manual data
   * @returns {Object} 404 - No data found
   * @returns {Object} 500 - Error response
   */
  manualDataUploadRouter.get(
    '/manual-data/preview/:app_name/:frequency/:period',
    async (req, res) => {
      try {
        const { app_name, frequency, period } = req.params;

        const manualData = await manualStore.fetchManualDataForFresh(
          app_name,
          frequency,
          period,
        );

        if (manualData.length === 0) {
          res.status(404).json({
            error: 'No manual data found for the specified parameters',
          });
          return;
        }

        res.json({
          app_name,
          frequency,
          period,
          recordCount: manualData.length,
          data: manualData,
        });
        return;
      } catch (error) {
        logger.error('Failed to fetch manual data preview', {
          error: error instanceof Error ? error.message : String(error),
          app_name: req.params.app_name,
          frequency: req.params.frequency,
          period: req.params.period,
        });

        res.status(500).json({
          error: 'Failed to fetch manual data preview',
          details: error instanceof Error ? error.message : String(error),
        });
        return;
      }
    },
  );

  return manualDataUploadRouter;
}
