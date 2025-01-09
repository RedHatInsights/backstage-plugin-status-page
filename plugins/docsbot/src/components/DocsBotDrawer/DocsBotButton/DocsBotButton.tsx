import { IconButton } from '@material-ui/core';
import React, { useState } from 'react';
import { DocsBotDrawer } from '../DocsBotDrawer';
import { DocsBotIcon } from '../../../plugin';
import { useAnalytics } from '@backstage/core-plugin-api';

type Props = {
  handleDrawerOpen: (flag: boolean) => void;
};
export const DocsBotButton = ({ handleDrawerOpen }: Props) => {
  const [isDocsBotPanelOpen, setIsDocsBotPanelOpen] = useState(false);
  const analytics = useAnalytics();
  const toggleDrawer = (): void => {
    setIsDocsBotPanelOpen(!isDocsBotPanelOpen);
    handleDrawerOpen(!isDocsBotPanelOpen);
    analytics.captureEvent(
      'click',
      `Docsbot panel ${!isDocsBotPanelOpen ? 'opened' : 'closed'}`,
    );
  };
  return (
    <>
      <IconButton onClick={toggleDrawer}>
        <DocsBotIcon />
      </IconButton>
      <DocsBotDrawer isOpen={isDocsBotPanelOpen} toggleDrawer={toggleDrawer} />
    </>
  );
};
