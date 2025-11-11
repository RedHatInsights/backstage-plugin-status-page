import { CodeSnippet } from '@backstage/core-components';
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
import markdownIt from 'markdown-it';
import mdc from 'markdown-it-container';

const md = markdownIt({
  breaks: false,
  linkify: true,
  xhtmlOut: true,
});
md.use(mdc, 'thought', {
  validate: function (params: any) {
    return params.trim().match(/^thought\s+(.*)$/);
  },
  marker: ':',
  render: function (tokens: any, idx: any) {
    const m = tokens[idx].info.trim().match(/^thought\s+(.*)$/);

    if (tokens[idx].nesting === 1) {
      return `<details><summary>${md.utils.escapeHtml(m[1])}</summary>\n`;
    }
    return '</details>\n';
  }
});

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
        const text = content.text!.replace('\n\n', '\n').replaceAll('<think>', '::: thought Thinking...').replaceAll('</think>', ':::').trim();
        return (
          <Typography variant="body1" color="textPrimary">
            <div dangerouslySetInnerHTML={{ __html: md.render(text) }} />
          </Typography>
        );
      } else if (
        content.type === 'tool-call' &&
        featureFlags.isActive('compass-assistant-debug-mode')
      ) {
        return (
          <ToolAccordion
            key={content.toolCallId}
            TransitionProps={{ unmountOnExit: true, }}
            variant="outlined"
            square
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
        square
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
