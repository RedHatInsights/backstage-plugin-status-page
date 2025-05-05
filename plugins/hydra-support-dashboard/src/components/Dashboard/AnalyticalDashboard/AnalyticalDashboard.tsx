import React from 'react';
import { NotificationsAnalytics } from './NotificationsAnalytics';
import { AttachmentsAnalytics } from './AttachmentsAnalytics';
import { CaseBotAnalytics } from './CaseBotAnalytics';

export const AnalyticalDashboard = () => {
  return (
    <>
      <NotificationsAnalytics />
      <AttachmentsAnalytics />
      <CaseBotAnalytics />
    </>
  );
};
