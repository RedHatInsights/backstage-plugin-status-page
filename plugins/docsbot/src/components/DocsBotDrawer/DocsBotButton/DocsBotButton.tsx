import { IconButton } from '@material-ui/core';
import React, { useState } from 'react';
import { DocsBotDrawer } from '../DocsBotDrawer';
import { DocsBotIcon } from '../../../plugin';

type Props = {
  handleDrawerOpen: (flag: boolean) => void;
};
export const DocsBotButton = ({ handleDrawerOpen }: Props) => {
  const [isDocsBotPanelOpen, setIsDocsBotPanelOpen] = useState(false);

  const toggleDrawer = (): void => {
    setIsDocsBotPanelOpen(!isDocsBotPanelOpen);
    handleDrawerOpen(!isDocsBotPanelOpen);
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
