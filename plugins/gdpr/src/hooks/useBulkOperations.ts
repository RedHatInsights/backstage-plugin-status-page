import { useState, useCallback } from 'react';
import { useApi, alertApiRef } from '@backstage/core-plugin-api';
import { gdprApiRef } from '../api';
import { GdprTableData, DeleteRequest, DeleteResponse } from '../types';
import { saveAs } from 'file-saver';

export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  errors: string[];
  data?: any;
}

export interface UseBulkOperationsReturn {
  // State
  isProcessing: boolean;
  currentOperation: 'delete' | 'download' | null;
  progress: number;
  
  // Operations
  bulkDelete: (users: GdprTableData[]) => Promise<BulkOperationResult>;
  bulkDownload: (users: GdprTableData[], filename?: string) => Promise<BulkOperationResult>;
  
  // Utilities
  resetState: () => void;
}

/**
 * Custom hook for managing bulk operations on GDPR data
 * Provides consistent loading states, error handling, and progress tracking
 */
export const useBulkOperations = (): UseBulkOperationsReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<'delete' | 'download' | null>(null);
  const [progress, setProgress] = useState(0);
  
  const gdprApi = useApi(gdprApiRef);
  const alertApi = useApi(alertApiRef);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setCurrentOperation(null);
    setProgress(0);
  }, []);

  const bulkDelete = useCallback(async (users: GdprTableData[]): Promise<BulkOperationResult> => {
    if (users.length === 0) {
      alertApi.post({
        message: "No users selected for deletion.",
        severity: 'warning',
      });
      return { success: false, processedCount: 0, errors: ['No users selected'] };
    }

    setIsProcessing(true);
    setCurrentOperation('delete');
    setProgress(0);

    const errors: string[] = [];
    let processedCount = 0;
    const allResponses: DeleteResponse[] = [];

    try {
      alertApi.post({
        message: `Starting deletion of ${users.length} users...`,
        severity: 'info',
      });

      // Prepare delete requests
      const deleteRequests: DeleteRequest[] = users
        .filter(user => user.uid)
        .map(user => ({
          uid: user.uid!,
          platform: user.platform,
        }));

      // Process in batches to avoid overwhelming the API
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < deleteRequests.length; i += batchSize) {
        batches.push(deleteRequests.slice(i, i + batchSize));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        try {
          const batchResponses = await gdprApi.deleteDrupalGDPRData(batch);
          allResponses.push(...batchResponses);
          processedCount += batch.length;
          
          // Update progress
          setProgress(Math.round((processedCount / deleteRequests.length) * 100));
          
          // Small delay between batches to prevent overwhelming the server
          if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          const errorMsg = `Failed to delete batch ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
        }
      }

      // Generate download file with deletion results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `Bulk_Deleted_GDPR_${timestamp}.json`;
      
      const downloadData = {
        metadata: {
          operation: 'bulk_delete',
          timestamp: new Date().toISOString(),
          totalRequested: users.length,
          successfullyProcessed: processedCount,
          errors: errors.length,
        },
        results: allResponses,
        errors: errors,
      };

      const blob = new Blob([JSON.stringify(downloadData, null, 2)], {
        type: 'application/json',
      });
      saveAs(blob, filename);

      // Show success message
      if (errors.length === 0) {
        alertApi.post({
          message: `Successfully deleted ${processedCount} users.`,
          severity: 'success',
        });
      } else {
        alertApi.post({
          message: `Deleted ${processedCount} users with ${errors.length} errors. Check downloaded file for details.`,
          severity: 'warning',
        });
      }

      return {
        success: errors.length === 0,
        processedCount,
        errors,
        data: allResponses,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      errors.push(errorMessage);
      
      alertApi.post({
        message: `Bulk deletion failed: ${errorMessage}`,
        severity: 'error',
      });

      return {
        success: false,
        processedCount,
        errors,
      };
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
      setProgress(0);
    }
  }, [gdprApi, alertApi]);

  const bulkDownload = useCallback(async (
    users: GdprTableData[],
    filename?: string
  ): Promise<BulkOperationResult> => {
    if (users.length === 0) {
      alertApi.post({
        message: "No users selected for download.",
        severity: 'warning',
      });
      return { success: false, processedCount: 0, errors: ['No users selected'] };
    }

    setIsProcessing(true);
    setCurrentOperation('download');
    setProgress(0);

    try {
      alertApi.post({
        message: `Preparing download for ${users.length} users...`,
        severity: 'info',
      });

      // Simulate processing time for large datasets
      const processingSteps = Math.max(3, Math.ceil(users.length / 10));
      for (let i = 0; i < processingSteps; i++) {
        setProgress(Math.round(((i + 1) / processingSteps) * 100));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultFilename = `GDPR_Export_${timestamp}.json`;
      const finalFilename = filename || defaultFilename;

      // Create comprehensive export data
      const exportData = {
        metadata: {
          operation: 'bulk_export',
          exportDate: new Date().toISOString(),
          recordCount: users.length,
          version: '1.0',
          filters_applied: [], // Could be enhanced with actual filter data
        },
        summary: {
          platforms: [...new Set(users.map(u => u.platform))],
          total_users: users.length,
          users_with_content: users.filter(u => 
            u.comment !== 'N/A' || u.file !== 'N/A' || u.node !== 'N/A' || u.media !== 'N/A'
          ).length,
        },
        data: users.map(user => ({
          ...user,
          export_timestamp: new Date().toISOString(),
        })),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      saveAs(blob, finalFilename);
      
      alertApi.post({
        message: `Successfully exported ${users.length} user records`,
        severity: 'success',
      });

      return {
        success: true,
        processedCount: users.length,
        errors: [],
        data: exportData,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      alertApi.post({
        message: `Export failed: ${errorMessage}`,
        severity: 'error',
      });

      return {
        success: false,
        processedCount: 0,
        errors: [errorMessage],
      };
    } finally {
      setIsProcessing(false);
      setCurrentOperation(null);
      setProgress(0);
    }
  }, [alertApi]);

  return {
    // State
    isProcessing,
    currentOperation,
    progress,
    
    // Operations
    bulkDelete,
    bulkDownload,
    
    // Utilities
    resetState,
  };
};
