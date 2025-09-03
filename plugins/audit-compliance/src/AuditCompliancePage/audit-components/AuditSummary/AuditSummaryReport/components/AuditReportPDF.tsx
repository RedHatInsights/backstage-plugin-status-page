import { jsPDF as JsPDF } from 'jspdf';
import {
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { StatisticsData } from '../types';
import { calculateTotals } from '../utils';

interface AuditReportPDFProps {
  data: {
    app_name: string;
    frequency: string;
    period: string;
    jira_key?: string;
  };
  statistics: StatisticsData | null;
  userAccessData: any[];
  serviceAccountData: any[];
  applicationDetails: any;
  documentationEvidence: string;
  auditorNotes: string;
  userRef: string;
  isAuditCompleted: boolean;
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface Account {
  type: string;
  source: string;
  account_name: string;
}

export const useAuditReportPDF = () => {
  const discoveryApi = useApi(discoveryApiRef);
  const fetchApi = useApi(fetchApiRef);

  const generateComprehensivePDF = async (props: AuditReportPDFProps) => {
    const {
      data,
      statistics,
      userAccessData,
      serviceAccountData,
      applicationDetails,
      documentationEvidence,
      auditorNotes,
      onSuccess,
      onError,
    } = props;

    try {
      const pdf = new JsPDF('p', 'pt', 'a3');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - 2 * margin;
      let currentY = margin;

      // Helper function to add new page if needed
      const addPageIfNeeded = (requiredHeight: number) => {
        if (currentY + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
        }
      };

      // Helper function to render section header
      const renderSectionHeader = (title: string, fontSize: number = 18) => {
        addPageIfNeeded(fontSize + 20);
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80); // Dark blue-gray
        pdf.text(title, margin, currentY);
        currentY += fontSize + 5; // Reduced from 10 to 5
        return currentY;
      };

      // Helper function to render subsection header
      const renderSubsectionHeader = (title: string, fontSize: number = 14) => {
        addPageIfNeeded(fontSize + 15);
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(52, 73, 94); // Medium blue-gray
        pdf.text(title, margin + 20, currentY);
        currentY += fontSize + 8;
        return currentY;
      };

      // Helper function to render text
      const renderText = (
        text: string,
        fontSize: number = 10,
        indent: number = 0,
      ) => {
        addPageIfNeeded(fontSize + 5);
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(44, 62, 80);
        pdf.text(text, margin + indent, currentY);
        currentY += fontSize + 5;
        return currentY;
      };

      // Helper function to render table
      const renderTable = (
        headers: string[],
        tableData: any[][],
        columnWidths: number[],
      ) => {
        const rowHeight = 30; // Increased row height for wrapped text
        const headerHeight = 30;
        const totalHeight = headerHeight + tableData.length * rowHeight;

        addPageIfNeeded(totalHeight + 10); // Reduced from 20 to 10

        // Draw table header
        pdf.setFillColor(236, 240, 241); // Light gray background
        pdf.rect(margin, currentY, contentWidth, headerHeight, 'F');

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80);

        let xPos = margin;
        headers.forEach((header, index) => {
          pdf.text(header, xPos + 5, currentY + 20);
          xPos += columnWidths[index];
        });

        currentY += headerHeight;

        // Draw table rows
        pdf.setFontSize(9); // Smaller font for better fit
        pdf.setFont('helvetica', 'normal');

        tableData.forEach((row: any[], rowIndex: number) => {
          // Check if we need a new page for this row
          if (currentY + rowHeight > pageHeight - margin) {
            pdf.addPage();
            currentY = margin;
          }

          // Alternate row colors
          if (rowIndex % 2 === 0) {
            pdf.setFillColor(248, 249, 250); // Very light gray
            pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
          }

          xPos = margin;
          row.forEach((cell: any, cellIndex: number) => {
            let cellText = String(cell || '');

            // Truncate very long text to prevent excessive wrapping
            if (cellText.length > 50) {
              cellText = `${cellText.substring(0, 47)}...`;
            }

            // Wrap text to fit column width with tighter padding
            const maxWidth = columnWidths[cellIndex] - 6; // Reduced padding to 3px on each side
            const wrappedText = pdf.splitTextToSize(cellText, maxWidth);

            // Calculate actual height needed for this cell
            const cellHeight = wrappedText.length * 10; // Reduced line height to 10pt
            const actualRowHeight = Math.max(rowHeight, cellHeight + 8);

            // If this row needs more height, adjust the current row
            if (actualRowHeight > rowHeight) {
              // Redraw the row background with new height
              if (rowIndex % 2 === 0) {
                pdf.setFillColor(248, 249, 250);
                pdf.rect(margin, currentY, contentWidth, actualRowHeight, 'F');
              }
            }

            // Set text color based on status (assuming Status column is at index 2)
            if (cellIndex === 2) {
              // Status column
              const status = cellText.toLowerCase();
              if (status === 'approved') {
                pdf.setTextColor(76, 175, 80); // Green color for approved
              } else if (status === 'rejected' || status === 'revoked') {
                pdf.setTextColor(244, 67, 54); // Red color for rejected/revoked
              } else {
                pdf.setTextColor(52, 73, 94); // Default color for other statuses
              }
            } else {
              pdf.setTextColor(52, 73, 94); // Default color for non-status columns
            }

            // Render wrapped text with better positioning
            pdf.text(wrappedText, xPos + 3, currentY + 12);
            xPos += columnWidths[cellIndex];
          });

          currentY += Math.max(rowHeight, 30); // Use actual height or minimum 30
        });

        currentY += 20;
        return currentY;
      };

      // Helper function to render a card-like section
      const renderCard = (title: string, content: any[][], startY: number) => {
        const cardHeight = 35 + content.length * 25 + 10; // Title + 2 blank lines + content + padding
        addPageIfNeeded(cardHeight + 30);

        // Draw card background
        pdf.setFillColor(248, 249, 250); // Light gray background
        pdf.rect(margin, startY, contentWidth, cardHeight, 'F');

        // Draw card border
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(margin, startY, contentWidth, cardHeight);

        // Render title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80);
        pdf.text(title, margin + 15, startY + 15);

        // Render content
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(52, 73, 94);

        let contentY = startY + 45; // Title + 2 blank lines (15 + 30)
        content.forEach(([label, value]) => {
          // Render label in bold
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${label}:`, margin + 20, contentY);

          // Render value in normal weight with proper spacing
          pdf.setFont('helvetica', 'normal');
          const labelWidth = pdf.getTextWidth(`${label}:`);
          pdf.text(value, margin + 20 + labelWidth + 15, contentY); // Increased spacing from 5 to 15

          contentY += 25; // Increased line spacing from 20 to 25
        });

        return startY + cardHeight + 15;
      };

      // Helper function to render approval block card
      const renderApprovalCard = (
        title: string,
        name: string,
        role: string,
        timestamp: string,
        startY: number,
        startX: number,
        cardWidth: number,
      ) => {
        const cardHeight = 100;
        addPageIfNeeded(cardHeight + 20);

        // Draw card background
        pdf.setFillColor(248, 249, 250);
        pdf.rect(startX, startY, cardWidth, cardHeight, 'F');

        // Draw card border
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(startX, startY, cardWidth, cardHeight);

        // Render title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80);
        pdf.text(title, startX + cardWidth / 2, startY + 15, {
          align: 'center',
        });

        // Render details
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(52, 73, 94);

        let yOffset = 35;

        // Helper function to render label-value pair
        const renderLabelValue = (label: string, value: string) => {
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${label}:`, startX + 10, startY + yOffset);
          pdf.setFont('helvetica', 'normal');
          const labelWidth = pdf.getTextWidth(`${label}:`);
          pdf.text(value, startX + 10 + labelWidth + 15, startY + yOffset);
          yOffset += 15;
        };

        renderLabelValue('Name', name);
        renderLabelValue('Role', role);
        renderLabelValue('Timestamp', timestamp);

        return startY + cardHeight + 15;
      };

      // Helper function to render a statistics card
      const renderStatCard = (
        title: string,
        value: number,
        type: 'total' | 'approved' | 'rejected' | 'pending',
        startY: number,
        startX: number,
        cardWidth: number,
        subtitle?: string,
      ) => {
        const cardHeight = 80;
        addPageIfNeeded(cardHeight + 20);

        // Get color based on type
        const getColor = () => {
          switch (type) {
            case 'approved':
              return '#4caf50';
            case 'rejected':
              return '#f44336';
            case 'pending':
              return '#ff9800';
            default:
              return '#0066cc';
          }
        };

        // Draw card background
        pdf.setFillColor(248, 249, 250);
        pdf.rect(startX, startY, cardWidth, cardHeight, 'F');

        // Draw card border
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(startX, startY, cardWidth, cardHeight);

        // Render value (large and colored)
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(getColor());
        pdf.text(value.toString(), startX + cardWidth / 2, startY + 25, {
          align: 'center',
        });

        // Render title
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(44, 62, 80);
        pdf.text(title, startX + cardWidth / 2, startY + 45, {
          align: 'center',
        });

        // Render subtitle if provided
        if (subtitle) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(52, 73, 94);
          pdf.text(subtitle, startX + cardWidth / 2, startY + 60, {
            align: 'center',
          });
        }

        return startY + cardHeight + 15;
      };

      // Helper function to filter accounts by type and source
      const filterAccounts = (
        accounts: Account[],
        type: string,
        source?: string,
      ) => {
        return accounts.filter(
          (acc: Account) =>
            acc.type === type && (!source || acc.source === source),
        );
      };

      // Helper function to get account names as string
      const getAccountNames = (accounts: Account[]) => {
        return accounts.length > 0
          ? accounts.map((acc: Account) => acc.account_name).join(', ')
          : 'None';
      };

      // Helper function to render service account details
      const renderServiceAccountDetails = () => {
        currentY = renderSectionHeader('Service Account Details');

        if (serviceAccountData && serviceAccountData.length > 0) {
          const serviceHeaders = [
            'Full Name',
            'Role',
            'Status',
            'Source',
            'Approval Date',
            'Approved By',
            'TicketID',
            'Comments',
          ];
          const serviceColumnWidths = [120, 80, 80, 70, 100, 90, 60, 100];

          const serviceTableData = serviceAccountData.map(service => [
            service.service_account || '',
            service.user_role || '',
            service.sign_off_status || '',
            service.source || '',
            service.sign_off_date || 'N/A',
            service.sign_off_by || 'N/A',
            service.ticket_reference || 'N/A',
            service.comments || 'N/A',
          ]);

          currentY = renderTable(
            serviceHeaders,
            serviceTableData,
            serviceColumnWidths,
          );
        } else {
          currentY = renderText('No service account data available', 12);
        }
      };

      // 1. TITLE PAGE
      pdf.setFillColor('#333332');
      pdf.rect(0, 0, pageWidth, 120, 'F');

      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('AUDIT COMPLIANCE REPORT', pageWidth / 2, 60, {
        align: 'center',
      });

      pdf.setFontSize(18);
      pdf.text(
        `${data.frequency.toUpperCase()} Access Review - ${data.period}`,
        pageWidth / 2,
        90,
        { align: 'center' },
      );

      currentY = 160;

      // 2. APPLICATION DETAILS
      currentY = renderSectionHeader('Application Details');

      if (applicationDetails) {
        // Basic Information Card
        const basicInfo = [
          [
            'Application Name',
            (applicationDetails.app_name || '')
              .replace(/-/g, ' ')
              .toUpperCase(),
          ],
          [
            'CMDB ID',
            (applicationDetails.cmdb_id || 'Not specified').toUpperCase(),
          ],
          ['Jira ID', (data.jira_key || 'Not specified').toUpperCase()],
          [
            'Environment',
            (applicationDetails.environment || 'Not specified').toUpperCase(),
          ],
          [
            'Application Owner',
            (applicationDetails.app_owner || 'Not specified').toUpperCase(),
          ],
          [
            'Application Delegate',
            (applicationDetails.app_delegate || 'Not specified').toUpperCase(),
          ],
          ['Generated On', new Date().toLocaleDateString().toUpperCase()],
        ];
        currentY = renderCard('Basic Information', basicInfo, currentY);

        // Account Information Card
        if (
          applicationDetails.accounts &&
          applicationDetails.accounts.length > 0
        ) {
          const accounts = applicationDetails.accounts as Account[];
          const roverAccounts = filterAccounts(
            accounts,
            'rover-group-name',
            'rover',
          );
          const gitlabAccounts = filterAccounts(
            accounts,
            'rover-group-name',
            'gitlab',
          );
          const ldapAccounts = filterAccounts(
            accounts,
            'rover-group-name',
            'ldap',
          );
          const serviceAccounts = filterAccounts(accounts, 'service-account');

          const accountSummary = [
            ['Rover Accounts', getAccountNames(roverAccounts)],
            ['GitLab Accounts', getAccountNames(gitlabAccounts)],
            ['LDAP Accounts', getAccountNames(ldapAccounts)],
            ['Service Accounts', getAccountNames(serviceAccounts)],
          ];
          currentY = renderCard('Account Summary', accountSummary, currentY);
        }
      }

      currentY += 20;

      // 3. APPROVAL BLOCKS
      currentY = renderSectionHeader('Approval Blocks');

      // Calculate card dimensions for side-by-side layout
      const approvalCardWidth = (contentWidth - 30) / 2; // 30px for spacing
      const approvalCardSpacing = 30;

      // Get approval information from application details
      const delegateName = applicationDetails?.app_delegate || 'Not specified';
      const ownerName = applicationDetails?.app_owner || 'Not specified';
      const currentDate = new Date().toLocaleDateString();

      // Render approval blocks side by side
      currentY = renderApprovalCard(
        'Delegate Approval',
        delegateName,
        'Application Delegate',
        currentDate,
        currentY,
        margin,
        approvalCardWidth,
      );

      renderApprovalCard(
        'Final Approval',
        ownerName,
        'Application Owner',
        currentDate,
        currentY - 115,
        margin + approvalCardWidth + approvalCardSpacing,
        approvalCardWidth,
      );

      currentY += 20;

      // 4. APPLICATION / AUDIT STATISTICS
      currentY = renderSectionHeader('Application / Audit Statistics');

      if (statistics) {
        const totals = calculateTotals(statistics);

        // Calculate card dimensions for grid layout
        const cardsPerRow = 3;
        const cardWidth = (contentWidth - 40) / cardsPerRow; // 40px for spacing
        const cardSpacing = 20;
        const cardHeight = 80;
        const rowSpacing = 20;

        // First row - Overview cards
        const row1Y = currentY;
        currentY = renderStatCard(
          'Total Reviews',
          totals.totalAccessReviews.after,
          'total',
          row1Y,
          margin,
          cardWidth,
          'All Access Reviews',
        );

        renderStatCard(
          'Total Approvals',
          statistics.statusOverview.totalReviews.approved,
          'approved',
          row1Y,
          margin + cardWidth + cardSpacing,
          cardWidth,
          'Approved Access Reviews',
        );

        renderStatCard(
          'Total Rejections',
          statistics.statusOverview.totalReviews.rejected,
          'rejected',
          row1Y,
          margin + (cardWidth + cardSpacing) * 2,
          cardWidth,
          'Rejected Access Reviews',
        );

        // Second row - Service Accounts and Source cards
        const row2Y = row1Y + cardHeight + rowSpacing;
        currentY = renderStatCard(
          'Service Accounts',
          totals.totalServiceAccounts.after,
          'total',
          row2Y,
          margin,
          cardWidth,
          `${
            statistics.service_accounts.rover.approved +
            statistics.service_accounts.gitlab.approved +
            statistics.service_accounts.ldap.approved
          } Approved, ${
            statistics.service_accounts.rover.rejected +
            statistics.service_accounts.gitlab.rejected +
            statistics.service_accounts.ldap.rejected
          } Rejected`,
        );

        renderStatCard(
          'Rover Reviews',
          statistics.group_access.rover.total,
          'total',
          row2Y,
          margin + cardWidth + cardSpacing,
          cardWidth,
          `${statistics.group_access.rover.approved} Approved, ${statistics.group_access.rover.rejected} Rejected`,
        );

        renderStatCard(
          'GitLab Reviews',
          statistics.group_access.gitlab.total,
          'total',
          row2Y,
          margin + (cardWidth + cardSpacing) * 2,
          cardWidth,
          `${statistics.group_access.gitlab.approved} Approved, ${statistics.group_access.gitlab.rejected} Rejected`,
        );

        // Third row - LDAP card and additional cards
        const row3Y = row2Y + cardHeight + rowSpacing;
        renderStatCard(
          'LDAP Reviews',
          statistics.group_access.ldap.total,
          'total',
          row3Y,
          margin,
          cardWidth,
          `${statistics.group_access.ldap.approved} Approved, ${statistics.group_access.ldap.rejected} Rejected`,
        );

        renderStatCard(
          'User Accounts',
          totals.totalUserAccounts.after,
          'total',
          row3Y,
          margin + cardWidth + cardSpacing,
          cardWidth,
          'Total User Accounts',
        );

        renderStatCard(
          'Pending Reviews',
          statistics.statusOverview.totalReviews.pending,
          'pending',
          row3Y,
          margin + (cardWidth + cardSpacing) * 2,
          cardWidth,
          'Pending Access Reviews',
        );

        // Add new line after the grid
        currentY = row3Y + cardHeight + 40; // 40px spacing after the grid
      }

      // Force page break after statistics
      pdf.addPage();
      currentY = margin;

      // 4. USER ACCOUNT DETAILS
      currentY = renderSectionHeader('User Account Details');

      if (userAccessData && userAccessData.length > 0) {
        const userHeaders = [
          'Full Name',
          'Role',
          'Status ',
          'Source',
          'Account Name',
          'Approval Date',
          'Approved By',
          'TicketID',
          'Comments',
        ];
        const userColumnWidths = [100, 80, 80, 70, 100, 100, 90, 60, 100];

        const userTableData = userAccessData.map(user => [
          user.full_name || '',
          user.user_role || '',
          user.sign_off_status || '',
          user.source || '',
          user.account_name || '',
          user.sign_off_date || 'N/A',
          user.sign_off_by || 'N/A',
          user.ticket_reference || 'N/A',
          user.comments || 'N/A',
        ]);

        // Calculate how many rows can fit on the first page
        const headerHeight = 30; // Table header height
        const rowHeight = 30; // Each row height
        const titleHeight = 18 + 5; // Section header height
        const availableHeight = pageHeight - margin - currentY - titleHeight;
        const maxRowsOnFirstPage = Math.floor(
          (availableHeight - headerHeight) / rowHeight,
        );

        // Only apply continuation logic if more than 33 rows total
        if (userTableData.length > 33) {
          // Ensure we show at least 1 row on first page, and move 2 rows to next page
          const rowsOnFirstPage = Math.max(
            1,
            Math.min(maxRowsOnFirstPage, userTableData.length - 2),
          );
          const rowsOnSecondPage = userTableData.length - rowsOnFirstPage;

          // Render first part of the table
          const firstPageData = userTableData.slice(0, rowsOnFirstPage);
          currentY -= 15; // Move table closer to title
          currentY = renderTable(userHeaders, firstPageData, userColumnWidths);

          // If there are remaining rows, add them to the next page with Service Account Details
          if (rowsOnSecondPage > 0) {
            // Store remaining data for next page
            const remainingUserData = userTableData.slice(rowsOnFirstPage);

            // Add remaining User Account rows first
            currentY += 20; // Add some spacing
            currentY = renderSubsectionHeader(
              'User Account Details (Continued)',
            );
            currentY = renderTable(
              userHeaders,
              remainingUserData,
              userColumnWidths,
            );

            // Add page break after continued User Account Details
            pdf.addPage();
            currentY = margin;

            // 5. SERVICE ACCOUNT DETAILS
            renderServiceAccountDetails();
          } else {
            // No remaining rows, just render Service Account Details normally
            renderServiceAccountDetails();
          }
        } else {
          // 33 rows or less - render normally without continuation logic
          currentY -= 15; // Move table closer to title
          currentY = renderTable(userHeaders, userTableData, userColumnWidths);

          // 5. SERVICE ACCOUNT DETAILS
          renderServiceAccountDetails();
        }
      } else {
        currentY = renderText('No user account data available', 12);

        // 5. SERVICE ACCOUNT DETAILS
        renderServiceAccountDetails();
      }

      currentY += 40; // Add 2 blank lines after service account table

      // 6. DOCUMENTS & EVIDENCE
      currentY = renderSectionHeader('Documents & Evidence');

      if (documentationEvidence) {
        currentY = renderSubsectionHeader('Current Summary & Approval');
        currentY = renderText(documentationEvidence, 12, 20);
      } else {
        currentY = renderText('No documentation evidence provided', 12);
      }

      currentY += 20;

      // 7. AUDITOR NOTES
      currentY = renderSectionHeader('Auditor Notes');

      if (auditorNotes) {
        currentY = renderText(auditorNotes, 12, 20);
      } else {
        currentY = renderText('No auditor notes provided', 12);
      }

      currentY += 20;

      // Add page break before Activity Stream
      pdf.addPage();
      currentY = margin;

      // 8. ACTIVITY STREAM DATA
      currentY = renderSectionHeader('Activity Stream & Audit Trail');

      // Fetch activity stream data for the PDF
      let activityStreamData = null;
      try {
        const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
        const response = await fetchApi.fetch(
          `${baseUrl}/activity-stream/export?app_name=${encodeURIComponent(
            data.app_name,
          )}&frequency=${encodeURIComponent(
            data.frequency,
          )}&period=${encodeURIComponent(data.period)}`,
        );

        if (response.ok) {
          activityStreamData = await response.json();
        }
      } catch (streamError) {
        // Failed to fetch activity stream data
      }

      if (activityStreamData && activityStreamData.length > 0) {
        currentY = renderSubsectionHeader('Recent Audit Activities');

        // Show all activities (no limit)
        const allActivities = activityStreamData.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.performed_at || 0);
          const dateB = new Date(b.created_at || b.performed_at || 0);
          return dateB.getTime() - dateA.getTime();
        });

        // Helper function to format event message
        const formatEventMessage = (
          activity: any,
          eventType: string,
          actor: string,
        ) => {
          switch (eventType) {
            case 'AUDIT_INITIATED':
              return `[${
                activity.period
              }], ${activity.frequency?.toUpperCase()} : Audit initiated for ${
                activity.app_name
              } by ${actor}`;
            case 'AUDIT_COMPLETED':
              return `[${
                activity.period
              }], ${activity.frequency?.toUpperCase()} : Audit completed for ${
                activity.app_name
              } by ${actor}`;
            case 'ACCESS_APPROVED':
              return `Access approved for ${activity.user_id || 'user'} for ${
                activity.app_name
              } by ${actor}`;
            case 'ACCESS_REVOKED':
              return `Access revoked for ${activity.user_id || 'user'} for ${
                activity.app_name
              } by ${actor}`;
            case 'AUDIT_FINAL_SIGNOFF_COMPLETED':
              return `[${
                activity.period
              }], ${activity.frequency?.toUpperCase()} : Audit final sign-off for ${
                activity.app_name
              } by ${actor}`;
            default:
              return `${eventType.replace(/_/g, ' ').toLowerCase()} for ${
                activity.app_name
              } by ${actor}`;
          }
        };

        // Render activities as a chronological list (like the actual component)
        allActivities.forEach((activity: any, index: number) => {
          const eventType =
            activity.event_type || activity.event_name || 'Unknown';
          const timestamp = new Date(
            activity.created_at || activity.performed_at || new Date(),
          );
          const actor = activity.performed_by || 'System';

          // Format timestamp like the actual component
          const timeStr = timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
          const dateStr = timestamp.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          });

          // Format event message like the actual component
          let message = formatEventMessage(activity, eventType, actor);

          // Add metadata if available (like Jira key)
          if (activity.metadata?.jira_key) {
            message += ` (Jira: ${activity.metadata.jira_key})`;
          }

          // Check if we need a new page
          if (currentY + 60 > pageHeight - margin) {
            pdf.addPage();
            currentY = margin;
          }

          // Render date on first line
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(52, 73, 94);
          pdf.text(dateStr, margin + 10, currentY);

          // Render activity message (wrapped if long)
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(44, 62, 80);
          const messageWidth = contentWidth - 120; // Leave space for date
          const wrappedMessage = pdf.splitTextToSize(message, messageWidth);
          pdf.text(wrappedMessage, margin + 120, currentY);

          // Calculate height needed for wrapped message
          const messageHeight = wrappedMessage.length * 12;
          currentY += Math.max(messageHeight, 15);

          // Render time on second line
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(100, 100, 100);
          pdf.text(timeStr, margin + 10, currentY);
          currentY += 10; // Reduced spacing above the line

          // Add grey line between activities (except for last one)
          if (index < allActivities.length - 1) {
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, currentY, margin + contentWidth, currentY);
            currentY += 20; // Equal spacing after the line
          }
        });
      } else {
        currentY = renderText('No activity stream data available', 12);
      }

      // Save the PDF
      pdf.save(
        `${data.frequency}-${data.app_name}-${data.period}-audit-report.pdf`,
      );

      onSuccess();
    } catch (pdfError) {
      // eslint-disable-next-line no-console
      console.error('Error generating PDF:', pdfError);
      onError('Failed to generate PDF. Please try again.');
    }
  };

  return { generateComprehensivePDF };
};
