import { Content, Header, HeaderLabel, Page } from '@backstage/core-components';
import { Box, Button, Grid } from '@material-ui/core';
import { useState } from 'react';
import { RegistryComponent } from '../registry';
import MCPServerForm from './MCPServerForm';

export const MCPServer = () => {
  const [formOpen, setFormOpen] = useState(false);

  const handleOpenForm = () => {
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
  };

  return (
    <Page themeId="tool">
      <Header title="MCP Server Plugin" subtitle="AppDev X MCP Server Registry">
        <HeaderLabel label="Owner" value="AppDev" />
        <HeaderLabel label="Lifecycle" value="Alpha" />
      </Header>
      <Content>
        <MCPServerForm open={formOpen} onClose={handleCloseForm} />
        <Grid container spacing={3} direction="column">
          <Grid item>
            <Box pl={2} mb={1}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenForm}
              >
                Register MCP Server
              </Button>
            </Box>
          </Grid>
          <Grid item>
            <RegistryComponent />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
