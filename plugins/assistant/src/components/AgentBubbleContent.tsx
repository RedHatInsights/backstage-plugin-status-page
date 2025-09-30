import { CodeSnippet, MarkdownContent } from '@backstage/core-components';
import { featureFlagsApiRef, useApi } from '@backstage/core-plugin-api';
import { Box, makeStyles } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMoreRounded';
import { AssistantMessage, ToolMessage } from '../types';
import { humanizeToolName } from '../utils/humanizeToolName';
import {
  ToolAccordion,
  ToolAccordionDetails,
  ToolAccordionSummary,
} from './ToolAccordion';

const useStyles = makeStyles(theme => ({
  outputBox: {
    borderRadius: theme.shape.borderRadius * 4,
    overflow: 'hidden',
  },
}));

export interface AgentBubbleContentProps {
  message: AssistantMessage | ToolMessage;
}

export const AgentBubbleContent = ({ message }: AgentBubbleContentProps) => {
  const classes = useStyles();
  const featureFlags = useApi(featureFlagsApiRef);

  if (message.role !== 'assistant' && message.role !== 'tool') return null;

  if (message.role === 'assistant') {
    return message.content.map(content => {
      if (content.type === 'text') {
        return (
          <Typography variant="body1" color="textPrimary">
            <MarkdownContent
              content={content.text!.trim()}
              dialect="common-mark"
            />
          </Typography>
        );
      } else if (
        content.type === 'tool-call' &&
        featureFlags.isActive('compass-assistant-debug-mode')
      ) {
        return (
          <ToolAccordion
            key={content.toolCallId}
            TransitionProps={{ unmountOnExit: true }}
            variant="outlined"
            className={classes.outputBox}
          >
            <ToolAccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2">Running</Typography>
              <Box ml={1} fontWeight={500}>
                <Typography
                  variant="inherit"
                  color="textSecondary"
                  component="code"
                >
                  {humanizeToolName(content.toolName)}
                </Typography>
              </Box>
            </ToolAccordionSummary>
            <ToolAccordionDetails>
              <Box width="100%">
                <Typography variant="h6">With arguments:</Typography>
                <CodeSnippet
                  text={JSON.stringify(content.input, null, 2)}
                  language="json"
                  showCopyCodeButton
                />
              </Box>
            </ToolAccordionDetails>
          </ToolAccordion>
        );
      }
      return null;
    });
  }

  if (
    message.role === 'tool' &&
    featureFlags.isActive('compass-assistant-debug-mode')
  ) {
    return message.content?.map(content => (
      <ToolAccordion
        key={content.toolCallId}
        TransitionProps={{ unmountOnExit: true }}
        variant="outlined"
        className={classes.outputBox}
      >
        <ToolAccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2">Ran</Typography>
          <Box ml={1} fontWeight={500}>
            <Typography
              variant="inherit"
              color="textSecondary"
              component="code"
            >
              {humanizeToolName(content.toolName)}
            </Typography>
          </Box>
        </ToolAccordionSummary>
        <ToolAccordionDetails>
          <Box width="100%">
            <Typography variant="h6">Output:</Typography>
            <CodeSnippet
              text={JSON.stringify(content.output.value, null, 2)}
              language="json"
              showCopyCodeButton
            />
          </Box>
        </ToolAccordionDetails>
      </ToolAccordion>
    ));
  }

  return null;
};
