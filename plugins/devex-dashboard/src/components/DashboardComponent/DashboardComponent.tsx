import React from 'react';
import { AppDevDashboard } from '../AppDevDashboard/AppDevDashboard';
import { PulseDashboard } from '../PulseDashboard/PulseDashboard';
import { DataLayerDashboard } from '../DataLayerDashboard/DataLayerDashboard';

export const DashboardComponent = () => {

  return(
    <>
    <AppDevDashboard/>
    <PulseDashboard/>
    <DataLayerDashboard/>
    </>
  );
}
