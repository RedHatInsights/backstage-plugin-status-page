import React from 'react';
import { NotificationsAnalytics } from './NotificationsAnalytics';
import { AttachmentsAnalytics } from './AttachmentsAnalytics';

export const AnalyticalDashboard = () => {
  return (
    <>
      <NotificationsAnalytics />
      <AttachmentsAnalytics/>
    </>
  );
};
