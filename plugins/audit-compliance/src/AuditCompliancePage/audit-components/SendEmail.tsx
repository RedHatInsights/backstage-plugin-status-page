import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import axios from 'axios';
import { useApi, alertApiRef } from '@backstage/core-plugin-api';

interface UserAccessData {
  id: number;
  environment: string;
  full_name: string;
  user_id: string;
  user_role: string;
  manager: string;
  signed_off: string;
  sign_off_done_by: string | null;
  date_of_sign_off: string | null;
  git_rover_both: string;
  comments: string | null;
  ticket_id: string | null;
  date_of_access_revoked_added: string | null;
  ticket_status: string | null;
}

export interface EmailRef {
  sendEmails: () => void;
}

interface EmailProps {
  selectedRows: UserAccessData[];
  currentUser: string;
  appName: string;
  auditPeriod: string;
  onEmailSendSuccess: () => void;
  onClose: () => void;
}

export const Email = forwardRef<EmailRef, EmailProps>(
  (
    {
      selectedRows,
      currentUser,
      appName,
      auditPeriod,
      onEmailSendSuccess,
      onClose,
    },
    ref,
  ) => {
    const [emailSections, setEmailSections] = useState<
      { manager: string; body: string; users: UserAccessData[] }[]
    >([]);

    const alertApi = useApi(alertApiRef);

    useEffect(() => {
      const groupedByManager: Record<string, UserAccessData[]> = {};
      selectedRows.forEach(row => {
        if (!groupedByManager[row.manager]) {
          groupedByManager[row.manager] = [];
        }
        groupedByManager[row.manager].push(row);
      });

      const emails = Object.entries(groupedByManager).map(
        ([manager, users]) => {
          const firstUser = users[0];
          const body = `Hi ${manager},\n\nYou are requested to review the access for the following user: <strong>${firstUser.full_name}</strong> for <strong>${appName}</strong> app for <strong>${auditPeriod}</strong> review.`;
          return { manager, body, users };
        },
      );

      setEmailSections(emails);
    }, [selectedRows, appName, auditPeriod, currentUser]);

    useImperativeHandle(ref, () => ({
      sendEmails: async () => {
        try {
          for (const section of emailSections) {
            const emailData = {
              to: section.manager,
              subject: `Access Review - ${appName} - ${auditPeriod}`,
              body: section.body,
            };
            await axios.post('/api/send-email', emailData);
          }

          onEmailSendSuccess();
          onClose();
          alertApi.post({
            message: 'Emails sent successfully',
            severity: 'success',
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error sending email:', error);
          onClose();
          alertApi.post({
            message: 'Failed to send emails. Please try again.',
            severity: 'error',
          });
        }
      },
    }));

    return (
      <Box p={2}>
        {emailSections.map((section, index) => (
          <Box key={index} mb={6}>
            <Typography
              variant="body1"
              gutterBottom
              style={{ whiteSpace: 'pre-line' }}
              dangerouslySetInnerHTML={{ __html: section.body }}
            />

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Environment</TableCell>
                  <TableCell>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {section.users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>{user.environment}</TableCell>
                    <TableCell>{user.user_role}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box mt={2}>
              <Typography paragraph>
                Click the link below to complete the review:
              </Typography>
              <Typography paragraph>
                <a
                  href="/audit-compliance/hydra/details"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Audit & Compliance Plugin
                </a>
              </Typography>
              <Typography>
                Regards,
                <br />
                {currentUser}
              </Typography>
            </Box>

            {index < emailSections.length - 1 && (
              <Divider style={{ marginTop: 24 }} />
            )}
          </Box>
        ))}
      </Box>
    );
  },
);

export default Email;
