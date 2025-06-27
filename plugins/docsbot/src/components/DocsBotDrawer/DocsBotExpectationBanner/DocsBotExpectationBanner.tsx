import {
  Backdrop,
  Box,
  Fade,
  IconButton,
  Modal,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import useStyles from './DocsBotExpectationBanner.styles';
import CacheToggle from '../../../utils/cache_toggle.png';

interface DocsBotExpectationBannerProps {
  open: boolean;
  onClose: () => void;
}

const DocsBotExpectationBanner: React.FC<DocsBotExpectationBannerProps> = ({
  open,
  onClose,
}) => {
  const classes = useStyles();
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={open}>
        <Box className={classes.modalContent}>
          <div className={classes.header}>
            <Typography variant="h6" className={classes.modalTitle}>
              Understanding DocsBot's Capabilities
            </Typography>
            <IconButton onClick={onClose} className={classes.closeButton}>
              <CloseIcon />
            </IconButton>
          </div>
          <div
            style={{
              display: 'block',
              borderLeft: '3px solid #1F5493',
              padding: '10px',
            }}
          >
            <p>
              <strong>
                <em>Welcome to our DocsBot!</em>
              </strong>
              <br />
              While we strive to provide a seamless and efficient experience,
              there are some limitations you should be aware of:
            </p>
            <ul>
              <li>
                <b>We operate on a standard CPU</b> rather than high-end
                servers, which may result in slower processing times during peak
                usage.
              </li>
              <li>
                <b>We've adjusted multiple parameters</b> to balance accuracy
                and speed. Please bear with us if responses are occasionally
                less precise or slower than expected.
              </li>
              <li>
                <b>Our system supports up to three simultaneous users</b>.
                Additional users will be placed in a queue, which may lead to
                slight delays.
              </li>
              <li>
                <b>Response times may vary</b>, especially during high demand.
                We appreciate your patience during these moments.
              </li>
              <li>
                <b>There's a character limit on responses</b>, so extended
                answers may be truncated. If necessary, consider rephrasing your
                question for a more concise response.
              </li>
              <li>
                <b>We employ a caching system</b> to improve speed. However,
                please note that cached responses may not always reflect the
                most up-to-date information.
              </li>
              You can adjust this by <b>disabling caching </b>if you prefer to
              receive non-cached responses.
              <br />
              <img
                src={CacheToggle}
                alt="icon"
                height="300vh"
                style={{ display: 'block', margin: '20px auto' }}
              />
            </ul>
            <p>
              We are committed to enhancing your experience with DocsBot. While
              there may be occasional limitations, we are constantly working to
              improve our service. Thank you for your understanding and
              cooperation.
            </p>
            <p>
              <strong>Tip:</strong> If a cached answer seems outdated or
              irrelevant, please consider downvoting it or rephrasing your
              query. Your feedback helps us to improve!
            </p>
          </div>
        </Box>
      </Fade>
    </Modal>
  );
};

export default DocsBotExpectationBanner;
