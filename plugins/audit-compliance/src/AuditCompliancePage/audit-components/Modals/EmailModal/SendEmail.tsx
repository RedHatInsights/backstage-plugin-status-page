import {
  alertApiRef,
  configApiRef,
  discoveryApiRef,
  fetchApiRef,
  useApi,
} from '@backstage/core-plugin-api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';
import { Box, Divider, Typography } from '@material-ui/core';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
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
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <title>Red Hat Mail</title>
              </head>
              <body style="margin:0; padding:0; font-family:Arial, sans-serif; background-color:#ffffff;">
                <!-- Header with background image and button -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#000000;">
                  <tr>
                    <td align="center">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0"
                        style="background-image: url('https://ci3.googleusercontent.com/meips/ADKq_NZxYt6HwBrhpEd1DXOcWtdVGJV5kcLH2pXVUfiZtMOals1vK1j1VW4rr9a28rMKuHiCAQYSRnNEMaZwtGUP-91zyb7nXCVQcrVodPHewe6Lo1S0M1aO2k9DxayVBkdE7OukG6ffhmmxTkX86R7HrwHVtlM-fEDObpIlBpPVsrNAuo6gnSsDkqbn9sJRd4bRUl9PrQxW0AT6c7rqu-xVKjRjidwUQbWf6AON2U_nIHiRRifXbUlTq4eNaCmqxZH-iD9gmiq6OKK_Uw=s0-d-e1-ft#https://wd5.myworkdaycdn.com/wday/image/redhat/292d280c-71cc-4f8c-b763-e3e546a6bcff?__token__=exp=1845366800~hmac=5676B44AEE7D641429F58BF8BC241D2C48ADDD4F246C1C1CF99F5A63DE51E758'); background-size: contain; background-position: center; height: 120px; text-align: center; background-repeat: no-repeat;">
                        <tr>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Body content -->
                <table width="100%" cellspacing="0" border="0">
                  <tr>
                    <td align="center">
                      <table width="600" cellspacing="0" border="0">
                        <tr>
                          <td style="font-size: 16px; color: #333333; font-family: Red Hat Display">
                            <p>Hi ${manager},</p>
                            <p>
                              You are requested to review the access of the user(s) listed below for the 
                              <strong>${appName}</strong> application as part of the 
                              <strong>${frequency} ${auditPeriod}</strong> access review.
                            </p>
                            <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%;">
                              <thead style="background-color: #f4f4f4;">
                                <tr>
                                  <th style="text-align: left;">User</th>
                                  <th style="text-align: left;">Environment</th>
                                  <th style="text-align: left;">Role</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${userRows}
                              </tbody>
                            </table>
                            <p>Please click the button below to complete your review:</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="vertical-align: middle; text-align: center; font-family: Red Hat Display; padding-top: 10px;">
                            <a href="${backstageUrl}/audit-access-manager/${appName}/${frequency}/${auditPeriod}/details"
                              style="background-color: #CC0000; color: #FFFFFF; padding: 12px 24px; text-decoration: none; font-family: Red Hat Display; border-radius: 5px; display: inline-block;"
                              target="_blank" rel="noopener noreferrer">
                              Open Audit Access Manager
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td style="font-size: 16px; color: #333333; font-family: Red Hat Display; padding-top: 20px;">
                            <p>Best regards,</p>
                            <p>${displayName}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <!-- Footer -->
                <table width="100%" cellpadding="20" cellspacing="0" border="0" style="background-color:#f4f4f4; margin-top:10px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td style="text-align:center; font-size: 12px; color: #888888;">
                            © 2025 Red Hat, Inc. All rights reserved. <br />
                            This is an automated message. Please do not reply.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
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
