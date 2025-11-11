import { withStyles } from '@material-ui/core/styles';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';

export const ToolAccordion = withStyles(theme => ({
  root: {
    border: '1px solid rgba(0, 0, 0, .125)',
    marginTop: theme.spacing(0.5),
    boxShadow: 'none',
    '&:not(:last-child)': {
      borderBottom: 0,
    },
    '&:before': {
      display: 'none',
    },
    '&$expanded': {
      margin: 'auto',
    },
  },
  expanded: {},
}))(MuiAccordion);

export const ToolAccordionSummary = withStyles({
  root: {
    backgroundColor: 'rgba(0, 0, 0, .03)',
    borderBottom: '1px solid rgba(0, 0, 0, .125)',
    marginBottom: -1,
    height: 12,
    '&$expanded': {
      minHeight: 56,
    },
  },
  expanded: {},
})(MuiAccordionSummary);

export const ToolAccordionDetails = withStyles(theme => ({
  root: {
    backgroundColor: 'rgba(0, 0, 0, .03)',
    padding: theme.spacing(2),
  },
}))(MuiAccordionDetails);
