import React from 'react';
import { Grid, Typography } from '@material-ui/core';

import {
  FormInputJiraProject,
  FormInputLeadName,
  FormInputName,
  FormInputPortfolio,
  FormInputTextField,
} from '../Inputs';

export const WorkstreamDetailsForm = () => {
  return (
    <Grid container>
      <Grid item xs={12}>
        <Typography variant="h3">Workstream Details</Typography>
      </Grid>
      <Grid item xs={12}>
        <FormInputName />
      </Grid>
      <Grid item xs={12}>
        <FormInputTextField
          name="description"
          label="Description"
          placeholder="Enter some description"
          textFieldProps={{ multiline: true, rows: 5 }}
        />
      </Grid>
      <Grid item xs={12}>
        <FormInputLeadName />
      </Grid>
      <Grid item xs={12}>
        <FormInputTextField
          name="pillar"
          rules={{ required: 'Pillar name is required' }}
          label="Pillar name"
          placeholder="Enter Pillar name"
        />
      </Grid>
      <Grid item xs={12}>
        <FormInputJiraProject />
      </Grid>
      <Grid item xs={12}>
        <FormInputTextField
          name="email"
          rules={{
            validate: (val: string) => {
              if (val && !RegExp(/^\S+@\S+\.\S+$/).exec(val))
                return 'Email should be in format: your-name@company.com';
              return true;
            },
          }}
          label="Email"
          placeholder="Enter team email"
        />
      </Grid>
      <Grid item xs={12}>
        <FormInputTextField
          name="slackChannelUrl"
          label="Slack Link"
          rules={{
            validate: (val: string) => {
              if (
                val &&
                !RegExp(
                  /^https:\/\/([a-zA-Z0-9-.]+\.)?slack\.com\/archives\/[a-zA-Z0-9]+$/,
                ).exec(val)
              )
                return 'Slack link should be in format: https://**.slack.com/archives/CHANNEL_ID';
              return true;
            },
          }}
          placeholder="Enter link"
          textFieldProps={{
            helperText:
              'Provide a link to a public channel where the members of this workstream can be reached',
          }}
        />
      </Grid>
      <Grid item xs={12}>
        <FormInputPortfolio />
      </Grid>
    </Grid>
  );
};
