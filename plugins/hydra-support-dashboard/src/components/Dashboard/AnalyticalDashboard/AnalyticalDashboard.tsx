import React from 'react';
import { NotificationsAnalytics } from './NotificationsAnalytics';
import { AttachmentsAnalytics } from './AttachmentsAnalytics';
import { CaseBotAnalytics } from './CaseBotAnalytics';
import { RestAnalytics } from './RestAnalytics';
import { SearchAnalytics } from './SearchAnalytics';

export const AnalyticalDashboard = () => {
  return (
    <>
      <RestAnalytics />
      <SearchAnalytics />
      <NotificationsAnalytics />
      <AttachmentsAnalytics />
      <CaseBotAnalytics />
    </>
  );
};
