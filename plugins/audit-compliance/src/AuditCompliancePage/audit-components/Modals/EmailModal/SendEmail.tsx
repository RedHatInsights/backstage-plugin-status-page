import {
  alertApiRef,
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Box, Divider, Typography } from '@material-ui/core';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { EmailProps, EmailRef, UserAccessData, UserEntity } from './types';

export const Email = forwardRef<EmailRef, EmailProps>(
  (
    {
      selectedRows,
      currentUser,
      appName,
      auditPeriod,
      frequency,
      onEmailSendSuccess,
      onClose,
    },
    ref,
  ) => {
    const [emailSections, setEmailSections] = useState<
      {
        manager: string;
        body: string;
        users: UserAccessData[];
        recipientEmail: string;
      }[]
    >([]);
    const discoveryApi = useApi(discoveryApiRef);
    const fetchApi = useApi(fetchApiRef);
    const alertApi = useApi(alertApiRef);
    const catalogApi = useApi(catalogApiRef);
    const configApi = useApi(configApiRef);
    const [displayName, setDisplayName] = useState<string>('');
    const [backstageUrl, setBackstageUrl] = useState<string>('');

    useEffect(() => {
      const url = configApi.getString('app.baseUrl');
      setBackstageUrl(url);
    }, [configApi]);

    useEffect(() => {
      const fetchDisplayName = async () => {
        try {
          const entity = (await catalogApi.getEntityByRef(
            currentUser,
          )) as UserEntity;
          if (entity?.spec?.profile?.displayName) {
            setDisplayName(entity.spec.profile.displayName);
          } else {
            setDisplayName(currentUser.split('/')[1]);
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to fetch entity:', err);
          setDisplayName(currentUser.split('/')[1]);
        }
      };
      fetchDisplayName();
    }, [catalogApi, currentUser]);

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
          // Try to get manager_uid from the first user in the group
          const manager_uid = users[0].manager_uid;
          // Fallback: try to get app_owner_email from the first user in the group (if available)
          const app_owner_email = users[0].app_owner_email;
          let recipientEmail = '';
          if (manager_uid) {
            recipientEmail = `${manager_uid}@redhat.com`;
          } else if (app_owner_email) {
            recipientEmail = app_owner_email;
          } else {
            recipientEmail = manager; // fallback to manager name (legacy)
          }

          const userRows = users
            .map(
              user => `
        <tr>
          <td>${
            user.full_name ||
            user.user_id ||
            (user as any)?.service_account ||
            ''
          }</td>
          <td>${user.environment}</td>
          <td>${user.user_role}</td>
        </tr>
      `,
            )
            .join('');

          const body = `
  <p>Hi ${manager},</p>
  <p>
    You are requested to review the access of the user(s) listed below for the 
    <strong>${appName}</strong> application as part of the <strong>${frequency} ${auditPeriod}</strong> access review.
  </p>
  <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
    <thead>
      <tr>
        <th>User</th>
        <th>Environment</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      ${userRows}
    </tbody>
  </table>
  <p>Please click the link below to complete your review:</p>
  <p>
    <a href="${backstageUrl}/audit-compliance/${appName}/${frequency}/${auditPeriod}/details" target="_blank" rel="noopener noreferrer">
      Open Audit & Compliance Plugin
    </a>
  </p>
  <p>Best regards,<br/>${displayName}</p>
`;
          return { manager, body, users, recipientEmail };
        },
      );

      setEmailSections(emails);
    }, [
      selectedRows,
      appName,
      auditPeriod,
      frequency,
      displayName,
      backstageUrl,
    ]);

    useImperativeHandle(ref, () => ({
      sendEmails: async () => {
        try {
          for (const section of emailSections) {
            if (!section.recipientEmail.includes('@')) {
              alertApi.post({
                message: `No valid recipient email found for manager: ${section.manager}`,
                severity: 'error',
              });
              continue; // Skip sending this email
            }
            const emailData = {
              to: section.recipientEmail,
              subject: ` Access Review - ${appName} - ${auditPeriod} for ${section.manager}`,
              html: section.body,
              replyTo: section.recipientEmail,
            };
            const baseUrl = await discoveryApi.getBaseUrl('audit-compliance');
            const response = await fetchApi.fetch(`${baseUrl}/send-email`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(emailData),
            });
            if (!response.ok) {
              throw new Error('Failed to send email');
            }
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
