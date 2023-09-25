import React from 'react';
import { Page, Content, Header } from '@backstage/core-components';
import { Grid } from '@material-ui/core';
import { FeedbackTable } from '../FeedbackTable';
import { FeedbackDetailsModal } from '../FeedbackDetailsModal';

export const GlobalFeedbackPage = () => {
  return (
    <Page themeId="tool">
      <Header title="Feedbacks" subtitle="on Red Hat Experience Platform" />
      <Content>
        <FeedbackDetailsModal />
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FeedbackTable />
          </Grid>
        </Grid>
      </Content>
    </Page>
  );
};
